CREATE TYPE "public"."Gender" AS ENUM('male', 'female');--> statement-breakpoint
ALTER TABLE "member_record" ALTER COLUMN "gender" SET DATA TYPE "public"."Gender" USING "gender"::"public"."Gender";--> statement-breakpoint
ALTER TABLE "member_record" ALTER COLUMN "gender" SET NOT NULL;