import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "../db/index";
import * as schema from "../db/schema/auth-schema"
import env from "../env";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: env.NODE_ENV === "production",
      domain: ".limaskap.fo", // your domain
    },
  },
  trustedOrigins: [
    "https://*.limaskap.fo", // Trust all HTTPS subdomains for multi-tenant support
    "https://limaskap.fo",

    ...(env.NODE_ENV === "development" ? [
      "http://localhost:*", // Trust all localhost ports in development
      "http://*.localhost:*", // Trust all localhost subdomains and ports in development
    ] : []),
  ],

  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite",
    schema,
  }),
});
