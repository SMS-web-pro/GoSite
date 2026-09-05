import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique(),
  displayName: text("display_name"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("free"),
  status: text("status").notNull().default("active"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  provider: text("provider"),
  providerPaymentId: text("provider_payment_id"),
  amountCents: integer("amount_cents").notNull().default(0),
  currency: text("currency").notNull().default("EUR"),
  status: text("status").notNull().default("pending"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status").notNull().default("idle"),
  whatsappJid: text("whatsapp_jid"),
  phone: text("phone"),
  credentialsPath: text("credentials_path").notNull(),
  connectedAt: timestamp("connected_at", { withTimezone: true }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const batches = pgTable("batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status").notNull().default("pending"),
  defaultCountry: text("default_country").notNull().default("FR"),
  total: integer("total").notNull().default(0),
  processed: integer("processed").notNull().default(0),
  existsCount: integer("exists_count").notNull().default(0),
  invalidCount: integer("invalid_count").notNull().default(0),
  source: text("source").notNull().default("prospectradar"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const checkResults = pgTable("check_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  batchId: uuid("batch_id").references(() => batches.id, { onDelete: "cascade" }).notNull(),
  input: text("input").notNull(),
  e164: text("e164"),
  nationalNumber: text("national_number"),
  country: text("country"),
  jid: text("jid"),
  validNumber: boolean("valid_number").notNull().default(false),
  existsOnWhatsApp: boolean("exists_on_whatsapp"),
  profilePictureUrl: text("profile_picture_url"),
  about: text("about"),
  isBusiness: boolean("is_business"),
  businessProfile: jsonb("business_profile"),
  error: text("error"),
  checkedAt: timestamp("checked_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usageLogs = pgTable("usage_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  units: integer("units").notNull().default(1),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userBlocks = pgTable("user_blocks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  event: text("event").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  payload: jsonb("payload").notNull().default({}),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});