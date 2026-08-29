import cron, { type ScheduledTask } from "node-cron";
import { db } from "@/db";
import { scheduledMessages, prospects, businesses, messageLogs, campaigns } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { isExternalServerConfigured, callServer } from "./whatsapp-client";
import { getSessionStatusAsync, sendMessage } from "./whatsapp-session";
import { normalizePhone } from "./phone-normalizer";
import { DEFAULT_TEMPLATES, formatPrice } from "./prompt-generator";
import { getSettings } from "./settings";
import type { MessageTemplateKey } from "./prompt-generator";

let cronTask: ScheduledTask | null = null;

/**
 * Start the auto-messenger cron job.
 * Runs every 5 minutes to check for pending scheduled messages.
 */
export function startAutoMessenger() {
  if (cronTask) return; // Already running

  cronTask = cron.schedule("*/5 * * * *", async () => {
    try {
      await processScheduledMessages();
    } catch (e: any) {
      console.error("[AutoMessenger] Error:", e.message);
    }
  });

  console.log("[AutoMessenger] Started — checks every 5 minutes");
}

export function stopAutoMessenger() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    console.log("[AutoMessenger] Stopped");
  }
}

async function processScheduledMessages() {
  const now = new Date();

  // Find all pending messages whose scheduled time has passed
  const pending = await db
    .select()
    .from(scheduledMessages)
    .where(
      and(
        eq(scheduledMessages.status, "pending"),
        lte(scheduledMessages.scheduledAt, now)
      )
    );

  if (pending.length === 0) return;

  console.log(`[AutoMessenger] Processing ${pending.length} pending message(s)`);

  for (const msg of pending) {
    try {
      await sendScheduledMessage(msg);
      await db
        .update(scheduledMessages)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(scheduledMessages.id, msg.id));
    } catch (e: any) {
      console.error(`[AutoMessenger] Failed to send message ${msg.id}:`, e.message);
      await db
        .update(scheduledMessages)
        .set({ status: "failed" })
        .where(eq(scheduledMessages.id, msg.id));
    }
  }
}

async function sendScheduledMessage(msg: any) {
  // Get prospect + business + campaign
  const [row] = await db
    .select({ prospect: prospects, business: businesses, campaign: campaigns })
    .from(prospects)
    .innerJoin(businesses, eq(prospects.businessId, businesses.id))
    .leftJoin(campaigns, eq(prospects.campaignId, campaigns.id))
    .where(eq(prospects.id, msg.prospectId))
    .limit(1);

  if (!row) throw new Error(`Prospect ${msg.prospectId} not found`);

  const { prospect, business, campaign } = row;
  const settings = await getSettings();
  const campaignLanguage = (campaign as any)?.language || "fr";
  const campaignCurrency = (campaign as any)?.currency || "EUR";

  // Get the message template
  const templateKey = msg.messageType as MessageTemplateKey;
  const templates = (prospect as any).whatsappMessages || settings.messageTemplates;
  const template = templates?.[templateKey];

  if (!template) throw new Error(`No template for ${templateKey}`);

  // Resolve template text by language
  let rawText: string;
  if (typeof template === "string") {
    rawText = template;
  } else if (typeof template === "object" && template !== null) {
    rawText = template[campaignLanguage] || template.fr || "";
  } else {
    throw new Error(`Invalid template format for ${templateKey}`);
  }

  // Replace variables
  const vars = buildTemplateVars(prospect, business, settings, campaignLanguage, campaignCurrency);
  const text = processTemplate(rawText, vars);

  // Normalize phone
  const phoneRaw = business.phone?.replace(/[^0-9]/g, "") || "";
  const phone = normalizePhone(phoneRaw, business.country) || phoneRaw;

  if (!phone || phone.length < 8) {
    throw new Error(`Invalid phone number for prospect ${msg.prospectId}`);
  }

  // Send via WhatsApp
  if (isExternalServerConfigured()) {
    await callServer("/send", {
      method: "POST",
      body: JSON.stringify({ phone, message: text }),
    });
  } else {
    const status = await getSessionStatusAsync();
    if (status.status !== "connected") {
      throw new Error("WhatsApp session not connected");
    }
    await sendMessage(phone, text);
  }

  // Log the message
  await db.insert(messageLogs).values({
    prospectId: msg.prospectId,
    campaignId: msg.campaignId,
    messageStage: msg.messageType,
    status: "sent",
    phone,
    language: campaignLanguage,
    messageBody: text,
  });
}

function buildTemplateVars(prospect: any, business: any, settings: any, lang: string, currency: string) {
  const firstName = business.name?.split(" ")[0] || "there";
  const rating = business.rating || "";
  const reviewsCount = business.reviewsCount || "";

  const depositPrice = currency === "USD"
    ? (settings.priceDepositUSD ?? 9900)
    : currency === "MAD"
    ? (settings.priceDepositMAD ?? 9900)
    : (settings.priceDepositEUR ?? 9900);
  const finalPrice = currency === "USD"
    ? (settings.priceFinalUSD ?? 15000)
    : currency === "MAD"
    ? (settings.priceFinalMAD ?? 15000)
    : (settings.priceFinalEUR ?? 15000);
  const totalPrice = depositPrice + finalPrice;

  const paymentDepositUrl = currency === "USD"
    ? settings.paymentLinkDepositUSD
    : currency === "MAD"
    ? settings.paymentLinkDepositMAD
    : settings.paymentLinkDepositEUR;

  const paymentFinalUrl = currency === "USD"
    ? settings.paymentLinkFinalUSD
    : currency === "MAD"
    ? settings.paymentLinkFinalMAD
    : settings.paymentLinkFinalEUR;

  return {
    firstName,
    businessName: business.name || "",
    city: business.city || "",
    sector: business.subcategory || business.category || "",
    rating: rating ? String(rating) : "",
    reviewCount: reviewsCount ? String(reviewsCount) : "50",
    contact_name: settings.contactName || "",
    agency_name: settings.agencyName || "",
    contact_email: settings.contactEmail || "",
    agency_website: settings.websiteUrl || "",
    portfolio_url: settings.portfolioUrl || "",
    demo_url: prospect.externalDemoUrl || "",
    final_site_url: prospect.externalSiteUrl || "",
    price: formatPrice(totalPrice, currency),
    price_deposit: formatPrice(depositPrice, currency),
    price_final: formatPrice(finalPrice, currency),
    payment_url: paymentDepositUrl || "",
    payment_deposit_url: paymentDepositUrl || "",
    payment_final_url: paymentFinalUrl || "",
    google_review_url: business.googleMapsUrl || "",
    cuisine: business.cuisine || "",
  };
}

function processTemplate(template: string, vars: Record<string, any>): string {
  let result = template;
  // Handle {{#if var}}...{{/if}} blocks
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
    return vars[key] ? content : "";
  });
  // Handle simple {{var}} replacements
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return vars[key] !== undefined ? String(vars[key]) : "";
  });
  return result;
}
