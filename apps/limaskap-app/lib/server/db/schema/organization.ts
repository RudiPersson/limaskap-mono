import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { toZodV4SchemaTyped } from "../../zod-utils";
import { user } from "./auth-schema";

export const organizationRole = pgEnum("OrganizationRole", [
  "ADMIN",
  "EDITOR",
  "VIEWER",
  "COACH",
]);

export const organizationTable = pgTable("organization", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  subdomain: varchar({ length: 255 }).notNull().unique(),
  logoUrl: text("logo_url"),
  description: text(),
  image: text(),
  email: varchar({ length: 255 }).notNull().unique(),
  phone: varchar({ length: 255 }),
  address: varchar({ length: 255 }),
  city: varchar({ length: 255 }).notNull(),
  zip: varchar({ length: 255 }).notNull(),
  paymentApiKey: text("payment_api_key"),
  paymentWebhookSecret: text("payment_webhook_secret"),
  isPublished: boolean("is_published").default(false).notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),

  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const organizationMembers = pgTable(
  "organization_member",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizationTable.id, { onDelete: "cascade" }),
    role: organizationRole("role").default("VIEWER").notNull(),

    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("orgmember_user_org_unique").on(table.userId, table.organizationId),
    index("orgmember_org_role_idx").on(table.organizationId, table.role),
  ]
);

// Zod schemas for organization table
export const selectOrganizationSchema = toZodV4SchemaTyped(
  createSelectSchema(organizationTable)
);

export const insertOrganizationSchema = toZodV4SchemaTyped(
  createInsertSchema(organizationTable, {
    name: (field) => field.min(2).max(255),
    slug: (field) => field.min(2).max(255),
    subdomain: (field) => field.min(2).max(255),
    email: (field) => field.min(2).max(255),
    city: (field) => field.min(2).max(255),
    zip: (field) => field.min(2).max(255),
  }).omit({
    created_at: true,
    archivedAt: true,
  })
);
export const patchOrganizationSchema = toZodV4SchemaTyped(
  createInsertSchema(organizationTable).partial()
);


