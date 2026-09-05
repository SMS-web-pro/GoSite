/* ------------------------------------------------------------------ */
/*  Modèles de données — ProspectRadar                                 */
/*  Toutes les données proviennent EXCLUSIVEMENT de l'API Serper       */
/*  (données Google Maps) interrogée en direct. Zéro invention.        */
/* ------------------------------------------------------------------ */

export type Lang = "fr" | "en";

/** Seuils de qualification — réglables dans le brief */
export interface CriteriaConfig {
  /** Note Google minimale — 0 = filtre désactivé */
  minRating: number;
  /** Nombre d'avis minimum — 0 = filtre désactivé */
  minReviews: number;
  /** Fenêtre d'activité récente en jours — 0 = filtre désactivé */
  recentDays: number;
  /** Exiger l'absence de site web */
  requireNoWebsite: boolean;
  /** Exiger un numéro de téléphone (indispensable pour WhatsApp) */
  requirePhone: boolean;
}

export type ScopeMode = "manual" | "cities" | "regions" | "national";

export interface Brief {
  type: string;
  /** Zone principale (compatibilité + affichage) */
  ville: string;
  /** Toutes les zones à balayer : villes, quartiers, régions… */
  zones: string[];
  volume: number;
  /** Objectif de fiches qualifiées par zone (0 = pas de plafond par zone) */
  perZone: number;
  lang: Lang;
  /** Code pays ISO transmis à Serper (gl) */
  gl: string;
  criteria: CriteriaConfig;
  /** Portée du balayage : manuel, villes, régions, ou national (rotation) */
  scope: ScopeMode;
  /** Nombre de villes à balayer en mode cities/national */
  cityCount: number;
  /** Plafond de crédits Serper — sécurité budgétaire */
  maxCredits: number;
  /** Approfondir chaque fiche via une recherche web (/search, 1 crédit) */
  webEnrich: boolean;
  /** Mode de validation WhatsApp automatique */
  waAutoMode: WaAutoMode;
  /** URL de la passerelle WhatsApp locale Baileys (http://localhost:3001 par défaut) */
  waGatewayUrl?: string;
}

export interface ReviewItem {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
  publishTime: string | null;
}

/** Renseignement collecté par recherche web (Serper /search) */
export interface WebIntel {
  checked: boolean;
  /** Site officiel détecté hors annuaires/réseaux */
  officialSite: string | null;
  /** high = quasi certain · low = probable, à vérifier manuellement */
  officialConfidence: "high" | "low" | null;
  /** Profils sociaux (Facebook, Instagram…) — ne comptent pas comme site web */
  socials: string[];
  /** Adresses e-mail visibles dans les extraits */
  emails: string[];
  /** Présence sur annuaires (PagesJaunes, Yelp…) */
  directories: string[];
  /** Extraits pertinents trouvés */
  snippets: { title: string; link: string; snippet: string }[];
}

export interface Business {
  id: string;
  cid: string | null;
  placeId: string | null;
  /** Zone de recherche d'où provient la fiche */
  zone: string;
  /** true si la fiche a été repêchée manuellement depuis les rejets */
  promoted?: boolean;
  /** Renseignement web (si l'approfondissement est activé) */
  web?: WebIntel;
  /** Résultat de la validation WhatsApp automatique */
  waValidation?: WaValidationDetail;
  name: string;
  address: string;
  phone: string | null;
  /** Numéro normalisé format international (chiffres seuls) pour wa.me */
  phoneDigits: string | null;
  hours: string[];
  rating: number | null;
  reviewCount: number;
  description: string;
  category: string;
  lat: number | null;
  lng: number | null;
  services: string[];
  photoUrl: string | null;
  mapsUrl: string;
  reviews: ReviewItem[];
  websiteUri: string | null;
  lastReviewIso: string | null;
}

/* ------------------------------------------------------------------ */
/*  Critères obligatoires                                              */
/* ------------------------------------------------------------------ */

export type CriterionKey =
  | "operational"
  | "phone"
  | "rating"
  | "reviews"
  | "noWebsite"
  | "recent"
  | "age";

export interface Criterion {
  key: CriterionKey;
  label: string;
  /** true = validé · false = rejeté · null = audit manuel requis */
  pass: boolean | null;
  detail: string;
}

export interface Evaluation {
  qualified: boolean;
  criteria: Criterion[];
  reasons: string[];
  /** Clés des critères échoués */
  keys: CriterionKey[];
}

export interface RejectedItem {
  id: string;
  name: string;
  rating: number | null;
  reviewCount: number;
  reasons: string[];
  /** Clés des critères échoués — pour le filtrage */
  keys: CriterionKey[];
  mapsUrl: string;
  zone: string;
  /** Fiche complète conservée : permet le repêchage manuel */
  business: Business;
}

/* ------------------------------------------------------------------ */
/*  WhatsApp                                                           */
/* ------------------------------------------------------------------ */

export type WaStatus = "pending" | "oui" | "non";

/** Détail de la validation WhatsApp automatique */
export interface WaValidationDetail {
  status: WaStatus;
  /** Méthode de validation : baileys (exact), web_osint, mobile_carrier, api, manual, format_only */
  method: "baileys" | "web_osint" | "mobile_carrier" | "api" | "manual" | "format_only";
  /** Type de ligne détecté : mobile, fixe, voip, inconnu */
  lineType: "mobile" | "fixed" | "voip" | "unknown";
  /** Preuve ou explication */
  reason: string;
  /** Confiance (0 à 100 %) */
  confidence: number;
  /** true = vérification EXACTE (Baileys onWhatsApp) · false/absent = estimation */
  verified?: boolean;
  e164?: string | null;
  jid?: string | null;
  profilePictureUrl?: string | null;
  about?: string | null;
  statusSetAt?: string | null;
  isBusiness?: boolean | null;
  businessProfile?: Record<string, unknown> | null;
  batchId?: string | null;
}

/** Mode de validation WhatsApp dans le brief */
export type WaAutoMode = "auto" | "smart" | "all_valid";

/** État de la session WhatsApp Web */
export interface WaGatewayStatus {
  connected: boolean;
  status: "idle" | "connecting" | "qr" | "open" | "closed";
  qrDataUrl: string | null;
  user: string | null;
  checked: number;
  found: number;
  lastError: string | null;
}

/* ------------------------------------------------------------------ */
/*  Journal d'audit (pipeline)                                         */
/* ------------------------------------------------------------------ */

export type LogKind = "cmd" | "info" | "ok" | "warn" | "err" | "raw";

export interface LogLine {
  id: number;
  kind: LogKind;
  text: string;
  time: string;
}

export interface AuditState {
  status: "idle" | "running" | "done" | "error";
  logs: LogLine[];
  scanned: number;
  found: number;
  pages: number;
  /** Crédits Serper consommés par l'audit */
  credits: number;
  /** Décompte des causes de rejet (critère → nombre de fiches) */
  tally: Record<string, number>;
  qualified: Business[];
  evaluations: Record<string, Evaluation>;
  rejected: RejectedItem[];
  error: string | null;
}
