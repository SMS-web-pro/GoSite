import { NextResponse } from "next/server";
import { db } from "@/db";
import { prospects, campaigns } from "@/db/schema";
import { sql } from "drizzle-orm";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [prospectCount] = await db.select({ count: sql<number>`count(*)::int` }).from(prospects);
    const [campaignCount] = await db.select({ count: sql<number>`count(*)::int` }).from(campaigns);
    return NextResponse.json({
      prospects: prospectCount?.count || 0,
      campaigns: campaignCount?.count || 0,
    });
  } catch {
    // DB unreachable — fall back to local-store
    const data = localStore.get();
    return NextResponse.json({
      prospects: data.prospects.length,
      campaigns: data.campaigns.length,
    });
  }
}
