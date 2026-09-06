"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateDefaultWhatsAppMessages } from "@/lib/prompt-generator";

type Settings = {
  id: number;
  agencyName: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  portfolioUrl: string | null;
  whatsappNumber: string | null;
  whatsappSessionId: string | null;
  whatsappSessionPhone: string | null;
  whatsappSessionName: string | null;
  whatsappConnectedAt: Date | string | null;
  paymentLink: string | null;
  messageTemplates: {
    intro: string | { fr: string; en: string; ar: string };
    demo: string | { fr: string; en: string; ar: string };
    quote: string | { fr: string; en: string; ar: string };
    payment_received: string | { fr: string; en: string; ar: string };
    delivery: string | { fr: string; en: string; ar: string };
    thanks: string | { fr: string; en: string; ar: string };
    followup: string | { fr: string; en: string; ar: string };
  } | null;
  brandColor: string;
  logoUrl: string | null;
  updatedAt: Date;
};

const DEFAULT_TEMPLATES = generateDefaultWhatsAppMessages({});

export default function SettingsClient({ initialSettings }: { initialSettings: Settings }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"agency" | "pricing" | "whatsapp" | "messages">("whatsapp");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState(initialSettings.agencyName);
  const [contactName, setContactName] = useState(initialSettings.contactName);
  const [contactEmail, setContactEmail] = useState(initialSettings.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(initialSettings.contactPhone || "");
  const [websiteUrl, setWebsiteUrl] = useState(initialSettings.websiteUrl || "");
  const [portfolioUrl, setPortfolioUrl] = useState(initialSettings.portfolioUrl || "");
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings.whatsappNumber || "");
  const [paymentLink, setPaymentLink] = useState(initialSettings.paymentLink || "");
  const [brandColor, setBrandColor] = useState(initialSettings.brandColor);

  // Per-currency pricing (legacy single price, kept for back-compat)
  const [priceEUR, setPriceEUR] = useState(((initialSettings as any).priceEUR || 89900) / 100);
  const [priceUSD, setPriceUSD] = useState(((initialSettings as any).priceUSD || 99900) / 100);
  const [priceMAD, setPriceMAD] = useState(((initialSettings as any).priceMAD || 99900) / 100);

  // Per-currency payment links (legacy)
  const [paymentLinkEUR, setPaymentLinkEUR] = useState((initialSettings as any).paymentLinkEUR || "");
  const [paymentLinkUSD, setPaymentLinkUSD] = useState((initialSettings as any).paymentLinkUSD || "");
  const [paymentLinkMAD, setPaymentLinkMAD] = useState((initialSettings as any).paymentLinkMAD || "");

  // Split payment 2x — Deposit + Final (6 amounts + 6 links)
  const [depositPriceEUR, setDepositPriceEUR] = useState(((initialSettings as any).depositPriceEUR || 9900) / 100);
  const [depositPriceUSD, setDepositPriceUSD] = useState(((initialSettings as any).depositPriceUSD || 9900) / 100);
  const [depositPriceMAD, setDepositPriceMAD] = useState(((initialSettings as any).depositPriceMAD || 99000) / 100);
  const [finalPriceEUR, setFinalPriceEUR] = useState(((initialSettings as any).finalPriceEUR || 15000) / 100);
  const [finalPriceUSD, setFinalPriceUSD] = useState(((initialSettings as any).finalPriceUSD || 15000) / 100);
  const [finalPriceMAD, setFinalPriceMAD] = useState(((initialSettings as any).finalPriceMAD || 150000) / 100);
  const [depositPaymentLinkEUR, setDepositPaymentLinkEUR] = useState((initialSettings as any).depositPaymentLinkEUR || "");
  const [depositPaymentLinkUSD, setDepositPaymentLinkUSD] = useState((initialSettings as any).depositPaymentLinkUSD || "");
  const [depositPaymentLinkMAD, setDepositPaymentLinkMAD] = useState((initialSettings as any).depositPaymentLinkMAD || "");
  const [finalPaymentLinkEUR, setFinalPaymentLinkEUR] = useState((initialSettings as any).finalPaymentLinkEUR || "");
  const [finalPaymentLinkUSD, setFinalPaymentLinkUSD] = useState((initialSettings as any).finalPaymentLinkUSD || "");
  const [finalPaymentLinkMAD, setFinalPaymentLinkMAD] = useState((initialSettings as any).finalPaymentLinkMAD || "");

  const [templates, setTemplates] = useState(() => {
    const raw: Record<string, any> = initialSettings.messageTemplates || {};
    const normalized: Record<string, { fr: string; en: string; ar: string }> = {};
    const stageKeys = ["intro", "demo", "quote", "deposit_received", "final_payment_request", "final_payment_received", "delivery", "thanks"];
    for (const key of stageKeys) {
      let val = raw[key];
      // Alias handling: legacy payment_received -> deposit_received
      if (key === "deposit_received" && !val && raw["payment_received"]) {
        val = raw["payment_received"];
      }
      const defaultVal = DEFAULT_TEMPLATES[key as keyof typeof DEFAULT_TEMPLATES];
      if (val && typeof val === "object" && "fr" in val) {
        // Merge with defaults to ensure portfolio_url always exists
        const dbTpl = val as { fr: string; en: string; ar: string };
        normalized[key] = {
          fr: dbTpl.fr || defaultVal?.fr || "",
          en: dbTpl.en || defaultVal?.en || "",
          ar: dbTpl.ar || defaultVal?.ar || "",
        };
      } else if (typeof val === "string" && val.trim()) {
        normalized[key] = defaultVal || { fr: val, en: val, ar: val };
      } else {
        normalized[key] = defaultVal || { fr: "", en: "", ar: "" };
      }
    }
    return normalized;
  });

  const [editLang, setEditLang] = useState<"fr" | "en" | "ar">("fr");

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // Ensure portfolio_url is always in template signatures
      const safeTemplates: typeof templates = {};
      for (const [key, val] of Object.entries(templates)) {
        const fixed = { ...val };
        for (const lang of ["fr", "en", "ar"] as const) {
          if (fixed[lang] && !fixed[lang].includes("portfolio_url") && fixed[lang].includes("agency_website")) {
            fixed[lang] = fixed[lang].replace(
              /{{\/if}}{{#if agency_website}}/,
              '{{/if}}{{#if portfolio_url}}\ud83d\udcbc {{portfolio_url}}\n{{/if}}{{#if agency_website}}'
            );
          }
        }
        safeTemplates[key] = fixed;
      }
      // Back-compat alias: keep payment_received identical to deposit_received
      if (safeTemplates["deposit_received"] && !safeTemplates["payment_received"]) {
        safeTemplates["payment_received"] = { ...safeTemplates["deposit_received"] };
      }
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName,
          contactName,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          websiteUrl: websiteUrl || null,
          portfolioUrl: portfolioUrl || null,
          whatsappNumber: whatsappNumber || null,
          paymentLink: paymentLink || null,
          priceEUR: Math.round(priceEUR * 100),
          priceUSD: Math.round(priceUSD * 100),
          priceMAD: Math.round(priceMAD * 100),
          paymentLinkEUR: paymentLinkEUR || null,
          paymentLinkUSD: paymentLinkUSD || null,
          paymentLinkMAD: paymentLinkMAD || null,
          depositPriceEUR: Math.round(depositPriceEUR * 100),
          depositPriceUSD: Math.round(depositPriceUSD * 100),
          depositPriceMAD: Math.round(depositPriceMAD * 100),
          finalPriceEUR: Math.round(finalPriceEUR * 100),
          finalPriceUSD: Math.round(finalPriceUSD * 100),
          finalPriceMAD: Math.round(finalPriceMAD * 100),
          depositPaymentLinkEUR: depositPaymentLinkEUR || null,
          depositPaymentLinkUSD: depositPaymentLinkUSD || null,
          depositPaymentLinkMAD: depositPaymentLinkMAD || null,
          finalPaymentLinkEUR: finalPaymentLinkEUR || null,
          finalPaymentLinkUSD: finalPaymentLinkUSD || null,
          finalPaymentLinkMAD: finalPaymentLinkMAD || null,
          brandColor,
          messageTemplates: safeTemplates,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-1">
        {([
          ["agency", "🏢 Mon agence"],
          ["whatsapp", "📱 WhatsApp"],
          ["pricing", "💰 Tarifs"],
          ["messages", "💬 Templates messages"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === id
                ? "bg-[#d9ff4d] text-[#0a0d0b] shadow"
                : "text-[#67766a] hover:bg-[#151b13]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "agency" && (
        <div className="rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-6">
           <h2 className="text-sm font-semibold text-[#e8efe8]">🏢 Identité de l'agence</h2>
           <p className="text-xs text-[#67766a]">Ces informations apparaîtront dans vos messages WhatsApp et votre signature.</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nom de l'agence" value={agencyName} onChange={setAgencyName} placeholder="Vibecoder Studio" required />
            <Field label="Votre nom" value={contactName} onChange={setContactName} placeholder="Jean Dupont" required />
            <Field label="Email de contact" value={contactEmail} onChange={setContactEmail} placeholder="contact@agence.com" type="email" />
            <Field label="Téléphone direct" value={contactPhone} onChange={setContactPhone} placeholder="+33 6 12 34 56 78" />
            <Field label="Votre site web" value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://agence.com" />
            <Field label="Portfolio en ligne" value={portfolioUrl} onChange={setPortfolioUrl} placeholder="https://agence.com/portfolio" />
            <Field label="Couleur de marque" value={brandColor} onChange={setBrandColor} placeholder="#2563eb" />
            <Field label="📱 Numéro WhatsApp (pour les envois)" value={whatsappNumber} onChange={setWhatsappNumber} placeholder="33612345678 (sans le +)" required />
          </div>
        </div>
      )}

      {activeTab === "whatsapp" && (
        <WhatsAppTab
          whatsappSessionId={initialSettings.whatsappSessionId}
          whatsappSessionPhone={initialSettings.whatsappSessionPhone}
          whatsappSessionName={initialSettings.whatsappSessionName}
          whatsappConnectedAt={initialSettings.whatsappConnectedAt}
          onSave={async (data) => {
            const res = await fetch("/api/settings", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            if (res.ok) {
              setSaved(true);
              setTimeout(() => setSaved(false), 3000);
            }
            return res.ok;
          }}
        />
      )}

      {activeTab === "pricing" && (
        <div className="rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[#e8efe8]">💰 Prix par marché — 2 paiements</h2>
            <p className="text-xs text-[#67766a]">
              Définissez le <strong>deposit</strong> (acompte) + <strong>final</strong> (solde) par marché. Le total est calculé automatiquement. Les montants et liens seront injectés selon la langue du prospect (fr→EUR, en→USD, ar→MAD).
            </p>
          </div>

          <div className="space-y-6">
            {/* EUR */}
            <div className="rounded-xl border border-[rgba(74,222,128,.2)] bg-[rgba(74,222,128,.05)] p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#4ade80]">
                <span className="rounded-md bg-[rgba(74,222,128,.1)] px-2 py-0.5 text-xs font-bold text-[#4ade80]">EUR</span>
                Marché francophone — Total {depositPriceEUR + finalPriceEUR}€
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9fb3a4]">Deposit (€)</label>
                  <input
                    type="number"
                    value={depositPriceEUR}
                    onChange={(e) => setDepositPriceEUR(parseFloat(e.target.value) || 0)}
                    step="1"
                    className="w-full rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
                  />
                  <p className="mt-1 text-[10px] text-[#67766a]">{Math.round(depositPriceEUR * 100)} centimes</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9fb3a4]">Lien deposit EUR</label>
                  <input
                    value={depositPaymentLinkEUR}
                    onChange={(e) => setDepositPaymentLinkEUR(e.target.value)}
                    placeholder="https://buy.stripe.com/... (acompte)"
                    className="w-full rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 mt-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9fb3a4]">Final (€)</label>
                  <input
                    type="number"
                    value={finalPriceEUR}
                    onChange={(e) => setFinalPriceEUR(parseFloat(e.target.value) || 0)}
                    step="1"
                    className="w-full rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
                  />
                  <p className="mt-1 text-[10px] text-[#67766a]">{Math.round(finalPriceEUR * 100)} centimes</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9fb3a4]">Lien final EUR</label>
                  <input
                    value={finalPaymentLinkEUR}
                    onChange={(e) => setFinalPaymentLinkEUR(e.target.value)}
                    placeholder="https://buy.stripe.com/... (solde)"
                    className="w-full rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
                  />
                </div>
              </div>
            </div>

            {/* USD */}
            <div className="rounded-xl border border-[rgba(74,222,128,.2)] bg-[rgba(74,222,128,.05)] p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#4ade80]">
                <span className="rounded-md bg-[rgba(74,222,128,.1)] px-2 py-0.5 text-xs font-bold text-[#4ade80]">USD</span>
                Marché anglophone — Total ${depositPriceUSD + finalPriceUSD}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9fb3a4]">Deposit ($)</label>
                  <input
                    type="number"
                    value={depositPriceUSD}
                    onChange={(e) => setDepositPriceUSD(parseFloat(e.target.value) || 0)}
                    step="1"
                    className="w-full rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
                  />
                  <p className="mt-1 text-[10px] text-[#67766a]">{Math.round(depositPriceUSD * 100)} centimes</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9fb3a4]">Lien deposit USD</label>
                  <input
                    value={depositPaymentLinkUSD}
                    onChange={(e) => setDepositPaymentLinkUSD(e.target.value)}
                    placeholder="https://buy.stripe.com/... (deposit)"
                    className="w-full rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 mt-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9fb3a4]">Final ($)</label>
                  <input
                    type="number"
                    value={finalPriceUSD}
                    onChange={(e) => setFinalPriceUSD(parseFloat(e.target.value) || 0)}
                    step="1"
                    className="w-full rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
                  />
                  <p className="mt-1 text-[10px] text-[#67766a]">{Math.round(finalPriceUSD * 100)} centimes</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9fb3a4]">Lien final USD</label>
                  <input
                    value={finalPaymentLinkUSD}
                    onChange={(e) => setFinalPaymentLinkUSD(e.target.value)}
                    placeholder="https://buy.stripe.com/... (final)"
                    className="w-full rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
                  />
                </div>
              </div>
            </div>

            {/* MAD */}
            <div className="rounded-xl border border-[rgba(251,191,36,.2)] bg-[rgba(251,191,36,.05)] p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#fbbf24]">
                <span className="rounded-md bg-[rgba(251,191,36,.1)] px-2 py-0.5 text-xs font-bold text-[#fbbf24]">MAD</span>
                Marché arabophone — Total {depositPriceMAD + finalPriceMAD} DH
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9fb3a4]">Deposit (DH)</label>
                  <input
                    type="number"
                    value={depositPriceMAD}
                    onChange={(e) => setDepositPriceMAD(parseFloat(e.target.value) || 0)}
                    step="1"
                    className="w-full rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
                  />
                  <p className="mt-1 text-[10px] text-[#67766a]">{Math.round(depositPriceMAD * 100)} centimes</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9fb3a4]">Lien deposit MAD</label>
                  <input
                    value={depositPaymentLinkMAD}
                    onChange={(e) => setDepositPaymentLinkMAD(e.target.value)}
                    placeholder="https://buy.stripe.com/... (عربون)"
                    className="w-full rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 mt-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9fb3a4]">Final (DH)</label>
                  <input
                    type="number"
                    value={finalPriceMAD}
                    onChange={(e) => setFinalPriceMAD(parseFloat(e.target.value) || 0)}
                    step="1"
                    className="w-full rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
                  />
                  <p className="mt-1 text-[10px] text-[#67766a]">{Math.round(finalPriceMAD * 100)} centimes</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9fb3a4]">Lien final MAD</label>
                  <input
                    value={finalPaymentLinkMAD}
                    onChange={(e) => setFinalPaymentLinkMAD(e.target.value)}
                    placeholder="https://buy.stripe.com/... (نهائي)"
                    className="w-full rounded-lg border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "messages" && (
        <div className="rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#e8efe8]">💬 Templates de messages WhatsApp</h2>
              <p className="text-xs text-[#67766a]">
                Variables : <code className="rounded bg-[#0a0d0b] px-1">{"{{firstName}}"}</code> <code className="rounded bg-[#0a0d0b] px-1">{"{{name}}"}</code> <code className="rounded bg-[#0a0d0b] px-1">{"{{sector}}"}</code> <code className="rounded bg-[#0a0d0b] px-1">{"{{city}}"}</code> <code className="rounded bg-[#0a0d0b] px-1">{"{{phone}}"}</code> <code className="rounded bg-[#0a0d0b] px-1">{"{{rating}}"}</code> <code className="rounded bg-[#0a0d0b] px-1">{"{{demo_url}}"}</code> <code className="rounded bg-[#0a0d0b] px-1">{"{{payment_url}}"}</code> <code className="rounded bg-[#0a0d0b] px-1">{"{{final_site_url}}"}</code> <code className="rounded bg-[#0a0d0b] px-1">{"{{price}}"}</code> <code className="rounded bg-[#0a0d0b] px-1">{"{{total_price}}"}</code> <code className="rounded bg-[#0a0d0b] px-1">{"{{deposit_price}}"}</code> <code className="rounded bg-[#0a0d0b] px-1">{"{{final_price}}"}</code> <code className="rounded bg-[#0a0d0b] px-1">{"{{deposit_payment_url}}"}</code> <code className="rounded bg-[#0a0d0b] px-1">{"{{final_payment_url}}"}</code>
              </p>
              <p className="mt-1 text-xs text-[#67766a]">
                Conditionnels : <code className="rounded bg-[#0a0d0b] px-1">{"{{#if rating}}"}...{"{{/if}}"}</code>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#67766a]">Langue :</span>
              {(["fr", "en", "ar"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setEditLang(lang)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    editLang === lang
                      ? "bg-[#d9ff4d] text-[#0a0d0b]"
                      : "border border-[rgba(236,255,220,0.09)] bg-[#0e120f] text-[#9fb3a4] hover:bg-[#151b13]"
                  }`}
                >
                  {lang === "fr" ? "🇫🇷 FR" : lang === "en" ? "🇬🇧 EN" : "🇸🇦 AR"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {(["intro", "demo", "quote", "deposit_received", "final_payment_request", "final_payment_received", "delivery", "thanks"] as const).map((stage) => (
              <div key={stage}>
                <label className="block text-xs font-medium text-[#9fb3a4] mb-1">
                  {stage === "intro" ? "Message 1 — Premier contact" :
                   stage === "demo" ? "Message 2 — Envoi de la démo" :
                   stage === "quote" ? "Message 3 — Devis et lien de paiement (Total + Deposit)" :
                   stage === "deposit_received" ? "Message 4 — Deposit reçu (99)" :
                   stage === "final_payment_request" ? "Message 5 — Demande solde final (150)" :
                   stage === "final_payment_received" ? "Message 6 — Solde reçu" :
                   stage === "delivery" ? "Message 7 — Livraison du site" :
                   "Message 8 — Remerciement & fidélisation"}
                  <span className="ml-2 text-[10px] text-[#67766a] font-normal">
                    ({editLang === "fr" ? "🇫🇷 Français" : editLang === "en" ? "🇬🇧 English" : "🇸🇦 العربية"})
                  </span>
                </label>
                <textarea
                  value={templates[stage]?.[editLang] || ""}
                  onChange={(e) => {
                    setTemplates({
                      ...templates,
                      [stage]: { ...templates[stage], [editLang]: e.target.value },
                    });
                  }}
                  rows={8}
                  className="w-full rounded-xl border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 font-mono text-xs text-[#e8efe8] outline-none focus:border-[rgba(217,255,77,0.6)]"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f]/95 p-4 shadow-lg backdrop-blur">
        <div>
          {error ? <p className="text-sm text-[#ef4444]">{error}</p> :
           saved ? <p className="text-sm text-[#4ade80]">✓ Paramètres enregistrés</p> :
           <p className="text-xs text-[#67766a]">Les modifications sont sauvegardées en base</p>}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#d9ff4d] px-5 py-2.5 text-sm font-semibold text-[#0a0d0b] shadow hover:bg-[#4ade80] disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "💾 Sauvegarder"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[#9fb3a4]">
        {label} {required ? <span className="text-[#ef4444]">*</span> : null}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[rgba(236,255,220,0.09)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8] outline-none focus:border-[rgba(217,255,77,0.6)] focus:bg-[#151b13]"
      />
    </div>
  );
}



/**
 * WhatsAppTab — real Baileys-based WhatsApp Web session manager.
 *
 * Flow:
 *  1. On mount: POST /api/whatsapp/session to initiate the session.
 *     Server runs `makeWASocket()` with `useMultiFileAuthState`.
 *  2. Server returns QR code (data URL) when status = "qr_ready".
 *  3. The client displays the QR and polls GET /api/whatsapp/session
 *     every 2s for status changes.
 *  4. When the user scans the QR with their phone, the status becomes
 *     "connected" and the poll stops.
 *  5. The phone number and profile name are then available.
 *  6. "Déconnecter" calls DELETE /api/whatsapp/session.
 */
function WhatsAppTab({
  whatsappSessionId, whatsappSessionPhone, whatsappSessionName, whatsappConnectedAt,
  onSave,
}: {
  whatsappSessionId: string | null;
  whatsappSessionPhone: string | null;
  whatsappSessionName: string | null;
  whatsappConnectedAt: Date | string | null;
  onSave: (data: Record<string, unknown>) => Promise<boolean>;
}) {
  // Local state for the Baileys session
  const [status, setStatus] = useState<"disconnected" | "connecting" | "qr_ready" | "connected" | "failed">("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null); // data URL
  const [phoneNumber, setPhoneNumber] = useState<string | null>(whatsappSessionPhone);
  const [profileName, setProfileName] = useState<string | null>(whatsappSessionName);
  const [log, setLog] = useState<string[]>([]);

  const refreshLog = useCallback(async () => {
    try {
      const r = await fetch("/api/whatsapp/debug");
      const d = await r.json();
      setLog(d.eventLog || []);
    } catch { /* debug log fetch failed */ }
  }, []);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const router = useRouter();
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const statusRef = useRef(status);

  // Start polling when status is "qr_ready" or "connecting"
  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    // Poll every second for faster detection of the connection
    pollRef.current = setInterval(async () => {
      // Refresh the debug log
      refreshLog();
      try {
        const res = await fetch("/api/whatsapp/session?_t=" + Date.now());
        const data = await res.json();
        if (data.status === "connected") {
          setStatus("connected");
          setPhoneNumber(data.phoneNumber || null);
          setProfileName(data.profileName || null);
          setQrCode(null);
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          router.refresh(); // Reload server data
        } else if (data.status === "failed" || data.status === "disconnected") {
          if (statusRef.current === "qr_ready" || statusRef.current === "connecting") {
            setStatus(data.status);
            setSessionError(data.error || null);
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } else if (data.qrCode) {
          setQrCode(data.qrCode);
          // If QR changed, update; status is "qr_ready" or "connecting"
          setStatus("qr_ready");
        }
      } catch {
        // Silent
      }
    }, 1000);
  };

  // Initiate a new session (calls Baileys on the server side)
  const connect = async () => {
    setLoading(true);
    setSessionError(null);
    setQrCode(null);
    try {
      const res = await fetch("/api/whatsapp/session", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setStatus(data.status);
      if (data.qrCode) {
        setQrCode(data.qrCode);
      }
      if (data.status === "qr_ready" || data.status === "connecting") {
        startPolling();
      }
    } catch (e) {
      setStatus("failed");
      setSessionError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  // Disconnect
  const disconnect = async () => {
    if (!confirm("Êtes-vous sûr de vouloir déconnecter WhatsApp ? Vous devrez rescanner le QR code pour vous reconnecter.")) return;
    setLoading(true);
    try {
      await fetch("/api/whatsapp/session", { method: "DELETE" });
      setStatus("disconnected");
      setQrCode(null);
      setPhoneNumber(null);
      setProfileName(null);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      router.refresh();
    } catch { console.warn("Failed to disconnect WhatsApp"); }
    setLoading(false);
  };

  // Copy raw QR payload
  const copyPayload = async () => {
    try {
      const res = await fetch("/api/whatsapp/session");
      const data = await res.json();
      if (data.qrCode) {
        // Extract the raw content of the data URL
        // qrCode is "data:image/png;base64,..."
        const actual = data.rawQrPayload || data.qrCode;
        await navigator.clipboard.writeText(actual);
        setCopiedPayload(true);
        setTimeout(() => setCopiedPayload(false), 2000);
      }
    } catch {}
  };

  // Sync statusRef with status
  useEffect(() => { statusRef.current = status; }, [status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // On mount, check current status and start polling if needed
  useEffect(() => {
    if (whatsappConnectedAt) {
      setStatus("connected");
      setPhoneNumber(whatsappSessionPhone);
      setProfileName(whatsappSessionName);
    } else if (whatsappSessionId) {
      // There's a session ID, check status
      (async () => {
        const res = await fetch("/api/whatsapp/session");
        const data = await res.json();
        setStatus(data.status);
        if (data.qrCode) setQrCode(data.qrCode);
        if (data.status === "qr_ready" || data.status === "connecting") {
          startPolling();
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusBadge = {
    disconnected: { label: "Non connecté", tone: "bg-[rgba(236,255,220,0.05)] text-[#67766a] border-[rgba(236,255,220,0.09)]" },
    connecting: { label: "Connexion…", tone: "bg-[rgba(251,191,36,.08)] text-[#fbbf24] border-[rgba(251,191,36,.3)]" },
    qr_ready: { label: "Scannez le QR", tone: "bg-[rgba(167,139,250,.08)] text-[#a78bfa] border-[rgba(167,139,250,.3)]" },
    connected: { label: "Connecté", tone: "bg-[rgba(74,222,128,.08)] text-[#4ade80] border-[rgba(74,222,128,.3)]" },
    failed: { label: "Échec", tone: "bg-[rgba(239,68,68,.08)] text-[#ef4444] border-[rgba(239,68,68,.3)]" },
  }[status];

  return (
    <div className="space-y-4">
      {/* Real Baileys session */}
      <div className="rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#e8efe8]">📱 Liaison WhatsApp (Baileys)</h2>
            <p className="text-xs text-[#67766a]">
              Connexion directe via le WebSocket WhatsApp — comme web.whatsapp.com.
            </p>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusBadge.tone}`}>
            {statusBadge.label}
          </span>
        </div>

        {sessionError && (
          <div className="mb-3 rounded-lg border border-[rgba(239,68,68,.3)] bg-[rgba(239,68,68,.08)] p-3 text-sm text-[#ef4444]">
            {sessionError}
          </div>
        )}

        {status === "disconnected" && (
          <div className="rounded-xl border border-[rgba(236,255,220,0.09)] bg-[#151b13] p-5 text-center">
            <p className="text-3xl">📲</p>
            <p className="mt-2 text-sm font-medium text-[#e8efe8]">Aucune session WhatsApp active</p>
            <p className="mt-1 text-xs text-[#67766a]">
              Lancez une nouvelle connexion pour obtenir un QR code à scanner depuis votre téléphone.
            </p>
            <button
              onClick={connect}
              disabled={loading}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#d9ff4d] px-5 py-2.5 text-sm font-bold text-[#0a0d0b] shadow hover:bg-[#4ade80] disabled:opacity-50"
            >
              {loading ? "Connexion…" : "📱 Connecter WhatsApp"}
            </button>
          </div>
        )}

        {(status === "connecting" || status === "qr_ready") && (
          <div className="rounded-xl border-2 border-[rgba(167,139,250,.3)] bg-[rgba(167,139,250,.08)] p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-bold text-[#a78bfa]">📷 Scannez ce QR code</h3>
                <p className="text-xs text-[#a78bfa] mb-2">
                  Ouvrez WhatsApp sur votre téléphone → Menu déroulant → <strong>Appareils liés</strong> → <strong>Lier un appareil</strong>, puis pointez la caméra vers ce code.
                </p>
                {qrCode ? (
                  <div className="flex justify-center rounded-xl border-4 border-[rgba(236,255,220,0.09)] bg-[#151b13] p-3 shadow-md">
                    <img
                      src={qrCode}
                      alt="QR Code de liaison WhatsApp"
                      className="h-64 w-64"
                      width={256}
                      height={256}
                    />
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-xl border-4 border-dashed border-[rgba(167,139,250,.3)] bg-[rgba(167,139,250,.05)]">
                    <div className="text-center">
                      <svg className="mx-auto h-8 w-8 animate-spin text-[#a78bfa]" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
                        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                      <p className="mt-2 text-xs text-[#a78bfa]">Génération du QR code…</p>
                    </div>
                  </div>
                )}
                <p className="mt-2 text-center text-[10px] text-[#a78bfa]">
                  ⏳ Le code expire dans ~30 secondes. Actualisez si besoin.
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <button
                    onClick={connect}
                    disabled={loading}
                    className="rounded-md border border-[rgba(167,139,250,.3)] bg-[#151b13] px-3 py-1.5 text-[11px] font-medium text-[#a78bfa] hover:bg-[rgba(167,139,250,.1)] disabled:opacity-50"
                  >
                    🔄 Régénérer
                  </button>
                  <button
                    onClick={copyPayload}
                    className="rounded-md border border-[rgba(167,139,250,.3)] bg-[#151b13] px-3 py-1.5 text-[11px] font-medium text-[#a78bfa] hover:bg-[rgba(167,139,250,.1)]"
                  >
                    {copiedPayload ? "✓ Copié" : "📋 Copier le code"}
                  </button>
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-bold text-[#a78bfa]">🎯 Instructions détaillées</h3>
                <ol className="space-y-2 text-sm text-[#a78bfa]">
                  <li className="flex gap-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#a78bfa] text-[10px] font-bold text-white">1</span>
                    <span>Sur votre téléphone, ouvrez <strong>WhatsApp</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#a78bfa] text-[10px] font-bold text-white">2</span>
                    <span>
                      Android : <strong>⋮ Menu → Appareils liés</strong>
                      <br />
                      iPhone : <strong>Réglages → Appareils liés</strong>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#a78bfa] text-[10px] font-bold text-white">3</span>
                    <span>Appuyez sur <strong>"Lier un appareil"</strong> (bouton vert)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#a78bfa] text-[10px] font-bold text-white">4</span>
                    <span>Pointez la caméra vers le <strong>QR code</strong> à gauche</span>
                  </li>
                </ol>
                <div className="mt-3 rounded-lg border border-[rgba(167,139,250,.3)] bg-[#151b13] p-3 text-xs text-[#a78bfa]">
                  <p className="font-bold">⏰ Astuce</p>
                  <p className="mt-1">
                    Si le code expire avant le scan, cliquez sur <strong>🔄 Régénérer</strong>.
                    Le statut passe automatiquement à "Connecté" dès que la liaison est faite.
                  </p>
                </div>
                <div className="mt-2 rounded-lg border-2 border-[rgba(251,191,36,.3)] bg-[rgba(251,191,36,.08)] p-3 text-xs text-[#fbbf24]">
                  <p>💡 <strong>Important :</strong> Le QR code est généré en temps réel par notre serveur via Baileys — c'est le même protocole que celui qu'utilise WhatsApp Web officiellement. Vous restez le seul propriétaire de votre compte.</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-col items-center gap-2 border-t border-[rgba(167,139,250,.2)] pt-3 text-xs">
              <button
                onClick={disconnect}
                disabled={loading}
                className="text-[#ef4444] hover:underline disabled:opacity-50"
              >
                Annuler la connexion
              </button>
              <div className="rounded-lg border border-[rgba(251,191,36,.3)] bg-[rgba(251,191,36,.08)] p-2 text-[10px] text-[#fbbf24]">
                <p className="font-bold">⚠️ Ça reste bloqué sur "Logging in…" ?</p>
                <p className="mt-1 text-[#fbbf24]">
                  Vérifiez le <strong>log de debug</strong> ci-dessous. Si vous voyez
                  <code className="mx-1 rounded bg-[rgba(251,191,36,.1)] px-1">connection.update: connection=open</code>
                  c'est connecté. Sinon, le WebSocket Baileys est probablement bloqué par votre
                  environnement réseau (sandbox, firewall, etc.). Dans ce cas, utilisez le
                  mode manuel (onglet "📱 Mode manuel") pour envoyer via wa.me.
                </p>
              </div>
            </div>
            {/* Debug log — visible to help debug "logging in..." issues */}
            <details className="mt-2 text-[10px] text-[#a78bfa]">
              <summary className="cursor-pointer text-[#a78bfa] hover:underline">
                🔧 Voir le log de connexion (debug)
              </summary>
              <div className="mt-1 max-h-32 overflow-y-auto rounded border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-2 font-mono text-[9px] text-[#9fb3a4]">
                {log.length === 0 ? (
                  <span className="text-[#67766a]">Aucun log pour l'instant…</span>
                ) : (
                  log.map((line, i) => (
                    <div key={i} className="text-[#9fb3a4]">{line}</div>
                  ))
                )}
              </div>
            </details>
          </div>
        )}

        {status === "connected" && (
          <div className="rounded-xl border-2 border-[rgba(74,222,128,.3)] bg-[rgba(74,222,128,.08)] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#4ade80]">✅ WhatsApp connecté</h3>
                <p className="mt-1 text-sm text-[#4ade80]">
                  <strong>{profileName || "Votre compte"}</strong>
                  {phoneNumber && <> · <span className="font-mono">+{phoneNumber}</span></>}
                </p>
                <p className="mt-1 text-xs text-[#4ade80]">
                  Connecté via Baileys (protocole WebSocket WhatsApp officiel).
                </p>
                <p className="mt-2 text-xs text-[#4ade80]">
                  💡 Vous pouvez maintenant envoyer des messages depuis la page prospect avec le bouton "🚀 Envoyer (auto)".
                </p>
              </div>
              <button
                onClick={disconnect}
                disabled={loading}
                className="rounded-md border border-[rgba(239,68,68,.3)] bg-[#0e120f] px-3 py-1.5 text-xs font-medium text-[#ef4444] hover:bg-[rgba(239,68,68,.08)] disabled:opacity-50"
              >
                Déconnecter
              </button>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="rounded-xl border-2 border-[rgba(239,68,68,.3)] bg-[rgba(239,68,68,.08)] p-5">
            <h3 className="text-sm font-bold text-[#ef4444]">❌ Connexion échouée</h3>
            <p className="mt-1 text-sm text-[#ef4444]">
              {sessionError || "Le serveur WhatsApp n'a pas répondu. Réessayez."}
            </p>
            <button
              onClick={connect}
              disabled={loading}
              className="mt-3 rounded-md bg-[#ef4444] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#dc2626] disabled:opacity-50"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>

      {/* Test panel: send a test message to verify the connection */}
      <TestPanel status={status} phoneNumber={phoneNumber} profileName={profileName} />
    </div>
  );
}

/**
 * TestPanel — lets the user send a test message to any phone number
 * to verify the WhatsApp connection works end-to-end.
 */
function TestPanel({
  status, phoneNumber, profileName,
}: {
  status: string;
  phoneNumber: string | null;
  profileName: string | null;
}) {
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message?: string;
    sentTo?: string;
    sentFrom?: string;
    messageId?: string;
    sentAt?: string;
    error?: string;
  } | null>(null);

  const sendTest = async () => {
    if (!testPhone.trim()) {
      setResult({ ok: false, error: "Veuillez entrer un numéro de téléphone" });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({
          ok: true,
          message: "Message envoyé avec succès ! Vérifiez sur le téléphone destinataire.",
          sentTo: data.sentToFormatted,
          sentFrom: data.sentFromName || data.sentFrom,
          messageId: data.messageId,
          sentAt: data.sentAt,
        });
      } else {
        setResult({
          ok: false,
          error: data.error || "Erreur inconnue",
        });
      }
    } catch (e) {
      setResult({
        ok: false,
        error: e instanceof Error ? e.message : "Erreur réseau",
      });
    } finally {
      setSending(false);
    }
  };

  if (status !== "connected") {
    return (
      <div className="rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#151b13] p-5">
        <h3 className="text-sm font-semibold text-[#9fb3a4]">🧪 Test d'envoi WhatsApp</h3>
        <p className="mt-1 text-xs text-[#67766a]">
          Connectez d'abord WhatsApp pour pouvoir tester l'envoi.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[rgba(74,222,128,.2)] bg-[rgba(74,222,128,.05)] p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#4ade80]">🧪 Test d'envoi WhatsApp</h3>
          <p className="mt-1 text-xs text-[#4ade80]">
            Envoyez un message de test à n'importe quel numéro pour vérifier que la connexion fonctionne.
          </p>
          {phoneNumber && (
            <p className="mt-1 text-[10px] text-[#4ade80]">
              Connecté en tant que <span className="font-mono font-bold">{phoneNumber}</span>
              {profileName && <> · {profileName}</>}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#4ade80]">
            Numéro du destinataire (format international, ex: +33 6 12 34 56 78)
          </label>
          <input
            type="tel"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            className="w-full rounded-lg border border-[rgba(74,222,128,.2)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8] focus:border-[rgba(217,255,77,0.6)] focus:ring-2 focus:ring-[rgba(217,255,77,0.2)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#4ade80]">
            Message personnalisé (optionnel)
          </label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Laissez vide pour un message par défaut"
            rows={3}
            className="w-full rounded-lg border border-[rgba(74,222,128,.2)] bg-[#151b13] px-3 py-2 text-sm text-[#e8efe8] focus:border-[rgba(217,255,77,0.6)] focus:ring-2 focus:ring-[rgba(217,255,77,0.2)]"
          />
        </div>
        <button
          onClick={sendTest}
          disabled={sending || !testPhone.trim()}
          className="w-full rounded-lg bg-[#d9ff4d] px-4 py-2.5 text-sm font-bold text-[#0a0d0b] shadow hover:bg-[#4ade80] disabled:opacity-50"
        >
          {sending ? "Envoi en cours..." : "📤 Envoyer le message de test"}
        </button>
      </div>

      {result && (
        <div
          className={`mt-3 rounded-lg border-2 p-3 text-sm ${
            result.ok
              ? "border-[rgba(74,222,128,.3)] bg-[rgba(74,222,128,.08)] text-[#4ade80]"
              : "border-[rgba(239,68,68,.3)] bg-[rgba(239,68,68,.08)] text-[#ef4444]"}
          }`}
        >
          {result.ok ? (
            <div>
              <p className="font-bold">✅ Message envoyé avec succès !</p>
              <div className="mt-2 space-y-1 text-xs">
                <p>
                  <span className="font-semibold">De :</span> {result.sentFrom || "—"}
                </p>
                <p>
                  <span className="font-semibold">À :</span> {result.sentTo || "—"}
                </p>
                <p>
                  <span className="font-semibold">Date :</span>{" "}
                  {result.sentAt
                    ? new Date(result.sentAt).toLocaleString("fr-FR")
                    : "—"}
                </p>
                {result.messageId && (
                  <p>
                    <span className="font-semibold">ID :</span>{" "}
                    <code className="rounded bg-[rgba(74,222,128,.1)] px-1 text-[10px]">
                      {result.messageId}
                    </code>
                  </p>
                )}
                <p className="mt-2 rounded bg-[rgba(74,222,128,.1)] p-2 text-[11px]">
                  💡 Vérifiez le téléphone destinataire pour confirmer la réception.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-bold">❌ Échec de l'envoi</p>
              <p className="mt-1 text-xs">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
