import { NextResponse } from "next/server";
import { db } from "@/db";
import { prospects, businesses, searches, campaigns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  generateVibecoderPrompt,
  generateDefaultWhatsAppMessages,
} from "@/lib/prompt-generator";
import { generateDemoSiteHtml } from "@/lib/site-generator";
import { nanoid } from "nanoid";
import { getSettings } from "@/lib/settings";

import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureSearchId(searchId?: number): Promise<number> {
  if (searchId) return searchId;
  const [fallback] = await db
    .select({ id: searches.id })
    .from(searches)
    .limit(1);
  if (fallback) return fallback.id;
  const [created] = await db
    .insert(searches)
    .values({ sector: "imported", location: "direct" })
    .returning();
  return created.id;
}

// Convert a business into a prospect with all the workflow data
export async function POST(req: Request) {
  let body: {
    businessId?: number;
    quoteTier?: string;
    campaignId?: number;
    // For creating a new business + prospect in one call
    newBusiness?: any;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let business: any = null;

  try {
    if (body.businessId) {
      const [b] = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, body.businessId))
        .limit(1);
      business = b;
    } else if (body.newBusiness) {
      const { searchId, ...data } = body.newBusiness;
      const resolvedSearchId = await ensureSearchId(searchId);
      const [b] = await db
        .insert(businesses)
        .values({ searchId: resolvedSearchId, ...data })
        .returning();
      business = b;
    }
  } catch (dbErr) {
    console.warn("DB unavailable during prospect business query, using local store:", dbErr);
    if (body.newBusiness) {
      const { searchId, ...data } = body.newBusiness;
      business = localStore.addBusiness({ searchId: searchId || 1, ...data });
    }
  }

  if (!business && body.newBusiness) {
    business = localStore.addBusiness(body.newBusiness);
  }

  if (!business) {
    return NextResponse.json(
      { error: "Business not found. Provide businessId or newBusiness." },
      { status: 404 }
    );
  }

  const settings = await getSettings();

  // Fetch campaign language + currency if campaignId provided
  let campaignLanguage = "fr";
  let campaignCurrency = "EUR";
  if (body.campaignId) {
    try {
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, body.campaignId)).limit(1);
      if (campaign?.language) campaignLanguage = campaign.language;
      if (campaign?.currency) campaignCurrency = campaign.currency;
    } catch {}
  }

  const currency = campaignCurrency;
  const quoteAmount = currency === "EUR" ? (settings.priceEUR || 0)
    : currency === "USD" ? (settings.priceUSD || 0)
    : (settings.priceMAD || 0);

  const vibecoderPrompt = generateVibecoderPrompt(business as any, campaignLanguage);
  const whatsappMessages = generateDefaultWhatsAppMessages(business as any);
  const demoHtml = generateDemoSiteHtml(business as any);
  const demoToken = nanoid(24);

  try {
    // Check if prospect already exists in DB
    const [existing] = await db
      .select()
      .from(prospects)
      .where(eq(prospects.businessId, business.id))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(prospects)
        .set({
          vibecoderPrompt,
          whatsappMessages,
          demoHtml,
          demoToken,
          quoteAmount,
          quoteCurrency: currency,
          updatedAt: new Date(),
        })
        .where(eq(prospects.id, existing.id))
        .returning();
      return NextResponse.json({ prospect: updated });
    }

    const [created] = await db
      .insert(prospects)
      .values({
        businessId: business.id,
        campaignId: body.campaignId || null,
        vibecoderPrompt,
        whatsappMessages,
        demoHtml,
        demoToken,
        quoteAmount,
        quoteCurrency: currency,
      })
      .returning();

    // Also sync to local store for fallback
    localStore.addProspect(created);

    return NextResponse.json({ prospect: created });
  } catch (err) {
    console.warn("DB unavailable during prospect insert, saving to local store:", err);
    const createdLocally = localStore.addProspect({
      businessId: business.id,
      campaignId: body.campaignId || null,
      vibecoderPrompt,
      whatsappMessages,
      demoHtml,
      demoToken,
      quoteAmount,
      quoteCurrency: currency,
    });
    return NextResponse.json({ prospect: createdLocally });
  }
}

// Get all prospects
export async function GET() {
  try {
    const rows = await db
      .select({
        prospect: prospects,
        business: businesses,
      })
      .from(prospects)
      .innerJoin(businesses, eq(prospects.businessId, businesses.id))
      .orderBy(desc(prospects.updatedAt))
      .limit(50);
    if (rows.length > 0) {
      return NextResponse.json({ prospects: rows });
    }
  } catch (err) {
    console.warn("DB query failed in GET /api/prospects, reading from local store:", err);
  }

  const localRows = localStore.getProspects();
  return NextResponse.json({ prospects: localRows });
}
