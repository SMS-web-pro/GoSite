import { NextResponse } from "next/server";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const prospectId = parseInt(id, 10);
  if (Number.isNaN(prospectId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  let body: { messageStage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messageStage = body.messageStage;
  if (!messageStage) {
    return NextResponse.json({ error: "messageStage required" }, { status: 400 });
  }

  const data = localStore.get();
  const prospect = data.prospects.find((p: any) => p.id === prospectId);
  if (!prospect) {
    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }

  const log = localStore.addMessageLog({
    prospectId,
    campaignId: (prospect as any).campaignId || null,
    messageStage,
    status: "sent",
    method: "whatsapp_web",
  });

  return NextResponse.json({ log });
}
