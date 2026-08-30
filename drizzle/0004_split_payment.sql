ALTER TABLE "settings" ADD COLUMN "deposit_price_eur" integer DEFAULT 9900;
ALTER TABLE "settings" ADD COLUMN "deposit_price_usd" integer DEFAULT 9900;
ALTER TABLE "settings" ADD COLUMN "deposit_price_mad" integer DEFAULT 99000;
ALTER TABLE "settings" ADD COLUMN "final_price_eur" integer DEFAULT 15000;
ALTER TABLE "settings" ADD COLUMN "final_price_usd" integer DEFAULT 15000;
ALTER TABLE "settings" ADD COLUMN "final_price_mad" integer DEFAULT 150000;
ALTER TABLE "settings" ADD COLUMN "deposit_payment_link_eur" text;
ALTER TABLE "settings" ADD COLUMN "deposit_payment_link_usd" text;
ALTER TABLE "settings" ADD COLUMN "deposit_payment_link_mad" text;
ALTER TABLE "settings" ADD COLUMN "final_payment_link_eur" text;
ALTER TABLE "settings" ADD COLUMN "final_payment_link_usd" text;
ALTER TABLE "settings" ADD COLUMN "final_payment_link_mad" text;

ALTER TABLE "prospects" ADD COLUMN "total_amount" integer;
ALTER TABLE "prospects" ADD COLUMN "deposit_amount" integer;
ALTER TABLE "prospects" ADD COLUMN "final_amount" integer;
ALTER TABLE "prospects" ADD COLUMN "deposit_status" varchar(32) DEFAULT 'pending';
ALTER TABLE "prospects" ADD COLUMN "final_payment_status" varchar(32) DEFAULT 'pending';
ALTER TABLE "prospects" ADD COLUMN "deposit_date" timestamp with time zone;
ALTER TABLE "prospects" ADD COLUMN "final_payment_date" timestamp with time zone;

UPDATE "settings" SET "deposit_price_eur"=COALESCE("deposit_price_eur", 9900) WHERE "deposit_price_eur" IS NULL;
UPDATE "prospects" SET "total_amount"=COALESCE("total_amount", "quote_amount"), "deposit_amount"=COALESCE("deposit_amount", 9900), "final_amount"=COALESCE("final_amount", 15000) WHERE "total_amount" IS NULL;
