CREATE TYPE "public"."PaymentStatusEnum" AS ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle" varchar(255) NOT NULL,
	"organization_id" integer NOT NULL,
	"enrollment_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'DKK' NOT NULL,
	"status" "PaymentStatusEnum" DEFAULT 'PENDING' NOT NULL,
	"session_id" text,
	"charge_id" text,
	"invoice_handle" text,
	"transaction_id" text,
	"direct_settle" boolean DEFAULT true NOT NULL,
	"accept_url" text,
	"cancel_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "webhook_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" varchar(255) NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"organization_id" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"processing_error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_event_webhook_id_unique" UNIQUE("webhook_id")
);
--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_enrollment_id_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_event" ADD CONSTRAINT "webhook_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_org_idx" ON "payment" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payment_enrollment_idx" ON "payment" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_handle_idx" ON "payment" USING btree ("handle");--> statement-breakpoint
CREATE INDEX "webhook_event_org_idx" ON "webhook_event" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "webhook_event_type_idx" ON "webhook_event" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "webhook_event_processed_idx" ON "webhook_event" USING btree ("processed_at");