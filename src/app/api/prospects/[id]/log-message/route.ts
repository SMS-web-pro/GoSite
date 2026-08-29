import { NextResponse } from "next/server";
import { db } from "@/db";
import { messageLogs, prospects } from "@/db/schema";
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

  let body: { messageStage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messageStage = body.messageStage;
  if (!messageStage) {
    return NextResponse.json({ error: "messageStage required" }, { status: 400 });
  }

  // Find prospect in DB
  const [prospect] = await db.select().from(prospects).where(eq(prospects.id, prospectId)).limit(1);
  if (!prospect) {
    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }

  // Insert into DB
  try {
    const [log] = await db
      .insert(messageLogs)
      .values({
        prospectId,
        campaignId: prospect.campaignId || null,
        messageStage,
        status: "sent",
        phone: prospect.externalDemoUrl || null,
      })
      .returning();

    return NextResponse.json({ log });
  } catch (err) {
    // DB fallback to local-store
    console.error("DB write failed for log-message, falling back to local-store:", err);
    const log = localStore.addMessageLog({
      prospectId,
      campaignId: prospect.campaignId || null,
      messageStage,
      status: "sent",
      method: "whatsapp_web",
    });
    return NextResponse.json({ log });
  }
}
