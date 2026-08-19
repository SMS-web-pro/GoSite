import { NextResponse } from "next/server";
import { db } from "@/db";
import { searches, businesses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { scrapeBusinesses } from "@/lib/scraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Match the hard timeout below

export async function POST(req: Request) {
  let body: { sector?: string; location?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const sector = (body.sector || "").trim();
  const location = (body.location || "").trim();

  if (!sector || !location) {
    return NextResponse.json(
      { error: "Veuillez renseigner le secteur et la localisation." },
      { status: 400 }
    );
  }

  if (sector.length > 255 || location.length > 255) {
    return NextResponse.json(
      { error: "Les valeurs sont trop longues." },
      { status: 400 }
    );
  }

  let inserted: { id: number } | null = null;
  try {
    const [row] = await db
      .insert(searches)
      .values({ sector, location, status: "running" })
      .returning();
    inserted = row;
  } catch (dbErr) {
    console.warn("Database unavailable during search insert, continuing in-memory:", dbErr);
    inserted = { id: Date.now() };
  }

  // Hard timeout: never let the scraper run more than 60s
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 60_000);

  // Race the scraper against the timeout, so we always return a response
  const scrapePromise = scrapeBusinesses(sector, location, {
    signal: timeoutController.signal,
  });
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutController.signal.addEventListener("abort", () => {
      reject(new Error("Le scraping a pris trop de temps (60s)."));
    });
  });

  try {
    const { businesses: results, sources, note, total, enriched } =
      await Promise.race([scrapePromise, timeoutPromise]);
    clearTimeout(timeoutId);

    // Insert in batches of 50 to avoid huge SQL if DB is up
    try {
      const batchSize = 50;
      for (let i = 0; i < results.length; i += batchSize) {
        const batch = results.slice(i, i + batchSize);
        await db.insert(businesses).values(
          batch.map((b) => ({
            searchId: inserted!.id,
            name: b.name,
            category: b.category,
            subcategory: b.subcategory,
            osmType: b.osmType,
            osmId: b.osmId,
            wikidataId: b.wikidataId,
            wikipedia: b.wikipedia,
            address: b.address,
            street: b.street,
            housenumber: b.housenumber,
            neighbourhood: b.neighbourhood,
            suburb: b.suburb,
            postcode: b.postcode,
            city: b.city,
            state: b.state,
            country: b.country,
            phone: b.phone,
            mobile: b.mobile,
            email: b.email,
            website: b.website,
            facebook: b.facebook,
            twitter: b.twitter,
            instagram: b.instagram,
            linkedin: b.linkedin,
            youtube: b.youtube,
            openingHours: b.openingHours,
            cuisine: b.cuisine,
            description: b.description,
            wheelchair: b.wheelchair,
            wifi: b.wifi,
            takeaway: b.takeaway,
            delivery: b.delivery,
            outdoorSeating: b.outdoorSeating,
            smoking: b.smoking,
            reservation: b.reservation,
            parking: b.parking,
            airConditioning: b.airConditioning,
            paymentCash: b.paymentCash,
            paymentCard: b.paymentCard,
            capacity: b.capacity,
            stars: b.stars,
            latitude: b.latitude,
            longitude: b.longitude,
            bingUrl: b.bingUrl,
            osmUrl: b.osmUrl,
            googleMapsUrl: b.googleMapsUrl,
            rating: b.rating,
            reviewsCount: b.reviewsCount,
            source: b.source,
            extraTags: b.extraTags,
          }))
        );
      }

      await db
        .update(searches)
        .set({
          status: "completed",
          resultsCount: results.length,
          error: null,
        })
        .where(eq(searches.id, inserted.id));
    } catch (saveErr) {
      console.warn("Could not save scraped businesses to DB:", saveErr);
    }

    return NextResponse.json({
      searchId: inserted.id,
      sector,
      location,
      count: results.length,
      total,
      enriched,
      sources,
      note,
      results,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    try {
      await db
        .update(searches)
        .set({ status: "failed", error: message })
        .where(eq(searches.id, inserted.id));
    } catch {}
    return NextResponse.json(
      { error: message, searchId: inserted.id },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(searches)
      .orderBy(desc(searches.createdAt))
      .limit(20);
    return NextResponse.json({ searches: rows });
  } catch (err) {
    console.warn("Failed to fetch searches from DB:", err);
    return NextResponse.json({ searches: [] });
  }
}
