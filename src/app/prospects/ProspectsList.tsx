"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { detectProspectCurrency, formatPrice } from "@/lib/prompt-generator";
import type { ScrapedBusiness } from "@/lib/types";

type Item = {
  prospect: {
    id: number;
    workflowStage: string;
    quoteAmount: number | null;
    paymentAmount: number | null;
    paymentStatus: string | null;
    updatedAt: Date | string | null;
  };
  business: ScrapedBusiness & {
    id: number;
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
};

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  bing_maps: { label: "Bing Maps", color: "bg-sky-50 text-sky-700 border-sky-200" },
  openstreetmap: { label: "OpenStreetMap", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  photon: { label: "Photon (OSM)", color: "bg-violet-50 text-violet-700 border-violet-200" },
};

function safeJson(s: string): Record<string, unknown> | null {
  try { return JSON.parse(s); } catch { return null; }
}

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</h4>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

function InfoIcon({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-slate-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
        <div className="text-xs text-slate-700">{value}</div>
      </div>
    </div>
  );
}

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "blue" | "amber" | "green" | "violet" | "purple" }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    purple: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${tones[tone]}`}>{children}</span>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
      <span>{icon}</span> {label}
    </a>
  );
}

function EquipLine({ label, value }: { label: string; value: string }) {
  const yes = value === "yes";
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span>{label}</span>
      <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium ${yes ? "bg-emerald-100 text-emerald-700" : value === "no" ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-700"}`}>
        {value}
      </span>
    </div>
  );
}

export default function ProspectsList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<Map<string, boolean>>(new Map());
  const [checkingWhatsapp, setCheckingWhatsapp] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterWhatsapp, setFilterWhatsapp] = useState<"all" | "yes" | "no">("all");
  const [filterWebsite, setFilterWebsite] = useState<"all" | "yes" | "no">("all");

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
    (async () => {
      const newMap = new Map<string, boolean>();
      let errorMsg: string | null = null;
      for (const chunk of chunks) {
        try {
          const res = await fetch("/api/whatsapp/check-numbers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numbers: chunk }),
          });
          const data = await res.json();
          if (data.error) {
            errorMsg = data.error;
            break;
          }
          if (data.results) {
            for (const r of data.results) {
              newMap.set(r.phone, r.exists);
            }
          }
        } catch {
          errorMsg = "Erreur réseau";
        }
      }
      setWhatsappStatus(newMap);
      setWaError(errorMsg);
      setCheckingWhatsapp(false);
    })();
  }, [items]);

  const allIds = useMemo(() => items.map((i) => i.prospect.id), [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterWhatsapp === "yes") {
        const phone = item.business.phone;
        if (!phone || !whatsappStatus.get(phone)) return false;
      }
      if (filterWhatsapp === "no") {
        const phone = item.business.phone;
        if (phone && whatsappStatus.get(phone)) return false;
      }
      if (filterWebsite === "yes" && !item.business.website) return false;
      if (filterWebsite === "no" && item.business.website) return false;
      return true;
    });
  }, [items, filterWhatsapp, filterWebsite, whatsappStatus]);

  const allSelected = selected.size > 0 && filteredItems.every((i) => selected.has(i.prospect.id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleOne = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredItems.map((i) => i.prospect.id)));
    }
  }, [allSelected, filteredItems]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const bulkDelete = useCallback(async () => {
    if (selected.size === 0) {
      alert("Aucun prospect sélectionné");
      return;
    }
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/prospects/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        clearSelection();
        setConfirmingBulk(false);
        router.refresh();
      } else {
        alert("Erreur: " + (data.error || "Suppression impossible"));
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setBulkDeleting(false);
    }
  }, [selected, clearSelection, router]);

  if (filteredItems.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 p-12 text-center">
        <p className="text-2xl">🎯</p>
        <h2 className="mt-3 text-lg font-semibold text-slate-900">
          {items.length === 0 ? "Aucun prospect pour l'instant" : "Aucun résultat pour ces filtres"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {items.length === 0
            ? "Allez sur la page d'accueil, faites une recherche et cliquez sur \"🎯 Prospecter\" sur un business."
            : "Essayez de modifier les filtres ou réinitialisez-les."}
        </p>
        {items.length === 0 ? (
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Démarrer une recherche
          </Link>
        ) : (
          <button
            onClick={() => { setFilterWhatsapp("all"); setFilterWebsite("all"); }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>
    );
  }

  const byStage = filteredItems.reduce((acc, item) => {
    const stage = item.prospect.workflowStage;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(item);
    return acc;
  }, {} as Record<string, Item[]>);

  const stageOrder = ["discovered", "contacted", "demo_sent", "quoted", "paid", "delivered", "completed"];

  return (
    <div className="space-y-4">
      {selected.size > 0 && (
        <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-blue-400 bg-blue-50 p-3 shadow-lg">
          <div className="flex items-center gap-3 text-sm text-blue-900">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 font-bold text-white">
              {selected.size}
            </span>
            <span className="font-semibold">
              prospect{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
            </span>
            <button
              onClick={clearSelection}
              className="text-xs text-blue-700 hover:underline"
            >
              Tout désélectionner
            </button>
          </div>
          <div className="flex items-center gap-2">
            {!confirmingBulk ? (
              <button
                onClick={() => setConfirmingBulk(true)}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-red-700"
              >
                🗑️ Supprimer la sélection
              </button>
            ) : (
              <>
                <span className="text-xs text-red-900">Supprimer {selected.size} prospect(s) définitivement ?</span>
                <button
                  onClick={bulkDelete}
                  disabled={bulkDeleting}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
                >
                  {bulkDeleting ? "..." : "Oui, supprimer"}
                </button>
                <button
                  onClick={() => setConfirmingBulk(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                >
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={toggleAll}
            className="h-4 w-4 rounded"
          />
          <span>
            {allSelected
              ? `Tout désélectionner (${filteredItems.length})`
              : someSelected
                ? `${selected.size} sélectionné(s) sur ${filteredItems.length}`
                : `Tout sélectionner (${filteredItems.length})`}
          </span>
          {filteredItems.length !== items.length && (
            <span className="text-xs text-slate-400">({items.length} total)</span>
          )}
        </label>
        {checkingWhatsapp && (
          <span className="ml-auto text-xs text-blue-500">⏳ Vérification WhatsApp...</span>
        )}
        {!checkingWhatsapp && waError && (
          <span className="ml-auto text-xs text-red-500">⚠ {waError}</span>
        )}
        {!checkingWhatsapp && !waError && whatsappStatus.size > 0 && (
          <span className="ml-auto text-xs">
            <span className="font-semibold text-green-600">{Array.from(whatsappStatus.values()).filter(Boolean).length} WA ✓</span>
            <span className="text-slate-400 mx-1">·</span>
            <span className="font-semibold text-red-500">{Array.from(whatsappStatus.values()).filter((v) => !v).length} WA ✗</span>
          </span>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Filtrer :</span>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            onClick={() => setFilterWhatsapp("all")}
            className={`rounded-md px-2 py-1 text-xs font-medium transition ${filterWhatsapp === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >WA: Tous</button>
          <button
            onClick={() => setFilterWhatsapp("yes")}
            className={`rounded-md px-2 py-1 text-xs font-medium transition ${filterWhatsapp === "yes" ? "bg-green-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >WA ✓</button>
          <button
            onClick={() => setFilterWhatsapp("no")}
            className={`rounded-md px-2 py-1 text-xs font-medium transition ${filterWhatsapp === "no" ? "bg-red-500 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >WA ✗</button>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            onClick={() => setFilterWebsite("all")}
            className={`rounded-md px-2 py-1 text-xs font-medium transition ${filterWebsite === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >Web: Tous</button>
          <button
            onClick={() => setFilterWebsite("yes")}
            className={`rounded-md px-2 py-1 text-xs font-medium transition ${filterWebsite === "yes" ? "bg-green-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >🌐 Oui</button>
          <button
            onClick={() => setFilterWebsite("no")}
            className={`rounded-md px-2 py-1 text-xs font-medium transition ${filterWebsite === "no" ? "bg-red-500 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >🌐 Non</button>
        </div>
        {(filterWhatsapp !== "all" || filterWebsite !== "all") && (
          <button
            onClick={() => { setFilterWhatsapp("all"); setFilterWebsite("all"); }}
            className="text-xs text-blue-600 hover:underline"
          >Réinitialiser</button>
        )}
      </div>

      {stageOrder.filter((s) => byStage[s]).map((stage) => {
        const info = STAGE_INFO[stage] || STAGE_INFO.discovered;
        return (
          <div key={stage} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="text-lg">{info.icon}</span>
                {info.label}
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${info.color}`}>
                  {byStage[stage].length}
                </span>
              </h3>
            </div>
            <ul className="flex flex-col gap-3">
              {byStage[stage].map((item) => {
                const b = item.business;
                const isSelected = selected.has(item.prospect.id);
                const isExpanded = expandedId === item.prospect.id;
                const initials = b.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
                const popularity = b.popularity || 0;
                const popColor = popularity >= 70 ? "text-emerald-700 bg-emerald-100" : popularity >= 40 ? "text-amber-700 bg-amber-100" : "text-slate-600 bg-slate-100";
                const waValid = b.phone ? whatsappStatus.get(b.phone) : undefined;
                const sourceMeta = SOURCE_LABELS[b.source] || { label: b.source, color: "bg-slate-50 text-slate-700 border-slate-200" };

                return (
                  <li
                    key={item.prospect.id}
                    className={`group rounded-2xl border border-slate-200/80 bg-white shadow-sm transition ${
                      isSelected
                        ? "border-blue-400 ring-2 ring-blue-200"
                        : "hover:border-blue-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex flex-col gap-3 p-4 sm:flex-row">
                      <div className="flex items-start gap-3 sm:w-64 sm:shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(item.prospect.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                          {initials || "B"}
                          {waValid !== undefined && (
                            <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${waValid ? "bg-green-500" : "bg-red-400"}`} title={waValid ? "Numéro WhatsApp valide" : "Numéro non WhatsApp"} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <h3 className="truncate text-base font-semibold text-slate-900 flex-1" title={b.name}>{b.name}</h3>
                            {b.rating ? (
                              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-700">
                                ★ {b.rating}
                                {b.reviewsCount ? <span className="font-normal text-amber-600">({b.reviewsCount})</span> : null}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {b.subcategory ? (
                              <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-700">{b.subcategory}</span>
                            ) : null}
                            {b.cuisine ? (
                              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700" title="Type de cuisine">🍽️ {b.cuisine}</span>
                            ) : null}
                            {b.stars ? (
                              <span className="rounded-md bg-yellow-50 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700">{"★".repeat(parseInt(b.stars) || 1)}</span>
                            ) : null}
                            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${popColor}`} title={`Score de popularité basé sur ${b.detailCount} champs remplis`}>
                              ⚡ {popularity}
                            </span>
                            {b.source ? (
                              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${sourceMeta.color}`}>{sourceMeta.label}</span>
                            ) : null}
                          </div>
                          {b.description ? (
                            <p className="mt-1.5 line-clamp-2 text-xs text-slate-600" title={b.description}>
                              {b.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid flex-1 grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
                        {b.address || (b.street && b.city) ? (
                          <InfoIcon icon="📍" label="Adresse" value={
                            <span className="line-clamp-1" title={b.address || ""}>
                              {[b.housenumber, b.street, [b.postcode, b.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                            </span>
                          } />
                        ) : null}
                        {b.phone ? (
                          <InfoIcon icon="📞" label="Téléphone" value={
                            <span className="flex items-center gap-1.5">
                              <a href={`tel:${b.phone}`} className="font-medium text-blue-700 hover:underline">{b.phone}</a>
                              {waValid === true && <span className="text-[10px] font-bold text-green-600">WA ✓</span>}
                              {waValid === false && <span className="text-[10px] font-bold text-red-500">WA ✗</span>}
                            </span>
                          } />
                        ) : null}
                        {b.website ? (
                          <InfoIcon icon="🌐" label="Site web" value={
                            <a href={b.website} target="_blank" rel="noreferrer" className="truncate font-medium text-blue-700 hover:underline" title={b.website}>
                              {(() => { try { return new URL(b.website).hostname.replace("www.", ""); } catch { return b.website; } })()}
                            </a>
                          } />
                        ) : null}
                        {b.openingHours ? (
                          <InfoIcon icon="🕐" label="Horaires" value={
                            <span className="line-clamp-1" title={b.openingHours}>{b.openingHours}</span>
                          } />
                        ) : null}
                        {b.email ? (
                          <InfoIcon icon="✉️" label="Email" value={
                            <a href={`mailto:${b.email}`} className="truncate font-medium text-blue-700 hover:underline">{b.email}</a>
                          } />
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 bg-slate-50/40 px-4 py-2">
                      {b.wheelchair === "yes" && <Badge tone="blue">♿ Accessible</Badge>}
                      {b.wheelchair === "limited" && <Badge tone="amber">♿ Partiel</Badge>}
                      {b.wifi === "yes" && <Badge tone="blue">📶 Wi-Fi</Badge>}
                      {b.outdoorSeating === "yes" && <Badge tone="green">☀️ Terrasse</Badge>}
                      {b.takeaway === "yes" && <Badge tone="purple">🥡 À emporter</Badge>}
                      {b.delivery === "yes" && <Badge tone="purple">🚚 Livraison</Badge>}
                      {b.reservation === "yes" && <Badge tone="green">📅 Réservation</Badge>}
                      {b.airConditioning === "yes" && <Badge tone="blue">❄️ Clim</Badge>}
                      {b.parking && b.parking !== "no" && <Badge tone="slate">🅿️ {b.parking}</Badge>}
                      {b.paymentCard && <Badge tone="slate">💳 CB</Badge>}
                      {b.facebook && <Badge tone="blue">📘 Facebook</Badge>}
                      {b.instagram && <Badge tone="violet">📷 Instagram</Badge>}
                      {b.twitter && <Badge tone="blue">🐦 Twitter</Badge>}
                      {b.linkedin && <Badge tone="blue">💼 LinkedIn</Badge>}
                      {b.wikipedia && <Badge tone="amber">📚 Wikipedia</Badge>}

                      <div className="ml-auto flex items-center gap-1.5">
                        {b.phone && (
                          <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-slate-700">
                            📞 Appeler
                          </a>
                        )}
                        {b.googleMapsUrl && (
                          <a href={b.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-amber-700">
                            ⭐ Avis Google
                          </a>
                        )}
                        {b.bingUrl && (
                          <a href={b.bingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-sky-700">
                            📍 Bing
                          </a>
                        )}
                        <Link
                          href={`/prospects/${item.prospect.id}`}
                          className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 text-[10px] font-semibold text-white transition hover:from-amber-600 hover:to-orange-600"
                        >
                          🎯 Prospecter
                        </Link>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.prospect.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                        >
                          {isExpanded ? "Réduire" : "Détails"}
                          <svg viewBox="0 0 24 24" fill="none" className={`h-3 w-3 transition ${isExpanded ? "rotate-180" : ""}`} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {isExpanded ? <ExpandedDetails b={b} /> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function ExpandedDetails({ b }: { b: Item["business"] }) {
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
    <div className="grid gap-4 border-t border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {b.description ? (
        <Section title="Description">
          <p className="text-sm text-slate-700">{b.description}</p>
          {b.wikipedia ? (
            <a href={b.wikipedia} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[10px] text-blue-600 hover:underline">
              📚 Lire sur Wikipedia
            </a>
          ) : null}
        </Section>
      ) : null}

      <Section title="Adresse complète">
        <div className="text-sm text-slate-700">
          {b.housenumber || b.street ? <div>{b.housenumber} {b.street}</div> : null}
          {b.neighbourhood ? <div>{b.neighbourhood}</div> : null}
          {b.suburb ? <div>{b.suburb}</div> : null}
          {b.postcode || b.city ? <div>{b.postcode} {b.city}</div> : null}
          {b.state ? <div>{b.state}</div> : null}
          {b.country ? <div>{b.country}</div> : null}
        </div>
      </Section>

      {(b.phone || b.mobile || b.email || b.website) && (
        <Section title="Contact">
          <div className="space-y-1 text-sm">
            {b.phone ? <div><span className="text-slate-500">Tél :</span> <a href={`tel:${b.phone}`} className="font-medium text-blue-700 hover:underline">{b.phone}</a></div> : null}
            {b.mobile ? <div><span className="text-slate-500">Mobile :</span> <a href={`tel:${b.mobile}`} className="font-medium text-blue-700 hover:underline">{b.mobile}</a></div> : null}
            {b.email ? <div><span className="text-slate-500">Email :</span> <a href={`mailto:${b.email}`} className="font-medium text-blue-700 hover:underline">{b.email}</a></div> : null}
            {b.website ? <div><span className="text-slate-500">Web :</span> <a href={b.website} target="_blank" rel="noreferrer" className="break-all font-medium text-blue-700 hover:underline">{b.website}</a></div> : null}
          </div>
        </Section>
      )}

      {b.openingHours ? (
        <Section title="Horaires d'ouverture">
          <p className="text-sm text-slate-700">{b.openingHours}</p>
          <a href="https://wiki.openstreetmap.org/wiki/Key:opening_hours" target="_blank" rel="noreferrer" className="mt-1 text-[10px] text-slate-400 hover:underline">Format OpenStreetMap</a>
        </Section>
      ) : null}

      {(b.facebook || b.instagram || b.twitter || b.linkedin || b.youtube) && (
        <Section title="Réseaux sociaux">
          <div className="flex flex-wrap gap-1.5">
            {b.facebook ? <SocialLink href={b.facebook} icon="📘" label="Facebook" /> : null}
            {b.instagram ? <SocialLink href={b.instagram} icon="📷" label="Instagram" /> : null}
            {b.twitter ? <SocialLink href={b.twitter} icon="🐦" label="Twitter" /> : null}
            {b.linkedin ? <SocialLink href={b.linkedin} icon="💼" label="LinkedIn" /> : null}
            {b.youtube ? <SocialLink href={b.youtube} icon="▶️" label="YouTube" /> : null}
          </div>
        </Section>
      )}

      {(b.wheelchair || b.wifi || b.parking || b.outdoorSeating || b.airConditioning || b.reservation || b.takeaway || b.delivery) && (
        <Section title="Équipements & services">
          <div className="grid grid-cols-2 gap-1.5 text-sm">
            {b.wheelchair && <EquipLine label="♿ Accès handicapé" value={b.wheelchair} />}
            {b.wifi && <EquipLine label="📶 Wi-Fi" value={b.wifi} />}
            {b.parking && <EquipLine label="🅿️ Parking" value={b.parking} />}
            {b.outdoorSeating && <EquipLine label="☀️ Terrasse" value={b.outdoorSeating} />}
            {b.airConditioning && <EquipLine label="❄️ Climatisation" value={b.airConditioning} />}
            {b.reservation && <EquipLine label="📅 Réservation" value={b.reservation} />}
            {b.takeaway && <EquipLine label="🥡 À emporter" value={b.takeaway} />}
            {b.delivery && <EquipLine label="🚚 Livraison" value={b.delivery} />}
            {b.smoking && <EquipLine label="🚬 Tabac" value={b.smoking} />}
            {b.paymentCash && <EquipLine label="💵 Espèces" value={b.paymentCash} />}
            {b.paymentCard && <EquipLine label="💳 CB" value={b.paymentCard} />}
            {b.capacity && <EquipLine label="👥 Capacité" value={b.capacity} />}
          </div>
        </Section>
      )}

      <Section title="Voir sur les cartes">
        <div className="flex flex-col gap-1.5">
          {b.googleMapsUrl && (
            <a href={b.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-amber-700 hover:underline">
              ⭐ Avis Google Maps
            </a>
          )}
          {b.bingUrl && <a href={b.bingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-sky-700 hover:underline">📍 Bing Maps</a>}
          {b.osmUrl && <a href={b.osmUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-emerald-700 hover:underline">🗺️ OpenStreetMap</a>}
          {b.wikipedia && <a href={b.wikipedia} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:underline">📚 Wikipedia</a>}
        </div>
      </Section>

      {b.latitude && b.longitude ? (
        <Section title="Coordonnées GPS">
          <code className="block font-mono text-xs text-slate-600">{parseFloat(b.latitude).toFixed(6)}, {parseFloat(b.longitude).toFixed(6)}</code>
        </Section>
      ) : null}

      {otherTags.length > 0 ? (
        <Section title={`Autres tags OSM (${otherTags.length})`} className="sm:col-span-2 lg:col-span-3">
          <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3">
            {otherTags.slice(0, 30).map(([k, v]) => (
              <div key={k} className="text-xs text-slate-600">
                <span className="font-medium text-slate-500">{k}:</span>{" "}
                <span className="text-slate-700">{String(v)}</span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function DeleteProspectButtonSmall({ prospectId, prospectName }: { prospectId: number; prospectName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const del = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    try {
      const res = await fetch(`/api/prospects/${prospectId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert("Erreur: " + (data.error || "Suppression impossible"));
        setDeleting(false);
        setConfirming(false);
      }
    } catch {
      alert("Erreur réseau");
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(true); }}
        title="Supprimer ce prospect"
        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-[10px] font-semibold text-red-500 transition hover:border-red-300 hover:text-red-700"
      >
        🗑️
      </button>
    );
  }

  return (
    <span
      className="flex items-center justify-center gap-1 text-[10px]"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-red-700">Supprimer ?</span>
      <button
        onClick={del}
        disabled={deleting}
        className="rounded bg-red-600 px-1.5 py-0.5 font-bold text-white disabled:opacity-50"
      >
        {deleting ? "..." : "Oui"}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
        className="rounded bg-white px-1.5 py-0.5 text-slate-700"
      >
        Non
      </button>
    </span>
  );
}
