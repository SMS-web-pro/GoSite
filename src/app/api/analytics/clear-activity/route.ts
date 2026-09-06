import { NextResponse } from "next/server";
import { localStore } from "@/lib/local-store";

export async function POST() {
  try {
    localStore.clearMessageLogs();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
