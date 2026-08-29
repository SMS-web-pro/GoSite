import { NextResponse } from "next/server";
import { db } from "@/db";
import { scheduledMessages } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prospectId = parseInt(id, 10);
  if (Number.isNaN(prospectId)) {
    return NextResponse.json({ error: "Invalid prospect ID" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { campaignId } = body;

  const now = new Date();

  // Schedule 2 follow-ups: J+3, J+7
  const followUps = [
    { messageType: "followup",   delayDays: 3  },
    { messageType: "followup_2", delayDays: 7  },
  ];

  try {
    // Cancel any existing pending follow-ups for this prospect
    await db
      .update(scheduledMessages)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(scheduledMessages.prospectId, prospectId),
          eq(scheduledMessages.status, "pending")
        )
      );

    // Insert new scheduled follow-ups
    for (const fu of followUps) {
      const scheduledAt = new Date(now.getTime() + fu.delayDays * 24 * 60 * 60 * 1000);
      await db.insert(scheduledMessages).values({
        prospectId,
        campaignId: campaignId || null,
        messageType: fu.messageType,
        scheduledAt,
        status: "pending",
      });
    }

    return NextResponse.json({ ok: true, scheduled: followUps.length });
  } catch (e: any) {
    console.error("[schedule-followups] Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
