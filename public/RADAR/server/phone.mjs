import parsePhoneNumber from "libphonenumber-js/max";

export function parseToE164(input, defaultCountry = "FR") {
  const original = String(input ?? "").trim();
  if (!original) return { input: original, valid: false, error: "empty_number" };

  let normalized = original.replace(/^00/, "+");
  let parsed;
  try {
    parsed = parsePhoneNumber(normalized, {
      defaultCountry: String(defaultCountry || "FR").toUpperCase(),
      extract: false,
    });
    /* Accepte également un international fourni sans « + ». */
    if ((!parsed || !parsed.isValid()) && /^\d{10,15}$/.test(normalized.replace(/\D/g, ""))) {
      parsed = parsePhoneNumber(`+${normalized.replace(/\D/g, "")}`, { extract: false });
    }
  } catch {
    parsed = undefined;
  }

  if (!parsed?.isValid()) {
    return { input: original, valid: false, error: "invalid_phone_number" };
  }

  return {
    input: original,
    valid: true,
    e164: parsed.number,
    digits: parsed.number.slice(1),
    nationalNumber: parsed.nationalNumber,
    country: parsed.country ?? null,
    callingCode: parsed.countryCallingCode,
    type: parsed.getType?.() ?? null,
  };
}