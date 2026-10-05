import { z } from "zod";
import { DESCRIPTION_MAX, NAME_MAX } from "./constants";
import type { TaskType } from "./types";

// Mirrors the backend's validation (docs/04-design/activities/api_spec.md); the backend decides.

const name = z
  .string()
  .trim()
  .min(1, "Enter a name")
  .max(NAME_MAX, `At most ${NAME_MAX} characters`);
const description = z.string().max(DESCRIPTION_MAX, `At most ${DESCRIPTION_MAX} characters`);

export const createTaskSchema = z.object({
  name,
  description,
  // Checked against the contract: a type the backend adds or drops fails the type check here.
  type: z.enum(["TIME", "YES_NO", "FOOD", "NUMBER"] as const satisfies readonly TaskType[], {
    error: "Choose how users will answer",
  }),
});
export type CreateTaskValues = z.infer<typeof createTaskSchema>;

/** The type never changes after creation (ACT-R3), so Edit has only name and description. */
export const editTaskSchema = z.object({ name, description });
export type EditTaskValues = z.infer<typeof editTaskSchema>;
