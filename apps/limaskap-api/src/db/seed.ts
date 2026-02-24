import type { Table } from "drizzle-orm";

import { sql } from "drizzle-orm";

import { db, schema } from "./index";
import * as seeds from "./seeds/index";

async function main() {
  async function resetTable(table: Table) {
    return db.execute(sql`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);

    // return db.execute(
    //   sql.raw(`TRUNCATE TABLE ${getTableName(table)} RESTART IDENTITY CASCADE`)
    // );
  }

  for (const table of [
    schema.enrollmentTable,
    schema.organizationMembers,
    schema.memberRecordTable,
    schema.organizationTable,
    schema.programsTable,
    schema.account,
    schema.user,
  ]) {
    await resetTable(table);
  }

  await seeds.organization();
  await seeds.program();
  await seeds.user();
  await seeds.account();
  await seeds.organizationMember();
  await seeds.memberRecord();
  await seeds.enrollment();
}
main();
