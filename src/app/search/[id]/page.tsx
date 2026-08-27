import { notFound } from "next/navigation";
import { db } from "@/db";
import { searches, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import SearchClient from "../SearchClient";

export const dynamic = "force-dynamic";

export default async function SearchResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const searchId = parseInt(id, 10);
  if (Number.isNaN(searchId)) notFound();

  const [search] = await db
    .select()
    .from(searches)
    .where(eq(searches.id, searchId))
    .limit(1);
  if (!search) notFound();

  const results = await db
    .select()
    .from(businesses)
    .where(eq(businesses.searchId, searchId));

  return (
    <SearchClient
      sector={search.sector}
      location={search.location}
      initialResults={results.map((r) => ({
        name: r.name,
        category: r.category,
        subcategory: r.subcategory,
        osmType: r.osmType,
        osmId: r.osmId != null ? Number(r.osmId) : null,
        wikidataId: r.wikidataId,
        wikipedia: r.wikipedia,
        address: r.address,
        housenumber: r.housenumber,
        popularity: null,
        street: r.street,
        neighbourhood: r.neighbourhood,
        suburb: r.suburb,
        postcode: r.postcode,
        city: r.city,
        state: r.state,
        country: r.country,
        phone: r.phone,
        mobile: r.mobile,
        email: r.email,
        website: r.website,
        facebook: r.facebook,
        twitter: r.twitter,
        instagram: r.instagram,
        linkedin: r.linkedin,
        youtube: r.youtube,
        openingHours: r.openingHours,
        cuisine: r.cuisine,
        description: r.description,
        wheelchair: r.wheelchair,
        wifi: r.wifi,
        takeaway: r.takeaway,
        delivery: r.delivery,
        outdoorSeating: r.outdoorSeating,
        smoking: r.smoking,
        reservation: r.reservation,
        parking: r.parking,
        airConditioning: r.airConditioning,
        paymentCash: r.paymentCash,
        paymentCard: r.paymentCard,
        capacity: r.capacity,
        stars: r.stars,
        latitude: r.latitude,
        longitude: r.longitude,
        bingUrl: r.bingUrl,
        osmUrl: r.osmUrl,
        googleMapsUrl: r.googleMapsUrl,
        rating: r.rating,
        reviewsCount: r.reviewsCount,
        source: r.source,
        extraTags: r.extraTags,
        detailCount: 0,
      }))}
    />
  );
}
