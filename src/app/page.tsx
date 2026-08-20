"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Lang = "en" | "fr" | "ar";

const CURR: Record<Lang, string> = {
  en: "$ USD",
  fr: "€ EUR",
  ar: "د.م. MAD",
};

const BUDGETS: Record<Lang, string[]> = {
  en: ["< $550", "$550 - $2,200", "$2,200 - $5,500", "> $5,500"],
  fr: ["< 450€", "450€ - 1,800€", "1,800€ - 4,500€", "> 4,500€"],
  ar: ["< 5,000 د.م.", "5,000 - 22,000 د.م.", "22,000 - 55,000 د.م.", "> 55,000 د.م."],
};

const T = {
  en: {
    navLinks: ["Services", "Results", "Why Us", "Process", "Clients", "Contact"],
    available: "Available",
    getQuote: "Get a Quote",
    badge: "Performance-Driven Digital Agency",
    heroH1: (
      <>
        We Build.
        <br />
        <span style={{ color: "var(--gs-blue3)" }}>We Advertise.</span>
        <br />
        <span style={{ color: "var(--orange)" }}>We Scale.</span>
      </>
    ),
    heroP: (
      <>
        <strong style={{ color: "white" }}>GoSite</strong> is a results-obsessed digital agency. From
        high-performance websites and AI chatbots to ROI-driven ad campaigns —
        we deliver measurable growth for ambitious businesses.
      </>
    ),
    getFreeQuote: "Get Free Quote",
    viewPortfolio: "View Portfolio",
    freeAudit: "Free audit",
    reply24h: "Reply within 24h",
    noCommit: "No commitment",
    remote100: "100% remote",
    perfTitle: "Our Performance",
    servicesTitle: "End-to-end digital performance services.",
    servicesSub:
      "From building your website to scaling your ad campaigns — we handle your entire digital ecosystem with one goal: measurable ROI.",
    resultsTitle: "Numbers that speak for themselves.",
    resultsSub:
      "Every metric below comes from a real client project. No estimates, no guesswork.",
    whyTitle: "We don't just deliver.\nWe obsess over ROI.",
    whySub:
      "Unlike agencies that hide behind vanity metrics, we define targets before we start and report honestly every week.",
    processTitle: "Simple. Transparent.\nResult-driven.",
    processSub:
      "Our 5-step process ensures every project delivers the maximum value possible — on time and within budget.",
    clientsTitle: "Clients who trust GoSite.",
    ctaTitle: "Ready to grow your business?",
    ctaP:
      "Get a free audit and personalised strategy proposal — no commitment, results guaranteed from day one.",
    contactTitle: "Let's talk about\nyour project.",
    contactSub:
      "Free audit · Free quote · Reply within 24h · No commitment",
    availableProjects: "Available for new projects",
    locationLabel: "Europe · Middle East · Americas · International",
    sendMessage: "Send us a message",
    fullName: "Full name",
    serviceName: "Service needed",
    budgetLabel: "Monthly budget",
    tellProject: "Tell us about your project",
    sendBtn: "Send Message",
    sentMsg: "Message sent! We'll reply within 24h.",
  },
  fr: {
    navLinks: ["Services", "Résultats", "Pourquoi nous", "Processus", "Clients", "Contact"],
    available: "Disponible",
    getQuote: "Demander un devis",
    badge: "Agence Digitale orientée Performance",
    heroH1: (
      <>
        Nous Construisons.
        <br />
        <span style={{ color: "var(--gs-blue3)" }}>Nous Faisons de la Pub.</span>
        <br />
        <span style={{ color: "var(--orange)" }}>Nous Scalons.</span>
      </>
    ),
    heroP: (
      <>
        <strong style={{ color: "white" }}>GoSite</strong> est une agence digitale obsédée par les résultats.
        Des sites haute performance aux campagnes publicitaires rentables, en
        passant par les chatbots IA — nous générons une croissance mesurable.
      </>
    ),
    getFreeQuote: "Devis Gratuit",
    viewPortfolio: "Voir Portfolio",
    freeAudit: "Audit gratuit",
    reply24h: "Réponse sous 24h",
    noCommit: "Sans engagement",
    remote100: "100% remote",
    perfTitle: "Nos Performances",
    servicesTitle: "Services digitaux de bout en bout.",
    servicesSub:
      "De la création de votre site web à la mise à l'échelle de vos campagnes — nous gérons votre écosystème digital avec un seul objectif : un ROI mesurable.",
    resultsTitle: "Des chiffres qui parlent d'eux-mêmes.",
    resultsSub:
      "Chaque chiffre ci-dessous provient d'un vrai projet client. Pas d'estimations, pas de suppositions.",
    whyTitle: "Nous ne livrons pas seulement.\nNous sommes obsédés par le ROI.",
    whySub:
      "Contrairement aux agences qui se cachent derrière des métriques creuses, nous définissons les objectifs avant de commencer et reportons honnêtement chaque semaine.",
    processTitle: "Simple. Transparent.\nOrienté résultats.",
    processSub:
      "Notre processus en 5 étapes garantit que chaque projet délivre le maximum de valeur possible — dans les délais et le budget.",
    clientsTitle: "Des clients qui font confiance à GoSite.",
    ctaTitle: "Prêt à faire croître votre activité ?",
    ctaP:
      "Obtenez un audit gratuit et une proposition de stratégie personnalisée — sans engagement, résultats garantis dès le premier jour.",
    contactTitle: "Parlons de\nvotre projet.",
    contactSub:
      "Audit gratuit · Devis gratuit · Réponse sous 24h · Sans engagement",
    availableProjects: "Disponible pour de nouveaux projets",
    locationLabel: "Europe · Moyen-Orient · Amériques · International",
    sendMessage: "Envoyez-nous un message",
    fullName: "Nom complet",
    serviceName: "Service souhaité",
    budgetLabel: "Budget mensuel",
    tellProject: "Parlez-nous de votre projet",
    sendBtn: "Envoyer",
    sentMsg: "Message envoyé ! Nous répondons sous 24h.",
  },
  ar: {
    navLinks: ["الخدمات", "النتائج", "لماذا نحن", "المنهجية", "العملاء", "اتصل بنا"],
    available: "متاح",
    getQuote: "احصل على عرض سعر",
    badge: "وكالة رقمية موجّهة للأداء",
    heroH1: (
      <>
        نبني.
        <br />
        <span style={{ color: "var(--gs-blue3)" }}>نُعلن.</span>
        <br />
        <span style={{ color: "var(--orange)" }}>نُوسّع.</span>
      </>
    ),
    heroP: (
      <>
        <strong style={{ color: "white" }}>GoSite</strong> وكالة رقمية مهووسة بالنتائج. من المواقع عالية
        الأداء وشات بوت الذكاء الاصطناعي إلى الحملات الإعلانية المربحة — نحقق
        نمواً قابلاً للقياس للأعمال الطموحة.
      </>
    ),
    getFreeQuote: "احصل على عرض مجاني",
    viewPortfolio: "عرض المشاريع",
    freeAudit: "تدقيق مجاني",
    reply24h: "رد في 24 ساعة",
    noCommit: "بلا التزام",
    remote100: "100% عن بُعد",
    perfTitle: "أدائنا",
    servicesTitle: "خدمات رقمية متكاملة من البداية إلى النهاية.",
    servicesSub:
      "من بناء موقعك إلى توسيع حملاتك الإعلانية — ندير منظومتك الرقمية بالكامل بهدف واحد: عائد استثمار قابل للقياس.",
    resultsTitle: "أرقام تتحدث عن نفسها.",
    resultsSub:
      "كل رقم أدناه مصدره مشروع عميل حقيقي. لا تقديرات، لا تخمينات.",
    whyTitle: "نحن لا نسلّم فقط.\nنحن مهووسون بعائد الاستثمار.",
    whySub:
      "خلافاً للوكالات التي تختبئ وراء مقاييس وهمية، نحدد الأهداف قبل البدء ونُبلّغ بصدق كل أسبوع.",
    processTitle: "بسيط. شفاف.\nموجّه للنتائج.",
    processSub:
      "عمليتنا من 5 خطوات تضمن أن كل مشروع يحقق أقصى قيمة ممكنة — في الوقت المحدد وضمن الميزانية.",
    clientsTitle: "عملاء يثقون بـ GoSite.",
    ctaTitle: "مستعد لتنمية عملك؟",
    ctaP:
      "احصل على تدقيق مجاني ومقترح استراتيجية مخصص — بلا التزام، نتائج مضمونة من اليوم الأول.",
    contactTitle: "لنتحدث عن\nمشروعك.",
    contactSub:
      "تدقيق مجاني · عرض سعر مجاني · رد في 24 ساعة · بلا التزام",
    availableProjects: "متاح لمشاريع جديدة",
    locationLabel: "أوروبا · الشرق الأوسط · الأمريكتان · دولي",
    sendMessage: "أرسل لنا رسالة",
    fullName: "الاسم الكامل",
    serviceName: "الخدمة المطلوبة",
    budgetLabel: "الميزانية الشهرية",
    tellProject: "أخبرنا عن مشروعك",
    sendBtn: "إرسال",
    sentMsg: "تم الإرسال! سنرد في 24 ساعة.",
  },
};

const SERVICES_DATA = [
  { icon: "web", color: "#2563EB", en: "Web Development", fr: "Développement Web", ar: "تطوير الويب", desc_en: "WordPress, React, Next.js. Sites and SaaS apps built for speed, SEO and conversion from day one.", desc_fr: "WordPress, React, Next.js. Sites et apps SaaS conçus pour la vitesse, le SEO et la conversion.", desc_ar: "WordPress، React، Next.js. مواقع وتطبيقات SaaS مبنية للسرعة والـSEO والتحويل من اليوم الأول.", chips: ["WordPress", "React", "Next.js", "WooCommerce"], kpi_en: "⚡ +250% traffic in 3 months", kpi_fr: "⚡ +250% trafic en 3 mois", kpi_ar: "⚡ +250% ترافيك في 3 أشهر", kpiColor: "#2563EB" },
  { icon: "ads", color: "#E8622A", en: "Paid Advertising", fr: "Publicité Payante", ar: "الإعلانات المدفوعة", desc_en: "Google Ads, Meta Ads, TikTok Ads. Strategy, targeting, creatives, optimisation and transparent reporting.", desc_fr: "Google Ads, Meta Ads, TikTok Ads. Stratégie, ciblage, créatifs, optimisation et reporting transparent.", desc_ar: "Google Ads، Meta Ads، TikTok Ads. استراتيجية، استهداف، إبداعات، تحسين وتقارير شفافة.", chips: ["Google Ads", "Meta Ads", "TikTok Ads", "ROAS"], kpi_en: "📈 Avg ROAS ×4.2", kpi_fr: "📈 ROAS moyen ×4.2", kpi_ar: "📈 ROAS متوسط ×4.2", kpiColor: "#E8622A" },
  { icon: "seo", color: "#2563EB", en: "SEO Technical & Strategy", fr: "SEO Technique & Stratégie", ar: "SEO التقني والاستراتيجي", desc_en: "Full audit, Core Web Vitals, on-page, schema, backlinks. From rank 50 to Top 5 in 6 months.", desc_fr: "Audit complet, CWV, on-page, schema, backlinks. Du rang 50 au Top 5 en 6 mois.", desc_ar: "تدقيق شامل، CWV، on-page، schema، backlinks. من الرتبة 50 إلى Top 5 في 6 أشهر.", chips: ["Audit", "CWV", "Schema", "Backlinks"], kpi_en: "📍 Top 5 in 6 months", kpi_fr: "📍 Top 5 en 6 mois", kpi_ar: "📍 Top 5 في 6 أشهر", kpiColor: "#2563EB" },
  { icon: "ai", color: "#7C3AED", en: "AI Chatbots & Agents", fr: "Chatbots IA & Agents", ar: "شات بوت وعملاء ذكاء اصطناعي", desc_en: "Custom AI chatbots and intelligent agents. OpenAI, LangChain, Rasa, n8n. Automate support, sales and workflows.", desc_fr: "Chatbots IA et agents intelligents. OpenAI, LangChain, Rasa, n8n. Automatisez support, ventes et workflows.", desc_ar: "شات بوت ذكاء اصطناعي مخصص وعملاء ذكيون. OpenAI، LangChain، Rasa، n8n. أتمتة الدعم والمبيعات وسير العمل.", chips: ["OpenAI", "LangChain", "n8n", "Backend"], kpi_en: "🤖 20+ chatbots deployed", kpi_fr: "🤖 +20 chatbots déployés", kpi_ar: "🤖 أكثر من 20 شات بوت منشور", kpiColor: "#7C3AED" },
  { icon: "auto", color: "#10B981", en: "Automation & AI", fr: "Automation & IA", ar: "أتمتة وذكاء اصطناعي", desc_en: "Make, Zapier, n8n + OpenAI API. CRM automation, AI content, data processing, workflow intelligence.", desc_fr: "Make, Zapier, n8n + OpenAI API. Automation CRM, contenu IA, traitement de données, workflow intelligent.", desc_ar: "Make، Zapier، n8n + OpenAI API. أتمتة CRM، محتوى ذكاء اصطناعي، معالجة بيانات، سير عمل ذكي.", chips: ["Make", "Zapier", "n8n", "OpenAI"], kpi_en: "⚙️ ROI 300% — 40h/wk saved", kpi_fr: "⚙️ ROI 300% — 40h/sem éco.", kpi_ar: "⚙️ ROI 300% — توفير 40 ساعة/أسبوع", kpiColor: "#10B981" },
  { icon: "cro", color: "#06B6D4", en: "CRO & Funnels", fr: "CRO & Funnels", ar: "CRO ومسارات التحويل", desc_en: "Conversion rate optimisation, A/B testing, landing pages, user journey mapping. Turn traffic into revenue.", desc_fr: "Optimisation du taux de conversion, A/B testing, landing pages, parcours utilisateur. Transformez le trafic en revenus.", desc_ar: "تحسين معدل التحويل، اختبار A/B، صفحات هبوط، رسم رحلة المستخدم. حوّل الزيارات إلى إيرادات.", chips: ["A/B Test", "Hotjar", "CRO", "Funnel"], kpi_en: "📊 ×2.3 conversion rate", kpi_fr: "📊 ×2.3 taux de conversion", kpi_ar: "📊 ×2.3 معدل تحويل", kpiColor: "#06B6D4" },
  { icon: "analytics", color: "#F59E0B", en: "Analytics & Tracking", fr: "Analytics & Tracking", ar: "تحليلات وتتبع", desc_en: "GTM, GA4, pixel setup, Looker Studio dashboards. Real-time visibility on every euro/dollar spent.", desc_fr: "GTM, GA4, pixels, dashboards Looker Studio. Visibilité en temps réel sur chaque euro dépensé.", desc_ar: "GTM، GA4، إعداد Pixels، لوحات Looker Studio. رؤية فورية على كل درهم/دولار/يورو ينفق.", chips: ["GTM", "GA4", "Looker Studio"], kpi_en: "📉 Full data transparency", kpi_fr: "📉 Transparence totale des données", kpi_ar: "📉 شفافية كاملة للبيانات", kpiColor: "#F59E0B" },
  { icon: "full", color: "#E8622A", en: "Full-Stack Package", fr: "Pack Full-Stack", ar: "الحزمة الكاملة", desc_en: "The complete GoSite experience: website + ads + SEO + AI + automation. One partner for your entire digital growth.", desc_fr: "L'expérience GoSite complète : site web + pub + SEO + IA + automation. Un seul partenaire pour toute votre croissance.", desc_ar: "تجربة GoSite الكاملة: موقع + إعلانات + SEO + ذكاء اصطناعي + أتمتة. شريك واحد لكل نموك الرقمي.", chips: ["Web", "Ads", "SEO", "AI", "Automation"], kpi_en: "🚀 Most popular package", kpi_fr: "🚀 Package le plus populaire", kpi_ar: "🚀 الحزمة الأكثر طلباً", kpiColor: "#E8622A" },
];

const RESULTS_DATA = [
  { emoji: "🛍️", color: "#3B82F6", val_en: "ROAS 5.1", val_fr: "ROAS 5.1", val_ar: "ROAS 5.1", en: "E-commerce — Google Shopping", fr: "E-commerce — Google Shopping", ar: "تجارة إلكترونية — Google Shopping", desc_en: "From ROAS 1.8 to 5.1 in 3 months. Fashion e-commerce. Budget $1,500/month.", desc_fr: "De ROAS 1.8 à 5.1 en 3 mois. E-commerce mode. Budget 1 500€/mois.", desc_ar: "من ROAS 1.8 إلى 5.1 في 3 أشهر. متجر أزياء. ميزانية 15,000 درهم/شهر.", tag: "Google Ads · PMax" },
  { emoji: "🏥", color: "#E8622A", val_en: "$2.5", val_fr: "2,14€", val_ar: "23.05$", en: "Insurance — CPL reduced by 87%", fr: "Assurance — CPL réduit de 87%", ar: "تأمين — تخفيض CPL بنسبة 87%", desc_en: "CPL went from $20 to $2.5. 400+ qualified leads/month via Meta Ads Lead Gen.", desc_fr: "CPL passé de 17,09€ à 2,14€. 400+ leads qualifiés/mois via Meta Ads Lead Gen.", desc_ar: "انخفض CPL من 184.36$ إلى 23.05$. أكثر من 400 عميل مؤهل/شهر عبر Meta Ads Lead Gen.", tag: "Meta Ads · Lead Gen" },
  { emoji: "🔍", color: "#10B981", val_en: "Top 5", val_fr: "Top 5", val_ar: "Top 5", en: "SEO — From rank 50 to Top 5", fr: "SEO — Du rang 50 au Top 5", ar: "SEO — من الرتبة 50 إلى Top 5", desc_en: "WordPress e-commerce. Full technical SEO. +250% organic traffic in 3 months.", desc_fr: "E-commerce WordPress. SEO technique complet. +250% trafic organique en 3 mois.", desc_ar: "متجر WordPress. SEO تقني كامل. +250% ترافيك عضوي في 3 أشهر.", tag: "Technical SEO · WordPress" },
  { emoji: "🤖", color: "#7C3AED", val_en: "20+", val_fr: "20+", val_ar: "20+", en: "AI Chatbots deployed", fr: "Chatbots IA déployés", ar: "شات بوت ذكاء اصطناعي منشور", desc_en: "Custom AI chatbots for e-commerce, healthcare, SaaS and hospitality. OpenAI, LangChain, Rasa.", desc_fr: "Chatbots IA pour e-commerce, santé, SaaS et hôtellerie. OpenAI, LangChain, Rasa.", desc_ar: "شات بوت ذكاء اصطناعي مخصص للتجارة الإلكترونية والرعاية الصحية والـSaaS والضيافة.", tag: "AI · LangChain · n8n" },
  { emoji: "🎵", color: "#F59E0B", val_en: "150", val_fr: "150", val_ar: "150", en: "Sign-ups in 30 days", fr: "Inscrits en 30 jours", ar: "مشترك في 30 يوماً", desc_en: "Online coaching program. TikTok In-Feed + Spark Ads. CPA maintained at $13.", desc_fr: "Programme coaching en ligne. TikTok In-Feed + Spark Ads. CPA maintenu à 13€.", desc_ar: "برنامج كوتشينج أونلاين. TikTok In-Feed + Spark Ads. CPA مستقر عند 120 درهم.", tag: "TikTok Ads · Spark" },
  { emoji: "⚙️", color: "#06B6D4", val_en: "ROI 300%", val_fr: "ROI 300%", val_ar: "ROI 300%", en: "AI Automation — Agency", fr: "Automation IA — Agence", ar: "أتمتة ذكاء اصطناعي — وكالة", desc_en: "Make + OpenAI automation. CRM, email, reporting. 40 hours/week saved for one client.", desc_fr: "Automation Make + OpenAI. CRM, email, reporting. 40h/semaine économisées.", desc_ar: "أتمتة Make + OpenAI. CRM، بريد إلكتروني، تقارير. توفير 40 ساعة/أسبوع لعميل.", tag: "Make · OpenAI · n8n" },
];

const WHY_DATA = [
  { en: "Results first, always", fr: "Les résultats avant tout", ar: "النتائج أولاً، دائماً", desc_en: "We define target ROAS, CPL, or traffic goals before launch. If the audit shows it's not viable, we tell you honestly.", desc_fr: "Nous définissons les objectifs ROAS, CPL ou trafic avant le lancement. Si l'audit montre que ce n'est pas viable, on vous le dit honnêtement.", desc_ar: "نحدد أهداف ROAS وCPL والزيارات قبل الإطلاق. إذا أظهر التدقيق عدم الجدوى، نخبرك بصراحة." },
  { en: "Full transparency", fr: "Transparence totale", ar: "شفافية كاملة", desc_en: "Real-time Looker Studio dashboard + weekly report every Monday. You see every dollar spent and every result generated.", desc_fr: "Dashboard Looker Studio en temps réel + rapport hebdomadaire chaque lundi. Vous voyez chaque euro dépensé et chaque résultat généré.", desc_ar: "لوحة Looker Studio الفورية + تقرير أسبوعي كل اثنين. ترى كل درهم ينفق وكل نتيجة تتحقق." },
  { en: "One partner, all skills", fr: "Un seul partenaire, toutes les compétences", ar: "شريك واحد، كل المهارات", desc_en: "Dev + Ads + SEO + AI + Automation under one roof. No coordination overhead, no agency gaps, no excuses.", desc_fr: "Dev + Pub + SEO + IA + Automation sous un même toit. Pas de coordination supplémentaire, pas de lacunes, pas d'excuses.", desc_ar: "تطوير + إعلانات + SEO + ذكاء اصطناعي + أتمتة تحت سقف واحد. لا تنسيق إضافي، لا فجوات، لا أعذار." },
  { en: "Always improving", fr: "Amélioration continue", ar: "تحسين مستمر", desc_en: "Weekly data-driven optimisations. A/B tests, audience adjustments, creative refreshes — documented and justified every time.", desc_fr: "Optimisations hebdomadaires basées sur les données. A/B tests, ajustements d'audiences, refresh créatifs — documentés et justifiés à chaque fois.", desc_ar: "تحسينات أسبوعية مبنية على البيانات. اختبارات A/B، تعديلات الجماهير، تحديث الإبداعات — موثقة ومبررة في كل مرة." },
];

const TESTIMONIALS_DATA = [
  { name: "Karim A.", role_en: "E-commerce Director · Fashion", role_fr: "Directeur e-commerce · Mode", role_ar: "مدير تجارة إلكترونية · أزياء", bg: "rgba(37,99,235,.2)", initials: "KA", text_en: "GoSite restructured our Google Ads account in less than 2 weeks. Our ROAS went from 1.8 to 4.5 in 2 months. Reactive, transparent and truly results-focused.", text_fr: "GoSite a restructuré notre compte Google Ads en moins de 2 semaines. Notre ROAS est passé de 1.8 à 4.5 en 2 mois. Réactif, transparent et vraiment orienté résultats.", text_ar: "أعاد GoSite هيكلة حساب Google Ads خلال أسبوعين. انتقل ROAS من 1.8 إلى 4.5 في شهرين. متجاوب وشفاف وموجّه للنتائج حقاً." },
  { name: "Marc B.", role_en: "SaaS Founder · Paris", role_fr: "Founder SaaS · Paris", role_ar: "مؤسس SaaS · باريس", bg: "rgba(16,185,129,.2)", initials: "MB", text_en: "We needed a developer who also understands marketing. GoSite delivered our WordPress site on time with rock-solid SEO. Traffic exploded from month 2.", text_fr: "On cherchait un dev qui comprend aussi le marketing. GoSite a livré notre site WordPress en temps record avec un SEO béton. Le trafic a explosé dès le 2e mois.", text_ar: "احتجنا لمطور يفهم التسويق أيضاً. سلّم GoSite موقعنا في الوقت المحدد مع SEO متين. انفجر الترافيك من الشهر الثاني." },
  { name: "Sophie R.", role_en: "Marketing Manager · Brussels", role_fr: "Resp. Marketing · Bruxelles", role_ar: "مديرة تسويق · بروكسل", bg: "rgba(232,98,42,.2)", initials: "SR", text_en: "Our Meta campaigns had been unprofitable for 6 months. GoSite identified the issues within 48h and rebuilt everything. CPL dropped from €120 to €38 in 3 weeks.", text_fr: "Nos campagnes Meta étaient déficitaires depuis 6 mois. GoSite a identifié les problèmes en 48h et tout reconfiguré. CPL passé de 120€ à 38€ en 3 semaines.", text_ar: "كانت حملات Meta غير مربحة لـ6 أشهر. حدّد GoSite المشاكل في 48 ساعة وأعاد هيكلة كل شيء. CPL انخفض من 120€ إلى 38€ في 3 أسابيع." },
  { name: "Amine H.", role_en: "CEO Marketing Agency", role_fr: "CEO Agence Marketing", role_ar: "CEO وكالة تسويق", bg: "rgba(124,58,237,.2)", initials: "AH", text_en: "GoSite set up a complete automation system for our agency. We save 30h a week. Done in 2 weeks. The AI chatbot they built handles 70% of our client inquiries automatically.", text_fr: "GoSite a mis en place un système d'automation complet. On économise 30h par semaine. Fait en 2 semaines. Le chatbot IA gère 70% des demandes clients automatiquement.", text_ar: "أنشأ GoSite نظام أتمتة كاملاً لوكالتنا. نوفر 30 ساعة أسبوعياً. تم في أسبوعين. الشات بوت يعالج 70% من استفسارات العملاء تلقائياً." },
  { name: "Nadia B.", role_en: "Coach · Online Training", role_fr: "Coach · Formation en ligne", role_ar: "كوتش · تدريب أونلاين", bg: "rgba(245,158,11,.2)", initials: "NB", text_en: "I had been running TikTok Ads myself for 2 months with zero results. GoSite rethought everything. In 30 days I had 150 people enrolled in my program. Best investment of the year.", text_fr: "J'avais lancé mes TikTok Ads moi-même sans résultat pendant 2 mois. GoSite a tout repensé. En 30 jours j'avais 150 inscrits. Meilleur investissement de l'année.", text_ar: "كنت أدير TikTok Ads بنفسي لشهرين دون نتيجة. أعاد GoSite التفكير في كل شيء. في 30 يوماً كان لدي 150 مشتركاً. أفضل استثمار في السنة." },
];

const STEPS_DATA = [
  { en: "Discovery", fr: "Découverte", ar: "الاكتشاف", desc_en: "Free audit, goals, competitors, budget", desc_fr: "Audit gratuit, objectifs, concurrents", desc_ar: "تدقيق مجاني، أهداف، منافسون" },
  { en: "Strategy", fr: "Stratégie", ar: "الاستراتيجية", desc_en: "Action plan, KPIs, budget, timeline", desc_fr: "Plan d'action, KPIs, budget, planning", desc_ar: "خطة عمل، KPIs، ميزانية، جدول زمني" },
  { en: "Execution", fr: "Exécution", ar: "التنفيذ", desc_en: "Build, launch, full tracking setup", desc_fr: "Build, lancement, tracking complet", desc_ar: "بناء، إطلاق، إعداد تتبع كامل" },
  { en: "Optimisation", fr: "Optimisation", ar: "التحسين", desc_en: "Weekly A/B testing and data iterations", desc_fr: "Tests A/B et itérations data hebdomadaires", desc_ar: "اختبارات A/B وتكرارات بيانات أسبوعية" },
  { en: "Reporting", fr: "Reporting", ar: "التقارير", desc_en: "Real-time dashboard + weekly reports", desc_fr: "Dashboard temps réel + rapports hebdo", desc_ar: "لوحة فورية + تقارير أسبوعية" },
];

const C = ({ className, color }: { className?: string; color: string }) => (
  <div className={className} style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
);

function ServiceIcon({ type, color }: { type: string; color: string }) {
  const svgProps = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2 } as const;
  switch (type) {
    case "web":
      return (
        <svg {...svgProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      );
    case "ads":
      return (
        <svg {...svgProps}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case "seo":
      return (
        <svg {...svgProps}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "ai":
      return (
        <svg {...svgProps}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "auto":
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
      );
    case "cro":
      return (
        <svg {...svgProps}>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case "analytics":
      return (
        <svg {...svgProps}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "full":
      return (
        <svg {...svgProps}>
          <rect x="16" y="16" width="6" height="6" rx="1" />
          <rect x="2" y="16" width="6" height="6" rx="1" />
          <rect x="9" y="2" width="6" height="6" rx="1" />
          <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
          <path d="M12 12V8" />
        </svg>
      );
    default:
      return null;
  }
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22,2 15,22 11,13 2,9" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 4L12 13L2 4" />
    </svg>
  );
}

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("en");
  const [success, setSuccess] = useState(false);
  const [modal, setModal] = useState<"privacy" | "terms" | null>(null);
  const revealRefs = useRef<IntersectionObserver | null>(null);
  const t = T[lang];

  const setLanguage = useCallback((l: Lang) => {
    setLang(l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
    try { localStorage.setItem("gs_lang", l); } catch {}
  }, []);

  useEffect(() => {
    try {
      const s = localStorage.getItem("gs_lang") as Lang | null;
      if (s && T[s]) setLanguage(s);
    } catch {}
  }, [setLanguage]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    revealRefs.current = io;
    document.querySelectorAll(".reveal,.reveal-l,.reveal-r").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const io = revealRefs.current;
    if (!io) return;
    document.querySelectorAll(".reveal,.reveal-l,.reveal-r").forEach((el) => {
      io.unobserve(el);
      io.observe(el);
    });
  }, [lang]);

  const handleSendForm = () => {
    const nameEl = document.getElementById("gs-name") as HTMLInputElement | null;
    const emailEl = document.getElementById("gs-email") as HTMLInputElement | null;
    const svcEl = document.getElementById("gs-service") as HTMLSelectElement | null;
    const budgetEl = document.getElementById("gs-budget") as HTMLSelectElement | null;
    const msgEl = document.getElementById("gs-message") as HTMLTextAreaElement | null;
    if (!nameEl || !emailEl || !msgEl) return;
    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const svc = svcEl?.value || "";
    const budget = budgetEl?.value || "";
    const msg = msgEl.value.trim();
    if (!name || !email || !msg) {
      alert("Please fill name, email and message.");
      return;
    }
    const body = `Name: ${name}\nEmail: ${email}\nService: ${svc || "Not specified"}\nBudget: ${budget || "Not specified"}\n\nMessage:\n${msg}`;
    window.location.href = `mailto:contact@gosite.digital?subject=${encodeURIComponent("GoSite Inquiry: " + (svc || "New Project"))}&body=${encodeURIComponent(body)}`;
    setTimeout(() => setSuccess(true), 1200);
  };

  const getLocalized = (item: Record<string, unknown>, key: string) => String((item as Record<string, string>)[key + "_" + lang] || item[key + "_en"]);

  return (
    <div style={{ "--muted": "#64748B", "--muted2": "#94A3B8", "--gs-blue2": "#2563EB", "--gs-blue3": "#3B82F6", "--gs-cyan": "#06B6D4", "--orange": "#E8622A", "--green": "#10B981" } as React.CSSProperties}>
      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 44px", background: "rgba(10,22,40,.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <a href="#home" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 25, fontWeight: 800, color: "white", letterSpacing: -1 }}>Go</span>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 25, fontWeight: 800, color: "var(--gs-blue3)", letterSpacing: -1 }}>Site</span>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 25, fontWeight: 800, color: "var(--orange)" }}>.</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--muted2)", fontWeight: 500, letterSpacing: 0.5, marginLeft: 2, marginTop: 2 }}>DIGITAL AGENCY</div>
        </a>
        <div style={{ display: "flex", gap: 2 }}>
          {t.navLinks.map((label, i) => (
            <a key={label} href={`#${["services", "results", "why", "process", "testimonials", "contact"][i]}`} style={{ fontSize: 14, fontWeight: 500, color: "var(--muted2)", textDecoration: "none", padding: "7px 12px", borderRadius: 7, transition: "all .2s" }}>
              {label}
            </a>
          ))}
          <a href="/portfolio" style={{ color: "#E8622A", fontWeight: 700, fontSize: 14, textDecoration: "none", padding: "7px 12px", borderRadius: 7 }}>
            Youssef&apos;s Portfolio
          </a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--green)", fontWeight: 600 }}>
            <div className="pulse-dot" style={{ width: 7, height: 7, background: "var(--green)", borderRadius: "50%", animation: "pulsedot 2s infinite", flexShrink: 0 }} />
            {t.available}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 9, padding: 3 }}>
            {(["en", "fr", "ar"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLanguage(l)} style={{ padding: "5px 10px", borderRadius: 6, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .2s", background: lang === l ? "var(--gs-blue2)" : "transparent", color: lang === l ? "white" : "var(--muted2)", boxShadow: lang === l ? "0 2px 8px rgba(37,99,235,.4)" : "none" }}>
                {l === "en" ? "EN" : l === "fr" ? "FR" : "ع"}
              </button>
            ))}
          </div>
          <a href="#contact" style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--gs-blue2)", color: "white", padding: "8px 18px", borderRadius: 8, fontSize: 14.5, fontWeight: 700, textDecoration: "none", transition: "all .22s" }}>
            <SendIcon /> {t.getQuote}
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" style={{ minHeight: "100vh", background: "#0A1628", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", padding: "78px 44px 60px" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none", width: 700, height: 700, background: "rgba(26,86,219,.12)", top: -200, left: -200 }} className="orb1" />
        <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none", width: 500, height: 500, background: "rgba(6,182,212,.08)", top: 100, right: -100 }} className="orb2" />
        <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none", width: 400, height: 400, background: "rgba(124,58,237,.07)", bottom: -80, left: "40%" }} className="orb3" />
        <div style={{ maxWidth: 1380, margin: "0 auto", width: "100%", position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1fr 480px", gap: 72, alignItems: "center" }}>
          <div>
            <div className="reveal" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(26,86,219,.15)", border: "1px solid rgba(37,99,235,.35)", borderRadius: 100, padding: "7px 18px", marginBottom: 26, fontSize: 13, fontWeight: 700, color: "var(--gs-blue3)", letterSpacing: 1, textTransform: "uppercase" }}>
              <div className="pulse-dot" style={{ width: 7, height: 7, background: "var(--green)", borderRadius: "50%", animation: "pulsedot 2s infinite" }} />
              {t.badge}
            </div>
            <h1 className="reveal" style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(42px,5vw,72px)", fontWeight: 800, color: "white", letterSpacing: -2, lineHeight: 1.05, marginBottom: 22 }}>
              {t.heroH1}
            </h1>
            <p className="reveal" style={{ fontSize: 18, color: "var(--muted2)", lineHeight: 1.8, maxWidth: 500, marginBottom: 34 }}>
              {t.heroP}
            </p>
            <div className="reveal" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 36 }}>
              <a href="#contact" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--gs-blue2)", color: "white", padding: "14px 28px", borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: "none", transition: "all .25s" }}>
                <SendIcon /> {t.getFreeQuote}
              </a>
              <a href="/portfolio" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.07)", color: "white", padding: "14px 22px", borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", fontSize: 16, fontWeight: 600, textDecoration: "none", transition: "all .25s" }}>
                <EyeIcon /> {t.viewPortfolio}
              </a>
              <a href="https://wa.me/212751134318" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.07)", color: "white", padding: "14px 22px", borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", fontSize: 16, fontWeight: 600, textDecoration: "none", transition: "all .25s" }}>
                <WhatsAppIcon /> WhatsApp
              </a>
            </div>
            <div className="reveal" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[t.freeAudit, t.reply24h, t.noCommit, t.remote100].map((item) => (
                <span key={item} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "rgba(255,255,255,.5)", fontWeight: 500 }}>
                  <span style={{ color: "var(--green)", fontWeight: 800, fontSize: 12.5 }}>✓</span> {item}
                </span>
              ))}
            </div>
          </div>
          <div className="hero-card-wrap">
            <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 22, padding: 32, backdropFilter: "blur(10px)" }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: "var(--muted2)", marginBottom: 20, textTransform: "uppercase", letterSpacing: 1 }}>{t.perfTitle}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
                {[
                  { val: "×4.2", lbl_en: "Avg ROAS", lbl_fr: "ROAS moy.", lbl_ar: "ROAS وسطي", color: "#3B82F6" },
                  { val: "+250%", lbl_en: "SEO Traffic", lbl_fr: "Trafic SEO", lbl_ar: "ترافيك SEO", color: "#10B981" },
                  { val: "−40%", lbl_en: "Avg CPL", lbl_fr: "CPL moy.", lbl_ar: "CPL وسطي", color: "#E8622A" },
                  { val: "20+", lbl_en: "AI Chatbots", lbl_fr: "AI Chatbots", lbl_ar: "AI Chatbots", color: "#7C3AED" },
                ].map((s) => (
                  <div key={s.val} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 13, padding: 18, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.val}</div>
                    <div style={{ fontSize: 12.5, color: "var(--muted2)", fontWeight: 500 }}>{lang === "fr" ? s.lbl_fr : lang === "ar" ? s.lbl_ar : s.lbl_en}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { color: "#3B82F6", name: "Web Development", tag: "WP · React · SaaS", tagBg: "rgba(37,99,235,.2)", tagColor: "#60a5fa" },
                  { color: "#E8622A", name: "Paid Advertising", tag: "Google · Meta · TikTok", tagBg: "rgba(232,98,42,.2)", tagColor: "#ffa07a" },
                  { color: "#10B981", name: "SEO & Content", tag: "Technical · On-page", tagBg: "rgba(16,185,129,.2)", tagColor: "#6ee7b7" },
                  { color: "#7C3AED", name: "AI & Automation", tag: "Chatbot · Agent · n8n", tagBg: "rgba(124,58,237,.2)", tagColor: "#c4b5fd" },
                ].map((s) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: "10px 14px", transition: "all .2s" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    <div style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,.8)" }}>{s.name}</div>
                    <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: s.tagBg, color: s.tagColor }}>{s.tag}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding: "88px 44px", background: "#F8FAFC", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(26,86,219,.05) 1px,transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1380, margin: "0 auto", position: "relative", zIndex: 1, textAlign: "center" }}>
          <div className="reveal" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "var(--gs-blue2)", textTransform: "uppercase", marginBottom: 12 }}>
            <div style={{ width: 26, height: 2, background: "var(--gs-blue2)", borderRadius: 2 }} />
            {lang === "en" ? "What we do" : lang === "fr" ? "Ce que nous faisons" : "ما نقدمه"}
          </div>
          <h2 className="reveal" style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, color: "#0F172A", letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 14 }}>
            {t.servicesTitle}
          </h2>
          <p className="reveal" style={{ fontSize: 17, color: "#475569", maxWidth: 560, lineHeight: 1.78, margin: "0 auto 52px" }}>
            {t.servicesSub}
          </p>
        </div>
        <div style={{ maxWidth: 1380, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
            {SERVICES_DATA.map((s, i) => (
              <div key={i} className="reveal" data-d={String((i % 4) + 1)} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 18, padding: 26, transition: "all .3s", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.color }} />
                <div style={{ width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, background: s.color + "1a" }}>
                  <ServiceIcon type={s.icon} color={s.color} />
                </div>
                <h3 style={{ fontSize: 17.5, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>{s[lang === "ar" ? "ar" : lang]}</h3>
                <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.7, marginBottom: 14 }}>{getLocalized(s, "desc")}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                  {s.chips.map((ch) => (
                    <span key={ch} style={{ fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }}>{ch}</span>
                  ))}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, padding: "7px 12px", borderRadius: 8, color: s.kpiColor, background: s.kpiColor + "12" }}>
                  {getLocalized(s, "kpi")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section id="results" style={{ background: "#0A1628", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -150, left: -150, width: 600, height: 600, background: "radial-gradient(ellipse,rgba(26,86,219,.12) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -100, right: -100, width: 500, height: 500, background: "radial-gradient(ellipse,rgba(6,182,212,.08) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ padding: "88px 44px", maxWidth: 1380, margin: "0 auto", position: "relative", zIndex: 1, textAlign: "center" }}>
          <div className="reveal" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "var(--gs-blue3)", textTransform: "uppercase", marginBottom: 12 }}>
            <div style={{ width: 26, height: 2, background: "var(--gs-blue3)", borderRadius: 2 }} />
            {lang === "en" ? "Proven results" : lang === "fr" ? "Résultats prouvés" : "نتائج مثبتة"}
          </div>
          <h2 className="reveal" style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, color: "white", letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 14 }}>
            {t.resultsTitle}
          </h2>
          <p className="reveal" style={{ fontSize: 17, color: "var(--muted2)", maxWidth: 560, lineHeight: 1.78, margin: "0 auto 52px" }}>
            {t.resultsSub}
          </p>
        </div>
        <div style={{ maxWidth: 1380, margin: "0 auto", padding: "0 44px 88px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
            {RESULTS_DATA.map((r, i) => (
              <div key={i} className="reveal" style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 16, padding: 26, transition: "all .25s", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: r.color }} />
                <div style={{ fontSize: 32, marginBottom: 12 }}>{r.emoji}</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 38, fontWeight: 800, color: r.color, lineHeight: 1, marginBottom: 6 }}>{getLocalized(r, "val")}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "white", marginBottom: 6 }}>{r[lang === "ar" ? "ar" : lang]}</div>
                <div style={{ fontSize: 14.5, color: "var(--muted2)", lineHeight: 1.65 }}>{getLocalized(r, "desc")}</div>
                <div style={{ display: "inline-block", fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 5, background: "rgba(255,255,255,.07)", color: "var(--muted2)", marginTop: 12 }}>{r.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section id="why" style={{ background: "white", position: "relative", overflow: "hidden" }}>
        <div style={{ padding: "88px 44px", maxWidth: 1380, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 52, alignItems: "center" }}>
            <div>
              <div className="reveal" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "var(--gs-blue2)", textTransform: "uppercase", marginBottom: 12 }}>
                <div style={{ width: 26, height: 2, background: "var(--gs-blue2)", borderRadius: 2 }} />
                {lang === "en" ? "Why GoSite" : lang === "fr" ? "Pourquoi GoSite" : "لماذا GoSite"}
              </div>
              <h2 className="reveal" style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, color: "#0F172A", letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 14, whiteSpace: "pre-line" }}>
                {t.whyTitle}
              </h2>
              <p className="reveal" style={{ fontSize: 17, color: "#475569", maxWidth: 560, lineHeight: 1.78, marginBottom: 32 }}>
                {t.whySub}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {WHY_DATA.map((w, i) => (
                  <div key={i} className="reveal" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--gs-blue2)", color: "white", fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{w[lang === "ar" ? "ar" : lang]}</div>
                      <div style={{ fontSize: 15, color: "#475569", lineHeight: 1.7 }}>{getLocalized(w, "desc")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal" style={{ background: "#0A1628", borderRadius: 20, padding: 32, border: "1px solid rgba(255,255,255,.1)" }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 700, color: "var(--muted2)", marginBottom: 18, textTransform: "uppercase", letterSpacing: 1 }}>Performance Dashboard</div>
              {[
                { label: "Google Ads ROAS", val: "×5.1", pct: 85, bg: "linear-gradient(90deg,#2563EB,#3B82F6)", color: "#3B82F6" },
                { label: "Meta CPL Reduction", val: "−62%", pct: 62, bg: "linear-gradient(90deg,#E8622A,#ff9166)", color: "#E8622A" },
                { label: "SEO Traffic Growth", val: "+250%", pct: 75, bg: "linear-gradient(90deg,#10B981,#6ee7b7)", color: "#10B981" },
                { label: "Conversion Rate Lift", val: "×2.3", pct: 56, bg: "linear-gradient(90deg,#7C3AED,#c4b5fd)", color: "#7C3AED" },
                { label: "AI Automation ROI", val: "300%", pct: 90, bg: "linear-gradient(90deg,#06B6D4,#67e8f9)", color: "#06B6D4" },
              ].map((b) => (
                <div key={b.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,.05)", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, color: "rgba(255,255,255,.7)", fontWeight: 500 }}>{b.label}</div>
                    <div style={{ height: 5, background: "rgba(255,255,255,.08)", borderRadius: 3, overflow: "hidden", marginTop: 5 }}>
                      <div style={{ height: "100%", borderRadius: 3, background: b.bg, width: `${b.pct}%` }} />
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: b.color, marginLeft: 16 }}>{b.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" style={{ padding: "88px 44px", background: "#F8FAFC", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(26,86,219,.05) 1px,transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1380, margin: "0 auto", position: "relative", zIndex: 1, textAlign: "center" }}>
          <div className="reveal" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "var(--gs-blue2)", textTransform: "uppercase", marginBottom: 12 }}>
            <div style={{ width: 26, height: 2, background: "var(--gs-blue2)", borderRadius: 2 }} />
            {lang === "en" ? "How we work" : lang === "fr" ? "Comment nous travaillons" : "كيف نعمل"}
          </div>
          <h2 className="reveal" style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, color: "#0F172A", letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 14, whiteSpace: "pre-line" }}>
            {t.processTitle}
          </h2>
          <p className="reveal" style={{ fontSize: 17, color: "#475569", maxWidth: 560, lineHeight: 1.78, margin: "0 auto 52px" }}>
            {t.processSub}
          </p>
        </div>
        <div style={{ maxWidth: 1380, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 0, position: "relative" }}>
            <div style={{ position: "absolute", top: 30, left: "10%", right: "10%", height: 2, background: "linear-gradient(90deg,var(--gs-blue2),var(--gs-cyan),var(--gs-blue2))", zIndex: 0 }} />
            {STEPS_DATA.map((s, i) => (
              <div key={i} className="reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 1, padding: "0 12px" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#0A1628", border: "3px solid var(--gs-blue2)", color: "var(--gs-blue3)", fontFamily: "'Space Grotesk',sans-serif", fontSize: 23, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{i + 1}</div>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>{s[lang === "ar" ? "ar" : lang]}</div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{getLocalized(s, "desc")}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" style={{ background: "linear-gradient(135deg,#0A1628,#0f1f38)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,.02) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
        <div style={{ padding: "88px 44px", maxWidth: 1380, margin: "0 auto", position: "relative", zIndex: 1, textAlign: "center" }}>
          <div className="reveal" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "var(--gs-blue3)", textTransform: "uppercase", marginBottom: 12 }}>
            <div style={{ width: 26, height: 2, background: "var(--gs-blue3)", borderRadius: 2 }} />
            {lang === "en" ? "Client reviews" : lang === "fr" ? "Avis clients" : "آراء العملاء"}
          </div>
          <h2 className="reveal" style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, color: "white", letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 36 }}>
            {t.clientsTitle}
          </h2>
        </div>
        <div style={{ maxWidth: 1380, margin: "0 auto", padding: "0 44px 88px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 18 }}>
            {TESTIMONIALS_DATA.slice(0, 3).map((tc, i) => (
              <div key={i} className="reveal" style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 16, padding: 26, transition: "all .25s" }}>
                <div style={{ color: "#F59E0B", fontSize: 15, letterSpacing: 3, marginBottom: 12 }}>★★★★★</div>
                <div style={{ fontSize: 15.5, color: "rgba(255,255,255,.75)", lineHeight: 1.78, marginBottom: 20, fontStyle: "italic" }}>{getLocalized(tc, "text")}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 11, borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "white", fontFamily: "'Space Grotesk',sans-serif", flexShrink: 0, background: tc.bg }}>{tc.initials}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{tc.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--muted2)", marginTop: 2 }}>{lang === "fr" ? tc.role_fr : lang === "ar" ? tc.role_ar : tc.role_en}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {TESTIMONIALS_DATA.slice(3).map((tc, i) => (
              <div key={i} className="reveal" style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 16, padding: 26, transition: "all .25s" }}>
                <div style={{ color: "#F59E0B", fontSize: 15, letterSpacing: 3, marginBottom: 12 }}>★★★★★</div>
                <div style={{ fontSize: 15.5, color: "rgba(255,255,255,.75)", lineHeight: 1.78, marginBottom: 20, fontStyle: "italic" }}>{getLocalized(tc, "text")}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 11, borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "white", fontFamily: "'Space Grotesk',sans-serif", flexShrink: 0, background: tc.bg }}>{tc.initials}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{tc.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--muted2)", marginTop: 2 }}>{lang === "fr" ? tc.role_fr : lang === "ar" ? tc.role_ar : tc.role_en}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div style={{ background: "linear-gradient(135deg,var(--gs-blue2) 0%,#1e40af 50%,#7C3AED 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,.06) 1px,transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none" }} />
        <div style={{ textAlign: "center", padding: "80px 44px", position: "relative", zIndex: 1 }}>
          <h2 className="reveal" style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(32px,4.2vw,52px)", fontWeight: 800, color: "white", letterSpacing: -1.5, marginBottom: 18 }}>
            {t.ctaTitle}
          </h2>
          <p className="reveal" style={{ fontSize: 18, color: "rgba(255,255,255,.8)", lineHeight: 1.75, maxWidth: 560, margin: "0 auto 36px" }}>
            {t.ctaP}
          </p>
          <div className="reveal" style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <a href="#contact" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", color: "var(--gs-blue2)", padding: "15px 32px", borderRadius: 10, fontSize: 16.5, fontWeight: 800, textDecoration: "none", transition: "all .25s" }}>
              <SendIcon /> {lang === "en" ? "Get Free Audit" : lang === "fr" ? "Audit Gratuit" : "احصل على تدقيق مجاني"}
            </a>
            <a href="/portfolio" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: "white", padding: "15px 28px", borderRadius: 10, border: "2px solid rgba(255,255,255,.5)", fontSize: 16.5, fontWeight: 700, textDecoration: "none", transition: "all .25s" }}>
              <EyeIcon /> {t.viewPortfolio}
            </a>
          </div>
          <div className="reveal" style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
            {[t.freeAudit, t.reply24h, t.noCommit, lang === "en" ? "International" : lang === "fr" ? "International" : "دولي"].map((item) => (
              <span key={item} style={{ fontSize: 14, color: "rgba(255,255,255,.65)", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: "rgba(255,255,255,.9)", fontWeight: 800 }}>✓</span> {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CONTACT */}
      <section id="contact" style={{ padding: "88px 44px", background: "#F8FAFC", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(26,86,219,.05) 1px,transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1380, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 52, alignItems: "start" }}>
            <div style={{ background: "#0A1628", borderRadius: 18, padding: 32, border: "1px solid rgba(255,255,255,.1)" }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 25, fontWeight: 800, color: "white", marginBottom: 8, letterSpacing: -0.5, whiteSpace: "pre-line" }}>{t.contactTitle}</div>
              <div style={{ fontSize: 15.5, color: "var(--muted2)", marginBottom: 24, lineHeight: 1.7 }}>{t.contactSub}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <a href="https://wa.me/212751134318" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 11, padding: "14px 16px", textDecoration: "none", transition: "all .2s" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(37,99,235,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>💬</div>
                  <div><div style={{ fontSize: 12, color: "var(--muted2)", fontWeight: 600, letterSpacing: 0.4, marginBottom: 2 }}>WhatsApp</div><div style={{ fontSize: 15.5, fontWeight: 700, color: "white" }}>+212 751 134 318</div></div>
                </a>
                <a href="mailto:contact@gosite.digital" style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 11, padding: "14px 16px", textDecoration: "none", transition: "all .2s" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(37,99,235,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>✉️</div>
                  <div><div style={{ fontSize: 12, color: "var(--muted2)", fontWeight: 600, letterSpacing: 0.4, marginBottom: 2 }}>Email</div><div style={{ fontSize: 15.5, fontWeight: 700, color: "white" }}>contact@gosite.digital</div></div>
                </a>
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 11, padding: "14px 16px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(37,99,235,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🌍</div>
                  <div><div style={{ fontSize: 12, color: "var(--muted2)", fontWeight: 600, letterSpacing: 0.4, marginBottom: 2 }}>{lang === "en" ? "Location" : lang === "fr" ? "Localisation" : "الموقع"}</div><div style={{ fontSize: 15.5, fontWeight: 700, color: "white" }}>{t.locationLabel}</div></div>
                </div>
              </div>
              <div style={{ marginTop: 24, padding: 18, background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.25)", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <div className="pulse-dot" style={{ width: 7, height: 7, background: "var(--green)", borderRadius: "50%", animation: "pulsedot 2s infinite" }} />
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: "white" }}>{t.availableProjects}</div>
                  <div style={{ fontSize: 13, color: "var(--muted2)", marginTop: 2 }}>{t.locationLabel}</div>
                </div>
              </div>
            </div>
            <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 18, padding: 32 }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 23, fontWeight: 800, color: "#0F172A", marginBottom: 22, letterSpacing: -0.5 }}>{t.sendMessage}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#64748B", letterSpacing: 0.5, textTransform: "uppercase" }}>{t.fullName}</label>
                  <input id="gs-name" type="text" placeholder="Your name" required suppressHydrationWarning style={{ padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontFamily: "inherit", fontSize: 15.5, color: "#0F172A", background: "#F8FAFC", transition: "all .2s", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#64748B", letterSpacing: 0.5, textTransform: "uppercase" }}>Email</label>
                  <input id="gs-email" type="email" placeholder="your@email.com" required suppressHydrationWarning style={{ padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontFamily: "inherit", fontSize: 15.5, color: "#0F172A", background: "#F8FAFC", transition: "all .2s", outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#64748B", letterSpacing: 0.5, textTransform: "uppercase" }}>{t.serviceName}</label>
                  <select id="gs-service" suppressHydrationWarning style={{ padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontFamily: "inherit", fontSize: 15.5, color: "#0F172A", background: "#F8FAFC", transition: "all .2s", outline: "none" }}>
                    <option value="">Select...</option>
                    <option>Web Development</option>
                    <option>Google Ads</option>
                    <option>Meta / TikTok Ads</option>
                    <option>SEO</option>
                    <option>AI Chatbot / Agent</option>
                    <option>Automation</option>
                    <option>Full Package (All Services)</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#64748B", letterSpacing: 0.5, textTransform: "uppercase" }}>{t.budgetLabel}</label>
                  <select id="gs-budget" suppressHydrationWarning style={{ padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontFamily: "inherit", fontSize: 15.5, color: "#0F172A", background: "#F8FAFC", transition: "all .2s", outline: "none" }}>
                    <option value="">Select...</option>
                    {BUDGETS[lang].map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#64748B", letterSpacing: 0.5, textTransform: "uppercase" }}>{t.tellProject}</label>
                <textarea id="gs-message" placeholder="Describe your goals, current situation and what you need..." suppressHydrationWarning style={{ padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontFamily: "inherit", fontSize: 15.5, color: "#0F172A", background: "#F8FAFC", transition: "all .2s", outline: "none", resize: "none", minHeight: 110 }} />
              </div>
              <button onClick={handleSendForm} style={{ width: "100%", padding: 13, borderRadius: 9, background: "var(--gs-blue2)", color: "white", fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all .25s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 }}>
                <SendIcon /> {t.sendBtn}
              </button>
              {success && (
                <div style={{ background: "rgba(16,185,129,.12)", border: "1px solid rgba(16,185,129,.3)", borderRadius: 9, padding: 16, textAlign: "center", fontSize: 16, fontWeight: 600, color: "var(--green)", marginTop: 12 }}>
                  ✅ {t.sentMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#040d18", padding: "48px 44px 32px", borderTop: "1px solid rgba(255,255,255,.05)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 0, marginBottom: 14 }}>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 25, fontWeight: 800, color: "white", letterSpacing: -1 }}>Go</span>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 25, fontWeight: 800, color: "var(--gs-blue3)", letterSpacing: -1 }}>Site</span>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 25, fontWeight: 800, color: "var(--orange)" }}>.</span>
              </div>
              <div style={{ fontSize: 15, color: "#64748B", lineHeight: 1.7, marginBottom: 16 }}>
                {lang === "en" ? "Performance-driven digital agency. Web development, paid advertising, SEO, AI chatbots and automation for ambitious businesses worldwide." : lang === "fr" ? "Agence digitale orientée performance. Développement web, publicité payante, SEO, chatbots IA et automation pour les entreprises ambitieuses du monde entier." : "وكالة رقمية موجّهة للأداء. تطوير ويب، إعلانات مدفوعة، SEO، شات بوت ذكاء اصطناعي وأتمتة للأعمال الطموحة حول العالم."}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href="https://wa.me/212751134318" target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, textDecoration: "none", color: "rgba(255,255,255,.6)" }}><WhatsAppIcon /></a>
                <a href="mailto:contact@gosite.digital" style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, textDecoration: "none", color: "rgba(255,255,255,.6)" }}><EmailIcon /></a>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--muted2)", marginBottom: 14 }}>{lang === "en" ? "Services" : lang === "fr" ? "Services" : "الخدمات"}</h4>
              {["Web Development", "Paid Advertising", "SEO", "AI Chatbots", "Automation", "CRO & Funnels"].map((l) => (
                <a key={l} href="#services" style={{ display: "block", fontSize: 14.5, color: "#64748B", textDecoration: "none", marginBottom: 8, transition: "color .2s" }}>{l}</a>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--muted2)", marginBottom: 14 }}>{lang === "en" ? "Company" : lang === "fr" ? "Société" : "الشركة"}</h4>
              {[
                { label: lang === "en" ? "Why GoSite" : lang === "fr" ? "Pourquoi GoSite" : "لماذا GoSite", href: "#why" },
                { label: lang === "en" ? "Results" : lang === "fr" ? "Résultats" : "النتائج", href: "#results" },
                { label: lang === "en" ? "Process" : lang === "fr" ? "Méthode" : "المنهجية", href: "#process" },
                { label: lang === "en" ? "Clients" : lang === "fr" ? "Clients" : "العملاء", href: "#testimonials" },
                { label: lang === "en" ? "Youssef's Portfolio" : lang === "fr" ? "Portfolio Youssef" : "ملف يوسف", href: "/portfolio", color: "#3B82F6" },
              ].map((l) => (
                <a key={l.label} href={l.href} style={{ display: "block", fontSize: 14.5, color: l.color || "#64748B", textDecoration: "none", marginBottom: 8, transition: "color .2s" }}>{l.label}</a>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--muted2)", marginBottom: 14 }}>Contact</h4>
              <a href="https://wa.me/212751134318" target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 14.5, color: "#64748B", textDecoration: "none", marginBottom: 8 }}>WhatsApp: +212 751 134 318</a>
              <a href="mailto:contact@gosite.digital" style={{ display: "block", fontSize: 14.5, color: "#64748B", textDecoration: "none", marginBottom: 8 }}>contact@gosite.digital</a>
              <a href="mailto:sahabyoussef@gmail.com" style={{ display: "block", fontSize: 14.5, color: "#64748B", textDecoration: "none", marginBottom: 8 }}>sahabyoussef@gmail.com</a>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 13, color: "#64748B" }}>© 2026 GoSite Digital Agency · {lang === "en" ? "All rights reserved · International" : lang === "fr" ? "Tous droits réservés · International" : "جميع الحقوق محفوظة · دولي"}</div>
            <div style={{ display: "flex", gap: 18 }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setModal("privacy"); }} style={{ fontSize: 13, color: "#64748B", textDecoration: "none", transition: "color .2s", cursor: "pointer" }}>Privacy</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setModal("terms"); }} style={{ fontSize: 13, color: "#64748B", textDecoration: "none", transition: "color .2s", cursor: "pointer" }}>Terms</a>
              <a href="/portfolio" style={{ fontSize: 13, color: "#3B82F6", textDecoration: "none" }}>{lang === "en" ? "Portfolio" : lang === "fr" ? "Portfolio" : "المشاريع"}</a>
            </div>
          </div>
      </footer>

      {/* PRIVACY / TERMS MODAL */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 18, maxWidth: 720, width: "100%", maxHeight: "85vh", overflow: "auto", position: "relative", boxShadow: "0 25px 60px rgba(0,0,0,.3)" }}>
            <button onClick={() => setModal(null)} style={{ position: "absolute", top: 18, right: 18, width: 36, height: 36, borderRadius: "50%", background: "#F1F5F9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#64748B", zIndex: 10, transition: "all .2s" }}>
              ✕
            </button>
            <div style={{ padding: "36px 40px 32px" }}>
              {modal === "privacy" ? (
                <>
                  <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Privacy Policy</h2>
                  <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 24 }}>Last updated: January 2026</div>
                  <div style={{ fontSize: 15.5, color: "#334155", lineHeight: 1.8 }}>
                    <p style={{ marginBottom: 16 }}>GoSite Digital Agency (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the website gosite.digital. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>1. Information We Collect</h3>
                    <p style={{ marginBottom: 12 }}>We may collect information you provide directly, including your name, email address, phone number, business details, and project requirements when you fill out our contact form or communicate with us via WhatsApp or email.</p>
                    <p style={{ marginBottom: 12 }}>We also collect certain data automatically when you visit our website, such as your IP address, browser type, pages visited, time spent, and referring URLs, through cookies and analytics tools (Google Analytics, GTM).</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>2. How We Use Your Information</h3>
                    <p style={{ marginBottom: 8 }}>We use the collected information to:</p>
                    <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
                      <li style={{ marginBottom: 4 }}>Respond to your inquiries and provide project proposals</li>
                      <li style={{ marginBottom: 4 }}>Deliver and manage our digital services (web development, advertising, SEO, AI, automation)</li>
                      <li style={{ marginBottom: 4 }}>Send project updates, reports, and invoices</li>
                      <li style={{ marginBottom: 4 }}>Improve our website and user experience</li>
                      <li style={{ marginBottom: 4 }}>Comply with legal obligations</li>
                    </ul>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>3. Data Sharing</h3>
                    <p style={{ marginBottom: 12 }}>We do not sell your personal data. We may share your information with trusted third-party service providers (hosting, analytics, payment processors) strictly as necessary to deliver our services. All third parties are contractually obligated to protect your data.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>4. Data Retention</h3>
                    <p style={{ marginBottom: 12 }}>We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, or as required by applicable law. Project-related data is retained for the duration of the client relationship and up to 24 months after termination.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>5. Your Rights</h3>
                    <p style={{ marginBottom: 12 }}>You have the right to access, correct, delete, or restrict the processing of your personal data. To exercise these rights, contact us at contact@gosite.digital. We will respond within 30 days.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>6. Cookies</h3>
                    <p style={{ marginBottom: 12 }}>Our website uses essential cookies for functionality and analytics cookies (Google Analytics) to understand how visitors interact with our site. You can control cookie preferences through your browser settings.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>7. Security</h3>
                    <p style={{ marginBottom: 12 }}>We implement industry-standard security measures including SSL encryption, secure hosting, and access controls. However, no method of transmission over the Internet is 100% secure.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>8. Changes to This Policy</h3>
                    <p style={{ marginBottom: 12 }}>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>9. Contact Us</h3>
                    <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:contact@gosite.digital" style={{ color: "#2563EB", fontWeight: 600 }}>contact@gosite.digital</a> or via WhatsApp at <a href="https://wa.me/212751134318" style={{ color: "#2563EB", fontWeight: 600 }}>+212 751 134 318</a>.</p>
                  </div>
                </>
              ) : (
                <>
                  <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Terms of Service</h2>
                  <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 24 }}>Last updated: January 2026</div>
                  <div style={{ fontSize: 15.5, color: "#334155", lineHeight: 1.8 }}>
                    <p style={{ marginBottom: 16 }}>These Terms of Service (&quot;Terms&quot;) govern your use of the GoSite Digital Agency website and services. By engaging our services, you agree to be bound by these Terms.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>1. Services</h3>
                    <p style={{ marginBottom: 12 }}>GoSite Digital Agency provides digital services including web development, paid advertising management (Google Ads, Meta Ads, TikTok Ads), SEO, AI chatbot development, and marketing automation. Scope, deliverables, and pricing are defined in individual project proposals or service agreements.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>2. Project Proposals &amp; Agreements</h3>
                    <p style={{ marginBottom: 12 }}>Each project begins with a detailed proposal outlining scope, timeline, deliverables, and pricing. Work commences only after the proposal is accepted in writing (email, WhatsApp message, or signed document). Additional work outside the agreed scope may incur extra charges and will be communicated before proceeding.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>3. Payment Terms</h3>
                    <p style={{ marginBottom: 8 }}>Unless otherwise agreed in the project proposal:</p>
                    <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
                      <li style={{ marginBottom: 4 }}>50% upfront before work begins</li>
                      <li style={{ marginBottom: 4 }}>50% upon delivery and acceptance of the project</li>
                      <li style={{ marginBottom: 4 }}>Monthly retainer services are billed at the beginning of each month</li>
                      <li style={{ marginBottom: 4 }}>Late payments may incur a 2% monthly fee</li>
                    </ul>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>4. Intellectual Property</h3>
                    <p style={{ marginBottom: 12 }}>Upon full payment, the client receives full ownership of all deliverables (website, designs, content, custom code). GoSite retains the right to display work in its portfolio unless otherwise agreed. Third-party tools, platforms, and licenses remain subject to their respective terms.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>5. Confidentiality</h3>
                    <p style={{ marginBottom: 12 }}>Both parties agree to keep confidential all proprietary information shared during the course of the project, including business strategies, client lists, financial data, and technical details.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>6. Limitation of Liability</h3>
                    <p style={{ marginBottom: 12 }}>GoSite shall not be liable for any indirect, incidental, or consequential damages. Our total liability shall not exceed the total amount paid for the specific service giving rise to the claim. We do not guarantee specific results (revenue, traffic, rankings) as outcomes depend on many factors beyond our control.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>7. Termination</h3>
                    <p style={{ marginBottom: 12 }}>Either party may terminate the agreement with 14 days&apos; written notice. In case of termination, the client is responsible for payment of all work completed up to that date. Retainer services can be cancelled at the end of any billing month with 7 days&apos; notice.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>8. Warranties &amp; Support</h3>
                    <p style={{ marginBottom: 12 }}>We provide a 30-day warranty on delivered projects for bug fixes related to our work. Ongoing maintenance, hosting, and support are available as separate service agreements. Third-party software and platforms are subject to their own warranties.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>9. Governing Law</h3>
                    <p style={{ marginBottom: 12 }}>These Terms are governed by the laws of Morocco. Any disputes shall be resolved through good-faith negotiation first, then through the competent courts of Casablanca, Morocco.</p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8, marginTop: 20 }}>10. Contact</h3>
                    <p>For questions about these Terms, contact us at <a href="mailto:contact@gosite.digital" style={{ color: "#2563EB", fontWeight: 600 }}>contact@gosite.digital</a> or via WhatsApp at <a href="https://wa.me/212751134318" style={{ color: "#2563EB", fontWeight: 600 }}>+212 751 134 318</a>.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
