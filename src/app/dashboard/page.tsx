import Link from "next/link";
import { db } from "@/db";
import { searches, prospects, businesses } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import SearchForm from "@/components/SearchForm";
import HomeClient from "./HomeClient";
import { localStore } from "@/lib/local-store";
import { getSettings } from "@/lib/settings";
import { detectProspectCurrency, formatPrice } from "@/lib/prompt-generator";
import { KPICard } from "@/components/KPICard";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; location?: string; campaignId?: string }>;
}) {
  let totalProspectsCount = 0;
  let totalPaidCount = 0;
  let revenueByCurrency = { eur: 0, usd: 0, mad: 0 };

  try {
    await db.execute("select 1" as never);
    const saleStages = ["paid", "delivered", "completed"];
    const [prospectCount] = await db.select({ count: sql<number>`count(*)::int` }).from(prospects);

    const allProspectRows = await db
      .select({ prospect: prospects, business: businesses })
      .from(prospects)
      .innerJoin(businesses, eq(prospects.businessId, businesses.id));

    totalProspectsCount = prospectCount?.count || 0;
    totalPaidCount = allProspectRows.filter(
      (row: any) => row.prospect.paymentStatus === "paid" || saleStages.includes(row.prospect.workflowStage)
    ).length;

    const settings = await getSettings();
    for (const row of allProspectRows) {
      const p = row.prospect as any;
      if (p.paymentStatus !== "paid" && !saleStages.includes(p.workflowStage)) continue;
      const curr = p.quoteCurrency || detectProspectCurrency(row.business.country || null, row.business.city || null);
      const amount = p.paymentAmount || p.quoteAmount || (curr === "EUR" ? (settings.priceEUR || 0) : curr === "USD" ? (settings.priceUSD || 0) : (settings.priceMAD || 0));
      if (curr === "EUR") revenueByCurrency.eur += amount;
      else if (curr === "USD") revenueByCurrency.usd += amount;
      else revenueByCurrency.mad += amount;
    }
  } catch {
    const data = localStore.get();
    const allProspects = data.prospects || [];
    const allBusinesses = data.businesses || [];
    const settings = await getSettings();
    const saleStages = ["paid", "delivered", "completed"];

    totalProspectsCount = allProspects.length;
    totalPaidCount = allProspects.filter(
      (p: any) => p.paymentStatus === "paid" || saleStages.includes((p as any).workflowStage)
    ).length;

    for (const p of allProspects) {
      if ((p as any).paymentStatus !== "paid" && !saleStages.includes((p as any).workflowStage)) continue;
      const biz = allBusinesses.find((b: any) => b.id === (p as any).businessId);
      const curr = (p as any).quoteCurrency || detectProspectCurrency(biz?.country || null, biz?.city || null);
      const amount = (p as any).paymentAmount || (p as any).quoteAmount || (curr === "EUR" ? (settings.priceEUR || 0) : curr === "USD" ? (settings.priceUSD || 0) : (settings.priceMAD || 0));
      if (curr === "EUR") revenueByCurrency.eur += amount;
      else if (curr === "USD") revenueByCurrency.usd += amount;
      else revenueByCurrency.mad += amount;
    }
  }

  // Exchange rates for total USD display
  const EUR_TO_USD = 1.08;
  const MAD_TO_USD = 0.10;
  const totalInUSD = revenueByCurrency.eur * EUR_TO_USD + revenueByCurrency.usd + revenueByCurrency.mad * MAD_TO_USD;
  const revenueDisplay = totalInUSD > 0 ? formatPrice(Math.round(totalInUSD), "USD") : "$0.00";

  const breakdown: { label: string; value: string | number }[] = [];
  if (revenueByCurrency.usd > 0) breakdown.push({ label: "$", value: formatPrice(revenueByCurrency.usd, "USD") });
  if (revenueByCurrency.eur > 0) breakdown.push({ label: "€", value: formatPrice(revenueByCurrency.eur, "EUR") });
  if (revenueByCurrency.mad > 0) breakdown.push({ label: "MAD", value: formatPrice(revenueByCurrency.mad, "MAD") });

  const conversionRate = totalProspectsCount > 0 ? ((totalPaidCount / totalProspectsCount) * 100).toFixed(1) : "0";

  const sp = await searchParams;
  const campaignId = sp.campaignId ? Number(sp.campaignId) : undefined;
  let campaign: { id: number; name: string; sector: string | null; location: string | null } | null = null;
  if (campaignId) {
    const { campaigns } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const [c] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1)
      .catch(() => []);
    campaign = c || null;
  }

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        {campaign && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xl">📋</span>
              <div>
                <p className="font-semibold text-blue-900">Vous prospectez pour « {campaign.name} »</p>
                {campaign.sector && campaign.location && (
                  <p className="text-xs text-blue-700">{campaign.sector} à {campaign.location}</p>
                )}
              </div>
            </div>
            <Link href={`/campaigns/${campaign.id}`} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
              Voir la campagne
            </Link>
          </div>
        )}

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">GoSite Digital Agency</p>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Trouvez · Vibecodez · Vendez</h1>
              <p className="text-xs text-slate-500">Bing Maps + OpenStreetMap · Workflow WhatsApp automatisé</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 mb-6">
            <KPICard label="Prospects créés" value={totalProspectsCount} icon="🎯" tone="blue" />
            <KPICard label="Ventes conclues" value={totalPaidCount} icon="✅" tone="emerald" subtitle={`${conversionRate}% conversion`} />
            <KPICard label="CA généré" value={revenueDisplay} icon="💰" tone="amber" subtitle={`${totalPaidCount} vente${totalPaidCount > 1 ? "s" : ""}`} breakdown={breakdown} />
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:p-8">
          <SearchForm
            initialCampaignId={campaignId}
            initialSector={campaign?.sector || ""}
            initialLocation={campaign?.location || ""}
          />
        </section>

        <HomeClient />
      </div>
    </div>
  );
}
