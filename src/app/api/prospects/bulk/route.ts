import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, prospects, searches, campaigns } from "@/db/schema";
import {
  generateVibecoderPrompt,
  generateDefaultWhatsAppMessages,
  detectProspectCurrency,
} from "@/lib/prompt-generator";
import { generateDemoSiteHtml } from "@/lib/site-generator";
import { nanoid } from "nanoid";
import { getSettings } from "@/lib/settings";
import { localStore } from "@/lib/local-store";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      businesses: bizList,
      campaignId,
    }: {
      businesses: Array<{
        name: string;
        category?: string | null;
        subcategory?: string | null;
        address?: string | null;
        phone?: string | null;
        email?: string | null;
        website?: string | null;
        city?: string | null;
        postcode?: string | null;
        country?: string | null;
        rating?: string | null;
        description?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        source?: string | null;
        [key: string]: any;
      }>;
      campaignId?: number;
    } = body;

    if (!Array.isArray(bizList) || bizList.length === 0) {
      return NextResponse.json(
        { error: "Aucune entreprise fournie" },
        { status: 400 }
      );
    }

    const settings = await getSettings();

    // Fetch campaign info if campaignId provided
    let campaignLanguage = "fr";
    let campaignCurrency: string | null = null;
    let campaignLocation: string | null = null;

    if (campaignId) {
      try {
        const [c] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
        if (c) {
          if (c.language) campaignLanguage = c.language;
          if (c.currency) campaignCurrency = c.currency;
          if (c.location) campaignLocation = c.location;
        }
      } catch {
        const localCampaign = localStore.getCampaignById(campaignId);
        if (localCampaign) {
          if (localCampaign.language) campaignLanguage = localCampaign.language;
          if (localCampaign.currency) campaignCurrency = localCampaign.currency;
          if (localCampaign.location) campaignLocation = localCampaign.location;
        }
      }
    }

    const created: Array<{ id: number; name: string }> = [];
    const errors: Array<{ name: string; error: string }> = [];

    // Attempt DB insertion first
    let dbAvailable = true;
    let singleSearchId: number | null = null;

    try {
      // Create a SINGLE search entry in DB for the whole batch
      const [search] = await db
        .insert(searches)
        .values({
          sector: "Import de prospects",
          location: campaignLocation || "Multi-localités",
          status: "completed",
          resultsCount: bizList.length,
        })
        .returning();
      singleSearchId = search.id;
    } catch {
      dbAvailable = false;
    }

    for (const biz of bizList) {
      try {
        if (!biz.name) {
          errors.push({ name: "?", error: "Nom manquant" });
          continue;
        }

        const effectiveCountry = biz.country || (campaignLocation?.includes(",") ? campaignLocation.split(",").pop()?.trim() : null) || null;
        const currency = campaignCurrency || detectProspectCurrency(effectiveCountry, biz.city || null);
        const quoteAmount = currency === "EUR" ? (settings.priceEUR || 89900)
          : currency === "USD" ? (settings.priceUSD || 99900)
          : (settings.priceMAD || 99900);

        if (dbAvailable && singleSearchId) {
          // Create business in DB
          const [business] = await db
            .insert(businesses)
            .values({
              searchId: singleSearchId,
              name: biz.name,
              category: biz.category || null,
              subcategory: biz.subcategory || null,
              address: biz.address || null,
              phone: biz.phone || null,
              email: biz.email || null,
              website: biz.website || null,
              city: biz.city || null,
              postcode: biz.postcode || null,
              country: effectiveCountry,
              rating: biz.rating || null,
              description: biz.description || null,
              latitude: biz.latitude ? String(biz.latitude) : null,
              longitude: biz.longitude ? String(biz.longitude) : null,
              source: biz.source || "bulk_import",
            })
            .returning();

          // Generate workflow data
          const vibecoderPrompt = generateVibecoderPrompt(business as any, campaignLanguage);
          const whatsappMessages = generateDefaultWhatsAppMessages(business as any);
          const demoHtml = generateDemoSiteHtml(business as any);
          const demoToken = nanoid(24);

          // Create prospect in DB
          const [prospect] = await db
            .insert(prospects)
            .values({
              businessId: business.id,
              campaignId: campaignId || null,
              workflowStage: "discovered",
              vibecoderPrompt,
              whatsappMessages,
              demoHtml,
              demoToken,
              quoteAmount,
              quoteCurrency: currency,
            })
            .returning();

          // Also sync to localStore
          localStore.addBusiness(business);
          localStore.addProspect({
            ...prospect,
            businessId: business.id,
          });

          created.push({ id: prospect.id, name: biz.name });
        } else {
          // LocalStore fallback
          const newBiz = localStore.addBusiness({
            name: biz.name,
            category: biz.category || null,
            subcategory: biz.subcategory || null,
            address: biz.address || null,
            phone: biz.phone || null,
            email: biz.email || null,
            website: biz.website || null,
            city: biz.city || null,
            country: effectiveCountry,
            rating: biz.rating || null,
            description: biz.description || null,
            source: biz.source || "bulk_import",
          });

          const vibecoderPrompt = generateVibecoderPrompt(newBiz as any, campaignLanguage);
          const whatsappMessages = generateDefaultWhatsAppMessages(newBiz as any);
          const demoHtml = generateDemoSiteHtml(newBiz as any);

          const newProspect = localStore.addProspect({
            businessId: newBiz.id,
            campaignId: campaignId || null,
            workflowStage: "discovered",
            vibecoderPrompt,
            whatsappMessages,
            demoHtml,
            quoteAmount,
            quoteCurrency: currency,
          });

          created.push({ id: newProspect.id, name: biz.name });
        }
      } catch (e) {
        errors.push({ name: biz.name, error: e instanceof Error ? e.message : "Erreur inconnue" });
      }
    }

    return NextResponse.json({
      ok: true,
      imported: created.length,
      errors: errors.length,
      details: { inserted: created, errors },
    });
  } catch (err) {
    console.error("Bulk prospect error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la prospection en masse" },
      { status: 500 }
    );
  }
}
