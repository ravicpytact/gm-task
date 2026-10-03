import "server-only";
import { z } from "zod";

/**
 * Server configuration, validated at startup with no defaults (FE-STRUCT-007).
 * Never imported by client code (FE-BOUND-002).
 */
export const serverEnv = z
  .object({
    API_BASE_URL: z.url(),
    APP_ORIGIN: z.url(),
    SESSION_COOKIE_SECURE: z.stringbool(),
    REFRESH_TOKEN_MAX_AGE_SECONDS: z.coerce.number().int().positive(),
  })
  .parse(process.env);
