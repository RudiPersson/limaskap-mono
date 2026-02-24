import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { toZodV4SchemaTyped } from "../../lib/zod-utils";
import { enrollmentTable } from "./enrollment";
import { organizationTable } from "./organization";

export const paymentStatusEnum = pgEnum("PaymentStatusEnum", [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
]);

export const paymentTable = pgTable(
  "payment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    handle: varchar("handle", { length: 255 }).notNull().unique(),

    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizationTable.id, { onDelete: "cascade" }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollmentTable.id, { onDelete: "cascade" }),

    amount: integer("amount").notNull(), // Minor units (øre)
    currency: varchar("currency", { length: 3 }).notNull().default("DKK"),

    status: paymentStatusEnum("status").notNull().default("PENDING"),

    // Frisbii references
    sessionId: text("session_id"),
    chargeId: text("charge_id"),
    invoiceHandle: text("invoice_handle"),
    transactionId: text("transaction_id"),

    // Direct settle flag
    directSettle: boolean("direct_settle").notNull().default(true),

    // Redirect URLs
    acceptUrl: text("accept_url"),
    cancelUrl: text("cancel_url"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payment_org_idx").on(table.organizationId),
    index("payment_enrollment_idx").on(table.enrollmentId),
    index("payment_status_idx").on(table.status),
    index("payment_handle_idx").on(table.handle),
  ]
);

export const webhookEventTable = pgTable(
  "webhook_event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    webhookId: varchar("webhook_id", { length: 255 }).notNull().unique(), // Frisbii webhook id
    eventId: varchar("event_id", { length: 255 }).notNull(), // Frisbii event_id
    eventType: varchar("event_type", { length: 100 }).notNull(),

    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizationTable.id, { onDelete: "cascade" }),

    // Raw webhook payload
    payload: jsonb("payload").notNull(),

    // Processing metadata
    processedAt: timestamp("processed_at", { withTimezone: true }),
    processingError: text("processing_error"),

    receivedAt: timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("webhook_event_org_idx").on(table.organizationId),
    index("webhook_event_type_idx").on(table.eventType),
    index("webhook_event_processed_idx").on(table.processedAt),
  ]
);

// Zod schemas for payment table
export const selectPaymentSchema = toZodV4SchemaTyped(
  createSelectSchema(paymentTable)
);

export const insertPaymentSchema = toZodV4SchemaTyped(
  createInsertSchema(paymentTable, {
    amount: () => z.number().int().positive(),
    currency: () => z.string().length(3).default("DKK"),
  })
    .omit({
      createdAt: true,
      updatedAt: true,
    })
    .required({
      handle: true,
      organizationId: true,
      enrollmentId: true,
      amount: true,
    })
);

// @ts-expect-error partial exists on zod v4 type
export const patchPaymentSchema = insertPaymentSchema.partial();

// Zod schemas for webhook_event table
export const selectWebhookEventSchema = toZodV4SchemaTyped(
  createSelectSchema(webhookEventTable)
);

export const insertWebhookEventSchema = toZodV4SchemaTyped(
  createInsertSchema(webhookEventTable)
    .omit({
      receivedAt: true,
    })
    .required({
      webhookId: true,
      eventId: true,
      eventType: true,
      organizationId: true,
      payload: true,
    })
);

// Relations
export const paymentRelations = relations(paymentTable, ({ one }) => ({
  organization: one(organizationTable, {
    fields: [paymentTable.organizationId],
    references: [organizationTable.id],
  }),
  enrollment: one(enrollmentTable, {
    fields: [paymentTable.enrollmentId],
    references: [enrollmentTable.id],
  }),
}));

export const webhookEventRelations = relations(webhookEventTable, ({ one }) => ({
  organization: one(organizationTable, {
    fields: [webhookEventTable.organizationId],
    references: [organizationTable.id],
  }),
}));

