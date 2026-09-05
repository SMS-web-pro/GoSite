import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "./schema.mjs";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
export const pool = connectionString
  ? new Pool({ connectionString, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined })
  : null;
export const db = pool ? drizzle(pool, { schema }) : null;

export async function ensureDatabase() {
  if (!pool) return false;
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE, display_name text, role text NOT NULL DEFAULT 'user', created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS subscriptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE, plan text NOT NULL DEFAULT 'free', status text NOT NULL DEFAULT 'active', current_period_end timestamptz, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS payments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE SET NULL, provider text, provider_payment_id text, amount_cents integer NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'EUR', status text NOT NULL DEFAULT 'pending', metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS sessions (id text PRIMARY KEY, user_id uuid REFERENCES users(id) ON DELETE SET NULL, status text NOT NULL DEFAULT 'idle', whatsapp_jid text, phone text, credentials_path text NOT NULL, connected_at timestamptz, last_seen_at timestamptz, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS batches (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE SET NULL, status text NOT NULL DEFAULT 'pending', default_country text NOT NULL DEFAULT 'FR', total integer NOT NULL DEFAULT 0, processed integer NOT NULL DEFAULT 0, exists_count integer NOT NULL DEFAULT 0, invalid_count integer NOT NULL DEFAULT 0, source text NOT NULL DEFAULT 'prospectradar', metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz);
    CREATE TABLE IF NOT EXISTS check_results (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE, input text NOT NULL, e164 text, national_number text, country text, jid text, valid_number boolean NOT NULL DEFAULT false, exists_on_whatsapp boolean, profile_picture_url text, about text, is_business boolean, business_profile jsonb, error text, checked_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS usage_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE SET NULL, action text NOT NULL, units integer NOT NULL DEFAULT 1, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS user_blocks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE, reason text NOT NULL, active boolean NOT NULL DEFAULT true, expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE SET NULL, event text NOT NULL, entity_type text, entity_id text, payload jsonb NOT NULL DEFAULT '{}', ip_address text, created_at timestamptz NOT NULL DEFAULT now());
    CREATE INDEX IF NOT EXISTS check_results_batch_idx ON check_results(batch_id);
    CREATE INDEX IF NOT EXISTS check_results_e164_idx ON check_results(e164);
    CREATE INDEX IF NOT EXISTS batches_created_idx ON batches(created_at DESC);`);
  return true;
}

export async function saveSession(snapshot, credentialsPath) {
  if (!db) return;
  await db.insert(schema.sessions).values({
    id: "default",
    status: snapshot.status,
    whatsappJid: snapshot.jid ?? null,
    phone: snapshot.user ?? null,
    credentialsPath,
    connectedAt: snapshot.connected ? new Date() : null,
    lastSeenAt: new Date(),
    updatedAt: new Date(),
    metadata: { checked: snapshot.checked, found: snapshot.found },
  }).onConflictDoUpdate({
    target: schema.sessions.id,
    set: {
      status: snapshot.status,
      whatsappJid: snapshot.jid ?? null,
      phone: snapshot.user ?? null,
      connectedAt: snapshot.connected ? new Date() : null,
      lastSeenAt: new Date(),
      updatedAt: new Date(),
      metadata: { checked: snapshot.checked, found: snapshot.found },
    },
  });
}

export async function createBatch({ defaultCountry, total, source = "prospectradar" }) {
  if (!db) return null;
  const [row] = await db.insert(schema.batches).values({
    defaultCountry,
    total,
    status: "processing",
    source,
  }).returning();
  return row;
}

export async function saveResults(batchId, results) {
  if (!db || !batchId || !results.length) return;
  await db.insert(schema.checkResults).values(results.map((r) => ({
    batchId,
    input: r.input,
    e164: r.e164 ?? null,
    nationalNumber: r.nationalNumber ?? null,
    country: r.country ?? null,
    jid: r.jid ?? null,
    validNumber: r.validNumber,
    existsOnWhatsApp: r.exists,
    profilePictureUrl: r.profilePictureUrl ?? null,
    about: r.about ?? null,
    isBusiness: r.isBusiness ?? null,
    businessProfile: r.businessProfile ?? null,
    error: r.error ?? null,
  })));
  const existsCount = results.filter((r) => r.exists === true).length;
  const invalidCount = results.filter((r) => !r.validNumber).length;
  await db.update(schema.batches).set({
    status: "completed",
    processed: results.length,
    existsCount,
    invalidCount,
    completedAt: new Date(),
  }).where(eq(schema.batches.id, batchId));
  await db.insert(schema.usageLogs).values({ action: "whatsapp_check", units: results.length, metadata: { batchId } });
  await db.insert(schema.auditLogs).values({ event: "batch.completed", entityType: "batch", entityId: batchId, payload: { total: results.length, existsCount, invalidCount } });
}

export async function getBatch(id) {
  if (!db) return null;
  const [batch] = await db.select().from(schema.batches).where(eq(schema.batches.id, id)).limit(1);
  if (!batch) return null;
  const results = await db.select().from(schema.checkResults).where(eq(schema.checkResults.batchId, id));
  return { ...batch, results };
}