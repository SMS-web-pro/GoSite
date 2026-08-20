import { NextResponse } from "next/server";
import { pool } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await pool.query("SELECT 1 as ok");
    return NextResponse.json({ ok: true, db: "connected", rowCount: result.rowCount });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "DB connection failed" },
      { status: 500 }
    );
  }
}
