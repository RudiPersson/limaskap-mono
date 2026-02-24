-- Custom SQL migration file, put your code below! --

-- Create the RelationshipToUser enum type
CREATE TYPE "public"."RelationshipToUser" AS ENUM ('CHILD', 'PARTNER', 'GUARDIAN', 'OTHER');

-- Handle empty or null values first
UPDATE "member_record" SET "relationshipToUser" = 'OTHER' WHERE "relationshipToUser" = '' OR "relationshipToUser" IS NULL;

-- Update existing data to normalize relationship values
UPDATE "member_record" SET "relationshipToUser" = 'CHILD' WHERE "relationshipToUser" IN ('son', 'daughter');

-- Normalize any lowercase allowed values to uppercase
UPDATE "member_record" SET "relationshipToUser" = 'CHILD' WHERE LOWER("relationshipToUser") = 'child';
UPDATE "member_record" SET "relationshipToUser" = 'PARTNER' WHERE LOWER("relationshipToUser") = 'partner';
UPDATE "member_record" SET "relationshipToUser" = 'GUARDIAN' WHERE LOWER("relationshipToUser") = 'guardian';
UPDATE "member_record" SET "relationshipToUser" = 'OTHER' WHERE LOWER("relationshipToUser") = 'other';

-- Alter the column to use the enum type
ALTER TABLE "member_record" ALTER COLUMN "relationshipToUser" TYPE "public"."RelationshipToUser" USING ("relationshipToUser"::"public"."RelationshipToUser");