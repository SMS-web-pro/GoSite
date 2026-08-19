import { NextResponse } from "next/server";
import { disconnectSession } from "@/lib/whatsapp-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await disconnectSession();
    return NextResponse.json({ status: "disconnected" });
  } catch {
    return NextResponse.json(
      { error: "Échec de la déconnexion de la session" },
      { status: 500 }
    );
  }
}
