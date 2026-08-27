"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { detectProspectLanguage, detectProspectCurrency, formatPrice } from "@/lib/prompt-generator";

type Business = {
  id: number;
  name: string;
  category: string | null;
  subcategory: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  country: string | null;
  cuisine: string | null;
  rating: string | null;
  reviewsCount: number | null;
  description: string | null;
  openingHours: string | null;
  facebook: string | null;
  instagram: string | null;
};

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
  whatsappConnectedAt: string | Date | null;
  paymentLink: string | null;
  priceEUR: number | null;
  priceUSD: number | null;
  priceMAD: number | null;
  paymentLinkEUR: string | null;
  paymentLinkUSD: string | null;
  paymentLinkMAD: string | null;
  brandColor: string;
  logoUrl: string | null;
  messageTemplates: {
    intro: string | { fr: string; en: string; ar: string };
    demo: string | { fr: string; en: string; ar: string };
    quote: string | { fr: string; en: string; ar: string };
    payment_received: string | { fr: string; en: string; ar: string };
    delivery: string | { fr: string; en: string; ar: string };
    thanks: string | { fr: string; en: string; ar: string };
    followup: string | { fr: string; en: string; ar: string };
  } | null;
};

type Prospect = {
  id: number;
  businessId: number;
  campaignId: number | null;
  workflowStage: string;
  notes: string | null;
  vibecoderPrompt: string | null;
  externalDemoUrl: string | null;
  externalSiteUrl: string | null;
  quoteAmount: number | null;
  quoteCurrency: string | null;
  paymentAmount: number | null;
  whatsappMessages: {
    intro: string | { fr: string; en: string; ar: string };
    demo: string | { fr: string; en: string; ar: string };
    quote: string | { fr: string; en: string; ar: string };
    payment_received: string | { fr: string; en: string; ar: string };
    delivery: string | { fr: string; en: string; ar: string };
    thanks: string | { fr: string; en: string; ar: string };
    followup: string | { fr: string; en: string; ar: string };
  } | null;
  paymentStatus: string | null;
  paymentDate: Date | string | null;
  deliveryDate: Date | string | null;
  demoHtml: string | null;
  demoToken: string | null;
};

type Props = {
  prospect: Prospect;
  business: Business;
  settings: Settings;
  campaignLanguage?: string;
  campaignCurrency?: string;
};

const STAGES = [
  { id: "discovered", label: "Découvert", icon: "🔍" },
  { id: "contacted", label: "Contacté", icon: "💬" },
  { id: "demo_sent", label: "Démo envoyée", icon: "🎨" },
  { id: "quoted", label: "Devis envoyé", icon: "💰" },
  { id: "paid", label: "Payé", icon: "✅" },
  { id: "delivered", label: "Livré", icon: "🚀" },
  { id: "completed", label: "Terminé", icon: "🎉" },
];

export default function ProspectClient({ prospect: initialProspect, business: initialBusiness, settings, campaignLanguage, campaignCurrency }: Props) {
  const router = useRouter();
  const [prospect, setProspect] = useState(initialProspect);
  const [business, setBusiness] = useState(initialBusiness);
  const [activeTab, setActiveTab] = useState<"overview" | "prompt" | "whatsapp" | "links">("overview");
  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [sendModal, setSendModal] = useState<{ url: string; text: string; stage: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };



  const updateProspect = useCallback(async (updates: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.prospect) {
        setProspect(data.prospect);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [prospect.id]);

  const logMessage = async (messageStage: string) => {
    try {
      await fetch(`/api/prospects/${prospect.id}/log-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageStage }),
      });
    } catch { console.warn("Failed to log message"); }
  };

  // Process a template: replace variables + handle {{#if}} conditionals
  const processTemplate = (template: string, vars: Record<string, any>): string => {
    let out = template;
    // Handle {{#if var}}...{{/if}}
    out = out.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
      return vars[key] ? content : "";
    });
    // Replace simple variables
    out = out.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const val = vars[key];
      return val != null ? String(val) : "";
    });
    return out;
  };

  // Compute template variables for this prospect
  const getTemplateVars = () => {
    const currency = campaignCurrency || "EUR";

    let detectedPrice = 0;
    if (currency === "EUR") detectedPrice = (settings as any).priceEUR || 89900;
    else if (currency === "USD") detectedPrice = (settings as any).priceUSD || 99900;
    else if (currency === "MAD") detectedPrice = (settings as any).priceMAD || 99900;

    let detectedPaymentLink = settings.paymentLink || "";
    if (currency === "EUR" && (settings as any).paymentLinkEUR) detectedPaymentLink = (settings as any).paymentLinkEUR;
    else if (currency === "USD" && (settings as any).paymentLinkUSD) detectedPaymentLink = (settings as any).paymentLinkUSD;
    else if (currency === "MAD" && (settings as any).paymentLinkMAD) detectedPaymentLink = (settings as any).paymentLinkMAD;

    const tierPrice = detectedPrice;

    return {
      firstName: business.name.split(" ")[0] || "Bonjour",
      name: business.name,
      businessName: business.name,
      sector: business.subcategory || business.category || "votre activité",
      city: business.city || "votre ville",
      phone: business.phone || "",
      rating: business.rating || "",
      reviewsCount: business.reviewsCount || "",
      cuisine: business.cuisine || "",
      openingHours: business.openingHours || "",
      description: business.description || "",
      website: business.website || "",
      demo_url: prospect.externalDemoUrl || "",
      payment_url: detectedPaymentLink,
      final_site_url: prospect.externalSiteUrl || "",
      price: tierPrice > 0 ? formatPrice(tierPrice, currency) : "",
      features: "",
      tiers_block: "",
      agency_name: settings.agencyName || "Mon Agence",
      contact_name: settings.contactName || "L'équipe",
      contact_email: settings.contactEmail || "",
      contact_phone: settings.contactPhone || "",
      agency_website: settings.websiteUrl || "",
      portfolio: settings.portfolioUrl || "",
      portfolio_url: settings.portfolioUrl || "",
    };
  };

  const advanceStage = async (stage: string) => {
    await updateProspect({ workflowStage: stage });
  };

  const copy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  // Build the WhatsApp URLs/text once for use by all the send buttons.
  // We log the message to analytics and advance the workflow stage here,
  // so any of the "send" methods (open, copy-link, copy-text) work.
  // `template` can be either a string (legacy) or a {fr, en} object
  // (bilingual). The `language` setting determines which one is used.
  const prepareMessage = (template: string | { fr: string; en: string; ar?: string } | null | undefined) => {
    const phone = business.phone?.replace(/[^0-9]/g, "");
    if (!template) {
      return { phone, text: "" };
    }
    // Determine the active language:
    // 1. Campaign language (highest priority — set by user at campaign creation)
    // 2. Auto-detect from the prospect's country/city
    // 3. Default to "fr"
    const lang = campaignLanguage || detectProspectLanguage(business.country, business.city) || "fr";
    let rawText: string;
    if (typeof template === "string") {
      rawText = template;
    } else if (typeof template === "object" && template !== null) {
      rawText = (template as any)[lang] || template.fr || "";
    } else {
      rawText = String(template);
    }
    const vars = getTemplateVars();
    const text = processTemplate(rawText, vars);
    return { phone, text };
  };

  // Send via the linked WhatsApp session (if connected) or via wa.me
  const openWhatsApp = async (messageStage: string, template: string | { fr: string; en: string; ar?: string } | null | undefined) => {
    const { phone, text } = prepareMessage(template);
    if (!phone) {
      alert("Pas de numéro de téléphone pour ce business");
      return;
    }
    advanceWorkflow(messageStage);

    // Always try sending via the API first (uses Baileys session if connected)
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: prospect.id,
          messageStage,
          message: text,
          phone,
          name: business.name,
        }),
      });
      if (res.ok) {
        showToast("✅ Message envoyé avec succès", "success");
        return;
      }
      const data = await res.json();
      // Session not connected — fall through to WhatsApp Web
      if (data.status && data.status !== "connected") {
        // Fall through to wa.me/WhatsApp Web
      } else {
        showToast("❌ Échec de l'envoi: " + (data.error || "inconnue"), "error");
        return;
      }
    } catch (e) {
      // Network error — fall through to WhatsApp Web
    }

    // Fallback: open WhatsApp Web in a new tab with the conversation ready.
    const waWebUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
    const newWindow = window.open(waWebUrl, "_blank", "noopener,noreferrer");
    const blocked = !newWindow || newWindow.closed || typeof newWindow.closed === "undefined";
    if (blocked) {
      setSendModal({ url: waWebUrl, text, stage: messageStage });
    } else {
      logMessage(messageStage);
    }
  };

  // Copy a clickable wa.me link to the clipboard. Useful when
  // api.whatsapp.com / wa.me redirects are blocked in the browser.
  const copyMessageWithLink = async (messageStage: string, template: string | { fr: string; en: string; ar?: string } | null | undefined) => {
    const { phone, text } = prepareMessage(template);
    if (!phone) return;
    logMessage(messageStage);
    advanceWorkflow(messageStage);
    const waMeUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
    try {
      await navigator.clipboard.writeText(waMeUrl);
      setCopiedField(`${messageStage}_link`);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = waMeUrl;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
      setCopiedField(`${messageStage}_link`);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // Copy just the phone number (international format with +)
  const copyPhone = async () => {
    const phone = business.phone?.replace(/[^0-9]/g, "");
    if (!phone) return;
    const intl = phone.startsWith("+") ? phone : phone.startsWith("00") ? `+${phone.slice(2)}` : `+${phone}`;
    try {
      await navigator.clipboard.writeText(intl);
      setCopiedField("phone");
      setTimeout(() => setCopiedField(null), 2500);
    } catch {}
  };

  // Copy the message body text (no URL, no phone) — for cases where
  // the user wants to paste the text into a different messenger.
  const copyMessageOnly = async (messageStage: string, template: string | { fr: string; en: string; ar?: string } | null | undefined) => {
    const { text } = prepareMessage(template);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(`${messageStage}_text`);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {}
  };

  // Open WhatsApp on the user's phone via the whatsapp:// scheme.
  // Works on mobile when wa.me is blocked.
  const openOnMobile = (messageStage: string, template: string | { fr: string; en: string; ar?: string } | null | undefined) => {
    const { phone, text } = prepareMessage(template);
    if (!phone) return;
    logMessage(messageStage);
    advanceWorkflow(messageStage);
    // The whatsapp:// URI scheme is the native app URL — works on mobile
    const mobileUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;
    window.location.href = mobileUrl;
  };

  // Advance the workflow stage based on the message being sent
  const advanceWorkflow = (messageStage: string) => {
    const stageMap: Record<string, string> = {
      intro: "contacted",
      demo: "demo_sent",
      quote: "quoted",
      payment_received: "paid",
      delivery: "delivered",
      thanks: "completed",
      followup: "contacted",
    };
    const nextStage = stageMap[messageStage];
    if (nextStage) {
      advanceStage(nextStage);
    }
  };

  // Copy a clickable wa.me link to clipboard (for cases where the
  // direct WhatsApp URL is blocked by the browser)
  const stageIndex = STAGES.findIndex((s) => s.id === prospect.workflowStage);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1380px] px-6 py-10 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          {settings.whatsappConnectedAt && (
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-medium text-emerald-700">
                WhatsApp connecté
                {settings.whatsappSessionPhone && (
                  <> · {settings.whatsappSessionPhone}</>
                )}
              </span>
            </div>
          )}
          <Link
            href="/prospects"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
            </svg>
            Prospects
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Nouvelle recherche →
            </Link>
            <DeleteProspectButton prospectId={prospect.id} prospectName={business.name} />
          </div>
        </div>

        {/* Business header */}
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
              <p className="mt-1 text-sm text-slate-600">
                {business.subcategory || business.category} {business.city && `· ${business.city}`}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {business.phone && <Badge>📞 {business.phone}</Badge>}
                {business.email && <Badge>✉️ {business.email}</Badge>}
                {business.website ? (
                  <Badge tone="emerald">🌐 A un site</Badge>
                ) : (
                  <Badge tone="amber">⚠️ Pas de site (cible prospect)</Badge>
                )}
                {business.rating && <Badge tone="amber">★ {business.rating}/5</Badge>}
                {business.cuisine && <Badge>🍽️ {business.cuisine}</Badge>}
                {prospect.externalDemoUrl && <Badge tone="violet">🎨 Démo externe</Badge>}
                {prospect.externalSiteUrl && <Badge tone="emerald">🚀 Site final externe</Badge>}
              </div>
              <div className="mt-2">
                <EditBusinessButton
                  prospectId={prospect.id}
                  business={business}
                  prospect={prospect}
                  onSaved={(updated) => {
                    if (updated.business) setBusiness((prev: any) => ({ ...prev, ...updated.business }));
                    if (updated.prospect) setProspect((prev: any) => ({ ...prev, ...updated.prospect }));
                  }}
                />
              </div>
            </div>
            <select
              value={prospect.workflowStage}
              onChange={(e) => advanceStage(e.target.value)}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Workflow progress */}
          <div className="mt-5">
            <div className="flex items-center justify-between gap-1">
              {STAGES.map((s, i) => (
                <div key={s.id} className="flex flex-1 items-center">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                      i <= stageIndex ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                    }`}
                    title={s.label}
                  >
                    {i < stageIndex ? "✓" : s.icon}
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={`h-1 flex-1 ${i < stageIndex ? "bg-blue-600" : "bg-slate-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1">
          {([
            ["overview", "📊 Vue d'ensemble"],
            ["prompt", "🤖 Prompt Vibecoder"],
            ["whatsapp", "💬 Messages WhatsApp"],
            ["links", "🔗 Liens & Paiement"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition ${
                activeTab === id ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <OverviewTab prospect={prospect} business={business} settings={settings} onUpdate={updateProspect} />
        )}
        {activeTab === "prompt" && (
          <PromptTab prospect={prospect} onUpdate={updateProspect} copy={copy} copiedField={copiedField} />
        )}
        {activeTab === "whatsapp" && (
          <WhatsAppTab
            prospect={prospect}
            business={business}
            settings={settings}
            campaignLanguage={campaignLanguage}
            onUpdate={updateProspect}
            openWhatsApp={openWhatsApp}
            openOnMobile={openOnMobile}
            copyMessageWithLink={copyMessageWithLink}
            copyMessageOnly={copyMessageOnly}
            copyPhone={copyPhone}
            copy={copy}
            copiedField={copiedField}
          />
        )}
        {activeTab === "links" && (
          <LinksTab prospect={prospect} business={business} settings={settings} campaignCurrency={campaignCurrency} onUpdate={updateProspect} />
        )}
      </div>

      {sendModal && (
        <SendWhatsAppModal
          url={sendModal.url}
          text={sendModal.text}
          stage={sendModal.stage}
          onClose={() => setSendModal(null)}
          copy={copy}
          copiedField={copiedField}
        />
      )}

      {toast && (
        <div
          className={`fixed right-4 top-4 z-[100] rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "emerald" | "amber" | "blue" | "violet" }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

function OverviewTab({
  prospect, business, settings, onUpdate,
}: {
  prospect: Prospect;
  business: Business;
  settings: Settings;
  onUpdate: (u: any) => Promise<void>;
}) {
  const [notes, setNotes] = useState(prospect.notes || "");
  useEffect(() => {
    setNotes(prospect.notes || "");
  }, [prospect.notes]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">📝 Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onUpdate({ notes })}
          placeholder="Notes de prospection..."
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white"
          rows={6}
        />
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">🏢 Agence</h3>
          <div className="mt-2 text-sm">
            <p className="font-semibold text-slate-900">{settings.agencyName}</p>
            <p className="text-slate-600">{settings.contactName}</p>
            {settings.contactPhone && <p className="text-slate-600">📞 {settings.contactPhone}</p>}
            {settings.websiteUrl && (
              <a href={settings.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                {settings.websiteUrl}
              </a>
            )}
            {settings.whatsappNumber && (
              <p className="mt-2 text-xs text-emerald-700">📱 WhatsApp business : {settings.whatsappNumber}</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">🔗 Liens du workflow</h3>
          <div className="mt-2 space-y-1.5 text-xs">
            {prospect.externalDemoUrl && (
              <div>
                <p className="text-[10px] font-semibold uppercase text-violet-600">🎨 Démo externe (vibecodée)</p>
                <a href={prospect.externalDemoUrl} target="_blank" rel="noreferrer" className="block truncate text-blue-600 hover:underline">{prospect.externalDemoUrl}</a>
              </div>
            )}
            {prospect.externalSiteUrl && (
              <div>
                <p className="text-[10px] font-semibold uppercase text-emerald-600">🚀 Site final externe</p>
                <a href={prospect.externalSiteUrl} target="_blank" rel="noreferrer" className="block truncate text-blue-600 hover:underline">{prospect.externalSiteUrl}</a>
              </div>
            )}
            {!prospect.externalDemoUrl && !prospect.externalSiteUrl && (
              <p className="text-xs text-slate-400 italic">Aucun lien externe configuré. Ajoutez-les dans l'onglet "Liens & Paiement".</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PromptTab({
  prospect, onUpdate, copy, copiedField,
}: {
  prospect: Prospect;
  onUpdate: (u: any) => Promise<void>;
  copy: (t: string, f: string) => void;
  copiedField: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(prospect.vibecoderPrompt || "");
  useEffect(() => {
    setValue(prospect.vibecoderPrompt || "");
  }, [prospect.vibecoderPrompt]);
  const save = async () => {
    await onUpdate({ vibecoderPrompt: value });
    setEditing(false);
  };
  const regenerate = async () => {
    await onUpdate({ regenerateDemo: true });
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">🤖 Prompt Vibecoder (à coller dans Claude / Cursor / v0)</h3>
        <div className="flex gap-2">
          <button onClick={() => copy(value, "prompt")} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            {copiedField === "prompt" ? "✓ Copié !" : "📋 Copier"}
          </button>
          <button onClick={regenerate} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
            🔄 Régénérer
          </button>
          {editing ? (
            <>
              <button onClick={() => { setValue(prospect.vibecoderPrompt || ""); setEditing(false); }} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs">Annuler</button>
              <button onClick={save} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">Sauvegarder</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs">✏️ Éditer</button>
          )}
        </div>
      </div>
      {editing ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs"
          rows={30}
        />
      ) : (
        <pre className="max-h-[600px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100">
{value}
        </pre>
      )}
    </div>
  );
}

function WhatsAppTab({
  prospect, business, settings, campaignLanguage, onUpdate, openWhatsApp, openOnMobile, copyMessageWithLink, copyMessageOnly, copyPhone, copy, copiedField,
}: {
  prospect: Prospect;
  business: Business;
  settings: Settings;
  campaignLanguage?: string;
  onUpdate: (u: any) => Promise<void>;
  openWhatsApp: (stage: string, tpl: string | { fr: string; en: string; ar?: string } | null | undefined) => void;
  openOnMobile: (stage: string, tpl: string | { fr: string; en: string; ar?: string } | null | undefined) => void;
  copyMessageWithLink: (stage: string, tpl: string | { fr: string; en: string; ar?: string } | null | undefined) => Promise<void>;
  copyMessageOnly: (stage: string, tpl: string | { fr: string; en: string; ar?: string } | null | undefined) => Promise<void>;
  copyPhone: () => Promise<void>;
  copy: (t: string, f: string) => void;
  copiedField: string | null;
}) {
  const settingsTemplates = (settings as any).messageTemplates || {};
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, { fr: string; en: string; ar: string }>>(() => {
    const normalized: Record<string, { fr: string; en: string; ar: string }> = {};
    const stageKeys = ["intro", "demo", "quote", "payment_received", "delivery", "thanks"];
    for (const key of stageKeys) {
      const val = settingsTemplates[key];
      if (typeof val === "string") {
        normalized[key] = { fr: val, en: val, ar: val };
      } else if (val && typeof val === "object" && "fr" in val) {
        normalized[key] = val as { fr: string; en: string; ar: string };
      } else {
        normalized[key] = { fr: "", en: "", ar: "" };
      }
    }
    return normalized;
  });

  const getStageText = (raw: any): string => {
    if (!raw) return "";
    if (typeof raw === "string") return raw;
    if (typeof raw === "object") {
      const lang = campaignLanguage || detectProspectLanguage(business.country, business.city) || "fr";
      return (raw[lang] as string) || raw.fr || raw.en || raw.ar || "";
    }
    return String(raw);
  };
  const save = async () => {
    try {
      const safeValues: typeof values = {};
      for (const [key, val] of Object.entries(values)) {
        const fixed = { ...val };
        for (const lang of ["fr", "en", "ar"] as const) {
          if (fixed[lang] && !fixed[lang].includes("portfolio_url") && fixed[lang].includes("agency_website")) {
            fixed[lang] = fixed[lang].replace(
              /{{\/if}}{{#if agency_website}}/,
              '{{/if}}{{#if portfolio_url}}\ud83d\udcbc {{portfolio_url}}\n{{/if}}{{#if agency_website}}'
            );
          }
        }
        safeValues[key] = fixed;
      }
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageTemplates: safeValues }),
      });
      setEditing(false);
    } catch (e) {
      console.error("Failed to save:", e);
    }
  };

  const stages = [
    { id: "intro", title: "Message 1 — Premier contact", desc: "Accroche personnalisée qui mentionne le business, ses avis et l'absence de site web.", icon: "💬" },
    { id: "demo", title: "Message 2 — Envoi de la démo", desc: "Présente la démo et explique pourquoi ce business a besoin d'un site.", icon: "🎨" },
    { id: "quote", title: "Message 3 — Devis et lien de paiement", desc: "Propose une offre tarifaire avec lien de paiement sécurisé.", icon: "💰" },
    { id: "payment_received", title: "Message 4 — Accusé de paiement", desc: "Confirme la réception du paiement et annonce la livraison du site dans 24h.", icon: "✅" },
    { id: "delivery", title: "Message 5 — Livraison du site", desc: "Annonce la mise en ligne du site avec le lien final.", icon: "🚀" },
    { id: "thanks", title: "Message 6 — Remerciement & fidélisation", desc: "Message post-livraison pour fidéliser et offrir un avantage parrainage.", icon: "🙏" },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm text-slate-700">
              💡 <strong>Variables</strong> : {"{{firstName}}"} {"{{name}}"} {"{{sector}}"} {"{{city}}"} {"{{phone}}"} {"{{rating}}"} {"{{demo_url}}"} {"{{payment_url}}"} {"{{final_site_url}}"} {"{{price}}"} {"{{features}}"}
              <br />
              <span className="text-xs text-slate-500">Conditionnels : {"{{#if var}}"} ... {"{{/if}}"}</span>
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              📝 Modifiez dans <Link href="/settings" className="underline">Settings &gt; Templates messages</Link> — les changements s'appliquent instantanément ici
            </p>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs">Annuler</button>
                <button onClick={save} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">Sauvegarder dans Settings</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs">✏️ Éditer</button>
            )}
          </div>
        </div>
      </div>

      {!settings.paymentLink && !(settings as any).paymentLinkEUR && !(settings as any).paymentLinkUSD && !(settings as any).paymentLinkMAD && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          ⚠️ Vous n'avez pas configuré votre <Link href="/settings" className="font-bold underline">lien de paiement</Link>. Le message de vente affichera un placeholder.
        </div>
      )}
      {!settings.whatsappNumber && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          💡 Astuce : configurez votre <Link href="/settings" className="font-bold underline">numéro WhatsApp</Link> dans les paramètres de l'agence.
        </div>
      )}

      {business.phone && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-semibold text-blue-900">📞 Contact WhatsApp du prospect</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded-md bg-white px-3 py-1.5 font-mono text-sm text-blue-900">
              {business.phone}
            </code>
            <span className="text-[10px] text-blue-600">
              (Format international: {business.phone.replace(/[^0-9]/g, "").replace(/^0/, "").replace(/^(33)/, "+33 ")})
            </span>
            <button
              onClick={copyPhone}
              className="ml-auto rounded-md border border-blue-300 bg-white px-2.5 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
            >
              {copiedField === "phone" ? "✓ Copié" : "📋 Copier n°"}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-blue-700">
            💡 Si WhatsApp Web ne s'ouvre pas : copiez le numéro, ouvrez WhatsApp sur votre téléphone, ajoutez le contact, et collez le message ci-dessous.
          </p>
        </div>
      )}

      {stages.map((s) => {
        const value = values[s.id] || "";
        return (
          <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-slate-900">{s.icon} {s.title}</h4>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => openWhatsApp(s.id, value)}
                  disabled={!business.phone || copiedField === `sent_${s.id}`}
                  className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Envoie le message via WhatsApp (session connectée ou WhatsApp Web)"
                >
                  {copiedField === `sent_${s.id}` ? "✅ Envoyé !" : "🚀 Envoyer"}
                </button>
                <button
                  onClick={() => openOnMobile(s.id, value)}
                  disabled={!business.phone}
                  className="rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:hidden"
                  title="Ouvre l'app WhatsApp sur mobile"
                >
                  📱 App mobile
                </button>
                <button
                  onClick={() => copyMessageWithLink(s.id, value)}
                  disabled={!business.phone}
                  className="rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                  title="Copie un lien wa.me cliquable dans le presse-papier"
                >
                  {copiedField === `${s.id}_link` ? "✓ Lien copié" : "🔗 Copier lien wa.me"}
                </button>
                <button
                  onClick={() => copy(getStageText(value), s.id)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  title="Copie le texte du message"
                >
                  {copiedField === s.id ? "✓ Texte copié" : "📋 Copier texte"}
                </button>
              </div>
            </div>
            <p className="mb-2 text-xs text-slate-500">{s.desc}</p>
            {editing ? (
              <textarea
                value={getStageText(value)}
                onChange={(e) => {
                  const lang = campaignLanguage || detectProspectLanguage(business.country, business.city) || "fr";
                  setValues((prev) => ({
                    ...prev,
                    [s.id]: { ...prev[s.id], [lang]: e.target.value },
                  }));
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                rows={8}
              />
            ) : (
              <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{getStageText(value)}</pre>
            )}
          </div>
        );
      })}

      {prospect.workflowStage === "quoted" && settings.paymentLink && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          💡 Le prospect a reçu le devis. Le lien de paiement configuré dans les paramètres sera utilisé.
        </div>
      )}
    </div>
  );
}

function isValidUrl(str: string): boolean {
  if (!str) return true;
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function LinksTab({ prospect, business, settings, campaignCurrency, onUpdate }: { prospect: Prospect; business: Business; settings: Settings; campaignCurrency?: string; onUpdate: (u: any) => Promise<void> }) {
  const [demoUrl, setDemoUrl] = useState(prospect.externalDemoUrl || "");
  const [siteUrl, setSiteUrl] = useState(prospect.externalSiteUrl || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDemoUrl(prospect.externalDemoUrl || "");
    setSiteUrl(prospect.externalSiteUrl || "");
  }, [prospect.externalDemoUrl, prospect.externalSiteUrl]);

  const currency = campaignCurrency || "EUR";
  const currencySymbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "DH";
  const priceKey = `price${currency}` as "priceEUR" | "priceUSD" | "priceMAD";
  const marketPrice = (settings as any)[priceKey] || 0;

  const save = async () => {
    setSaving(true);
    try {
      await onUpdate({
        externalDemoUrl: demoUrl || null,
        externalSiteUrl: siteUrl || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
        💡 <strong>Le projet n'est PAS de vibcoder le site sur cette plateforme.</strong> Vous prenez le prompt Vibecoder,
        vous le collez dans <strong>Claude / Cursor / v0 / Bolt</strong>, vous vibcodez le site de votre côté,
        puis vous collez ici les liens générés pour les utiliser dans vos messages WhatsApp.
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">🎨 Lien de la démo externe</h3>
        <p className="mt-1 text-xs text-slate-500">
          Collez ici l'URL du site de démo que vous avez vibcodé en externe. Ce lien sera utilisé dans le message WhatsApp d'envoi de la démo.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            placeholder="https://demo-mon-site.netlify.app"
            className={`flex-1 rounded-xl border bg-slate-50 px-3 py-2 text-sm ${demoUrl && !isValidUrl(demoUrl) ? "border-red-400" : "border-slate-200"}`}
          />
          {demoUrl && (
            <a href={demoUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              🔗 Ouvrir
            </a>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">🚀 Lien du site final externe</h3>
        <p className="mt-1 text-xs text-slate-500">
          Collez ici l'URL définitive du site que vous avez livré au prospect. Ce lien sera utilisé dans le message de livraison.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://www.client.com"
            className={`flex-1 rounded-xl border bg-slate-50 px-3 py-2 text-sm ${siteUrl && !isValidUrl(siteUrl) ? "border-red-400" : "border-slate-200"}`}
          />
          {siteUrl && (
            <a href={siteUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              🔗 Ouvrir
            </a>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">💰 Tarification & Paiement</h3>
        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">
            Prix du marché : <span className="text-xl font-bold">{formatPrice(marketPrice, currency)}</span>
          </p>
          <p className="mt-1 text-xs text-blue-600">
            Devise de la campagne : {currency} {currencySymbol}
          </p>
        </div>
        {(settings.paymentLink || (settings as any).paymentLinkEUR || (settings as any).paymentLinkUSD || (settings as any).paymentLinkMAD) ? (
          <p className="mt-3 text-sm text-emerald-700">✓ Lien de paiement configuré dans Settings</p>
        ) : (
          <p className="mt-3 text-sm text-amber-600">⚠️ Lien de paiement non configuré. <Link href="/settings" className="underline">Configurer dans Settings</Link></p>
        )}
        {prospect.paymentStatus === "paid" && (
          <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            ✅ Paiement reçu le {prospect.paymentDate ? new Date(prospect.paymentDate).toLocaleString("fr-FR") : "—"}
          </p>
        )}
        {prospect.paymentStatus !== "paid" && (
          <button
            onClick={async () => {
              if (!confirm("Marquer ce prospect comme payé ?")) return;
              const res = await fetch(`/api/prospects/${prospect.id}/pay`, { method: "POST" });
              if (res.ok) {
                const data = await res.json();
                if (data.prospect) onUpdate(data.prospect);
              }
            }}
            className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            ✅ Marquer comme payé
          </button>
        )}
      </div>

      <div className="sticky bottom-4 flex items-center justify-end gap-2">
        {saved && <span className="text-sm text-emerald-600">✓ Liens enregistrés</span>}
        <button
          onClick={save}
          disabled={saving || (demoUrl !== "" && !isValidUrl(demoUrl)) || (siteUrl !== "" && !isValidUrl(siteUrl))}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "💾 Sauvegarder les liens"}
        </button>
      </div>
    </div>
  );
}


function DeleteProspectButton({ prospectId, prospectName }: { prospectId: number; prospectName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const del = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/prospects/${prospectId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/prospects");
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
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        Supprimer
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border-2 border-red-300 bg-red-50 p-2">
      <span className="text-xs text-red-800">
        ⚠️ Supprimer <strong>{prospectName}</strong> ? Action irréversible.
      </span>
      <button
        onClick={del}
        disabled={deleting}
        className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {deleting ? "Suppression..." : "Confirmer"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs"
      >
        Annuler
      </button>
    </div>
  );
}

function SendWhatsAppModal({
  url, text, stage, onClose, copy, copiedField,
}: {
  url: string;
  text: string;
  stage: string;
  onClose: () => void;
  copy: (t: string, f: string) => void;
  copiedField: string | null;
}) {
  // Build a QR code URL using a free public service
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(url)}`;
  const [manualAttempt, setManualAttempt] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(copiedField === "modal_url");
  const [copiedText, setCopiedText] = useState(copiedField === "modal_text");

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    }
  };
  const copyTextOnly = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch {}
  };

  const openDirect = () => {
    setManualAttempt(true);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
          aria-label="Fermer"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <h2 className="text-xl font-bold text-slate-900">Envoyer via WhatsApp</h2>
          </div>

          <p className="mb-5 text-sm text-slate-600">
            Si l'ouverture directe de WhatsApp Web est bloquée par votre navigateur,
            utilisez l'une des méthodes ci-dessous (QR code, copie de lien, ou envoi manuel).
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Method 1: Open directly */}
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-sm font-bold text-white">1</span>
                <h3 className="font-bold text-emerald-900">Ouvrir WhatsApp</h3>
              </div>
              <p className="mb-3 text-xs text-emerald-800">
                Cliquez pour ouvrir WhatsApp Web dans un nouvel onglet.
              </p>
              <button
                onClick={openDirect}
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow hover:bg-emerald-700"
              >
                💬 Ouvrir WhatsApp Web
              </button>
              {manualAttempt && (
                <p className="mt-2 text-[10px] text-emerald-700">
                  ✓ Si une nouvelle fenêtre ne s'ouvre pas, votre navigateur bloque les popups. Utilisez la méthode 2.
                </p>
              )}
            </div>

            {/* Method 2: QR Code */}
            <div className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-sm font-bold text-white">2</span>
                <h3 className="font-bold text-violet-900">Scanner le QR code</h3>
              </div>
              <p className="mb-3 text-xs text-violet-800">
                Scannez avec l'appareil photo de votre téléphone ou l'app WhatsApp.
              </p>
              <div className="flex justify-center">
                <div className="rounded-xl border-4 border-white bg-white p-2 shadow-md">
                  <img
                    src={qrUrl}
                    alt="QR Code pour ouvrir WhatsApp"
                    className="h-48 w-48"
                    width={200}
                    height={200}
                    onError={(e) => {
                      // Fallback: hide image and show URL
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] text-violet-700">
                📱 → 💬 Une fois scanné, WhatsApp s'ouvre avec le message
              </p>
            </div>
          </div>

          {/* Method 3: Copy the link */}
          <div className="mt-5 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-700 text-sm font-bold text-white">3</span>
              <h3 className="font-bold text-slate-900">Copier le lien et l'ouvrir ailleurs</h3>
            </div>
            <p className="mb-2 text-xs text-slate-600">
              Si les deux méthodes ci-dessus ne marchent pas : copiez le lien et collez-le dans
              un navigateur qui autorise WhatsApp (ex. navigateur de votre téléphone).
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                value={url}
                onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[10px] text-slate-700 outline-none focus:border-blue-500"
              />
              <button
                onClick={copyUrl}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                {copiedUrl ? "✓ Copié !" : "📋 Copier le lien"}
              </button>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900">
                📝 Voir le texte du message
              </summary>
              <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-[10px] text-slate-700">
{text}
              </pre>
              <button
                onClick={copyTextOnly}
                className="mt-2 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
              >
                {copiedText ? "✓ Copié" : "📋 Copier le texte uniquement"}
              </button>
            </details>
          </div>

          {/* Method 4: Manual instructions */}
          <div className="mt-5 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="font-bold text-amber-900">📱 Alternative : Envoi manuel depuis votre téléphone</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-amber-800">
              <li>Copiez le numéro WhatsApp du prospect (bouton "📋 Copier n°" en haut)</li>
              <li>Ouvrez WhatsApp sur votre téléphone</li>
              <li>Ajoutez un nouveau contact avec ce numéro</li>
              <li>Ouvrez la discussion et collez le message</li>
            </ol>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-500">
            <span>
              Cette action a été enregistrée : <strong className="text-slate-700">{stage}</strong> envoyé
            </span>
            <button
              onClick={onClose}
              className="rounded-md bg-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-300"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * EditBusinessButton — modal that lets the user edit the business info
 * (name, phone, email, address, website, etc.) of this prospect.
 */
function EditBusinessButton({
  prospectId, business, prospect, onSaved,
}: {
  prospectId: number;
  business: any;
  prospect: any;
  onSaved: (updated: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: business.name || "",
    phone: business.phone || "",
    email: business.email || "",
    website: business.website || "",
    address: business.address || "",
    street: business.street || "",
    housenumber: business.housenumber || "",
    postcode: business.postcode || "",
    city: business.city || "",
    state: business.state || "",
    country: business.country || "",
    category: business.category || "",
    subcategory: business.subcategory || "",
    rating: business.rating || "",
    description: business.description || "",
    cuisine: business.cuisine || "",
    openingHours: business.openingHours || "",
    facebook: business.facebook || "",
    instagram: business.instagram || "",
    linkedin: business.linkedin || "",
    youtube: business.youtube || "",
    externalDemoUrl: prospect?.externalDemoUrl || "",
    externalSiteUrl: prospect?.externalSiteUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        name: business.name || "",
        phone: business.phone || "",
        email: business.email || "",
        website: business.website || "",
        address: business.address || "",
        street: business.street || "",
        housenumber: business.housenumber || "",
        postcode: business.postcode || "",
        city: business.city || "",
        state: business.state || "",
        country: business.country || "",
        category: business.category || "",
        subcategory: business.subcategory || "",
        rating: business.rating || "",
        description: business.description || "",
        cuisine: business.cuisine || "",
        openingHours: business.openingHours || "",
        facebook: business.facebook || "",
        instagram: business.instagram || "",
        linkedin: business.linkedin || "",
        youtube: business.youtube || "",
        externalDemoUrl: prospect?.externalDemoUrl || "",
        externalSiteUrl: prospect?.externalSiteUrl || "",
      });
    }
  }, [open, business, prospect]);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/prospects/${prospectId}/business`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setSaved(true);
      // Pass back both the updated business and prospect so the parent
      // can re-render with fresh data (including new external URLs).
      onSaved({ business: data.business, prospect: data.prospect });
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
      }, 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        ✏️ Modifier les informations (business + liens externes)
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
          aria-label="Fermer"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-1 text-lg font-bold text-slate-900">✏️ Modifier les informations</h2>
        <p className="mb-4 text-xs text-slate-500">
          Corrigez le numéro de téléphone, l'email, l'adresse, ou ajoutez les liens externes du site vibecodé.
        </p>

        <div className="space-y-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3">
            <p className="mb-2 text-[11px] font-semibold text-blue-900">📞 Coordonnées business</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <EditField label="Nom" value={form.name} onChange={(v) => set("name", v)} required />
              <EditField label="Téléphone" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+33 5 56 12 34 56" required />
              <EditField label="Email" value={form.email} onChange={(v) => set("email", v)} type="email" />
              <EditField label="Site web" value={form.website} onChange={(v) => set("website", v)} placeholder="https://..." />
              <EditField label="Catégorie" value={form.category} onChange={(v) => set("category", v)} />
              <EditField label="Sous-catégorie" value={form.subcategory} onChange={(v) => set("subcategory", v)} />
              <EditField label="Note" value={form.rating} onChange={(v) => set("rating", v)} placeholder="4.5" />
              <EditField label="Cuisine" value={form.cuisine} onChange={(v) => set("cuisine", v)} />
              <EditField label="Horaires" value={form.openingHours} onChange={(v) => set("openingHours", v)} placeholder="Mo-Fr 09:00-19:00" />
              <EditField label="Pays" value={form.country} onChange={(v) => set("country", v)} />
            </div>
            <EditField label="Adresse complète" value={form.address} onChange={(v) => set("address", v)} fullWidth />
            <div className="grid gap-3 sm:grid-cols-4">
              <EditField label="N°" value={form.housenumber} onChange={(v) => set("housenumber", v)} />
              <EditField label="Rue" value={form.street} onChange={(v) => set("street", v)} />
              <EditField label="Code postal" value={form.postcode} onChange={(v) => set("postcode", v)} />
              <EditField label="Ville" value={form.city} onChange={(v) => set("city", v)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <EditField label="Facebook" value={form.facebook} onChange={(v) => set("facebook", v)} placeholder="https://facebook.com/..." />
              <EditField label="Instagram" value={form.instagram} onChange={(v) => set("instagram", v)} placeholder="https://instagram.com/..." />
              <EditField label="LinkedIn" value={form.linkedin} onChange={(v) => set("linkedin", v)} />
              <EditField label="YouTube" value={form.youtube} onChange={(v) => set("youtube", v)} />
            </div>
            <EditField label="Description" value={form.description} onChange={(v) => set("description", v)} fullWidth multiline />
          </div>

          <div className="rounded-xl border-2 border-violet-200 bg-violet-50 p-3">
            <p className="mb-2 text-[11px] font-semibold text-violet-900">🔗 Liens externes du site vibecodé</p>
            <EditField
              label="Lien de la démo (Vibecoder / Netlify / Vercel)"
              value={form.externalDemoUrl}
              onChange={(v) => set("externalDemoUrl", v)}
              placeholder="https://demo-mon-site.netlify.app"
              fullWidth
            />
            <EditField
              label="Lien du site final livré au client"
              value={form.externalSiteUrl}
              onChange={(v) => set("externalSiteUrl", v)}
              placeholder="https://www.client.com"
              fullWidth
            />
            <p className="mt-2 text-[10px] text-violet-700">
              💡 Ces liens sont automatiquement insérés dans les templates WhatsApp via les variables <code>{"{{demo_url}}"}</code> et <code>{"{{final_site_url}}"}</code>.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {saved && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">
            ✓ Modifications enregistrées !
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "💾 Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditField({
  label, value, onChange, placeholder, type = "text", required = false, fullWidth = false, multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white"
        />
      )}
    </div>
  );
}
