import { NextResponse } from "next/server";
import { isExternalServerConfigured, callServer } from "@/lib/whatsapp-client";
import { getSessionStatusAsync, sendMessage } from "@/lib/whatsapp-session";
import { normalizePhone } from "@/lib/phone-normalizer";
import { db } from "@/db";
import { prospects, messageLogs, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Normalize a phone number to international format (digits only, no +).
 * This is the LAST防线 before sending to Baileys — wrong format = silent failure.
 */
async function normalizePhoneForSend(prospectId: number, phone: string): Promise<string> {
  // Try to get the prospect's country from the database
  let countryCode: string | null = null;
  try {
    const [row] = await db
      .select({ country: businesses.country })
      .from(prospects)
      .innerJoin(businesses, eq(prospects.businessId, businesses.id))
      .where(eq(prospects.id, prospectId))
      .limit(1);
    if (row?.country) {
      countryCode = row.country;
    }
  } catch {
    // Fallback to local store
    const data = localStore.get();
    const prospect = data.prospects.find((p: any) => p.id === prospectId);
    if (prospect?.business?.country) {
      countryCode = prospect.business.country;
    }
  }

  const normalized = normalizePhone(phone, countryCode);
  if (normalized) return normalized;

  // Last resort: just strip non-digits
  return phone.replace(/[^0-9]/g, "");
}

export async function POST(req: Request) {
  let body: { prospectId?: number; messageStage?: string; message?: string; phone?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { prospectId, messageStage, message, phone, name } = body || {};

  if (!prospectId || !messageStage) {
    return NextResponse.json({ error: "prospectId and messageStage required" }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  }
  if (typeof message !== "string" || !message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  // Normalize phone to international format
  const phoneClean = await normalizePhoneForSend(prospectId, phone);
  if (!phoneClean || phoneClean.length < 8 || phoneClean.length > 15) {
    return NextResponse.json(
      { error: `Numéro de téléphone invalide: "${phone}" → normalisé: "${phoneClean}"` },
      { status: 400 }
    );
  }

  console.log(`[Send] Phone: "${phone}" → normalized: "${phoneClean}" (prospectId: ${prospectId})`);

  let result: { ok: boolean; messageId?: string; error?: string; sentFrom?: string; sentFromName?: string; sentTo?: string };

  if (isExternalServerConfigured()) {
    try {
      const data = await callServer("/send", {
        method: "POST",
        body: JSON.stringify({ phone: phoneClean, message }),
      });
      result = {
        ok: data.ok !== false,
        messageId: data.messageId,
        sentFrom: data.sentFrom,
        sentFromName: data.sentFromName,
        sentTo: data.sentTo,
      };
    } catch (err: any) {
      console.error("[Send] External server error:", err.message);
      return NextResponse.json(
        { error: err.message || "Échec d'envoi via serveur WhatsApp" },
        { status: 500 }
      );
    }
  } else {
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
        { error: "WhatsApp n'est pas connecté. Scannez le QR code dans Paramètres → WhatsApp.", status: status.status },
        { status: 400 }
      );
    }
    const sendResult = await sendMessage(phoneClean, message);
    result = {
      ok: sendResult.ok,
      messageId: sendResult.messageId,
      error: sendResult.error,
      sentFrom: status.phoneNumber ?? undefined,
      sentFromName: status.profileName ?? undefined,
    };
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Échec d'envoi du message" },
      { status: 500 }
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

  // Log the message
  try {
    await db.insert(messageLogs).values({
      prospectId,
      campaignId,
      messageStage,
      status: "sent",
      phone: phoneClean,
      language: null,
      messageBody: message,
    });
  } catch {
    localStore.addMessageLog({
      prospectId,
      campaignId,
      messageStage,
      status: "sent",
      method: isExternalServerConfigured() ? "whatsapp_server" : "baileys_local",
      messageId: result.messageId,
      fromPhone: result.sentFrom,
      toPhone: phoneClean,
      toName: name,
      messageLength: message.length,
    });
  }

  return NextResponse.json({
    ok: true,
    messageId: result.messageId,
    sentFrom: result.sentFrom,
    sentFromName: result.sentFromName,
    sentTo: phoneClean,
  });
}
