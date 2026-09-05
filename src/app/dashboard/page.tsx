import Link from "next/link";
import { db } from "@/db";
import { prospects, businesses } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import HomeClient from "./HomeClient";
import { localStore } from "@/lib/local-store";
import { getSettings } from "@/lib/settings";
import { detectProspectCurrency, formatPrice } from "@/lib/prompt-generator";
import { KPICard } from "@/components/KPICard";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string }>;
}) {
  let totalProspectsCount = 0;
  let totalPaidCount = 0;
  let revenueByCurrency = { eur: 0, usd: 0, mad: 0 };

  try {
    await db.execute("select 1" as never);
    const saleStages = ["paid", "delivered", "completed"];
    const isPaidProspect = (p: any) =>
      p.paymentStatus === "paid" ||
      p.depositStatus === "paid" ||
      p.finalPaymentStatus === "paid" ||
      saleStages.includes(p.workflowStage) ||
      p.workflowStage === "deposit_paid";
    const [prospectCount] = await db.select({ count: sql<number>`count(*)::int` }).from(prospects);

    const allProspectRows = await db
      .select({ prospect: prospects, business: businesses })
      .from(prospects)
      .innerJoin(businesses, eq(prospects.businessId, businesses.id));

    totalProspectsCount = prospectCount?.count || 0;
    totalPaidCount = allProspectRows.filter((row: any) => isPaidProspect(row.prospect)).length;

    const settings = await getSettings();
    for (const row of allProspectRows) {
      const p = row.prospect as any;
      const curr = p.quoteCurrency || detectProspectCurrency(row.business.country || null, row.business.city || null);
      let revenue = 0;
      if (p.depositStatus === "paid") {
        const fallbackDeposit =
          curr === "EUR"
            ? (settings as any).depositPriceEUR ?? 9900
            : curr === "USD"
              ? (settings as any).depositPriceUSD ?? 9900
              : (settings as any).depositPriceMAD ?? 99000;
        revenue += p.depositAmount ?? fallbackDeposit;
      }
      if (p.finalPaymentStatus === "paid") {
        const fallbackFinal =
          curr === "EUR"
            ? (settings as any).finalPriceEUR ?? 15000
            : curr === "USD"
              ? (settings as any).finalPriceUSD ?? 15000
              : (settings as any).finalPriceMAD ?? 150000;
        revenue += p.finalAmount ?? fallbackFinal;
      }
      // Fallback legacy single payment if no split payment recorded
      if (revenue === 0 && (p.paymentStatus === "paid" || saleStages.includes(p.workflowStage) || p.workflowStage === "deposit_paid")) {
        const legacyAmount =
          p.paymentAmount ||
          p.quoteAmount ||
          p.totalAmount ||
          (curr === "EUR" ? ((settings as any).priceEUR || 0) : curr === "USD" ? ((settings as any).priceUSD || 0) : ((settings as any).priceMAD || 0));
        revenue = legacyAmount || 0;
      }
      if (revenue === 0) continue;
      if (curr === "EUR") revenueByCurrency.eur += revenue;
      else if (curr === "USD") revenueByCurrency.usd += revenue;
      else revenueByCurrency.mad += revenue;
    }
  } catch {
    const data = localStore.get();
    const allProspects = data.prospects || [];
    const allBusinesses = data.businesses || [];
    const settings = await getSettings();
    const saleStages = ["paid", "delivered", "completed"];
    const isPaidProspect = (p: any) =>
      p.paymentStatus === "paid" ||
      p.depositStatus === "paid" ||
      p.finalPaymentStatus === "paid" ||
      saleStages.includes((p as any).workflowStage) ||
      (p as any).workflowStage === "deposit_paid";

    totalProspectsCount = allProspects.length;
    totalPaidCount = allProspects.filter((p: any) => isPaidProspect(p)).length;

    for (const p of allProspects) {
      const pp = p as any;
      const biz = allBusinesses.find((b: any) => b.id === pp.businessId);
      const curr = pp.quoteCurrency || detectProspectCurrency(biz?.country || null, biz?.city || null);
      let revenue = 0;
      if (pp.depositStatus === "paid") {
        const fallbackDeposit =
          curr === "EUR"
            ? (settings as any).depositPriceEUR ?? 9900
            : curr === "USD"
              ? (settings as any).depositPriceUSD ?? 9900
              : (settings as any).depositPriceMAD ?? 99000;
        revenue += pp.depositAmount ?? fallbackDeposit;
      }
      if (pp.finalPaymentStatus === "paid") {
        const fallbackFinal =
          curr === "EUR"
            ? (settings as any).finalPriceEUR ?? 15000
            : curr === "USD"
              ? (settings as any).finalPriceUSD ?? 15000
              : (settings as any).finalPriceMAD ?? 150000;
        revenue += pp.finalAmount ?? fallbackFinal;
      }
      if (revenue === 0 && (pp.paymentStatus === "paid" || saleStages.includes(pp.workflowStage) || pp.workflowStage === "deposit_paid")) {
        const legacyAmount =
          pp.paymentAmount || pp.quoteAmount || pp.totalAmount || (curr === "EUR" ? ((settings as any).priceEUR || 0) : curr === "USD" ? ((settings as any).priceUSD || 0) : ((settings as any).priceMAD || 0));
        revenue = legacyAmount || 0;
      }
      if (revenue === 0) continue;
      if (curr === "EUR") revenueByCurrency.eur += revenue;
      else if (curr === "USD") revenueByCurrency.usd += revenue;
      else revenueByCurrency.mad += revenue;
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
    <div className="min-h-screen" style={{ background: "#0a0d0b", position: "relative", overflow: "hidden" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle,rgba(74,222,128,.03) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
      <div className="relative z-10 mx-auto max-w-[1380px] px-6 py-10 lg:px-8">
        {campaign && (
          <div className="mb-6 flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-4" style={{ boxShadow: "0 2px 7px rgba(0,0,0,.2)" }}>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xl">📋</span>
              <div>
                <p className="font-semibold text-[#e8efe8]">Vous prospectez pour « {campaign.name} »</p>
                {campaign.sector && campaign.location && (
                  <p className="text-xs text-[#9fb3a4]">{campaign.sector} à {campaign.location}</p>
                )}
              </div>
            </div>
            <Link href={`/campaigns/${campaign.id}`} className="rounded-lg bg-[#d9ff4d] px-4 py-2 text-xs font-bold text-[#0a0d0b] transition hover:bg-[#4ade80]">
              Voir la campagne
            </Link>
          </div>
        )}

        <header className="mb-8">
          <div className="mb-6 flex items-center gap-2">
            <div className="h-[2px] w-6 rounded bg-[#d9ff4d]" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#d9ff4d]">Dashboard</span>
          </div>
          <div className="flex items-center gap-4 mb-8">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d9ff4d]/10 text-[#d9ff4d]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[#e8efe8] sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: -1.5, lineHeight: 1.1 }}>Importez · Vibecodez · Vendez</h1>
              <p className="mt-1 text-sm text-[#67766a]">Importez vos prospects · Workflow WhatsApp automatisé</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <KPICard label="Prospects créés" value={totalProspectsCount} icon="🎯" tone="blue" />
            <KPICard label="Ventes conclues" value={totalPaidCount} icon="✅" tone="green" subtitle={`${conversionRate}% conversion`} />
            <KPICard label="CA généré" value={revenueDisplay} icon="💰" tone="lime" subtitle={`${totalPaidCount} vente${totalPaidCount > 1 ? "s" : ""}`} breakdown={breakdown} />
          </div>
        </header>

        <section className="relative overflow-hidden rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-6 sm:p-8">
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #d9ff4d, #4ade80)" }} />
          <div className="text-center">
            <p className="text-sm text-[#67766a] mb-4">Créez une campagne pour lancer votre prospection</p>
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-2 rounded-xl bg-[#d9ff4d] px-6 py-3 text-sm font-bold text-[#0a0d0b] transition hover:bg-[#4ade80]"
            >
              + Nouvelle campagne
            </Link>
          </div>
        </section>

        <HomeClient />
      </div>
    </div>
  );
}
