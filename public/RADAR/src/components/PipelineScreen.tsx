/* ------------------------------------------------------------------ */
/*  Écran 2 — Audit en cours : radar, compteurs animés, journal temps  */
/*  réel de chaque décision (qualifié / rejeté + raison).              */
/* ------------------------------------------------------------------ */

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  CircleDashed,
  Radar,
  RotateCcw,
  Terminal,
  X,
} from "lucide-react";
import type { AuditState, Brief, LogKind } from "../lib/types";
import { buildQuery } from "../lib/api";
import RadarCanvas from "./RadarCanvas";

const LOG_STYLE: Record<LogKind, { icon: string; cls: string }> = {
  cmd: { icon: "›", cls: "text-lime" },
  info: { icon: "·", cls: "text-mist" },
  ok: { icon: "✓", cls: "text-radar" },
  warn: { icon: "✗", cls: "text-amber-400/90" },
  err: { icon: "!", cls: "text-red-400" },
  raw: { icon: "#", cls: "text-fog" },
};

interface Props {
  brief: Brief;
  audit: AuditState;
  onCancel: () => void;
  onStop: () => void;
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel/80 px-5 py-4 backdrop-blur">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-fog">{label}</p>
      <motion.p
        key={value}
        initial={{ opacity: 0.3, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-1 font-display text-4xl font-bold tabular-nums ${tone}`}
      >
        {value}
      </motion.p>
    </div>
  );
}

export default function PipelineScreen({ brief, audit, onCancel, onStop }: Props) {
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = termRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [audit.logs.length]);

  const running = audit.status === "running";

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden opacity-40">
        <RadarCanvas intensity={0.3} />
        <div
          className="absolute inset-0"
          style={{ boxShadow: "inset 0 -120px 120px -40px #0a0d0b, inset 0 60px 120px -40px #0a0d0b" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-8">
        {/* En-tête */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line-strong bg-panel text-lime">
              <Radar className={`h-5 w-5 ${running ? "animate-[spin_3.5s_linear_infinite]" : ""}`} />
            </span>
            <div>
              <h1 className="font-display text-xl font-semibold text-zinc-100">
                {running ? "Radar en balayage" : audit.status === "error" ? "Audit interrompu" : "Audit terminé"}
              </h1>
              <p className="font-mono text-[11px] text-radar">
                "{buildQuery(brief)}" · Pays {brief.gl.toUpperCase()} · {brief.zones.length} zone
                {brief.zones.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {running && (
              <button
                onClick={onStop}
                title="Arrêter le balayage et conserver les fiches déjà collectées"
                className="flex items-center gap-2 rounded-xl border border-lime/40 bg-lime/10 px-4 py-2.5 text-[12.5px] font-semibold text-lime transition-colors hover:bg-lime/20"
              >
                <Check className="h-3.5 w-3.5" />
                Arrêter &amp; garder les résultats
              </button>
            )}
            <button
              onClick={onCancel}
              className="flex items-center gap-2 rounded-xl border border-line bg-panel/80 px-4 py-2.5 text-[12.5px] font-medium text-mist backdrop-blur transition-colors hover:border-line-strong hover:text-zinc-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {running ? "Annuler" : "Nouvelle recherche"}
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Colonne gauche : radar + stats */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-line">
              <RadarCanvas intensity={running ? 1 : 0.45} />
              <div className="absolute left-4 top-4 font-mono text-[9.5px] uppercase tracking-[0.22em] text-fog">
                GRID-{brief.ville.slice(0, 3).toUpperCase() || "···"} · PAYS {brief.gl.toUpperCase()}
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.18em]">
                <span className="text-fog">
                  Page {Math.max(1, audit.pages)} · {audit.found} reçues · {audit.credits} crédits
                </span>
                <span className={running ? "text-radar" : "text-lime"}>
                  {running ? "SCAN ACTIF" : audit.status === "error" ? "ERREUR" : "TERMINÉ"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Analysées" value={audit.scanned} tone="text-zinc-100" />
              <Stat label="Qualifiées" value={audit.qualified.length} tone="text-radar" />
              <Stat label="Rejetées" value={audit.rejected.length} tone="text-amber-400" />
            </div>

            <div className="rounded-2xl border border-line bg-panel/80 px-5 py-4 backdrop-blur">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-fog">
                Objectif — {brief.volume} fiches qualifiées
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-raise">
                <motion.div
                  className="h-full rounded-full bg-lime"
                  animate={{
                    width: `${Math.min(100, (audit.qualified.length / Math.max(1, brief.volume)) * 100)}%`,
                  }}
                  transition={{ type: "spring", stiffness: 90, damping: 20 }}
                />
              </div>
              <p className="mt-2 font-mono text-[11px] text-mist">
                {audit.qualified.length} / {brief.volume} — seules les fiches passant les 7 critères
                comptent
              </p>
            </div>
          </div>

          {/* Colonne droite : terminal */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-panel/85 backdrop-blur">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <div className="flex items-center gap-2.5">
                <Terminal className="h-3.5 w-3.5 text-fog" />
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-fog">
                  Journal d'audit — décision par décision
                </span>
              </div>
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400/60" />
                <span className="h-2 w-2 rounded-full bg-amber-400/60" />
                <span className="h-2 w-2 rounded-full bg-radar/60" />
              </div>
            </div>

            <div ref={termRef} className="h-[520px] overflow-y-auto px-5 py-4 font-mono text-[12px] leading-[1.9]">
              {audit.logs.map((line) =>
                line.kind === "raw" ? (
                  <motion.pre
                    key={line.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="my-2 max-h-64 overflow-y-auto whitespace-pre-wrap break-all rounded-lg border border-lime/20 bg-ink/70 px-3 py-2.5 font-mono text-[10px] leading-relaxed text-mist"
                  >
                    {line.text}
                  </motion.pre>
                ) : (
                  <motion.div
                    key={line.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3"
                  >
                    <span className="shrink-0 select-none text-fog/60">{line.time}</span>
                    <span className={`shrink-0 select-none ${LOG_STYLE[line.kind].cls}`}>
                      {LOG_STYLE[line.kind].icon}
                    </span>
                    <span className={LOG_STYLE[line.kind].cls}>{line.text}</span>
                  </motion.div>
                )
              )}
              {running && (
                <div className="flex gap-3">
                  <span className="select-none text-fog/60">········</span>
                  <span className="caret select-none text-lime">▋</span>
                </div>
              )}
            </div>

            {audit.status === "error" && (
              <div className="border-t border-line bg-red-400/5 px-5 py-4">
                <div className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-red-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{audit.error}</span>
                </div>
                <button
                  onClick={onCancel}
                  className="mt-3 flex items-center gap-2 rounded-xl bg-red-400/15 px-4 py-2 text-[12px] font-semibold text-red-200 transition-colors hover:bg-red-400/25"
                >
                  <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                  Revenir au brief
                </button>
              </div>
            )}

            {audit.status === "done" && (
              <div className="flex items-center justify-between border-t border-line bg-raise/50 px-5 py-3.5">
                <div className="flex items-center gap-2 font-mono text-[11px] text-radar">
                  {audit.qualified.length > 0 ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Transmission des fiches qualifiées…
                    </>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-amber-400">Aucune fiche qualifiée — ajustez la zone</span>
                    </>
                  )}
                </div>
                <CircleDashed className="h-4 w-4 animate-[spin_2.5s_linear_infinite] text-fog" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
