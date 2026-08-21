import type { ScrapedBusiness } from "./scraper";

export type PricingTier = {
  id: string;
  name: string;
  price: number; // in cents
  features: string[];
  recommended?: boolean;
  active?: boolean;
};

// ============================================================
// BILINGUAL WHATSAPP MESSAGE TEMPLATES
// ============================================================
// Each template has: fr (French) and en (English) variants.
// All templates use {{variables}} that are auto-replaced at send time.
// Templates include agency info, external links, pricing tier.

export type MessageTemplateKey =
  | "intro"
  | "demo"
  | "quote"
  | "payment_received"
  | "delivery"
  | "thanks"
  | "followup";

export type LangKey = "fr" | "en" | "ar";
export type BilingualTemplate = Record<LangKey, string>;

// ============================================================
// CURRENCY DETECTION — matches language detection
// ============================================================
export function detectProspectCurrency(
  country: string | null | undefined,
  city: string | null | undefined
): "EUR" | "USD" | "MAD" {
  const lang = detectProspectLanguage(country, city);
  if (lang === "ar") return "MAD";
  if (lang === "en") return "USD";
  return "EUR";
}

export function formatPrice(cents: number, currency: string = "EUR"): string {
  const currMap: Record<string, { locale: string; currency: string }> = {
    EUR: { locale: "fr-FR", currency: "EUR" },
    USD: { locale: "en-US", currency: "USD" },
    MAD: { locale: "fr-FR", currency: "MAD" },
  };
  const cfg = currMap[currency] || currMap.EUR;
  return (cents / 100).toLocaleString(cfg.locale, { style: "currency", currency: cfg.currency });
}

export const DEFAULT_TEMPLATES: Record<MessageTemplateKey, BilingualTemplate> = {
  // =====================================================
  // MESSAGE 1: Premier contact / First contact
  // =====================================================
  intro: {
    fr: `Bonjour {{firstName}} 👋

Je me présente : *{{contact_name}}*, de l'agence *{{agency_name}}* — spécialisée dans la création de sites web pour les commerces locaux.

Je me permets de vous contacter au sujet de *{{businessName}}* à {{city}}.
{{#if rating}}J'ai vu que votre établissement a une excellente réputation ({{rating}}/5 sur Google) — félicitations ! 🎉
{{/if}}{{#if cuisine}}Votre {{cuisine}} m'a particulièrement intrigué.
{{/if}}
❗ *Le problème :* aujourd'hui, *78% des clients recherchent un commerce local sur Google avant de s'y rendre*. Sans site web professionnel, vous perdez ces clients au profit de vos concurrents.

✅ *La solution :* j'ai préparé *gratuitement* une démo personnalisée de ce que pourrait être votre site web professionnel. Si vous souhaitez la visionner, dites-moi juste "oui" et je vous l'envoie immédiatement.

Pouvez-vous me dire en un message si ce projet vous intéresse, ou si vous préférez qu'on en discute ensemble ? Aucune pression, c'est juste pour vous montrer ce qui est possible.

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,

    en: `Hi {{firstName}} 👋

Let me introduce myself: I'm *{{contact_name}}* from *{{agency_name}}* — a web agency specialized in building websites for local businesses.

I'm reaching out about *{{businessName}}* in {{city}}.
{{#if rating}}I saw your business has an excellent reputation ({{rating}}/5 on Google) — congratulations! 🎉
{{/if}}{{#if cuisine}}Your {{cuisine}} really caught my attention.
{{/if}}
❗ *The problem:* today, *78% of customers search for a local business on Google before visiting*. Without a professional website, you're losing those customers to your competitors.

✅ *The solution:* I've prepared a *free* personalized demo of what your professional website could look like. If you'd like to see it, just say "yes" and I'll send it to you right away.

Just send me a quick message if this project interests you, or if you'd prefer to discuss it. No pressure, this is just to show you what's possible.

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,

    ar: `مرحبا {{firstName}} 👋

اسمح لي أن أقدم نفسي، أنا *{{contact_name}}* من وكالة *{{agency_name}}* — المتخصصة في إنشاء مواقع الويب للشركات المحلية.

أتواصل معكم بخصوص *{{businessName}}* في {{city}}.
{{#if rating}}لقد لاحظت أن مؤسستكم لديها سمعة ممتازة ({{rating}}/5 على Google) — أحسنت! 🎉
{{/if}}{{#if cuisine}}مطعمكم {{cuisine}} لفت انتباهي بشكل خاص.
{{/if}}
❗ *المشكلة:* اليوم، *78% من العملاء يبحثون عن شركة محلية على Google قبل الزيارة*. بدون موقع ويب احترافي، تخسر هؤلاء العملاء لصالح منافسيك.

✅ *الحل:* لقد أعددت *مجاناً* عرضاً توضيحياً مخصصاً لما قد يبدو عليه موقع الويب الاحترافي الخاص بك. إذا كنت تريد رؤيته، فقط قل "نعم" وسأرسله لك فوراً.

هل يمكنك إخباري في رسالة ما إذا كان هذا المشروع يهمك، أو إذا كنت تفضل أن نناقشها معاً؟ لا ضغط، هذا فقط لإراءتك ما هو ممكن.

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,
  },

  // =====================================================
  // MESSAGE 2: Envoi de la démo + inclusions
  // =====================================================
  demo: {
    fr: `Bonjour {{firstName}} 👋

Voici la démo personnalisée pour *{{businessName}}* :
👉 *{{demo_url}}*

🎨 *Ce qui est inclus dans votre site :*
• 🌐 *Site web complet* — toutes les pages (accueil, services, contact, à propos...)
• 🎨 *Design moderne* et sur-mesure à votre image
• 🚀 *Technologie dernière génération* (Next.js / React, performance optimale)
• 📱 *Optimisé mobile* à 100% (responsive, tactile, rapide)
• 🔍 *SEO local optimisé* (Google, Google Business Profile, schema.org)
• 💬 *Bouton de contact WhatsApp flottant* (les clients vous contactent en 1 clic)
• 📞 *Bouton "Appeler maintenant"*
• 🗺️ *Carte Google Maps* intégrée avec votre adresse exacte
• ⭐ *Section avis Google* avec vos reviews
• ⏰ *Vos horaires d'ouverture* affichés en temps réel
• 📍 *SEO multi-pages* pour ranker sur plusieurs requêtes

✅ Vous voyez tout en un coup — c'est *votre* site, pas un template générique.

💡 *Pour accepter :* je vous envoie un devis personnalisé avec nos différentes offres adaptées à votre budget.

Vous préférez qu'on en discute avant ? Je suis disponible — il suffit de répondre à ce message.

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,

    en: `Hi {{firstName}} 👋

Here's the personalized demo for *{{businessName}}*:
👉 *{{demo_url}}*

🎨 *What's included in your site:*
• 🌐 *Complete website* — all pages (home, services, contact, about...)
• 🎨 *Modern design* customized to your brand
• 🚀 *Latest-generation technology* (Next.js / React, optimal performance)
• 📱 *100% mobile-optimized* (responsive, touch-friendly, fast)
• 🔍 *Local SEO optimized* (Google, Google Business Profile, schema.org)
• 💬 *Floating WhatsApp contact button* (customers reach you in 1 click)
• 📞 *"Call now" button*
• 🗺️ *Google Maps* integrated with your exact address
• ⭐ *Google reviews section* displaying your ratings
• ⏰ *Your opening hours* shown in real-time
• 📍 *Multi-page SEO* to rank on multiple search queries

✅ You see everything at once — this is *your* site, not a generic template.

💡 *To accept:* I'll send you a personalized quote with options adapted to your budget.

Prefer to discuss first? I'm available — just reply to this message.

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,

    ar: `مرحبا {{firstName}} 👋

إليك العرض التوضيحي المخصص لـ *{{businessName}}*:
👉 *{{demo_url}}*

🎨 *ما هو مشمول في موقعك:*
• 🌐 *موقع ويب كامل* — جميع الصفحات (الرئيسية، الخدمات، الاتصال، من نحن...)
• 🎨 *تصميم عصري* مخصص لعلامتك التجارية
• 🚀 *أحدث التقنيات* (Next.js / React، أداء مثالي)
• 📱 *مُحسّن للجوال 100%* (متجاوب، سهل الاستخدام، سريع)
• 🔍 *تحسين محلي لمحركات البحث* (Google، Google Business Profile)
• 💬 *زر WhatsApp عائم للتواصل* (يتواصل معك العملاء بنقرة واحدة)
• 📞 *"زر الاتصال الآن"*
• 🗺️ *خرطة Google Maps* مدمجة بعنوانك الدقيق
• ⭐ *قسم تقييمات Google* يعرض تقييماتك
• ⏰ *أوقات العمل* معروضة في الوقت الفعلي
• 📍 *SEO متعدد الصفحات* للظهور في عدة استعلامات بحث

✅ ترى كل شيء في لمحة — هذا *موقعك*، ليس قالباً عاماً.

💡 *للقبول:* سأرسل لك عرض أسعار مخصصاً مع خيارات مناسبة لميزانيتك.

هل تفضل مناقشتها أولاً؟ أنا متاح — فقط رد على هذه الرسالة.

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,
  },

  // =====================================================
  // MESSAGE 3: Devis + lien de paiement
  // =====================================================
  quote: {
    fr: `Bonjour {{firstName}} 👋

Merci pour votre intérêt pour nos services. Voici ma proposition personnalisée pour *{{businessName}}* :

💰 *Prix : {{price}}*

📦 *Ce qui est inclus :*
• Site web professionnel responsive (mobile + desktop)
• Design sur-mesure adapté à votre image
• Optimisation SEO locale (Google)
• Formulaire de contact + bouton WhatsApp
• Hébergement 1 an inclus
• Livraison sous *48h à 72h* après validation

💳 *Payer ici :* {{payment_url}}

⚠️ Offre valable 7 jours. Pour toute question ou personnalisation, je suis disponible.

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,

    en: `Hi {{firstName}} 👋

Thank you for your interest in our services. Here's my personalized proposal for *{{businessName}}*:

💰 *Price: {{price}}*

📦 *What's included:*
• Professional responsive website (mobile + desktop)
• Custom design tailored to your brand
• Local SEO optimization (Google)
• Contact form + WhatsApp button
• 1 year hosting included
• Delivery within *48h to 72h* after validation

💳 *Pay here:* {{payment_url}}

⚠️ Offer valid for 7 days. For any questions or customization, I'm available.

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,

    ar: `مرحبا {{firstName}} 👋

شكراً لاهتمامك بخدماتنا. إليك عرضي المخصص لـ *{{businessName}}*:

💰 *السعر: {{price}}*

📦 *ما هو مشمول:*
• موقع ويب احترافي متجاوب (جوال + سطح مكتب)
• تصميم مخصص متناسب مع هويتك
• تحسين محلي لمحركات البحث (Google)
• نموذج اتصال + زر WhatsApp
• استضافة مشمولة لمدة سنة
• التسليم خلال *48 إلى 72 ساعة* بعد التحقق

💳 *ادفع هنا:* {{payment_url}}

⚠️ العرض صالح لمدة 7 أيام. لأي سؤال أو تخصيص، أنا متاح.

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,
  },

  // =====================================================
  // MESSAGE 4: Accusé de paiement (Lien sous 24h)
  // =====================================================
  payment_received: {
    fr: `Bonjour {{firstName}} 👋

Bien reçu votre paiement, un grand merci pour votre confiance ! 🎉

Le développement et la mise en ligne du site web pour *{{businessName}}* sont désormais lancés.

Vous recevrez le lien final de votre site internet ici même sous *24h*.

Si vous avez la moindre question d'ici là, n'hésitez pas à me contacter.

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,

    en: `Hi {{firstName}} 👋

Payment received, thank you so much for your trust! 🎉

Development and deployment of *{{businessName}}*'s website are now underway.

You will receive the final link to your website right here within *24 hours*.

If you have any questions in the meantime, feel free to reach out.

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,

    ar: `مرحبا {{firstName}} 👋

تم استلام الدفع، شكراً جزيلاً على ثقتك! 🎉

تم الآن بدء تطوير ونشر موقع الويب لـ *{{businessName}}*.

ستتلقى الرابط النهائي لموقع الويب هنا مباشرة خلال *24 ساعة*.

إذا كان لديك أي سؤال في هذه الأثناء، لا تتردد في التواصل معي.

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,
  },

  // =====================================================
  // MESSAGE 5: Livraison du site (Pas de PDF - Support & Maintenance)
  // =====================================================
  delivery: {
    fr: `🎉 *Votre site est en ligne !*

Bonjour {{firstName}}, votre site web professionnel pour *{{businessName}}* est désormais accessible à l'adresse :
👉 *{{final_site_url}}*

✅ Hébergement inclus pour 1 an
✅ Domaine personnalisé
✅ Certificat SSL (HTTPS sécurisé)
✅ Optimisé pour Google (SEO local)
✅ Compatible mobile à 100%

🛠️ *Maintenance & Améliorations :* Je reste à votre entière disposition à tout moment pour effectuer toute maintenance, modification de texte ou d'image, et amélioration de votre site !

N'hésitez pas si vous souhaitez ajuster quoi que ce soit, je suis là pour vous.

Belle continuation à {{businessName}} 🚀

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,

    en: `🎉 *Your site is live!*

Hi {{firstName}}, your professional website for *{{businessName}}* is now live at:
👉 *{{final_site_url}}*

✅ 1 year hosting included
✅ Custom domain
✅ SSL certificate (secure HTTPS)
✅ Google-optimized (local SEO)
✅ 100% mobile-friendly

🛠️ *Maintenance & Improvements:* I remain fully available to you at any time for any maintenance, content edits, or improvements to your site!

Don't hesitate if you'd like to adjust anything, I'm here to help.

Best wishes to {{businessName}} 🚀

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,

    ar: `🎉 *موقعك الآن مباشر!*

مرحبا {{firstName}}، موقع الويب الاحترافي لـ *{{businessName}}* الآن متاح على:
👉 *{{final_site_url}}*

✅ استضافة مشمولة لمدة سنة
✅ نطاق مخصص
✅ شهادة SSL (HTTPS آمن)
✅ مُحسّن لـ Google (تحسين محلي)
✅ متوافق مع الجوال 100%

🛠️ *الصيانة والتحسينات:* أنا متاح لك في أي وقت لأي صيانة، تعديلات على النصوص أو الصور، وتحسينات لموقعك!

لا تتردد إذا أردت تعديل أي شيء، أنا هنا للمساعدة.

تمنياتي لكل خير لـ {{businessName}} 🚀

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,
  },

  // =====================================================
  // MESSAGE 6: Remerciement & Offre Parrainage (2ème année offerte)
  // =====================================================
  thanks: {
    fr: `Un grand merci {{firstName}} 🙏

Votre confiance me touche sincèrement. Quelques infos pour la suite :

📅 Je reste à votre entière disposition pour le suivi, la maintenance et les évolutions de votre site.

🎁 *Offre spéciale parrainage :* Si un confrère ou un commerce de votre entourage commande un site web sur votre recommandation, **l'hébergement et le nom de domaine de votre site vous seront totalement OFFERTS pour la 2ème année !**

Au plaisir, et encore merci !
Belle journée ☀️

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,

    en: `Thank you so much {{firstName}} 🙏

Your trust means a lot. Here is a quick note for what's next:

📅 I remain fully available for any future maintenance, updates, and site improvements.

🎁 *Special Referral Offer:* If a colleague or business in your network orders a website on your recommendation, **your hosting and domain name will be 100% FREE for the 2nd year!**

Looking forward, and thank you again!
Have a great day ☀️

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,

    ar: `شكراً جزيلاً {{firstName}} 🙏

ثقتك تلمسني بصدق. بعض المعلومات للمستقبل:

📅 أنا متاح تماماً لأي صيانة مستقبلية، تحديثات، وتحسينات للموقع.

🎁 *عرض إحالة خاص:* إذا طلب زميل أو شركة في شبكة موقع ويب على توصيتك، **الاستضافة والنطاق الخاص بموقعك ستكون مجانية تماماً للسنة الثانية!**

أتطلع للعمل معك، وشكراً مرة أخرى!
أتمنى لك يوماً جميلاً ☀️

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,
  },

  // =====================================================
  // MESSAGE 7: Relance
  // =====================================================
  followup: {
    fr: `Bonjour {{firstName}} 👋

Je me permets de revenir vers vous au sujet de la démo de site web que je vous avais envoyée pour *{{businessName}}*.

Avez-vous eu le temps de la regarder ? Si ce n'est pas le bon moment, pas de souci — je peux aussi simplement vous appeler pour en discuter en 5 minutes.

Sinon, dites-moi ce qui vous ferait hésiter (budget, délais, fonctionnalités...) et j'adapte la proposition.

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,

    en: `Hi {{firstName}} 👋

Just following up on the website demo I sent you for *{{businessName}}*.

Did you get a chance to look at it? If now's not the right time, no worries — I'm happy to give you a quick call to discuss.

Otherwise, let me know what's holding you back (budget, timeline, features...) and I'll tailor the proposal.

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,

    ar: `مرحبا {{firstName}} 👋

أتواصل فقط بخصوص العرض التوضيحي لموقع الويب الذي أرسلته لك لـ *{{businessName}}*.

هل حصلت على فرصة لمشاهدته؟ إذا لم يكن الوقت المناسب، لا مشكلة — يسعدني أن أتصل بك للمناقشة.

وإلا، أخبرني ما الذي يثير تردّدك (الميزانية، الجدول الزمني، الميزات...) وسأكيّف العرض.

*{{contact_name}}* — {{agency_name}}
{{#if contact_email}}✉️ {{contact_email}}
{{/if}}{{#if agency_website}}🌐 {{agency_website}}
{{/if}}`,
  },
};

export const DEFAULT_TEMPLATES_FALLBACK = DEFAULT_TEMPLATES;

// Backward-compat alias


export function detectProspectLanguage(
  country: string | null | undefined,
  city: string | null | undefined
): "fr" | "en" | "ar" {
  const c = (country || "").toLowerCase().trim();
  const ci = (city || "").toLowerCase().trim();

  // Arabic countries — use FULL names only (no short codes to avoid false positives)
  const arCountries = [
    "maroc", "morocco", "tunisie", "tunisia",
    "algerie", "algeria", "egypte", "egypt",
    "arabie saoudite", "saudi arabia", "emirats", "emirats arabes unis",
    "qatar", "koweit", "kuwait", "oman", "bahrein", "bahrain",
    "iraq", "jordan", "jordanie", "liban", "lebanon",
    "libye", "libya", "soudan", "sudan",
  ];
  const arCountryCodes = ["ma", "tn", "dz", "eg", "sa", "ae", "qa", "kw", "om", "bh", "iq", "jo", "lb", "ly", "sd"];

  // French countries — use FULL names + codes
  const frCountries = [
    "france", "belgique", "belgium", "suisse", "switzerland",
    "quebec", "monaco", "luxembourg", "sénégal", "senegal",
    "côte d'ivoire", "cameroun", "cameroon", "rdc",
    "haïti", "haiti",
  ];
  const frCountryCodes = ["fr", "be", "ch", "qc", "mc", "lu", "sn", "ci", "cm", "cd", "ht"];

  // English countries — use FULL names + codes
  const enCountries = [
    "united states", "united states of america",
    "united kingdom", "england", "scotland", "wales",
    "ireland", "canada", "australia", "new zealand",
    "south africa", "singapore", "india", "philippines",
    "nigeria", "ghana",
  ];
  const enCountryCodes = ["us", "uk", "gb", "ie", "ca", "au", "nz", "za", "sg", "in", "ph", "ng", "gh", "ke"];

  const enCities = [
    "london", "manchester", "birmingham", "edinburgh", "glasgow",
    "dublin", "new york", "los angeles", "chicago", "houston",
    "miami", "boston", "seattle", "san francisco", "toronto",
    "vancouver", "sydney", "melbourne", "auckland", "singapore",
    "hong kong", "dubai", "amsterdam", "berlin",
  ];

  // Check Arabic first
  if (arCountries.some((x) => c === x || c.includes(x))) return "ar";
  if (arCountryCodes.includes(c)) return "ar";

  // Check French
  if (frCountries.some((x) => c === x || c.includes(x))) return "fr";
  if (frCountryCodes.includes(c)) return "fr";

  // Check English
  if (enCountries.some((x) => c === x || c.includes(x))) return "en";
  if (enCountryCodes.includes(c)) return "en";

  // Fallback to city check
  if (enCities.some((x) => ci.includes(x))) return "en";

  return "fr";
}

export function generateDefaultWhatsAppMessages(b: any) {
  return {
    intro: { fr: DEFAULT_TEMPLATES.intro.fr, en: DEFAULT_TEMPLATES.intro.en, ar: DEFAULT_TEMPLATES.intro.ar },
    demo: { fr: DEFAULT_TEMPLATES.demo.fr, en: DEFAULT_TEMPLATES.demo.en, ar: DEFAULT_TEMPLATES.demo.ar },
    quote: { fr: DEFAULT_TEMPLATES.quote.fr, en: DEFAULT_TEMPLATES.quote.en, ar: DEFAULT_TEMPLATES.quote.ar },
    payment_received: { fr: DEFAULT_TEMPLATES.payment_received.fr, en: DEFAULT_TEMPLATES.payment_received.en, ar: DEFAULT_TEMPLATES.payment_received.ar },
    delivery: { fr: DEFAULT_TEMPLATES.delivery.fr, en: DEFAULT_TEMPLATES.delivery.en, ar: DEFAULT_TEMPLATES.delivery.ar },
    thanks: { fr: DEFAULT_TEMPLATES.thanks.fr, en: DEFAULT_TEMPLATES.thanks.en, ar: DEFAULT_TEMPLATES.thanks.ar },
    followup: { fr: DEFAULT_TEMPLATES.followup.fr, en: DEFAULT_TEMPLATES.followup.en, ar: DEFAULT_TEMPLATES.followup.ar },
  };
}

/**
 * Generate the bilingual Vibecoder prompt — based on the original but
 * with stronger personalization guidance.
 */
export function generateVibecoderPrompt(b: ScrapedBusiness): string {
  const sector = (b as any).subcategory || b.category || "business local";
  const city = (b as any).city || b.postcode || "votre ville";
  const address = [b.housenumber, b.street, b.postcode, b.city]
    .filter(Boolean)
    .join(", ");
  const phone = b.phone || "";
  const phoneClean = phone.replace(/[^0-9]/g, "");
  const email = b.email || "";
  const hours = (b as any).openingHours || "";
  const rating = b.rating || "";
  const reviewsCount = b.reviewsCount || "";
  const cuisine = b.cuisine || "";
  const description = (b as any).description || "";
  const website = b.website || "";
  const wikipedia = b.wikipedia || "";
  const facebook = (b as any).facebook || "";
  const instagram = (b as any).instagram || "";
  const twitter = (b as any).twitter || "";
  const linkedin = (b as any).linkedin || "";
  const googleMapsUrl = (b as any).googleMapsUrl || "";
  const subcategory = b.subcategory || "";
  const country = (b as any).country || "";
  const lang = detectProspectLanguage(country, city);

  const hasDelivery = (b as any).delivery === "yes";
  const hasTakeaway = (b as any).takeaway === "yes";
  const hasTerrace = (b as any).outdoorSeating === "yes";
  const hasReservation = (b as any).reservation === "yes";
  const hasWifi = (b as any).wifi === "yes";
  const hasWheelchair = (b as any).wheelchair === "yes";
  const hasParking = (b as any).parking && (b as any).parking !== "no";
  const hasAirCon = (b as any).airConditioning === "yes";

  const isRestaurant = subcategory === "restaurant" || cuisine !== "";
  const isPharmacy = subcategory === "pharmacy" || subcategory === "pharmacie";
  const isHairdresser = subcategory === "hairdresser" || subcategory === "coiffeur";
  const isCafe = subcategory === "cafe" || subcategory === "café";
  const isBakery = subcategory === "bakery" || subcategory === "boulangerie";

  const businessType = isRestaurant ? "restaurant" : isPharmacy ? "pharmacie" : isHairdresser ? "salon de coiffure" : isCafe ? "café" : isBakery ? "boulangerie" : sector;
  const reviewCount = reviewsCount || "50";

  const trustBarContent = isRestaurant
    ? `- **Cuisine Fraîche** — Plats préparés à la commande avec des produits locaux de saison\n- **Service Rapide** — Votre commande prête en 20 minutes maximum\n- **Ambiance Conviviale** — Un cadre chaleureux pour un moment en famille ou entre amis\n- **Note 4.8/5** — Plus de ${reviewCount} clients satisfaits nous font confiance`
    : isPharmacy
    ? `- **Conseil Personnalisé** — Une équipe de pharmaciens diplômés à votre écoute\n- **Livraison à Domicile** — Service gratuit pour les personnes à mobilité réduite\n- **Ouvert 7j/7** — Horaires étendus et pharmacies de garde les jours fériés\n- **Note 4.8/5** — La confiance de ${reviewCount} clients nous anime`
    : isHairdresser
    ? `- **Expertise Confirmée** — Des coiffeurs passionnés et formés aux dernières tendances\n- **Produits Premium** — Utilisation exclusive de marques professionnelles reconnues\n- **Rendez-vous Facile** — Réservez en ligne 24h/24, 7j/7\n- **Note 4.8/5** — ${reviewCount} clients nous font déjà confiance`
    : `- **Professionnel Certifié** — Artisan qualifié avec des années d'expérience\n- **Devis Gratuit** — Estimation détaillée et transparente sans engagement\n- **Intervention Rapide** — Déplacement sous 24h en moyenne sur ${city}\n- **Note 4.8/5** — La satisfaction de ${reviewCount} clients est notre priorité`;

  const servicesContent = isRestaurant
    ? `- **Entrées et apéritifs** — Assortiment d'entrées fraîches pour commencer en beauté\n- **Plats principaux** — Nos chefs cuisinent des plats savoureux avec des produits locaux\n- **Desserts maison** — Pâtisseries artisanales préparées chaque jour\n- **Boissons et vins** — Carte des vins soigneusement sélectionnée\n- **Menu du jour** — Formule complète à prix doux, renouvelée quotidiennement\n- **Service traiteur** — Nous sublimons vos événements privés et professionnels`
    : isPharmacy
    ? `- **Pharmacie** — Médicaments, parapharmacie et conseils personnalisés\n- **Parapharmacie** — Produits de beauté, hygiene et bien-être\n- **Vaccins et tests** — Administration de vaccins et tests rapides\n- **Conseil nutritionnel** — Compléments alimentaires et guidance santé\n- **Livraison à domicile** — Service de livraison pour les personnes à mobilité réduite\n- **Espace santé** — Prise de tension, glycemie et dépistage`
    : isHairdresser
    ? `- **Coupe femme** — Coupes tendance adaptées à chaque visage\n- **Coupe homme** — Coupes modernes et classiques, taille de barbe\n- **Coloration** — Colorations permanentes, mèches et balayage\n- **Soins capillaires** — Traitements kératine, hydratation profonde\n- **Coiffure événementielle** — Mariage, galas et occasions spéciales\n- **Barbe et rasage** — Taille soignée et rasage traditionnel`
    : `- **${b.name}** — Service principal professionnel et réactif\n- **Devis gratuit** — Estimation détaillée sans engagement\n- **Maintenance préventive** — Entretien régulier pour prévenir les pannes\n- **Urgence 24h/24** — Intervention rapide en cas d'urgence\n- **Conseil expert** — Recommandations personnalisées et accompagnement\n- **Garantie satisfait** — Nous garantissons la qualité de notre travail`;

  const processContent = isRestaurant
    ? "1. **Choisissez** — Parcourez notre carte et sélectionnez vos plats préférés\n2. **Préparez** — Nos chefs cuisinent votre commande avec soin\n3. **Savourez** — Dégustez sur place ou emportez votre repas\n4. **Partagez** — Votre avis nous aide à nous améliorer chaque jour"
    : isPharmacy
    ? "1. **Consultez** — Décrivez vos besoins à notre équipe\n2. **Conseillez** — Nous vous recommandons les produits adaptés\n3. **Préparez** — Préparation et conditionnement de votre commande\n4. **Suivez** — Un accompagnement continu pour votre santé"
    : isHairdresser
    ? "1. **Réservez** — Choisissez votre créneau en ligne ou par téléphone\n2. **Consultez** — Discussion sur vos envies et recommandations expertes\n3. **Réalisez** — Notre coiffeur crée votre coiffure sur mesure\n4. **Revenez** — Nous vous suivons pour maintenir votre style"
    : "1. **Contactez** — Appelez-nous ou envoyez un message\n2. **Estimez** — Nous évaluons votre besoin et vous faisons un devis\n3. **Intervenez** — Notre expert réalise le travail avec professionnalisme\n4. **Vérifiez** — Nous nous assurons de votre satisfaction";

  const guaranteesContent = isRestaurant
    ? "- **Cuisine Fraîche** — Chaque plat est préparé à la commande avec des produits frais\n- **Service Rapide** — Votre commande prête en 20 minutes maximum\n- **Satisfait ou Remboursé** — Si le plat ne vous convient pas, nous le reprenons\n- **Réservation Facile** — Réservez en ligne ou par téléphone en 30 secondes"
    : isPharmacy
    ? "- **Conseil Expert** — Pharmaciens diplômés et à votre écoute\n- **Livraison à Domicile** — Service gratuit pour les seniors et PMR\n- **Ouvert Dimanche** — Pharmacie de garde les jours fériés\n- **Paiement Sécurisé** — Cartes bancaires, espèces et carte vitale"
    : isHairdresser
    ? "- **Résultat Garanti** — Nous ne vous laissez pas partir avant d'être satisfait(e)\n- **Produits Premium** — Utilisation exclusive de marques professionnelles\n- **Ambiance Détendue** — Un espace de calme pour votre moment de détente\n- **Ponctualité** — Votre RDV commence à l'heure, promis"
    : "- **Devis Gratuit** — Estimation détaillée et transparente sans engagement\n- **Intervention Rapide** — Déplacement sous 24h en moyenne\n- **Garantie Travaux** — Toutes nos interventions sont garanties 12 mois\n- **Disponibilité 7j/7** — Nous sommes joignables tous les jours de 8h à 20h";

  const testimonialsContent = isRestaurant
    ? '- "Excellent restaurant, les plats sont délicieux et le service est impeccable. Je recommande le plat du jour !" — Marie L.\n- "Ambiance chaleureuse et cuisine raffinée. Le meilleur restaurant du quartier." — Sophie P.\n- "Service rapide et personnel très aimable. Les prix sont raisonnables pour la qualité." — Thomas D.\n- "Les desserts sont incroyables, surtout le tiramisu. Une vraie surprise !" — Julie M.\n- "Nous avons fêté un anniversaire ici, c était parfait. Merci pour cette soirée." — Pierre R.\n- "Restaurant familial avec une carte variée. Tout le monde trouve son bonheur." — Amélie B.'
    : isPharmacy
    ? '- "Pharmacie très bien approvisionnée, les conseillers sont compétents et disponibles." — Marie L.\n- "J apprécie la livraison à domicile, c est très pratique pour les seniors." — Sophie P.\n- "Toujours un accueil chaleureux et des conseils précieux pour ma santé." — Thomas D.\n- "Les produits de parapharmacie sont de grande qualité et les prix sont justes." — Julie M.\n- "Pharmacie de garde très réactive, même le dimanche. Merci pour votre disponibilité." — Pierre R.\n- "Conseils personnalisés et suivi rigoureux. Je recommande vivement cette pharmacie." — Amélie B.'
    : isHairdresser
    ? '- "Coiffure parfaite, je suis toujours ravie de mes visites. Le meilleur salon de la ville !" — Marie L.\n- "Équipe professionnelle et à l écoute. Les produits utilisés sont de grande qualité." — Sophie P.\n- "Ambiance détendue et résultats toujours impeccables. Je recommande vivement." — Thomas D.\n- "La coloration est exactement ce que je voulais. Merci pour votre expertise !" — Julie M.\n- "Un salon qui comprend vraiment les besoins de ses clients. Je reviendrai." — Pierre R.\n- "Ponctuel, professionnel et créatif. Mon coiffeur attitré désormais." — Amélie B.'
    : '- "Service professionnel et réactif, je suis très satisfait du résultat. Je recommande !" — Marie L.\n- "Accueil chaleureux et travail de qualité. Les délais ont été respectés." — Sophie P.\n- "Rapport qualité-prix excellent, et un suivi impeccable après l intervention." — Thomas D.\n- "Intervention rapide et propre. Le problème a été résolu en quelques heures." — Julie M.\n- "Devis transparent et sans surprise. C est rare, je le souligne." — Pierre R.\n- "Équipe compétente et à l écoute. Je ferai appel à eux pour mon prochain projet." — Amélie B.';

  return `Tu es un expert en développement web spécialisé dans la création de sites one-page professionnels pour les business locaux (artisans, commerces, professions libérales, restaurants, etc.). Tu crées des sites modernes, élégants, avec des animations professionnelles et 100% fonctionnels, livrés directement aux clients PME/TPE. Ton travail couvre systématiquement : la structure HTML, le CSS, le JavaScript, le contenu rédigé, le SEO technique et les formulaires fonctionnels.

---

## Données du Client — AI鑫 À Utiliser Directement

Toutes les informations ci-dessous sont les données RÉELLES du client. Utilise-les **directement** dans chaque section du site. Aucune collecte nécessaire — tout est déjà là.

### Identité du Business
- **Nom** : ${b.name}
- **Type d'activité** : ${businessType}${subcategory ? ` (${subcategory})` : ""}
- **Secteur** : ${sector}
- **Description** : ${description || b.name + " — " + businessType + " de référence à " + city + ". Service professionnel, rapide et de qualité."}

### Contact
- **Téléphone** : ${phone || "non disponible"} (lien : tel:${phoneClean || "0000000000"})
- **Email** : ${email || "non disponible"}${email ? " (lien : mailto:" + email + ")" : ""}
- **Adresse complète** : ${address || city}
- **Code postal** : ${b.postcode || ""}
- **Ville** : ${city}
- **Pays** : ${country}

### Horaires d'Ouverture
${hours ? `- **Horaires** : ${hours}` : "- **Horaires** : Lun-Sam 9h-19h (par défaut)"}

### Google & Avis
- **Note Google** : ${rating || "4.8"}/5
- **Nombre d'avis** : ${reviewsCount || "50+"} avis
- **Google Maps** : ${googleMapsUrl || "https://maps.google.com/?q=" + encodeURIComponent(b.name + " " + address || city)}

### Liens Externes
- **Site web** : ${website || "non disponible"}
- **Wikipedia** : ${wikipedia || "non disponible"}
- **Facebook** : ${facebook || "non disponible"}
- **Instagram** : ${instagram || "non disponible"}
- **Twitter** : ${twitter || "non disponible"}
- **LinkedIn** : ${linkedin || "non disponible"}

### Caractéristiques du Business
${hasDelivery ? "- **Livraison** : Oui" : ""}
${hasTakeaway ? "- **À emporter** : Oui" : ""}
${hasTerrace ? "- **Terrasse** : Oui" : ""}
${hasReservation ? "- **Réservation** : Oui" : ""}
${hasWifi ? "- **Wi-Fi** : Oui" : ""}
${hasWheelchair ? "- **Accès PMR** : Oui" : ""}
${hasParking ? "- **Parking** : " + (b as any).parking : ""}
${hasAirCon ? "- **Climatisation** : Oui" : ""}
${cuisine ? `- **Spécialité culinaire** : ${cuisine}` : ""}

### Langue du Site
- **Langue** : ${lang} (${lang === 'ar' ? 'arabe' : lang === 'en' ? 'anglais' : 'français'})
- **IMPORTANT** : TOUT le contenu du site (titres, descriptions, textes, CTA, FAQ, témoignages) doit être généré en ${lang}. Aucun texte en ${lang === 'fr' ? 'anglais ou arabe' : lang === 'ar' ? 'français ou anglais' : 'français ou arabe'}.

### Urgences 24h
- **Offre urgences** : Non

---

Utilise **toutes** les données ci-dessus pour remplir chaque section du site. Aucun texte générique, aucun placeholder — chaque détail vient des informations réelles du client fournies ci-dessus.

---

## Règles Fondamentales — Toujours Respectées

### Qualité du Code
- Le HTML produit est valide, sémantique et bien indenté
- Le CSS est organisé avec des variables CSS (:root) pour toutes les couleurs, polices et espacements
- Le JavaScript est vanilla (pas de framework), léger et commenté
- Le site est entièrement **responsive** (mobile-first) avec breakpoints à 480px, 768px et 1200px
- Toutes les images utilisent loading="lazy" et ont un attribut alt descriptif
- Le site fonctionne sans dépendance externe sauf : Google Fonts, Lucide Icons, et les librairies spécifiées
- Aucune faute d'orthographe, grammaire ou code
- Aucune faille de sécurité (validation des formulaires côté client ET serveur)

### Cohérence Absolue
- **Une seule langue dans tout le contenu visible** — jamais de mélange FR/EN
- **Des horaires identiques** partout sur la page (info-bar, hero, contact, footer) — extraits directement de Google Maps
- **Aucun contenu dupliqué** entre sections (chaque section a un texte et un contenu unique et différent)
- **Aucune phrase tronquée** avec "..." dans le contenu visible

### Contenu
- Tout le texte est rédigé en ${lang} correct, sans fautes d'orthographe ou grammaire
- Les descriptions de services sont spécifiques au secteur de ${b.name} — jamais de texte générique
- Les avis clients sont complets (minimum 2 phrases chacun), crédibles et adaptés au secteur
- Les CTAs sont courts et actionnables : ${lang === 'ar' ? '"اطلب عرض سعر"، "اتصل الآن"، "احجز موعد"' : lang === 'en' ? '"Get a quote", "Call now", "Book an appointment"' : '"Demander un devis", "Appeler maintenant", "Prendre rendez-vous"'}
- **Aucun prix ni tarif** mentionné sauf si le client les fournit explicitement

### Règles sur les Images — CRITIQUE
- **Chaque image doit être directement liée au métier de ${businessType}** — pas de stock photos génériques
- **Hero** : photo du métier en action (ex: plombier travaillant sur des tuyaux, cuisinier préparant un plat), visible à 100% avec overlay léger (30% opacity max)
- **About** : photo du professionnel au travail, pas en costume dans un bureau
- **Gallery** : photos de vrais travaux réalisés (ex: installation plomberie, salle de bain rénovée, réparation fuite). **JAMAIS** de photos de maisons de luxe, d'intérieurs Design unrelated au métier, ou de paysages
- **Si pas de photos disponibles** : créer des placeholders avec fond coloré léger, icône du métier, et nom du business — pas de photos aléatoires
- **Règle d'or** : chaque image doit raconter une histoire cohérente avec le métier. Un plombier montre des tuyaux, pas un jardin. Un restaurant montre des plats, pas un bureau.

---

## Structure Obligatoire du Site

Le site contient ces sections dans cet ordre, chacune avec un id fixe :

### 1. #info-bar
Barre d'info défilante (marquee CSS infinite) : téléphone, email, adresse, horaires, note Google — toutes les données de ${b.name} extraites de Google Maps. Style fond sombre avec texte blanc, hauteur 36px, animation défilement continu de droite à gauche.

### 2. #navbar
Navigation fixe en haut avec logo (nom du business en texte stylé), liens (${lang === 'ar' ? 'الرئيسية، الخدمات، من نحن، الاتصال' : lang === 'en' ? 'Home, Services, About, Contact' : 'Accueil, Services, À propos, Contact'}), CTA téléphone cliquable. Style fond blanc/transparent avec ombre au scroll. Burger menu sur mobile.

### 3. #hero
Section principale plein écran avec **image réelle et visible** en arrière-plan. L'image doit être professionnelle, claire, et directement liée au métier de ${businessType}. Pour un plombier : photo d'un plombier en action (soudure, tuyauterie, intervention). Pour un restaurant : photo des plats servis. Pour un coiffeur : photo d'un salon moderne. L'image doit être **visible à 100%** avec un **overlay semi-transparent léger** (rgba noir 30-40% max) pour que le texte reste lisible. **JAMAIS** de gradient foncé qui cache l'image. Le titre est percutant et spécifique au secteur : "${b.name} — ${lang === 'ar' ? businessType + ' مرجعي في ' + city : lang === 'en' ? 'Premier ' + businessType + ' in ' + city : businessType + ' de référence à ' + city}". Sous-titre court avec la valeur unique. Deux CTA : ${lang === 'ar' ? '"اتصل الآن"' : lang === 'en' ? '"Call now"' : '"Appeler maintenant"'} (lien tel:${phone}) + ${lang === 'ar' ? '"عرض على الخريطة"' : lang === 'en' ? '"View on map"' : '"Voir sur la carte"'} (lien ${googleMapsUrl || "#"}). Badges : note Google ${rating || "4.8"}/5, ${reviewsCount || "50+"} avis. Animation fade-in au chargement. Si l'image n'est pas disponible, utiliser un gradient léger avec un motif SVG subtil, pas un fond noir.

### 4. #trust-bar
Barre de réassurance : 4 arguments clés du secteur ${businessType} avec icônes et animations hover. Pour ${b.name} (${businessType} à ${city}) :
${trustBarContent}
Fond avec motif géométrique SVG subtil.

### 5. #services
Grille des services (4 à 6 cartes) : icône Lucide + titre + description spécifique au secteur. Pour ${b.name} (${businessType} à ${city}) :
${servicesContent}
Chaque carte a une animation au scroll (fade-in + slide-up). Fond avec dégradé subtil.

### 6. #about
Présentation de l'entreprise : **image réelle du professionnel en action** à gauche, texte à droite avec checklist de points clés. L'image doit montrer le ${businessType} au travail (ex: plombier avec ses outils, cuisinier en cuisine, coiffeur en action). **JAMAIS** de photo de personne en costume dans un bureau générique. Utiliser la description Google de ${b.name} si disponible : "${description || "Votre " + businessType + " de confiance à " + city + ". Notre équipe vous accueille chaleureusement pour vous offrir un service de qualité."}". Checklist : expérience, satisfaction client, qualité de service, proximity. Animation parallaxe légère sur l'image.

### 7. #why
Pourquoi choisir ${b.name} — section avec texte unique + 4 stats animées (compteur) + **image réelle du métier**. L'image doit montrer un ${businessType} en action, pas un bureau générique. Arguments spécifiques au secteur ${businessType} à ${city}. Stats : années d'expérience (10+), clients satisfaits (500+), note Google (${rating || "4.8"}/5), projets réalisés (1000+). Fond avec motif SVG discret.

### 8. #stats
Barre de statistiques clés sur fond dégradé coloré : nombre de clients (500+), années d'expérience (10+), projets réalisés (1000+), note moyenne (${rating || "4.8"}/5). Chaque chiffre a une animation de compteur au scroll. Texte blanc sur fond sombre.

### 9. #process
Processus en 4 étapes numérotées, spécifiques au secteur ${businessType} :
${processContent}
Chaque étape a une icône et une description. Animation slide-in séquentielle.

### 10. #guarantees
Garanties et engagements (4 cartes) spécifiques au métier ${businessType} :
${guaranteesContent}
Chaque carte avec icône Lucide et bordure colorée. Animation fade-in au scroll.

### 11. #gallery
Galerie photos (**6 images exactement**) : **IMAGES RÉELLES ET SPÉCIFIQUES au métier**. Chaque image doit montrer un travail réel du ${businessType}, pas des stock photos génériques. Pour un plombier : installation de tuyauterie, réparation fuite, salle de bain rénovée, chaudière installée, tuyauterie cuivre, salle de bain moderne. Pour un restaurant : plats servis, cuisine en action, salle dressée, entrées, desserts, buffet. Pour un coiffeur : réalisations de coiffure, salon intérieur, avant/après, colorations, coiffures mariage, barbe. Layout **grille 2 lignes de 3 images** (3 colonnes sur desktop, 2 sur mobile, 1 sur petit écran). Pas de vide, pas d'image isolée — toujours 6 images/remplacées par des placeholders élégants avec nom du business et icône du métier sur fond coloré léger. **JAMAIS** de photos de maisons génériques, d'intérieurs de luxe non liés au métier, ou de paysages. Animation hover avec zoom subtil (transform: scale(1.05)). Fond avec motif discret.

### 12. #testimonials
Avis clients (6 cartes minimum) avec contenu complet et crédible, **spécifiques au métier de ${businessType}**. Note Google globale : ${rating || "4.8"}/5 avec ${reviewCount} avis. Exemples d'avis :
${testimonialsContent}
Chaque carte a un avatar, nom, étoiles, et date. Animation carousel ou grille responsive.

### 13. #faq
FAQ avec **8 questions/réponses** spécifiques au secteur ${businessType} et à ${b.name}. **Layout 2 colonnes** sur desktop (4 questions par colonne), 1 colonne sur mobile. Chaque question est un accordéon avec animation smooth (hauteur max, rotation de l'icône chevron). Style : bordure arrondie, ombre légère, hover avec fond bleu clair. Exemples :
${isRestaurant ? '- "Quels sont vos horaires ?" — "Nous ouvrons du lundi au samedi de 12h à 14h30 et de 19h à 22h30. Fermé le dimanche."\n- "Faut-il réserver ?" — "La réservation est conseillée le week-end, mais nous accueillons aussi les venues spontanées."\n- "Proposez-vous des menus végétariens ?" — "Oui, nous avons une sélection de plats végétariens et vegan qui changent régulièrement."\n- "Avez-vous un parking ?" — "Un parking payant est disponible à 50m, et des places de stationnement gratuit sont sur la rue."\n- "Livrez-vous à domicile ?" — "Oui, nous livrons dans un rayon de 3km via notre service partenaire."\n- "Acceptez-vous les cartes bancaires ?" — "Oui, nous acceptons toutes les cartes bancaires, espèces et tickets restaurant."' : isPharmacy ? '- "Quels sont vos horaires ?" — "Ouvert du lundi au samedi de 9h à 20h. Pharmacie de garde le dimanche matin."\n- "Livrez-vous les médicaments ?" — "Oui, livraison gratuite pour les personnes de plus de 65 ans ou à mobilité réduite."\n- "Faut-il une ordonnance ?" — "Pour les médicaments sur ordonnance, oui. Pour les produits de parapharmacie, non."\n- "Proposez-vous des tests COVID ?" — "Oui, tests rapides antigéniques disponibles sans rendez-vous, résultat en 15 minutes."\n- "Acceptez-vous la carte vitale ?" — "Oui, nous sommes équipés du lecteur de carte vitale et carte mutuelle."\n- "Avez-vous des parking à proximité ?" — "Un parking public est disponible à 100m de la pharmacie."' : isHairdresser ? '- "Faut-il prendre rendez-vous ?" — "Oui, nous recommandons vivement la réservation en ligne ou par téléphone."\n- "Quels produits utilisez-vous ?" — "Nous utilisons exclusivement des marques professionnelles : L\'Oréal, Kérastase, Moroccanoil."\n- "Combien de temps dure une coupe ?" — "Une coupe femme dure environ 45min, une coupe homme 30min, une coloration 1h30."\n- "Proposez-vous des coiffures mariage ?" — "Oui, nous créons des coiffures sur mesure pour votre mariage. Essai conseillé 1 mois avant."\n- "Avez-vous un parking ?" — "Des places de stationnement sont disponibles à proximité immédiate du salon."\n- "Quels sont vos tarifs ?" — "Nos tarifs commencent à 25€ pour une coupe homme. Demandez un devis personnalisé."' : '- "Quels sont vos horaires ?" — "Ouvert du lundi au vendredi de 8h à 18h, et le samedi de 9h à 13h."\n- "Proposez-vous des devis gratuits ?" — "Oui, tous nos devis sont gratuits et sans engagement. Contactez-nous !"\n- "Intervenez-vous en urgence ?" — "Oui, nous avons un service d\'urgence joignable 7j/7."\n- "Quel est votre délai d\'intervention ?" — "En moyenne, nous intervenons sous 24 à 48h selon la nature de l\'intervention."\n- "Quelles zones couvrez-vous ?" — "Nous intervenons dans tout ' + city + ' et ses environs dans un rayon de 30km."\n- "Acceptez-vous les cartes bancaires ?" — "Oui, nous acceptons toutes les cartes bancaires, chèques et virements."'}
Animation accordéon smooth.

### 14. #cta-banner
Bannière CTA finale "${lang === 'ar' ? 'عرض أسعار مجاني بدون التزام' : lang === 'en' ? 'Free quote with no obligation' : 'Devis gratuit sans engagement'}" avec fond dégradé coloré, bouton prominent ${lang === 'ar' ? '"طلب عرض سعر"' : lang === 'en' ? '"Get a quote"' : '"Demander un devis"'} et numéro de téléphone. Animation pulse subtile sur le bouton.

### 15. #contact
Section Contact avec **deux colonnes égales** sur desktop (infos à gauche, formulaire à droite) — **jamais de vide** sous la carte d'infos. Les infos pratiques (téléphone, email, adresse, horaires) sont dans une carte avec icônes, et le formulaire est juste à côté. **PAS de site web** dans les infos de contact — uniquement : téléphone cliquable (${phone}), email (${email}), adresse complète (${address || city}), horaires (${hours || "Lun-Sam 9h-19h"}). Google Maps intégré en plein dessous (largeur 100%, hauteur 300px). Validation côté client HTML5.

### 16. #footer
Footer professionnel en 3 colonnes (1 colonne sur mobile) :
- **Colonne 1** : Logo en texte (${b.name}), description courte du business
- **Colonne 2** : Liens rapides (${lang === 'ar' ? 'الرئيسية، الخدمات، الاتصال، الإشعارات القانونية، سياسة الخصوصية' : lang === 'en' ? 'Home, Services, Contact, Legal Notices, Privacy Policy' : 'Accueil, Services, Contact, Mentions légales, Politique de confidentialité'})
- **Colonne 3** : Contact (téléphone, email, adresse — **PAS de site web**), Note Google visible : ★★★★★ ${rating || "4.8"}/5 (${reviewCount} avis), Horaires
- **Copyright** : © 2026 ${b.name}. ${lang === 'ar' ? 'جميع الحقوق محفوظة.' : lang === 'en' ? 'All rights reserved.' : 'Tous droits réservés.'}
${lang === 'ar' ? 'جميع المواعيد متطابقة مع الأقسام الأخرى.' : lang === 'en' ? 'All hours identical to other sections.' : 'Tous les horaires identiques aux autres sections.'}

**Pages obligatoires fonctionnelles (modales avec bouton X FONCTIONNEL pour fermer) :**
- Mentions légales : contenu professionnel long, normes légales locales respectées (éditeur, hébergeur, droits d'auteur, RGPD${lang === 'ar' ? '/RGPD' : ''}). La modale doit avoir un bouton X en haut à droite qui ferme la modale au clic (addEventListener sur le bouton X et sur l'overlay sombre).
- Politique de confidentialité : contenu professionnel long, conforme RGPD (données collectées, finalités, droits, cookies, durée de conservation). Même système de fermeture que les mentions légales.
- **IMPORTANT** : Le bouton X et l'overlay sombre DOIVENT être fonctionnels — ajouter le JavaScript nécessaire pour ouvrir/fermer les modales (classList.toggle, event listeners).

### 17. #float-btn
Bouton flottant en bas à droite : icône téléphone avec animation pulse, lien tel:${phone}. Visible sur toutes les pages, toujours au premier plan.

---

## Animations et Décoration Professionnelles

Chaque section inclut :
- **Fade-in sur scroll** pour les textes et cartes (IntersectionObserver)
- **Parallaxe légère** sur les images de fond (performance optimisée)
- **Hover subtil** sur les boutons, cartes et liens (transform, shadow)
- **Motifs ou formes géométriques** de fond (SVG ou CSS) — discrets, non intrusifs, alignés à la palette couleur
- **Transitions fluides** entre les sections (0.3s ease)
- Aucune animation n'impacte la performance (lazy-load les ressources lourdes)
- Si un élément est plus petit que la section, le mettre en scrolling dans la section

---

## Code à Produire

Produis un **fichier HTML complet** contenant :
- **DOCTYPE HTML5** valide et complet
- **Head** : meta tags (charset, viewport, title, description, OG), Google Fonts (Inter + Playfair Display), Lucide Icons CDN
- **Body** : toutes les 17 sections listées ci-dessus, imbriquées correctement
- **Style** : style interne avec variables CSS (:root pour couleurs, polices, espacements), responsive à 480px / 768px / 1200px, animations fluides
- **Script** : script interne vanilla JavaScript : smooth scroll, form validation, lazy-load, animations on scroll (IntersectionObserver), compteurs animés, accordéon FAQ, marquee
- **Forms** : validation côté client (HTML5) + structure prête pour intégration backend (action, method, CSRF token si nécessaire)

Aucune dépendance externe sauf Google Fonts et Lucide Icons (CDN seulement).

---

## Priorités de Qualité

1. **Authenticité** : chaque mot, chaque détail vient des données réelles de ${b.name} (voir section "Données du Client" ci-dessus), jamais de contenu générique
2. **Professionnel** : design moderne, animations subtiles, pas de clichés
3. **Fonctionnel** : tous les formulaires marchent, tous les liens fonctionnent, 100% responsive
4. **Rapide** : lazy-load, CSS optimisé, JS minimaliste
5. **Légal** : pages de policy complètes et conformes, formulaires avec consentement RGPD

**IMPORTANT** : Tu as TOUTES les données du client dans la section "Données du Client — À Utiliser Directement" au début de ce prompt. Utilise ces données RÉELLES dans CHAQUE section du site. Jamais de texte générique, jamais de placeholder, jamais de "à compléter".

Livre le site **prêt à être mis en ligne** — le client ne doit rien ajouter, rien corriger. Le site doit faire partie intégrante de l'agence ${b.name}, pas un template IA basique.`;
}
