import { NextResponse } from "next/server";
import { db } from "@/db";
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

  try {
    const rows = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, cid))
      .limit(1);
    const campaign = rows[0];
    if (!campaign) {
      return NextResponse.json({ error: "Not found", queriedId: cid }, { status: 404 });
    }

    let items: any[] = [];
    try {
      items = await db
        .select({ prospect: prospects, business: businesses })
        .from(prospects)
        .innerJoin(businesses, eq(prospects.businessId, businesses.id))
        .where(eq(prospects.campaignId, cid));
    } catch {}

    return NextResponse.json({ campaign, itemCount: items.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
