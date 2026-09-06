"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ScrapedBusiness } from "@/lib/types";

type Item = {
  prospect: {
    id: number;
    workflowStage: string;
    campaignId: number | null;
    quoteAmount: number | null;
    paymentAmount: number | null;
    paymentStatus: string | null;
    updatedAt: Date | string | null;
  };
  business: ScrapedBusiness & { id: number };
};

type Campaign = { id: number; name: string };

const STAGE_INFO: Record<string, { label: string; color: string; dot: string; icon: string }> = {
  discovered:  { label: "Découvert",   color: "bg-[#151b13] text-[#9fb3a4] border-[rgba(236,255,220,0.09)]", dot: "bg-[#67766a]", icon: "🔍" },
  contacted:   { label: "Contacté",    color: "bg-[rgba(74,222,128,.08)] text-[#4ade80] border-[rgba(74,222,128,.2)]", dot: "bg-[#4ade80]", icon: "💬" },
  demo_sent:   { label: "Démo",        color: "bg-[rgba(167,139,250,.08)] text-[#a78bfa] border-[rgba(167,139,250,.2)]", dot: "bg-[#a78bfa]", icon: "🎨" },
  quoted:      { label: "Devis",       color: "bg-[rgba(251,191,36,.08)] text-[#fbbf24] border-[rgba(251,191,36,.2)]", dot: "bg-[#fbbf24]", icon: "💰" },
  deposit_paid:{ label: "Acompte",     color: "bg-[rgba(217,255,77,.08)] text-[#d9ff4d] border-[rgba(217,255,77,.2)]", dot: "bg-[#d9ff4d]", icon: "💵" },
  paid:        { label: "Payé",        color: "bg-[rgba(74,222,128,.12)] text-[#4ade80] border-[rgba(74,222,128,.25)]", dot: "bg-[#22c55e]", icon: "✅" },
  delivered:   { label: "Livré",       color: "bg-[rgba(59,130,246,.12)] text-[#3b82f6] border-[rgba(59,130,246,.2)]", dot: "bg-[#3b82f6]", icon: "🚀" },
  completed:   { label: "Terminé",     color: "bg-[rgba(16,185,129,.12)] text-[#10b981] border-[rgba(16,185,129,.2)]", dot: "bg-[#10b981]", icon: "🎉" },
  lost:        { label: "Perdu",       color: "bg-[rgba(239,68,68,.08)] text-[#ef4444] border-[rgba(239,68,68,.2)]", dot: "bg-[#ef4444]", icon: "❌" },
};

function safeJson(s: string): Record<string, unknown> | null {
  try { return JSON.parse(s); } catch { return null; }
}

export default function ProspectsList({ items, campaigns = [] }: { items: Item[]; campaigns?: Campaign[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<Map<string, boolean>>(new Map());
  const [checkingWhatsapp, setCheckingWhatsapp] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterCampaign, setFilterCampaign] = useState<number | "all">("all");
  const [filterWhatsapp, setFilterWhatsapp] = useState<"all" | "yes" | "no">("all");
  const [filterStage, setFilterStage] = useState<string>("all");

  useEffect(() => {
    if (items.length === 0 || checkingWhatsapp) return;
    const withPhone = items.filter((i) => i.business.phone && i.business.phone.replace(/[^0-9]/g, "").length >= 8);
    if (withPhone.length === 0) return;
    setCheckingWhatsapp(true);
    const chunks: Array<{ phone: string; country?: string }>[] = [];
    for (let i = 0; i < withPhone.length; i += 20) {
      chunks.push(withPhone.slice(i, i + 20).map((item) => ({
        phone: item.business.phone!,
        country: item.business.country || undefined,
      })));
    }
    let cancelled = false;
    (async () => {
      const newMap = new Map<string, boolean>();
      let errorMsg: string | null = null;
      for (const chunk of chunks) {
        if (cancelled) return;
        try {
          const res = await fetch("/api/whatsapp/check-numbers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numbers: chunk }),
          });
          const data = await res.json();
          if (data.error) { errorMsg = data.error; break; }
          if (data.results) {
            for (const r of data.results) newMap.set(r.phone, r.exists);
          }
        } catch { errorMsg = "Erreur réseau"; }
      }
      if (!cancelled) {
        setWhatsappStatus(newMap);
        setWaError(errorMsg);
        setCheckingWhatsapp(false);
      }
    })();
    return () => { cancelled = true; };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterCampaign !== "all" && item.prospect.campaignId !== filterCampaign) return false;
      if (filterStage !== "all" && item.prospect.workflowStage !== filterStage) return false;
      if (filterWhatsapp === "yes") {
        const phone = item.business.phone;
        if (!phone || !whatsappStatus.get(phone)) return false;
      }
      if (filterWhatsapp === "no") {
        const phone = item.business.phone;
        if (phone && whatsappStatus.get(phone)) return false;
      }
      return true;
    });
  }, [items, filterCampaign, filterWhatsapp, filterStage, whatsappStatus]);

  const stageOrder = ["completed", "paid", "delivered", "deposit_paid", "quoted", "demo_sent", "contacted", "discovered", "lost"];
  const byStage = useMemo(() => {
    const acc: Record<string, Item[]> = {};
    for (const item of filteredItems) {
      const stage = item.prospect.workflowStage;
      if (!acc[stage]) acc[stage] = [];
      acc[stage].push(item);
    }
    return acc;
  }, [filteredItems]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const stage = item.prospect.workflowStage;
      counts[stage] = (counts[stage] || 0) + 1;
    }
    return counts;
  }, [items]);

  const allIds = useMemo(() => items.map((i) => i.prospect.id), [items]);
  const allSelected = selected.size > 0 && filteredItems.every((i) => selected.has(i.prospect.id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleOne = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filteredItems.map((i) => i.prospect.id)));
  }, [allSelected, filteredItems]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const bulkDelete = useCallback(async () => {
    if (selected.size === 0) { alert("Aucun prospect sélectionné"); return; }
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/prospects/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) { clearSelection(); setConfirmingBulk(false); router.refresh(); }
      else alert("Erreur: " + (data.error || "Suppression impossible"));
    } catch { alert("Erreur réseau"); }
    finally { setBulkDeleting(false); }
  }, [selected, clearSelection, router]);

  const hasActiveFilter = filterCampaign !== "all" || filterWhatsapp !== "all" || filterStage !== "all";

  if (filteredItems.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-[rgba(236,255,220,0.15)] bg-transparent p-12 text-center">
        <p className="text-3xl">🎯</p>
        <h2 className="mt-3 text-lg font-semibold text-[#e8efe8]">
          {items.length === 0 ? "Aucun prospect pour l'instant" : "Aucun résultat pour ces filtres"}
        </h2>
        <p className="mt-1 text-sm text-[#9fb3a4]">
          {items.length === 0
            ? "Allez sur le dashboard, faites une recherche et cliquez sur « Prospecter »."
            : "Essayez de modifier les filtres."}
        </p>
        {items.length === 0 ? (
          <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#d9ff4d] px-5 py-2.5 text-sm font-bold text-[#0a0d0b] hover:bg-[#4ade80] transition">
            Aller au Dashboard
          </Link>
        ) : (
          <button onClick={() => { setFilterCampaign("all"); setFilterWhatsapp("all"); setFilterStage("all"); }} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#d9ff4d] px-5 py-2.5 text-sm font-bold text-[#0a0d0b] hover:bg-[#4ade80] transition">
            Réinitialiser les filtres
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Bulk selection bar ── */}
      {selected.size > 0 && (
        <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[rgba(74,222,128,.3)] bg-[rgba(74,222,128,.08)] p-3 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3 text-sm text-[#4ade80]">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#4ade80] font-bold text-[#0a0d0b]">{selected.size}</span>
            <span className="font-semibold">sélectionné{selected.size > 1 ? "s" : ""}</span>
            <button onClick={clearSelection} className="text-xs underline hover:text-[#d9ff4d]">Tout désélectionner</button>
          </div>
          <div className="flex items-center gap-2">
            {!confirmingBulk ? (
              <button onClick={() => setConfirmingBulk(true)} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition">
                🗑️ Supprimer
              </button>
            ) : (
              <>
                <span className="text-xs text-red-300">Supprimer {selected.size} prospect(s) ?</span>
                <button onClick={bulkDelete} disabled={bulkDeleting} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition">
                  {bulkDeleting ? "..." : "Oui"}
                </button>
                <button onClick={() => setConfirmingBulk(false)} className="rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#0e120f] px-3 py-1.5 text-sm text-[#9fb3a4] hover:text-[#e8efe8] transition">
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Stats summary bar ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] px-5 py-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[#9fb3a4]">
          <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected; }} onChange={toggleAll} className="h-4 w-4 rounded" />
          <span className="font-medium">{filteredItems.length} prospect{filteredItems.length > 1 ? "s" : ""}</span>
        </label>

        <div className="h-4 w-px bg-[rgba(236,255,220,0.09)]" />

        {/* Stage mini counts */}
        {stageOrder.filter((s) => stageCounts[s]).map((stage) => {
          const info = STAGE_INFO[stage] || STAGE_INFO.discovered;
          return (
            <button
              key={stage}
              onClick={() => setFilterStage(filterStage === stage ? "all" : stage)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${filterStage === stage ? info.color : "border-transparent text-[#67766a] hover:text-[#9fb3a4]"}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${info.dot}`} />
              {info.label}
              <span className="font-bold">{stageCounts[stage]}</span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          {checkingWhatsapp && <span className="text-xs text-[#4ade80]">⏳ WhatsApp...</span>}
          {!checkingWhatsapp && waError && <span className="text-xs text-red-400">⚠ {waError}</span>}
          {!checkingWhatsapp && !waError && whatsappStatus.size > 0 && (
            <span className="text-xs">
              <span className="font-semibold text-green-400">{Array.from(whatsappStatus.values()).filter(Boolean).length} WA ✓</span>
              <span className="mx-1 text-[#67766a]">·</span>
              <span className="font-semibold text-red-400">{Array.from(whatsappStatus.values()).filter((v) => !v).length} WA ✗</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#67766a]">Filtrer</span>
        {campaigns.length > 0 && (
          <select
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-1.5 text-xs font-medium text-[#9fb3a4] transition hover:border-[rgba(236,255,220,0.18)] focus:border-[#4ade80] focus:outline-none"
          >
            <option value="all">Toutes les campagnes</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <div className="flex items-center gap-1 rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#151b13] p-0.5">
          {(["all", "yes", "no"] as const).map((v) => (
            <button key={v} onClick={() => setFilterWhatsapp(v)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${filterWhatsapp === v ? "bg-[#4ade80] text-[#0a0d0b]" : "text-[#67766a] hover:text-[#9fb3a4]"}`}>
              {v === "all" ? "WA: Tous" : v === "yes" ? "WA ✓" : "WA ✗"}
            </button>
          ))}
        </div>
        {hasActiveFilter && (
          <button onClick={() => { setFilterCampaign("all"); setFilterWhatsapp("all"); setFilterStage("all"); }} className="text-xs font-medium text-[#4ade80] hover:underline">
            ✕ Réinitialiser
          </button>
        )}
      </div>

      {/* ── Stage groups ── */}
      {stageOrder.filter((s) => byStage[s]).map((stage) => {
        const info = STAGE_INFO[stage] || STAGE_INFO.discovered;
        return (
          <div key={stage}>
            {/* Stage header */}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${info.dot}`} />
                <h3 className="text-sm font-bold text-[#e8efe8]">{info.icon} {info.label}</h3>
              </div>
              <span className="rounded-full bg-[#151b13] px-2.5 py-0.5 text-[11px] font-bold text-[#9fb3a4]">{byStage[stage].length}</span>
              <div className="flex-1 h-px bg-[rgba(236,255,220,0.06)]" />
            </div>

            {/* Prospect cards */}
            <div className="space-y-2">
              {byStage[stage].map((item) => {
                const b = item.business;
                const isSelected = selected.has(item.prospect.id);
                const isExpanded = expandedId === item.prospect.id;
                const initials = b.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
                const waValid = b.phone ? whatsappStatus.get(b.phone) : undefined;
                const city = b.city || b.suburb || "";
                const country = b.country || "";
                const location = [city, country].filter(Boolean).join(", ");

                return (
                  <div
                    key={item.prospect.id}
                    className={`group rounded-xl border transition-all ${
                      isSelected
                        ? "border-[rgba(74,222,128,.3)] bg-[#0e120f] ring-1 ring-[rgba(74,222,128,0.2)]"
                        : "border-[rgba(236,255,220,0.09)] bg-[#0e120f] hover:border-[rgba(236,255,220,0.18)] hover:shadow-lg hover:shadow-black/20"
                    }`}
                  >
                    {/* Main row */}
                    <div className="flex items-center gap-4 px-4 py-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(item.prospect.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 shrink-0 rounded"
                      />

                      {/* Avatar */}
                      <div className="relative h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#d9ff4d] text-xs font-bold text-[#0a0d0b] grid place-items-center">
                        {initials || "B"}
                        {waValid !== undefined && (
                          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0e120f] ${waValid ? "bg-green-500" : "bg-red-400"}`} />
                        )}
                      </div>

                      {/* Name + location */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate text-sm font-semibold text-[#e8efe8]" title={b.name}>{b.name}</h4>
                          {b.rating && (
                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-[rgba(251,191,36,.1)] px-1.5 py-0.5 text-[10px] font-bold text-[#fbbf24]">
                              ★ {b.rating}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-[#67766a]">
                          {b.subcategory && <span className="text-[#9fb3a4]">{b.subcategory}</span>}
                          {b.subcategory && location && <span>·</span>}
                          {location && <span className="truncate">{location}</span>}
                        </div>
                      </div>

                      {/* Key info chips */}
                      <div className="hidden items-center gap-2 md:flex">
                        {b.phone && (
                          <a href={`tel:${b.phone}`} className="flex items-center gap-1 rounded-md bg-[#151b13] px-2 py-1 text-[11px] text-[#9fb3a4] hover:text-[#4ade80] transition" title={b.phone}>
                            📞 {waValid === true && <span className="text-green-400">WA</span>}
                          </a>
                        )}
                        {b.website && (
                          <span className="flex items-center gap-1 rounded-md bg-[#151b13] px-2 py-1 text-[11px] text-[#9fb3a4]" title={b.website}>
                            🌐
                          </span>
                        )}
                        {b.email && (
                          <a href={`mailto:${b.email}`} className="flex items-center gap-1 rounded-md bg-[#151b13] px-2 py-1 text-[11px] text-[#9fb3a4] hover:text-[#4ade80] transition" title={b.email}>
                            ✉️
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={`/prospects/${item.prospect.id}`}
                          className="rounded-lg bg-[#d9ff4d] px-3 py-1.5 text-[11px] font-bold text-[#0a0d0b] transition hover:bg-[#4ade80]"
                        >
                          Prospecter
                        </Link>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.prospect.id)}
                          className="rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-2.5 py-1.5 text-[11px] font-medium text-[#9fb3a4] transition hover:border-[rgba(236,255,220,0.18)] hover:text-[#e8efe8]"
                        >
                          {isExpanded ? "Réduire" : "Détails"}
                          <svg viewBox="0 0 24 24" fill="none" className={`ml-1 inline h-3 w-3 transition ${isExpanded ? "rotate-180" : ""}`} stroke="currentColor" strokeWidth={2}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Description (if exists, compact) */}
                    {b.description && !isExpanded && (
                      <div className="border-t border-[rgba(236,255,220,0.06)] px-4 py-2">
                        <p className="line-clamp-1 text-xs text-[#67766a]">{b.description}</p>
                      </div>
                    )}

                    {/* Expanded details */}
                    {isExpanded && <ExpandedDetails b={b} waValid={waValid} />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Expanded details panel ──────────────────────────────────── */
function ExpandedDetails({ b, waValid }: { b: Item["business"]; waValid?: boolean }) {
  const photos = (b as any).photos as string[] | null;
  const reviews = (b as any).reviews as Array<{ author: string; rating: number; text: string; time: string }> | null;
  const services = (b as any).services as string | null;
  const extraTagsParsed = b.extraTags ? safeJson(b.extraTags) : null;
  const otherTags = extraTagsParsed
    ? Object.entries(extraTagsParsed).filter(([k]) => ![
        "phone", "contact:phone", "mobile", "contact:mobile", "email", "contact:email",
        "website", "contact:website", "url", "opening_hours", "cuisine", "description",
        "note", "wheelchair", "wifi", "internet_access", "takeaway", "delivery",
        "delivery:food", "outdoor_seating", "smoking", "reservation", "parking",
        "air_conditioning", "payment:cash", "payment_cash", "payment:credit_cards",
        "payment:debit_cards", "payment:cards", "capacity", "stars", "contact:facebook",
        "facebook", "contact:twitter", "twitter", "contact:instagram", "instagram",
        "contact:linkedin", "linkedin", "contact:youtube", "youtube", "wikidata", "wikipedia",
        "addr:housenumber", "addr:street", "addr:postcode", "addr:city", "addr:suburb",
        "addr:country", "addr:neighbourhood", "addr:quarter", "name", "name:fr", "ref",
      ].includes(k))
    : [];

  return (
    <div className="border-t border-[rgba(236,255,220,0.06)] bg-[#151b13]/50 px-4 py-4">
      {/* Photos */}
      {photos && photos.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#67766a]">Photos</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {photos.slice(0, 6).map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="shrink-0">
                <img src={url} alt={`${b.name} ${i + 1}`} className="h-20 w-20 rounded-lg object-cover border border-[rgba(236,255,220,0.09)]" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Contact */}
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#67766a]">Contact</p>
          <div className="space-y-1 text-xs">
            {b.phone && <div>📞 <a href={`tel:${b.phone}`} className="font-medium text-[#4ade80] hover:underline">{b.phone}</a> {waValid === true && <span className="text-green-400 text-[10px] font-bold">WA ✓</span>}{waValid === false && <span className="text-red-400 text-[10px] font-bold">WA ✗</span>}</div>}
            {b.mobile && <div>📱 <a href={`tel:${b.mobile}`} className="font-medium text-[#4ade80] hover:underline">{b.mobile}</a></div>}
            {b.email && <div>✉️ <a href={`mailto:${b.email}`} className="font-medium text-[#4ade80] hover:underline">{b.email}</a></div>}
            {b.website && <div>🌐 <a href={b.website} target="_blank" rel="noreferrer" className="break-all font-medium text-[#4ade80] hover:underline">{(() => { try { return new URL(b.website).hostname; } catch { return b.website; } })()}</a></div>}
          </div>
        </div>

        {/* Adresse */}
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#67766a]">Adresse</p>
          <div className="text-xs text-[#e8efe8]">
            {b.housenumber || b.street ? <div>{b.housenumber} {b.street}</div> : null}
            {b.neighbourhood ? <div>{b.neighbourhood}</div> : null}
            {b.postcode || b.city ? <div>{b.postcode} {b.city}</div> : null}
            {b.country && <div className="font-medium">{b.country}</div>}
            {b.latitude && b.longitude && (
              <a href={`https://www.google.com/maps?q=${b.latitude},${b.longitude}`} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[10px] text-[#4ade80] hover:underline">
                📍 Google Maps
              </a>
            )}
          </div>
        </div>

        {/* Horaires & Services */}
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#67766a]">Horaires & Services</p>
          <div className="space-y-1 text-xs text-[#e8efe8]">
            {b.openingHours && <div>🕐 {b.openingHours}</div>}
            {services && <div>🔧 {services}</div>}
            {b.cuisine && <div>🍽️ {b.cuisine}</div>}
          </div>
        </div>

        {/* Équipements */}
        {(b.wheelchair || b.wifi || b.parking || b.outdoorSeating || b.airConditioning || b.reservation || b.takeaway || b.delivery) && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#67766a]">Équipements</p>
            <div className="flex flex-wrap gap-1">
              {b.wheelchair === "yes" && <span className="rounded-full bg-[rgba(74,222,128,.1)] px-2 py-0.5 text-[10px] font-medium text-[#4ade80]">♿ Accessible</span>}
              {b.wifi === "yes" && <span className="rounded-full bg-[rgba(74,222,128,.1)] px-2 py-0.5 text-[10px] font-medium text-[#4ade80]">📶 Wi-Fi</span>}
              {b.outdoorSeating === "yes" && <span className="rounded-full bg-[rgba(74,222,128,.1)] px-2 py-0.5 text-[10px] font-medium text-[#4ade80]">☀️ Terrasse</span>}
              {b.airConditioning === "yes" && <span className="rounded-full bg-[rgba(59,130,246,.1)] px-2 py-0.5 text-[10px] font-medium text-[#3b82f6]">❄️ Clim</span>}
              {b.parking && b.parking !== "no" && <span className="rounded-full bg-[rgba(236,255,220,0.06)] px-2 py-0.5 text-[10px] font-medium text-[#9fb3a4]">🅿️ {b.parking}</span>}
              {b.reservation === "yes" && <span className="rounded-full bg-[rgba(74,222,128,.1)] px-2 py-0.5 text-[10px] font-medium text-[#4ade80]">📅 Réservation</span>}
              {b.takeaway === "yes" && <span className="rounded-full bg-[rgba(167,139,250,.1)] px-2 py-0.5 text-[10px] font-medium text-[#a78bfa]">🥡 À emporter</span>}
              {b.delivery === "yes" && <span className="rounded-full bg-[rgba(167,139,250,.1)] px-2 py-0.5 text-[10px] font-medium text-[#a78bfa]">🚚 Livraison</span>}
              {b.paymentCard && <span className="rounded-full bg-[rgba(236,255,220,0.06)] px-2 py-0.5 text-[10px] font-medium text-[#9fb3a4]">💳 CB</span>}
            </div>
          </div>
        )}

        {/* Réseaux sociaux */}
        {(b.facebook || b.instagram || b.twitter || b.linkedin || b.youtube) && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#67766a]">Réseaux sociaux</p>
            <div className="flex flex-wrap gap-1">
              {b.facebook && <a href={b.facebook} target="_blank" rel="noreferrer" className="rounded-md border border-[rgba(236,255,220,0.09)] bg-[#0e120f] px-2 py-1 text-[10px] font-medium text-[#9fb3a4] hover:border-[rgba(236,255,220,0.18)] transition">📘 Facebook</a>}
              {b.instagram && <a href={b.instagram} target="_blank" rel="noreferrer" className="rounded-md border border-[rgba(236,255,220,0.09)] bg-[#0e120f] px-2 py-1 text-[10px] font-medium text-[#9fb3a4] hover:border-[rgba(236,255,220,0.18)] transition">📷 Instagram</a>}
              {b.twitter && <a href={b.twitter} target="_blank" rel="noreferrer" className="rounded-md border border-[rgba(236,255,220,0.09)] bg-[#0e120f] px-2 py-1 text-[10px] font-medium text-[#9fb3a4] hover:border-[rgba(236,255,220,0.18)] transition">🐦 Twitter</a>}
              {b.linkedin && <a href={b.linkedin} target="_blank" rel="noreferrer" className="rounded-md border border-[rgba(236,255,220,0.09)] bg-[#0e120f] px-2 py-1 text-[10px] font-medium text-[#9fb3a4] hover:border-[rgba(236,255,220,0.18)] transition">💼 LinkedIn</a>}
              {b.youtube && <a href={b.youtube} target="_blank" rel="noreferrer" className="rounded-md border border-[rgba(236,255,220,0.09)] bg-[#0e120f] px-2 py-1 text-[10px] font-medium text-[#9fb3a4] hover:border-[rgba(236,255,220,0.18)] transition">▶️ YouTube</a>}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#67766a]">Avis clients ({reviews.length})</p>
            <div className="space-y-2">
              {reviews.slice(0, 4).map((r, i) => (
                <div key={i} className="rounded-lg border border-[rgba(236,255,220,0.06)] bg-[#0e120f] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#e8efe8]">{r.author}</span>
                    <span className="text-[10px] text-[#fbbf24]">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#9fb3a4] line-clamp-2">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other tags */}
        {otherTags.length > 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#67766a]">Autres infos ({otherTags.length})</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 lg:grid-cols-3">
              {otherTags.slice(0, 18).map(([k, v]) => (
                <div key={k} className="text-[11px] text-[#9fb3a4]">
                  <span className="text-[#67766a]">{k}:</span> <span className="text-[#e8efe8]">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
