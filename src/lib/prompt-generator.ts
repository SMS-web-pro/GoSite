import type { ScrapedBusiness } from "./types";

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
  | "followup"
  | "followup_2"
  | "demo"
  | "ask_offer"
  | "quote"
  | "deposit"
  | "payment_received"
  | "progress_update"
  | "preview"
  | "confirm_changes"
  | "final_payment"
  | "delivery"
  | "checkin"
  | "referral"
  | "has_website"
  | "not_interested"
  | "too_expensive"
  | "cheaper";

export type LangKey = "fr" | "en" | "ar";
export type BilingualTemplate = Record<LangKey, string>;

// ============================================================
// CURRENCY DETECTION — matches language detection
// ============================================================
/**
 * @deprecated Use campaign currency instead. This is a fallback only.
 * The campaign's language/currency setting should always take priority.
 */
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
  intro: {
    fr: `Bonjour {{firstName}} 👋

Je suis passé par {{businessName}} sur Google et j'ai vu que vous avez une excellente réputation avec {{rating}} ⭐ et {{reviewCount}} avis.

J'ai créé un concept de site web rapide spécialement pour votre commerce.

Voulez-vous que je vous envoie l'aperçu ?

Aucune pression — je pensais simplement que ça pourrait être utile pour votre activité.

— {{contact_name}}
{{agency_name}}`,

    en: `Hi {{firstName}} 👋

I came across {{businessName}} on Google and noticed you have a great reputation with {{rating}} ⭐ and {{reviewCount}} reviews.

I also noticed you don't currently have a dedicated website, so I put together a quick website concept specifically for {{businessName}}.

Would you like me to send you the preview?

No pressure at all — I just thought it might be useful for your business.

— {{contact_name}}
{{agency_name}}`,

    ar: `مرحبا {{firstName}} 👋

لاحظت أن {{businessName}} لديها سمعة ممتازة على Google مع {{rating}} ⭐ و{{reviewCount}} تقييم.

لاحظت أيضاً أن ليس لديكم موقع ويب مخصص، لذلك أعددت مفهوم موقع ويب سريع خصيصاً لـ {{businessName}}.

هل تريد أن أرسل لك المعاينة؟

لا ضغط — فقط أردت أن أكون مفيداً لنشاطك.

— {{contact_name}}
{{agency_name}}`,
  },

  followup: {
    fr: `Bonjour {{firstName}} 👋

Je me permets de revenir vers vous concernant mon message précédent.

J'ai créé un concept de site web spécialement pour {{businessName}} basé sur votre activité et vos services.

Si vous souhaitez le voir, je peux vous envoyer l'aperçu ici.

Si ce n'est pas votre truc, pas de souci. 👍

— {{contact_name}}`,

    en: `Hi {{firstName}} 👋

Just following up on my previous message.

I created a quick website concept specifically for {{businessName}} based on your business and services.

If you'd like to see it, I can send the preview here.

If you're not interested, no worries at all. 👍

— {{contact_name}}`,

    ar: `مرحبا {{firstName}} 👋

مجرد متابعة لرسالتي السابقة.

لقد أعددت مفهوم موقع ويب خصيصاً لـ {{businessName}} بناءً على نشاطك وخدماتك.

إذا كنت تريد رؤيته، يمكنني إرسال المعاينة هنا.

إذا لم تكن مهتماً، لا مشكلة. 👍

— {{contact_name}}`,
  },

  followup_2: {
    fr: `Bonjour {{firstName}},

Je ferai de ceci mon dernier message pour ne pas vous déranger.

J'ai préparé un concept de site web pour {{businessName}} et je serais ravi de vous l'envoyer si vous souhaitez y jeter un œil.

Si ce n'est pas quelque chose qui vous intéresse, aucun problème.

Belle journée ! 👍

— {{contact_name}}`,

    en: `Hi {{firstName}},

I'll make this my last follow-up so I don't bother you.

I prepared a website concept for {{businessName}} and I'm happy to send it over if you'd like to take a look.

If it's not something you're interested in, no problem at all.

Have a great day! 👍

— {{contact_name}}`,

    ar: `مرحبا {{firstName}}،

سأجعل هذه آخر رسالة حتى لا أزعجك.

لقد أعددت مفهوم موقع ويب لـ {{businessName}} ويسعدني إرساله إليك إذا كنت تريد الاطلاع عليه.

إذا لم يكن شيئاً تهتم به، لا مشكلة على الإطلاق.

أتمنى لك يوماً رائعاً! 👍

— {{contact_name}}`,
  },

  demo: {
    fr: `Absolument ! 👋

Voici le concept de site web personnalisé que j'ai créé pour {{businessName}} :

👉 {{demo_url}}

Je l'ai conçu spécifiquement autour de votre activité, vos services et votre zone locale.

Il comprend :

• 📱 Design responsive (mobile)
• 📞 Options d'appel/contact
• 💬 WhatsApp
• ⭐ Avis Google
• 📍 Zones de service
• 📝 Formulaire de devis/contact

C'est juste un aperçu pour l'instant.

Regardez et dites-moi ce que vous en pensez. J'aimerais vraiment avoir votre retour 😊

— {{contact_name}}`,

    en: `Absolutely! 👋

Here's the personalized website concept I created for {{businessName}}:

👉 {{demo_url}}

I designed it specifically around your business, services and local area.

It includes:

• 📱 Mobile-friendly design
• 📞 Call/contact options
• 💬 WhatsApp
• ⭐ Google reviews
• 📍 Service areas
• 📝 Quote/contact form

This is just a preview for now.

Take a look and let me know what you think. I'd genuinely love your feedback 😊

— {{contact_name}}`,

    ar: `بالتأكيد! 👋

إليك مفهوم الموقع المخصص الذي أعدتاه لـ {{businessName}}:

👉 {{demo_url}}

صممته خصيصاً حول نشاطك ومنطقتك وخدماتك.

يتضمن:

• 📱 تصميم متوافق مع الجوال
• 📞 خيارات الاتصال
• 💬 WhatsApp
• ⭐ تقييمات Google
• 📍 مناطق الخدمة
• 📝 نموذج طلب عرض سعر

هذه مجرد معاينة الآن.

انظر وأخبرني برأيك. أريد حقاً سماع ملاحظاتك 😊

— {{contact_name}}`,
  },

  ask_offer: {
    fr: `Je suis content que ça vous plaise ! 😊

Je peux tout personnaliser avec vos véritables informations commerciales, photos, logo, services, avis et toutes les modifications que vous souhaitez.

Je peux également m'occuper de la configuration et du lancement pour vous.

Voulez-vous que je vous envoie les détails du pack et le tarif ?`,

    en: `I'm glad you like it! 😊

I can customize everything with your actual business information, photos, logo, services, reviews and any changes you'd like.

I can also take care of the setup and launch for you.

Would you like me to send you the package details and pricing?`,

    ar: `يسعدني أن يكون ذلكعجبك! 😊

يمكنني تخصيص كل شيء بمعلومات عملك الحقيقية وصورك وشعارك وخدماتك وتقييماتك وأي تغييرات تريدها.

كما يمكنني الاعتناء بالإعداد والlaunch لك.

هل تريد أن أرسل لك تفاصيل الحزمة والأسعار؟`,
  },

  quote: {
    fr: `Pour {{businessName}}, je peux transformer le concept en un site web professionnel complet pour {{price}}.

Le pack comprend :

✅ Site web responsive personnalisé
✅ Optimisation mobile + desktop
✅ Services et zones de service
✅ Formulaire de devis/contact
✅ Bouton d'appel
✅ Bouton WhatsApp
✅ Google Maps
✅ Section avis Google
✅ SEO local de base
✅ SSL / HTTPS
✅ 1 an d'hébergement

Livraison estimée : 3 à 5 jours ouvrés.

Pour commencer, l'acompte est de {{price_deposit}}.
Le solde de {{price_final}} est dû avant le lancement final.

Si ça vous convient, je peux vous envoyer le lien de paiement sécurisé.`,

    en: `For {{businessName}}, I can turn the concept into a complete professional website for {{price}}.

The package includes:

✅ Custom responsive website
✅ Mobile + desktop optimization
✅ Services & service areas
✅ Contact/quote form
✅ Call button
✅ WhatsApp button
✅ Google Maps
✅ Google reviews section
✅ Basic local SEO
✅ SSL / HTTPS
✅ 1 year hosting

Estimated delivery: 3–5 business days.

To get started, the initial deposit is {{price_deposit}}.
The remaining {{price_final}} is due before the final launch.

If that works for you, I can send you the secure payment link.`,

    ar: `لـ {{businessName}}، يمكنني تحويل المفهوم إلى موقع ويب احترافي كامل مقابل {{price}}.

الحزمة تشمل:

✅ موقع ويب متجاوب مخصص
✅ تحسين الجوال + سطح المكتب
✅ الخدمات ومناطق الخدمة
✅ نموذج طلب عرض سعر/اتصال
✅ زر الاتصال
✅ زر WhatsApp
✅ Google Maps
✅ قسم تقييمات Google
✅ تحسين محلي أساسي
✅ SSL / HTTPS
✅ سنة واحدة من الاستضافة

التسليم المقدر: 3-5 أيام عمل.

للبدء، الدفعة الأولى هي {{price_deposit}}.
الرصيد المتبقي {{price_final}} مستحق قبل الإطلاق النهائي.

إذا كان ذلك مناسباً، يمكنني إرسال رابط الدفع الآمن لك.`,
  },

  deposit: {
    fr: `Parfait ! 🙌

L'acompte est de {{price_deposit}}.

Vous pouvez effectuer le paiement de manière sécurisée ici :

👉 {{payment_deposit_url}}

Une fois le paiement confirmé, je vous envoie les détails d'intégration courts et je commence à préparer votre site.

Merci ! 🙏`,

    en: `Perfect! 🙌

The initial deposit is {{price_deposit}}.

You can make the payment securely here:

👉 {{payment_deposit_url}}

Once the payment is confirmed, I'll send you the short onboarding details and start preparing your website.

Thank you! 🙏`,

    ar: `مثالي! 🙌

الدفعة الأولى هي {{price_deposit}}.

يمكنك إجراء الدفع بشكل آمن هنا:

👉 {{payment_deposit_url}}

بمجرد تأكيد الدفع، سأرسل لك تفاصيل التأهيل القصيرة وأبدأ في تحضير موقعك.

شكراً! 🙏`,
  },

  payment_received: {
    fr: `Bonjour {{firstName}} 👋

Paiement reçu — merci pour votre confiance ! 🙏

Nous commençons officiellement le site de {{businessName}}.

Veuillez m'envoyer ce qui suit quand ce sera possible :

📌 Logo
📌 Numéro de téléphone
📌 Email du commerce
📌 Services
📌 Zones de service
📌 Horaires d'ouverture
📌 Photos
📌 Courte description de l'activité
📌 Liens réseaux sociaux
📌 Nom de domaine, si vous en possédez déjà un

Vous pouvez tout envoyer ici, un élément à la fois.

Je m'occupe du reste. 👍`,

    en: `Hi {{firstName}} 👋

Payment received — thank you for your trust! 🙏

We're officially getting started with {{businessName}}'s website.

Please send me the following whenever convenient:

📌 Logo
📌 Business phone number
📌 Business email
📌 Services
📌 Service areas
📌 Business hours
📌 Photos
📌 Short business description
📌 Social media links
📌 Domain name, if you already own one

You can send everything here, one item at a time.

I'll take care of the rest. 👍`,

    ar: `مرحبا {{firstName}} 👋

تم استلام الدفع — شكراً على ثقتك! 🙏

بدأتنا رسمياً موقع {{businessName}}.

يرجى إرسال ما يلي متى أمكن:

📌 شعار
📌 رقم هاتف العمل
📌 بريد إلكتروني للعمل
📌 الخدمات
📌 مناطق الخدمة
📌 ساعات العمل
📌 صور
📌 وصف قصير للنشاط
📌 روابط وسائل التواصل الاجتماعي
📌 اسم النطاق، إذا كان لديك بالفعل

يمكنك إرسال كل شيء هنا، عنصر واحد في كل مرة.

سأتولى الباقي. 👍`,
  },

  progress_update: {
    fr: `Bonjour {{firstName}} 👋

Mise à jour rapide : votre site web est en cours de finalisation.

Je travaille sur le contenu, l'expérience mobile et les détails finaux pour {{businessName}}.

Je vous envoie l'aperçu dès qu'il sera prêt pour votre validation. 👍`,

    en: `Hi {{firstName}} 👋

Quick update: your website is currently being finalized.

I'm working on the content, mobile experience and final details for {{businessName}}.

I'll send you the preview as soon as it's ready for your review. 👍`,

    ar: `مرحبا {{firstName}} 👋

تحديث سريع: موقعك قيد الإنهاء الآن.

أعمل على المحتوى وتجربة الجوال والتفاصيل النهائية لـ {{businessName}}.

سأرسل لك المعاينة بمجرد أن تكون جاهزة للمراجعة. 👍`,
  },

  preview: {
    fr: `Bonjour {{firstName}} 👋

Votre site web est prêt pour révision ! 🎉

👉 {{preview_url}}

Veuillez le regarder sur votre téléphone et votre ordinateur si possible.

Si vous souhaitez des modifications, envoyez-les-moi ici et je m'en occupe.

Votre pack comprend {{revisionCount}} tours de révisions.

Une fois que tout vous convient, nous procéderons au lancement final.`,

    en: `Hi {{firstName}} 👋

Your website is ready for review! 🎉

👉 {{preview_url}}

Please take a look on both your phone and computer if possible.

If you'd like any changes, send them to me here and I'll take care of them.

Your package includes {{revisionCount}} rounds of revisions.

Once everything looks good to you, we'll proceed with the final launch.`,

    ar: `مرحبا {{firstName}} 👋

موقعك جاهز للمراجعة! 🎉

👉 {{preview_url}}

يرجى الاطلاع عليه على هاتفك و电脑 إذا أمكن.

إذا كنت تريد أي تغييرات، أرسلها إلي هنا وسأتولاها.

حزمة تشمل {{revisionCount}} جولات من المراجعات.

بمجرد أن يبدو كل شيء جيداً لك، سنتقدم بالإطلاق النهائي.`,
  },

  confirm_changes: {
    fr: `Absolument 👍

J'ai noté les modifications suivantes :

• {{change1}}
• {{change2}}
• {{change3}}

Je mettrai à jour et vous enverrai la version révisée pour validation.`,

    en: `Absolutely 👍

I've noted the following changes:

• {{change1}}
• {{change2}}
• {{change3}}

I'll update these and send you the revised version for approval.`,

    ar: `بالتأكيد 👍

لقد لاحظت التغييرات التالية:

• {{change1}}
• {{change2}}
• {{change3}}

سأقوم بتحديث هذه وإرسال النسخة المعدّلة للموافقة.`,
  },

  final_payment: {
    fr: `Bonjour {{firstName}} 👋

Super — je suis content que vous soyez satisfait du site ! 🙌

Tout est maintenant validé et prêt pour le lancement final.

Le solde restant est de {{price_final}}.

Vous pouvez finaliser le paiement de manière sécurisée ici :

👉 {{payment_final_url}}

Une fois le paiement confirmé, je procéderai au lancement final et à la connexion du domaine.

Merci encore ! 🙏`,

    en: `Hi {{firstName}} 👋

Great — I'm glad you're happy with the website! 🙌

Everything is now approved and ready for the final launch.

The remaining balance is {{price_final}}.

You can complete the payment securely here:

👉 {{payment_final_url}}

Once the payment is confirmed, I'll proceed with the final launch and domain connection.

Thank you again! 🙏`,

    ar: `مرحبا {{firstName}} 👋

رائع — يسعدني أن تكون سعيداً بالموقع! 🙌

تمت الموافقة على كل شيء والготовة للإطلاق النهائي.

الرصيد المتبقي هو {{price_final}}.

يمكنك إكمال الدفع بشكل آمن هنا:

👉 {{payment_final_url}}

بمجرد تأكيد الدفع، سأ proceeded by الإطلاق النهائي واتصال النطاق.

شكراً مرة أخرى! 🙏`,
  },

  delivery: {
    fr: `🎉 Votre site est en ligne !

Bonjour {{firstName}} 👋

Le nouveau site de {{businessName}} est maintenant en ligne :

👉 {{final_url}}

Tout a été vérifié :

✅ Mobile + desktop
✅ HTTPS / SSL
✅ Formulaire de contact
✅ Bouton d'appel
✅ Bouton WhatsApp
✅ Google Maps
✅ Avis Google
✅ SEO local de base

Votre domaine vous appartient, et je reste disponible si vous avez besoin de mises à jour ou d'améliorations.

Félicitations pour votre nouveau site ! 🚀

— {{contact_name}}
{{agency_name}}`,

    en: `🎉 Your website is live!

Hi {{firstName}} 👋

The new website for {{businessName}} is now live:

👉 {{final_url}}

Everything has been checked:

✅ Mobile + desktop
✅ HTTPS / SSL
✅ Contact form
✅ Call button
✅ WhatsApp button
✅ Google Maps
✅ Google reviews
✅ Local SEO basics

Your domain remains yours, and I'm here if you need future updates or improvements.

Congratulations on your new website! 🚀

— {{contact_name}}
{{agency_name}}`,

    ar: `🎉 موقعك الآن مباشر!

مرحبا {{firstName}} 👋

موقع {{businessName}} الجديد الآن مباشر:

👉 {{final_url}}

تم التحقق من كل شيء:

✅ الجوال + سطح المكتب
✅ HTTPS / SSL
✅ نموذج الاتصال
✅ زر الاتصال
✅ زر WhatsApp
✅ Google Maps
✅ تقييمات Google
✅ تحسين محلي أساسي

نطاقك ملك لك، وأنا هنا إذا كنت تحتاج تحديثات أو تحسينات مستقبلية.

تهانينا على موقعك الجديد! 🚀

— {{contact_name}}
{{agency_name}}`,
  },

  checkin: {
    fr: `Bonjour {{firstName}} 👋

Juste pour vérifier que tout se passe bien avec votre nouveau site.

Est-ce que tout fonctionne bien pour vous ?

Si vous avez besoin de petits ajustements ou si vous avez des questions, n'hésitez pas à m'écrire à tout moment. 😊`,

    en: `Hi {{firstName}} 👋

Just checking in to make sure everything is going well with your new website.

Is everything working well for you?

If you need any small adjustments or have any questions, feel free to message me anytime. 😊`,

    ar: `مرحبا {{firstName}} 👋

مجرد للتأكد من أن كل شيء يسير بشكل جيد مع موقعك الجديد.

هل كل شيء يعمل بشكل جيد لديك؟

إذا كنت تحتاج أي تعديلات صغيرة أو لديك أي أسئلة، لا تتردد في مراسلتي في أي وقت. 😊`,
  },

  referral: {
    fr: `C'est super à entendre ! 🙏

Merci encore de m'avoir fait confiance pour {{businessName}}.

Si vous connaissez un autre commerçant local qui pourrait bénéficier d'un site web professionnel, je serais ravi de l'aider également.

S'il devient client grâce à votre recommandation, je vous offrirai {{referral_reward}} en guise de remerciement.

Merci beaucoup pour votre soutien ! 🤝`,

    en: `That's great to hear! 🙏

Thank you again for trusting me with {{businessName}}.

If you know another local business owner who could benefit from a professional website, I'd be happy to help them as well.

If they become a client through your referral, I'll give you {{referral_reward}} as a thank-you.

Really appreciate your support! 🤝`,

    ar: `يسعدني سماع ذلك! 🙏

شكراً مرة أخرى على ثقتك في {{businessName}}.

إذا كنت تعرف صاحب عمل محلي آخر يمكن أن يستفيد من موقع ويب احترافي، يسعدني مساعدته أيضاً.

إذا أصبح عميلاً من خلال توصيتك، سأعطيك {{referral_reward}} كشكر.

أقدّر دعمك حقاً! 🤝`,
  },

  has_website: {
    fr: `Absolument, aucun problème ! 👍

Si vous êtes satisfait de votre site actuel, c'est super.

Je vous ai contacté car {{businessName}} ne semblait pas avoir de site web dédié sur Google.

Merci de m'avoir répondu, et je vous souhaite une continue réussite !`,

    en: `Absolutely, no problem! 👍

If you're happy with your current website, that's great.

I originally reached out because I noticed {{businessName}} didn't appear to have a dedicated website on Google.

Thanks for getting back to me, and I wish you continued success!`,

    ar: `بالتأكيد، لا مشكلة! 👍

إذا كنت سعيداً بموقعك الحالي، فهذا رائع.

لقد تواصلت في الأصل لأنني لاحظت أن {{businessName}} لا يبدو أن لديها موقع ويب مخصص على Google.

شكراً لتواصلك معي، وأتمنى لك النجاح المستمر!`,
  },

  not_interested: {
    fr: `Pas de souci du tout ! 👍

Merci de m'en avoir informé, et je vous souhaite ainsi qu'à {{businessName}} une continue réussite.

Belle journée !`,

    en: `No worries at all! 👍

Thanks for letting me know, and I wish you and {{businessName}} continued success.

Have a great day!`,

    ar: `لا مشكلة على الإطلاق! 👍

شكراً لإبلاغي، وأتمنى لك ولـ {{businessName}} النجاح المستمر.

أتمنى لك يوماً رائعاً!`,
  },

  too_expensive: {
    fr: `Je comprends tout à fait.

Les {{price}} couvrent la création complète du site, la personnalisation, l'optimisation mobile, le SEO local de base, l'hébergement et le lancement.

Si vous le souhaitez, je peux également vous expliquer exactement ce qui est inclus pour que vous puissiez décider si cela a du sens pour votre activité.

Aucune pression dans un sens ou dans l'autre. 👍`,

    en: `I completely understand.

The {{price}} covers the complete website setup, customization, mobile optimization, local SEO basics, hosting and launch.

If you'd like, I can also explain exactly what's included so you can decide whether it makes sense for your business.

No pressure either way. 👍`,

    ar: `أتفهم تماماً.

{{price}} تغطي إعداد الموقع الكامل والتخصيص وتحسين الجوال وتحسين محلي الأساسي والاستضافة والإطلاق.

إذا كنت ترغب، يمكنني أيضاً شرح ما هو مشمول بالضبط حتى تقرر ما إذا كان مناسباً لعملك.

لا ضغط بأي شكل من الأشكال. 👍`,
  },

  cheaper: {
    fr: `Je comprends 👍

{{price}} est déjà mon tarif de lancement pour le pack complet.

Je préfère garder un prix clair plutôt que de supprimer des parties importantes du site juste pour le rendre moins cher.

Si vous souhaitez avancer, je m'assurerai que vous obteniez le meilleur résultat possible dans ce pack.`,

    en: `I understand 👍

{{price}} is already my introductory price for the complete package.

I prefer to keep the price straightforward rather than remove important parts of the website just to make it cheaper.

If you'd like to move forward, I'll make sure you get the best possible result within that package.`,

    ar: `أفهم 👍

{{price}} هي بالفعل سعر_introductory للحزمة الكاملة.

أفضل الحفاظ على السعر بدلاً من إزالة أجزاء مهمة من الموقع فقط لجعله أقل سعراً.

إذا كنت ت想iola التقدم، سأتأكد من حصولك على أفضل نتيجة ممكنة في هذه الحزمة.`,
  },
};

export const DEFAULT_TEMPLATES_FALLBACK = DEFAULT_TEMPLATES;

// Backward-compat alias


/**
 * @deprecated Use campaign language instead. This is a fallback only.
 * The campaign's language setting should always take priority.
 */
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
    followup: { fr: DEFAULT_TEMPLATES.followup.fr, en: DEFAULT_TEMPLATES.followup.en, ar: DEFAULT_TEMPLATES.followup.ar },
    followup_2: { fr: DEFAULT_TEMPLATES.followup_2.fr, en: DEFAULT_TEMPLATES.followup_2.en, ar: DEFAULT_TEMPLATES.followup_2.ar },
    demo: { fr: DEFAULT_TEMPLATES.demo.fr, en: DEFAULT_TEMPLATES.demo.en, ar: DEFAULT_TEMPLATES.demo.ar },
    ask_offer: { fr: DEFAULT_TEMPLATES.ask_offer.fr, en: DEFAULT_TEMPLATES.ask_offer.en, ar: DEFAULT_TEMPLATES.ask_offer.ar },
    quote: { fr: DEFAULT_TEMPLATES.quote.fr, en: DEFAULT_TEMPLATES.quote.en, ar: DEFAULT_TEMPLATES.quote.ar },
    deposit: { fr: DEFAULT_TEMPLATES.deposit.fr, en: DEFAULT_TEMPLATES.deposit.en, ar: DEFAULT_TEMPLATES.deposit.ar },
    payment_received: { fr: DEFAULT_TEMPLATES.payment_received.fr, en: DEFAULT_TEMPLATES.payment_received.en, ar: DEFAULT_TEMPLATES.payment_received.ar },
    progress_update: { fr: DEFAULT_TEMPLATES.progress_update.fr, en: DEFAULT_TEMPLATES.progress_update.en, ar: DEFAULT_TEMPLATES.progress_update.ar },
    preview: { fr: DEFAULT_TEMPLATES.preview.fr, en: DEFAULT_TEMPLATES.preview.en, ar: DEFAULT_TEMPLATES.preview.ar },
    confirm_changes: { fr: DEFAULT_TEMPLATES.confirm_changes.fr, en: DEFAULT_TEMPLATES.confirm_changes.en, ar: DEFAULT_TEMPLATES.confirm_changes.ar },
    final_payment: { fr: DEFAULT_TEMPLATES.final_payment.fr, en: DEFAULT_TEMPLATES.final_payment.en, ar: DEFAULT_TEMPLATES.final_payment.ar },
    delivery: { fr: DEFAULT_TEMPLATES.delivery.fr, en: DEFAULT_TEMPLATES.delivery.en, ar: DEFAULT_TEMPLATES.delivery.ar },
    checkin: { fr: DEFAULT_TEMPLATES.checkin.fr, en: DEFAULT_TEMPLATES.checkin.en, ar: DEFAULT_TEMPLATES.checkin.ar },
    referral: { fr: DEFAULT_TEMPLATES.referral.fr, en: DEFAULT_TEMPLATES.referral.en, ar: DEFAULT_TEMPLATES.referral.ar },
    has_website: { fr: DEFAULT_TEMPLATES.has_website.fr, en: DEFAULT_TEMPLATES.has_website.en, ar: DEFAULT_TEMPLATES.has_website.ar },
    not_interested: { fr: DEFAULT_TEMPLATES.not_interested.fr, en: DEFAULT_TEMPLATES.not_interested.en, ar: DEFAULT_TEMPLATES.not_interested.ar },
    too_expensive: { fr: DEFAULT_TEMPLATES.too_expensive.fr, en: DEFAULT_TEMPLATES.too_expensive.en, ar: DEFAULT_TEMPLATES.too_expensive.ar },
    cheaper: { fr: DEFAULT_TEMPLATES.cheaper.fr, en: DEFAULT_TEMPLATES.cheaper.en, ar: DEFAULT_TEMPLATES.cheaper.ar },
  };
}

/**
 * Generate the bilingual Vibecoder prompt — based on the original but
 * with stronger personalization guidance.
 */
export function generateVibecoderPrompt(b: ScrapedBusiness, campaignLanguage?: string): string {
  const sector = b.subcategory || b.category || "business local";
  const city = b.city || b.postcode || "votre ville";
  const address = [b.housenumber, b.street, b.postcode, b.city]
    .filter(Boolean)
    .join(", ");
  const phone = b.phone || "";
  const phoneClean = phone.replace(/[^0-9]/g, "");
  const email = b.email || "";
  const hours = b.openingHours || "";
  const rating = b.rating || "";
  const reviewsCount = b.reviewsCount || "";
  const cuisine = b.cuisine || "";
  const description = b.description || "";
  const website = b.website || "";
  const wikipedia = b.wikipedia || "";
  const facebook = b.facebook || "";
  const instagram = b.instagram || "";
  const twitter = b.twitter || "";
  const linkedin = b.linkedin || "";
  const googleMapsUrl = b.googleMapsUrl || "";
  const subcategory = b.subcategory || "";
  const country = b.country || "";
  const lang = campaignLanguage || detectProspectLanguage(country, city);

  const hasDelivery = b.delivery === "yes";
  const hasTakeaway = b.takeaway === "yes";
  const hasTerrace = b.outdoorSeating === "yes";
  const hasReservation = b.reservation === "yes";
  const hasWifi = b.wifi === "yes";
  const hasWheelchair = b.wheelchair === "yes";
  const hasParking = b.parking && b.parking !== "no";
  const hasAirCon = b.airConditioning === "yes";

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
${hasParking ? "- **Parking** : " + b.parking : ""}
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
