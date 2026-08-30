-- Fix settings table column names to match Drizzle schema
-- DB had: price_deposit_* / payment_link_deposit_* / price_final_* / payment_link_final_*
-- Schema expects: deposit_price_* / deposit_payment_link_* / final_price_* / final_payment_link_*

ALTER TABLE settings RENAME COLUMN price_deposit_eur TO deposit_price_eur;
ALTER TABLE settings RENAME COLUMN price_deposit_usd TO deposit_price_usd;
ALTER TABLE settings RENAME COLUMN price_deposit_mad TO deposit_price_mad;
ALTER TABLE settings RENAME COLUMN price_final_eur TO final_price_eur;
ALTER TABLE settings RENAME COLUMN price_final_usd TO final_price_usd;
ALTER TABLE settings RENAME COLUMN price_final_mad TO final_price_mad;
ALTER TABLE settings RENAME COLUMN payment_link_deposit_eur TO deposit_payment_link_eur;
ALTER TABLE settings RENAME COLUMN payment_link_deposit_usd TO deposit_payment_link_usd;
ALTER TABLE settings RENAME COLUMN payment_link_deposit_mad TO deposit_payment_link_mad;
ALTER TABLE settings RENAME COLUMN payment_link_final_eur TO final_payment_link_eur;
ALTER TABLE settings RENAME COLUMN payment_link_final_usd TO final_payment_link_usd;
ALTER TABLE settings RENAME COLUMN payment_link_final_mad TO final_payment_link_mad;
