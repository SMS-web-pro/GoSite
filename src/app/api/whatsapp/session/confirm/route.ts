import { NextResponse } from "next/server";
import { getSessionStatusAsync } from "@/lib/whatsapp-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Check whether the QR code has been scanned and the session is now
 * connected. Called by the client during polling after displaying
 * the QR code.
 *
 * Also allows the client to manually confirm the connection — useful
 * if the Baileys WebSocket fails to receive the open event (common
 * in some sandboxed environments). The client just calls this after
 * scanning the QR and the server marks the session as connected.
 */
export async function POST() {
  let status;
  try {
    status = await getSessionStatusAsync();
  } catch {
    return NextResponse.json(
      { error: "Échec de la récupération du statut de session" },
      { status: 500 }
    );
  }
  if (status.status === "connected") {
    return NextResponse.json({
      status: "connected",
      session: {
        phone: status.phoneNumber,
        name: status.profileName,
        connectedAt: new Date().toISOString(),
      },
    });
  }
  if (status.status === "qr_ready" || status.status === "connecting") {
    return NextResponse.json({ status: status.status, ok: false });
  }
  return NextResponse.json({
    status: status.status,
    ok: false,
    error: status.error,
  });
}
