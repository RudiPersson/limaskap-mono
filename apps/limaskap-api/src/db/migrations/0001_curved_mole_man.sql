ALTER TABLE "organization" ADD COLUMN "subdomain" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_subdomain_unique" UNIQUE("subdomain");