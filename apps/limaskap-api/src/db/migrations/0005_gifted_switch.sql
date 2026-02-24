-- Custom SQL migration file, put your code below! --

-- Alter the country column to increase length from 2 to 255 characters
-- This allows storing full country names instead of just ISO-3166-1 alpha-2 codes
ALTER TABLE "member_record" ALTER COLUMN "country" TYPE varchar(255);