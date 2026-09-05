/* ------------------------------------------------------------------ */
/*  Écran 1 — Brief de mission : les 3 questions + critères affichés   */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  ChevronDown,
  Globe2,
  History,
  KeyRound,
  LayoutDashboard,
  Link2Off,
  MapPin,
  MessageCircle,
  MessageSquareQuote,
  Phone,
  Plus,
  Radar,
  Route,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import type { Brief, CriteriaConfig, Lang, ScopeMode, WaAutoMode } from "../lib/types";
import { COUNTRIES } from "../lib/api";
import { baremeString, DEFAULT_CRITERIA } from "../lib/evaluate";
import { buildScopePlan, cityPool, hasGeo } from "../lib/geo";
import RadarCanvas from "./RadarCanvas";
import WhatsAppGatewayDialog from "./WhatsAppGatewayDialog";

const fr1 = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

const SUGGESTIONS = [
  "Plombier",
  "Coiffeur",
  "Restaurant",
  "Électricien",
  "Boulangerie",
  "Serrurier",
  "Paysagiste",
  "Esthéticienne",
  "Menuisier",
  "Garage automobile",
];

const VOLUMES = [10, 20, 30, 50];

const RECENT_OPTIONS = [
  { v: 30, l: "30 j" },
  { v: 60, l: "60 j" },
  { v: 90, l: "90 j" },
  { v: 180, l: "180 j" },
  { v: 365, l: "1 an" },
  { v: 0, l: "OFF" },
];

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 text-left"
    >
      <span>
        <span className="block text-[12.5px] font-medium text-zinc-200">{label}</span>
        <span className="block text-[10.5px] leading-snug text-fog">{hint}</span>
      </span>
      <span
        className={`relative h-5.5 w-10 shrink-0 rounded-full transition-colors ${
          checked ? "bg-lime" : "bg-raise"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-ink transition-all ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

interface Props {
  onLaunch: (brief: Brief) => void;
  apiKeyReady: boolean;
  onOpenKey: () => void;
  initial: Brief | null;
}

export default function BriefScreen({ onLaunch, apiKeyReady, onOpenKey, initial }: Props) {
  const [type, setType] = useState(initial?.type ?? "");
  const [ville, setVille] = useState(initial?.ville ?? "");
  const [volume, setVolume] = useState(initial?.volume ?? 20);
  const [lang, setLang] = useState<Lang>(initial?.lang ?? "fr");
  const [gl, setGl] = useState(initial?.gl ?? "fr");
  const [criteria, setCriteria] = useState<CriteriaConfig>(
    initial?.criteria ?? DEFAULT_CRITERIA
  );
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [zones, setZones] = useState<string[]>(initial?.zones ?? []);
  const [perZone, setPerZone] = useState(initial?.perZone ?? 0);
  const [scope, setScope] = useState<ScopeMode>(initial?.scope ?? "manual");
  const [cityCount, setCityCount] = useState(initial?.cityCount ?? 15);
  const [maxCredits, setMaxCredits] = useState(initial?.maxCredits ?? 400);
  const [webEnrich, setWebEnrich] = useState(initial?.webEnrich ?? false);
  const [waAutoMode] = useState<WaAutoMode>(initial?.waAutoMode ?? "auto");
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [whatsAppConnected, setWhatsAppConnected] = useState(false);
  const [launchAfterWhatsApp, setLaunchAfterWhatsApp] = useState(false);

  const addZone = (raw: string) => {
    /* Accepte aussi un collage multi-zones séparé par virgules ou retours ligne */
    const parts = raw
      .split(/[,\n;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);
    if (!parts.length) return;
    setZones((prev) => {
      const next = [...prev];
      for (const p of parts) {
        if (!next.some((z) => z.toLowerCase() === p.toLowerCase())) next.push(p);
      }
      return next;
    });
    setVille("");
  };

  /* Zones manuelles : la liste, ou la saisie courante si la liste est vide */
  const manualZones = zones.length ? zones : ville.trim() ? [ville.trim()] : [];
  /* Plan effectif : dépend de la portée choisie (manuel / villes / régions / national) */
  const plan = buildScopePlan(scope, gl, manualZones, cityCount);
  const effectiveZones = plan.zones;
  const geoReady = hasGeo(gl);
  const poolSize = cityPool(gl);

  /* Estimation de crédits : ~4 crédits par zone explorée + 1/fiche (+1 si web) */
  const estCredits = Math.min(
    maxCredits || Infinity,
    effectiveZones.length * 4 + volume * (webEnrich ? 2 : 1)
  );

  const ready = type.trim().length > 1 && effectiveZones.length > 0 && volume >= 5;

  const currentBrief = (): Brief => ({
    type: type.trim(),
    ville: effectiveZones[0],
    zones: effectiveZones,
    perZone,
    volume,
    lang,
    gl,
    criteria,
    scope,
    cityCount,
    maxCredits,
    webEnrich,
    waAutoMode: waAutoMode ?? "auto",
  });

  const bandCrit = [
    { icon: MapPin, label: "Zone ciblée" },
    {
      icon: Star,
      label: criteria.minRating > 0 ? `Note ≥ ${fr1(criteria.minRating)}` : "Note libre",
    },
    {
      icon: MessageSquareQuote,
      label: criteria.minReviews > 0 ? `≥ ${criteria.minReviews} avis` : "Avis libres",
    },
    {
      icon: Link2Off,
      label: criteria.requireNoWebsite ? "Sans site web" : "Site web toléré",
    },
    {
      icon: Phone,
      label: criteria.requirePhone ? "Téléphone présent" : "Téléphone optionnel",
    },
    {
      icon: CalendarClock,
      label: criteria.recentDays > 0 ? `Actif < ${criteria.recentDays} j` : "Activité libre",
    },
    { icon: History, label: "Ouvert 2 ans +" },
    { icon: MessageCircle, label: "WhatsApp validé" },
  ];
  const previewZone =
    effectiveZones.length > 1
      ? `${effectiveZones[0]} … +${effectiveZones.length - 1}`
      : (effectiveZones[0] ?? "[ville]");
  const queryPreview = `${type.trim() || "[type de business]"} near ${previewZone}`;

  return (
    <div className="relative min-h-screen">
      {/* Fond radar */}
      <div className="absolute inset-0">
        <RadarCanvas intensity={0.4} />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 220px 80px rgba(10,13,11,0.96)" }}
      />

      <div className="relative z-10">
        {/* Barre supérieure */}
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line-strong bg-panel text-lime">
              <Radar className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold tracking-wide text-zinc-100">
                PROSPECT<span className="text-lime">RADAR</span>
              </p>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-fog">
                Google Maps lead finder
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl border border-line bg-panel/80 px-4 py-2.5 text-[12.5px] font-medium text-mist backdrop-blur transition-colors hover:border-line-strong hover:text-zinc-100"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </a>
            <button
              onClick={() => setGatewayOpen(true)}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12px] font-medium transition-colors ${
                whatsAppConnected
                  ? "border-radar/30 bg-radar/10 text-radar"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-300"
              }`}
              title="Connecter WhatsApp par QR Baileys réel"
            >
              <span className="relative flex h-2 w-2">
                <span className={`relative h-2 w-2 rounded-full ${whatsAppConnected ? "bg-radar ping-dot" : "bg-amber-400"}`} />
              </span>
              <MessageCircle className="h-3.5 w-3.5" />
              {whatsAppConnected ? "WhatsApp connecté" : "Connecter WhatsApp"}
            </button>
            <button
              onClick={onOpenKey}
              className="flex items-center gap-2.5 rounded-xl border border-line bg-panel/80 px-4 py-2.5 text-[12.5px] font-medium text-mist backdrop-blur transition-colors hover:border-line-strong hover:text-zinc-100"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`relative h-2 w-2 rounded-full ${
                    apiKeyReady ? "bg-radar text-radar ping-dot" : "bg-amber-400"
                  }`}
                />
              </span>
              <KeyRound className="h-3.5 w-3.5" />
              {apiKeyReady ? "Clé Serper connectée" : "Connecter la clé Serper"}
            </button>
          </div>
        </header>

        {/* Hero */}
        <main className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-14">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-radar"
          >
            Audit Google Maps via Serper en direct — 100 % données réelles, zéro invention
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 80, damping: 18 }}
            className="mt-5 font-display text-[42px] font-bold leading-[1.02] tracking-tight text-zinc-100 md:text-[76px]"
          >
            Repérez les PME
            <br />
            <em className="font-serif font-normal italic text-lime">sans site web</em> près de
            <br />
            chez vous.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="mt-6 max-w-xl text-[15px] leading-relaxed text-mist"
          >
            Un radar de prospection qui interroge Google Maps en temps réel, applique vos{" "}
            <strong className="font-semibold text-zinc-200">7 critères obligatoires</strong> une par
            une, valide chaque numéro sur WhatsApp, puis livre un CSV prêt à l'emploi.
          </motion.p>

          {/* -------- Console de brief -------- */}
          <motion.section
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, type: "spring", stiffness: 70, damping: 18 }}
            className="mt-12 overflow-hidden rounded-2xl border border-line bg-panel/85 backdrop-blur"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-3.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-fog">
                Brief de mission — 3 paramètres
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">
                    Pays (gl)
                  </span>
                  <select
                    value={gl}
                    onChange={(e) => setGl(e.target.value)}
                    aria-label="Pays cible"
                    className="cursor-pointer rounded-lg border border-line bg-panel px-2 py-1 font-mono text-[10.5px] uppercase text-mist focus:border-lime/60 focus:outline-none"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label} (+{c.calling})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">
                    Langue
                  </span>
                  <div className="flex overflow-hidden rounded-lg border border-line">
                    {(["fr", "en"] as Lang[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={`px-2.5 py-1 font-mono text-[10.5px] uppercase transition-colors ${
                          lang === l ? "bg-lime font-semibold text-ink" : "text-mist hover:text-zinc-100"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 01 — Secteur */}
            <div className="grid gap-2 border-b border-line px-6 py-6 md:grid-cols-[56px_1fr] md:gap-6">
              <span className="font-mono text-sm text-lime">01</span>
              <div>
                <label
                  htmlFor="brief-type"
                  className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-fog"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Type de business — quel secteur cherches-tu ?
                </label>
                <input
                  id="brief-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="ex : plomberie, coiffure, restaurant…"
                  autoComplete="off"
                  className="mt-2 w-full border-b border-transparent bg-transparent pb-2 font-display text-2xl font-medium text-zinc-100 placeholder:text-fog/45 focus:border-lime/70 focus:outline-none md:text-[28px]"
                />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setType(s)}
                      className={`rounded-full border px-3 py-1 text-[11.5px] transition-colors ${
                        type === s
                          ? "border-lime bg-lime/10 text-lime"
                          : "border-line text-mist hover:border-line-strong hover:text-zinc-100"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 02 — Zones (multi-villes / quartiers / régions / national) */}
            <div className="grid gap-2 border-b border-line px-6 py-6 md:grid-cols-[56px_1fr] md:gap-6">
              <span className="font-mono text-sm text-lime">02</span>
              <div>
                {/* Portée du balayage */}
                <p className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-fog">
                  <Globe2 className="h-3.5 w-3.5" />
                  Portée du balayage
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2 lg:grid-cols-4">
                  {(
                    [
                      { v: "manual", t: "Zones choisies", d: "Vous listez les zones" },
                      { v: "cities", t: "Villes du pays", d: `Top ${cityCount} villes` },
                      { v: "regions", t: "Régions", d: "Toutes les régions" },
                      { v: "national", t: "National", d: "Villes puis régions" },
                    ] as { v: ScopeMode; t: string; d: string }[]
                  ).map((o) => {
                    const disabled = o.v !== "manual" && !geoReady;
                    return (
                      <button
                        key={o.v}
                        type="button"
                        disabled={disabled}
                        onClick={() => setScope(o.v)}
                        title={disabled ? "Base géographique indisponible pour ce pays" : o.d}
                        className={`rounded-xl border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                          scope === o.v
                            ? "border-lime bg-lime/10"
                            : "border-line hover:border-line-strong"
                        }`}
                      >
                        <span
                          className={`block text-[12.5px] font-semibold ${
                            scope === o.v ? "text-lime" : "text-zinc-200"
                          }`}
                        >
                          {o.t}
                        </span>
                        <span className="block text-[10px] leading-snug text-fog">{o.d}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Réglage du nombre de villes */}
                {(scope === "cities" || scope === "national") && geoReady && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-ink/50 px-4 py-3">
                    <label
                      htmlFor="f-citycount"
                      className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog"
                    >
                      Villes balayées
                    </label>
                    <input
                      id="f-citycount"
                      type="range"
                      min={5}
                      max={poolSize}
                      step={1}
                      value={Math.min(cityCount, poolSize)}
                      onChange={(e) => setCityCount(Number(e.target.value))}
                      className="w-40"
                    />
                    <span className="font-display text-lg font-bold tabular-nums text-lime">
                      {Math.min(cityCount, poolSize)}
                    </span>
                    <span className="text-[10.5px] text-fog">sur {poolSize} disponibles</span>
                  </div>
                )}

                {/* Récapitulatif du plan automatique */}
                {scope !== "manual" && geoReady && (
                  <div className="mt-3 rounded-xl border border-lime/25 bg-lime/[0.06] px-4 py-3">
                    <p className="flex items-center gap-2 text-[12px] font-medium text-lime">
                      <Route className="h-3.5 w-3.5" />
                      Rotation automatique — {plan.label} ({effectiveZones.length} zones)
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-fog">
                      {effectiveZones.slice(0, 14).join(" · ")}
                      {effectiveZones.length > 14 && ` … +${effectiveZones.length - 14}`}
                    </p>
                  </div>
                )}

                <div className={scope === "manual" ? "mt-5" : "mt-5 opacity-45"}>
                <label
                  htmlFor="brief-ville"
                  className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-fog"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Zones à balayer — villes, quartiers ou régions
                  <span className="rounded-md border border-lime/30 bg-lime/10 px-1.5 py-0.5 text-[9px] text-lime">
                    multi-zones
                  </span>
                </label>

                <div className="mt-2 flex items-end gap-2">
                  <input
                    id="brief-ville"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addZone(ville);
                      }
                    }}
                    placeholder="ex : Lyon 3e, Villeurbanne, Bron…"
                    autoComplete="off"
                    className="w-full border-b border-transparent bg-transparent pb-2 font-display text-2xl font-medium text-zinc-100 placeholder:text-fog/45 focus:border-lime/70 focus:outline-none md:text-[28px]"
                  />
                  <button
                    type="button"
                    onClick={() => addZone(ville)}
                    disabled={!ville.trim()}
                    title="Ajouter cette zone (Entrée)"
                    className="mb-1 flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-mono text-[11px] text-mist transition-colors hover:border-lime/50 hover:text-lime disabled:opacity-30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter
                  </button>
                </div>

                {/* Zones sélectionnées */}
                {zones.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {zones.map((z) => (
                      <span
                        key={z}
                        className="flex items-center gap-1.5 rounded-full border border-lime/30 bg-lime/10 py-1 pl-3 pr-1.5 text-[12px] font-medium text-lime"
                      >
                        {z}
                        <button
                          type="button"
                          onClick={() => setZones(zones.filter((x) => x !== z))}
                          aria-label={`Retirer ${z}`}
                          className="rounded-full p-0.5 transition-colors hover:bg-lime/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => setZones([])}
                      className="rounded-full px-2.5 py-1 text-[11px] text-fog transition-colors hover:text-zinc-100"
                    >
                      tout effacer
                    </button>
                  </div>
                )}

                <p className="mt-3 text-[11px] leading-relaxed text-fog">
                  {zones.length === 0
                    ? "Tapez une zone puis Entrée pour l'ajouter. Sans ajout, la zone saisie est utilisée seule."
                    : `${zones.length} zone${zones.length > 1 ? "s" : ""} balayée${zones.length > 1 ? "s" : ""} l'une après l'autre — les doublons entre zones sont automatiquement supprimés.`}
                </p>

                </div>

                {/* Objectif par zone */}
                {effectiveZones.length > 1 && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-ink/50 px-4 py-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog">
                      Fiches max par zone
                    </span>
                    <div className="flex gap-1.5">
                      {[0, 3, 5, 10, 20].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setPerZone(v)}
                          className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                            perZone === v
                              ? "border-lime bg-lime/10 text-lime"
                              : "border-line text-mist hover:border-line-strong hover:text-zinc-100"
                          }`}
                        >
                          {v === 0 ? "Auto" : v}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10.5px] text-fog">
                      {perZone === 0
                        ? `Auto : ~${Math.max(1, Math.ceil(volume / effectiveZones.length))} par zone`
                        : `Plafonné à ${perZone} par zone`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 03 — Volume */}
            <div className="grid gap-2 border-b border-line px-6 py-6 md:grid-cols-[56px_1fr] md:gap-6">
              <span className="font-mono text-sm text-lime">03</span>
              <div>
                <p className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-fog">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Nombre d'entreprises — combien en veux-tu ?
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-5">
                  <span className="font-display text-5xl font-bold tabular-nums text-lime">
                    {volume}
                  </span>
                  <div className="flex gap-1.5">
                    {VOLUMES.map((v) => (
                      <button
                        key={v}
                        onClick={() => setVolume(v)}
                        className={`rounded-lg border px-3.5 py-1.5 font-mono text-[12px] transition-colors ${
                          volume === v
                            ? "border-lime bg-lime/10 text-lime"
                            : "border-line text-mist hover:border-line-strong hover:text-zinc-100"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    step={5}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    aria-label="Nombre d'entreprises"
                    className="w-44 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 04 — Filtres de qualification (avant lancement) */}
            <div
              className={`border-b border-line border-l-2 transition-colors ${
                filtersOpen ? "border-l-lime/60 bg-lime/[0.03]" : "border-l-transparent"
              }`}
            >
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                aria-expanded={filtersOpen}
                className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-6 py-5 text-left transition-colors hover:bg-raise/30 md:gap-6"
              >
                <span className="font-mono text-sm text-lime">04</span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-fog">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filtres de recherche — ajustez les critères AVANT de lancer
                  </p>
                  <p className="mt-1.5 truncate font-display text-[13.5px] font-medium text-zinc-100">
                    {baremeString(criteria)}
                  </p>
                </div>
                <span className="flex items-center gap-2">
                  <span className="hidden rounded-md border border-lime/30 bg-lime/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-lime sm:inline">
                    Réglable
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-fog transition-transform ${
                      filtersOpen ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>

              {filtersOpen && (
                <div className="grid gap-4 border-t border-line px-6 py-6 md:grid-cols-2">
                  {/* Note minimale */}
                  <div className="rounded-xl border border-line bg-ink/50 px-4 py-4">
                    <div className="flex items-baseline justify-between">
                      <label
                        htmlFor="f-rating"
                        className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog"
                      >
                        Note Google minimale
                      </label>
                      <span className="font-display text-xl font-bold tabular-nums text-lime">
                        {criteria.minRating > 0 ? fr1(criteria.minRating) : "OFF"}
                      </span>
                    </div>
                    <input
                      id="f-rating"
                      type="range"
                      min={0}
                      max={5}
                      step={0.1}
                      value={criteria.minRating}
                      onChange={(e) =>
                        setCriteria({ ...criteria, minRating: Number(e.target.value) })
                      }
                      className="mt-3 w-full"
                    />
                    <p className="mt-1.5 flex justify-between text-[10px] text-fog">
                      <span>0 = filtre off</span>
                      <span>5,0</span>
                    </p>
                  </div>

                  {/* Avis minimum */}
                  <div className="rounded-xl border border-line bg-ink/50 px-4 py-4">
                    <div className="flex items-baseline justify-between">
                      <label
                        htmlFor="f-reviews"
                        className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog"
                      >
                        Nombre d'avis minimum
                      </label>
                      <span className="font-display text-xl font-bold tabular-nums text-lime">
                        {criteria.minReviews > 0 ? criteria.minReviews : "OFF"}
                      </span>
                    </div>
                    <input
                      id="f-reviews"
                      type="range"
                      min={0}
                      max={200}
                      step={5}
                      value={criteria.minReviews}
                      onChange={(e) =>
                        setCriteria({ ...criteria, minReviews: Number(e.target.value) })
                      }
                      className="mt-3 w-full"
                    />
                    <p className="mt-1.5 flex justify-between text-[10px] text-fog">
                      <span>0 = filtre off</span>
                      <span>200</span>
                    </p>
                  </div>

                  {/* Activité récente */}
                  <div className="rounded-xl border border-line bg-ink/50 px-4 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog">
                      Activité récente requise (dernier avis)
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {RECENT_OPTIONS.map((o) => (
                        <button
                          key={o.v}
                          type="button"
                          onClick={() => setCriteria({ ...criteria, recentDays: o.v })}
                          className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                            criteria.recentDays === o.v
                              ? "border-lime bg-lime/10 text-lime"
                              : "border-line text-mist hover:border-line-strong hover:text-zinc-100"
                          }`}
                          aria-pressed={criteria.recentDays === o.v}
                        >
                          {o.l}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-fog">
                      Datée via /reviews — « OFF » accepte tout historique
                    </p>
                  </div>

                  {/* Exigences binaires */}
                  <div className="space-y-4 rounded-xl border border-line bg-ink/50 px-4 py-4">
                    <Toggle
                      label="Exiger : aucun site web"
                      hint="Cœur de cible — les fiches avec site sont rejetées"
                      checked={criteria.requireNoWebsite}
                      onChange={(v) => setCriteria({ ...criteria, requireNoWebsite: v })}
                    />
                    <Toggle
                      label="Exiger : téléphone présent"
                      hint="Sans téléphone, la validation WhatsApp est impossible"
                      checked={criteria.requirePhone}
                      onChange={(v) => setCriteria({ ...criteria, requirePhone: v })}
                    />
                  </div>

                  {/* Approfondissement web */}
                  <div className="rounded-xl border border-line bg-ink/50 px-4 py-4">
                    <Toggle
                      label="Approfondissement web (/search)"
                      hint="Confirme l'absence de site officiel · récupère e-mails et réseaux sociaux · +1 crédit par fiche"
                      checked={webEnrich}
                      onChange={setWebEnrich}
                    />
                  </div>

                  {/* Validation WhatsApp : exact (Baileys) + automatique intégrée */}
                  <div className="rounded-xl border border-radar/30 bg-radar/[0.04] px-4 py-4 md:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-radar">
                        <MessageCircle className="h-4 w-4" />
                        Validation WhatsApp exacte — Baileys onWhatsApp()
                      </p>
                      <span className="rounded-md border border-radar/40 bg-radar/15 px-2 py-0.5 font-mono text-[9.5px] uppercase text-radar">
                        {whatsAppConnected ? "Connecté" : "À connecter"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <p className="flex-1 text-[12px] leading-relaxed text-mist">
                        Les numéros sont parsés en E.164 par libphonenumber-js, puis vérifiés par
                        Baileys onWhatsApp(). Photo, About et profil business sont ensuite collectés.
                        Aucun OUI/NON n'est inventé.
                      </p>
                      <button
                        type="button"
                        onClick={() => setGatewayOpen(true)}
                        className="shrink-0 rounded-xl bg-lime px-4 py-2.5 font-display text-[12px] font-semibold text-ink hover:bg-radar"
                      >
                        {whatsAppConnected ? "Voir la session" : "Scanner le QR"}
                      </button>
                    </div>
                  </div>

                  {/* Plafond de crédits */}
                  <div className="rounded-xl border border-line bg-ink/50 px-4 py-4">
                    <div className="flex items-baseline justify-between">
                      <label
                        htmlFor="f-budget"
                        className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog"
                      >
                        Plafond de crédits Serper
                      </label>
                      <span className="font-display text-xl font-bold tabular-nums text-lime">
                        {maxCredits === 0 ? "∞" : maxCredits}
                      </span>
                    </div>
                    <input
                      id="f-budget"
                      type="range"
                      min={0}
                      max={2500}
                      step={50}
                      value={maxCredits}
                      onChange={(e) => setMaxCredits(Number(e.target.value))}
                      className="mt-3 w-full"
                    />
                    <p className="mt-1.5 text-[10px] leading-snug text-fog">
                      Arrêt net au plafond. Estimation de ce brief :{" "}
                      <strong className="text-mist">~{Math.round(estCredits)} crédits</strong>
                    </p>
                  </div>

                  <div className="flex justify-end md:col-span-2">
                    <button
                      type="button"
                      onClick={() => setCriteria({ ...DEFAULT_CRITERIA })}
                      className="rounded-lg border border-line px-3.5 py-2 font-mono text-[10.5px] text-fog transition-colors hover:border-line-strong hover:text-zinc-100"
                    >
                      Rétablir le protocole strict · ≥ 4,3 ★ · ≥ 20 avis · sans site web · &lt; 90 j
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lancement */}
            <div className="flex flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-fog">
                  Syntaxe Google Maps envoyée
                </p>
                <p className="mt-1.5 font-mono text-[13px] text-radar">
                  "{queryPreview}"
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <button
                  onClick={() => {
                    if (!ready) return;
                    if (!whatsAppConnected) {
                      setLaunchAfterWhatsApp(true);
                      setGatewayOpen(true);
                      return;
                    }
                    onLaunch(currentBrief());
                  }}
                  disabled={!ready}
                  className="group flex items-center gap-3 rounded-2xl bg-lime px-7 py-4 font-display text-[15px] font-semibold text-ink transition-all hover:bg-radar disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Radar className="h-5 w-5 transition-transform duration-500 group-hover:rotate-180" />
                  Lancer le radar
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                {!apiKeyReady && (
                  <p className="font-mono text-[10.5px] text-amber-400/90">
                    Étape suivante : connecter votre clé Serper (2 500 crédits gratuits, 2 min)
                  </p>
                )}
              </div>
            </div>
          </motion.section>

          {/* Bandeau critères */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {bandCrit.map((c) => (
              <div
                key={c.label}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-panel/60 px-3.5 py-3 backdrop-blur"
              >
                <c.icon className="h-3.5 w-3.5 shrink-0 text-radar" />
                <span className="text-[11.5px] font-medium text-mist">{c.label}</span>
              </div>
            ))}
          </motion.div>

          <p className="mt-8 font-mono text-[10.5px] leading-relaxed text-fog">
            Source : Serper API (/places + /reviews), données Google Maps réelles. Chaque fiche est
            auditée une par une — une entreprise qui échoue à un seul critère est rejetée et
            documentée. WhatsApp est validé automatiquement et exclusivement par Baileys
            <code className="mx-1 text-zinc-300">onWhatsApp()</code> — aucune estimation n'est exportée.
          </p>
        </main>
      </div>

      {/* Statut WhatsApp automatique */}
      <WhatsAppGatewayDialog
        open={gatewayOpen}
        onClose={() => {
          setGatewayOpen(false);
          setLaunchAfterWhatsApp(false);
        }}
        onConnectionChange={(connected) => {
          setWhatsAppConnected(connected);
          if (connected && launchAfterWhatsApp && ready) {
            setLaunchAfterWhatsApp(false);
            setGatewayOpen(false);
            onLaunch(currentBrief());
          }
        }}
      />
    </div>
  );
}
