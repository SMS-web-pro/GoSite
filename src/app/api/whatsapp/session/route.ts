import { NextResponse } from "next/server";
import {
  initiateSession,
  getSessionStatusAsync,
  disconnectSession,
  qrCodeToDataUrl,
} from "@/lib/whatsapp-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isServerless() {
  return process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;
}

export async function POST() {
  if (isServerless()) {
    return NextResponse.json(
      {
        error: "WhatsApp Baileys n'est pas disponible sur Vercel (serverless). Utilisez WhatsApp Cloud API (Meta) ou un serveur dédié.",
        status: "unavailable",
      },
      { status: 503 }
    );
  }
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

export async function GET() {
  if (isServerless()) {
    return NextResponse.json({
      status: "unavailable",
      connected: false,
      error: "WhatsApp Baileys n'est pas disponible sur Vercel. Utilisez WhatsApp Cloud API.",
    });
  }
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

export async function DELETE() {
  if (isServerless()) {
    return NextResponse.json({ status: "unavailable" });
  }
  await disconnectSession();
  return NextResponse.json({ status: "disconnected" });
}
