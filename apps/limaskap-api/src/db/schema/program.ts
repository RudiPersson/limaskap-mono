import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { toZodV4SchemaTyped } from "../../lib/zod-utils";
import { organizationTable } from "./organization";

export const programsTable = pgTable(
  "program",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizationTable.id, { onDelete: "cascade" }),

    name: varchar({ length: 255 }).notNull(),
    description: text(),
    image: text(),
    price: integer().notNull(),

    maxParticipants: integer("max_participants"),

    startDate: timestamp("start_date", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    endDate: timestamp("end_date", {
      withTimezone: true,
      mode: "date",
    }).notNull(),

    isPublished: boolean("is_published").default(false).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),

    tags: text("tags").array(),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("program_org_idx").on(table.organizationId),
    index("program_publish_idx").on(table.isPublished, table.archivedAt),
  ]
);

export const selectProgramsSchema = toZodV4SchemaTyped(
  createSelectSchema(programsTable)
);

export const selectProgramsWithEnrollmentCountSchema = toZodV4SchemaTyped(
  createSelectSchema(programsTable).extend({
    enrollmentCount: z.number().int().min(0)
  })
);

export const insertProgramsSchema = toZodV4SchemaTyped(
  createInsertSchema(programsTable, {
    name: (field) => field.min(1).max(255),
    price: () => z.number().positive().multipleOf(0.01), // Accept decimal kroner, will be converted to øre
    startDate: () => z.coerce.date(),
    endDate: () => z.coerce.date(),
  }).required({
    organizationId: true,
    name: true,
    price: true,
    maxParticipants: true,
    startDate: true,
    endDate: true,
  })
);

// @ts-expect-error partial exists on zod v4 type
export const patchProgramsSchema = insertProgramsSchema.partial();

// Relations
export const programsRelations = relations(programsTable, ({ one }) => ({
  organization: one(organizationTable, {
    fields: [programsTable.organizationId],
    references: [organizationTable.id],
  }),
}));



