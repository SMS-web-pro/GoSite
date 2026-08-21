const COUNTRY_CODES: Record<string, string> = {
  MA: "212", FR: "33", BE: "32", TN: "216", DZ: "213", SN: "221",
  CM: "237", CI: "225", ML: "223", NE: "227", BF: "226", MG: "261",
  RG: "222", GA: "241", CG: "242", CD: "243", NG: "234", GH: "233",
  US: "1", GB: "44", DE: "49", ES: "34", IT: "39", PT: "351",
  NL: "31", CH: "41", SE: "46", NO: "47", DK: "45", PL: "48",
  CZ: "420", RO: "40", HU: "36", TR: "90", AE: "971", SA: "966",
  EG: "20", LB: "961", JO: "962", IQ: "964", KW: "965", QA: "974",
  BH: "973", OM: "968", LY: "218", SD: "249",
};

// All country codes sorted by length descending (longest first) for proper matching
const ALL_CC = Object.values(COUNTRY_CODES).sort((a, b) => b.length - a.length);

/**
 * Normalize a phone number to international format (without +).
 *
 * Handles:
 *   "+212 669 549 933"  → "212669549933"
 *   "0669549933" (MA)   → "212669549933"  (leading 0 replaced with country code)
 *   "0669549933" (FR)   → "33669549933"   (leading 0 replaced with country code)
 *   "212669549933"      → "212669549933"  (already international)
 *   "33612345678"       → "33612345678"   (already international, no leading 0)
 */
export function normalizePhone(phone: string | null | undefined, countryCode?: string | null): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/[^0-9+]/g, "");
  if (!cleaned || cleaned.length < 5) return null;
  const withoutPlus = cleaned.replace(/^\+/, "");

  // Already starts with a known country code (no leading 0) → international format
  for (const cc of ALL_CC) {
    if (withoutPlus.startsWith(cc)) {
      return withoutPlus;
    }
  }

  // Has a leading 0 → local format, replace 0 with country code
  if (withoutPlus.startsWith("0") && withoutPlus.length >= 9) {
    const cc = countryCode?.toUpperCase();
    if (cc && COUNTRY_CODES[cc]) {
      return COUNTRY_CODES[cc] + withoutPlus.substring(1);
    }
    // Try to detect country code from number prefix
    for (const knownCc of ALL_CC) {
      const without0 = withoutPlus.substring(1);
      if (without0.startsWith(knownCc)) {
        return without0; // Already has country code after the 0
      }
    }
    // Unknown country, return as-is (best effort)
    return withoutPlus;
  }

  // Short number with country code provided
  const cc = countryCode?.toUpperCase();
  if (cc && COUNTRY_CODES[cc]) {
    const prefix = COUNTRY_CODES[cc];
    if (!withoutPlus.startsWith(prefix)) {
      return prefix + withoutPlus;
    }
  }

  return withoutPlus;
}

/**
 * Ensure a phone number is in international format for WhatsApp JID.
 * This is the LAST防线 before sending to Baileys.
 */
export function ensureInternationalFormat(phone: string, defaultCountryCode?: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (!cleaned || cleaned.length < 8) return cleaned;

  // Already starts with a known country code
  for (const cc of ALL_CC) {
    if (cleaned.startsWith(cc)) {
      return cleaned;
    }
  }

  // Has leading 0 → strip it and try to find country code
  if (cleaned.startsWith("0") && cleaned.length >= 9) {
    const without0 = cleaned.substring(1);
    // Check if the rest starts with a known country code
    for (const cc of ALL_CC) {
      if (without0.startsWith(cc)) {
        return without0;
      }
    }
    // Try with default country code
    if (defaultCountryCode) {
      const cc = defaultCountryCode.toUpperCase();
      if (COUNTRY_CODES[cc]) {
        return COUNTRY_CODES[cc] + without0;
      }
    }
    // Return without leading 0 as best effort
    return without0;
  }

  return cleaned;
}

export function getPhoneCountryCode(country: string | null | undefined): string | null {
  if (!country) return null;
  const cc = country.toUpperCase();
  return COUNTRY_CODES[cc] || null;
}
