/**
 * WhatsApp Cloud API integration via Meta's official API.
 *
 * To use this feature, the user needs to:
 * 1. Create a Meta Business account at https://business.facebook.com/
 * 2. Set up a WhatsApp Business API app
 * 3. Get a Phone Number ID and a permanent access token
 * 4. Add these in the Settings page
 *
 * Once configured, the app can send messages directly via the official
 * WhatsApp Cloud API without requiring a QR code scan or any browser
 * interaction.
 */

const GRAPH_API_VERSION = "v20.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export type CloudApiConfig = {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
  webhookVerifyToken?: string;
};

export type SendMessageResult = {
  ok: boolean;
  messageId?: string;
  contactWaId?: string;
  error?: string;
};

/**
 * Send a text message via the WhatsApp Cloud API.
 * Returns the message ID on success.
 */
export async function sendCloudMessage(
  config: CloudApiConfig,
  to: string, // phone in international format, no + or spaces
  text: string
): Promise<SendMessageResult> {
  if (!config.phoneNumberId || !config.accessToken) {
    return { ok: false, error: "Configuration WhatsApp Cloud manquante" };
  }
  // Normalize phone: remove +, spaces, dashes
  const phoneClean = to.replace(/[^0-9]/g, "");
  if (!phoneClean || phoneClean.length < 8) {
    return { ok: false, error: "Numéro de téléphone invalide" };
  }
  const url = `${GRAPH_API_BASE}/${config.phoneNumberId}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phoneClean,
        type: "text",
        text: { body: text, preview_url: false },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const errMsg =
        data?.error?.message || `Erreur API WhatsApp (HTTP ${res.status})`;
      return { ok: false, error: errMsg };
    }
    return {
      ok: true,
      messageId: data?.messages?.[0]?.id,
      contactWaId: data?.contacts?.[0]?.wa_id,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur réseau" };
  }
}

/**
 * Test the Cloud API configuration by sending a test message to a
 * phone number (or to yourself).
 */
export async function testCloudConfig(
  config: CloudApiConfig,
  testPhone: string
): Promise<SendMessageResult> {
  return sendCloudMessage(
    config,
    testPhone,
    "✅ Test Vibecoder Prospect : votre configuration WhatsApp Cloud API fonctionne !"
  );
}
