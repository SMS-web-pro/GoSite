import { NextResponse } from "next/server";
import { getSessionStatusAsync } from "@/lib/whatsapp-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Debug endpoint to inspect the Baileys session state, including the
 * event log. Useful for troubleshooting "logging in…" stuck states.
 */
export async function GET() {
  try {
    const status = await getSessionStatusAsync();
    return NextResponse.json(status);
  } catch {
    return NextResponse.json(
      { error: "Échec de la récupération du statut de session" },
      { status: 500 }
    );
  }
}
