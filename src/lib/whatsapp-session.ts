/**
 * Real WhatsApp Web session manager using Baileys.
 *
 * WhatsApp Web uses a specific WebSocket protocol:
 *  1. We initiate a connection to WhatsApp's signaling server
 *  2. We display a QR code containing our ephemeral public key + ref
 *  3. When the user scans the QR with their phone, WhatsApp sends back
 *     encrypted credentials (used to authenticate subsequent sessions)
 *  4. We store these credentials to re-authenticate without re-scanning
 *
 * IMPORTANT: Baileys keeps a persistent WebSocket connection. In a
 * long-running Node process (Next.js server), this works. If you
 * deploy to serverless (Vercel), the connection won't persist.
 */

import makeWASocket, {
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
  type ConnectionState,
} from "@whiskeysockets/baileys";
import { join } from "path";
import { promises as fs } from "fs";
import type { Boom } from "@hapi/boom";
import * as QRCode from "qrcode";
import pino from "pino";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "qr_ready"
  | "connected"
  | "failed";

type SessionState = {
  socket: WASocket | null;
  status: ConnectionStatus;
  qrCode: string | null; // base64 QR image
  qrExpiry: number | null; // timestamp
  phoneNumber: string | null;
  profileName: string | null;
  error: string | null;
  lastEventLog: string[];
  sessionDir: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __waSession: SessionState | undefined;
}

// In-memory singleton (only works on a long-running Node server)
function getState(): SessionState {
  if (!globalThis.__waSession) {
    globalThis.__waSession = {
      socket: null,
      status: "disconnected",
      qrCode: null,
      qrExpiry: null,
      phoneNumber: null,
      profileName: null,
      error: null,
      lastEventLog: [],
      sessionDir: join(process.cwd(), ".whatsapp-session"),
    };
  }
  return globalThis.__waSession;
}

const AUTH_DIR = join(process.cwd(), ".whatsapp-session");

/**
 * Persist the WhatsApp session state to the database so other pages
 * (especially the prospect page) can read it. This is critical for
 * consistency — the user expects to be able to send messages from
 * any prospect page once they've linked WhatsApp in the settings.
 */
async function persistSessionToDb(
  phoneNumber: string | null,
  profileName: string | null,
  connectedAt: Date | null
) {
  try {
    const [s] = await db.select().from(settings).limit(1);
    if (!s) return;
    await db
      .update(settings)
      .set({
        whatsappSessionPhone: phoneNumber,
        whatsappSessionName: profileName,
        whatsappConnectedAt: connectedAt,
        updatedAt: new Date(),
      })
      .where(eq(settings.id, s.id));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[wa] Failed to persist session to DB:", e);
  }
}

function logEvent(state: SessionState, msg: string) {
  const ts = new Date().toISOString().split("T")[1].slice(0, 12);
  state.lastEventLog.push(`[${ts}] ${msg}`);
  if (state.lastEventLog.length > 50) state.lastEventLog.shift();
  // eslint-disable-next-line no-console
  console.log(`[wa] [${ts}] ${msg}`);
}

/**
 * Initiate a new WhatsApp session. Called when the user wants to
 * connect for the first time (or after disconnect).
 */
export async function initiateSession(): Promise<{
  sessionId: string;
  qrCode: string | null;
  status: ConnectionStatus;
}> {
  const state = getState();

  // If already connected, return the existing state
  if (state.status === "connected" && state.socket) {
    logEvent(state, "Already connected — returning existing session");
    return { sessionId: AUTH_DIR, qrCode: null, status: state.status };
  }

  // If there's a saved creds file from a previous successful scan,
  // and we're not currently in an active session, try to reconnect
  // with the saved credentials (no QR needed). This handles the
  // "restart required" case after a scan.
  const credsFile = join(AUTH_DIR, "creds.json");
  let hasStoredCreds = false;
  try {
    await fs.access(credsFile);
    hasStoredCreds = true;
  } catch {}

  if (hasStoredCreds && state.status !== "qr_ready") {
    logEvent(
      state,
      "Found stored credentials — attempting to reconnect without QR…"
    );
    return await startSocket(state);
  }

  // Clean up any existing socket
  if (state.socket) {
    try {
      state.socket.end(undefined);
    } catch {}
    state.socket = null;
  }

  // Reset state
  state.status = "connecting";
  state.qrCode = null;
  state.qrExpiry = null;
  state.error = null;
  state.lastEventLog = [];
  state.phoneNumber = null;
  state.profileName = null;
  logEvent(state, "Initiating new WhatsApp session");

  // Make sure the auth dir exists
  await fs.mkdir(AUTH_DIR, { recursive: true });

  return await startSocket(state);
}

/**
 * Internal: create the Baileys socket and wire up events. Used by
 * initiateSession and re-used after a "restart required" close.
 */
async function startSocket(
  state: SessionState
): Promise<{ sessionId: string; qrCode: string | null; status: ConnectionStatus }> {
  // Load or create auth state
  const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  const { version } = await fetchLatestBaileysVersion();
  logEvent(state, `Baileys WA Web version: ${version.join(".")}`);

  const logger = pino({ level: "info" });
  // In Baileys 6.x, `browser` is a tuple [name, shortName, version].
  const socket = makeWASocket({
    version,
    auth: {
      creds: authState.creds,
      keys: makeCacheableSignalKeyStore(authState.keys, logger as any),
    },
    printQRInTerminal: false,
    logger,
    // Browser tuple: [name, shortName, version]
    browser: ["Vibecoder Prospect", "Chrome", "120.0.0"],
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    connectTimeoutMs: 60_000,
    keepAliveIntervalMs: 30_000,
    retryRequestDelayMs: 250,
    maxMsgRetryCount: 5,
  } as any);

  state.socket = socket;

  // Persist credentials on every update
  socket.ev.on("creds.update", () => {
    logEvent(state, "Credentials updated, saving…");
    saveCreds();
  });

  // Listen for connection state changes
  socket.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = update;
    logEvent(
      state,
      `connection.update: connection=${connection} hasQR=${!!qr} ${lastDisconnect?.error ? "err=" + (lastDisconnect.error as Boom).message : ""}`
    );

    if (qr) {
      state.qrCode = qr;
      state.qrExpiry = Date.now() + 45_000; // QR refreshes every ~45s
      state.status = "qr_ready";
      logEvent(state, "New QR received (expires in 45s)");
    }

    if (connection === "open") {
      state.status = "connected";
      state.qrCode = null;
      state.qrExpiry = null;
      const me = socket.user;
      // Format: 33612345678:NN@s.whatsapp.net
      const jid = me?.id || "";
      state.phoneNumber = jid.split(":")[0].split("@")[0] || null;
      state.profileName = me?.name || null;
      logEvent(
        state,
        `Connected as ${state.profileName || state.phoneNumber} — persisting to DB`
      );
      // Persist to DB so other pages (prospect) can see the connection
      void persistSessionToDb(
        state.phoneNumber,
        state.profileName,
        new Date()
      );
    }

    if (connection === "close") {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const reasonStr = lastDisconnect?.error?.message || "unknown";
      logEvent(
        state,
        `Connection closed: reason=${reason} msg=${reasonStr}`
      );

      // For "restart required" we keep the DB connection state since
      // the reconnect will happen in 2s and re-set it to "connected"
      if (reason === DisconnectReason.restartRequired) {
        logEvent(state, "Connection will restart automatically");
        // Don't clear the DB — the reconnect will update it
      } else {
        // For other disconnects, mark as disconnected in DB
        void persistSessionToDb(null, null, null);
      }

      if (reason === DisconnectReason.loggedOut) {
        state.status = "disconnected";
        state.qrCode = null;
        state.phoneNumber = null;
        state.profileName = null;
        // Delete auth so next connection requires a fresh scan
        try {
          await fs.rm(AUTH_DIR, { recursive: true, force: true });
        } catch {}
        logEvent(state, "Logged out — credentials cleared");
      } else if (
        // Reason 515 = "restart required" — this is normal after a
        // successful QR scan. Baileys needs to restart the socket to
        // complete the authentication handshake.
        reason === DisconnectReason.restartRequired
      ) {
        logEvent(
          state,
          "Restart required after scan — reconnecting with saved credentials…"
        );
        state.status = "connecting";
        state.qrCode = null;
        // Don't clear credentials — the scan was successful.
        // Wait a moment for creds to finish saving, then start a new
        // socket which will use the stored creds automatically.
        setTimeout(() => {
          logEvent(
            state,
            "Creating new socket with stored credentials for reconnection…"
          );
          // Clean up the old socket reference
          if (state.socket) {
            try {
              state.socket.end(undefined);
            } catch {}
            state.socket = null;
          }
          // Start a new socket — useMultiFileAuthState will load
          // the saved creds from disk
          startSocket(state)
            .then((result) => {
              if (result.status === "connected") {
                logEvent(
                  state,
                  `✅ Reconnected successfully as ${state.profileName || state.phoneNumber}`
                );
              } else {
                logEvent(
                  state,
                  `Reconnect result: ${result.status}` +
                    (result.qrCode ? " (new QR emitted — scan again)" : "")
                );
              }
            })
            .catch((e) => {
              logEvent(state, `Reconnect failed: ${e.message}`);
              state.status = "failed";
              state.error = e.message;
            });
        }, 2000);
      } else {
        // Don't clear credentials — we may be able to reconnect
        state.status = "disconnected";
        state.error = reasonStr;
      }
    }
  });

  // Wait for the QR to be emitted (Baileys emits it asynchronously)
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10_000) {
    if (state.qrCode) {
      logEvent(state, "QR ready after waiting");
      break;
    }
    if (state.status === "connected" as any) {
      logEvent(state, "Connected before QR needed");
      break;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!state.qrCode && state.status === "connecting") {
    logEvent(state, "Timeout waiting for QR — check Baileys logs");
    state.status = "failed";
    state.error = "WhatsApp n'a pas envoyé de QR code. Réessayez.";
  }

  return {
    sessionId: AUTH_DIR,
    qrCode: state.qrCode,
    status: state.status,
  };
}

/**
 * Get the current session status and QR code (if pending).
 * Auto-recovers from disk if the process was restarted.
 */
let recoveryPromise: Promise<void> | null = null;

async function recoverFromDisk() {
  const state = getState();
  if (state.status === "connected" || state.status === "connecting" || state.status === "qr_ready") {
    return; // Already in a session
  }
  // Check if there are stored credentials
  const credsFile = join(AUTH_DIR, "creds.json");
  try {
    await fs.access(credsFile);
  } catch {
    return; // No creds to recover
  }
  // Check if DB says we should be connected
  try {
    const [s] = await db.select().from(settings).limit(1);
    if (!s || !s.whatsappConnectedAt) return;
  } catch {
    return;
  }
  // We have creds on disk and DB says connected — recover!
  logEvent(state, "Recovering session from disk credentials…");
  try {
    await startSocket(state);
    logEvent(state, `Recovery complete. Status: ${state.status}`);
  } catch (e) {
    logEvent(state, `Recovery failed: ${e instanceof Error ? e.message : "unknown"}`);
  }
}

export async function getSessionStatusAsync(): Promise<ReturnType<typeof getSessionStatus>> {
  const state = getState();
  if ((state.status === "disconnected" || state.status === "failed") && !state.socket && !recoveryPromise) {
    recoveryPromise = recoverFromDisk().finally(() => {
      recoveryPromise = null;
    });
  }
  if (recoveryPromise) {
    await recoveryPromise;
  }
  return getSessionStatus();
}

export function getSessionStatus() {
  const state = getState();
  return {
    status: state.status,
    qrCode: state.qrCode,
    qrExpiry: state.qrExpiry,
    phoneNumber: state.phoneNumber,
    profileName: state.profileName,
    error: state.error,
    eventLog: state.lastEventLog,
  };
}

/**
 * Send a message using the active session. The phone number must be in
 * international format (e.g. "33612345678").
 */
export async function sendMessage(
  to: string,
  text: string
): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const state = getState();
  if (!state.socket || state.status !== "connected") {
    return {
      ok: false,
      error: "WhatsApp n'est pas connecté. Scannez le QR code dans Paramètres.",
    };
  }
  try {
    // Baileys expects JID format: 33612345678@s.whatsapp.net
    const phoneClean = to.replace(/[^0-9]/g, "");
    if (!phoneClean || phoneClean.length < 8) {
      return { ok: false, error: "Numéro de téléphone invalide" };
    }
    const jid = phoneClean + "@s.whatsapp.net";
    const result = await state.socket.sendMessage(jid, { text });
    return { ok: true, messageId: result?.key?.id ?? undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur d'envoi" };
  }
}

/**
 * Check if phone numbers exist on WhatsApp using Baileys onWhatsApp().
 */
export async function checkNumbersOnWhatsApp(
  phones: string[]
): Promise<{ phone: string; exists: boolean; jid: string | null }[]> {
  const state = getState();
  if (!state.socket || state.status !== "connected") {
    return phones.map((p) => ({ phone: p, exists: false, jid: null }));
  }
  try {
    const cleaned = phones.map((p) => p.replace(/[^0-9]/g, "")).filter((p) => p.length >= 8);
    if (cleaned.length === 0) return phones.map((p) => ({ phone: p, exists: false, jid: null }));
    const results = await state.socket.onWhatsApp(...cleaned);
    if (!results) return phones.map((p) => ({ phone: p, exists: false, jid: null }));
    return cleaned.map((phone) => {
      const found = results.find((r) => r.jid === phone + "@s.whatsapp.net");
      return { phone, exists: found?.exists ?? false, jid: found?.jid ?? null };
    });
  } catch {
    return phones.map((p) => ({ phone: p, exists: false, jid: null }));
  }
}

/**
 * Disconnect the current session and clear saved credentials. The next
 * connection will require a fresh QR scan.
 */
export async function disconnectSession(): Promise<void> {
  const state = getState();
  if (state.socket) {
    try {
      await state.socket.logout();
    } catch {
      try {
        state.socket.end(undefined);
      } catch {}
    }
    state.socket = null;
  }
  try {
    await fs.rm(AUTH_DIR, { recursive: true, force: true });
  } catch {}
  state.status = "disconnected";
  state.qrCode = null;
  state.phoneNumber = null;
  state.profileName = null;
  state.error = null;
  state.qrExpiry = null;
  // Persist the disconnect to DB
  await persistSessionToDb(null, null, null);
  logEvent(state, "Session disconnected and credentials cleared");
}

/**
 * Render the QR code as a PNG data URL using the qrcode package.
 * Baileys returns the QR as a string payload; we render it to PNG.
 */
export async function qrCodeToDataUrl(payload: string): Promise<string> {
  if (!payload) return "";
  try {
    return await QRCode.toDataURL(payload, {
      width: 500,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch (e) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=20&data=${encodeURIComponent(payload)}`;
  }
}
