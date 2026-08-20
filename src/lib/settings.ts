import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { localStore } from "@/lib/local-store";

export type AppSettings = {
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
  whatsappConnectedAt: Date | null;
  whatsappCloudPhoneId: string | null;
  whatsappCloudAccessToken: string | null;
  whatsappCloudBusinessId: string | null;
  paymentLink: string | null;
  priceEUR: number | null;
  priceUSD: number | null;
  priceMAD: number | null;
  paymentLinkEUR: string | null;
  paymentLinkUSD: string | null;
  paymentLinkMAD: string | null;
  messageTemplates: {
    intro: string;
    demo: string;
    quote: string;
    payment_received: string;
    delivery: string;
    thanks: string;
    followup: string;
  } | null;
  brandColor: string;
  logoUrl: string | null;
  updatedAt: Date;
};

export type WhatsAppSession = {
  id: string;
  phone: string;
  name: string;
  connectedAt: Date;
};

const DEFAULT_SETTINGS: Omit<AppSettings, "id" | "updatedAt"> = {
  agencyName: "Mon Agence",
  contactName: "Votre Nom",
  contactEmail: null,
  contactPhone: null,
  websiteUrl: null,
  portfolioUrl: null,
  whatsappNumber: null,
  whatsappSessionId: null,
  whatsappSessionPhone: null,
  whatsappSessionName: null,
  whatsappConnectedAt: null,
  whatsappCloudPhoneId: null,
  whatsappCloudAccessToken: null,
  whatsappCloudBusinessId: null,
  paymentLink: null,
  priceEUR: 89900,
  priceUSD: 99900,
  priceMAD: 99900,
  paymentLinkEUR: null,
  paymentLinkUSD: null,
  paymentLinkMAD: null,
  messageTemplates: null,
  brandColor: "#2563eb",
  logoUrl: null,
};

const DEFAULT_TEMPLATES = {
  intro: `Bonjour {{firstName}} 👋

Je me permets de vous contacter car je suis tombé(e) sur votre {{sector}} à {{city}} et j'ai été vraiment impressionné(e) par ce que vous proposez{{#if rating}} (note {{rating}}/5 sur Google — bravo !){{/if}}{{#if cuisine}}, notamment votre cuisine {{cuisine}}{{/if}}.

J'ai remarqué que vous n'avez pas encore de site web, et c'est un vrai manque aujourd'hui : la majorité de vos futurs clients vous cherchent sur Google avant de venir.

👉 J'ai préparé **gratuitement** une démo personnalisée de ce que pourrait être votre site web professionnel. Vous la trouverez ici :
{{demo_url}}

Hâte d'avoir votre avis 😊
{{#if phone}}Si vous préférez qu'on en parle de vive voix : {{phone}}{{/if}}`,
  demo: `Comme promis, voici la démo personnalisée pour **{{name}}** :
🌐 {{demo_url}}

✨ Ce que j'ai mis en avant :
• Votre {{sector}} situé à {{city}}{{#if cuisine}}
• Votre spécialité {{cuisine}}{{/if}}{{#if rating}}
• Votre note {{rating}}/5 sur Google{{/if}}
• Un design moderne adapté à votre image
• Un bouton pour vous appeler en 1 clic{{#if openingHours}}
• Vos horaires : {{openingHours}}{{/if}}
• Une carte Google Maps intégrée

Le site est responsive (parfait sur mobile) et optimisé pour Google. Vous voyez ce que ça donnerait concrètement ?`,
  quote: `Suite à votre intérêt pour le site, voici ma proposition :

📦 **{{name}} — Site web professionnel clé en main**

💰 **Tarif : {{price}}**
{{features}}

Pour accepter et démarrer aujourd'hui :
💳 {{payment_url}}

⚠️ Cette offre est valable 7 jours. Au plaisir de travailler ensemble !`,
  delivery: `🎉 **Votre site est en ligne !**

Bonjour {{firstName}}, votre site web professionnel est désormais accessible à l'adresse :
🌐 {{final_site_url}}

✅ Hébergement inclus pour 1 an
✅ Domaine personnalisé
✅ Certificat SSL (sécurisé HTTPS)
✅ Optimisé pour Google

📊 Un petit guide PDF avec toutes les instructions pour le modifier vous-même est en pièce jointe.

N'hésitez pas si vous avez la moindre question, je reste disponible !
Belle continuation à {{name}} 🚀`,
  thanks: `Un grand merci {{firstName}} 🙏

Votre confiance me touche sincèrement. Quelques infos pour la suite :

📅 Je vous recontacte dans 3 mois pour voir comment se passe le site et s'il y a des ajustements à faire.

💌 Si dans votre entourage un commerce a besoin d'un site, n'hésitez pas à me recommander — je vous offrirai une réduction sur votre abonnement annuel en guise de remerciement.

Au plaisir, et encore merci !
Belle journée ☀️`,
  payment_received: `Bonjour {{firstName}} 👋

Bien reçu votre paiement, un grand merci pour votre confiance ! 🎉

Le développement et la mise en ligne du site web pour *{{name}}* sont désormais lancés.

Vous recevrez le lien final de votre site internet ici même sous *24h*.

Si vous avez la moindre question d'ici là, n'hésitez pas à me contacter.`,
  followup: `Bonjour {{firstName}} 👋

Je me permets de revenir vers vous au sujet de la démo de site web que je vous avais envoyée pour *{{name}}*.

Avez-vous eu le temps de la regarder ? Si ce n'est pas le bon moment, pas de souci — je peux aussi simplement vous appeler pour en discuter en 5 minutes.

Sinon, dites-moi ce qui vous ferait hésiter (budget, délais, fonctionnalités...) et j'adapte la proposition.`,
};

/**
 * Returns the app settings. Tries DB first, then local-store, then defaults.
 */
export async function getSettings(): Promise<AppSettings> {
  // Try DB first (persistent on Vercel)
  try {
    const [row] = await db.select().from(settings).limit(1);
    if (row) {
      // Sync to local-store for offline fallback
      localStore.saveSettings(row);
      return { ...DEFAULT_SETTINGS, ...row } as AppSettings;
    }
    // No settings row exists yet — create one with defaults
    const [created] = await db
      .insert(settings)
      .values({
        ...DEFAULT_SETTINGS,
        messageTemplates: DEFAULT_TEMPLATES,
      })
      .returning();
    localStore.saveSettings(created);
    return { ...DEFAULT_SETTINGS, ...created } as AppSettings;
  } catch (err) {
    // DB unreachable — try local-store
    const local = localStore.getSettings();
    if (local) {
      return {
        ...DEFAULT_SETTINGS,
        ...local,
        priceEUR: (local as any).priceEUR ?? DEFAULT_SETTINGS.priceEUR,
        priceUSD: (local as any).priceUSD ?? DEFAULT_SETTINGS.priceUSD,
        priceMAD: (local as any).priceMAD ?? DEFAULT_SETTINGS.priceMAD,
        paymentLinkEUR: (local as any).paymentLinkEUR ?? DEFAULT_SETTINGS.paymentLinkEUR,
        paymentLinkUSD: (local as any).paymentLinkUSD ?? DEFAULT_SETTINGS.paymentLinkUSD,
        paymentLinkMAD: (local as any).paymentLinkMAD ?? DEFAULT_SETTINGS.paymentLinkMAD,
      } as AppSettings;
    }
    // Last resort: return defaults
    const defaults = {
      id: 1,
      ...DEFAULT_SETTINGS,
      messageTemplates: DEFAULT_TEMPLATES,
      updatedAt: new Date(),
    };
    localStore.saveSettings(defaults);
    return defaults as AppSettings;
  }
}

/**
 * Save settings to DB (primary) and local-store (fallback).
 */
export async function saveSettingsToDb(updates: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();

  // Try DB first
  try {
    const [existing] = await db.select().from(settings).limit(1);
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(settings.id, existing.id))
        .returning();
      localStore.saveSettings(updated);
      return { ...DEFAULT_SETTINGS, ...updated } as AppSettings;
    }
    // No row — insert
    const [created] = await db
      .insert(settings)
      .values({ ...DEFAULT_SETTINGS, ...updates, messageTemplates: DEFAULT_TEMPLATES })
      .returning();
    localStore.saveSettings(created);
    return { ...DEFAULT_SETTINGS, ...created } as AppSettings;
  } catch (err) {
    // DB unreachable — save to local-store only
    const merged = { ...current, ...updates, updatedAt: new Date() };
    localStore.saveSettings(merged);
    return merged as AppSettings;
  }
}

export function getDefaultTemplates() {
  return DEFAULT_TEMPLATES;
}
