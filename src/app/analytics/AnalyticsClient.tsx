"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  prospect: { id: number; workflowStage: string } | null;
  business: { name: string; city: string | null } | null;
};

const STAGE_INFO: Record<string, { label: string; color: string; dot: string; icon: string }> = {
  discovered:  { label: "Découvert",    color: "bg-[#151b13] text-[#9fb3a4]",       dot: "bg-[#67766a]", icon: "🔍" },
  contacted:   { label: "Contacté",     color: "bg-[rgba(74,222,128,.1)] text-[#4ade80]",  dot: "bg-[#4ade80]", icon: "💬" },
  demo_sent:   { label: "Démo",         color: "bg-[rgba(167,139,250,.1)] text-[#a78bfa]", dot: "bg-[#a78bfa]", icon: "🎨" },
  quoted:      { label: "Devis",        color: "bg-[rgba(251,191,36,.1)] text-[#fbbf24]",  dot: "bg-[#fbbf24]", icon: "💰" },
  deposit_paid:{ label: "Acompte",      color: "bg-[rgba(217,255,77,.1)] text-[#d9ff4d]",  dot: "bg-[#d9ff4d]", icon: "💵" },
  paid:        { label: "Payé",         color: "bg-[rgba(74,222,128,.15)] text-[#4ade80]", dot: "bg-[#22c55e]", icon: "✅" },
  delivered:   { label: "Livré",        color: "bg-[rgba(59,130,246,.12)] text-[#3b82f6]", dot: "bg-[#3b82f6]", icon: "🚀" },
  completed:   { label: "Terminé",      color: "bg-[rgba(16,185,129,.12)] text-[#10b981]", dot: "bg-[#10b981]", icon: "🎉" },
  intro:       { label: "Premier contact", color: "bg-[rgba(74,222,128,.1)] text-[#4ade80]", dot: "bg-[#4ade80]", icon: "💬" },
  demo:        { label: "Démo",         color: "bg-[rgba(167,139,250,.1)] text-[#a78bfa]", dot: "bg-[#a78bfa]", icon: "🎨" },
  quote:       { label: "Devis",        color: "bg-[rgba(251,191,36,.1)] text-[#fbbf24]",  dot: "bg-[#fbbf24]", icon: "💰" },
  delivery:    { label: "Livraison",    color: "bg-[rgba(59,130,246,.12)] text-[#3b82f6]", dot: "bg-[#3b82f6]", icon: "🚀" },
  thanks:      { label: "Remerciement", color: "bg-[rgba(16,185,129,.12)] text-[#10b981]", dot: "bg-[#10b981]", icon: "🙏" },
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
  recentCampaigns: Array<{ id: number; name: string; sector: string | null; location: string | null; prospectCount: number; createdAt?: string | null }>;
}) {
  const router = useRouter();
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [recentList, setRecentList] = useState(recent);

  const conversionRate = totalProspects > 0 ? Math.round((paidProspects / totalProspects) * 100) : 0;
  const sentCount = messagesByStatus.find((m) => m.status === "sent")?.count || 0;
  const pendingCount = messagesByStatus.find((m) => m.status === "pending")?.count || 0;
  const failedCount = messagesByStatus.find((m) => m.status === "failed")?.count || 0;

  const handleClearActivity = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/analytics/clear-activity", { method: "POST" });
      if (res.ok) {
        setRecentList([]);
        setConfirmClear(false);
        router.refresh();
      }
    } catch {}
    setClearing(false);
  };

  return (
    <div className="space-y-5">
      {/* ── KPIs ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Messages envoyés" value={totalMessages} icon="📤" tone="blue" subtitle={messagesPerProspect > 0 ? `${messagesPerProspect} msg / prospect` : undefined} />
        <KPICard label="Prospects créés" value={totalProspects} icon="🎯" tone="violet" />
        <KPICard label="Ventes conclues" value={`${paidProspects} (${conversionRate}%)`} icon="✅" tone="emerald" subtitle={`${conversionRate}% conversion`} />
        <KPICard label="Chiffre d'affaires" value={totalRevenueDisplay} icon="💰" tone="amber" subtitle={`${paidProspects} vente${paidProspects > 1 ? "s" : ""}`} breakdown={revenueBreakdown} />
      </section>

      {/* ── Funnel + Messages status side by side ── */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Funnel — 3 cols */}
        <div className="relative overflow-hidden rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-6 lg:col-span-3">
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #a78bfa, #4ade80)" }} />
          <div className="mb-5">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#a78bfa]">Pipeline</p>
            <h3 className="mt-1 text-lg font-extrabold text-[#e8efe8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Funnel de prospection
            </h3>
          </div>
          {stageDistribution.length === 0 ? (
            <p className="text-sm text-[#67766a]">Aucun prospect.</p>
          ) : (
            <div className="space-y-3">
              {(() => {
                const sortedStages = ["discovered", "contacted", "demo_sent", "quoted", "deposit_paid", "paid", "delivered", "completed"];
                const ordered = stageDistribution.slice().sort((a, b) => sortedStages.indexOf(a.stage) - sortedStages.indexOf(b.stage));
                const total = stageDistribution.reduce((s, x) => s + x.count, 0) || 1;
                return ordered.map((s) => {
                  const info = STAGE_INFO[s.stage] || STAGE_INFO.discovered;
                  const pct = Math.round((s.count / total) * 100);
                  return (
                    <div key={s.stage}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium text-[#e8efe8]">
                          <span className={`h-2 w-2 rounded-full ${info.dot}`} />
                          {info.icon} {info.label}
                        </span>
                        <span className="font-bold text-[#e8efe8]">{s.count} <span className="text-[#67766a] font-normal">({pct}%)</span></span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#151b13]">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${info.dot === "bg-[#67766a]" ? "#67766a" : info.dot.replace("bg-[", "").replace("]", "")}, ${info.dot === "bg-[#67766a]" ? "#9fb3a4" : info.dot.replace("bg-[", "").replace("]", "")})` }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* Messages by status — 2 cols */}
        <div className="relative overflow-hidden rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-6 lg:col-span-2">
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #4ade80, #22c55e)" }} />
          <div className="mb-5">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#4ade80]">Statut</p>
            <h3 className="mt-1 text-lg font-extrabold text-[#e8efe8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Messages
            </h3>
          </div>
          <div className="space-y-4">
            <StatusBar label="Envoyés" count={sentCount} total={totalMessages} color="#4ade80" />
            <StatusBar label="En attente" count={pendingCount} total={totalMessages} color="#fbbf24" />
            <StatusBar label="Échoués" count={failedCount} total={totalMessages} color="#ef4444" />
          </div>

          <div className="mt-6 border-t border-[rgba(236,255,220,0.06)] pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#67766a]">Par étape</p>
            <div className="mt-2 space-y-1.5">
              {messageStageDist.length === 0 ? (
                <p className="text-xs text-[#67766a]">Aucun message.</p>
              ) : (
                messageStageDist.map((m) => {
                  const info = STAGE_INFO[m.stage] || { label: m.stage, icon: "💬", dot: "bg-[#67766a]" };
                  return (
                    <div key={m.stage} className="flex items-center justify-between rounded-lg bg-[#151b13] px-3 py-1.5">
                      <span className="flex items-center gap-2 text-xs">
                        <span className={`h-1.5 w-1.5 rounded-full ${info.dot}`} />
                        {info.icon} <span className="font-medium text-[#e8efe8]">{info.label}</span>
                      </span>
                      <span className="text-xs font-bold text-[#e8efe8]">{m.count}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Campagnes récentes ── */}
      <div className="relative overflow-hidden rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-6">
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #d9ff4d, #4ade80)" }} />
        <div className="mb-5">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#d9ff4d]">Campagnes</p>
          <h3 className="mt-1 text-lg font-extrabold text-[#e8efe8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Campagnes récentes
          </h3>
        </div>
        {recentCampaigns.length === 0 ? (
          <p className="text-sm text-[#67766a]">Aucune campagne.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {recentCampaigns.map((c) => (
              <Link
                key={c.id}
                href={`/campaigns/${c.id}`}
                className="group rounded-xl border border-[rgba(236,255,220,0.06)] bg-[#151b13] p-4 transition hover:border-[rgba(74,222,128,.2)] hover:bg-[#1b2218]"
              >
                <p className="truncate text-sm font-semibold text-[#e8efe8] group-hover:text-[#4ade80] transition">{c.name}</p>
                <p className="mt-0.5 text-[11px] text-[#67766a]">{c.sector} {c.location ? `· ${c.location}` : ""}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full bg-[rgba(74,222,128,.1)] px-2 py-0.5 text-[11px] font-bold text-[#4ade80]">
                    {c.prospectCount} prospect{c.prospectCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[10px] text-[#67766a]">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Activité récente ── */}
      <div className="relative overflow-hidden rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-6">
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #3b82f6, #a78bfa)" }} />
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#3b82f6]">Activité</p>
            <h3 className="mt-1 text-lg font-extrabold text-[#e8efe8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Activité récente
            </h3>
            <p className="mt-0.5 text-xs text-[#67766a]">Les 50 derniers messages envoyés</p>
          </div>
          {recentList.length > 0 && (
            <div>
              {!confirmClear ? (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="rounded-lg border border-[rgba(239,68,68,.2)] bg-[rgba(239,68,68,.08)] px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-[rgba(239,68,68,.15)]"
                >
                  🗑️ Remettre à zéro
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-300">Supprimer toute l'activité ?</span>
                  <button onClick={handleClearActivity} disabled={clearing} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition">
                    {clearing ? "..." : "Oui, supprimer"}
                  </button>
                  <button onClick={() => setConfirmClear(false)} className="rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#0e120f] px-3 py-1.5 text-xs text-[#9fb3a4] hover:text-[#e8efe8] transition">
                    Annuler
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {recentList.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-[#67766a]">Aucune activité pour l'instant.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentList.map((r) => {
              const msgInfo = STAGE_INFO[r.log.messageStage] || { label: r.log.messageStage, icon: "💬", dot: "bg-[#67766a]" };
              const statusColor = r.log.status === "sent" ? "#4ade80" : r.log.status === "failed" ? "#ef4444" : r.log.status === "delivered" ? "#3b82f6" : r.log.status === "read" ? "#a78bfa" : "#fbbf24";
              const statusLabel = r.log.status === "sent" ? "Envoyé" : r.log.status === "failed" ? "Échoué" : r.log.status === "delivered" ? "Livré" : r.log.status === "read" ? "Lu" : r.log.status || "?";

              return (
                <div key={r.log.id} className="flex items-center gap-3 rounded-xl bg-[#151b13] px-4 py-2.5 transition hover:bg-[#1b2218]">
                  {/* Status dot */}
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: statusColor }} />

                  {/* Time */}
                  <span className="w-20 shrink-0 text-[11px] text-[#67766a]">
                    {r.log.sentAt ? new Date(r.log.sentAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) + " " + new Date(r.log.sentAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </span>

                  {/* Prospect name */}
                  <div className="min-w-0 flex-1">
                    {r.prospect ? (
                      <Link href={`/prospects/${r.prospect.id}`} className="truncate text-sm font-medium text-[#e8efe8] hover:text-[#4ade80] transition">
                        {r.business?.name || "Prospect"}
                      </Link>
                    ) : (
                      <span className="text-sm text-[#67766a]">{r.business?.name || `Prospect #${r.log.prospectId}`}</span>
                    )}
                    {r.business?.city && <span className="ml-2 text-[11px] text-[#67766a]">{r.business.city}</span>}
                  </div>

                  {/* Message stage badge */}
                  <span className={`hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-flex ${msgInfo.dot.replace("bg-", "bg-")}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${msgInfo.dot}`} />
                    {msgInfo.label}
                  </span>

                  {/* Status badge */}
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${statusColor}15`, color: statusColor }}>
                    {statusLabel}
                  </span>

                  {/* Phone */}
                  <span className="hidden w-28 shrink-0 truncate text-[11px] text-[#67766a] lg:block">{r.log.phone || "—"}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[#9fb3a4]">{label}</span>
        <span className="font-bold" style={{ color }}>{count} <span className="font-normal text-[#67766a]">({pct}%)</span></span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#151b13]">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
