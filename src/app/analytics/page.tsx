import Link from "next/link";
import { db } from "@/db";
import { prospects, businesses, messageLogs, campaigns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { localStore } from "@/lib/local-store";
import AnalyticsClient from "./AnalyticsClient";
import { getSettings } from "@/lib/settings";
import { detectProspectCurrency, formatPrice } from "@/lib/prompt-generator";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const settings = await getSettings();
  const saleStages = ["paid", "delivered", "completed"];

  let allProspectRows: Array<{ prospect: any; business: any }> = [];
  let allMessages: any[] = [];
  let allCampaigns: any[] = [];

  // Try DB first
  try {
    const [dbProspectRows, dbMessages, dbCampaigns] = await Promise.all([
      db
        .select({ prospect: prospects, business: businesses })
        .from(prospects)
        .innerJoin(businesses, eq(prospects.businessId, businesses.id)),
      db
        .select()
        .from(messageLogs)
        .orderBy(desc(messageLogs.sentAt))
        .limit(200),
      db
        .select()
        .from(campaigns)
        .orderBy(desc(campaigns.createdAt)),
    ]);

    allProspectRows = dbProspectRows;
    allMessages = dbMessages;
    allCampaigns = dbCampaigns;
  } catch (err) {
    console.warn("DB query failed in AnalyticsPage, using local store:", err);
    const data = localStore.get();
    allProspectRows = (data.prospects || []).map((p: any) => {
      const biz = (data.businesses || []).find((b: any) => b.id === p.businessId) || {
        id: p.businessId,
        name: "Entreprise locale",
      };
      return { prospect: p, business: biz };
    });
    allMessages = data.messageLogs || [];
    allCampaigns = data.campaigns || [];
  }

  const totalMessages = allMessages.length;
  const totalProspects = allProspectRows.length;

  const paidProspects = allProspectRows.filter(
    (row) => row.prospect.paymentStatus === "paid" || saleStages.includes(row.prospect.workflowStage)
  ).length;

  // Revenue: per-currency detection
  const revenueByCurrency = { eur: 0, usd: 0, mad: 0 };
  for (const row of allProspectRows) {
    const p = row.prospect;
    if (p.paymentStatus !== "paid" && !saleStages.includes(p.workflowStage)) continue;
    const curr = p.quoteCurrency || detectProspectCurrency(row.business?.country || null, row.business?.city || null);
    let amount = 0;
    if (p.paymentAmount) {
      amount = p.paymentAmount;
    } else if (p.quoteAmount && p.quoteCurrency === curr) {
      amount = p.quoteAmount;
    } else {
      amount = curr === "EUR" ? (settings.priceEUR || 89900) : curr === "USD" ? (settings.priceUSD || 99900) : (settings.priceMAD || 99900);
    }
    if (curr === "EUR") revenueByCurrency.eur += amount;
    else if (curr === "USD") revenueByCurrency.usd += amount;
    else revenueByCurrency.mad += amount;
  }

  // Exchange rates for total USD display
  const EUR_TO_USD = 1.08;
  const MAD_TO_USD = 0.10;
  const totalInUSD = revenueByCurrency.eur * EUR_TO_USD + revenueByCurrency.usd + revenueByCurrency.mad * MAD_TO_USD;
  const totalRevenueDisplay = totalInUSD > 0 ? formatPrice(Math.round(totalInUSD), "USD") : "$0.00";

  const revenueBreakdown: { label: string; value: string | number }[] = [];
  if (revenueByCurrency.usd > 0) revenueBreakdown.push({ label: "$", value: formatPrice(revenueByCurrency.usd, "USD") });
  if (revenueByCurrency.eur > 0) revenueBreakdown.push({ label: "€", value: formatPrice(revenueByCurrency.eur, "EUR") });
  if (revenueByCurrency.mad > 0) revenueBreakdown.push({ label: "MAD", value: formatPrice(revenueByCurrency.mad, "MAD") });

  // By stage
  const stageMap: Record<string, number> = {};
  for (const row of allProspectRows) {
    const stage = row.prospect.workflowStage || "discovered";
    stageMap[stage] = (stageMap[stage] || 0) + 1;
  }
  const stageDistribution = Object.entries(stageMap).map(([stage, count]) => ({ stage, count }));

  // By message stage
  const msgStageMap: Record<string, number> = {};
  for (const m of allMessages) {
    const stage = m.messageStage || "unknown";
    msgStageMap[stage] = (msgStageMap[stage] || 0) + 1;
  }
  const messageStageDist = Object.entries(msgStageMap).map(([stage, count]) => ({ stage, count }));

  // Recent activity (last 50 messages)
  const recent = allMessages
    .slice()
    .sort((a: any, b: any) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime())
    .slice(0, 50)
    .map((m: any) => {
      const match = allProspectRows.find((row) => row.prospect.id === m.prospectId);
      return {
        log: m,
        prospect: match ? match.prospect : null,
        business: match ? match.business : null,
      };
    });

  // Message status breakdown
  const statusMap: Record<string, number> = {};
  for (const m of allMessages) {
    const st = m.status || "unknown";
    statusMap[st] = (statusMap[st] || 0) + 1;
  }
  const messagesByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  // Messages per prospect (avg)
  const messagesPerProspect = totalProspects
    ? Math.round((totalMessages / totalProspects) * 10) / 10
    : 0;

  // Recent campaigns with prospect count
  const recentCampaigns = allCampaigns
    .slice()
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5)
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      sector: c.sector || null,
      location: c.location || null,
      createdAt: c.createdAt || null,
      prospectCount: allProspectRows.filter((row) => row.prospect.campaignId === c.id).length,
    }));

  return (
    <div className="mx-auto max-w-[1380px] px-6 py-10 lg:px-8">
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
          <h1 className="mt-2 text-3xl font-bold text-slate-900">📊 Analytics</h1>
          <p className="text-sm text-slate-600">Suivez vos messages envoyés, vos conversions et votre CA</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/campaigns"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            📋 Campagnes
          </Link>
          <Link
            href="/settings"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ⚙️ Paramètres
          </Link>
        </div>
      </div>
      <AnalyticsClient
        totalMessages={totalMessages}
        totalProspects={totalProspects}
        paidProspects={paidProspects}
        totalRevenueDisplay={totalRevenueDisplay}
        revenueBreakdown={revenueBreakdown}
        stageDistribution={stageDistribution}
        messageStageDist={messageStageDist}
        recent={recent}
        messagesByStatus={messagesByStatus}
        messagesPerProspect={messagesPerProspect}
        recentCampaigns={recentCampaigns}
      />
    </div>
  );
}
