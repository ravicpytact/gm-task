import { z } from "zod";

/**
 * Public configuration: inlined into the browser bundle at build time (FE-BOUND-003).
 * Each variable is read by its literal name, because Next.js inlines only literal reads.
 */
export const clientEnv = z
  .object({
    // Public because the UI shows an environment badge outside production.
    NEXT_PUBLIC_APP_ENV: z.enum(["local", "development", "staging", "production"]),
  })
  .parse({
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  });
