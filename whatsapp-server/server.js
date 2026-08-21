/**
 * WhatsApp Baileys Server — standalone Express server
 * Deploy to Railway for persistent WebSocket connection.
 *
 * Endpoints:
 *   GET  /health           — Health check
 *   POST /session          — Start a new session, returns QR code
 *   GET  /session          — Get current session status
 *   DELETE /session        — Disconnect session
 *   POST /send             — Send a WhatsApp message
 *   POST /check-numbers    — Check if phone numbers exist on WhatsApp
 */

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const express = require("express");
const cors = require("cors");
const { toDataURL } = require("qrcode");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3001;
const AUTH_DIR = path.join(__dirname, ".auth_state");
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 3000;

// --- Database connection (optional, for persisting session to Supabase) ---
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("supabase") ? { rejectUnauthorized: false } : undefined,
    max: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

// --- Session state (in-memory singleton) ---
let sessionState = {
  status: "disconnected", // disconnected | connecting | qr_ready | connected | failed
  socket: null,
  qrCode: null,
  phoneNumber: null,
  profileName: null,
  sessionId: null,
  error: null,
  connectedAt: null,
  reconnectAttempts: 0,
  reconnectTimer: null,
  lastActivity: null,
};

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

// --- Helper: persist session to DB ---
async function persistSessionToDb(sessionData) {
  if (!pool) return;
  try {
    await pool.query(
      `UPDATE settings SET
        whatsapp_session_id = $1,
        whatsapp_session_phone = $2,
        whatsapp_session_name = $3,
        whatsapp_connected_at = $4,
        updated_at = NOW()
       WHERE id = 1`,
      [sessionData.sessionId, sessionData.phoneNumber, sessionData.profileName, sessionData.connectedAt]
    );
    log("Session persisted to DB");
  } catch (err) {
    log("DB persist error:", err.message);
  }
}

async function clearSessionFromDb() {
  if (!pool) return;
  try {
    await pool.query(
      `UPDATE settings SET
        whatsapp_session_id = NULL,
        whatsapp_session_phone = NULL,
        whatsapp_session_name = NULL,
        whatsapp_connected_at = NULL,
        updated_at = NOW()
       WHERE id = 1`
    );
    log("Session cleared from DB");
  } catch (err) {
    log("DB clear error:", err.message);
  }
}

// --- Phone number helpers ---
function cleanPhone(raw) {
  if (!raw) return null;
  let cleaned = raw.replace(/[^0-9]/g, "");
  if (!cleaned || cleaned.length < 8) return null;
  // If starts with 0 and looks like a local number, keep as-is (Baileys needs country code)
  // The caller should ensure international format
  return cleaned;
}

function isValidPhone(phone) {
  const cleaned = cleanPhone(phone);
  return cleaned && cleaned.length >= 8 && cleaned.length <= 15;
}

// --- Baileys session management ---
let reconnectTimeout = null;

function scheduleReconnect(attempt = 1) {
  if (attempt > MAX_RECONNECT_ATTEMPTS) {
    log(`Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Manual reconnection required.`);
    sessionState.status = "failed";
    sessionState.error = "Tentatives de reconnexion épuisées. Cliquez sur Reconnecter.";
    sessionState.reconnectAttempts = 0;
    return;
  }

  const delay = RECONNECT_BASE_DELAY * Math.min(attempt, 5);
  log(`Scheduling reconnect attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);

  sessionState.reconnectAttempts = attempt;
  sessionState.status = "connecting";

  reconnectTimeout = setTimeout(async () => {
    try {
      log(`Reconnect attempt ${attempt}...`);
      await startSession();
    } catch (err) {
      log(`Reconnect attempt ${attempt} failed:`, err.message);
      scheduleReconnect(attempt + 1);
    }
  }, delay);
}

async function startSession() {
  // If already connected, return existing state
  if (sessionState.status === "connected" && sessionState.socket) {
    return { status: sessionState.status, qrCode: sessionState.qrCode };
  }

  // If connecting, wait
  if (sessionState.status === "connecting") {
    return { status: sessionState.status, qrCode: sessionState.qrCode };
  }

  // Clear any pending reconnect
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  sessionState.status = "connecting";
  sessionState.error = null;
  sessionState.reconnectAttempts = 0;

  // Ensure auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  log("Starting Baileys socket, version:", version.join("."));

  const socket = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, console),
    },
    printQRInTerminal: false,
    browser: ["GoSite WhatsApp", "Chrome", "120.0.0"],
    markOnlineOnConnect: false,
    syncFullHistory: false,
    connectTimeoutMs: 60_000,
    keepAliveIntervalMs: 30_000,
  });

  sessionState.socket = socket;

  // Save credentials on every update
  socket.ev.on("creds.update", () => {
    saveCreds();
    log("Credentials saved");
  });

  // Handle connection updates
  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      log("QR code received");
      sessionState.status = "qr_ready";
      try {
        sessionState.qrCode = await toDataURL(qr, { width: 256 });
      } catch (err) {
        log("QR generation failed:", err.message);
        sessionState.qrCode = null;
      }
    }

    if (connection === "open") {
      log("Connected to WhatsApp!");
      // Extract clean numeric phone from JID
      // JID formats: "212669549933:12@s.whatsapp.net" or "212669549933@s.whatsapp.net"
      const rawId = socket.user?.id || "";
      const phone = rawId.split(":")[0].split("@")[0].replace(/[^0-9]/g, "");
      const name = socket.user?.name || null;
      const sessionId = `wa_${Date.now()}`;

      sessionState = {
        ...sessionState,
        status: "connected",
        qrCode: null,
        phoneNumber: phone,
        profileName: name,
        sessionId,
        error: null,
        connectedAt: new Date().toISOString(),
        reconnectAttempts: 0,
        lastActivity: Date.now(),
      };

      await persistSessionToDb(sessionState);
      log(`Connected as ${name} (${phone})`);
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const reason = lastDisconnect?.error?.output?.payload?.message || "unknown";

      log(`Disconnected: ${reason} (code: ${statusCode})`);

      // Mark socket as null
      sessionState.socket = null;
      sessionState.lastActivity = null;

      if (statusCode === DisconnectReason.loggedOut) {
        // Logged out — clear auth state, no auto-reconnect
        sessionState = {
          ...sessionState,
          status: "disconnected",
          qrCode: null,
          phoneNumber: null,
          profileName: null,
          sessionId: null,
          error: "Déconnecté (déconnecté depuis le téléphone). Scannez à nouveau le QR code.",
          connectedAt: null,
          reconnectAttempts: 0,
        };
        await clearSessionFromDb();
        try { fs.rmSync(AUTH_DIR, { recursive: true }); } catch {}
        log("Logged out — credentials cleared");
      } else if (statusCode === DisconnectReason.connectionReplaced) {
        // Session replaced by another device
        sessionState = {
          ...sessionState,
          status: "disconnected",
          qrCode: null,
          phoneNumber: null,
          profileName: null,
          sessionId: null,
          error: "Session remplacée par un autre appareil. Scannez à nouveau le QR code.",
          connectedAt: null,
          reconnectAttempts: 0,
        };
        await clearSessionFromDb();
        try { fs.rmSync(AUTH_DIR, { recursive: true }); } catch {}
        log("Session replaced — credentials cleared");
      } else if (statusCode === DisconnectReason.restartRequired) {
        // Normal after QR scan — auto-reconnect
        log("Restart required — auto-reconnecting...");
        sessionState.status = "connecting";
        scheduleReconnect(1);
      } else if (
        statusCode === DisconnectReason.connectionClosed ||
        statusCode === DisconnectReason.connectionLost ||
        statusCode === DisconnectReason.timedOut ||
        statusCode === 408 ||
        statusCode === 428
      ) {
        // Temporary disconnect — auto-reconnect
        log(`Temporary disconnect (code ${statusCode}) — auto-reconnecting...`);
        sessionState.status = "connecting";
        scheduleReconnect(1);
      } else {
        // Unknown reason — try auto-reconnect once
        log(`Unknown disconnect (code ${statusCode}) — attempting auto-reconnect...`);
        sessionState.status = "connecting";
        scheduleReconnect(1);
      }
    }
  });

  return { status: sessionState.status, qrCode: sessionState.qrCode };
}

async function disconnectSession() {
  // Clear any pending reconnect
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (sessionState.socket) {
    try { sessionState.socket.end(); } catch {}
  }
  sessionState = {
    status: "disconnected",
    socket: null,
    qrCode: null,
    phoneNumber: null,
    profileName: null,
    sessionId: null,
    error: null,
    connectedAt: null,
    reconnectAttempts: 0,
    reconnectTimer: null,
    lastActivity: null,
  };
  await clearSessionFromDb();
  try { fs.rmSync(AUTH_DIR, { recursive: true }); } catch {}
  log("Session disconnected and credentials cleared");
}

// --- Send message with health check ---
async function sendMessage(to, text) {
  // Health check: verify socket exists and is connected
  if (!sessionState.socket || sessionState.status !== "connected") {
    return { ok: false, error: "WhatsApp n'est pas connecté." };
  }

  const phoneClean = cleanPhone(to);
  if (!phoneClean) {
    return { ok: false, error: "Numéro de téléphone invalide" };
  }

  const jid = phoneClean + "@s.whatsapp.net";

  try {
    // Send with timeout
    const sendPromise = sessionState.socket.sendMessage(jid, { text });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout: l'envoi a pris trop de temps")), 30000)
    );

    const result = await Promise.race([sendPromise, timeoutPromise]);

    sessionState.lastActivity = Date.now();
    log(`Message sent to ${phoneClean} (${result?.key?.id || "no-id"})`);

    return {
      ok: true,
      messageId: result?.key?.id ?? undefined,
      sentFrom: sessionState.phoneNumber,
      sentFromName: sessionState.profileName,
      sentTo: phoneClean,
    };
  } catch (err) {
    log(`Send failed to ${phoneClean}:`, err.message);

    // If the error suggests the connection is dead, trigger reconnect
    if (
      err.message.includes("Connection Closed") ||
      err.message.includes("Not Connected") ||
      err.message.includes("Timeout") ||
      err.message.includes("ECONNRESET")
    ) {
      log("Connection appears dead — scheduling reconnect");
      sessionState.status = "connecting";
      sessionState.socket = null;
      scheduleReconnect(1);
    }

    return { ok: false, error: err.message || "Échec de l'envoi" };
  }
}

async function checkNumbersOnWhatsApp(phones) {
  if (!sessionState.socket || sessionState.status !== "connected") {
    return { ok: false, error: "WhatsApp n'est pas connecté.", results: [] };
  }
  const cleaned = phones.map((p) => (typeof p === "string" ? cleanPhone(p) : null)).filter(Boolean);
  if (cleaned.length === 0) return { ok: true, results: [] };
  try {
    const results = await sessionState.socket.onWhatsApp(...cleaned);
    return { ok: true, results };
  } catch (err) {
    log("Check numbers failed:", err.message);
    return { ok: false, error: err.message, results: [] };
  }
}

// --- API Routes ---

// Health check
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    status: sessionState.status,
    connected: sessionState.status === "connected",
    phoneNumber: sessionState.phoneNumber,
    uptime: process.uptime(),
    reconnectAttempts: sessionState.reconnectAttempts,
    lastActivity: sessionState.lastActivity,
  });
});

// Start session / get QR
app.post("/session", async (req, res) => {
  try {
    // If already connected, return success
    if (sessionState.status === "connected" && sessionState.socket) {
      return res.json({
        status: "connected",
        connected: true,
        phoneNumber: sessionState.phoneNumber,
        profileName: sessionState.profileName,
        sessionId: sessionState.sessionId,
      });
    }

    // If in qr_ready or failed state, restart the session
    if (sessionState.status === "qr_ready" || sessionState.status === "failed" || sessionState.status === "disconnected") {
      log("POST /session: restarting session from state " + sessionState.status);
      // Clear old socket
      if (sessionState.socket) {
        try { sessionState.socket.end(); } catch {}
        sessionState.socket = null;
      }
      sessionState.status = "disconnected";
    }

    const result = await startSession();
    res.json(result);
  } catch (err) {
    log("Session start error:", err.message);
    sessionState.status = "failed";
    sessionState.error = err.message;
    res.status(500).json({ status: "failed", error: err.message });
  }
});

// Get session status
app.get("/session", (req, res) => {
  res.json({
    status: sessionState.status,
    connected: sessionState.status === "connected",
    phoneNumber: sessionState.phoneNumber,
    phone: sessionState.phoneNumber,
    profileName: sessionState.profileName,
    sessionId: sessionState.sessionId,
    qrCode: sessionState.qrCode,
    qrExpiry: null,
    error: sessionState.error,
    reconnectAttempts: sessionState.reconnectAttempts,
  });
});

// Disconnect
app.delete("/session", async (req, res) => {
  await disconnectSession();
  res.json({ status: "disconnected" });
});

// Send message
app.post("/send", async (req, res) => {
  const { phone, message } = req.body || {};
  if (!phone || !message) {
    return res.status(400).json({ error: "phone and message required" });
  }
  if (sessionState.status !== "connected" || !sessionState.socket) {
    log(`Send failed: session not connected (status=${sessionState.status})`);
    return res.status(500).json({
      ok: false,
      error: `WhatsApp n'est pas connecté (statut: ${sessionState.status}). Reconnectez depuis les paramètres.`,
    });
  }
  const result = await sendMessage(phone, message);
  if (!result.ok) {
    return res.status(500).json(result);
  }
  res.json(result);
});

// Check numbers
app.post("/check-numbers", async (req, res) => {
  const { phones } = req.body || {};
  if (!phones || !Array.isArray(phones)) {
    return res.status(400).json({ error: "phones array required" });
  }
  const result = await checkNumbersOnWhatsApp(phones);
  res.json(result);
});

// --- Start server ---
app.listen(PORT, "0.0.0.0", () => {
  log(`WhatsApp Baileys Server running on port ${PORT}`);

  // Try to recover session from DB on startup
  if (pool) {
    pool.query("SELECT whatsapp_session_id FROM settings WHERE id = 1")
      .then((result) => {
        if (result.rows[0]?.whatsapp_session_id && fs.existsSync(path.join(AUTH_DIR, "creds.json"))) {
          log("Found stored credentials, attempting reconnect...");
          startSession().catch((err) => {
            log("Auto-reconnect failed:", err.message);
          });
        }
      })
      .catch(() => {});
  }
});
