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
  // Deposit pricing (cents)
  priceDepositEUR: number | null;
  priceDepositUSD: number | null;
  priceDepositMAD: number | null;
  // Final pricing (cents)
  priceFinalEUR: number | null;
  priceFinalUSD: number | null;
  priceFinalMAD: number | null;
  // Deposit payment links
  paymentLinkDepositEUR: string | null;
  paymentLinkDepositUSD: string | null;
  paymentLinkDepositMAD: string | null;
  // Final payment links
  paymentLinkFinalEUR: string | null;
  paymentLinkFinalUSD: string | null;
  paymentLinkFinalMAD: string | null;
  messageTemplates: {
    intro: string | { fr: string; en: string; ar: string };
    followup: string | { fr: string; en: string; ar: string };
    followup_2: string | { fr: string; en: string; ar: string };
    demo: string | { fr: string; en: string; ar: string };
    ask_offer: string | { fr: string; en: string; ar: string };
    quote: string | { fr: string; en: string; ar: string };
    deposit: string | { fr: string; en: string; ar: string };
    payment_received: string | { fr: string; en: string; ar: string };
    progress_update: string | { fr: string; en: string; ar: string };
    preview: string | { fr: string; en: string; ar: string };
    confirm_changes: string | { fr: string; en: string; ar: string };
    final_payment: string | { fr: string; en: string; ar: string };
    delivery: string | { fr: string; en: string; ar: string };
    checkin: string | { fr: string; en: string; ar: string };
    referral: string | { fr: string; en: string; ar: string };
    has_website: string | { fr: string; en: string; ar: string };
    not_interested: string | { fr: string; en: string; ar: string };
    too_expensive: string | { fr: string; en: string; ar: string };
    cheaper: string | { fr: string; en: string; ar: string };
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
  priceDepositEUR: 9900,
  priceDepositUSD: 9900,
  priceDepositMAD: 9900,
  priceFinalEUR: 15000,
  priceFinalUSD: 15000,
  priceFinalMAD: 15000,
  paymentLinkDepositEUR: null,
  paymentLinkDepositUSD: null,
  paymentLinkDepositMAD: null,
  paymentLinkFinalEUR: null,
  paymentLinkFinalUSD: null,
  paymentLinkFinalMAD: null,
  messageTemplates: null,
  brandColor: "#2563eb",
  logoUrl: null,
};

const DEFAULT_TEMPLATES = generateDefaultWhatsAppMessages({});

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
        priceDepositEUR: (local as any).priceDepositEUR ?? DEFAULT_SETTINGS.priceDepositEUR,
        priceDepositUSD: (local as any).priceDepositUSD ?? DEFAULT_SETTINGS.priceDepositUSD,
        priceDepositMAD: (local as any).priceDepositMAD ?? DEFAULT_SETTINGS.priceDepositMAD,
        priceFinalEUR: (local as any).priceFinalEUR ?? DEFAULT_SETTINGS.priceFinalEUR,
        priceFinalUSD: (local as any).priceFinalUSD ?? DEFAULT_SETTINGS.priceFinalUSD,
        priceFinalMAD: (local as any).priceFinalMAD ?? DEFAULT_SETTINGS.priceFinalMAD,
        paymentLinkDepositEUR: (local as any).paymentLinkDepositEUR ?? DEFAULT_SETTINGS.paymentLinkDepositEUR,
        paymentLinkDepositUSD: (local as any).paymentLinkDepositUSD ?? DEFAULT_SETTINGS.paymentLinkDepositUSD,
        paymentLinkDepositMAD: (local as any).paymentLinkDepositMAD ?? DEFAULT_SETTINGS.paymentLinkDepositMAD,
        paymentLinkFinalEUR: (local as any).paymentLinkFinalEUR ?? DEFAULT_SETTINGS.paymentLinkFinalEUR,
        paymentLinkFinalUSD: (local as any).paymentLinkFinalUSD ?? DEFAULT_SETTINGS.paymentLinkFinalUSD,
        paymentLinkFinalMAD: (local as any).paymentLinkFinalMAD ?? DEFAULT_SETTINGS.paymentLinkFinalMAD,
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
