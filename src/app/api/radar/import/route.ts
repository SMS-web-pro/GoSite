import { NextResponse } from "next/server";
import { db } from "@/db";
import { prospects, businesses, campaigns } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  generateVibecoderPrompt,
  generateDefaultWhatsAppMessages,
} from "@/lib/prompt-generator";
import { generateDemoSiteHtml } from "@/lib/site-generator";
import { nanoid } from "nanoid";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RadarBusiness {
  name: string;
  category: string;
  address: string;
  phone: string | null;
  zone: string;
  rating: number | null;
  reviewCount: number;
  reviews: Array<{ author: string; rating: number; text: string; relativeTime: string; publishTime: string | null }>;
  services: string[];
  photoUrl: string | null;
  websiteUri: string | null;
  hours: string[];
  lat: number | null;
  lng: number | null;
  mapsUrl: string;
  description: string;
  web?: {
    emails?: string[];
    socials?: string[];
  };
}

interface RadarImportBody {
  campaign: {
    name: string;
    sector?: string;
    location?: string;
    language?: string;
    currency?: string;
  };
  prospects: RadarBusiness[];
}

function mapRadarBusinessToDb(rb: RadarBusiness) {
  const addressParts = rb.address ? rb.address.split(",").map((s) => s.trim()) : [];
  const street = addressParts.length > 0 ? addressParts[0] : null;
  const city = addressParts.length > 1 ? addressParts[addressParts.length - 1] : null;

  return {
    name: rb.name,
    category: rb.category || null,
    subcategory: rb.category || null,
    address: rb.address || null,
    street,
    city,
    country: null,
    phone: rb.phone || null,
    email: rb.web?.emails?.[0] || null,
    website: rb.websiteUri || null,
    openingHours: rb.hours?.join("\n") || null,
    rating: rb.rating !== null ? String(rb.rating) : null,
    reviewsCount: rb.reviewCount || 0,
    description: rb.description || null,
    latitude: rb.lat !== null ? String(rb.lat) : null,
    longitude: rb.lng !== null ? String(rb.lng) : null,
    googleMapsUrl: rb.mapsUrl || null,
    photos: rb.photoUrl ? [rb.photoUrl] : null,
    reviews: rb.reviews?.map((r) => ({
      author: r.author,
      rating: r.rating,
      text: r.text,
      time: r.publishTime || r.relativeTime,
    })) || null,
    services: rb.services?.join(", ") || null,
    facebook: rb.web?.socials?.find((s) => s.includes("facebook.com")) || null,
    instagram: rb.web?.socials?.find((s) => s.includes("instagram.com")) || null,
    twitter: rb.web?.socials?.find((s) => s.includes("twitter.com") || s.includes("x.com")) || null,
    source: "radar" as const,
  };
}

export async function POST(req: Request) {
  let body: RadarImportBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!body.campaign?.name) {
    return NextResponse.json({ error: "Le nom de la campagne est requis" }, { status: 400 });
  }

  if (!body.prospects?.length) {
    return NextResponse.json({ error: "Aucun prospect fourni" }, { status: 400 });
  }

  const language = body.campaign.language || "fr";
  const currency = body.campaign.currency || (language === "en" ? "USD" : language === "ar" ? "MAD" : "EUR");

  let campaignId: number;

  try {
    const [created] = await db
      .insert(campaigns)
      .values({
        name: body.campaign.name,
        sector: body.campaign.sector || body.campaign.name,
        location: body.campaign.location || null,
        language,
        currency,
        status: "active",
      })
      .returning();
    campaignId = created.id;
  } catch (err) {
    console.error("Failed to create campaign:", err);
    return NextResponse.json({ error: "Erreur lors de la création de la campagne" }, { status: 500 });
  }

  const settings = await getSettings();
  const depositAmount =
    currency === "EUR"
      ? (settings as any).depositPriceEUR || 9900
      : currency === "USD"
        ? (settings as any).depositPriceUSD || 9900
        : (settings as any).depositPriceMAD || 99000;
  const finalAmount =
    currency === "EUR"
      ? (settings as any).finalPriceEUR || 15000
      : currency === "USD"
        ? (settings as any).finalPriceUSD || 15000
        : (settings as any).finalPriceMAD || 150000;
  const totalAmount = depositAmount + finalAmount;

  const inserted: Array<{ id: number; name: string }> = [];
  const errors: Array<{ name: string; error: string }> = [];

  for (const rb of body.prospects) {
    try {
      const businessData = mapRadarBusinessToDb(rb);

      let businessId: number;
      const [b] = await db
        .insert(businesses)
        .values(businessData)
        .returning();
      businessId = b.id;

      const vibecoderPrompt = generateVibecoderPrompt(businessData as any, language);
      const whatsappMessages = generateDefaultWhatsAppMessages(businessData as any);
      const demoHtml = generateDemoSiteHtml(businessData as any);
      const demoToken = nanoid(24);

      const [prospect] = await db
        .insert(prospects)
        .values({
          businessId,
          campaignId,
          workflowStage: "discovered",
          vibecoderPrompt,
          whatsappMessages,
          demoHtml,
          demoToken,
          quoteAmount: totalAmount,
          quoteCurrency: currency,
          totalAmount,
          depositAmount,
          finalAmount,
          depositStatus: "pending",
          finalPaymentStatus: "pending",
        })
        .returning();

      inserted.push({ id: prospect.id, name: rb.name });
    } catch (err) {
      errors.push({ name: rb.name, error: err instanceof Error ? err.message : "Erreur inconnue" });
    }
  }

  return NextResponse.json({
    ok: true,
    campaignId,
    imported: inserted.length,
    errors: errors.length,
    details: { inserted, errors },
  });
}
