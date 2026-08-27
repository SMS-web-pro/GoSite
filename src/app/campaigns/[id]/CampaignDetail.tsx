"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { detectProspectCurrency, formatPrice } from "@/lib/prompt-generator";

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

type Prospect = {
  id: number;
  workflowStage: string;
  quoteAmount: number | null;
  paymentStatus: string | null;
  paymentDate: Date | string | null;
  updatedAt: Date | string;
  externalDemoUrl: string | null;
  externalSiteUrl: string | null;
};

type Business = {
  id: number;
  name: string;
  city: string | null;
  country: string | null;
  phone: string | null;
  subcategory: string | null;
  website: string | null;
  rating: string | null;
};

type Item = { prospect: Prospect; business: Business };

type Settings = {
  priceEUR: number | null;
  priceUSD: number | null;
  priceMAD: number | null;
  paymentLinkEUR: string | null;
  paymentLinkUSD: string | null;
  paymentLinkMAD: string | null;
  paymentLink: string | null;
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

export default function CampaignDetail({ campaign, items, messageLogs = [], settings }: { campaign: Campaign; items: Item[]; messageLogs?: any[]; settings?: Settings }) {
  const router = useRouter();
  const byStage = items.reduce((acc, item) => {
    const stage = item.prospect.workflowStage;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(item);
    return acc;
  }, {} as Record<string, Item[]>);

  const stageOrder = ["discovered", "contacted", "demo_sent", "quoted", "paid", "delivered", "completed"];

  // Helper to get price for a prospect based on its business location
  const getProspectPrice = (item: Item): number => {
    const p = item.prospect as any;
    if (p.paymentAmount) return p.paymentAmount;
    const currency = detectProspectCurrency(item.business.country || null, item.business.city || null);
    if (currency === "EUR") return settings?.priceEUR || 0;
    if (currency === "USD") return settings?.priceUSD || 0;
    if (currency === "MAD") return settings?.priceMAD || 0;
    return settings?.priceEUR || 0;
  };

  const saleStages = ["paid", "delivered", "completed"];

  // Per-currency value computation
  const getValueByCurrency = (items: Item[]) => {
    const result = { eur: 0, usd: 0, mad: 0 };
    for (const i of items) {
      const p = i.prospect as any;
      const curr = detectProspectCurrency(i.business.country || null, i.business.city || null);
      const amount = p.paymentAmount || getProspectPrice(i);
      if (curr === "EUR") result.eur += amount;
      else if (curr === "USD") result.usd += amount;
      else result.mad += amount;
    }
    return result;
  };

  const totalByCurrency = getValueByCurrency(items);
  const paidItems = items.filter((i) => saleStages.includes((i.prospect as any).workflowStage) || i.prospect.paymentStatus === "paid");
  const paidByCurrency = getValueByCurrency(paidItems);

  const formatMultiCurrency = (vals: { eur: number; usd: number; mad: number }) => {
    const parts: string[] = [];
    if (vals.eur > 0) parts.push(formatPrice(vals.eur, "EUR"));
    if (vals.usd > 0) parts.push(formatPrice(vals.usd, "USD"));
    if (vals.mad > 0) parts.push(formatPrice(vals.mad, "MAD"));
    return parts.length > 0 ? parts.join(" + ") : "0 €";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="mx-auto max-w-[1380px] px-6 py-10 lg:px-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <Link href="/campaigns" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2}>
                  <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
                </svg>
                Toutes les campagnes
              </Link>
              <DeleteCampaignButton campaignId={campaign.id} campaignName={campaign.name} />
            </div>
            <div className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{campaign.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {campaign.sector && <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-700">{campaign.sector}</span>}
                {campaign.location && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">📍 {campaign.location}</span>}
                <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-violet-700">
                  {campaign.language === "en" ? "🇬🇧 English" : campaign.language === "ar" ? "🇸🇦 العربية" : "🇫🇷 Français"}
                </span>
                {campaign.currency && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-700">
                    {campaign.currency === "USD" ? "💵 USD" : campaign.currency === "MAD" ? "💰 MAD" : "💶 EUR"}
                  </span>
                )}
                <span className={`rounded-full px-2.5 py-0.5 ${campaign.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {campaign.status === "active" ? "🟢 Active" : campaign.status}
                </span>
              </div>
              {campaign.description ? (
                <p className="mt-2 text-sm text-slate-600">{campaign.description}</p>
              ) : null}
            </div>
            {campaign.sector && campaign.location ? (
              <Link
                href={`/search?sector=${encodeURIComponent(campaign.sector)}&location=${encodeURIComponent(campaign.location)}&campaignId=${campaign.id}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-700 hover:to-indigo-700"
              >
                🔍 Lancer une recherche pour cette campagne
              </Link>
            ) : (
              <EditCampaignButton campaign={campaign} />
            )}
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatBox label="Prospects" value={items.length} icon="🎯" />
          <StatBox label="Messages envoyés" value={messageLogs.length} icon="📨" />
          <StatBox label="Ventes conclues" value={items.filter((i) => saleStages.includes((i.prospect as any).workflowStage) || i.prospect.paymentStatus === "paid").length} icon="✅" tone="emerald" />
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Valeur potentielle totale</p>
            <p className="text-2xl font-bold text-slate-900">{formatMultiCurrency(totalByCurrency)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs text-emerald-600">Chiffre d'affaires réalisé</p>
            <p className="text-2xl font-bold text-emerald-900">{formatMultiCurrency(paidByCurrency)}</p>
           </div>
         </div>

        {/* CSV/Excel/Text import panel */}
        <ImportPanel campaignId={campaign.id} onImported={() => router.push("/prospects")} />

        <h2 className="mb-3 text-sm font-bold text-slate-900">Pipeline de la campagne</h2>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Aucun prospect dans cette campagne. Allez sur la <Link href="/dashboard" className="text-blue-600 hover:underline">page d'accueil</Link> pour faire une recherche, ou importez un fichier ci-dessous.
          </div>
        ) : (
          <div className="space-y-4">
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
                  <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {byStage[stage].map((item) => (
                      <li key={item.prospect.id}>
                        <Link
                          href={`/prospects/${item.prospect.id}`}
                          className="group block rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition hover:border-blue-300 hover:bg-white hover:shadow"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate text-sm font-semibold text-slate-900">
                                {item.business.name}
                              </h4>
                              <p className="truncate text-xs text-slate-500">
                                {item.business.subcategory || ""} {item.business.city && `· ${item.business.city}`}
                              </p>
                            </div>
                            {item.prospect.externalDemoUrl ? (
                              <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700" title="Démo externe">
                                🎨
                              </span>
                            ) : null}
                            {item.prospect.externalSiteUrl ? (
                              <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700" title="Site final externe">
                                🚀
                              </span>
                            ) : null}
                          </div>
                          {getProspectPrice(item) > 0 ? (
                            <p className="mt-1.5 text-xs font-semibold text-slate-700">
                              {formatPrice(getProspectPrice(item), detectProspectCurrency(item.business.country || null, item.business.city || null))}
                            </p>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function StatBox({ label, value, icon, tone = "slate" }: { label: string; value: number; icon: string; tone?: "slate" | "emerald" }) {
  const tones: Record<string, string> = {
    slate: "from-slate-50 to-white border-slate-200",
    emerald: "from-emerald-50 to-white border-emerald-200",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function EditCampaignButton({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);
  const [sector, setSector] = useState(campaign.sector || "");
  const [location, setLocation] = useState(campaign.location || "");
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description || "");
  const [language, setLanguage] = useState(campaign.language || "fr");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Auto-set currency from language
  const langToCurrency: Record<string, string> = { fr: "EUR", en: "USD", ar: "MAD" };
  const currency = langToCurrency[language] || "EUR";
  const currencySymbol: Record<string, string> = { EUR: "€", USD: "$", MAD: "MAD" };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sector, location, description, language, currency }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        ✏️ Configurer
      </button>
    );
  }

  return (
    <div className="w-full sm:w-auto sm:max-w-md rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
      <p className="text-sm font-bold text-amber-900 mb-2">Configurer la campagne</p>
      <div className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la campagne"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <input
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          placeholder="Secteur (ex. restaurant, coiffeur)"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Localisation (ex. Paris, France)"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnel)"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Langue :</span>
          {(["fr", "en", "ar"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                language === lang
                  ? "bg-amber-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {lang === "fr" ? "🇫🇷 FR" : lang === "en" ? "🇬🇧 EN" : "🇸🇦 AR"}
            </button>
          ))}
          <span className="ml-2 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
            Devise : {currencySymbol[currency]} ({currency})
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {saving ? "..." : "Sauvegarder"}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteCampaignButton({ campaignId, campaignName }: { campaignId: number; campaignName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [keepProspects, setKeepProspects] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const del = async () => {
    setDeleting(true);
    try {
      const url = `/api/campaigns/${campaignId}${keepProspects ? "?keep=prospects" : ""}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        if (keepProspects) {
          // Stay on the page and just refresh
          router.refresh();
        } else {
          router.push("/campaigns");
        }
        setConfirming(false);
        setKeepProspects(false);
        setDeleting(false);
      } else {
        alert("Erreur: " + (data.error || "Suppression impossible"));
        setDeleting(false);
      }
    } catch (e) {
      alert("Erreur réseau");
      setDeleting(false);
    }
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        Supprimer la campagne
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border-2 border-red-300 bg-red-50 p-3">
      <p className="text-xs font-semibold text-red-900">
        ⚠️ Supprimer <strong>{campaignName}</strong> ?
      </p>
      <label className="flex cursor-pointer items-start gap-2 text-xs text-red-800">
        <input
          type="checkbox"
          checked={keepProspects}
          onChange={(e) => setKeepProspects(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5"
        />
        <span>
          <strong>Garder les prospects</strong> (les détacher de la campagne)
          <br />
          <span className="text-[10px] text-red-600">
            Décoché = suppression cascade (prospects + businesses + messages)
          </span>
        </span>
      </label>
      <div className="flex items-center gap-2">
        <button
          onClick={del}
          disabled={deleting}
          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "Suppression..." : keepProspects ? "Détacher" : "Supprimer tout"}
        </button>
        <button
          onClick={() => { setConfirming(false); setKeepProspects(false); }}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

/**
 * ImportPanel — import a CSV / TSV / Excel-pasted text of prospects
 * into this campaign. The first row is treated as the header (unless
 * the user disables it). The system auto-detects common column names
 * (Name/Nom, Phone/Tel, Email, etc.) in French and English.
 */
function ImportPanel({
  campaignId,
  onImported,
}: {
  campaignId: number;
  onImported: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    imported?: number;
    errors?: number;
    message?: string;
    details?: { inserted: Array<{ id: number; name: string; phone: string }>; errors: Array<{ row: number; error: string }> };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sample = `Nom, Téléphone, Email, Adresse, Site web, Note
Cabinet Dupont, +33 5 56 12 34 56, contact@dupont.fr, 12 rue de la Paix 75002 Paris, https://dupont.fr, 4.5
Pharmacie Centrale, +33 4 78 90 12 34, info@pharma.fr, 5 place Bellecour 69002 Lyon, https://pharma.fr, 4.7
Restaurant Le Bistrot, +33 5 61 22 33 44, hello@bistrot.fr, 8 rue du Capitole 31000 Toulouse,, 4.8`;

  const importText = async () => {
    if (!text.trim()) {
      setResult({ ok: false, message: "Collez du contenu ou uploadez un fichier" });
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({
          ok: false,
          message: data.error || "Erreur d'import",
          details: data.details,
        });
        return;
      }
      setResult({ ok: true, ...data });
      setText("");
      onImported();
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : "Erreur réseau" });
    } finally {
      setImporting(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      setText(content);
    } catch {
      setResult({ ok: false, message: "Impossible de lire le fichier" });
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="group mb-4 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 text-sm font-bold text-blue-700 shadow-sm transition hover:border-blue-500 hover:from-blue-100 hover:to-indigo-100"
      >
        <span className="text-2xl">📥</span>
        <div className="text-left">
          <p>Importer des prospects en masse</p>
          <p className="text-[10px] font-normal text-blue-600">
            CSV · Excel · Texte — Collez ou uploadez un fichier
          </p>
        </div>
        <span className="ml-2 text-xl opacity-50 group-hover:opacity-100">→</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">📥 Importer des prospects</h3>
            <p className="text-xs text-slate-500">
              Collez vos données ou uploadez un fichier. Le système détecte automatiquement les colonnes.
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
            aria-label="Fermer"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

      <p className="mb-3 text-xs text-blue-800">
        Collez vos données (Excel, CSV, Google Sheets) ou uploadez un fichier. Le système détecte automatiquement les colonnes <strong>Nom</strong>, <strong>Téléphone</strong>, <strong>Email</strong>, <strong>Adresse</strong>, <strong>Site web</strong>, <strong>Note</strong> en français et en anglais.
      </p>

      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
        >
          📁 Choisir un fichier (.csv, .tsv, .txt)
        </button>
        <button
          onClick={() => setText(sample)}
          className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
        >
          ✨ Charger un exemple
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt,text/csv,text/plain"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Collez ici vos données au format CSV / TSV / Excel..."
        rows={8}
        className="w-full rounded-lg border border-blue-200 bg-white p-3 font-mono text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={importText}
          disabled={importing || !text.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {importing ? "Import en cours..." : `📥 Importer ${text.trim() ? "" : "(coller d'abord)"}`}
        </button>
        <button
          onClick={() => { setText(""); setResult(null); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
        >
          Effacer
        </button>
      </div>

      {result && (
        <div
          className={`mt-3 rounded-lg border-2 p-3 text-sm ${
            result.ok
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-red-300 bg-red-50 text-red-900"
          }`}
        >
          {result.ok ? (
            <div>
              <p className="font-bold">
                ✅ {result.imported} prospect{result.imported! > 1 ? "s" : ""} importé{result.imported! > 1 ? "s" : ""} avec succès
                {result.errors ? `, ${result.errors} erreur${result.errors > 1 ? "s" : ""}` : ""}
              </p>
              {result.details?.inserted && result.details.inserted.length > 0 && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-emerald-700">Voir la liste ({result.details.inserted.length})</summary>
                  <ul className="mt-1 max-h-32 overflow-y-auto rounded bg-emerald-100 p-2">
                    {result.details.inserted.map((p) => (
                      <li key={p.id}>
                        ✓ {p.name} ({p.phone}) — <Link href={`/prospects/${p.id}`} className="underline">voir</Link>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ) : (
            <div>
              <p className="font-bold">❌ {result.message}</p>
              {result.details?.errors && result.details.errors.length > 0 && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-red-700">Détails des erreurs</summary>
                  <ul className="mt-1 max-h-32 overflow-y-auto rounded bg-red-100 p-2">
                    {result.details.errors.map((e, i) => (
                      <li key={i}>Ligne {e.row}: {e.error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
