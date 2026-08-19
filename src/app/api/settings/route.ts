import { NextResponse } from "next/server";
import { getSettings, getDefaultTemplates } from "@/lib/settings";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSettings();
  return NextResponse.json({ settings: s });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const current = await getSettings();
    const updates: any = {
      ...current,
      updatedAt: new Date(),
    };
    const allowed = [
      "agencyName",
      "contactName",
      "contactEmail",
      "contactPhone",
      "websiteUrl",
      "portfolioUrl",
      "whatsappNumber",
      "messageLanguage",
      "paymentLink",
      "priceEUR",
      "priceUSD",
      "priceMAD",
      "paymentLinkEUR",
      "paymentLinkUSD",
      "paymentLinkMAD",
      "brandColor",
      "logoUrl",
      "messageTemplates",
    ];
    for (const k of allowed) {
      if (body[k] !== undefined) updates[k] = body[k];
    }
    // Save to local-store (primary storage)
    localStore.saveSettings(updates);
    return NextResponse.json({ settings: updates });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
