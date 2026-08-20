import { NextResponse } from "next/server";
import { getSessionStatusAsync, sendMessage } from "@/lib/whatsapp-session";
import { db } from "@/db";
import { prospects, messageLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { prospectId?: number; messageStage?: string; message?: string; phone?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { prospectId, messageStage, message, phone, name } = body || {};
  if (!prospectId || !messageStage) {
    return NextResponse.json(
      { error: "prospectId and messageStage required" },
      { status: 400 }
    );
  }
  if (!phone) {
    return NextResponse.json(
      { error: "phone required" },
      { status: 400 }
    );
  }
  if (typeof message !== "string" || !message) {
    return NextResponse.json(
      { error: "message required" },
      { status: 400 }
    );
  }

  let status;
  try {
    status = await getSessionStatusAsync();
  } catch {
    return NextResponse.json(
      { error: "Échec de la récupération du statut de session" },
      { status: 500 }
    );
  }
  if (status.status !== "connected") {
    return NextResponse.json(
      {
        error: "WhatsApp n'est pas connecté. Scannez le QR code dans Paramètres → WhatsApp.",
        status: status.status,
      },
      { status: 400 }
    );
  }

  // Find prospect — DB first, local-store fallback
  let campaignId: number | null = null;
  try {
    const [prospect] = await db
      .select({ campaignId: prospects.campaignId })
      .from(prospects)
      .where(eq(prospects.id, prospectId))
      .limit(1);
    if (prospect) {
      campaignId = prospect.campaignId;
    }
  } catch {
    const data = localStore.get();
    const prospect = data.prospects.find((p: any) => p.id === prospectId);
    campaignId = prospect?.campaignId || null;
  }

  const result = await sendMessage(phone, message);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Échec d'envoi du message" },
      { status: 500 }
    );
  }

  // Log the message — DB first, local-store fallback
  try {
    await db.insert(messageLogs).values({
      prospectId,
      campaignId,
      messageStage,
      status: "sent",
      phone,
      language: null,
      messageBody: message,
    });
  } catch {
    localStore.addMessageLog({
      prospectId,
      campaignId,
      messageStage,
      status: "sent",
      method: "baileys_session",
      messageId: result.messageId,
      fromPhone: status.phoneNumber,
      toPhone: phone,
      toName: name,
      messageLength: message.length,
    });
  }

  return NextResponse.json({
    ok: true,
    messageId: result.messageId,
    sentFrom: status.phoneNumber,
    sentFromName: status.profileName,
    sentTo: phone,
  });
}
