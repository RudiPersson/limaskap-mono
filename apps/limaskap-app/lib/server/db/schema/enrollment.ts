import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { toZodV4SchemaTyped } from "../../zod-utils";
import { memberRecordTable } from "./member-record";
import { programsTable } from "./program";

export const enrollmentStatus = pgEnum("EnrollmentStatus", [
  "CONFIRMED",
  "WAITLISTED",
  "CANCELLED",
]);

export const paymentStatus = pgEnum("PaymentStatus", [
  "NONE",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
]);

export const invoiceStatus = pgEnum("InvoiceStatus", [
  "CREATED",
  "PENDING",
  "DUNNING",
  "SETTLED",
  "CANCELLED",
  "AUTHORIZED",
  "FAILED",
]);

export const enrollmentTable = pgTable(
  "enrollment",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    programId: integer("programId")
      .notNull()
      .references(() => programsTable.id, { onDelete: "cascade" }),
    memberId: integer("memberId")
      .notNull()
      .references(() => memberRecordTable.id, { onDelete: "cascade" }),

    status: enrollmentStatus("status").default("CONFIRMED").notNull(),

    paymentStatus: paymentStatus("paymentStatus").default("NONE").notNull(),
    invoiceStatus: invoiceStatus("invoiceStatus").default("CREATED").notNull(),
    invoiceHandle: varchar("invoiceHandle", { length: 255 }).notNull().unique(),
    amount: integer("amount"),

    signedUpAt: timestamp("signedUpAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("enrollment_program_member_unique").on(
      table.programId,
      table.memberId
    ),
    index("enrollment_program_status_idx").on(table.programId, table.status),
    index("enrollment_member_idx").on(table.memberId),
  ]
);

export const selectEnrollmentSchema = toZodV4SchemaTyped(
  createSelectSchema(enrollmentTable)
);

const insertEnrollmentSchema = toZodV4SchemaTyped(
  createInsertSchema(enrollmentTable, {
    amount: () => z.number().int().min(0).optional(),
  }).required({
    programId: true,
    memberId: true,
  })
);

// Schema for creating enrollments - only allows programId and memberId
export const createEnrollmentSchema = z.object({
  programId: z.number().int().positive(),
  memberId: z.number().int().positive(),
});

export const patchEnrollmentSchema = insertEnrollmentSchema.partial();

// Relations
export const enrollmentRelations = relations(enrollmentTable, ({ one }) => ({
  program: one(programsTable, {
    fields: [enrollmentTable.programId],
    references: [programsTable.id],
  }),
  member: one(memberRecordTable, {
    fields: [enrollmentTable.memberId],
    references: [memberRecordTable.id],
  }),
}));
