"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Campaign = {
  id: number;
  name: string;
  description: string | null;
  sector: string | null;
  location: string | null;
  language: string | null;
  currency: string | null;
  status: string;
  createdAt: Date | string;
};

type Item = {
  campaign: Campaign;
  prospectCount: number;
};

export default function CampaignsList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("fr");
  const [creating, setCreating] = useState(false);

  // Auto-set currency from language
  const langToCurrency: Record<string, string> = { fr: "EUR", en: "USD", ar: "MAD" };
  const currency = langToCurrency[language] || "EUR";
  const currencySymbol: Record<string, string> = { EUR: "€", USD: "$", MAD: "MAD" };
  // Bulk selection state
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const [keepProspectsOnBulk, setKeepProspectsOnBulk] = useState(false);

  const allIds = items.map((i) => i.campaign.id);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggleOne = useCallback(
    (id: number) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    []
  );
  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  }, [allSelected, allIds]);

  const bulkDelete = useCallback(async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/campaigns/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selected),
          keepProspects: keepProspectsOnBulk,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelected(new Set());
        setConfirmingBulk(false);
        setKeepProspectsOnBulk(false);
        router.refresh();
      } else {
        alert("Erreur: " + (data.error || "Suppression impossible"));
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setBulkDeleting(false);
    }
  }, [selected, keepProspectsOnBulk, router]);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sector, location, description, language, currency }),
      });
      const data = await res.json();
      if (res.ok && data.campaign) {
        router.push(`/campaigns/${data.campaign.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowNew(true)}
        className="w-full rounded-2xl border-2 border-dashed border-[rgba(236,255,220,0.15)] bg-transparent p-6 text-sm font-medium text-[#67766a] transition hover:border-[rgba(74,222,128,.3)]"
      >
        + Créer une nouvelle campagne
      </button>

      {showNew && (
        <div className="rounded-2xl border border-[rgba(74,222,128,.2)] bg-[rgba(74,222,128,.05)] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#4ade80]">Nouvelle campagne</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la campagne (ex. Restaurants Paris Q1)"
              className="rounded-xl border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
            />
            <input
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Secteur (ex. restaurant)"
              className="rounded-xl border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Localisation (ex. Paris, France)"
              className="rounded-xl border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optionnel)"
              className="rounded-xl border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-[#67766a]">Langue :</span>
            {(["fr", "en", "ar"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  language === lang
                    ? "bg-[#d9ff4d] text-[#0a0d0b]"
                    : "border border-[rgba(236,255,220,0.09)] bg-[#0e120f] text-[#9fb3a4] hover:border-[rgba(236,255,220,0.18)]"
                }`}
              >
                {lang === "fr" ? "🇫🇷 FR" : lang === "en" ? "🇬🇧 EN" : "🇸🇦 AR"}
              </button>
            ))}
            <span className="ml-2 rounded-lg bg-[rgba(251,191,36,.12)] px-2 py-1 text-[10px] font-bold text-[#fbbf24]">
              Devise : {currencySymbol[currency]} ({currency})
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={create}
              disabled={creating || !name.trim()}
              className="rounded-xl bg-[#d9ff4d] px-4 py-2 text-sm font-semibold text-[#0a0d0b] hover:bg-[#4ade80] disabled:opacity-50"
            >
              {creating ? "Création..." : "Créer et lancer une recherche"}
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="rounded-xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] px-4 py-2 text-sm font-medium text-[#9fb3a4] hover:border-[rgba(236,255,220,0.18)]"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !showNew ? (
        <div className="rounded-2xl border border-dashed border-[rgba(236,255,220,0.15)] bg-transparent p-10 text-center text-sm text-[#67766a]">
          Aucune campagne. Créez-en une pour organiser votre prospection par secteur / zone.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Sticky action bar when items are selected */}
          {selected.size > 0 && (
            <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(74,222,128,.3)] bg-[rgba(74,222,128,.08)] p-3 shadow-lg">
              <div className="flex items-center gap-3 text-sm text-[#4ade80]">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#d9ff4d] font-bold text-[#0a0d0b]">
                  {selected.size}
                </span>
                <span className="font-semibold">
                  campagne{selected.size > 1 ? "s" : ""} sélectionnée{selected.size > 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-[#d9ff4d] hover:underline"
                >
                  Tout désélectionner
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-1 text-xs text-[#4ade80]">
                  <input
                    type="checkbox"
                    checked={keepProspectsOnBulk}
                    onChange={(e) => setKeepProspectsOnBulk(e.target.checked)}
                    className="h-3.5 w-3.5 rounded text-[#4ade80] border-[rgba(236,255,220,0.18)]"
                  />
                  <span>Garder les prospects</span>
                </label>
                {!confirmingBulk ? (
                  <button
                    onClick={() => setConfirmingBulk(true)}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-red-700"
                  >
                    🗑️ Supprimer la sélection
                  </button>
                ) : (
                  <>
                    <span className="text-xs text-red-400">Confirmer ?</span>
                    <button
                      onClick={bulkDelete}
                      disabled={bulkDeleting}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
                    >
                      {bulkDeleting ? "..." : "Oui, supprimer"}
                    </button>
                    <button
                      onClick={() => setConfirmingBulk(false)}
                      className="rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#0e120f] px-3 py-1.5 text-sm text-[#9fb3a4]"
                    >
                      Annuler
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Select-all bar */}
          <div className="flex items-center gap-3 rounded-xl border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-4 py-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#9fb3a4]">
              <input
                type="checkbox"
                checked={items.length > 0 && items.every((i) => selected.has(i.campaign.id))}
                ref={(el) => {
                  if (el) {
                    el.indeterminate =
                      selected.size > 0 && !items.every((i) => selected.has(i.campaign.id));
                  }
                }}
                onChange={toggleAll}
                className="h-4 w-4 rounded text-[#4ade80] border-[rgba(236,255,220,0.18)]"
              />
              <span>
                {items.every((i) => selected.has(i.campaign.id)) && selected.size > 0
                  ? `Tout désélectionner (${items.length})`
                  : selected.size > 0
                    ? `${selected.size} sélectionnée(s) sur ${items.length}`
                    : `Tout sélectionner (${items.length})`}
              </span>
            </label>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map(({ campaign, prospectCount }) => {
              const isSelected = selected.has(campaign.id);
              return (
                <li
                  key={campaign.id}
                  className={`rounded-2xl border p-5 shadow-sm transition ${
                    isSelected
                      ? "border-[rgba(74,222,128,.3)] bg-[rgba(74,222,128,.05)]"
                      : "border-[rgba(236,255,220,0.09)] bg-[#0e120f] hover:border-[rgba(74,222,128,.3)]"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(campaign.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 h-4 w-4 shrink-0 rounded text-[#4ade80] border-[rgba(236,255,220,0.18)]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-base font-bold text-[#e8efe8]">
                          {campaign.name}
                        </h3>
                      </div>
                      {campaign.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-[#67766a]">
                          {campaign.description}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                        {campaign.sector && (
                          <span className="rounded-full bg-[rgba(74,222,128,.12)] px-2 py-0.5 text-[#4ade80]">
                            {campaign.sector}
                          </span>
                        )}
                        {campaign.location && (
                          <span className="rounded-full bg-[#151b13] px-2 py-0.5 text-[#9fb3a4]">
                            📍 {campaign.location}
                          </span>
                        )}
                        <span className="rounded-full bg-[rgba(167,139,250,.12)] px-2 py-0.5 text-[#a78bfa]">
                          {campaign.language === "en" ? "🇬🇧 EN" : campaign.language === "ar" ? "🇸🇦 AR" : "🇫🇷 FR"}
                        </span>
                        {campaign.currency && (
                          <span className="rounded-full bg-[rgba(251,191,36,.12)] px-2 py-0.5 text-[#fbbf24]">
                            {campaign.currency === "USD" ? "💵 USD" : campaign.currency === "MAD" ? "💰 MAD" : "💶 EUR"}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 ${
                            campaign.status === "active"
                              ? "bg-[rgba(74,222,128,.12)] text-[#4ade80]"
                              : "bg-[#151b13] text-[#67766a]"
                          }`}
                        >
                          {campaign.status === "active" ? "🟢 Active" : campaign.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[rgba(236,255,220,0.09)] pt-3">
                    <span className="text-xs text-[#67766a]">
                      {prospectCount} prospect{prospectCount !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-3">
                      {campaign.sector && campaign.location ? (
                        <Link
                          href={`/search?sector=${encodeURIComponent(campaign.sector)}&location=${encodeURIComponent(campaign.location)}&campaignId=${campaign.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#4ade80] hover:underline"
                        >
                          🔍 Prospecter
                        </Link>
                      ) : null}
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="text-xs font-semibold text-[#4ade80] hover:underline"
                      >
                        Voir détails →
                      </Link>
                      <DeleteCampaignButtonSmall
                        campaignId={campaign.id}
                        campaignName={campaign.name}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function DeleteCampaignButtonSmall({ campaignId, campaignName }: { campaignId: number; campaignName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const del = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, { method: "DELETE" });
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
        title="Supprimer cette campagne"
        className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline"
      >
        🗑️
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded border border-[rgba(239,68,68,.3)] bg-[rgba(239,68,68,.08)] px-1.5 py-0.5 text-[10px]" onClick={(e) => e.stopPropagation()}>
      <span className="text-red-400">Supprimer "{campaignName.slice(0, 18)}{campaignName.length > 18 ? "..." : ""}" (et ses prospects) ?</span>
      <button
        onClick={del}
        disabled={deleting}
        className="rounded bg-red-600 px-1.5 py-0.5 font-bold text-white disabled:opacity-50"
      >
        {deleting ? "..." : "Oui"}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
        className="rounded bg-[#0e120f] px-1.5 py-0.5 text-[#9fb3a4]"
      >
        Non
      </button>
    </span>
  );
}
