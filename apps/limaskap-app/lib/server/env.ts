import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().includes("://").default("postgres://localhost:5432/postgres"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  APP_BASE_DOMAIN: z.string().default("limaskap.fo"),
  FRISBII_API_BASE: z.string().includes("://").default("https://checkout-api.frisbii.com"),
  LOGTAIL_SOURCE_TOKEN: z.string().optional(),
  LOGTAIL_INGEST_ENDPOINT: z.string().includes("://").optional(),
  LEGACY_API_BASE_URL: z.string().includes("://").optional(),
  BETTER_AUTH_SECRET: z.string().default("local-dev-better-auth-secret"),
  BETTER_AUTH_URL: z.string().includes("://").default("http://localhost:3000"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid env:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
