/* ------------------------------------------------------------------ */
/*  ProspectRadar — React + API Baileys + E.164 + Drizzle/PostgreSQL. */
/* ------------------------------------------------------------------ */

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDatabase, createBatch, getBatch, saveResults } from "./db/index.mjs";
import { checkNumbers, initiateSession, logoutSession, snapshot } from "./whatsapp.mjs";
import { parseToE164 } from "./phone.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "../dist");
const PORT = Number(process.env.PORT || 3001);
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, database: !!process.env.DATABASE_URL, whatsapp: snapshot() });
});

app.post("/api/whatsapp/session", async (req, res) => {
  try {
    await initiateSession({ force: req.body?.force === true });
    res.json({ ok: true, ...snapshot() });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error?.message ?? error), ...snapshot() });
  }
});

app.get("/api/whatsapp/status", (_req, res) => {
  res.json({ ok: true, ...snapshot() });
});

app.delete("/api/whatsapp/session", async (_req, res) => {
  await logoutSession();
  res.json({ ok: true, ...snapshot() });
});

app.post("/api/whatsapp/logout", async (_req, res) => {
  await logoutSession();
  res.json({ ok: true, ...snapshot() });
});

app.post("/api/phone/parse", (req, res) => {
  const defaultCountry = String(req.body?.defaultCountry || "FR").toUpperCase();
  if (Array.isArray(req.body?.numbers)) {
    return res.json({ results: req.body.numbers.map((n) => parseToE164(n, defaultCountry)) });
  }
  res.json(parseToE164(req.body?.number, defaultCountry));
});

app.post("/api/whatsapp/check", async (req, res) => {
  const numbers = Array.isArray(req.body?.numbers) ? req.body.numbers : [];
  const defaultCountry = String(req.body?.defaultCountry || "FR").toUpperCase();
  const enrich = req.body?.enrich !== false;

  if (!numbers.length) return res.status(400).json({ ok: false, error: "numbers_required" });
  if (!snapshot().connected) {
    return res.status(409).json({ ok: false, error: "whatsapp_not_connected" });
  }

  const batch = await createBatch({
    defaultCountry,
    total: numbers.length,
    source: String(req.body?.source || "prospectradar"),
  });

  try {
    const results = await checkNumbers(numbers, defaultCountry, enrich);
    await saveResults(batch?.id, results);
    res.json({
      ok: true,
      batchId: batch?.id ?? null,
      summary: {
        total: results.length,
        valid: results.filter((r) => r.validNumber).length,
        exists: results.filter((r) => r.exists === true).length,
        absent: results.filter((r) => r.exists === false).length,
        invalid: results.filter((r) => !r.validNumber).length,
      },
      results,
    });
  } catch (error) {
    res.status(500).json({ ok: false, batchId: batch?.id ?? null, error: String(error?.message ?? error) });
  }
});

app.get("/api/whatsapp/batches/:id", async (req, res) => {
  const batch = await getBatch(req.params.id);
  if (!batch) return res.status(404).json({ ok: false, error: "batch_not_found" });
  res.json({ ok: true, batch });
});

app.use(express.static(DIST_DIR, { index: "index.html" }));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

async function boot() {
  const dbReady = await ensureDatabase().catch((error) => {
    console.error("[db] Initialisation impossible:", error?.message ?? error);
    return false;
  });
  app.listen(PORT, () => {
    console.log(`[app] ProspectRadar sur http://localhost:${PORT}`);
    console.log(`[db] PostgreSQL ${dbReady ? "connecté" : "non configuré"}`);
  });
}

boot();