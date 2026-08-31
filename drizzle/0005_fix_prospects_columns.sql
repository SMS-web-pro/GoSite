-- Fix prospects table column names/types to match Drizzle schema
-- DB has: deposit_paid (bool), deposit_paid_at, final_paid (bool), final_paid_at
-- Schema expects: deposit_status (varchar), deposit_date, final_payment_status (varchar), final_payment_date
-- Plus missing: total_amount, deposit_amount, final_amount

-- Add missing numeric columns
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS total_amount integer;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS deposit_amount integer;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS final_amount integer;

-- Add missing varchar/timestamp columns
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS deposit_status varchar(32) DEFAULT 'pending';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS final_payment_status varchar(32) DEFAULT 'pending';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS deposit_date timestamp with time zone;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS final_payment_date timestamp with time zone;

-- Migrate data from old columns to new ones
UPDATE prospects SET deposit_status = 'paid' WHERE deposit_paid = true;
UPDATE prospects SET final_payment_status = 'paid' WHERE final_paid = true;
UPDATE prospects SET deposit_date = deposit_paid_at WHERE deposit_paid_at IS NOT NULL;
UPDATE prospects SET final_payment_date = final_paid_at WHERE final_paid_at IS NOT NULL;

-- Drop old columns
ALTER TABLE prospects DROP COLUMN IF EXISTS deposit_paid;
ALTER TABLE prospects DROP COLUMN IF EXISTS deposit_paid_at;
ALTER TABLE prospects DROP COLUMN IF EXISTS final_paid;
ALTER TABLE prospects DROP COLUMN IF EXISTS final_paid_at;
