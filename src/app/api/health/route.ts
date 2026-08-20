import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.select({ one: sql<number>`1` });
    return NextResponse.json({ ok: true, db: "connected" });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "DB connection failed" },
      { status: 500 }
    );
  }
}
