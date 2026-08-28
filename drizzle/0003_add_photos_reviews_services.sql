-- Add photos, reviews, services columns to businesses
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "photos" jsonb;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "reviews" jsonb;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "services" text;
