import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import * as schema from "@/lib/server/db/schema/auth-schema";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
  advanced: {
    crossSubDomainCookies: {
      enabled: env.NODE_ENV === "production",
      domain: `.${env.APP_BASE_DOMAIN}`,
    },
  },
  trustedOrigins: [
    `https://*.${env.APP_BASE_DOMAIN}`,
    `https://${env.APP_BASE_DOMAIN}`,
    ...(env.NODE_ENV === "development"
      ? ["http://localhost:*", "http://*.localhost:*"]
      : []),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
});
