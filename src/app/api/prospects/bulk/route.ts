import { NextResponse } from "next/server";
import { localStore } from "@/lib/local-store";
import {
  generateVibecoderPrompt,
  generateDefaultWhatsAppMessages,
  detectProspectCurrency,
} from "@/lib/prompt-generator";
import { generateDemoSiteHtml } from "@/lib/site-generator";
import { nanoid } from "nanoid";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      businesses,
      campaignId,
      quoteTier = "pro",
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
      quoteTier?: string;
    } = body;

    if (!Array.isArray(businesses) || businesses.length === 0) {
      return NextResponse.json(
        { error: "Aucune entreprise fournie" },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    const created: Array<{ id: number; name: string }> = [];
    const errors: Array<{ name: string; error: string }> = [];

    for (const biz of businesses) {
      try {
        if (!biz.name) {
          errors.push({ name: "?", error: "Nom manquant" });
          continue;
        }

        // Detect currency from business location
        const currency = detectProspectCurrency(biz.country || null, biz.city || null);
        const quoteAmount = currency === "EUR" ? (settings.priceEUR || 0)
          : currency === "USD" ? (settings.priceUSD || 0)
          : (settings.priceMAD || 0);

        // Create business in local store
        const business = localStore.addBusiness({
          searchId: 1,
          name: biz.name,
          category: biz.category || null,
          subcategory: biz.subcategory || null,
          address: biz.address || null,
          phone: biz.phone || null,
          email: biz.email || null,
          website: biz.website || null,
          city: biz.city || null,
          postcode: biz.postcode || null,
          country: biz.country || "France",
          rating: biz.rating || null,
          description: biz.description || null,
          latitude: biz.latitude || null,
          longitude: biz.longitude || null,
          source: biz.source || "search",
        });

        // Generate workflow data
        const vibecoderPrompt = generateVibecoderPrompt(business as any);
        const whatsappMessages = generateDefaultWhatsAppMessages(business as any);
        const demoHtml = generateDemoSiteHtml(business as any);
        const demoToken = nanoid(24);

        // Create prospect
        const prospect = localStore.addProspect({
          businessId: business.id,
          campaignId: campaignId || null,
          workflowStage: "discovered",
          vibecoderPrompt,
          whatsappMessages,
          demoHtml,
          demoToken,
          quoteAmount,
          quoteCurrency: currency,
        });

        created.push({ id: prospect.id, name: biz.name });
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
