import { Suspense } from "react";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { eq } from "drizzle-orm";
import SearchClient from "./SearchClient";

export const dynamic = "force-dynamic";

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; location?: string; campaignId?: string }>;
}) {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchClientInner searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchClientInner({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; location?: string; campaignId?: string }>;
}) {
  const sp = await searchParams;
  const cid = sp.campaignId ? Number(sp.campaignId) : undefined;
  let initialCampaign: { id: number; name: string } | null = null;
  if (cid) {
    const [c] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, cid))
      .limit(1)
      .catch(() => []);
    if (c) initialCampaign = { id: c.id, name: c.name };
  }
  return (
    <SearchClient
      sector={sp.sector || ""}
      location={sp.location || ""}
      campaignId={cid}
      initialCampaign={initialCampaign}
    />
  );
}

function SearchSkeleton() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50">
      <div className="text-sm text-slate-500">Chargement…</div>
    </main>
  );
}
