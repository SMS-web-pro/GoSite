import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function createPool() {
  const isSupabase = (databaseUrl ?? "").includes("supabase");
  return new Pool({
    connectionString: databaseUrl!,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });
}

export const pool = globalForDb.__arenaNextJsPostgresqlPool ?? createPool();

globalForDb.__arenaNextJsPostgresqlPool = pool;

export const db = drizzle(pool);
