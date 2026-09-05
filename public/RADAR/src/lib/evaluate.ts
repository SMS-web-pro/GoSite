/* ------------------------------------------------------------------ */
/*  Moteur de critères — audit de chaque fiche selon des seuils        */
/*  réglables. Ce que Serper n'expose pas (statut d'ouverture,         */
/*  ancienneté) est marqué « audit manuel » — jamais deviné.           */
/* ------------------------------------------------------------------ */

import type { Business, CriteriaConfig, Criterion, CriterionKey, Evaluation } from "./types";

/** Protocole strict — valeurs par défaut */
export const DEFAULT_CRITERIA: CriteriaConfig = {
  minRating: 4.3,
  minReviews: 20,
  recentDays: 90,
  requireNoWebsite: true,
  requirePhone: true,
};

const fr1 = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

/** Libellé d'une cause de rejet, pour les filtres et les décomptes */
export function reasonLabelFor(key: CriterionKey, cfg: CriteriaConfig): string {
  switch (key) {
    case "operational":
      return "Statut d'activité";
    case "phone":
      return "Téléphone manquant";
    case "rating":
      return `Note < ${fr1(cfg.minRating)} ou absente`;
    case "reviews":
      return `Moins de ${cfg.minReviews} avis`;
    case "noWebsite":
      return "Site web présent";
    case "recent":
      return `Avis très anciens (> ${cfg.recentDays * 2} j)`;
    case "age":
      return "Ancienneté < 2 ans";
  }
}

/** Barème lisible pour le journal */
export function baremeString(cfg: CriteriaConfig): string {
  const parts: string[] = [];
  if (cfg.minRating > 0) parts.push(`Note ≥ ${fr1(cfg.minRating)}`);
  if (cfg.minReviews > 0) parts.push(`≥ ${cfg.minReviews} avis`);
  if (cfg.requireNoWebsite) parts.push("Sans site web");
  if (cfg.requirePhone) parts.push("Téléphone présent");
  parts.push(cfg.recentDays > 0 ? `Actif < ${cfg.recentDays} j (via /reviews)` : "Activité récente libre");
  return parts.join(" · ") || "Aucun filtre actif";
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86_400_000);
}

export function evaluateBusiness(b: Business, cfg: CriteriaConfig = DEFAULT_CRITERIA): Evaluation {
  const criteria: Criterion[] = [];
  const reasons: string[] = [];
  const keys: CriterionKey[] = [];

  /* 1 — Statut d'activité : non exposé par Serper → contrôle manuel */
  criteria.push({
    key: "operational",
    label: "En activité",
    pass: null,
    detail: "Non exposé par Serper — ouvrez la fiche Maps pour confirmer",
  });

  /* 2 — Téléphone présent */
  if (cfg.requirePhone) {
    const hasPhone = !!b.phoneDigits;
    criteria.push({
      key: "phone",
      label: "Téléphone",
      pass: hasPhone,
      detail: hasPhone ? b.phone! : "Aucun numéro publié",
    });
    if (!hasPhone) {
      reasons.push("Téléphone manquant");
      keys.push("phone");
    }
  } else {
    criteria.push({
      key: "phone",
      label: "Téléphone (filtre off)",
      pass: true,
      detail: b.phone ?? "Aucun numéro publié",
    });
  }

  /* 3 — Note Google minimale */
  if (cfg.minRating > 0) {
    const ratingOk = b.rating !== null && b.rating >= cfg.minRating;
    criteria.push({
      key: "rating",
      label: `Note ≥ ${fr1(cfg.minRating)}`,
      pass: ratingOk,
      detail: b.rating !== null ? `${b.rating.toFixed(1)} / 5` : "Aucune note",
    });
    if (!ratingOk) {
      reasons.push(b.rating !== null ? `Note ${fr1(b.rating)} < ${fr1(cfg.minRating)}` : "Aucune note");
      keys.push("rating");
    }
  } else {
    criteria.push({
      key: "rating",
      label: "Note (filtre off)",
      pass: true,
      detail: b.rating !== null ? `${b.rating.toFixed(1)} / 5` : "Aucune note",
    });
  }

  /* 4 — Nombre d'avis minimum */
  if (cfg.minReviews > 0) {
    const reviewsOk = b.reviewCount >= cfg.minReviews;
    criteria.push({
      key: "reviews",
      label: `≥ ${cfg.minReviews} avis`,
      pass: reviewsOk,
      detail: `${b.reviewCount} avis`,
    });
    if (!reviewsOk) {
      reasons.push(`${b.reviewCount} avis < ${cfg.minReviews}`);
      keys.push("reviews");
    }
  } else {
    criteria.push({
      key: "reviews",
      label: "Avis (filtre off)",
      pass: true,
      detail: `${b.reviewCount} avis`,
    });
  }

  /* 5 — Absence de site web */
  if (cfg.requireNoWebsite) {
    const noWebsite = !b.websiteUri;
    criteria.push({
      key: "noWebsite",
      label: "Sans site web",
      pass: noWebsite,
      detail: noWebsite ? "Aucun lien web sur la fiche" : "Site web présent",
    });
    if (!noWebsite) {
      reasons.push("Site web présent");
      keys.push("noWebsite");
    }
  } else {
    criteria.push({
      key: "noWebsite",
      label: "Site web (filtre off)",
      pass: true,
      detail: b.websiteUri ? "Site web présent" : "Aucun lien web sur la fiche",
    });
  }

  /* 6 — Activité récente — datée via les avis /reviews.
       ÉVIDENCE BIAISÉE : Google trie ses avis par PERTINENCE, pas par date.
       L'échantillon peut être vieux de plusieurs années alors que le business
       est actif — un rejet dur est donc injustifiable. Activité fraîche
       détectée → validé. Échantillon ancien ou indéterminé → contrôle
       MANUEL (ambre), jamais un rejet. */
  if (cfg.recentDays > 0) {
    const days = daysSince(b.lastReviewIso);
    let pass: boolean | null;
    let detail: string;
    if (days === null) {
      pass = null;
      detail = "Dates d'avis indisponibles — à confirmer sur la fiche";
    } else if (days <= cfg.recentDays) {
      pass = true;
      detail = `Dernier avis il y a ~${days} j`;
    } else {
      pass = null;
      detail = `Avis échantillonnés datés de ~${days} j (tri par pertinence) — activité à confirmer`;
    }
    criteria.push({ key: "recent", label: `Actif < ${cfg.recentDays} j`, pass, detail });
  } else {
    criteria.push({
      key: "recent",
      label: "Activité (filtre off)",
      pass: true,
      detail: "Filtre désactivé",
    });
  }

  /* 7 — Ouvert depuis 2 ans (non exposé par l'API → audit manuel) */
  criteria.push({
    key: "age",
    label: "Ouvert 2 ans +",
    pass: null,
    detail: "À vérifier : ouvrez la fiche → Avis → trier par « Plus anciens »",
  });

  const qualified = !keys.length;

  return { qualified, criteria, reasons, keys };
}

/* ------------------------------------------------------------------ */
/*  Helpers d'affichage                                                */
/* ------------------------------------------------------------------ */

export function waLink(phoneDigits: string): string {
  return `https://wa.me/${phoneDigits}`;
}

const FR_DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const EN_DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function todayHours(hours: string[]): string | null {
  if (!hours.length) return null;
  const idx = new Date().getDay();
  const candidates = [FR_DAYS[idx], EN_DAYS[idx]];
  const found = hours.find((h) => candidates.some((d) => h.toLowerCase().startsWith(d)));
  return found ?? hours[0];
}

export function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}
