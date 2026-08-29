"use client";

import Link from "next/link";
import { KPICard } from "@/components/KPICard";

type Recent = {
  log: {
    id: number;
    prospectId: number;
    messageStage: string;
    sentAt: Date | string | null;
    status: string | null;
    phone: string | null;
    language: string | null;
  };
  prospect: {
    id: number;
    workflowStage: string;
    quoteAmount: number | null;
    paymentStatus: string | null;
  };
  business: {
    name: string;
    city: string | null;
  };
};

const STAGE_INFO: Record<string, { label: string; color: string; icon: string }> = {
  discovered: { label: "Découvert", color: "bg-slate-100 text-slate-700", icon: "🔍" },
  contacted: { label: "Contacté", color: "bg-blue-100 text-blue-700", icon: "💬" },
  demo_sent: { label: "Démo envoyée", color: "bg-violet-100 text-violet-700", icon: "🎨" },
  quoted: { label: "Devis envoyé", color: "bg-amber-100 text-amber-700", icon: "💰" },
  paid: { label: "Payé", color: "bg-emerald-100 text-emerald-700", icon: "✅" },
  delivered: { label: "Livré", color: "bg-emerald-100 text-emerald-700", icon: "🚀" },
  completed: { label: "Terminé", color: "bg-emerald-100 text-emerald-700", icon: "🎉" },
  intro: { label: "Premier contact", color: "bg-blue-100 text-blue-700", icon: "💬" },
  followup: { label: "Follow-up #1", color: "bg-blue-100 text-blue-700", icon: "📬" },
  followup_2: { label: "Follow-up #2", color: "bg-blue-100 text-blue-700", icon: "⏰" },
  demo: { label: "Démo", color: "bg-violet-100 text-violet-700", icon: "🎨" },
  ask_offer: { label: "Demande d'offre", color: "bg-violet-100 text-violet-700", icon: "🤝" },
  quote: { label: "Devis", color: "bg-amber-100 text-amber-700", icon: "💰" },
  deposit: { label: "Acompte", color: "bg-amber-100 text-amber-700", icon: "💳" },
  payment_received: { label: "Paiement reçu", color: "bg-emerald-100 text-emerald-700", icon: "✅" },
  progress_update: { label: "Progression", color: "bg-emerald-100 text-emerald-700", icon: "🔧" },
  preview: { label: "Aperçu", color: "bg-violet-100 text-violet-700", icon: "👁️" },
  confirm_changes: { label: "Modifications", color: "bg-violet-100 text-violet-700", icon: "📋" },
  final_payment: { label: "Paiement final", color: "bg-amber-100 text-amber-700", icon: "💵" },
  delivery: { label: "Livraison", color: "bg-emerald-100 text-emerald-700", icon: "🚀" },
  checkin: { label: "Check-in", color: "bg-emerald-100 text-emerald-700", icon: "😊" },
  referral: { label: "Parrainage", color: "bg-emerald-100 text-emerald-700", icon: "🤝" },
};

export default function AnalyticsClient({
  totalMessages,
  totalProspects,
  paidProspects,
  totalRevenueDisplay,
  revenueBreakdown = [],
  stageDistribution,
  messageStageDist,
  recent,
  messagesByStatus = [],
  messagesPerProspect = 0,
  recentCampaigns = [],
}: {
  totalMessages: number;
  totalProspects: number;
  paidProspects: number;
  totalRevenueDisplay: string;
  revenueBreakdown?: { label: string; value: string | number }[];
  stageDistribution: Array<{ stage: string; count: number }>;
  messageStageDist: Array<{ stage: string; count: number }>;
  recent: Recent[];
  messagesByStatus: Array<{ status: string; count: number }>;
  messagesPerProspect: number;
  recentCampaigns: Array<{
    id: number;
    name: string;
    sector: string | null;
    location: string | null;
    prospectCount: number;
  }>;
}) {
  const conversionRate = totalProspects > 0 ? Math.round((paidProspects / totalProspects) * 100) : 0;

  // Compute message counts by status
  const sentCount = (messagesByStatus || []).find((m) => m.status === "sent")?.count || 0;
  const pendingCount = (messagesByStatus || []).find((m) => m.status === "pending")?.count || 0;
  const failedCount = (messagesByStatus || []).find((m) => m.status === "failed")?.count || 0;

  return (
    <div className="space-y-6">
      {/* Top KPIs row */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Messages envoyés" value={totalMessages} icon="📤" tone="blue" subtitle={messagesPerProspect > 0 ? `${messagesPerProspect} msg / prospect` : undefined} />
        <KPICard label="Prospects créés" value={totalProspects} icon="🎯" tone="violet" />
        <KPICard label="Ventes conclues" value={`${paidProspects} (${conversionRate}%)`} icon="✅" tone="emerald" subtitle={`${conversionRate}% conversion`} />
        <KPICard label="Chiffre d'affaires" value={totalRevenueDisplay} icon="💰" tone="amber" subtitle={`${paidProspects} vente${paidProspects > 1 ? "s" : ""}`} breakdown={revenueBreakdown} />
      </section>

      {/* Funnel of prospection */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-bold text-slate-900">📊 Funnel de prospection</h3>
        <p className="mb-4 text-xs text-slate-500">Progression des prospects à travers les étapes du workflow</p>
        <div className="space-y-2.5">
          {stageDistribution.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun prospect pour l'instant.</p>
          ) : (
            (() => {
              const sortedStages = ["discovered", "contacted", "demo_sent", "quoted", "paid", "delivered", "completed"];
              const stageOrder = stageDistribution.slice().sort((a, b) => {
                const ai = sortedStages.indexOf(a.stage);
                const bi = sortedStages.indexOf(b.stage);
                return ai - bi;
              });
              const total = stageDistribution.reduce((s, x) => s + x.count, 0) || 1;
              return stageOrder.map((s) => {
                const info = STAGE_INFO[s.stage] || STAGE_INFO.discovered;
                const pct = Math.round((s.count / total) * 100);
                return (
                  <div key={s.stage}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <span className="text-lg">{info.icon}</span>
                        {info.label}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {s.count} <span className="text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full ${info.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      </div>

      {/* WhatsApp messages tracking */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-bold text-slate-900">💬 Messages WhatsApp envoyés</h3>
        <p className="mb-4 text-xs text-slate-500">Suivi en temps réel par étape et statut</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* By stage */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Par étape</p>
            {messageStageDist.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun message envoyé.</p>
            ) : (
              <div className="space-y-1.5">
                {messageStageDist.map((m) => {
                  const info = STAGE_INFO[m.stage] || { label: m.stage, icon: "💬", color: "bg-slate-100" };
                  return (
                    <div key={m.stage} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="flex items-center gap-2 text-sm">
                        <span>{info.icon}</span>
                        <span className="font-medium text-slate-700">{info.label}</span>
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-900">{m.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* By status */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Par statut</p>
            <div className="space-y-2">
              <StatusBar label="✅ Envoyés" count={sentCount} total={totalMessages} color="emerald" />
              <StatusBar label="⏳ En attente" count={pendingCount} total={totalMessages} color="amber" />
              <StatusBar label="❌ Échoués" count={failedCount} total={totalMessages} color="red" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent campaigns */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-bold text-slate-900">📋 Campagnes récentes</h3>
        <p className="mb-4 text-xs text-slate-500">5 dernières campagnes avec leur nombre de prospects</p>
        {recentCampaigns.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune campagne.</p>
        ) : (
          <ul className="space-y-2">
            {recentCampaigns.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/campaigns/${c.id}`}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 hover:bg-slate-100"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.sector} {c.location ? `· ${c.location}` : ""}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    {c.prospectCount} prospect{c.prospectCount !== 1 ? "s" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-bold text-slate-900">🕐 Activité récente</h3>
        <p className="mb-4 text-xs text-slate-500">Les 50 derniers messages envoyés</p>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune activité pour l'instant.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Prospect</th>
                  <th className="pb-2">Étape</th>
                  <th className="pb-2">Statut</th>
                  <th className="pb-2">Tél</th>
                  <th className="pb-2 text-right">Workflow</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => {
                  const msgInfo = r.log.messageStage
                    ? STAGE_INFO[r.log.messageStage] || { label: r.log.messageStage, icon: "💬", color: "bg-slate-100" }
                    : { label: "—", icon: "—", color: "bg-slate-100" };
                  const wsInfo = r.prospect ? STAGE_INFO[r.prospect.workflowStage] || { label: r.prospect.workflowStage, icon: "•", color: "bg-slate-100" } : { label: "—", icon: "•", color: "bg-slate-100" };
                  const statusInfo = r.log.status === "sent"
                    ? { label: "✅ envoyé", cls: "bg-emerald-50 text-emerald-700" }
                    : r.log.status === "failed"
                    ? { label: "❌ échoué", cls: "bg-red-50 text-red-700" }
                    : r.log.status === "delivered"
                    ? { label: "📬 livré", cls: "bg-blue-50 text-blue-700" }
                    : r.log.status === "read"
                    ? { label: "👁️ lu", cls: "bg-violet-50 text-violet-700" }
                    : { label: "⏳ " + (r.log.status || "?"), cls: "bg-amber-50 text-amber-700" };
                  return (
                    <tr key={r.log.id} className="border-t border-slate-100">
                      <td className="py-2 text-xs text-slate-500">
                        {r.log.sentAt ? new Date(r.log.sentAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="py-2">
                        {r.prospect ? (
                          <Link href={`/prospects/${r.prospect.id}`} className="font-medium text-slate-900 hover:underline">
                            {r.business?.name || "Prospect supprimé"}
                          </Link>
                        ) : (
                          <span className="font-medium text-slate-500">{r.business?.name || `Prospect #${r.log.prospectId}`}</span>
                        )}
                      </td>
                      <td className="py-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${msgInfo.color}`}>
                          {msgInfo.icon} {msgInfo.label}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-slate-600">
                        {r.log.phone || "—"}
                      </td>
                      <td className="py-2 text-right">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${wsInfo.color}`}>
                          {wsInfo.icon} {wsInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: "emerald" | "amber" | "red" }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const bg = color === "emerald" ? "bg-emerald-100" : color === "amber" ? "bg-amber-100" : "bg-red-100";
  const fill = color === "emerald" ? "bg-emerald-500" : color === "amber" ? "bg-amber-500" : "bg-red-500";
  const text = color === "emerald" ? "text-emerald-700" : color === "amber" ? "text-amber-700" : "text-red-700";
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className={`font-semibold ${text}`}>{count} ({pct}%)</span>
      </div>
      <div className={`mt-1 h-2 overflow-hidden rounded-full ${bg}`}>
        <div className={`h-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}