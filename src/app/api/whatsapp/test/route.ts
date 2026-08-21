import { NextResponse } from "next/server";
import { isExternalServerConfigured, callServer } from "@/lib/whatsapp-client";
import { getSessionStatusAsync, sendMessage } from "@/lib/whatsapp-session";
import { normalizePhone } from "@/lib/phone-normalizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { phone?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phone = (body.phone || "").trim();
  const customMessage = (body.message || "").trim();

  if (!phone) {
    return NextResponse.json({ error: "Numéro de téléphone requis" }, { status: 400 });
  }

  const phoneClean = normalizePhone(phone) || phone.replace(/[^0-9]/g, "");
  if (!phoneClean || phoneClean.length < 8 || phoneClean.length > 15) {
    return NextResponse.json(
      { error: `Numéro de téléphone invalide: "${phone}" → "${phoneClean}"` },
      { status: 400 }
    );
  }

  console.log(`[Test] Phone: "${phone}" → normalized: "${phoneClean}"`);

  const message =
    customMessage ||
    `✅ Test GoSite\n\nBonjour ! Ceci est un message de test envoyé depuis la plateforme GoSite à ${new Date().toLocaleString("fr-FR")}.\n\nSi vous voyez ce message, la connexion WhatsApp fonctionne correctement ! 🎉`;

  if (isExternalServerConfigured()) {
    try {
      const data = await callServer("/send", {
        method: "POST",
        body: JSON.stringify({ phone: phoneClean, message }),
      });
      return NextResponse.json({
        ok: true,
        messageId: data.messageId,
        sentFrom: data.sentFrom,
        sentFromName: data.sentFromName,
        sentTo: phoneClean,
        sentToFormatted: `+${phoneClean}`,
        messageLength: message.length,
        messagePreview: message.slice(0, 100) + (message.length > 100 ? "..." : ""),
        sentAt: new Date().toISOString(),
      });
    } catch (err: any) {
      return NextResponse.json(
        { ok: false, error: err.message || "Échec de l'envoi" },
        { status: 500 }
      );
    }
  }

  // Fallback: local Baileys
  let status;
  try {
    status = await getSessionStatusAsync();
  } catch {
    return NextResponse.json({ error: "Échec de la récupération du statut de session" }, { status: 500 });
  }
  if (status.status !== "connected") {
    return NextResponse.json(
      { ok: false, error: "WhatsApp n'est pas connecté. Scannez le QR code dans Paramètres.", status: status.status },
      { status: 400 }
    );
  }

  const result = await sendMessage(phoneClean, message);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || "Échec de l'envoi" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    messageId: result.messageId,
    sentFrom: status.phoneNumber,
    sentFromName: status.profileName,
    sentTo: phoneClean,
    sentToFormatted: `+${phoneClean}`,
    messageLength: message.length,
    messagePreview: message.slice(0, 100) + (message.length > 100 ? "..." : ""),
    sentAt: new Date().toISOString(),
  });
}

export async function GET() {
  if (isExternalServerConfigured()) {
    try {
      const data = await callServer("/session");
      return NextResponse.json({
        status: data.status,
        phoneNumber: data.phoneNumber,
        profileName: data.profileName,
        ready: data.status === "connected",
      });
    } catch (err: any) {
      return NextResponse.json({ status: "error", ready: false, error: err.message });
    }
  }

  const status = await getSessionStatusAsync();
  return NextResponse.json({
    status: status.status,
    phoneNumber: status.phoneNumber,
    profileName: status.profileName,
    ready: status.status === "connected",
  });
}
