import { NextResponse } from "next/server";
import { db, pool } from "@/db";
import { campaigns, prospects, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cid = parseInt(id, 10);
  if (Number.isNaN(cid)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const results: Record<string, any> = {};

  // Test 1: raw pool query with parameterized WHERE
  try {
    const raw = await pool.query("SELECT * FROM campaigns WHERE id = $1", [cid]);
    results.rawParameterized = { ok: true, rowCount: raw.rowCount };
  } catch (err: any) {
    results.rawParameterized = { ok: false, error: err?.message, code: err?.code };
  }

  // Test 2: raw pool query without WHERE
  try {
    const raw = await pool.query("SELECT count(*) FROM campaigns");
    results.rawSimple = { ok: true, rows: raw.rows };
  } catch (err: any) {
    results.rawSimple = { ok: false, error: err?.message, code: err?.code };
  }

  // Test 3: Drizzle query
  try {
    const rows = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, cid))
      .limit(1);
    results.drizzle = { ok: true, rowCount: rows.length, campaign: rows[0] || null };
  } catch (err: any) {
    results.drizzle = {
      ok: false,
      error: err?.message,
      cause: err?.cause?.message || err?.cause || null,
      code: err?.code || null,
    };
  }

  const status = results.drizzle?.ok ? 200 : 500;
  return NextResponse.json(results, { status });
}
