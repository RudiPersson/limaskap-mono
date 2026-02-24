CREATE TYPE "public"."PaymentProvider" AS ENUM('FRISBII');--> statement-breakpoint
CREATE TABLE "payment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organization_id" integer NOT NULL,
	"enrollment_id" integer NOT NULL,
	"provider" "PaymentProvider" DEFAULT 'FRISBII' NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'DKK' NOT NULL,
	"status" "PaymentStatus" DEFAULT 'PENDING' NOT NULL,
	"provider_order_id" text,
	"checkout_url" text,
	"failure_reason" text,
	"raw" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_enrollment_id_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_enrollment_idx" ON "payment" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "payment_provider_order_idx" ON "payment" USING btree ("provider_order_id");--> statement-breakpoint
CREATE INDEX "payment_org_status_idx" ON "payment" USING btree ("organization_id","status");