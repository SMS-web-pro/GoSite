import { NextResponse } from "next/server";
import {
  initiateSession,
  getSessionStatus,
  getSessionStatusAsync,
  disconnectSession,
  qrCodeToDataUrl,
} from "@/lib/whatsapp-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Initiate a real WhatsApp session via Baileys.
 *
 * Returns the QR code (as a base64 data URL) that the user must scan
 * with their phone. The QR payload is the actual WhatsApp Web
 * multi-device link refusal signature.
 */
export async function POST() {
  try {
    const result = await initiateSession();
    let qrDataUrl: string | null = null;
    if (result.qrCode) {
      qrDataUrl = await qrCodeToDataUrl(result.qrCode);
    }
    return NextResponse.json({
      status: result.status,
      sessionId: result.sessionId,
      qrCode: qrDataUrl,
      // The raw payload for advanced clients
      rawQrPayload: result.qrCode,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Erreur d'initialisation de session",
        status: "failed",
      },
      { status: 500 }
    );
  }
}

/**
 * Get the current WhatsApp session status. If the server was restarted
 * but the credentials + DB indicate a connected session, we auto-recover.
 */
export async function GET() {
  const status = await getSessionStatusAsync();
  const payload: Record<string, unknown> = {
    status: status.status,
    connected: status.status === "connected",
    phoneNumber: status.phoneNumber,
    phone: status.phoneNumber,
    profileName: status.profileName,
    error: status.error,
  };
  if (status.qrCode) {
    payload.qrCode = await qrCodeToDataUrl(status.qrCode);
    payload.qrExpiry = status.qrExpiry;
  }
  return NextResponse.json(payload);
}

/**
 * Disconnect the active WhatsApp session.
 */
export async function DELETE() {
  await disconnectSession();
  return NextResponse.json({ status: "disconnected" });
}
