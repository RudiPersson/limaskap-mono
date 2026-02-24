//  import { neon } from "@neondatabase/serverless";
//  import { drizzle } from "drizzle-orm/neon-http";
import { drizzle } from 'drizzle-orm/node-postgres';

import env from "../env";
import * as authSchema from "./schema/auth-schema";
import * as enrollmentSchema from "./schema/enrollment";
import * as memberRecordSchema from "./schema/member-record";
import * as organizationSchema from "./schema/organization";
import * as paymentSchema from "./schema/payment";
import * as programsSchema from "./schema/program";

//  const sql = neon(env.DATABASE_URL!);



// Merge all table schemas that should be available for typed queries
export const schema = {
  ...authSchema,
  ...enrollmentSchema,
  ...memberRecordSchema,
  ...organizationSchema,
  ...paymentSchema,
  ...programsSchema,
};



export const db = drizzle(env.DATABASE_URL!, { schema });



// export const db = drizzle({ client: sql, schema });
