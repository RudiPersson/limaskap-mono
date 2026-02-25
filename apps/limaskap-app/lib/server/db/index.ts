import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "@/lib/server/env";

import * as authSchema from "./schema/auth-schema";
import * as enrollmentSchema from "./schema/enrollment";
import * as memberRecordSchema from "./schema/member-record";
import * as organizationSchema from "./schema/organization";
import * as paymentSchema from "./schema/payment";
import * as programSchema from "./schema/program";

export const schema = {
  ...authSchema,
  ...enrollmentSchema,
  ...memberRecordSchema,
  ...organizationSchema,
  ...paymentSchema,
  ...programSchema,
};

export const db = drizzle(env.DATABASE_URL, { schema });
