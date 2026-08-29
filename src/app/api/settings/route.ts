import { NextResponse } from "next/server";
import { getSettings, saveSettingsToDb } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSettings();
  return NextResponse.json({ settings: s });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
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
      "priceDepositEUR",
      "priceDepositUSD",
      "priceDepositMAD",
      "priceFinalEUR",
      "priceFinalUSD",
      "priceFinalMAD",
      "paymentLinkDepositEUR",
      "paymentLinkDepositUSD",
      "paymentLinkDepositMAD",
      "paymentLinkFinalEUR",
      "paymentLinkFinalUSD",
      "paymentLinkFinalMAD",
      "brandColor",
      "logoUrl",
      "messageTemplates",
    ];
    const updates: Record<string, any> = {};
    for (const k of allowed) {
      if (body[k] !== undefined) updates[k] = body[k];
    }
    const settings = await saveSettingsToDb(updates);
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
