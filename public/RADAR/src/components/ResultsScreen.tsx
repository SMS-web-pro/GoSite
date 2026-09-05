/* ------------------------------------------------------------------ */
/*  Écran 3 — Résultats : fiches qualifiées, journal des rejets,       */
/*  export CSV (uniquement les WhatsApp = OUI) et copie globale.       */
/* ------------------------------------------------------------------ */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Copy,
  FileDown,
  Info,
  ListChecks,
  MessageCircle,
  Radar,
  RotateCcw,
  Search,
  SearchX,
  ShieldCheck,
  ThumbsUp,
  Undo2,
  X,
} from "lucide-react";
import type { AuditState, Brief, CriterionKey, WaStatus } from "../lib/types";
import { buildQuery } from "../lib/api";
import { reasonLabelFor } from "../lib/evaluate";
import { buildCsv, buildFiche, buildRow, copyText, downloadCsv, slugify } from "../lib/csv";
import BusinessCard from "./BusinessCard";

interface Props {
  brief: Brief;
  audit: AuditState;
  waMap: Record<string, WaStatus>;
  onReset: () => void;
  onPromote: (ids: string[]) => void;
  onDemote: (id: string) => void;
}

function StatCard({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: number;
  tone: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel/80 px-5 py-4 backdrop-blur">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-fog">{label}</p>
      <p className={`mt-1 font-display text-4xl font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="mt-1 text-[11px] text-fog">{sub}</p>
    </div>
  );
}

export default function ResultsScreen({
  brief,
  audit,
  waMap,
  onReset,
  onPromote,
  onDemote,
}: Props) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [reasonFilter, setReasonFilter] = useState<CriterionKey | "ALL">("ALL");
  const [rejectSearch, setRejectSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<string>("ALL");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const togglePick = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const zonesInRejects = useMemo(
    () => [...new Set(audit.rejected.map((r) => r.zone).filter(Boolean))],
    [audit.rejected]
  );

  /* Décompte des causes + liste filtrée des rejets */
  const reasonCounts = useMemo(() => {
    const m = new Map<CriterionKey, number>();
    for (const r of audit.rejected) {
      for (const k of r.keys) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [audit.rejected]);

  const filteredRejected = useMemo(() => {
    const q = rejectSearch.trim().toLowerCase();
    return audit.rejected.filter(
      (r) =>
        (reasonFilter === "ALL" || r.keys.includes(reasonFilter)) &&
        (zoneFilter === "ALL" || r.zone === zoneFilter) &&
        (!q || r.name.toLowerCase().includes(q))
    );
  }, [audit.rejected, reasonFilter, zoneFilter, rejectSearch]);

  const pickedVisible = filteredRejected.filter((r) => picked.has(r.id));
  const allVisiblePicked =
    filteredRejected.length > 0 && pickedVisible.length === filteredRejected.length;

  const validateSelection = () => {
    const ids = [...picked];
    if (!ids.length) return;
    onPromote(ids);
    setPicked(new Set());
  };

  const waOui = useMemo(
    () => audit.qualified.filter((b) => waMap[b.id] === "oui"),
    [audit.qualified, waMap]
  );
  const waExact = useMemo(
    () => audit.qualified.filter((b) => waMap[b.id] === "oui" && b.waValidation?.verified === true).length,
    [audit.qualified, waMap]
  );
  const waNon = useMemo(
    () => audit.qualified.filter((b) => waMap[b.id] === "non").length,
    [audit.qualified, waMap]
  );
  const waTodo = audit.qualified.length - waOui.length - waNon;

  const exportCsv = () => {
    const rows = waOui.map((b) => buildRow(b, "oui"));
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `prospects_${slugify(brief.type)}_${slugify(brief.ville)}_${date}_whatsapp-verifies.csv`,
      buildCsv(rows)
    );
  };

  const copyAllFiches = async () => {
    const text = waOui
      .map((b, i) => `${i + 1}/${waOui.length}\n${buildFiche(b, "oui")}`)
      .join("\n\n");
    const ok = await copyText(text);
    if (ok) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1800);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Barre supérieure */}
      <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line-strong bg-panel text-lime">
              <Radar className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold text-zinc-100">Résultats d'audit</p>
              <p className="font-mono text-[10.5px] text-radar">
                "{buildQuery(brief)}" · Pays {brief.gl.toUpperCase()} · {brief.zones.length} zone
                {brief.zones.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-[12.5px] font-medium text-mist transition-colors hover:border-line-strong hover:text-zinc-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Nouvelle recherche
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-28 pt-8">
        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Fiches analysées" value={audit.scanned} tone="text-zinc-100" sub={`${audit.pages || 1} page(s) /places · ${audit.credits} crédits Serper`} />
          <StatCard label="Qualifiées" value={audit.qualified.length} tone="text-radar" sub="7 critères auto respectés" />
          <StatCard label="Rejetées" value={audit.rejected.length} tone="text-amber-400" sub="raisons documentées plus bas" />
          <StatCard
            label="WhatsApp validés (OUI)"
            value={waOui.length}
            tone="text-lime"
            sub={`${waExact} exacts (Baileys) · ${waOui.length - waExact} estimés · ${waNon} non WA`}
          />
        </div>

        {/* Barre d'export */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 overflow-hidden rounded-2xl border border-lime/25 bg-panel"
        >
          <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime/15 text-lime">
                <FileDown className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 className="font-display text-[15px] font-semibold text-zinc-100">
                  Livraison finale — CSV prêt à l'emploi
                </h2>
                <p className="mt-0.5 max-w-lg text-[12px] leading-relaxed text-fog">
                  15 colonnes (dont la fiche complète copiable). Conformément à votre règle :{" "}
                  <strong className="text-mist">seules les fiches WhatsApp = OUI</strong> sont
                  exportées. Encodage UTF-8, séparateur « ; » — s'ouvre directement dans Excel.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 md:ml-auto">
              <button
                onClick={copyAllFiches}
                disabled={waOui.length === 0}
                className="flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-[13px] font-medium text-mist transition-colors hover:border-line-strong hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copiedAll ? <Check className="h-4 w-4 text-radar" /> : <Copy className="h-4 w-4" />}
                {copiedAll ? "Tout est copié !" : `Copier (${waOui.length})`}
              </button>
              <button
                onClick={exportCsv}
                disabled={waOui.length === 0}
                className="flex items-center gap-2 rounded-xl bg-lime px-5 py-3 font-display text-[13px] font-semibold text-ink transition-colors hover:bg-radar disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileDown className="h-4 w-4" />
                Exporter CSV ({waOui.length} WhatsApp vérifiés)
              </button>
            </div>
          </div>
          {audit.qualified.length > 0 && waTodo > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-lime/15 bg-lime/5 px-6 py-3 text-[12px] text-mist">
              <div className="flex items-center gap-2">
                <Info className="h-3.5 w-3.5 shrink-0 text-lime" />
                <span>{waTodo} fiche(s) attendent une réponse exacte de Baileys onWhatsApp(). Scannez le QR réel pour terminer automatiquement.</span>
              </div>
            </div>
          )}
        </motion.section>

        {/* Fiches qualifiées */}
        {audit.qualified.length > 0 ? (
          <>
            <div className="mt-10 flex items-center gap-2.5">
              <ListChecks className="h-4 w-4 text-radar" />
              <h2 className="font-display text-lg font-semibold text-zinc-100">
                {audit.qualified.length} fiche{audit.qualified.length > 1 ? "s" : ""} qualifiée
                {audit.qualified.length > 1 ? "s" : ""}
              </h2>
              <span className="font-mono text-[10.5px] text-fog">
                — note ≥ 4,3 · ≥ 20 avis · sans site web · téléphone présent
              </span>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {audit.qualified.map((b, i) => (
                <div key={b.id} className="relative">
                  {b.promoted && (
                    <div className="mb-2 flex items-center gap-2 rounded-xl border border-radar/30 bg-radar/10 px-3.5 py-2">
                      <ThumbsUp className="h-3.5 w-3.5 shrink-0 text-radar" />
                      <span className="text-[11.5px] font-medium text-radar">
                        Repêchée manuellement — validée par vos soins malgré un critère manquant
                      </span>
                      <button
                        onClick={() => onDemote(b.id)}
                        title="Renvoyer dans les rejets"
                        className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-mist transition-colors hover:text-zinc-100"
                      >
                        <Undo2 className="h-3 w-3" />
                        Annuler
                      </button>
                    </div>
                  )}
                  <BusinessCard
                    index={i}
                    business={b}
                    evaluation={audit.evaluations[b.id]}
                    wa={waMap[b.id] ?? "pending"}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-panel text-fog">
              <SearchX className="h-6 w-6" />
            </span>
            <h2 className="mt-5 font-display text-xl font-semibold text-zinc-100">
              Aucune fiche ne remplit les 7 critères
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-fog">
              {audit.scanned > 0
                ? `${audit.scanned} fiches ont été auditées et rejetées — les causes dominantes sont indiquées dans le journal des rejets ci-dessous. Le journal d'audit (écran précédent) affiche aussi le 1er objet brut reçu de Serper pour vérifier les champs réels.`
                : "Aucune fiche n'a été retournée par Serper pour cette requête — vérifiez l'orthographe de la ville, le pays (gl) choisi, ou essayez une grande ville proche."}{" "}
              Élargissez la zone (« {brief.ville} et alentours ») ou essayez un secteur voisin.
            </p>
            <button
              onClick={onReset}
              className="mt-6 flex items-center gap-2 rounded-xl bg-lime px-5 py-3 font-display text-[13px] font-semibold text-ink transition-colors hover:bg-radar"
            >
              <RotateCcw className="h-4 w-4" />
              Ajuster le brief
            </button>
          </div>
        )}

        {/* Journal des rejets */}
        {audit.rejected.length > 0 && (
          <details className="group mt-12 overflow-hidden rounded-2xl border border-line bg-panel/70">
            <summary className="flex flex-wrap items-center gap-x-3 gap-y-2 px-6 py-4 transition-colors hover:bg-raise/40">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="font-display text-[15px] font-semibold text-zinc-100">
                Audit des rejets — {audit.rejected.length} fiche{audit.rejected.length > 1 ? "s" : ""} écartée
                {audit.rejected.length > 1 ? "s" : ""}
              </span>
              {Object.entries(audit.tally)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([reason, n]) => (
                  <span
                    key={reason}
                    className="rounded-full border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 text-[10px] font-medium text-amber-300"
                  >
                    {reason} ×{n}
                  </span>
                ))}
              <ChevronDown className="ml-auto h-4 w-4 text-fog transition-transform group-open:rotate-180" />
            </summary>

            {/* Filtres sur les fiches écartées */}
            <div className="space-y-3 border-t border-line bg-ink/40 px-6 py-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setReasonFilter("ALL")}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                    reasonFilter === "ALL"
                      ? "border-lime bg-lime/10 text-lime"
                      : "border-line text-mist hover:border-line-strong hover:text-zinc-100"
                  }`}
                >
                  Toutes les causes · {audit.rejected.length}
                </button>
                {reasonCounts.map(([key, n]) => (
                  <button
                    key={key}
                    onClick={() => setReasonFilter(reasonFilter === key ? "ALL" : key)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      reasonFilter === key
                        ? "border-amber-400 bg-amber-400/15 text-amber-300"
                        : "border-line text-mist hover:border-line-strong hover:text-zinc-100"
                    }`}
                    aria-pressed={reasonFilter === key}
                  >
                    {reasonLabelFor(key, brief.criteria)} · {n}
                  </button>
                ))}
              </div>
              {/* Filtre par zone (multi-zones) */}
              {zonesInRejects.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-fog">
                    Zone
                  </span>
                  <button
                    onClick={() => setZoneFilter("ALL")}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      zoneFilter === "ALL"
                        ? "border-lime bg-lime/10 text-lime"
                        : "border-line text-mist hover:border-line-strong hover:text-zinc-100"
                    }`}
                  >
                    Toutes
                  </button>
                  {zonesInRejects.map((z) => (
                    <button
                      key={z}
                      onClick={() => setZoneFilter(zoneFilter === z ? "ALL" : z)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                        zoneFilter === z
                          ? "border-lime bg-lime/10 text-lime"
                          : "border-line text-mist hover:border-line-strong hover:text-zinc-100"
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative max-w-xs flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fog" />
                  <input
                    type="text"
                    value={rejectSearch}
                    onChange={(e) => setRejectSearch(e.target.value)}
                    placeholder="Rechercher une fiche écartée…"
                    aria-label="Rechercher dans les rejets"
                    className="w-full rounded-lg border border-line bg-ink py-2 pl-9 pr-3 text-[12.5px] text-zinc-100 placeholder:text-fog/60 focus:border-lime/60 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() =>
                    setPicked((p) => {
                      const n = new Set(p);
                      if (allVisiblePicked) filteredRejected.forEach((r) => n.delete(r.id));
                      else filteredRejected.forEach((r) => n.add(r.id));
                      return n;
                    })
                  }
                  disabled={filteredRejected.length === 0}
                  className="rounded-lg border border-line px-3 py-2 font-mono text-[11px] text-mist transition-colors hover:border-line-strong hover:text-zinc-100 disabled:opacity-40"
                >
                  {allVisiblePicked ? "Tout désélectionner" : "Tout sélectionner"}
                </button>
                <span className="ml-auto font-mono text-[10.5px] text-fog">
                  {filteredRejected.length} / {audit.rejected.length} fiche
                  {audit.rejected.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Barre de validation manuelle */}
              <div
                className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  picked.size > 0
                    ? "border-radar/40 bg-radar/10"
                    : "border-line bg-ink/40"
                }`}
              >
                <ThumbsUp
                  className={`h-4 w-4 shrink-0 ${picked.size > 0 ? "text-radar" : "text-fog"}`}
                />
                <p className="text-[12px] leading-snug text-mist">
                  {picked.size > 0 ? (
                    <>
                      <strong className="text-zinc-100">{picked.size}</strong> fiche
                      {picked.size > 1 ? "s" : ""} sélectionnée{picked.size > 1 ? "s" : ""} — les
                      valider les ajoute à vos prospects malgré le critère manquant.
                    </>
                  ) : (
                    "Cochez les fiches que vous jugez malgré tout exploitables pour les repêcher."
                  )}
                </p>
                <button
                  onClick={validateSelection}
                  disabled={picked.size === 0}
                  className="ml-auto flex items-center gap-2 rounded-xl bg-radar px-4 py-2.5 font-display text-[12.5px] font-semibold text-ink transition-colors hover:bg-lime disabled:cursor-not-allowed disabled:bg-raise disabled:text-fog"
                >
                  <Check className="h-4 w-4" />
                  Valider comme prospect{picked.size > 1 ? "s" : ""}
                </button>
              </div>
            </div>

            {filteredRejected.length === 0 && (
              <p className="border-t border-line px-6 py-8 text-center text-[12.5px] text-fog">
                Aucune fiche ne correspond à ce filtre.
              </p>
            )}

            <ul className="max-h-[480px] divide-y divide-line overflow-y-auto border-t border-line">
              {filteredRejected.map((r) => (
                <li
                  key={r.id}
                  className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3.5 transition-colors ${
                    picked.has(r.id) ? "bg-radar/[0.07]" : ""
                  }`}
                >
                  <label className="flex cursor-pointer items-center" title="Sélectionner pour repêchage">
                    <input
                      type="checkbox"
                      checked={picked.has(r.id)}
                      onChange={() => togglePick(r.id)}
                      className="h-4 w-4 shrink-0 cursor-pointer accent-[#4ade80]"
                      aria-label={`Sélectionner ${r.name}`}
                    />
                  </label>
                  <a
                    href={r.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 truncate text-[13px] font-medium text-zinc-200 u-sweep hover:text-lime"
                  >
                    {r.name}
                  </a>
                  <span className="font-mono text-[10.5px] text-fog">
                    {r.rating !== null ? `${r.rating.toFixed(1)}★` : "—"} · {r.reviewCount} avis
                    {r.zone && ` · ${r.zone}`}
                  </span>
                  <button
                    onClick={() => onPromote([r.id])}
                    title="Valider cette fiche comme prospect"
                    className="flex items-center gap-1 rounded-md border border-radar/30 px-2 py-1 text-[10px] font-semibold text-radar transition-colors hover:bg-radar/15"
                  >
                    <Check className="h-3 w-3" />
                    Valider
                  </button>
                  <span className="flex flex-wrap gap-1.5 md:ml-auto">
                    {r.reasons.map((reason, ri) => {
                      /* reasons[i] correspond toujours à keys[i] (même ordre de poussée) */
                      const isMatchedCause =
                        reasonFilter !== "ALL" && r.keys[ri] === reasonFilter;
                      return (
                        <span
                          key={reason}
                          className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                            isMatchedCause
                              ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                              : "border-red-400/20 bg-red-400/5 text-red-300"
                          }`}
                        >
                          <X className="h-2.5 w-2.5" />
                          {reason}
                        </span>
                      );
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* Pied */}
        <footer className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-6 font-mono text-[10px] text-fog">
          <span className="flex items-center gap-2">
            <Radar className="h-3 w-3 text-lime" />
            PROSPECTRADAR
          </span>
          <span>Source unique : Serper API — données Google Maps, interrogée en direct</span>
          <span className="flex items-center gap-1.5">
            <MessageCircle className="h-3 w-3" />
            Validation WhatsApp via wa.me — contrôle manuel assisté
          </span>
          <span>Aucune donnée fictive · aucun serveur intermédiaire</span>
        </footer>
      </main>
    </div>
  );
}
