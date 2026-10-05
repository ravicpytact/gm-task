import { z } from "zod";
import type { Frequency, Weekday } from "./types";

// Mirrors the backend's validation (docs/04-design/assignments/api_spec.md); the backend decides.
// Dates are "YYYY-MM-DD" strings, so they compare correctly as text. `today` is passed in, so the
// rule uses the IST day the backend uses.

const frequency = z.enum(
  [
    "DAILY",
    "WEEKLY",
    "EVERY_15_DAYS",
    "MONTHLY",
    "QUARTERLY",
    "SIX_MONTHS",
    "YEARLY",
  ] as const satisfies readonly Frequency[],
  { error: "Choose a frequency" },
);
const weekdays = z.array(
  z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const satisfies readonly Weekday[]),
);

type Schedule = { frequency?: Frequency | undefined; weekdays: Weekday[]; start_date: string };

function scheduleRules(today: string) {
  return (v: Schedule, ctx: z.RefinementCtx) => {
    if (!v.frequency) {
      ctx.addIssue({ code: "custom", path: ["frequency"], message: "Choose a frequency" });
    } else if (v.frequency === "WEEKLY" && v.weekdays.length === 0) {
      ctx.addIssue({ code: "custom", path: ["weekdays"], message: "Choose at least one day" });
    }
    if (!v.start_date) {
      ctx.addIssue({ code: "custom", path: ["start_date"], message: "Choose a start date" });
    } else if (v.start_date < today) {
      ctx.addIssue({ code: "custom", path: ["start_date"], message: "Today or later" });
    }
  };
}

export const assignSchema = (today: string) =>
  z
    .object({
      task_id: z.string().min(1, "Choose a task"),
      all_users: z.boolean(),
      user_ids: z.array(z.string()),
      // Optional here and required by the rules below: Zod skips the rules while a field has the
      // wrong type, and the form should show every missing choice at once.
      frequency: frequency.optional(),
      weekdays,
      start_date: z.string(),
      end_date: z.string(),
    })
    .superRefine((v, ctx) => {
      scheduleRules(today)(v, ctx);
      if (!v.all_users && v.user_ids.length === 0) {
        ctx.addIssue({ code: "custom", path: ["user_ids"], message: "Choose at least one user" });
      }
      if (v.end_date && v.start_date && v.end_date < v.start_date) {
        ctx.addIssue({ code: "custom", path: ["end_date"], message: "On or after the start date" });
      }
    });
export type AssignValues = z.infer<ReturnType<typeof assignSchema>>;

export const frequencySchema = (today: string) =>
  z.object({ frequency, weekdays, start_date: z.string() }).superRefine(scheduleRules(today));
export type FrequencyValues = z.infer<ReturnType<typeof frequencySchema>>;

export const endDateSchema = (today: string, startDate: string) =>
  z.object({ no_end_date: z.boolean(), end_date: z.string() }).superRefine((v, ctx) => {
    if (v.no_end_date) return;
    if (!v.end_date) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "Choose a date, or No end date",
      });
    } else if (v.end_date < today) {
      ctx.addIssue({ code: "custom", path: ["end_date"], message: "Today or later" });
    } else if (v.end_date < startDate) {
      ctx.addIssue({ code: "custom", path: ["end_date"], message: "On or after the start date" });
    }
  });
export type EndDateValues = z.infer<ReturnType<typeof endDateSchema>>;

export const copySchema = z
  .object({
    source_user_id: z.string().min(1, "Choose whose assignments to copy"),
    target_user_ids: z.array(z.string()).min(1, "Choose at least one user"),
  })
  .refine((v) => !v.target_user_ids.includes(v.source_user_id), {
    path: ["target_user_ids"],
    message: "Can't copy to the same user",
  });
export type CopyValues = z.infer<typeof copySchema>;

// --- Answering a Todo (contract §3) ----------------------------------------------------------

/** A Time answer: "06:30", stored 24-hour. */
export const timeAnswerSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid time.");

/** A Number answer through Other: a whole number of 5 or more (the backend's limit is 999999999). */
export const otherAnswerSchema = z
  .string()
  .trim()
  .regex(/^\d{1,9}$/, "Enter a whole number of 5 or more.")
  .refine((v) => Number(v) >= 5, "Enter a whole number of 5 or more.");
