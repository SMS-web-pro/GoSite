import { NextResponse } from "next/server";
import { isExternalServerConfigured, callServer } from "@/lib/whatsapp-client";
import { getSessionStatusAsync } from "@/lib/whatsapp-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Debug endpoint — shows session state including connection logs.
 */
export async function GET() {
  if (isExternalServerConfigured()) {
    try {
      const data = await callServer("/session");
      return NextResponse.json({
        status: data.status,
        eventLog: [`Connected: ${data.connected}`, `Phone: ${data.phoneNumber || "N/A"}`, `Reconnect attempts: ${data.reconnectAttempts || 0}`],
      });
    } catch (err: any) {
      return NextResponse.json({ status: "error", eventLog: [err.message] });
    }
  }

  try {
    const status = await getSessionStatusAsync();
    return NextResponse.json(status);
  } catch {
    return NextResponse.json({ error: "Session status unavailable" }, { status: 500 });
  }
}
