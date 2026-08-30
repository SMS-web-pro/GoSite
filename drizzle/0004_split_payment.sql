ALTER TABLE "settings" ADD COLUMN "deposit_price_eur" integer DEFAULT 9900;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "deposit_price_usd" integer DEFAULT 9900;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "deposit_price_mad" integer DEFAULT 99000;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "final_price_eur" integer DEFAULT 15000;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "final_price_usd" integer DEFAULT 15000;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "final_price_mad" integer DEFAULT 150000;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "deposit_payment_link_eur" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "deposit_payment_link_usd" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "deposit_payment_link_mad" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "final_payment_link_eur" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "final_payment_link_usd" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "final_payment_link_mad" text;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "total_amount" integer;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "deposit_amount" integer;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "final_amount" integer;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "deposit_status" varchar(32) DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "final_payment_status" varchar(32) DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "deposit_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "final_payment_date" timestamp with time zone;--> statement-breakpoint
UPDATE "settings" SET "deposit_price_eur"=COALESCE("deposit_price_eur", 9900) WHERE "deposit_price_eur" IS NULL;--> statement-breakpoint
UPDATE "settings" SET "deposit_price_usd"=COALESCE("deposit_price_usd", 9900) WHERE "deposit_price_usd" IS NULL;--> statement-breakpoint
UPDATE "settings" SET "deposit_price_mad"=COALESCE("deposit_price_mad", 99000) WHERE "deposit_price_mad" IS NULL;--> statement-breakpoint
UPDATE "settings" SET "final_price_eur"=COALESCE("final_price_eur", 15000) WHERE "final_price_eur" IS NULL;--> statement-breakpoint
UPDATE "settings" SET "final_price_usd"=COALESCE("final_price_usd", 15000) WHERE "final_price_usd" IS NULL;--> statement-breakpoint
UPDATE "settings" SET "final_price_mad"=COALESCE("final_price_mad", 150000) WHERE "final_price_mad" IS NULL;--> statement-breakpoint
UPDATE "prospects" SET "total_amount"=COALESCE("total_amount", "quote_amount"), "deposit_amount"=COALESCE("deposit_amount", 9900), "final_amount"=COALESCE("final_amount", 15000) WHERE "total_amount" IS NULL;
