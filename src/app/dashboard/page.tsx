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
    <div className="min-h-screen" style={{ background: "#F8FAFC", position: "relative", overflow: "hidden" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle,rgba(26,86,219,.04) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
      <div className="relative z-10 mx-auto max-w-[1380px] px-6 py-10 lg:px-8">
        {campaign && (
          <div className="mb-6 flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[rgba(37,99,235,.2)] bg-white p-4" style={{ boxShadow: "0 2px 7px rgba(37,99,235,.06)" }}>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xl">📋</span>
              <div>
                <p className="font-semibold text-[#0F172A]">Vous prospectez pour « {campaign.name} »</p>
                {campaign.sector && campaign.location && (
                  <p className="text-xs text-[#475569]">{campaign.sector} à {campaign.location}</p>
                )}
              </div>
            </div>
            <Link href={`/campaigns/${campaign.id}`} className="rounded-lg bg-[#E8622A] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#d4561f]" style={{ boxShadow: "0 6px 22px rgba(232,98,42,.35)" }}>
              Voir la campagne
            </Link>
          </div>
        )}

        <header className="mb-8">
          <div className="mb-6 flex items-center gap-2">
            <div className="h-[2px] w-6 rounded bg-[#E8622A]" />
            <span className="text-[11px] font-bold uppercase tracking-[2px] text-[#E8622A]">Dashboard</span>
          </div>
          <div className="flex items-center gap-4 mb-8">
            <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: "linear-gradient(135deg, #2563EB, #3B82F6)", boxShadow: "0 8px 24px rgba(37,99,235,.3)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[#0F172A] sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1.5, lineHeight: 1.1 }}>Trouvez · Vibecodez · Vendez</h1>
              <p className="mt-1 text-sm text-[#64748B]">Bing Maps + OpenStreetMap · Workflow WhatsApp automatisé</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <KPICard label="Prospects créés" value={totalProspectsCount} icon="🎯" tone="blue" />
            <KPICard label="Ventes conclues" value={totalPaidCount} icon="✅" tone="green" subtitle={`${conversionRate}% conversion`} />
            <KPICard label="CA généré" value={revenueDisplay} icon="💰" tone="orange" subtitle={`${totalPaidCount} vente${totalPaidCount > 1 ? "s" : ""}`} breakdown={breakdown} />
          </div>
        </header>

        <section className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8" style={{ boxShadow: "0 2px 7px rgba(0,0,0,.04)" }}>
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #2563EB, #3B82F6)" }} />
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
