/* ------------------------------------------------------------------ */
/*  Client Serper API — Google Maps en JSON, interrogé en direct.      */
/*  Endpoints : /maps (recherche Maps) · /places (repli local) ·       */
/*  /reviews (avis d'une fiche).                                       */
/*  Auth : header X-API-KEY · /maps = 3 crédits · autres = 1 crédit.   */
/*  Parsing volontairement défensif : Serper omet des champs selon     */
/*  les requêtes, et peut renvoyer des nombres sous forme de chaînes.  */
/* ------------------------------------------------------------------ */

import type { Business, Lang, ReviewItem } from "./types";

const SERPER_BASE = "https://google.serper.dev";

export const CREDIT_COST = { maps: 3, places: 1, reviews: 1, search: 1 } as const;

export class SerperError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function friendlyError(status: number, raw: string): string {
  if (status === 0) {
    return "Connexion bloquée (réseau ou CORS). Vérifiez votre connexion, désactivez le bloqueur de pub, ou renseignez un proxy CORS dans les options avancées de la clé.";
  }
  if (status === 400) {
    return `Requête refusée (400) : ${raw || "paramètres invalides"}.`;
  }
  if (status === 403) {
    return "Clé refusée (403). Vérifiez que la clé copiée sur serper.dev/api-key est exacte et que vos crédits ne sont pas épuisés (serper.dev/dashboard).";
  }
  if (status === 429) {
    return "Limite de débit atteinte (429). Patientez quelques secondes puis relancez la recherche.";
  }
  return `Erreur Serper (${status}) : ${raw || "réponse inattendue"}.`;
}

/* ------------------------------------------------------------------ */
/*  Appel générique                                                    */
/* ------------------------------------------------------------------ */

type Raw = Record<string, unknown>;

const OK_KEYS = [
  "places",
  "reviews",
  "organic",
  "images",
  "videos",
  "news",
  "shopping",
  "scholar",
  "patents",
  "answerBox",
  "knowledgeGraph",
];

async function serperPost(
  path: string,
  body: Record<string, unknown>,
  apiKey: string,
  proxy?: string
): Promise<Raw | Raw[]> {
  let url = SERPER_BASE + path;
  if (proxy && proxy.trim()) {
    url = proxy.trim() + encodeURIComponent(url);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey.trim(),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new SerperError(0, "NETWORK", "");
  }

  const data = (await res.json().catch(() => null)) as Raw | Raw[] | null;
  if (!res.ok) {
    const errObj = Array.isArray(data) ? null : data;
    const raw = (errObj && ((errObj.message as string) ?? (errObj.error as string))) ?? "";
    throw new SerperError(res.status, "HTTP_" + res.status, friendlyError(res.status, raw));
  }
  /* Serper peut répondre 200 avec un message d'erreur sans résultats */
  if (data && !Array.isArray(data)) {
    const hasData = OK_KEYS.some((k) => k in (data as Raw));
    const msg = (data as Raw).message;
    if (typeof msg === "string" && !hasData) {
      throw new SerperError(
        200,
        "MESSAGE",
        `Serper : « ${msg} ». Vérifiez vos crédits sur serper.dev/dashboard.`
      );
    }
  }
  return data ?? {};
}

/* ------------------------------------------------------------------ */
/*  Pays ciblables (gl) + indicatifs téléphoniques                     */
/* ------------------------------------------------------------------ */

export interface Country {
  code: string;
  label: string;
  calling: string;
}

export const COUNTRIES: Country[] = [
  { code: "fr", label: "France", calling: "33" },
  { code: "be", label: "Belgique", calling: "32" },
  { code: "ch", label: "Suisse", calling: "41" },
  { code: "lu", label: "Luxembourg", calling: "352" },
  { code: "ca", label: "Canada", calling: "1" },
  { code: "ma", label: "Maroc", calling: "212" },
  { code: "dz", label: "Algérie", calling: "213" },
  { code: "tn", label: "Tunisie", calling: "216" },
  { code: "es", label: "Espagne", calling: "34" },
  { code: "pt", label: "Portugal", calling: "351" },
  { code: "de", label: "Allemagne", calling: "49" },
  { code: "it", label: "Italie", calling: "39" },
  { code: "gb", label: "Royaume-Uni", calling: "44" },
  { code: "us", label: "États-Unis", calling: "1" },
];

export function countryLabel(gl: string): string {
  return COUNTRIES.find((c) => c.code === gl)?.label ?? "";
}

/* ------------------------------------------------------------------ */
/*  Détection télécom : Mobile vs Fixe par pays                       */
/* ------------------------------------------------------------------ */

export interface PhoneTypeInfo {
  lineType: "mobile" | "fixed" | "voip" | "unknown";
  isMobile: boolean;
  formatted: string;
  countryName: string;
}

export function detectPhoneType(digits: string | null, gl: string): PhoneTypeInfo {
  if (!digits) {
    return { lineType: "unknown", isMobile: false, formatted: "—", countryName: "" };
  }

  const country = COUNTRIES.find((c) => c.code === gl);
  const countryName = country?.label ?? "";
  const calling = country?.calling ?? "";

  let local = digits;
  if (calling && digits.startsWith(calling)) {
    local = digits.slice(calling.length);
  }

  let lineType: "mobile" | "fixed" | "voip" | "unknown" = "unknown";
  let isMobile = false;

  switch (gl) {
    case "fr":
      // France: 6 ou 7 = Mobile (ex: 336..., 337...)
      if (/^[67]\d{8}$/.test(local)) {
        lineType = "mobile";
        isMobile = true;
      } else if (/^[1-59]\d{8}$/.test(local)) {
        lineType = "fixed";
      }
      break;

    case "be":
      // Belgique: 4 = Mobile (ex: 324...)
      if (/^4\d{8}$/.test(local)) {
        lineType = "mobile";
        isMobile = true;
      } else {
        lineType = "fixed";
      }
      break;

    case "ch":
      // Suisse: 7 = Mobile (ex: 417...)
      if (/^7[5-9]\d{7}$/.test(local)) {
        lineType = "mobile";
        isMobile = true;
      } else {
        lineType = "fixed";
      }
      break;

    case "lu":
      // Luxembourg: 6 = Mobile (ex: 3526...)
      if (/^6\d{7,8}$/.test(local)) {
        lineType = "mobile";
        isMobile = true;
      } else {
        lineType = "fixed";
      }
      break;

    case "ca":
    case "us":
      // NANP (1): Mobile et fixe partagent les indicatifs régionaux
      // Longueur standard = 10 chiffres après l'indicatif 1
      if (local.length === 10) {
        lineType = "mobile"; // Nanp mobile/fixe mixte
        isMobile = true;
      }
      break;

    case "ma":
      // Maroc: 6 ou 7 = Mobile (ex: 2126..., 2127...)
      if (/^[67]\d{8}$/.test(local)) {
        lineType = "mobile";
        isMobile = true;
      } else {
        lineType = "fixed";
      }
      break;

    case "dz":
      // Algérie: 5, 6, 7 = Mobile
      if (/^[567]\d{8}$/.test(local)) {
        lineType = "mobile";
        isMobile = true;
      } else {
        lineType = "fixed";
      }
      break;

    case "tn":
      // Tunisie: 2, 4, 5, 9 = Mobile
      if (/^[2459]\d{7}$/.test(local)) {
        lineType = "mobile";
        isMobile = true;
      } else {
        lineType = "fixed";
      }
      break;

    case "es":
      // Espagne: 6 ou 7 = Mobile
      if (/^[67]\d{8}$/.test(local)) {
        lineType = "mobile";
        isMobile = true;
      } else {
        lineType = "fixed";
      }
      break;

    case "pt":
      // Portugal: 9 = Mobile
      if (/^9\d{8}$/.test(local)) {
        lineType = "mobile";
        isMobile = true;
      } else {
        lineType = "fixed";
      }
      break;

    case "de":
      // Allemagne: 15, 16, 17 = Mobile
      if (/^1[567]\d{8,10}$/.test(local)) {
        lineType = "mobile";
        isMobile = true;
      } else {
        lineType = "fixed";
      }
      break;

    case "it":
      // Italie: 3 = Mobile
      if (/^3\d{8,9}$/.test(local)) {
        lineType = "mobile";
        isMobile = true;
      } else {
        lineType = "fixed";
      }
      break;

    case "gb":
      // Royaume-Uni: 7 = Mobile
      if (/^7\d{9}$/.test(local)) {
        lineType = "mobile";
        isMobile = true;
      } else {
        lineType = "fixed";
      }
      break;

    default:
      if (digits.length >= 9 && digits.length <= 15) {
        lineType = "mobile";
        isMobile = true;
      }
      break;
  }

  return {
    lineType,
    isMobile,
    formatted: `+${digits}`,
    countryName,
  };
}

/* ------------------------------------------------------------------ */
/*  Client passerelle WhatsApp Baileys (serveur local sur VOTRE        */
/*  machine). L'interface web statique pointe dessus ; la session      */
/*  WhatsApp y est persistée (.whatsapp-session/creds.json).           */
/* ------------------------------------------------------------------ */

export const DEFAULT_WA_GATEWAY = "http://localhost:3001";
const GW_STORAGE_KEY = "prospectradar_wa_gateway_url_v1";

export function getWaGatewayUrl(): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  const envUrl = env?.VITE_WHATSAPP_API_URL ? String(env.VITE_WHATSAPP_API_URL) : "";
  try {
    return localStorage.getItem(GW_STORAGE_KEY) || envUrl || DEFAULT_WA_GATEWAY;
  } catch {
    return envUrl || DEFAULT_WA_GATEWAY;
  }
}

export function setWaGatewayUrl(url: string): void {
  try {
    localStorage.setItem(GW_STORAGE_KEY, url.trim());
  } catch {
    /* ignore */
  }
}

function normalizeBase(url: string): string {
  return (url || DEFAULT_WA_GATEWAY).trim().replace(/\/+$/, "");
}

async function waApi(path: string, init: RequestInit = {}, timeout = 120_000, baseUrl?: string): Promise<any> {
  const base = normalizeBase(baseUrl ?? getWaGatewayUrl());
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(`${base}${path}`, { ...init, signal: ctrl.signal });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const error = new Error(data?.error || data?.message || `HTTP ${res.status}`);
      (error as Error & { status?: number }).status = res.status;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export async function initiateWaSession(force = false, baseUrl?: string): Promise<import("./types").WaGatewayStatus> {
  return waApi("/api/whatsapp/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ force }),
  }, 15_000, baseUrl);
}

export async function fetchGatewayStatus(baseUrl?: string): Promise<import("./types").WaGatewayStatus> {
  return waApi("/api/whatsapp/status", undefined, 6_000, baseUrl);
}

export async function logoutWaSession(baseUrl?: string): Promise<void> {
  await waApi("/api/whatsapp/session", { method: "DELETE" }, 15_000, baseUrl);
}

export interface ExactWhatsAppResult {
  input: string;
  validNumber: boolean;
  e164?: string;
  nationalNumber?: string;
  country?: string;
  phoneType?: string | null;
  jid?: string;
  exists: boolean | null;
  profilePictureUrl?: string | null;
  about?: string | null;
  statusSetAt?: string | null;
  isBusiness?: boolean | null;
  businessProfile?: Record<string, unknown> | null;
  error?: string;
}

export async function checkNumbersViaGateway(
  numbers: string[],
  defaultCountry: string,
  baseUrl?: string
): Promise<{ batchId: string | null; results: ExactWhatsAppResult[] }> {
  const data = await waApi(
    "/api/whatsapp/check",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        numbers,
        defaultCountry: defaultCountry.toUpperCase(),
        enrich: true,
        source: "prospectradar",
      }),
    },
    Math.max(120_000, numbers.length * 4_000),
    baseUrl
  );
  return { batchId: data.batchId ?? null, results: data.results ?? [] };
}

/* ------------------------------------------------------------------ */
/*  Validation WhatsApp intégrée (secours, sans serveur)               */
/*  Marquée honnêtement comme ESTIMATION — jamais comme une preuve.    */
/* ------------------------------------------------------------------ */

export async function validateWhatsAppAuto(opts: {
  phoneDigits: string | null;
  phoneRaw: string | null;
  businessName: string;
  gl: string;
  apiKey?: string;
  hl?: Lang;
  proxy?: string;
}): Promise<import("./types").WaValidationDetail> {
  const digits = opts.phoneDigits;
  if (!digits) {
    return {
      status: "non",
      method: "format_only",
      lineType: "unknown",
      reason: "Aucun numéro de téléphone à vérifier",
      confidence: 0,
      verified: false,
    };
  }

  const phoneInfo = detectPhoneType(digits, opts.gl);

  /* Empreinte wa.me publique indexée (via Serper, si la clé est active) */
  if (opts.apiKey) {
    try {
      const q = `"${digits}" OR "wa.me/${digits}"`;
      const data = await serperPost(
        "/search",
        { q, gl: opts.gl, hl: opts.hl ?? "fr", num: 2 },
        opts.apiKey,
        opts.proxy
      );
      const obj = Array.isArray(data) ? data[0] : data;
      const organic = (Array.isArray(obj?.organic) ? obj.organic : []) as Raw[];
      for (const res of organic) {
        const link = (firstString(res.link) ?? "").toLowerCase();
        if (link.includes("wa.me")) {
          return {
            status: "oui",
            method: "web_osint",
            lineType: phoneInfo.lineType,
            reason: `Lien wa.me public indexé (${hostOf(link) || "wa.me"}) — preuve web`,
            confidence: 95,
            verified: false,
          };
        }
      }
    } catch {
      /* poursuite télécom */
    }
  }

  if (phoneInfo.isMobile) {
    return {
      status: "oui",
      method: "mobile_carrier",
      lineType: "mobile",
      reason: `Ligne mobile (${phoneInfo.formatted}) — estimation télécom, non vérifiable sans protocole`,
      confidence: 88,
      verified: false,
    };
  }
  return {
    status: "oui",
    method: "mobile_carrier",
    lineType: "fixed",
    reason: `Ligne fixe (${phoneInfo.formatted}) — WhatsApp Business possible — estimation`,
    confidence: 72,
    verified: false,
  };
}

/* ------------------------------------------------------------------ */
/*  Vérification de clé — /search (1 crédit, le moins cher)            */
/* ------------------------------------------------------------------ */

export async function verifyKey(opts: { apiKey: string; proxy?: string }): Promise<void> {
  await serperPost("/search", { q: "serper api", num: 1 }, opts.apiKey, opts.proxy);
}

/* ------------------------------------------------------------------ */
/*  Recherche /maps — LE bon endpoint Google Maps (3 crédits)          */
/*  Corps : { q, location, gl, hl, num } — location = "Ville, Pays"    */
/* ------------------------------------------------------------------ */

export interface PlacesPage {
  places: Raw[];
  count: number;
}

export async function searchMaps(opts: {
  query: string;
  apiKey: string;
  gl: string;
  hl: Lang;
  page?: number;
  location?: string;
  proxy?: string;
}): Promise<PlacesPage> {
  const body: Record<string, unknown> = {
    q: opts.query,
    gl: opts.gl,
    hl: opts.hl,
    num: 20,
  };
  if (opts.location) body.location = opts.location;
  if (opts.page && opts.page > 1) body.page = opts.page;

  const data = await serperPost("/maps", body, opts.apiKey, opts.proxy);
  /* Réponse : objet {places:[]} — ou tableau en mode batch */
  const items = Array.isArray(data) ? data : [data];
  const places: Raw[] = [];
  for (const item of items) {
    const arr = (item as Raw)?.places;
    if (Array.isArray(arr)) places.push(...(arr as Raw[]));
  }
  return { places, count: places.length };
}

/* ------------------------------------------------------------------ */
/*  Repli : /places — onglet local de Google Search (1 crédit)         */
/* ------------------------------------------------------------------ */

export async function searchPlaces(opts: {
  query: string;
  apiKey: string;
  gl: string;
  hl: Lang;
  page: number;
  location?: string;
  proxy?: string;
}): Promise<PlacesPage> {
  const body: Record<string, unknown> = {
    q: opts.query,
    gl: opts.gl,
    hl: opts.hl,
    page: opts.page,
    num: 20,
  };
  if (opts.location) body.location = opts.location;

  const data = await serperPost("/places", body, opts.apiKey, opts.proxy);
  const obj = Array.isArray(data) ? data[0] : data;
  const places = (Array.isArray(obj?.places) ? obj.places : []) as Raw[];
  return { places, count: places.length };
}

/* ------------------------------------------------------------------ */
/*  Approfondissement web — //search (1 crédit)                        */
/*  Objectif : confirmer l'absence de site officiel, récupérer les     */
/*  e-mails et réseaux sociaux visibles publiquement.                  */
/* ------------------------------------------------------------------ */

/** Hôtes qui ne constituent PAS un site web d'entreprise */
const SOCIAL_HOSTS = [
  "facebook.com", "instagram.com", "linkedin.com", "twitter.com", "x.com",
  "tiktok.com", "youtube.com", "pinterest.com", "snapchat.com", "wa.me",
];

const DIRECTORY_HOSTS = [
  "pagesjaunes.fr", "yelp.", "tripadvisor.", "google.", "mappy.", "118712.fr",
  "justacote.com", "petitfute.com", "cylex", "kompass.com", "societe.com",
  "verif.com", "infogreffe.fr", "annuaire", "trustpilot.com", "booking.com",
  "thefork.", "lafourchette.", "doctolib.fr", "planity.com", "treatwell.",
  "leboncoin.fr", "indeed.", "glassdoor.", "foursquare.com", "openstreetmap.org",
  "wikipedia.org", "bing.com", "apple.com", "waze.com", "amazon.",
  /* Marketplaces & génération de leads : PAS des sites d'entreprise */
  "trouverunartisan", "quotatis", "starofservice", "midome", "habitatpresto",
  "travaux.com", "hipages", "renovation", "devis-", "genie-", "monartisan",
  "artisansenfrance", "lead", "thumbtack", "homeadvisor", "yelp", "dexknows",
  "superpages", "shiift", "groupon", "ouest-france", "lebonpro",
];

/** Mots « métier » génériques : utilisés par les marketplaces → non distinctifs */
const TRADE_WORDS = new Set([
  "plombier", "plomberie", "plumber", "plumbing", "boulangerie", "boulanger",
  "bakery", "baker", "patisserie", "coiffure", "coiffeur", "hair", "hairstylist",
  "salon", "barber", "barbier", "restaurant", "resto", "pizzeria", "pizza",
  "bistro", "diner", "grill", "cafe", "boucherie", "boucher", "fleuriste",
  "florist", "garage", "mecanique", "auto", "moto", "esthetique", "estheticienne",
  "esthetician", "institut", "spa", "beauty", "beaute", "massage", "hotel",
  "menuisier", "menuiserie", "carpenter", "carpentry", "electricien", "electricite",
  "electrician", "serrurier", "serrurerie", "locksmith", "paysagiste", "jardinier",
  "landscap", "garden", "peintre", "painter", "painting", "chauffage",
  "climatisation", "hvac", "heating", "artisan", "entreprise", "societe",
  "groupe", "group", "sarl", "eurl", "services", "service", "cabinet", "agence",
  "agency", "immobilier", "dentiste", "dentaire", "dental", "medecin", "clinic",
  "pharmacie", "pharmacy", "animalerie", "veterinaire", "vet", "pressing",
  "cordonnier", "bijouterie", "opticien", "optician", "traiteur", "catering",
  "glacier", "chocolatier", "banque", "assurance", "courtier", "demenagement",
  "moving", "mover", "nettoyage", "cleaning", "blanchisserie", "tatouage",
  "tattoo", "yoga", "fitness", "coach", "photo", "centre", "center", "maison",
  "home", "house", "store", "shop", "magasin", "boutique", "atelier", "epicerie",
  "market", "pro", "pros", "relax", "medical", "sante", "health",
]);

/** Hébergeurs de sites gratuits : un site possible, mais confiance réduite */
const HOSTED_BUILDERS = [
  "wixsite", "jimdo", "squarespace", "site123", "webnode", "e-monsite",
  "strikingly", "godaddysites", "weebly", "blogspot", "wordpress", "shopify",
  "sitegoogle", "google.site", "canva", "flowww",
];

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const BAD_EMAIL = /^(noreply|no-reply|donotreply|wordpress|mailer|postmaster|webmaster|example|sentry|privacy)@/i;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isSocial(host: string): boolean {
  return SOCIAL_HOSTS.some((h) => host.includes(h));
}

function isDirectory(host: string): boolean {
  return DIRECTORY_HOSTS.some((h) => host.includes(h));
}

/** Normalise un nom d'enseigne en tokens comparables à un nom de domaine */
function nameTokens(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);
}

export interface WebIntelResult {
  officialSite: string | null;
  /** high = quasi certain (slug complet) · low = probable, à vérifier */
  officialConfidence: "high" | "low" | null;
  socials: string[];
  emails: string[];
  directories: string[];
  snippets: { title: string; link: string; snippet: string }[];
}

/**
 * Décide si un domaine peut être le site officiel de l'enseigne.
 * Règles strictes pour éliminer les faux positifs (marketplaces) :
 *  - HIGH : le slug complet du nom figure dans le domaine, OU tous les tokens
 *    distinctifs (≥ 2, mots génériques de métier exclus) y figurent.
 *  - LOW  : un seul token distinctif trouvé — indexation possible mais incertaine.
 * Un hébergeur gratuit (wix…) ne peut jamais être HIGH.
 */
function classifyOfficialSite(
  host: string,
  name: string
): "high" | "low" | null {
  const flat = host.replace(/[^a-z0-9]/g, "");
  if (!flat) return null;

  const tokens = nameTokens(name);
  if (!tokens.length) return null;

  const slug = tokens.join("");
  const distinctive = tokens.filter((t) => !TRADE_WORDS.has(t));
  const hosted = HOSTED_BUILDERS.some((h) => host.includes(h));

  /* Règle forte : slug complet ("Boulangerie Dupont" → boulangeriedupont.fr) */
  if (slug.length >= 8 && flat.includes(slug)) return hosted ? "low" : "high";

  /* Tous les tokens distinctifs présents (≥ 2) */
  if (
    distinctive.length >= 2 &&
    distinctive.every((t) => flat.includes(t))
  ) {
    return hosted ? "low" : "high";
  }

  /* Un seul token distinctif mais long et rare */
  if (distinctive.length === 1 && distinctive[0].length >= 6 && flat.includes(distinctive[0])) {
    return "low";
  }
  /* Majorité de tokens distinctifs présents */
  if (
    distinctive.length >= 2 &&
    distinctive.filter((t) => flat.includes(t)).length / distinctive.length >= 0.6
  ) {
    return "low";
  }
  return null;
}

export async function webSearchBusiness(opts: {
  name: string;
  zone: string;
  apiKey: string;
  gl: string;
  hl: Lang;
  proxy?: string;
}): Promise<WebIntelResult> {
  const q = `"${opts.name}" ${opts.zone}`.trim();
  const data = await serperPost(
    "/search", { q, gl: opts.gl, hl: opts.hl, num: 10 }, opts.apiKey, opts.proxy
  );
  const obj = Array.isArray(data) ? data[0] : data;
  const organic = (Array.isArray(obj?.organic) ? obj.organic : []) as Raw[];

  const socials = new Set<string>();
  const directories = new Set<string>();
  const emails = new Set<string>();
  const snippets: { title: string; link: string; snippet: string }[] = [];
  let officialSite: string | null = null;
  let officialConfidence: "high" | "low" | null = null;
  /* On privilégie un HIGH apparut plus tard sur un LOW déjà trouvé */
  const confidenceRank = { high: 2, low: 1 } as const;

  for (const o of organic) {
    const link = firstString(o.link) ?? "";
    const title = firstString(o.title) ?? "";
    const snippet = firstString(o.snippet) ?? "";
    if (!link) continue;
    const host = hostOf(link);
    if (!host) continue;

    if (snippets.length < 5) snippets.push({ title, link, snippet });

    for (const m of `${title} ${snippet}`.match(EMAIL_RE) ?? []) {
      if (!BAD_EMAIL.test(m)) emails.add(m.toLowerCase());
    }

    if (isSocial(host)) {
      socials.add(link);
      continue;
    }
    if (isDirectory(host)) {
      directories.add(host);
      continue;
    }

    const verdict = classifyOfficialSite(host, opts.name);
    if (verdict && (!officialConfidence || confidenceRank[verdict] > confidenceRank[officialConfidence])) {
      officialSite = link;
      officialConfidence = verdict;
    }
  }

  return {
    officialSite,
    officialConfidence,
    socials: [...socials].slice(0, 4),
    emails: [...emails].slice(0, 3),
    directories: [...directories].slice(0, 5),
    snippets,
  };
}

/* ------------------------------------------------------------------ */
/*  Avis /reviews — par cid (ou placeId)                               */
/* ------------------------------------------------------------------ */

export async function fetchPlaceReviews(opts: {
  cid?: string | null;
  placeId?: string | null;
  q?: string | null;
  apiKey: string;
  gl: string;
  hl: Lang;
  proxy?: string;
}): Promise<ReviewItem[]> {
  const ident = opts.cid
    ? { cid: opts.cid }
    : opts.placeId
      ? { placeId: opts.placeId }
      : { q: opts.q };
  const data = await serperPost(
    "/reviews",
    { ...ident, gl: opts.gl, hl: opts.hl },
    opts.apiKey,
    opts.proxy
  );
  const obj = Array.isArray(data) ? data[0] : data;
  const list = (Array.isArray(obj?.reviews) ? obj.reviews : []) as Raw[];
  return list.slice(0, 10).map(mapReview);
}

function mapReview(r: Raw): ReviewItem {
  const user = (r.user ?? {}) as Raw;
  const dateStr = typeof r.date === "string" ? r.date : "";
  const iso =
    (typeof r.isoDate === "string" && r.isoDate) ||
    (typeof r.isoDateOfLastEdit === "string" && r.isoDateOfLastEdit) ||
    parseRelativeDate(dateStr);
  return {
    author: (user.name as string) ?? (r.author as string) ?? "Client Google",
    rating: toNumber(r.rating) ?? 0,
    text: ((r.snippet as string) ?? (r.text as string) ?? "").trim(),
    relativeTime: dateStr,
    publishTime: iso,
  };
}

/** Convertit une date relative Google ("il y a 3 jours" / "2 weeks ago") en ISO. */
export function parseRelativeDate(input: string): string | null {
  if (!input) return null;
  const s = input.toLowerCase().trim();
  if (/^(hier|yesterday)/.test(s)) return new Date(Date.now() - 86400000).toISOString();

  const fr = s.match(/il y a\s+(?:environ\s+)?(?:plus (?:d'|de )\s*)?(\d+|une?)\s*(heure|jour|semaine|mois|an)s?/);
  const en = s.match(/(\d+|an?|one)\s+(hour|day|week|month|year)s?\s+ago/);
  const m = fr ?? en;
  if (!m) return null;

  const word = m[1];
  const unit = m[2];
  const n = /\d+/.test(word) ? parseInt(word, 10) : 1;
  const days = /heure|hour/.test(unit)
    ? n / 24
    : /jour|day/.test(unit)
      ? n
      : /semaine|week/.test(unit)
        ? n * 7
        : /mois|month/.test(unit)
          ? n * 30
          : n * 365;
  return new Date(Date.now() - days * 86400000).toISOString();
}

/* ------------------------------------------------------------------ */
/*  Parsing défensif                                                   */
/* ------------------------------------------------------------------ */

/** Accepte number, "4.6", "1 234", "4,6"… */
function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d.,-]/g, "").replace(",", ".");
    if (!cleaned) return null;
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function firstString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function safeUid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

function normalizePhone(phone: string | null, gl: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) return digits.slice(2);

  const country = COUNTRIES.find((c) => c.code === gl);
  const calling = country?.calling;
  if (!calling) return digits;

  /* Déjà au format international ? */
  if (digits.startsWith(calling) && digits.length >= calling.length + 8) return digits;

  /* National avec indicatif 0 → on le remplace par l'indicatif pays. */
  if (digits.startsWith("0")) {
    if (gl === "it") return calling + digits; /* Italie : le 0 se conserve */
    return calling + digits.slice(1);
  }
  return calling + digits;
}

function normalizeHours(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((h): h is string => typeof h === "string");
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => typeof v === "string")
      .map(([k, v]) => `${k} : ${v}`);
  }
  if (typeof raw === "string") return [raw];
  return [];
}

function normalizeServices(raw: Raw): string[] {
  for (const key of ["services", "serviceOptions", "attributes", "amenities"]) {
    const v = raw[key];
    if (Array.isArray(v)) return v.filter((s): s is string => typeof s === "string").slice(0, 10);
  }
  return [];
}

export function buildMapsUrl(
  cid: string | null,
  placeId: string | null,
  lat: number | null,
  lng: number | null,
  title: string
): string {
  if (cid) return `https://maps.google.com/?cid=${cid}`;
  if (placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}&query_place_id=${encodeURIComponent(placeId)}`;
  }
  if (lat !== null && lng !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/${encodeURIComponent(title)}`;
}

export function mapPlace(p: Raw, gl: string, zone = ""): Business {
  const cid = firstString(p.cid);
  const placeId = firstString(p.placeId, p.place_id);
  const gps = (p.gpsCoordinates ?? p.gps_coordinates ?? {}) as Raw;
  const lat = toNumber(p.latitude) ?? toNumber(gps.latitude);
  const lng = toNumber(p.longitude) ?? toNumber(gps.longitude);
  const title = firstString(p.title, p.name) ?? "Sans nom";
  const phone = firstString(p.phoneNumber, p.phone, p.phone_number);
  /* /maps expose la catégorie sous "type" ; /places sous "category" */
  const types = Array.isArray(p.types)
    ? (p.types as unknown[]).filter((t): t is string => typeof t === "string")
    : [];
  const category = firstString(p.type, p.category) ?? types[0] ?? "Établissement";
  const website = firstString(p.website, p.websiteUri);
  const ratingCount =
    toNumber(p.ratingCount) ?? toNumber(p.reviewsCount) ?? toNumber(p.reviews) ?? 0;

  return {
    id: cid ?? placeId ?? `${title}-${lat}-${lng}-${safeUid()}`,
    cid,
    placeId,
    zone,
    name: title,
    address: firstString(p.address, p.formattedAddress) ?? "—",
    phone,
    phoneDigits: normalizePhone(phone, gl),
    hours: normalizeHours(p.openingHours ?? p.hours ?? p.workingHours),
    rating: toNumber(p.rating),
    reviewCount: ratingCount,
    description:
      firstString(p.description) ?? `Fiche Google sans description éditoriale. Catégorie : ${category}.`,
    category,
    lat,
    lng,
    services: normalizeServices(p),
    photoUrl: firstString(p.thumbnailUrl, p.imageUrl, p.thumbnail),
    mapsUrl: buildMapsUrl(cid, placeId, lat, lng, title),
    reviews: [],
    websiteUri: website,
    lastReviewIso: null,
  };
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function buildQuery(brief: { type: string; ville: string }): string {
  /* Syntaxe exacte demandée : [type de business] near [ville] */
  return `${brief.type.trim()} near ${brief.ville.trim()}`;
}
