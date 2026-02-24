import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ======================
// ENUMS
// ======================
export const organizationRole = pgEnum("OrganizationRole", [
  "ADMIN",
  "EDITOR",
  "VIEWER",
  "COACH",
]);

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

// ======================
// TABLES
// ======================

export const users = pgTable("User", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  emailVerifiedAt: timestamp("emailVerifiedAt", { withTimezone: true }),

  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),

  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const organizations = pgTable("Organization", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  logoUrl: text("logoUrl"),

  isPublished: boolean("isPublished").default(false).notNull(),
  archivedAt: timestamp("archivedAt", { withTimezone: true }),

  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const organizationMembers = pgTable(
  "OrganizationMember",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: organizationRole("role").default("VIEWER").notNull(),

    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqUserOrg: uniqueIndex("orgmember_user_org_unique").on(
      table.userId,
      table.organizationId
    ),
    orgRoleIdx: index("orgmember_org_role_idx").on(
      table.organizationId,
      table.role
    ),
  })
);

export const programs = pgTable(
  "Program",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),

    maxParticipants: integer("maxParticipants"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(), // ISO code

    signupDeadline: timestamp("signupDeadline", { withTimezone: true }),

    minAgeYears: integer("minAgeYears"),
    maxAgeYears: integer("maxAgeYears"),

    isPublished: boolean("isPublished").default(false).notNull(),
    archivedAt: timestamp("archivedAt", { withTimezone: true }),

    tags: text("tags").array(),
    metadata: jsonb("metadata"),

    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqOrgSlug: uniqueIndex("program_org_slug_unique").on(
      table.organizationId,
      table.slug
    ),
    orgIdx: index("program_org_idx").on(table.organizationId),
    publishIdx: index("program_publish_idx").on(
      table.isPublished,
      table.archivedAt
    ),
    deadlineIdx: index("program_deadline_idx").on(table.signupDeadline),
  })
);

export const memberRecords = pgTable(
  "MemberRecord",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    firstName: varchar("firstName", { length: 100 }).notNull(),
    lastName: varchar("lastName", { length: 100 }).notNull(),
    birthDate: timestamp("birthDate", { withTimezone: true }),
    gender: varchar("gender", { length: 50 }),

    addressLine1: varchar("addressLine1", { length: 255 }),
    addressLine2: varchar("addressLine2", { length: 255 }),
    city: varchar("city", { length: 100 }),
    region: varchar("region", { length: 100 }),
    postalCode: varchar("postalCode", { length: 20 }),
    country: varchar("country", { length: 2 }), // ISO-3166-1 alpha-2

    relationshipToUser: varchar("relationshipToUser", { length: 50 }),

    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("member_user_idx").on(table.userId),
    nameIdx: index("member_name_idx").on(table.lastName, table.firstName),
  })
);

export const enrollments = pgTable(
  "Enrollment",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    programId: uuid("programId")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    memberId: uuid("memberId")
      .notNull()
      .references(() => memberRecords.id, { onDelete: "cascade" }),

    status: enrollmentStatus("status").default("CONFIRMED").notNull(),
    waitlistPosition: integer("waitlistPosition"),

    paymentStatus: paymentStatus("paymentStatus").default("NONE").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }),
    externalPaymentId: varchar("externalPaymentId", { length: 255 }),

    signedUpAt: timestamp("signedUpAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    cancelledAt: timestamp("cancelledAt", { withTimezone: true }),
  },
  (table) => ({
    uniqProgramMember: uniqueIndex("enrollment_program_member_unique").on(
      table.programId,
      table.memberId
    ),
    programStatusIdx: index("enrollment_program_status_idx").on(
      table.programId,
      table.status
    ),
    memberIdx: index("enrollment_member_idx").on(table.memberId),
  })
);

// ======================
// (Optional) Sessions table for recurring or scheduled events
// ======================
export const programSessions = pgTable(
  "ProgramSession",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    programId: uuid("programId")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),

    startsAt: timestamp("startsAt", { withTimezone: true }).notNull(),
    endsAt: timestamp("endsAt", { withTimezone: true }).notNull(),
    location: varchar("location", { length: 255 }),
    timezone: varchar("timezone", { length: 50 }),

    // Indexing by time for quick lookups
  },
  (table) => ({
    programStartIdx: index("programsession_program_start_idx").on(
      table.programId,
      table.startsAt
    ),
  })
);
