CREATE TYPE "public"."EnrollmentStatus" AS ENUM('CONFIRMED', 'WAITLISTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."PaymentStatus" AS ENUM('NONE', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."OrganizationRole" AS ENUM('ADMIN', 'EDITOR', 'VIEWER', 'COACH');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "enrollment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "enrollment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"programId" integer NOT NULL,
	"memberId" integer NOT NULL,
	"status" "EnrollmentStatus" DEFAULT 'CONFIRMED' NOT NULL,
	"paymentStatus" "PaymentStatus" DEFAULT 'NONE' NOT NULL,
	"amount" integer,
	"signedUpAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_record" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "member_record_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"firstName" varchar(100) NOT NULL,
	"lastName" varchar(100) NOT NULL,
	"birthDate" timestamp with time zone,
	"gender" varchar(50),
	"addressLine1" varchar(255),
	"city" varchar(100),
	"postalCode" varchar(20),
	"country" varchar(2),
	"relationshipToUser" varchar(50),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_member" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organization_member_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"organization_id" integer NOT NULL,
	"role" "OrganizationRole" DEFAULT 'VIEWER' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organization_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"logo_url" text,
	"description" text,
	"image" text,
	"email" varchar(255) NOT NULL,
	"phone" varchar(255),
	"address" varchar(255),
	"city" varchar(255) NOT NULL,
	"zip" varchar(255) NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug"),
	CONSTRAINT "organization_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "program" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "program_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organization_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"image" text,
	"price" integer NOT NULL,
	"max_participants" integer,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"tags" text[],
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_programId_program_id_fk" FOREIGN KEY ("programId") REFERENCES "public"."program"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_memberId_member_record_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."member_record"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_record" ADD CONSTRAINT "member_record_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program" ADD CONSTRAINT "program_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_program_member_unique" ON "enrollment" USING btree ("programId","memberId");--> statement-breakpoint
CREATE INDEX "enrollment_program_status_idx" ON "enrollment" USING btree ("programId","status");--> statement-breakpoint
CREATE INDEX "enrollment_member_idx" ON "enrollment" USING btree ("memberId");--> statement-breakpoint
CREATE INDEX "orgmember_user_org_unique" ON "organization_member" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "orgmember_org_role_idx" ON "organization_member" USING btree ("organization_id","role");--> statement-breakpoint
CREATE INDEX "program_org_idx" ON "program" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "program_publish_idx" ON "program" USING btree ("is_published","archived_at");