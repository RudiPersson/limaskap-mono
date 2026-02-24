-- CREATE TYPE "public"."RelationshipToUser" AS ENUM('CHILD', 'PARTNER', 'GUARDIAN', 'OTHER');--> statement-breakpoint
ALTER TABLE "member_record" ALTER COLUMN "country" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "member_record" ALTER COLUMN "relationshipToUser" SET DATA TYPE "public"."RelationshipToUser" USING "relationshipToUser"::"public"."RelationshipToUser";