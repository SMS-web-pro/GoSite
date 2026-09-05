/* ------------------------------------------------------------------ */
/*  ProspectRadar — composition des 3 phases                           */
/*  1. Brief (3 questions) → 2. Audit en direct → 3. Résultats + CSV   */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Brief } from "./lib/types";
import { DEFAULT_CRITERIA } from "./lib/evaluate";
import { useProspection } from "./hooks/useProspection";
import BriefScreen from "./components/BriefScreen";
import PipelineScreen from "./components/PipelineScreen";
import ResultsScreen from "./components/ResultsScreen";
import ApiKeyDialog from "./components/ApiKeyDialog";

const KEY_STORAGE = "prospectradar_key_v1";
const BRIEF_STORAGE = "prospectradar_brief_v1";

type Phase = "brief" | "audit" | "results";

interface Credentials {
  key: string;
  proxy?: string;
}

function loadCredentials(): Credentials {
  try {
    const raw = localStorage.getItem(KEY_STORAGE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "string") return { key: parsed.trim() };
      if (parsed && typeof parsed.key === "string") return { key: parsed.key.trim(), proxy: parsed.proxy };
      return { key: String(raw).trim() };
    }
  } catch {
    const raw = localStorage.getItem(KEY_STORAGE);
    if (raw && typeof raw === "string") return { key: raw.trim() };
  }
  return { key: "" };
}

function loadBrief(): Brief | null {
  try {
    const raw = localStorage.getItem(BRIEF_STORAGE);
    if (!raw) return null;
    const b = JSON.parse(raw) as Partial<Brief>;
    return {
      type: b.type ?? "",
      ville: b.ville ?? "",
      zones: b.zones?.length ? b.zones : b.ville ? [b.ville] : [],
      perZone: b.perZone ?? 0,
      volume: b.volume ?? 20,
      lang: b.lang ?? "fr",
      gl: b.gl && b.gl.length === 2 ? b.gl.toLowerCase() : "fr",
      scope: b.scope ?? "manual",
      cityCount: b.cityCount ?? 15,
      maxCredits: b.maxCredits ?? 400,
      webEnrich: b.webEnrich ?? false,
      waAutoMode: b.waAutoMode ?? "auto",
      waGatewayUrl: (b as { waGatewayUrl?: string }).waGatewayUrl ?? "",
      criteria: { ...DEFAULT_CRITERIA, ...(b.criteria ?? {}) },
    };
  } catch {
    return null;
  }
}

const pageMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

export default function App() {
  const [creds, setCreds] = useState<Credentials>(loadCredentials);
  const [initialBrief] = useState<Brief | null>(loadBrief);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [phase, setPhase] = useState<Phase>("brief");
  const [keyOpen, setKeyOpen] = useState(false);
  const [pendingBrief, setPendingBrief] = useState<Brief | null>(null);

  const { audit, start, reset, stop, waMap, promoteRejected, demoteQualified } =
    useProspection();

  const launch = useCallback(
    (b: Brief, c: Credentials) => {
      setPhase("audit");
      start(b, c.key, c.proxy);
    },
    [start]
  );

  /* Brief soumis → clé requise, sinon on la demande d'abord */
  const handleLaunch = useCallback(
    (b: Brief) => {
      setBrief(b);
      try {
        localStorage.setItem(BRIEF_STORAGE, JSON.stringify(b));
      } catch {
        /* ignore */
      }
      if (!creds.key) {
        setPendingBrief(b);
        setKeyOpen(true);
        return;
      }
      launch(b, creds);
    },
    [creds, launch]
  );

  /* Clé vérifiée → on enchaîne directement sur l'audit si un brief attend */
  const handleKeySaved = useCallback(
    (key: string, proxy?: string) => {
      const next: Credentials = { key, proxy };
      setCreds(next);
      try {
        localStorage.setItem(KEY_STORAGE, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      setKeyOpen(false);
      if (pendingBrief) {
        launch(pendingBrief, next);
        setPendingBrief(null);
      }
    },
    [pendingBrief, launch]
  );

  /* Audit terminé → transition douce vers les résultats */
  useEffect(() => {
    if (phase !== "audit" || audit.status !== "done") return;
    const t = setTimeout(() => setPhase("results"), 1300);
    return () => clearTimeout(t);
  }, [phase, audit.status]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase]);

  const handleReset = useCallback(() => {
    reset();
    setPhase("brief");
  }, [reset]);

  return (
    <div className="noise min-h-screen bg-ink font-sans text-zinc-100">
      <AnimatePresence mode="wait">
        {phase === "brief" && (
          <motion.div key="brief" {...pageMotion}>
            <BriefScreen
              onLaunch={handleLaunch}
              apiKeyReady={!!creds.key}
              onOpenKey={() => setKeyOpen(true)}
              initial={brief ?? initialBrief}
            />
          </motion.div>
        )}

        {phase === "audit" && brief && (
          <motion.div key="audit" {...pageMotion}>
            <PipelineScreen
              brief={brief}
              audit={audit}
              onCancel={handleReset}
              onStop={stop}
            />
          </motion.div>
        )}

        {phase === "results" && brief && (
          <motion.div key="results" {...pageMotion}>
            <ResultsScreen
              brief={brief}
              audit={audit}
              waMap={waMap}
              onReset={handleReset}
              onPromote={promoteRejected}
              onDemote={demoteQualified}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ApiKeyDialog
        open={keyOpen}
        onClose={() => {
          setKeyOpen(false);
          setPendingBrief(null);
        }}
        onSaved={handleKeySaved}
        initialKey={creds.key}
        initialProxy={creds.proxy ?? ""}
      />
    </div>
  );
}
