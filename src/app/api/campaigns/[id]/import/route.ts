import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, prospects, campaigns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import {
  generateVibecoderPrompt,
  generateDefaultWhatsAppMessages,
} from "@/lib/prompt-generator";
import { generateDemoSiteHtml } from "@/lib/site-generator";
import { nanoid } from "nanoid";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImportedRow = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  website?: string;
  category?: string;
  subcategory?: string;
  rating?: string;
  description?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  openingHours?: string;
  cuisine?: string;
};

function parseCSV(text: string): string[][] {
  const firstLine = text.split(/\r?\n/)[0] || "";
  let delim = ",";
  if (firstLine.includes("\t")) delim = "\t";
  else if (firstLine.includes(";")) delim = ";";

  const rows: string[][] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  for (const line of lines) {
    const row: string[] = [];
    let cur = "";
    let inQuotes = false;
    let i = 0;
    while (i < line.length) {
      const ch = line[i];
      if (ch === '"' && inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 2;
        continue;
      }
      if (ch === '"') {
        inQuotes = !inQuotes;
        i++;
        continue;
      }
      if (ch === delim && !inQuotes) {
        row.push(cur.trim());
        cur = "";
        i++;
        continue;
      }
      cur += ch;
      i++;
    }
    row.push(cur.trim());
    rows.push(row);
  }
  return rows;
}

function detectColumns(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  const patterns: Record<string, RegExp[]> = {
    name: [/^name$/i, /nom/i, /business/i, /entreprise/i, /societe/i, /raison/i, /company/i],
    phone: [/phone/i, /tel/i, /téléphone/i, /telephone/i, /mobile/i, /num/i],
    email: [/^email$/i, /e-?mail/i, /courriel/i, /mail/i],
    address: [/^address$/i, /^adresse$/i, /full.?address/i],
    street: [/street/i, /rue/i, /avenue/i, /boulevard/i, /road/i],
    city: [/city$/i, /ville$/i, /town/i, /municipality/i],
    state: [/state/i, /province/i, /region/i, /département/i, /dept/i],
    postcode: [/postcode/i, /zip/i, /postal/i, /code.?postale/i],
    country: [/country/i, /pays/i, /nation/i],
    website: [/website/i, /site/i, /url(?!\.)/i, /web(?!site)/i, /http/i],
    category: [/category/i, /catégorie/i, /categorie/i, /type/i, /secteur/i, /activity/i, /activité/i, /industry/i],
    subcategory: [/subcategory/i, /sub.?category/i, /spécialité/i, /specialite/i, /niche/i],
    rating: [/rating/i, /note/i, /stars/i, /etoile/i, /étoile/i, /avis/i],
    description: [/description/i, /desc/i, /comment/i, /commentaire/i, /about/i],
    facebook: [/facebook/i, /fb/i],
    instagram: [/instagram/i, /insta/i],
    twitter: [/twitter/i, /tweet/i],
    linkedin: [/linkedin/i],
    youtube: [/youtube/i],
    openingHours: [/hours/i, /horaires/i, /opening/i, /ouverture/i],
    cuisine: [/cuisine/i, /type.?food/i, /food.?type/i],
  };
  headers.forEach((h, i) => {
    for (const [field, regs] of Object.entries(patterns)) {
      if (map[field] !== undefined) continue;
      if (regs.some((r) => r.test(h))) {
        map[field] = i;
        break;
      }
    }
  });
  return map;
}

function normalizePhone(p: string | undefined): string | null {
  if (!p) return null;
  const trimmed = p.trim();
  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    return digits.length >= 7 ? `+${digits}` : null;
  }
  if (trimmed.startsWith("00")) {
    const digits = trimmed.replace(/\D/g, "").slice(2);
    return digits.length >= 7 ? `+${digits}` : null;
  }
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 ? `+${digits}` : null;
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const campaignId = parseInt(id, 10);
    if (Number.isNaN(campaignId)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    // Verify campaign exists in DB
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const body = await req.json();
    const text: string = (body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Aucun contenu à importer" }, { status: 400 });
    }

    const rows = parseCSV(text);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Aucune ligne trouvée" }, { status: 400 });
    }

    const skipHeader = body.skipHeader !== false;
    const startIdx = skipHeader ? 1 : 0;
    const headers = skipHeader ? rows[0] : rows[0].map((_, i) => `col${i}`);
    const colMap = detectColumns(headers);

    if (colMap.name === undefined) {
      return NextResponse.json(
        {
          error:
            "Colonne 'Nom' introuvable. Assurez-vous que votre fichier a une colonne 'Nom', 'Name', 'Entreprise' ou 'Business'.",
          detectedColumns: colMap,
          headers: headers,
        },
        { status: 400 }
      );
    }

    const settings = await getSettings();

    const imported: ImportedRow[] = [];
    const errors: Array<{ row: number; error: string; data: string[] }> = [];

    for (let i = startIdx; i < rows.length; i++) {
      const row = rows[i];
      const name = row[colMap.name]?.trim();
      if (!name) {
        errors.push({ row: i + 1, error: "Nom vide", data: row });
        continue;
      }
      const phone = normalizePhone(row[colMap.phone ?? -1]);
      if (!phone) {
        errors.push({ row: i + 1, error: "Téléphone vide ou invalide", data: row });
        continue;
      }
      imported.push({
        name,
        phone,
        email: row[colMap.email ?? -1]?.trim() || undefined,
        address: row[colMap.address ?? -1]?.trim() || undefined,
        street: row[colMap.street ?? -1]?.trim() || undefined,
        city: row[colMap.city ?? -1]?.trim() || undefined,
        state: row[colMap.state ?? -1]?.trim() || undefined,
        postcode: row[colMap.postcode ?? -1]?.trim() || undefined,
        country: row[colMap.country ?? -1]?.trim() || undefined,
        website: row[colMap.website ?? -1]?.trim() || undefined,
        category: row[colMap.category ?? -1]?.trim() || undefined,
        subcategory: row[colMap.subcategory ?? -1]?.trim() || undefined,
        rating: row[colMap.rating ?? -1]?.trim() || undefined,
        description: row[colMap.description ?? -1]?.trim() || undefined,
        facebook: row[colMap.facebook ?? -1]?.trim() || undefined,
        instagram: row[colMap.instagram ?? -1]?.trim() || undefined,
        twitter: row[colMap.twitter ?? -1]?.trim() || undefined,
        linkedin: row[colMap.linkedin ?? -1]?.trim() || undefined,
        youtube: row[colMap.youtube ?? -1]?.trim() || undefined,
        openingHours: row[colMap.openingHours ?? -1]?.trim() || undefined,
        cuisine: row[colMap.cuisine ?? -1]?.trim() || undefined,
      });
    }

    if (imported.length === 0) {
      return NextResponse.json(
        { error: "Aucun prospect valide à importer", errors },
        { status: 400 }
      );
    }

    // Insert into DB
    const inserted: Array<{ id: number; name: string; phone: string }> = [];
    for (const row of imported) {
      try {
        // Parse address parts if address is provided but individual fields are missing
        const addressParts = row.address?.split(",").map((s) => s.trim()) || [];
        const street = row.street || addressParts[0] || null;
        const postcode = row.postcode || (row.address?.match(/\b(\d{5})\b/) || [])[1] || null;
        const city = row.city || (addressParts.length > 1 ? addressParts[addressParts.length - 1] : null);

        // Detect country from various signals
        let country = row.country || null;
        if (!country) {
          // Try to detect from phone number prefix
          const phoneDigits = row.phone?.replace(/\D/g, "") || "";
          if (phoneDigits.startsWith("1") && phoneDigits.length >= 10) country = "USA";
          else if (phoneDigits.startsWith("44")) country = "UK";
          else if (phoneDigits.startsWith("49")) country = "Germany";
          else if (phoneDigits.startsWith("33")) country = "France";
          else if (phoneDigits.startsWith("212")) country = "Morocco";
          else if (phoneDigits.startsWith("213")) country = "Algeria";
          else if (phoneDigits.startsWith("216")) country = "Tunisia";
          else if (phoneDigits.startsWith("971")) country = "UAE";
          else if (phoneDigits.startsWith("966")) country = "Saudi Arabia";
          else country = "France"; // fallback
        }

        // Create the business
        const [business] = await db
          .insert(businesses)
          .values({
            name: row.name,
            phone: row.phone || null,
            email: row.email || null,
            website: row.website || null,
            address: row.address || null,
            street,
            city,
            postcode,
            country,
            category: row.category || null,
            subcategory: row.subcategory || null,
            rating: row.rating || null,
            description: row.description || null,
            facebook: row.facebook || null,
            instagram: row.instagram || null,
            twitter: row.twitter || null,
            linkedin: row.linkedin || null,
            youtube: row.youtube || null,
            openingHours: row.openingHours || null,
            cuisine: row.cuisine || null,
            latitude: null,
            longitude: null,
            source: "manual_import",
          })
          .returning();

        // Generate prompts and demo site
        const vibecoderPrompt = generateVibecoderPrompt(business as any, campaign.language || "fr");
        const whatsappMessages = generateDefaultWhatsAppMessages(business as any);
        const demoHtml = generateDemoSiteHtml(business as any);
        const demoToken = nanoid(24);

        // Use campaign currency (already fetched above)
        const currency = campaign.currency || "EUR";
        const quoteAmount = currency === "EUR" ? (settings.priceEUR || 0)
          : currency === "USD" ? (settings.priceUSD || 0)
          : (settings.priceMAD || 0);

        // Create the prospect
        const [prospect] = await db
          .insert(prospects)
          .values({
            businessId: business.id,
            campaignId,
            workflowStage: "discovered",
            vibecoderPrompt,
            whatsappMessages,
            demoHtml,
            demoToken,
            quoteAmount,
            quoteCurrency: currency,
          })
          .returning();

        inserted.push({ id: prospect.id, name: row.name, phone: row.phone || "" });
      } catch (e) {
        errors.push({ row: inserted.length + 1, error: e instanceof Error ? e.message : "Erreur", data: [] });
      }
    }

    return NextResponse.json({
      ok: true,
      imported: inserted.length,
      errors: errors.length,
      details: { inserted, errors },
    });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'import" },
      { status: 500 }
    );
  }
}
