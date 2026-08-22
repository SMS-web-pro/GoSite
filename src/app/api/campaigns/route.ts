import { NextResponse } from "next/server";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { desc } from "drizzle-orm";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { name?: string; sector?: string; location?: string; description?: string; language?: string; currency?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = (body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  // Auto-set currency from language
  const langToCurrency: Record<string, string> = { fr: "EUR", en: "USD", ar: "MAD" };
  const currency = body.currency || langToCurrency[body.language || "fr"] || "EUR";

  let created;
  try {
    [created] = await db
      .insert(campaigns)
      .values({
        name,
        sector: body.sector || null,
        location: body.location || null,
        description: body.description || null,
        language: body.language || "fr",
        currency,
        status: "active",
      })
      .returning();
  } catch (dbErr: any) {
    console.error("[campaigns POST] DB insert failed:", dbErr?.message || dbErr);
    created = localStore.addCampaign({
      name,
      sector: body.sector || null,
      location: body.location || null,
      description: body.description || null,
      language: body.language || "fr",
      currency,
      status: "active",
    });
  }
  return NextResponse.json({ campaign: created });
}

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt))
      .limit(50);
    return NextResponse.json({ campaigns: rows });
  } catch (dbErr: any) {
    console.error("[campaigns GET] DB query failed:", dbErr?.message || dbErr);
    const rows = localStore.getCampaigns();
    return NextResponse.json({ campaigns: rows });
  }
}
