/* eslint-disable node/no-process-env */
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import path from "node:path";
import { z } from "zod";




expand(config({
  path: path.resolve(
    process.cwd(),
    process.env.NODE_ENV === "test" ? ".env.test" : ".env",
  ),
}));

const EnvSchema = z.object({
  // VERCEL_ENV: z
  //   .enum(["production", "preview", "development"])
  //   .default("development"),
    NODE_ENV: z.string().default("development"),
    PORT: z.coerce.number().default(9999),
  LOG_LEVEL: z.enum([
    "fatal",
    "error",
    "warn",
    "info",
    "debug",
    "trace",
    "silent",
  ]),
  DATABASE_URL: z.string().includes("://"),
  APP_BASE_DOMAIN: z.string().default("limaskap.fo"),
  API_BASE_URL: z.string().includes("://").default("https://api.limaskap.fo"),
  FRISBII_API_BASE: z.string().includes("://").default("https://checkout-api.frisbii.com"),
  LOGTAIL_SOURCE_TOKEN: z.string().optional(),
  LOGTAIL_INGEST_ENDPOINT: z.string().includes("://").optional(),
}).superRefine((val, ctx) => {
  if (val.NODE_ENV !== "development") {
    if (!val.LOGTAIL_SOURCE_TOKEN) {
      ctx.addIssue({
        code: "custom",
        path: ["LOGTAIL_SOURCE_TOKEN"],
        message: "LOGTAIL_SOURCE_TOKEN is required in non-development environments",
      });
    }
    if (!val.LOGTAIL_INGEST_ENDPOINT) {
      ctx.addIssue({
        code: "custom",
        path: ["LOGTAIL_INGEST_ENDPOINT"],
        message: "LOGTAIL_INGEST_ENDPOINT is required in non-development environments",
      });
    }
  }
});

export type env = z.infer<typeof EnvSchema>;

// eslint-disable-next-line ts/no-redeclare
const { data: env, error } = EnvSchema.safeParse(process.env);

if (error) {
  console.error("❌ Invalid env:");
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export default env!;
