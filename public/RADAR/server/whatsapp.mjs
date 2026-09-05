import path from "node:path";
import { mkdir, rm } from "node:fs/promises";
import QRCode from "qrcode";
import qrcodeTerminal from "qrcode-terminal";
import pino from "pino";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { parseToE164 } from "./phone.mjs";
import { saveSession } from "./db/index.mjs";

const SESSION_DIR = path.resolve(process.env.WHATSAPP_SESSION_DIR || "server/.whatsapp-session");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const wa = (globalThis.__waSession ??= {
  sock: null,
  status: "idle",
  qr: null,
  qrDataUrl: null,
  user: null,
  jid: null,
  checked: 0,
  found: 0,
  lastError: null,
  starting: null,
});

export function snapshot() {
  return {
    status: wa.status,
    connected: wa.status === "open",
    qrDataUrl: wa.qrDataUrl,
    user: wa.user,
    checked: wa.checked,
    found: wa.found,
    lastError: wa.lastError,
  };
}

async function persist() {
  await saveSession({ ...snapshot(), jid: wa.jid }, SESSION_DIR).catch(() => {});
}

export async function initiateSession({ force = false } = {}) {
  if (wa.starting && !force) return wa.starting;
  if (wa.sock && ["connecting", "qr", "open"].includes(wa.status) && !force) return snapshot();

  wa.starting = (async () => {
    if (force && wa.sock) {
      try { wa.sock.end?.(new Error("session_restarted")); } catch { /* ignore */ }
      wa.sock = null;
    }
    await mkdir(SESSION_DIR, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));
    const sock = makeWASocket({
      auth: state,
      version,
      logger: pino({ level: process.env.BAILEYS_LOG_LEVEL || "silent" }),
      browser: ["ProspectRadar", "Chrome", "1.0.0"],
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      getMessage: async () => undefined,
    });
    wa.sock = sock;
    wa.status = "connecting";
    wa.lastError = null;
    await persist();

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        wa.status = "qr";
        wa.qr = qr;
        wa.qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 360 });
        qrcodeTerminal.generate(qr, { small: true });
        await persist();
      }
      if (connection === "open") {
        const raw = String(sock.user?.id || "");
        wa.status = "open";
        wa.qr = null;
        wa.qrDataUrl = null;
        wa.jid = raw || null;
        wa.user = raw.split(":")[0].split("@")[0] || null;
        await persist();
      }
      if (connection === "close") {
        const code = lastDisconnect?.error?.output?.statusCode;
        wa.sock = null;
        wa.user = null;
        wa.jid = null;
        wa.status = "closed";
        wa.lastError = `connection_closed_${code ?? "unknown"}`;
        if (code === DisconnectReason.loggedOut) await rm(SESSION_DIR, { recursive: true, force: true });
        await persist();
        if (code !== DisconnectReason.loggedOut) setTimeout(() => initiateSession({ force: true }).catch(() => {}), 1500);
      }
    });
    return snapshot();
  })();

  try {
    return await wa.starting;
  } finally {
    wa.starting = null;
  }
}

async function enrich(jid) {
  if (!wa.sock) return {};
  const [profilePictureUrl, status, businessProfile] = await Promise.all([
    wa.sock.profilePictureUrl(jid, "preview").catch(() => null),
    wa.sock.fetchStatus(jid).catch(() => null),
    wa.sock.getBusinessProfile(jid).catch(() => null),
  ]);
  return {
    profilePictureUrl,
    about: status?.status ?? null,
    statusSetAt: status?.setAt?.toISOString?.() ?? null,
    isBusiness: !!businessProfile,
    businessProfile,
  };
}

export async function checkNumbers(inputs, defaultCountry = "FR", withEnrichment = true) {
  if (wa.status !== "open" || !wa.sock) throw new Error("whatsapp_not_connected");
  const parsed = inputs.map((input) => parseToE164(input, defaultCountry));
  const valid = parsed.filter((p) => p.valid);
  const jids = valid.map((p) => `${p.digits}@s.whatsapp.net`);
  const existence = new Map();

  /* onWhatsApp accepte des JIDs variadiques ; lots de 50 pour protéger la session. */
  for (let i = 0; i < jids.length; i += 50) {
    const rows = await wa.sock.onWhatsApp(...jids.slice(i, i + 50));
    for (const row of rows ?? []) existence.set(row.jid, row.exists === true);
    if (i + 50 < jids.length) await delay(250);
  }

  const results = [];
  for (const p of parsed) {
    if (!p.valid) {
      results.push({ input: p.input, validNumber: false, exists: null, error: p.error });
      continue;
    }
    const requestedJid = `${p.digits}@s.whatsapp.net`;
    const returnedJid = [...existence.keys()].find((jid) => jid.split("@")[0] === p.digits) ?? requestedJid;
    const exists = existence.get(returnedJid) === true;
    const extra = exists && withEnrichment ? await enrich(returnedJid) : {};
    results.push({
      input: p.input,
      validNumber: true,
      e164: p.e164,
      nationalNumber: p.nationalNumber,
      country: p.country,
      phoneType: p.type,
      jid: returnedJid,
      exists,
      ...extra,
    });
    wa.checked += 1;
    if (exists) wa.found += 1;
    await delay(80);
  }
  await persist();
  return results;
}

export async function logoutSession() {
  try { await wa.sock?.logout?.(); } catch { /* ignore */ }
  await rm(SESSION_DIR, { recursive: true, force: true });
  Object.assign(wa, { sock: null, status: "idle", qr: null, qrDataUrl: null, user: null, jid: null, lastError: null });
  await persist();
}

export { SESSION_DIR };