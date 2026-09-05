/* ------------------------------------------------------------------ */
/*  Génération CSV + fiches copiables                                  */
/*  Délimiteur « ; » + BOM UTF-8 : s'ouvre parfaitement dans Excel FR. */
/* ------------------------------------------------------------------ */

import type { Business, ReviewItem, WaStatus } from "./types";
import { waLink } from "./evaluate";

export const CSV_HEADERS = [
  "Nom du business",
  "Téléphone",
  "Adresse complète",
  "Horaires d'ouverture",
  "Note Google",
  "Nombre d'avis",
  "Description",
  "Catégorie",
  "Coordonnées GPS",
  "Services proposés",
  "Photos",
  "Lien Google Maps",
  "6 avis clients",
  "Validé WhatsApp (OUI/NON)",
  "Méthode WhatsApp (exact/estimation)",
  "Fiche complète",
  /* Colonnes additionnelles — renseignement web & traçabilité */
  "Zone de recherche",
  "E-mails trouvés (web)",
  "Réseaux sociaux (web)",
  "Site officiel détecté (web)",
];

function esc(v: string): string {
  return '"' + v.replace(/"/g, '""') + '"';
}

function formatReview(r: ReviewItem, i: number): string {
  const when = r.relativeTime || (r.publishTime ? new Date(r.publishTime).toLocaleDateString("fr-FR") : "");
  const body = r.text ? `« ${r.text} »` : "(avis sans texte)";
  return `${i + 1}) [${r.rating}★] ${r.author}${when ? ` — ${when}` : ""}\n${body}`;
}

export function gpsString(b: Business): string {
  if (b.lat === null || b.lng === null) return "—";
  return `${b.lat.toFixed(6)}, ${b.lng.toFixed(6)}`;
}

export function photosString(b: Business): string {
  return b.photoUrl ? `1 miniature Google — ${b.photoUrl}` : "Non exposée via Serper (voir la fiche Maps)";
}

 function hoursString(b: Business): string {
  return b.hours.length
    ? b.hours.join("  ·  ")
    : "Non exposées via Serper — voir la fiche Google Maps";
}

/* ------------------------------------------------------------------ */
/*  Colonne 15 — la fiche complète, prête à copier d'un coup           */
/* ------------------------------------------------------------------ */

export function buildFiche(b: Business, wa: WaStatus): string {
  const lines: string[] = [];
  lines.push(`========== FICHE PROSPECT ==========`);
  lines.push(`Nom du business : ${b.name}`);
  lines.push(`Téléphone : ${b.phone ?? "—"}`);
  lines.push(`Lien WhatsApp : ${b.phoneDigits ? waLink(b.phoneDigits) : "—"}`);
  lines.push(`Adresse complète : ${b.address}`);
  lines.push(`Horaires d'ouverture :`);
  if (b.hours.length) b.hours.forEach((h) => lines.push(`   · ${h}`));
  else lines.push("   · Non exposées via Serper — voir la fiche Maps");
  lines.push(`Note Google : ${b.rating !== null ? `${b.rating.toFixed(1)} / 5` : "—"}`);
  lines.push(`Nombre d'avis : ${b.reviewCount}`);
  lines.push(`Description : ${b.description}`);
  lines.push(`Catégorie : ${b.category}`);
  lines.push(`Coordonnées GPS : ${gpsString(b)}`);
  lines.push(`Services proposés : ${b.services.length ? b.services.join(", ") : "—"}`);
  lines.push(`Photos : ${photosString(b)}`);
  lines.push(`Lien Google Maps : ${b.mapsUrl}`);
  if (b.zone) lines.push(`Zone de recherche : ${b.zone}`);
  if (b.promoted) lines.push(`Statut : repêchée manuellement (validée par l'opérateur)`);
  if (b.cid) lines.push(`CID Google : ${b.cid}`);
  lines.push(`Validé WhatsApp : ${wa === "oui" ? "OUI" : wa === "non" ? "NON" : "À TESTER"}`);
  if (b.waValidation) {
    lines.push(
      `   · Détail validation : ${b.waValidation.reason} (confiance ${b.waValidation.confidence}%${b.waValidation.verified ? " · VÉRIFIÉ EXACT" : " · estimation"})`
    );
    if (b.waValidation.jid) lines.push(`   · JID WhatsApp : ${b.waValidation.jid}`);
    if (b.waValidation.about) lines.push(`   · About WhatsApp : ${b.waValidation.about}`);
    if (b.waValidation.profilePictureUrl) {
      lines.push(`   · Photo de profil WhatsApp : ${b.waValidation.profilePictureUrl}`);
    }
    if (b.waValidation.isBusiness !== null && b.waValidation.isBusiness !== undefined) {
      lines.push(`   · Compte Business : ${b.waValidation.isBusiness ? "OUI" : "NON"}`);
    }
  }
  if (b.web?.checked) {
    lines.push(`---------- RENSEIGNEMENT WEB (recherche Serper /search) ----------`);
    lines.push(
      `Site officiel : ${b.web.officialSite ?? "aucun détecté — absence de site confirmée"}`
    );
    if (b.web.emails.length) lines.push(`E-mails : ${b.web.emails.join(", ")}`);
    if (b.web.socials.length) lines.push(`Réseaux sociaux : ${b.web.socials.join(" | ")}`);
    if (b.web.directories.length) lines.push(`Annuaires : ${b.web.directories.join(", ")}`);
  }
  lines.push(`---------- AVIS CLIENTS (${Math.min(6, b.reviews.length)} collectés via Serper) ----------`);
  if (b.reviews.length) b.reviews.slice(0, 6).forEach((r, i) => lines.push(formatReview(r, i)));
  else lines.push("Aucun avis n'a pu être récupéré via Serper pour cette fiche.");
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Ligne CSV                                                          */
/* ------------------------------------------------------------------ */

export function buildRow(b: Business, wa: WaStatus): string[] {
  return [
    b.name,
    b.phone ?? "—",
    b.address,
    hoursString(b),
    b.rating !== null ? b.rating.toFixed(1) : "—",
    String(b.reviewCount),
    b.description,
    b.category,
    gpsString(b),
    b.services.length ? b.services.join(", ") : "—",
    photosString(b),
    b.mapsUrl,
    b.reviews.length
      ? b.reviews.slice(0, 6).map((r, i) => formatReview(r, i)).join("\n---\n")
      : "—",
    wa === "oui" ? "OUI" : wa === "non" ? "NON" : "À TESTER",
    b.waValidation
      ? b.waValidation.verified
        ? `EXACT — Baileys onWhatsApp() (${b.waValidation.confidence}%)`
        : `ESTIMATION — ${b.waValidation.method} (${b.waValidation.confidence}%)`
      : "non vérifié",
    buildFiche(b, wa),
    b.zone || "—",
    b.web?.emails.length ? b.web.emails.join(", ") : b.web?.checked ? "aucun trouvé" : "non vérifié",
    b.web?.socials.length ? b.web.socials.join(" | ") : b.web?.checked ? "aucun trouvé" : "non vérifié",
    b.web?.officialSite ?? (b.web?.checked ? "aucun (confirmé sans site)" : "non vérifié"),
  ];
}

export function buildCsv(rows: string[][]): string {
  const all = [CSV_HEADERS, ...rows];
  /* BOM UTF-8 explicite : Excel (FR/EN) reconnaît l'encodage à l'ouverture */
  return "﻿" + all.map((r) => r.map(esc).join(";")).join("\r\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}
