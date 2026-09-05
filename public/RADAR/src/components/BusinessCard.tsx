/* ------------------------------------------------------------------ */
/*  Fiche qualifiée — toutes les données GMB + protocole WhatsApp      */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  History,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Quote,
  Share2,
  Star,
  X,
} from "lucide-react";
import type { Business, Criterion, Evaluation, WaStatus } from "../lib/types";
import { todayHours, waLink } from "../lib/evaluate";
import { buildFiche, copyText, gpsString } from "../lib/csv";

/* ------------------------------------------------------------------ */

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Note ${value} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < Math.round(value) ? "fill-lime text-lime" : "fill-raise text-raise"
          }`}
        />
      ))}
    </span>
  );
}

function CriteriaChip({ c, mapsUrl }: { c: Criterion; mapsUrl: string }) {
  const base =
    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-medium";

  if (c.pass === true) {
    return (
      <span className={`${base} border-radar/25 bg-radar/10 text-radar`} title={c.detail}>
        <Check className="h-3 w-3" />
        {c.label}
      </span>
    );
  }
  if (c.pass === false) {
    return (
      <span className={`${base} border-red-400/25 bg-red-400/10 text-red-300`} title={c.detail}>
        <X className="h-3 w-3" />
        {c.label}
      </span>
    );
  }
  /* Audit manuel */
  if (c.key === "age" || c.key === "operational") {
    return (
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className={`${base} border-amber-400/25 bg-amber-400/10 text-amber-300 transition-colors hover:bg-amber-400/20`}
        title={c.detail}
      >
        <History className="h-3 w-3" />
        {c.label} — à vérifier
        <ExternalLink className="h-2.5 w-2.5 opacity-70" />
      </a>
    );
  }
  return (
    <span
      className={`${base} border-amber-400/25 bg-amber-400/10 text-amber-300`}
      title={c.detail}
    >
      <Clock className="h-3 w-3" />
      {c.label} — à confirmer
    </span>
  );
}

/* ------------------------------------------------------------------ */

interface Props {
  index: number;
  business: Business;
  evaluation: Evaluation | undefined;
  wa: WaStatus;
}

export default function BusinessCard({ index, business: b, evaluation, wa }: Props) {
  const [copied, setCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [imgOk, setImgOk] = useState(!!b.photoUrl);

  const copyFiche = async () => {
    const ok = await copyText(buildFiche(b, wa));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const copyPhone = async () => {
    if (!b.phone) return;
    const ok = await copyText(b.phone);
    if (ok) {
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 1500);
    }
  };

  const today = todayHours(b.hours);
  const waUrl = b.phoneDigits ? waLink(b.phoneDigits) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 90, damping: 18 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-colors hover:border-line-strong"
    >
      {/* Numéro */}
      <span className="pointer-events-none absolute right-5 top-4 font-mono text-[10px] tracking-[0.2em] text-fog/70">
        Nº {String(index + 1).padStart(2, "0")}
      </span>

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Tête : photo + nom + note */}
        <div className="flex gap-4">
          {b.photoUrl && imgOk ? (
            <img
              src={b.photoUrl}
              alt={`Photo de ${b.name}`}
              onError={() => setImgOk(false)}
              className="h-16 w-16 shrink-0 rounded-xl border border-line object-cover"
              loading="lazy"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-line bg-raise text-fog">
              <Camera className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="truncate pr-10 font-display text-[17px] font-semibold leading-snug text-zinc-100">
              {b.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-fog">
              {b.category}
              {b.zone && (
                <span className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[9.5px] text-mist">
                  {b.zone}
                </span>
              )}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Stars value={b.rating ?? 0} />
              <span className="font-display text-[13px] font-semibold text-lime">
                {b.rating !== null ? b.rating.toFixed(1) : "—"}
              </span>
              <span className="font-mono text-[10.5px] text-fog">
                ({b.reviewCount} avis)
              </span>
            </div>
          </div>
        </div>

        {/* Coordonnées */}
        <div className="space-y-1.5 rounded-xl border border-line bg-ink/50 px-3.5 py-3 text-[12.5px]">
          <p className="flex items-start gap-2 text-mist">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fog" />
            <span className="leading-snug">{b.address}</span>
          </p>
          <p className="flex items-center gap-2 text-mist">
            <Phone className="h-3.5 w-3.5 shrink-0 text-fog" />
            <a href={b.phone ? `tel:${b.phone.replace(/\s/g, "")}` : undefined} className="text-zinc-100 hover:text-lime">
              {b.phone ?? "—"}
            </a>
            {b.phone && (
              <button
                onClick={copyPhone}
                className="ml-auto rounded p-1 text-fog transition-colors hover:text-lime"
                title="Copier le numéro"
              >
                {phoneCopied ? <Check className="h-3 w-3 text-radar" /> : <Copy className="h-3 w-3" />}
              </button>
            )}
          </p>
          <p className="flex items-center gap-2 font-mono text-[11px] text-fog">
            <Camera className="h-3.5 w-3.5 shrink-0" />
            {b.photoUrl ? "Miniature Google disponible" : "Pas de miniature exposée"}
            <span className="ml-auto">{gpsString(b)}</span>
          </p>
        </div>

        {/* Horaires */}
        <details className="group/h rounded-xl border border-line bg-ink/50 px-3.5 py-2.5">
          <summary className="flex items-center gap-2 text-[12.5px] text-mist">
            <Clock className="h-3.5 w-3.5 shrink-0 text-fog" />
            <span className="truncate">{today ?? "Horaires non renseignés"}</span>
            <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-fog transition-transform group-open/h:rotate-180" />
          </summary>
          <ul className="mt-2 space-y-1 border-t border-line pt-2 font-mono text-[11px] leading-relaxed text-fog">
            {b.hours.length ? (
              b.hours.map((h, i) => <li key={i}>{h}</li>)
            ) : (
              <li>Serper n'expose pas les horaires pour cette fiche — voir la fiche Maps</li>
            )}
          </ul>
        </details>

        {/* Description */}
        <p className="line-clamp-3 text-[12.5px] leading-relaxed text-mist">{b.description}</p>

        {/* Services */}
        {b.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {b.services.map((s) => (
              <span
                key={s}
                className="rounded-md border border-line bg-raise px-2 py-0.5 text-[10.5px] text-mist"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Renseignement web */}
        {b.web?.checked && (
          <div className="space-y-2 rounded-xl border border-line bg-ink/50 px-3.5 py-3">
            <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-fog">
              <Globe className="h-3.5 w-3.5 text-radar" />
              Renseignement web
            </p>
            <p
              className={`flex items-start gap-1.5 text-[11.5px] ${
                b.web.officialSite ? "text-amber-300" : "text-radar"
              }`}
            >
              {b.web.officialSite && b.web.officialConfidence === "high" ? (
                <>
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  Site officiel confirmé : {b.web.officialSite} — cette fiche devrait être écartée
                </>
              ) : b.web.officialSite ? (
                <>
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  Site probable (à vérifier) : {b.web.officialSite} — conservée, ouvrez le lien
                  pour confirmer
                </>
              ) : (
                <>
                  <Check className="mt-0.5 h-3 w-3 shrink-0" />
                  Aucun site officiel — absence confirmée sur le web
                </>
              )}
            </p>
            {b.web.emails.length > 0 && (
              <p className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-mist">
                <Mail className="h-3 w-3 shrink-0 text-fog" />
                {b.web.emails.map((m) => (
                  <a key={m} href={`mailto:${m}`} className="text-zinc-100 hover:text-lime">
                    {m}
                  </a>
                ))}
              </p>
            )}
            {b.web.socials.length > 0 && (
              <p className="flex flex-wrap items-center gap-2 text-[11px] text-fog">
                <Share2 className="h-3 w-3 shrink-0" />
                {b.web.socials.map((s, i) => (
                  <a
                    key={s}
                    href={s}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-mist hover:text-lime"
                  >
                    {new URL(s).hostname.replace("www.", "")}
                    {i < b.web!.socials.length - 1 ? " ·" : ""}
                  </a>
                ))}
              </p>
            )}
          </div>
        )}

        {/* Critères */}
        <div className="flex flex-wrap gap-1.5 border-t border-line pt-3.5">
          {(evaluation?.criteria ?? []).map((c) => (
            <CriteriaChip key={c.key} c={c} mapsUrl={b.mapsUrl} />
          ))}
        </div>

        {/* Avis */}
        {b.reviews.length > 0 && (
          <div className="space-y-2 border-t border-line pt-3.5">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-fog">
              Avis clients — extraits (6 max conservés, récupérés via Serper)
            </p>
            {b.reviews.slice(0, 3).map((r, i) => (
              <blockquote key={i} className="rounded-lg bg-ink/50 px-3 py-2.5">
                <p className="line-clamp-2 text-[12px] italic leading-relaxed text-mist">
                  <Quote className="mr-1.5 inline h-3 w-3 text-fog" />
                  {r.text || "(avis sans texte)"}
                </p>
                <footer className="mt-1.5 flex items-center gap-2 font-mono text-[10px] text-fog">
                  <span className="text-lime">{r.rating}★</span>
                  <span className="truncate">{r.author}</span>
                  {r.relativeTime && <span className="ml-auto shrink-0">{r.relativeTime}</span>}
                </footer>
              </blockquote>
            ))}
          </div>
        )}
      </div>

      {/* --------- Zone WhatsApp --------- */}
      <div className="border-t border-line bg-ink/40 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-fog">
            <MessageCircle className="h-3.5 w-3.5 text-radar" />
            Validation WhatsApp automatique
          </p>
          {b.waValidation && (
            <span
              className={`rounded-md border px-2 py-0.5 font-mono text-[9.5px] uppercase ${
                b.waValidation.status === "pending"
                  ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                  : b.waValidation.verified
                  ? "border-lime/50 bg-lime/15 text-lime"
                  : b.waValidation.status === "oui"
                    ? "border-radar/40 bg-radar/15 text-radar"
                    : "border-red-400/40 bg-red-400/15 text-red-300"
              }`}
            >
              {b.waValidation.status === "pending"
                ? "En attente de Baileys"
                : b.waValidation.verified
                ? b.waValidation.status === "oui"
                  ? "Exact · Baileys OUI"
                  : "Exact · Baileys NON"
                : b.waValidation.status === "oui"
                  ? "Estimation OUI"
                  : "Estimation NON"}
            </span>
          )}
        </div>

        {b.waValidation ? (
          <div className="mt-2 rounded-lg border border-line bg-ink/60 p-2.5 text-[11.5px]">
            <p className="flex items-center gap-1.5 font-medium text-zinc-200">
              {b.waValidation.status === "oui" ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-radar" />
              ) : b.waValidation.status === "pending" ? (
                <Clock className="h-3.5 w-3.5 shrink-0 text-amber-300" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0 text-red-300" />
              )}
              {b.waValidation.reason}
            </p>
            <p className="mt-1 font-mono text-[10px] text-fog">
              Méthode :{" "}
              {b.waValidation.method === "baileys"
                ? "Baileys onWhatsApp() — protocole direct"
                : b.waValidation.method === "web_osint"
                  ? "Empreinte web wa.me indexée"
                  : b.waValidation.method === "mobile_carrier"
                    ? "Ligne mobile active"
                    : b.waValidation.method === "api"
                      ? "API réseau en direct"
                      : "Format E.164"}{" "}
              · Confiance : {b.waValidation.confidence}%
              {b.waValidation.verified ? " · VÉRIFIÉ EXACT" : " · en attente"}
            </p>
            {b.waValidation.status === "oui" && (
              <div className="mt-2 flex items-start gap-2 border-t border-line pt-2">
                {b.waValidation.profilePictureUrl && (
                  <img
                    src={b.waValidation.profilePictureUrl}
                    alt="Profil WhatsApp"
                    className="h-10 w-10 shrink-0 rounded-full border border-line object-cover"
                  />
                )}
                <div className="min-w-0 text-[10.5px] text-fog">
                  {b.waValidation.about && (
                    <p className="truncate text-mist">About : {b.waValidation.about}</p>
                  )}
                  <p>
                    {b.waValidation.isBusiness ? "Compte WhatsApp Business" : "Compte WhatsApp standard"}
                    {b.waValidation.jid ? ` · ${b.waValidation.jid}` : ""}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-[11px] leading-relaxed text-fog">
            En attente de la vérification exacte Baileys onWhatsApp().
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-radar/30 bg-radar/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-radar transition-colors hover:bg-radar/20"
            >
              <MessageCircle className="h-4 w-4" />
              Tester sur WhatsApp
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          )}
          <span
            className={`ml-auto rounded-xl border px-3.5 py-2.5 font-mono text-[10.5px] font-semibold ${
              wa === "oui"
                ? "border-radar/30 bg-radar/10 text-radar"
                : wa === "non"
                  ? "border-red-400/30 bg-red-400/10 text-red-300"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-300"
            }`}
          >
            {wa === "oui" ? "OUI · VÉRIFIÉ" : wa === "non" ? "NON · VÉRIFIÉ" : "EN ATTENTE"}
          </span>
        </div>
      </div>

      {/* --------- Actions fiche --------- */}
      <div className="flex items-center gap-2 border-t border-line px-5 py-4">
        <button
          onClick={copyFiche}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-display text-[13px] font-semibold transition-colors ${
            copied ? "bg-radar text-ink" : "bg-lime text-ink hover:bg-radar"
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Fiche copiée !" : "Copier la fiche complète"}
        </button>
        <a
          href={b.mapsUrl}
          target="_blank"
          rel="noreferrer"
          title="Ouvrir la fiche Google Maps"
          className="flex items-center justify-center rounded-xl border border-line px-4 py-3 text-mist transition-colors hover:border-line-strong hover:text-zinc-100"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </motion.article>
  );
}
