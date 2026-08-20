import { NextResponse } from "next/server";
import { pool, db } from "@/db";
import { campaigns } from "@/db/schema";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, any> = {};

  // Test 1: Check pool state
  results.poolState = {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };

  // Test 2: Raw pool query (no params)
  try {
    const r = await pool.query("SELECT 1 as one");
    results.rawSimple = { ok: true, rows: r.rows };
  } catch (err: any) {
    results.rawSimple = { ok: false, error: err.message, code: err.code };
  }

  // Test 3: Raw pool query with params
  try {
    const r = await pool.query("SELECT $1 as val", [25]);
    results.rawParameterized = { ok: true, rows: r.rows };
  } catch (err: any) {
    results.rawParameterized = { ok: false, error: err.message, code: err.code };
  }

  // Test 4: Drizzle simple select
  try {
    const r = await db.select({ one: sql<unknown>`1` });
    results.drizzleSimple = { ok: true, rows: r };
  } catch (err: any) {
    results.drizzleSimple = { ok: false, error: err.message, code: err.code };
  }

  // Test 5: Drizzle select from campaigns
  try {
    const r = await db.select().from(campaigns).limit(1);
    results.drizzleCampaigns = { ok: true, count: r.length };
  } catch (err: any) {
    results.drizzleCampaigns = { ok: false, error: err.message, code: err.code };
  }

  // Test 6: Check DATABASE_URL host (sanitized)
  const url = process.env.DATABASE_URL || "";
  const sanitized = url.replace(/\/\/([^:]+):[^@]+@/, "//$1:***@");
  results.dbUrlSanitized = sanitized;

  const allOk = Object.values(results).every(
    (v: any) => !v || typeof v !== "object" || v.ok !== false
  );

  return NextResponse.json(results, { status: allOk ? 200 : 500 });
}
