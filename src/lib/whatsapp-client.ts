/**
 * WhatsApp external server client.
 * Calls the standalone Baileys server deployed on Render/Railway.
 * Set WHATSAPP_SERVER_URL in Vercel env vars (e.g. https://gosite-whatsapp.onrender.com)
 */

const RAW_URL = process.env.WHATSAPP_SERVER_URL;
const SERVER_URL = RAW_URL && !RAW_URL.startsWith("http") ? `https://${RAW_URL}` : RAW_URL;

export function isExternalServerConfigured(): boolean {
  return !!SERVER_URL;
}

export function getServerUrl(): string | null {
  return SERVER_URL || null;
}

export async function callServer(path: string, options: RequestInit = {}): Promise<any> {
  if (!SERVER_URL) {
    throw new Error("WhatsApp server non configuré. Ajoutez WHATSAPP_SERVER_URL dans les variables d'environnement Vercel.");
  }
  const url = `${SERVER_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Erreur serveur WhatsApp (HTTP ${res.status})`);
  }
  return data;
}
