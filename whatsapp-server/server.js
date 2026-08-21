/**
 * WhatsApp Baileys Server — standalone Express server
 * Deploy to Render/Railway/Fly.io for persistent WebSocket connection.
 * Your Vercel Next.js app calls this server's API.
 *
 * Endpoints:
 *   POST /session          — Start a new session, returns QR code
 *   GET  /session          — Get current session status
 *   DELETE /session        — Disconnect session
 *   POST /send             — Send a WhatsApp message
 *   POST /check-numbers    — Check if phone numbers exist on WhatsApp
 *   GET  /health           — Health check
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
app.use(express.json());

const PORT = process.env.PORT || 3001;
const AUTH_DIR = path.join(__dirname, ".auth_state");

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
};

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
  } catch (err) {
    console.error("[DB] Failed to persist session:", err.message);
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
  } catch (err) {
    console.error("[DB] Failed to clear session:", err.message);
  }
}

// --- Baileys session management ---
async function startSession() {
  if (sessionState.status === "connected" || sessionState.status === "connecting") {
    return { status: sessionState.status, qrCode: sessionState.qrCode };
  }

  sessionState.status = "connecting";
  sessionState.error = null;

  // Ensure auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

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
  socket.ev.on("creds.update", saveCreds);

  // Handle connection updates
  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("[WA] QR code received");
      sessionState.status = "qr_ready";
      try {
        sessionState.qrCode = await toDataURL(qr, { width: 256 });
      } catch (err) {
        console.error("[WA] QR generation failed:", err.message);
        sessionState.qrCode = null;
      }
    }

    if (connection === "open") {
      console.log("[WA] Connected!");
      const phone = socket.user?.id?.replace(/:.*$/, "").replace(/@s\.whatsapp\.net$/, "").replace(/[^0-9]/g, "");
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
      };

      await persistSessionToDb(sessionState);
      console.log(`[WA] Connected as ${name} (${phone})`);
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const reason = lastDisconnect?.error?.output?.payload?.message || "unknown";

      console.log(`[WA] Disconnected: ${reason} (code: ${statusCode})`);

      if (statusCode === DisconnectReason.loggedOut) {
        // Logged out — clear auth state
        sessionState = {
          ...sessionState,
          status: "disconnected",
          socket: null,
          qrCode: null,
          phoneNumber: null,
          profileName: null,
          sessionId: null,
          error: "Déconnecté. Scannez à nouveau le QR code.",
          connectedAt: null,
        };
        await clearSessionFromDb();
        // Clear auth directory
        try { fs.rmSync(AUTH_DIR, { recursive: true }); } catch {}
      } else if (statusCode === DisconnectReason.restartRequired) {
        console.log("[WA] Restart required, reconnecting...");
        // Auto-reconnect
        setTimeout(() => startSession(), 2000);
      } else {
        // Other disconnect — keep credentials, mark as disconnected
        sessionState = {
          ...sessionState,
          status: "disconnected",
          socket: null,
          qrCode: null,
          error: `Déconnecté (${reason}). Cliquez sur "Reconnecter".`,
        };
      }
    }
  });

  return { status: "connecting", qrCode: null };
}

async function disconnectSession() {
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
  };
  await clearSessionFromDb();
  // Clear auth directory
  try { fs.rmSync(AUTH_DIR, { recursive: true }); } catch {}
}

async function sendMessage(to, text) {
  if (!sessionState.socket || sessionState.status !== "connected") {
    return { ok: false, error: "WhatsApp n'est pas connecté." };
  }
  const phoneClean = to.replace(/[^0-9]/g, "");
  if (!phoneClean || phoneClean.length < 8) {
    return { ok: false, error: "Numéro de téléphone invalide" };
  }
  const jid = phoneClean + "@s.whatsapp.net";
  try {
    const result = await sessionState.socket.sendMessage(jid, { text });
    return { ok: true, messageId: result?.key?.id ?? undefined };
  } catch (err) {
    return { ok: false, error: err.message || "Échec de l'envoi" };
  }
}

async function checkNumbersOnWhatsApp(phones) {
  if (!sessionState.socket || sessionState.status !== "connected") {
    return { ok: false, error: "WhatsApp n'est pas connecté.", results: [] };
  }
  const cleaned = phones.map((p) => p.replace(/[^0-9]/g, "")).filter((p) => p.length >= 8);
  if (cleaned.length === 0) return { ok: true, results: [] };
  try {
    const results = await sessionState.socket.onWhatsApp(...cleaned);
    return { ok: true, results };
  } catch (err) {
    return { ok: false, error: err.message, results: [] };
  }
}

// --- API Routes ---

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, status: sessionState.status, uptime: process.uptime() });
});

// Start session / get QR
app.post("/session", async (req, res) => {
  try {
    const result = await startSession();
    res.json(result);
  } catch (err) {
    console.error("[API] Session error:", err.message);
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
  const result = await sendMessage(phone, message);
  if (!result.ok) {
    return res.status(500).json(result);
  }
  res.json({
    ...result,
    sentFrom: sessionState.phoneNumber,
    sentFromName: sessionState.profileName,
    sentTo: phone,
  });
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
  console.log(`[WA Server] Running on port ${PORT}`);

  // Try to recover session from DB on startup
  if (pool) {
    pool.query("SELECT whatsapp_session_id FROM settings WHERE id = 1")
      .then((result) => {
        if (result.rows[0]?.whatsapp_session_id && fs.existsSync(path.join(AUTH_DIR, "creds.json"))) {
          console.log("[WA Server] Found stored credentials, attempting reconnect...");
          startSession().catch((err) => {
            console.error("[WA Server] Auto-reconnect failed:", err.message);
          });
        }
      })
      .catch(() => {});
  }
});
