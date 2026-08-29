-- drizzle/0004_whatsapp_workflow_upgrade.sql

-- 1. Add deposit/final pricing columns to settings
ALTER TABLE settings ADD COLUMN price_deposit_eur INTEGER DEFAULT 9900;
ALTER TABLE settings ADD COLUMN price_deposit_usd INTEGER DEFAULT 9900;
ALTER TABLE settings ADD COLUMN price_deposit_mad INTEGER DEFAULT 9900;
ALTER TABLE settings ADD COLUMN price_final_eur INTEGER DEFAULT 15000;
ALTER TABLE settings ADD COLUMN price_final_usd INTEGER DEFAULT 15000;
ALTER TABLE settings ADD COLUMN price_final_mad INTEGER DEFAULT 15000;

-- 2. Add deposit/final payment link columns to settings
ALTER TABLE settings ADD COLUMN payment_link_deposit_eur TEXT;
ALTER TABLE settings ADD COLUMN payment_link_deposit_usd TEXT;
ALTER TABLE settings ADD COLUMN payment_link_deposit_mad TEXT;
ALTER TABLE settings ADD COLUMN payment_link_final_eur TEXT;
ALTER TABLE settings ADD COLUMN payment_link_final_usd TEXT;
ALTER TABLE settings ADD COLUMN payment_link_final_mad TEXT;

-- 3. Add deposit/final tracking to prospects
ALTER TABLE prospects ADD COLUMN deposit_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE prospects ADD COLUMN deposit_paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE prospects ADD COLUMN final_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE prospects ADD COLUMN final_paid_at TIMESTAMP WITH TIME ZONE;

-- 4. Create scheduled_messages table for auto follow-ups
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id SERIAL PRIMARY KEY,
  prospect_id INTEGER NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  message_type VARCHAR(32) NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(16) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduled_messages_pending ON scheduled_messages(status, scheduled_at)
  WHERE status = 'pending';

-- 5. Migrate old pricing data: set deposit = 50% of old price, final = 50%
-- Users can adjust in settings after migration
UPDATE settings SET
  price_deposit_eur = GREATEST(price_eur / 2, 9900),
  price_deposit_usd = GREATEST(price_usd / 2, 9900),
  price_deposit_mad = GREATEST(price_mad / 2, 9900),
  price_final_eur = GREATEST(price_eur / 2, 15000),
  price_final_usd = GREATEST(price_usd / 2, 15000),
  price_final_mad = GREATEST(price_mad / 2, 15000);