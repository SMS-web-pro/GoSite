import { NextResponse } from "next/server";
import { isExternalServerConfigured, callServer } from "@/lib/whatsapp-client";
import { getSessionStatusAsync, disconnectSession, initiateSession, qrCodeToDataUrl } from "@/lib/whatsapp-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isServerless() {
  return process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;
}

export async function POST() {
  // If external server is configured, use it
  if (isExternalServerConfigured()) {
    try {
      const data = await callServer("/session", { method: "POST" });
      return NextResponse.json(data);
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Erreur serveur WhatsApp", status: "failed" },
        { status: 500 }
      );
    }
  }

  // Fallback: Baileys local (only works on non-serverless)
  if (isServerless()) {
    return NextResponse.json(
      {
        error: "WhatsApp n'est pas configuré. Ajoutez WHATSAPP_SERVER_URL ou configurez Baileys en local.",
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
  // If external server is configured, use it
  if (isExternalServerConfigured()) {
    try {
      const data = await callServer("/session");
      return NextResponse.json(data);
    } catch (err: any) {
      return NextResponse.json(
        { status: "failed", connected: false, error: err.message },
        { status: 500 }
      );
    }
  }

  // Fallback: Baileys local
  if (isServerless()) {
    return NextResponse.json({
      status: "unavailable",
      connected: false,
      error: "WhatsApp n'est pas configuré.",
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
  // If external server is configured, use it
  if (isExternalServerConfigured()) {
    try {
      const data = await callServer("/session", { method: "DELETE" });
      return NextResponse.json(data);
    } catch (err: any) {
      return NextResponse.json({ status: "error", error: err.message }, { status: 500 });
    }
  }

  // Fallback: Baileys local
  if (isServerless()) {
    return NextResponse.json({ status: "unavailable" });
  }
  await disconnectSession();
  return NextResponse.json({ status: "disconnected" });
}
