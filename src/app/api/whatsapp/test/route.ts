import { NextResponse } from "next/server";
import { getSessionStatusAsync, sendMessage } from "@/lib/whatsapp-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Send a test WhatsApp message to verify the Baileys session is
 * working correctly. The user can choose any phone number to send to.
 *
 * Returns detailed feedback about success/failure so the user can
 * verify everything is working end-to-end.
 */
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
    return NextResponse.json(
      { error: "Numéro de téléphone requis" },
      { status: 400 }
    );
  }

  // Normalize phone (remove + and spaces, keep only digits)
  const phoneClean = phone.replace(/[^0-9]/g, "");
  if (!phoneClean || phoneClean.length < 8) {
    return NextResponse.json(
      { error: "Numéro de téléphone invalide. Format attendu : +33 6 12 34 56 78" },
      { status: 400 }
    );
  }

  // Check session status (with auto-recovery from disk)
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
        ok: false,
        error: "WhatsApp n'est pas connecté. Scannez le QR code dans Paramètres.",
        status: status.status,
      },
      { status: 400 }
    );
  }

  // Default test message if not provided
  const message =
    customMessage ||
    `✅ Test Vibecoder Prospect\n\nBonjour ! Ceci est un message de test envoyé depuis la plateforme Vibecoder Prospect à ${new Date().toLocaleString(
      "fr-FR"
    )}.\n\nSi vous voyez ce message, la connexion WhatsApp fonctionne correctement ! 🎉`;

  // Send via Baileys
  const result = await sendMessage(phoneClean, message);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error || "Échec de l'envoi",
      },
      { status: 500 }
    );
  }

  // We don't log test messages to message_logs because the table has a
  // foreign key to prospects.id (notNull). Test messages don't belong
  // to any prospect, so we skip the DB log here. The result is returned
  // directly to the user with full details.

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

/**
 * GET — returns the current status (for the test panel UI to know
 * if a real test can be sent).
 */
export async function GET() {
  const status = await getSessionStatusAsync();
  return NextResponse.json({
    status: status.status,
    phoneNumber: status.phoneNumber,
    profileName: status.profileName,
    ready: status.status === "connected",
  });
}
