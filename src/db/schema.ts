import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  bigint,
  varchar,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const searches = pgTable(
  "searches",
  {
    id: serial("id").primaryKey(),
    sector: varchar("sector", { length: 255 }).notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    resultsCount: integer("results_count").notNull().default(0),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("searches_created_at_idx").on(table.createdAt),
  })
);

export const businesses = pgTable(
  "businesses",
  {
    id: serial("id").primaryKey(),
    searchId: integer("search_id")
      .notNull()
      .references(() => searches.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 512 }).notNull(),
    category: varchar("category", { length: 255 }),
    subcategory: varchar("subcategory", { length: 255 }),
    osmType: varchar("osm_type", { length: 16 }),
    osmId: bigint("osm_id", { mode: "number" }),
    wikidataId: varchar("wikidata_id", { length: 64 }),
    wikipedia: varchar("wikipedia", { length: 255 }),
    address: text("address"),
    housenumber: varchar("housenumber", { length: 32 }),
    street: varchar("street", { length: 512 }),
    neighbourhood: varchar("neighbourhood", { length: 255 }),
    suburb: varchar("suburb", { length: 255 }),
    postcode: varchar("postcode", { length: 16 }),
    city: varchar("city", { length: 255 }),
    state: varchar("state", { length: 255 }),
    country: varchar("country", { length: 128 }),
    phone: varchar("phone", { length: 64 }),
    mobile: varchar("mobile", { length: 64 }),
    email: varchar("email", { length: 255 }),
    website: text("website"),
    facebook: text("facebook"),
    twitter: varchar("twitter", { length: 255 }),
    instagram: varchar("instagram", { length: 255 }),
    linkedin: varchar("linkedin", { length: 255 }),
    youtube: varchar("youtube", { length: 255 }),
    openingHours: text("opening_hours"),
    cuisine: varchar("cuisine", { length: 128 }),
    description: text("description"),
    wheelchair: varchar("wheelchair", { length: 32 }),
    wifi: varchar("wifi", { length: 16 }),
    takeaway: varchar("takeaway", { length: 16 }),
    delivery: varchar("delivery", { length: 16 }),
    outdoorSeating: varchar("outdoor_seating", { length: 16 }),
    smoking: varchar("smoking", { length: 16 }),
    reservation: varchar("reservation", { length: 16 }),
    parking: varchar("parking", { length: 32 }),
    airConditioning: varchar("air_conditioning", { length: 16 }),
    paymentCash: varchar("payment_cash", { length: 16 }),
    paymentCard: varchar("payment_card", { length: 16 }),
    capacity: varchar("capacity", { length: 32 }),
    stars: varchar("stars", { length: 16 }),
    latitude: varchar("latitude", { length: 64 }),
    longitude: varchar("longitude", { length: 64 }),
    bingUrl: text("bing_url"),
    osmUrl: text("osm_url"),
    googleMapsUrl: text("google_maps_url"),
    rating: varchar("rating", { length: 16 }),
    reviewsCount: integer("reviews_count"),
    source: varchar("source", { length: 32 }).notNull().default("photon"),
    extraTags: text("extra_tags"),
    detailCount: integer("detail_count").notNull().default(0),
    popularity: integer("popularity"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    searchIdx: index("businesses_search_idx").on(table.searchId),
  })
);

export const prospects = pgTable(
  "prospects",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    // External campaign tracking
    campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    // Workflow state
    workflowStage: varchar("workflow_stage", { length: 32 })
      .notNull()
      .default("discovered"),
    notes: text("notes"),
    // Vibecoder prompt (generated, editable)
    vibecoderPrompt: text("vibecoder_prompt"),
    // External demo site URL (user pastes the URL where they vibecoded the site)
    externalDemoUrl: text("external_demo_url"),
    // External final site URL (where the final site is hosted)
    externalSiteUrl: text("external_site_url"),
    // Quote / pricing
    quoteAmount: integer("quote_amount"),
    quoteCurrency: varchar("quote_currency", { length: 8 }).default("EUR"),
    // WhatsApp messages (bilingual: fr + en)
    whatsappMessages: jsonb("whatsapp_messages").$type<{
      intro: { fr: string; en: string };
      demo: { fr: string; en: string };
      quote: { fr: string; en: string };
      delivery: { fr: string; en: string };
      thanks: { fr: string; en: string };
      followup?: { fr: string; en: string };
    } | null>(),
    // Payment simulation
    paymentStatus: varchar("payment_status", { length: 32 }).default("pending"),
    paymentDate: timestamp("payment_date", { withTimezone: true }),
    paymentAmount: integer("payment_amount"),
    // Delivery date (24h after payment)
    deliveryDate: timestamp("delivery_date", { withTimezone: true }),
    // Legacy demo token (kept for backwards compat)
    demoToken: varchar("demo_token", { length: 64 }),
    // Generated demo HTML (still kept for in-app preview)
    demoHtml: text("demo_html"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    businessIdx: index("prospects_business_idx").on(table.businessId),
    stageIdx: index("prospects_stage_idx").on(table.workflowStage),
    campaignIdx: index("prospects_campaign_idx").on(table.campaignId),
  })
);

// Campaigns: group prospects by prospecting campaign
export const campaigns = pgTable(
  "campaigns",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    // Sector + location to target (optional, for auto-search)
    sector: varchar("sector", { length: 255 }),
    location: varchar("location", { length: 255 }),
    // Status
    status: varchar("status", { length: 32 }).notNull().default("active"),
    // Language for WhatsApp messages + Vibecoder prompt (fr/en/ar)
    language: varchar("language", { length: 8 }).default("fr"),
    // Currency for this campaign (EUR/USD/MAD) — auto-set from language
    currency: varchar("currency", { length: 8 }).default("EUR"),
    // Custom pricing for this campaign (JSON of tiers)
    pricingTiers: jsonb("pricing_tiers").$type<
      Array<{
        id: string;
        name: string;
        price: number;
        features: string[];
        recommended?: boolean;
      }>
    >(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("campaigns_created_at_idx").on(table.createdAt),
  })
);

// Settings: single row containing the agency configuration
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  // Agency info
  agencyName: varchar("agency_name", { length: 255 }).default("Mon Agence"),
  contactName: varchar("contact_name", { length: 255 }).default("Votre Nom"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 64 }),
  // Online presence
  websiteUrl: text("website_url"),
  portfolioUrl: text("portfolio_url"),
  // WhatsApp / messaging
  whatsappNumber: varchar("whatsapp_number", { length: 64 }),
  // WhatsApp session (linked device)
  whatsappSessionId: varchar("whatsapp_session_id", { length: 128 }),
  whatsappSessionPhone: varchar("whatsapp_session_phone", { length: 64 }),
  whatsappSessionName: varchar("whatsapp_session_name", { length: 128 }),
  whatsappConnectedAt: timestamp("whatsapp_connected_at", { withTimezone: true }),
  // WhatsApp Cloud API (Meta official)
  whatsappCloudPhoneId: varchar("whatsapp_cloud_phone_id", { length: 64 }),
  whatsappCloudAccessToken: text("whatsapp_cloud_access_token"),
  whatsappCloudBusinessId: varchar("whatsapp_cloud_business_id", { length: 64 }),
  // Default message language for WhatsApp outreach
  messageLanguage: varchar("message_language", { length: 8 }).default("fr"),
  // Default pricing (stored in cents to avoid floating point)
  priceEUR: integer("price_eur").default(89900),
  priceUSD: integer("price_usd").default(99900),
  priceMAD: integer("price_mad").default(99900),
  // Payment links per currency
  paymentLinkEUR: text("payment_link_eur"),
  paymentLinkUSD: text("payment_link_usd"),
  paymentLinkMAD: text("payment_link_mad"),
  // Payment link (used in messages as {{payment_url}})
  paymentLink: text("payment_link"),
  // Default pricing tiers
  pricingTiers: jsonb("pricing_tiers").$type<
    Array<{
      id: string;
      name: string;
      price: number;
      features: string[];
      recommended?: boolean;
    }>
  >(),
  // Message templates (overridable)
  messageTemplates: jsonb("message_templates").$type<{
    intro: string | { fr: string; en: string; ar: string };
    demo: string | { fr: string; en: string; ar: string };
    quote: string | { fr: string; en: string; ar: string };
    payment_received: string | { fr: string; en: string; ar: string };
    delivery: string | { fr: string; en: string; ar: string };
    thanks: string | { fr: string; en: string; ar: string };
    followup: string | { fr: string; en: string; ar: string };
  }>(),
  // Custom branding
  brandColor: varchar("brand_color", { length: 16 }).default("#2563eb"),
  logoUrl: text("logo_url"),
  // Updated at
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Message logs: track when each WhatsApp message is sent to a prospect
export const messageLogs = pgTable(
  "message_logs",
  {
    id: serial("id").primaryKey(),
    prospectId: integer("prospect_id")
      .notNull()
      .references(() => prospects.id, { onDelete: "cascade" }),
    campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    // Stage of the message (intro, demo, quote, delivery, thanks, custom)
    messageStage: varchar("message_stage", { length: 32 }).notNull(),
    // The phone number the message was sent to
    phone: varchar("phone", { length: 32 }),
    // Language used (fr, en, etc.)
    language: varchar("language", { length: 8 }),
    // Send status: "pending" | "sent" | "delivered" | "read" | "failed"
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    // Timestamps for real-time tracking
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    // Link tracking: each link in the message gets a unique ID
    // and we record which ones the recipient clicked
    linksClicked: jsonb("links_clicked").$type<
      Array<{ linkId: string; url: string; clickedAt: string }>
    >(),
    // Payment tracking
    paymentLinkClickedAt: timestamp("payment_link_clicked_at", { withTimezone: true }),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    // Reply tracking
    repliedAt: timestamp("replied_at", { withTimezone: true }),
    replyText: text("reply_text"),
    // Error if failed
    errorMessage: text("error_message"),
    // The full message body that was sent
    messageBody: text("message_body"),
    // Additional metadata for tracking
    additionalMetadata: jsonb("additional_metadata").$type<Record<string, unknown>>(),
  },
  (table) => ({
    prospectIdx: index("message_logs_prospect_idx").on(table.prospectId),
    campaignIdx: index("message_logs_campaign_idx").on(table.campaignId),
    stageIdx: index("message_logs_stage_idx").on(table.messageStage),
    statusIdx: index("message_logs_status_idx").on(table.status),
  })
);

export type Search = typeof searches.$inferSelect;
export type NewSearch = typeof searches.$inferInsert;
export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;
export type Prospect = typeof prospects.$inferSelect;
export type NewProspect = typeof prospects.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
export type MessageLog = typeof messageLogs.$inferSelect;
export type NewMessageLog = typeof messageLogs.$inferInsert;
