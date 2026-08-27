"use client";

import { useState } from "react";
import Link from "next/link";

type Category = "all" | "web" | "ads" | "seo" | "ai";
type Lang = "fr" | "en" | "ar";

interface Project {
  id: string;
  title: string;
  client: string;
  category: "web" | "ads" | "seo" | "ai";
  categoryLabel: { fr: string; en: string; ar: string };
  metrics: { value: string; label: { fr: string; en: string; ar: string } }[];
  description: { fr: string; en: string; ar: string };
  tags: string[];
  color: string;
  imageBg: string;
}

const PROJECTS: Project[] = [
  {
    id: "bistrot-paris",
    title: "Le Bistrot Parisien",
    client: "Restauration & Gastronomie · Paris",
    category: "web",
    categoryLabel: { fr: "Site Web & SEO", en: "Web Design & SEO", ar: "موقع ويب وسيو" },
    metrics: [
      { value: "+320%", label: { fr: "Réservations en ligne", en: "Online Bookings", ar: "حجوزات عبر الإنترنت" } },
      { value: "1ère page", label: { fr: "Sur Google Maps", en: "On Google Maps", ar: "على خرائط جوجل" } },
    ],
    description: {
      fr: "Création d'un site web ultra-rapide avec menu digital interactif, commande en 1 clic via WhatsApp et optimisation SEO locale.",
      en: "Built a lightning-fast website featuring an interactive digital menu, 1-click WhatsApp ordering, and local SEO dominance.",
      ar: "إنشاء موقع ويب فائق السرعة مع قائمة رقمية تفاعلية، وطلب بنقرة واحدة عبر واتساب وتحسين محلي لمحركات البحث.",
    },
    tags: ["Next.js", "WhatsApp Ordering", "SEO Local", "Menu QR"],
    color: "#E8622A",
    imageBg: "linear-gradient(135deg, #1e293b, #0f172a)",
  },
  {
    id: "clinic-dentaire",
    title: "Cabinet Dentaire Étoile",
    client: "Santé & Médical · Lyon",
    category: "web",
    categoryLabel: { fr: "Site Web & Prise de RDV", en: "Web & Booking", ar: "موقع ويب ومواعيد" },
    metrics: [
      { value: "85+", label: { fr: "Nouveaux patients/mois", en: "New patients/mo", ar: "مرضى جدد شهرياً" } },
      { value: "< 1.2s", label: { fr: "Temps de chargement", en: "Load Time", ar: "وقت التحميل" } },
    ],
    description: {
      fr: "Refonte complète avec prise de rendez-vous fluide, présentation de l'équipe et conformité médicale stricte.",
      en: "Complete redesign featuring seamless appointment scheduling, team presentation, and medical compliance.",
      ar: "إعادة تصميم كاملة مع حجز مواعيد سلس، وعرض فريق العمل والامتثال الطبي.",
    },
    tags: ["React", "Prise de RDV", "Google Reviews Sync", "Responsive"],
    color: "#2563EB",
    imageBg: "linear-gradient(135deg, #1e3a8a, #0f172a)",
  },
  {
    id: "ecom-fashion",
    title: "Maison Velvet",
    client: "E-Commerce Mode & Luxe · Casablanca / Paris",
    category: "ads",
    categoryLabel: { fr: "Campagnes Ads & Scaling", en: "Paid Ads & Scaling", ar: "إعلانات مدفوعة" },
    metrics: [
      { value: "x4.8", label: { fr: "ROAS moyen Meta Ads", en: "Avg ROAS on Meta", ar: "متوسط العائد الإعلاني" } },
      { value: "+180k€", label: { fr: "CA généré en 90j", en: "Revenue in 90d", ar: "إيرادات في 90 يوماً" } },
    ],
    description: {
      fr: "Stratégie publicitaire multicanale (Meta + TikTok Ads) avec tunnels de conversion et retargeting dynamique.",
      en: "Multi-channel advertising strategy (Meta + TikTok) with high-converting funnels and dynamic retargeting.",
      ar: "استراتيجية إعلانية متعددة القنوات مع مسارات تحويل وإعادة استهداف ديناميكية.",
    },
    tags: ["Meta Ads", "TikTok Ads", "CBO Strategy", "Funnel CRO"],
    color: "#7C3AED",
    imageBg: "linear-gradient(135deg, #4c1d95, #0f172a)",
  },
  {
    id: "auto-garage",
    title: "Garage Auto Prestige",
    client: "Services Automobiles · Bordeaux",
    category: "ai",
    categoryLabel: { fr: "Chatbot IA & WhatsApp", en: "AI Chatbot & WhatsApp", ar: "شات بوت ذكاء اصطناعي" },
    metrics: [
      { value: "24/7", label: { fr: "Réponse automatique", en: "Automated Replies", ar: "رد آلي 24/7" } },
      { value: "-65%", label: { fr: "Temps de gestion appels", en: "Call handling time", ar: "تقليل وقت المكالمات" } },
    ],
    description: {
      fr: "Déploiement d'un agent IA WhatsApp connecté au calendrier pour qualifier les devis carrosserie et planifier les RDV.",
      en: "Deployed an AI WhatsApp agent integrated with Google Calendar to qualify quotes and schedule appointments 24/7.",
      ar: "نشر وكيل ذكاء اصطناعي على واتساب لفرز طلبات عروض الأسعار وجدولة المواعيد على مدار الساعة.",
    },
    tags: ["AI Agent", "WhatsApp API", "n8n", "Calendar Sync"],
    color: "#10B981",
    imageBg: "linear-gradient(135deg, #065f46, #0f172a)",
  },
  {
    id: "immo-agency",
    title: "Horizon Immobilier",
    client: "Agence Immobilière · Marseille",
    category: "seo",
    categoryLabel: { fr: "SEO & Domination Locale", en: "SEO & Local Dominance", ar: "سيو محلي" },
    metrics: [
      { value: "#1", label: { fr: "Sur 14 mots-clés cibles", en: "On 14 Target Keywords", ar: "المرتبة الأولى في 14 كلمة" } },
      { value: "+410%", label: { fr: "Trafic organique", en: "Organic Traffic", ar: "ترافيك طبيعي" } },
    ],
    description: {
      fr: "Audit technique, optimisation sémantique multi-pages et stratégie de maillage local pour capter les mandats vendeurs.",
      en: "Technical audit, multi-page semantic optimization, and local backlink strategy to capture high-value property leads.",
      ar: "تدقيق تقني، وتحسين الكلمات المفتاحية واستراتيجية روابط محلية لجذب العملاء الراغبين في البيع.",
    },
    tags: ["SEO Technique", "Schema.org", "Content Cluster", "Page Speed 99"],
    color: "#0891B2",
    imageBg: "linear-gradient(135deg, #155e75, #0f172a)",
  },
  {
    id: "artisans-plomberie",
    title: "Plomberie Express 24",
    client: "Artisans & Dépannage · Bruxelles",
    category: "ads",
    categoryLabel: { fr: "Google Ads Urgences", en: "Google Ads Lead Gen", ar: "إعلانات جوجل للمستعجلات" },
    metrics: [
      { value: "14.20€", label: { fr: "Coût par appel qualifié", en: "Cost Per Qualified Call", ar: "تكلفة المكالمة المؤهلة" } },
      { value: "6.8x", label: { fr: "Retour sur investissement", en: "ROI on Ad Spend", ar: "عائد الاستثمار" } },
    ],
    description: {
      fr: "Campagne Google Ads Search ultra-ciblée sur les urgences de dépannage avec landing page à taux de conversion record (28%).",
      en: "Hyper-targeted Google Search campaign focused on emergency repairs with an ultra-high 28% conversion rate landing page.",
      ar: "حملة إعلانات جوجل مستهدفة للطوارئ مع صفحة هبوط ذات معدل تحويل قياسي.",
    },
    tags: ["Google Ads", "Call Ads", "Landing CRO", "Tracking GA4"],
    color: "#E8622A",
    imageBg: "linear-gradient(135deg, #7c2d12, #0f172a)",
  },
];

const TEXTS = {
  fr: {
    backHome: "← Retour à l'accueil",
    badge: "Réalisations & Études de Cas",
    title: "Nos Projets & Résultats Clients",
    subtitle: "Découvrez comment nous aidons les entreprises ambitieuses à acquérir des clients, automatiser leurs opérations et dominer leur marché.",
    all: "Tous les projets",
    web: "Sites Web & Apps",
    ads: "Publicité Ads",
    seo: "SEO & Visibilité",
    ai: "IA & Automatisation",
    ctaTitle: "Prêt à obtenir les mêmes résultats pour votre entreprise ?",
    ctaSub: "Nous analysons gratuitement votre présence en ligne et vous proposons une stratégie sur-mesure.",
    getQuote: "Demander un devis gratuit",
    contactUs: "Échanger sur WhatsApp",
  },
  en: {
    backHome: "← Back to home",
    badge: "Case Studies & Work",
    title: "Our Work & Proven Results",
    subtitle: "Explore how we help ambitious brands acquire customers, automate operations, and dominate their local market.",
    all: "All Projects",
    web: "Web & Apps",
    ads: "Paid Ads",
    seo: "SEO & Growth",
    ai: "AI & Automation",
    ctaTitle: "Ready to scale your business with GoSite?",
    ctaSub: "Get a complimentary digital audit and a tailored growth proposal with zero commitment.",
    getQuote: "Get Free Quote",
    contactUs: "Chat on WhatsApp",
  },
  ar: {
    backHome: "← العودة للرئيسية",
    badge: "أعمالنا ودراسات الحالة",
    title: "مشاريعنا والنتائج المحققة",
    subtitle: "اكتشف كيف نساعد الشركات على جذب العملاء، أتمتة العمليات وتنمية أعمالهم بأعلى عائد استثماري.",
    all: "جميع المشاريع",
    web: "مواقع وتطبيقات",
    ads: "إعلانات ممولة",
    seo: "سيو ونمو",
    ai: "ذكاء اصطناعي وأتمتة",
    ctaTitle: "جاهز لتحقيق نفس النتائج لشركتك؟",
    ctaSub: "احصل على تدقيق رقمي مجاني وعرض استراتيجي مخصص بدون أي التزام.",
    getQuote: "طلب عرض أسعار مجاني",
    contactUs: "تواصل عبر واتساب",
  },
};

export default function PortfolioPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [category, setCategory] = useState<Category>("all");
  const t = TEXTS[lang];

  const filtered = PROJECTS.filter((p) => category === "all" || p.category === category);

  return (
    <div className="min-h-screen bg-[#0A1628] text-white" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A1628]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-white transition hover:opacity-90">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8622A] text-white font-black shadow-lg shadow-[#E8622A]/30">
              ⚡
            </span>
            <span className="text-lg tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              GoSite
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-1">
              {(["en", "fr", "ar"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                    lang === l ? "bg-[#2563EB] text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {l === "en" ? "EN" : l === "fr" ? "FR" : "ع"}
                </button>
              ))}
            </div>

            <Link
              href="/"
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              {t.backHome}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-16 text-center sm:py-24">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.25),transparent)]" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2563EB]/40 bg-[#2563EB]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#60A5FA]">
            <span>✨</span> {t.badge}
          </div>
          <h1
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.1 }}
          >
            {t.title}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
            {t.subtitle}
          </p>

          {/* Filters */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {(
              [
                ["all", t.all],
                ["web", t.web],
                ["ads", t.ads],
                ["seo", t.seo],
                ["ai", t.ai],
              ] as [Category, string][]
            ).map(([catId, label]) => (
              <button
                key={catId}
                onClick={() => setCategory(catId)}
                className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                  category === catId
                    ? "bg-[#E8622A] text-white shadow-lg shadow-[#E8622A]/30"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-2xl"
            >
              <div>
                {/* Visual Header */}
                <div
                  className="mb-5 flex aspect-[16/10] items-center justify-center rounded-2xl border border-white/10 p-6 text-center shadow-inner"
                  style={{ background: proj.imageBg }}
                >
                  <div>
                    <span
                      className="inline-block rounded-lg px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white"
                      style={{ background: `${proj.color}33`, color: proj.color, border: `1px solid ${proj.color}55` }}
                    >
                      {proj.categoryLabel[lang]}
                    </span>
                    <h3 className="mt-3 text-xl font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {proj.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">{proj.client}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="mb-5 grid grid-cols-2 gap-3">
                  {proj.metrics.map((m, idx) => (
                    <div key={idx} className="rounded-xl border border-white/5 bg-white/[0.04] p-3 text-center">
                      <div className="text-xl font-extrabold text-white" style={{ color: proj.color }}>
                        {m.value}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">{m.label[lang]}</div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <p className="text-xs leading-relaxed text-slate-300">
                  {proj.description[lang]}
                </p>
              </div>

              {/* Tags */}
              <div className="mt-6 flex flex-wrap gap-1.5 border-t border-white/10 pt-4">
                {proj.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Box */}
        <div className="mt-20 overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 p-8 text-center sm:p-12">
          <h2
            className="text-2xl font-black text-white sm:text-3xl"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {t.ctaTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">
            {t.ctaSub}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#2563EB]/40 transition hover:bg-blue-600"
            >
              ✉️ {t.getQuote}
            </Link>
            <a
              href="https://wa.me/212751134318"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              💬 {t.contactUs}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
