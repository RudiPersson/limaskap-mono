import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { toZodV4SchemaTyped } from "../../zod-utils";
import { user } from "./auth-schema";

export const genderEnum = pgEnum("Gender", ["male", "female"]);

export const relationshipToUserEnum = pgEnum("RelationshipToUser", [
  "CHILD",
  "PARTNER",
  "GUARDIAN",
  "OTHER",
]);

export const memberRecordTable = pgTable("member_record", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  birthDate: timestamp("birthDate", { withTimezone: true }).notNull(),
  gender: genderEnum("gender").notNull(),

  addressLine1: varchar("addressLine1", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  postalCode: varchar("postalCode", { length: 20 }).notNull(),
  country: varchar("country", { length: 255 }).notNull(), // ISO-3166-1 alpha-2

  relationshipToUser: relationshipToUserEnum("relationshipToUser").notNull(),

  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Zod schemas for member record table
export const selectMemberRecordSchema = toZodV4SchemaTyped(
  createSelectSchema(memberRecordTable)
);

export const insertMemberRecordSchema = toZodV4SchemaTyped(
  createInsertSchema(memberRecordTable, {
    // Add any field-specific validations if needed
  }).required({
    userId: true,
    firstName: true,
    lastName: true,
    gender: true, // Now required
  })
);

export const patchMemberRecordSchema = insertMemberRecordSchema.partial();

const userMemberRecordBaseSchema = toZodV4SchemaTyped(
  createInsertSchema(memberRecordTable, {
    birthDate: z.string().date().transform((str) => new Date(`${str}T00:00:00.000Z`)),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    addressLine1: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  })
    .omit({
      userId: true,
      createdAt: true,
      updatedAt: true,
    })
    .required({
      firstName: true,
      lastName: true,
      gender: true,
      addressLine1: true,
      city: true,
      postalCode: true,
      country: true,
      relationshipToUser: true,
      birthDate: true,
    })
);

type UserMemberRecordBase = z.infer<typeof userMemberRecordBaseSchema>;

const birthDateIsInPast = (birthDate: Date | undefined) => {
  if (!birthDate) {
    return true;
  }
  return birthDate <= new Date();
};

// Schema for user-facing create endpoint (omits userId, adds birthDate validation)
export const createUserMemberRecordSchema = userMemberRecordBaseSchema.refine(
  (data: UserMemberRecordBase) => birthDateIsInPast(data.birthDate),
  {
    message: "Birth date must be in the past",
    path: ["birthDate"],
  }
);

export const patchUserMemberRecordSchema = userMemberRecordBaseSchema
  .partial()
  .refine(
    data => birthDateIsInPast(data.birthDate),
    {
      message: "Birth date must be in the past",
      path: ["birthDate"],
    }
  );
