import { NextResponse } from "next/server";
import { db } from "@/db";
import { messageLogs, prospects, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const prospectId = parseInt(id, 10);
  if (Number.isNaN(prospectId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  let body: { messageStage?: string; phone?: string; messageBody?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messageStage = body.messageStage;
  if (!messageStage) {
    return NextResponse.json({ error: "messageStage required" }, { status: 400 });
  }

  let prospect: typeof prospects.$inferSelect | null = null;
  let businessPhone: string | null = body.phone || null;

  // Try DB first
  try {
    const [row] = await db
      .select({ prospect: prospects, business: businesses })
      .from(prospects)
      .innerJoin(businesses, eq(prospects.businessId, businesses.id))
      .where(eq(prospects.id, prospectId))
      .limit(1);

    if (row) {
      prospect = row.prospect;
      if (!businessPhone) {
        businessPhone = row.business.phone || null;
      }
    }
  } catch (err) {
    console.warn("DB lookup failed in log-message, using local store:", err);
  }

  // Fallback to localStore if DB returned nothing
  if (!prospect) {
    const local = localStore.getProspectById(prospectId);
    if (local) {
      prospect = local.prospect as any;
      if (!businessPhone && local.business) {
        businessPhone = (local.business as any).phone || null;
      }
    }
  }

  if (!prospect) {
    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }

  const campaignId = prospect.campaignId || null;
  const messageBody = body.messageBody || null;

  // Try inserting into DB
  try {
    const [log] = await db
      .insert(messageLogs)
      .values({
        prospectId,
        campaignId,
        messageStage,
        status: "sent",
        phone: businessPhone,
        messageBody,
      })
      .returning();

    // Also sync to localStore
    localStore.addMessageLog({
      id: log.id,
      prospectId,
      campaignId,
      messageStage,
      status: "sent",
      phone: businessPhone,
      messageBody,
      sentAt: log.sentAt ? new Date(log.sentAt).toISOString() : new Date().toISOString(),
    });

    return NextResponse.json({ log });
  } catch (err) {
    console.warn("DB insert failed for message log, saving to local store:", err);
    const log = localStore.addMessageLog({
      prospectId,
      campaignId,
      messageStage,
      status: "sent",
      phone: businessPhone,
      messageBody,
    });
    return NextResponse.json({ log });
  }
}
