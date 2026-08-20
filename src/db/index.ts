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
  // Supabase uses PgBouncer in transaction mode which does NOT support
  // PostgreSQL prepared statements. Disable them to prevent parameterized
  // query failures. (prepareThreshold is a valid pg option but not in TS types)
  const config: any = {
    connectionString: databaseUrl!,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    prepareThreshold: 0,
  };
  return new Pool(config);
}

export const pool = globalForDb.__arenaNextJsPostgresqlPool ?? createPool();

globalForDb.__arenaNextJsPostgresqlPool = pool;

export const db = drizzle(pool);
