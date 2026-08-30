# Task 5 Settings UI — Review Report

**File:** `src/app/settings/SettingsClient.tsx`
**Spec:** `docs/superpowers/specs/2026-08-30-split-payment-2x-design.md` §6
**Plan:** `docs/superpowers/plans/2026-08-30-split-payment-2x-plan.md` Task 5
**Date:** 2026-08-30
**Verdict:** PASS

---

## 1. 12 useState deposit/final price/link with correct defaults /100 — PASS

`src/app/settings/SettingsClient.tsx:65-76` — 12 states exactly as plan Task 5 Step 1:

| # | State | Default (cents) | /100 | Line |
|---|-------|-----------------|------|------|
| 1 | `depositPriceEUR` | 9900 (=99€) | ✓ | 65 |
| 2 | `depositPriceUSD` | 9900 (=$99) | ✓ | 66 |
| 3 | `depositPriceMAD` | 99000 (=990 MAD) | ✓ | 67 |
| 4 | `finalPriceEUR` | 15000 (=150€) | ✓ | 68 |
| 5 | `finalPriceUSD` | 15000 (=$150) | ✓ | 69 |
| 6 | `finalPriceMAD` | 150000 (=1500 MAD) | ✓ | 70 |
| 7 | `depositPaymentLinkEUR` | "" | — | 71 |
| 8 | `depositPaymentLinkUSD` | "" | — | 72 |
| 9 | `depositPaymentLinkMAD` | "" | — | 73 |
| 10 | `finalPaymentLinkEUR` | "" | — | 74 |
| 11 | `finalPaymentLinkUSD` | "" | — | 75 |
| 12 | `finalPaymentLinkMAD` | "" | — | 76 |

Matches DB spec §3.1 defaults. Pattern `((initialSettings as any).xxx || DEFAULT) / 100` consistent with legacy `priceEUR` handling `src/app/settings/SettingsClient.tsx:55-57`. Legacy 6 states (priceEUR/USD/MAD + paymentLinkEUR/USD/MAD) retained for 30d back-compat — correct.

## 2. save() includes 12 fields with Math.round*100 — PASS

`src/app/settings/SettingsClient.tsx:149-160`:

```ts
depositPriceEUR: Math.round(depositPriceEUR * 100), // 149
depositPriceUSD: Math.round(depositPriceUSD * 100), // 150
depositPriceMAD: Math.round(depositPriceMAD * 100), // 151
finalPriceEUR: Math.round(finalPriceEUR * 100),     // 152
finalPriceUSD: Math.round(finalPriceUSD * 100),     // 153
finalPriceMAD: Math.round(finalPriceMAD * 100),     // 154
depositPaymentLinkEUR: depositPaymentLinkEUR || null, // 155
depositPaymentLinkUSD: depositPaymentLinkUSD || null, // 156
depositPaymentLinkMAD: depositPaymentLinkMAD || null, // 157
finalPaymentLinkEUR: finalPaymentLinkEUR || null,     // 158
finalPaymentLinkUSD: finalPaymentLinkUSD || null,     // 159
finalPaymentLinkMAD: finalPaymentLinkMAD || null,     // 160
```

6× `Math.round(*100)` + 6× `|| null` = 12 fields. Back-compat `priceEUR/USD/MAD` + `paymentLinkEUR/USD/MAD` also sent (`:143-148`). Payload matches `src/app/api/settings/route.ts` allowlist (Task 2).

## 3. Pricing tab has 3 cards each with 2 rows deposit+final + total auto — PASS

`src/app/settings/SettingsClient.tsx:240-405`:

- **EUR card** `src/app/settings/SettingsClient.tsx:251-300`: `border-blue-200 bg-blue-50/50`, header `Total {depositPriceEUR + finalPriceEUR}€` (`:254`), Row1 grid `Deposit (€)` + `Lien deposit EUR` (`:256-277`), Row2 grid `Final (€)` + `Lien final EUR` (`:278-299`)
- **USD card** `src/app/settings/SettingsClient.tsx:303-352`: `border-emerald-200`, `Total ${depositPriceUSD + finalPriceUSD}` (`:306`), same 2-row structure
- **MAD card** `src/app/settings/SettingsClient.tsx:355-404`: `border-amber-200`, `Total {depositPriceMAD + finalPriceMAD} DH` (`:358`), same 2-row structure

Total auto is live-derived (reactive, read-only). Intro text `src/app/settings/SettingsClient.tsx:244-246` correctly describes deposit+final injection per locale. Centimes helper `Math.round(price*100)` per field present (`:266,288,318,340,370,392`).

Matches spec §6.1 layout exactly.

## 4. Messages tab 8 keys, help text includes new vars, labels correct — PASS

- **8 keys:** `src/app/settings/SettingsClient.tsx:81` `stageKeys = ["intro","demo","quote","deposit_received","final_payment_request","final_payment_received","delivery","thanks"]` — 8 entries. Rendered `src/app/settings/SettingsClient.tsx:440` same array. Back-compat alias `payment_received -> deposit_received` handled `src/app/settings/SettingsClient.tsx:85-86` and save-time alias `src/app/settings/SettingsClient.tsx:128-130`.

- **Help text new vars:** `src/app/settings/SettingsClient.tsx:415` lists `{{total_price}} {{deposit_price}} {{final_price}} {{deposit_payment_url}} {{final_payment_url}}` plus legacy `{{price}} {{payment_url}} {{final_site_url}}` etc. — all 5 new vars present. Conditionals `{{#if rating}}` retained `:418`.

- **Labels correct:** `src/app/settings/SettingsClient.tsx:443-450`:
  - `intro` → Message 1 — Premier contact ✓
  - `demo` → Message 2 — Envoi de la démo ✓
  - `quote` → Message 3 — Devis et lien de paiement (Total + Deposit) ✓
  - `deposit_received` → Message 4 — Deposit reçu (99) ✓
  - `final_payment_request` → Message 5 — Demande solde final (150) ✓
  - `final_payment_received` → Message 6 — Solde reçu ✓
  - `delivery` → Message 7 — Livraison du site ✓
  - `thanks` → Message 8 — Remerciement & fidélisation ✓

Note: `followup` omitted (spec §4.2 lists 9 keys incl. followup, plan Task 5 step 4 defines 8 keys without it). Consistent with plan; no regression — `followup` was never editable in prior Settings UI either (`payment_received` alias era). Flagged as non-blocking.

## 5. Typecheck PASS — PASS

```
npx tsc --noEmit
# (no output, exit 0)
```

Verified `2026-08-30`. No type errors in `SettingsClient.tsx` or downstream.

---

## Verdict: PASS

All 5 checklist items PASS. No fixes required. File is ready for Task 6 (Pay API + Analytics).

**Optional nit (non-blocking):** Consider adding `followup` to `stageKeys` if Settings should expose it (spec §4.2 includes it), but current 8 matches plan Task 5 scope.
