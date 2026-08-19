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

export function normalizePhone(phone: string | null | undefined, countryCode?: string | null): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/[^0-9+]/g, "");
  if (!cleaned || cleaned.length < 5) return null;
  const withoutPlus = cleaned.replace(/^\+/, "");
  if (withoutPlus.length >= 10) return withoutPlus;
  const cc = countryCode?.toUpperCase();
  if (cc && COUNTRY_CODES[cc]) {
    const prefix = COUNTRY_CODES[cc];
    if (!withoutPlus.startsWith(prefix)) {
      return prefix + withoutPlus;
    }
  }
  return withoutPlus;
}

export function getPhoneCountryCode(country: string | null | undefined): string | null {
  if (!country) return null;
  const cc = country.toUpperCase();
  return COUNTRY_CODES[cc] || null;
}
