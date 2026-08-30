import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { localStore } from "@/lib/local-store";
import { generateDefaultWhatsAppMessages } from "@/lib/prompt-generator";

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
  depositPriceEUR: number | null;
  depositPriceUSD: number | null;
  depositPriceMAD: number | null;
  finalPriceEUR: number | null;
  finalPriceUSD: number | null;
  finalPriceMAD: number | null;
  depositPaymentLinkEUR: string | null;
  depositPaymentLinkUSD: string | null;
  depositPaymentLinkMAD: string | null;
  finalPaymentLinkEUR: string | null;
  finalPaymentLinkUSD: string | null;
  finalPaymentLinkMAD: string | null;
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
  depositPriceEUR: 9900,
  depositPriceUSD: 9900,
  depositPriceMAD: 99000,
  finalPriceEUR: 15000,
  finalPriceUSD: 15000,
  finalPriceMAD: 150000,
  depositPaymentLinkEUR: null,
  depositPaymentLinkUSD: null,
  depositPaymentLinkMAD: null,
  finalPaymentLinkEUR: null,
  finalPaymentLinkUSD: null,
  finalPaymentLinkMAD: null,
  messageTemplates: null,
  brandColor: "#2563eb",
  logoUrl: null,
};

const DEFAULT_TEMPLATES = generateDefaultWhatsAppMessages({});

/**
 * Back-compat: when a row has old priceEUR/USD/MAD but new deposit/final fields are null,
 * derive deposit = round(oldPrice * 0.396) (~99/249) and final = oldPrice - deposit.
 * Also ensures defaults for cents and links when both old and new are missing.
 */
function applySettingsFallbacks(raw: any): any {
  const depositPriceEUR =
    raw.depositPriceEUR ?? (raw.priceEUR ? Math.round(raw.priceEUR * 0.396) : 9900);
  const depositPriceUSD =
    raw.depositPriceUSD ?? (raw.priceUSD ? Math.round(raw.priceUSD * 0.396) : 9900);
  const depositPriceMAD =
    raw.depositPriceMAD ?? (raw.priceMAD ? Math.round(raw.priceMAD * 0.396) : 99000);

  const finalPriceEUR =
    raw.finalPriceEUR ?? (raw.priceEUR ? raw.priceEUR - depositPriceEUR : 15000);
  const finalPriceUSD =
    raw.finalPriceUSD ?? (raw.priceUSD ? raw.priceUSD - depositPriceUSD : 15000);
  const finalPriceMAD =
    raw.finalPriceMAD ?? (raw.priceMAD ? raw.priceMAD - depositPriceMAD : 150000);

  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    depositPriceEUR,
    depositPriceUSD,
    depositPriceMAD,
    finalPriceEUR,
    finalPriceUSD,
    finalPriceMAD,
    depositPaymentLinkEUR: raw.depositPaymentLinkEUR ?? null,
    depositPaymentLinkUSD: raw.depositPaymentLinkUSD ?? null,
    depositPaymentLinkMAD: raw.depositPaymentLinkMAD ?? null,
    finalPaymentLinkEUR: raw.finalPaymentLinkEUR ?? null,
    finalPaymentLinkUSD: raw.finalPaymentLinkUSD ?? null,
    finalPaymentLinkMAD: raw.finalPaymentLinkMAD ?? null,
    // Ensure old fields retain defaults if missing
    priceEUR: raw.priceEUR ?? DEFAULT_SETTINGS.priceEUR,
    priceUSD: raw.priceUSD ?? DEFAULT_SETTINGS.priceUSD,
    priceMAD: raw.priceMAD ?? DEFAULT_SETTINGS.priceMAD,
    paymentLinkEUR: raw.paymentLinkEUR ?? DEFAULT_SETTINGS.paymentLinkEUR,
    paymentLinkUSD: raw.paymentLinkUSD ?? DEFAULT_SETTINGS.paymentLinkUSD,
    paymentLinkMAD: raw.paymentLinkMAD ?? DEFAULT_SETTINGS.paymentLinkMAD,
  };
}

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
      return applySettingsFallbacks(row) as AppSettings;
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
    return applySettingsFallbacks(created) as AppSettings;
  } catch (err) {
    // DB unreachable — try local-store
    const local = localStore.getSettings();
    if (local) {
      return applySettingsFallbacks(local) as AppSettings;
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

  // Merge messageTemplates so we don't lose keys the client didn't send
  if (updates.messageTemplates && current.messageTemplates) {
    updates = {
      ...updates,
      messageTemplates: {
        ...current.messageTemplates,
        ...updates.messageTemplates,
      },
    };
  }

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
      return applySettingsFallbacks(updated) as AppSettings;
    }
    // No row — insert
    const [created] = await db
        .insert(settings)
        .values({ ...DEFAULT_SETTINGS, ...updates, messageTemplates: DEFAULT_TEMPLATES })
        .returning();
    localStore.saveSettings(created);
    return applySettingsFallbacks(created) as AppSettings;
  } catch (err) {
    // DB unreachable — save to local-store only
    const merged = applySettingsFallbacks({ ...current, ...updates, updatedAt: new Date() });
    localStore.saveSettings(merged);
    return merged as AppSettings;
  }
}

export function getDefaultTemplates() {
  return DEFAULT_TEMPLATES;
}
