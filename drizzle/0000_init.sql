CREATE TABLE "businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"search_id" integer NOT NULL,
	"name" varchar(512) NOT NULL,
	"category" varchar(255),
	"subcategory" varchar(255),
	"osm_type" varchar(16),
	"osm_id" bigint,
	"wikidata_id" varchar(64),
	"wikipedia" varchar(255),
	"address" text,
	"housenumber" varchar(32),
	"street" varchar(512),
	"neighbourhood" varchar(255),
	"suburb" varchar(255),
	"postcode" varchar(16),
	"city" varchar(255),
	"state" varchar(255),
	"country" varchar(128),
	"phone" varchar(64),
	"mobile" varchar(64),
	"email" varchar(255),
	"website" text,
	"facebook" text,
	"twitter" varchar(255),
	"instagram" varchar(255),
	"linkedin" varchar(255),
	"youtube" varchar(255),
	"opening_hours" text,
	"cuisine" varchar(128),
	"description" text,
	"wheelchair" varchar(32),
	"wifi" varchar(16),
	"takeaway" varchar(16),
	"delivery" varchar(16),
	"outdoor_seating" varchar(16),
	"smoking" varchar(16),
	"reservation" varchar(16),
	"parking" varchar(32),
	"air_conditioning" varchar(16),
	"payment_cash" varchar(16),
	"payment_card" varchar(16),
	"capacity" varchar(32),
	"stars" varchar(16),
	"latitude" varchar(64),
	"longitude" varchar(64),
	"bing_url" text,
	"osm_url" text,
	"google_maps_url" text,
	"rating" varchar(16),
	"reviews_count" integer,
	"source" varchar(32) DEFAULT 'photon' NOT NULL,
	"extra_tags" text,
	"detail_count" integer DEFAULT 0 NOT NULL,
	"popularity" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"sector" varchar(255),
	"location" varchar(255),
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"pricing_tiers" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"prospect_id" integer NOT NULL,
	"campaign_id" integer,
	"message_stage" varchar(32) NOT NULL,
	"phone" varchar(32),
	"language" varchar(8),
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"links_clicked" jsonb,
	"payment_link_clicked_at" timestamp with time zone,
	"converted_at" timestamp with time zone,
	"replied_at" timestamp with time zone,
	"reply_text" text,
	"error_message" text,
	"message_body" text,
	"additional_metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "prospects" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"campaign_id" integer,
	"workflow_stage" varchar(32) DEFAULT 'discovered' NOT NULL,
	"notes" text,
	"vibecoder_prompt" text,
	"external_demo_url" text,
	"external_site_url" text,
	"quote_amount" integer,
	"quote_currency" varchar(8) DEFAULT 'EUR',
	"whatsapp_messages" jsonb,
	"payment_status" varchar(32) DEFAULT 'pending',
	"payment_date" timestamp with time zone,
	"payment_amount" integer,
	"delivery_date" timestamp with time zone,
	"demo_token" varchar(64),
	"demo_html" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"sector" varchar(255) NOT NULL,
	"location" varchar(255) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"results_count" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"agency_name" varchar(255) DEFAULT 'Mon Agence',
	"contact_name" varchar(255) DEFAULT 'Votre Nom',
	"contact_email" varchar(255),
	"contact_phone" varchar(64),
	"website_url" text,
	"portfolio_url" text,
	"whatsapp_number" varchar(64),
	"whatsapp_session_id" varchar(128),
	"whatsapp_session_phone" varchar(64),
	"whatsapp_session_name" varchar(128),
	"whatsapp_connected_at" timestamp with time zone,
	"whatsapp_cloud_phone_id" varchar(64),
	"whatsapp_cloud_access_token" text,
	"whatsapp_cloud_business_id" varchar(64),
	"message_language" varchar(8) DEFAULT 'fr',
	"payment_link" text,
	"pricing_tiers" jsonb,
	"message_templates" jsonb,
	"brand_color" varchar(16) DEFAULT '#2563eb',
	"logo_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "businesses_search_idx" ON "businesses" USING btree ("search_id");--> statement-breakpoint
CREATE INDEX "campaigns_created_at_idx" ON "campaigns" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "message_logs_prospect_idx" ON "message_logs" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX "message_logs_campaign_idx" ON "message_logs" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "message_logs_stage_idx" ON "message_logs" USING btree ("message_stage");--> statement-breakpoint
CREATE INDEX "message_logs_status_idx" ON "message_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "prospects_business_idx" ON "prospects" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "prospects_stage_idx" ON "prospects" USING btree ("workflow_stage");--> statement-breakpoint
CREATE INDEX "prospects_campaign_idx" ON "prospects" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "searches_created_at_idx" ON "searches" USING btree ("created_at");