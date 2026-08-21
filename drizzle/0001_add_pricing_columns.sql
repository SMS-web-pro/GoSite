ALTER TABLE "settings" ADD COLUMN "price_eur" integer DEFAULT 89900;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "price_usd" integer DEFAULT 99900;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "price_mad" integer DEFAULT 99900;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "payment_link_eur" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "payment_link_usd" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "payment_link_mad" text;