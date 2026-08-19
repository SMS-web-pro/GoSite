import Link from "next/link";
import { db } from "@/db";
import { campaigns, prospects, businesses } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import CampaignsList from "./CampaignsList";
import { localStore } from "@/lib/local-store";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  let rows: Array<{ campaign: typeof campaigns.$inferSelect; prospectCount: number }> = [];
  try {
    rows = await db
      .select({
        campaign: campaigns,
        prospectCount: sql<number>`count(${prospects.id})::int`,
      })
      .from(campaigns)
      .leftJoin(prospects, eq(prospects.campaignId, campaigns.id))
      .groupBy(campaigns.id)
      .orderBy(desc(campaigns.createdAt))
      .limit(50);
  } catch {
    // DB unavailable, use local store
  }

  if (rows.length === 0) {
    const localCampaigns = localStore.getCampaigns();
    const localProspects = localStore.getProspects();
    rows = localCampaigns.map((c: any) => ({
      campaign: c,
      prospectCount: localProspects.filter((p: any) => p.prospect?.campaignId === c.id).length,
    }));
  }

  // Aggregate stats
  let totalProspectsCount = 0;
  try {
    const totalProspects = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(prospects);
    totalProspectsCount = totalProspects[0]?.count || 0;
  } catch {
    totalProspectsCount = localStore.getProspects().length;
  }
  const totalCampaigns = rows.length;

  return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
              </svg>
              Accueil
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">📋 Campagnes de prospection</h1>
            <p className="text-sm text-slate-600">
              {totalCampaigns} campagne{totalCampaigns > 1 ? "s" : ""} · {totalProspectsCount} prospect{totalProspectsCount !== 1 ? "s" : ""} au total
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/settings"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ⚙️ Paramètres
            </Link>
            <Link
              href="/analytics"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              📊 Analytics
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Nouvelle recherche
            </Link>
          </div>
        </div>
        <CampaignsList items={rows} />
      </div>
  );
}
