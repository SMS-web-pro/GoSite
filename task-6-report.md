# Task 6 Pay API + Analytics — Review Report

**Files:** `src/app/api/prospects/[id]/pay/route.ts`, `src/lib/local-store.ts`, `src/app/dashboard/page.tsx`, `src/app/analytics/page.tsx`, `src/app/api/stats/route.ts`
**Spec:** `docs/superpowers/specs/2026-08-30-split-payment-2x-design.md` §5.3 + §8
**Plan:** `docs/superpowers/plans/2026-08-30-split-payment-2x-plan.md` Task 6
**Date:** 2026-08-30
**Verdict:** PASS

---

## 1. Pay route handles type deposit|final, sets correct statuses/dates, workflowStage, deliveryDate, localStore fallback — PASS

**File:** `src/app/api/prospects/[id]/pay/route.ts:1-108`

| Check | Spec / Plan Ref | Line | Evidence | Result |
|-------|----------------|------|----------|--------|
| Body `type: 'deposit'\|'final'` default `deposit` compat | Spec §5.3, Plan T6 Step1 | 21-29 | `let type: "deposit" \| "final" = "deposit"` + `try { body = await req.json(); if(body.type==='final'\|\|'deposit') type=body.type } catch { // keep default }` | ✓ |
| Handles invalid ID | — | 15-18 | `parseInt(id,10)` + `Number.isNaN -> 400` | ✓ |
| `type=deposit` → `depositStatus='paid', depositDate=now()` | Spec §5.3 | 74-84 | `dbUpdates: {depositStatus:"paid", depositDate: now, workflowStage:"deposit_paid", updatedAt: now}` + `localUpdates: {depositStatus:"paid", depositDate: now.toISOString(), workflowStage:"deposit_paid"}` | ✓ |
| `type=final` → `finalPaymentStatus='paid', finalPaymentDate=now()` | Spec §5.3 | 34-50 | `finalPaymentStatus:"paid", finalPaymentDate: now` (DB) + ISO string (local) | ✓ |
| `final` also sets `paymentStatus='paid', paymentDate=now()` (legacy sync) | Plan T6 Step1 snippet | 37-38, 46-47 | `paymentStatus:"paid", paymentDate: now / now.toISOString()` | ✓ |
| `final` sets `workflowStage='paid'` | Spec §5.3 | 39, 48 | `workflowStage:"paid"` in both db/local | ✓ |
| `final` sets `deliveryDate = now+24h` | Spec §3.2, Plan implicit | 40, 49 | `deliveryDate: new Date(now.getTime()+24*60*60*1000)` | ✓ |
| `deposit` sets `workflowStage='deposit_paid'` (new stage between quoted/paid) | Spec §5.1 | 77, 83 | `workflowStage:"deposit_paid"` | ✓ |
| DB-first then localStore sync on success | Plan T6 constraints | 53-62, 86-96 | `try { const [updated]=await db.update(...).returning(); if(updated){ localStore.updateProspect(...); return json } } catch {}` | ✓ |
| DB unreachable fallback to `localStore.updateProspect` | Spec §8 | 63-71, 97-104 | `catch {}` fallthrough + `localStore.updateProspect(prospectId, localUpdates)` -> 404 if null | ✓ |
| Supports Next 16 `params: Promise` | — | 12,14 | `await context.params` | ✓ |

**Notes:**
- `localUpdates` for deposit omits explicit `updatedAt` — covered by `localStore.updateProspect:145` which injects `updatedAt: new Date().toISOString()` on every merge. No data loss.
- Defaulting invalid `type` to `deposit` hides malformed requests but per spec is compat-required. No validation error is intentional.
- Amount fields (`depositAmount/finalAmount`) are NOT set here — correct; they are set at creation `src/app/api/prospects/route.ts:82-85` (currency-derived from `settings.depositPrice*` / `finalPrice*`). Pay route only flips status; revenue calc uses `amount ?? fallback` so null-amount still yields correct CA.

---

## 2. local-store merges new fields — PASS

**File:** `src/lib/local-store.ts:1-242` + `src/lib/settings.ts:109-147` (fallback)

| Check | Line | Evidence |
|-------|------|----------|
| `addProspect` initializes split fields | 104-109 | `workflowStage:"discovered", paymentStatus:"pending", depositStatus:"pending", finalPaymentStatus:"pending"` + `...p` spread after defaults so caller `depositAmount/finalAmount/totalAmount` merge |
| `updateProspect` generic merge | 145-156 | `data.prospects[index] = {...data.prospects[index], ...updates, updatedAt: new Date().toISOString()}` — any new `depositStatus/depositDate/finalPaymentStatus/finalPaymentDate/workflowStage/deliveryDate` persists |
| `saveSettings` preserves 12 split fields | 211-217 | `data.settings = {...(data.settings\|\|{}), ...s, updatedAt: ...}` + comment `Merge with existing settings to preserve 12 split-payment fields when partial updates occur` |
| `getSettings` back-compat fallback | `src/lib/settings.ts:109-147` | `applySettingsFallbacks` derives `depositPrice*= raw.depositPrice* ?? round(price*0.396) :9900` and `finalPrice*= raw.finalPrice* ?? price-deposit :15000` — covers `data/store.json` without new columns | 
| `src/app/api/settings/route.ts:31-42` allowlist | 31-42 | 12 new fields in `allowed` + forwarded to `saveSettingsToDb` | 

Matches Spec §8 risk mitigation `local-store fallback must handle 12 new fields via merge (no SQL migration in local)`.

---

## 3. Dashboard revenue = deposit where paid + final where paid with fallback legacy — PASS

**File:** `src/app/dashboard/page.tsx:20-127`

DB path (try) `src/app/dashboard/page.tsx:22-77` and local fallback `src/app/dashboard/page.tsx:78-127` are identical logic.

```
isPaidProspect = paymentStatus==='paid' || depositStatus==='paid' || finalPaymentStatus==='paid'
               || saleStages.includes(workflowStage) || workflowStage==='deposit_paid'  // 25-30, 84-89
```

Revenue per prospect `src/app/dashboard/page.tsx:42-77` / `98-125`:

```ts
if (p.depositStatus === "paid") {
  fallbackDeposit = curr==="EUR" ? settings.depositPriceEUR ?? 9900
                  : curr==="USD" ? settings.depositPriceUSD ?? 9900
                  : settings.depositPriceMAD ?? 99000;          // 47-52, 100-105
  revenue += p.depositAmount ?? fallbackDeposit;                 // 53, 106
}
if (p.finalPaymentStatus === "paid") {
  fallbackFinal = curr==="EUR" ? settings.finalPriceEUR ?? 15000
                : curr==="USD" ? settings.finalPriceUSD ?? 15000
                : settings.finalPriceMAD ?? 150000;              // 56-61, 108-114
  revenue += p.finalAmount ?? fallbackFinal;                     // 62, 115
}
if (revenue===0 && (paymentStatus==="paid" || saleStages.includes(workflowStage) || workflowStage==="deposit_paid")) {
  legacyAmount = paymentAmount || quoteAmount || totalAmount || (curr==="EUR"?priceEUR:priceUSD:priceMAD); // 65-71, 117-120
  revenue = legacyAmount;
}
```

- Implements Spec §5.4 `CA = sum(depositAmount where depositStatus=paid) + sum(finalAmount where finalPaymentStatus=paid)` ✓
- Fallback `?? fallbackDeposit/final` handles null amounts (prospects created before split or DB null) — uses settings per currency ✓
- Legacy fallback when both split statuses unpaid but old `paymentStatus=paid`/`deposit_paid` stage → `paymentAmount/quoteAmount/totalAmount/priceEUR` covers 30d back-compat ✓
- Per-currency bucket (`EUR->eur, USD->usd, MAD->mad`) + `totalInUSD` conversion `src/app/dashboard/page.tsx:130-138` retains prior display logic ✓
- `saleStages=["paid","delivered","completed"]` + explicit `deposit_paid` matches Spec §5.1 mapping ✓

Minor nit (non-blocking): DB path `legacyAmount` uses `p.paymentAmount || p.quoteAmount || p.totalAmount` without checking `quoteCurrency===curr`, while analytics checks it. Dashboard will bucket `quoteAmount` to `curr` even if `quoteCurrency` mismatched; in practice `curr = p.quoteCurrency || detect...` so they align. No functional break.

---

## 4. Analytics same — PASS

**File:** `src/app/analytics/page.tsx:22-86`

Same formulas as dashboard, local-store only (as historically analytics was local-store):

```
// 24-29 isPaidProspect identical
// 39-46 depositStatus paid -> fallbackDeposit -> revenue+=depositAmount??fallback
// 48-55 finalPaymentStatus paid -> fallbackFinal -> revenue+=finalAmount??fallback
// 57-68 revenue===0 legacy fallback:
if (pp.paymentAmount) amount=pp.paymentAmount
else if (pp.quoteAmount && pp.quoteCurrency===curr) amount=pp.quoteAmount // more precise guard
else if (pp.totalAmount) amount=pp.totalAmount
else amount = priceEUR/USD/MAD
```

- Deposit+final sums identical to dashboard ✓
- Guard `pp.quoteCurrency===curr` is stricter than dashboard but spec-compliant; ensures currency-correct fallback ✓
- `revenueByCurrency` + `totalInUSD` (`src/app/analytics/page.tsx:76-86`) same as dashboard ✓
- `paidProspects` count includes split statuses + `deposit_paid` ✓

Parity between `dashboard/page.tsx` and `analytics/page.tsx` confirmed — both now split-aware.

---

## 5. `src/app/api/stats/route.ts` — PASS (no regression)

**File:** `src/app/api/stats/route.ts:1-26`

- Returns `{prospects, campaigns}` counts only (no revenue) — correct scope, not required to sum CA (CA is in dashboard/analytics).
- DB try: `select count(*)::int` from `prospects` + `campaigns` (`:12-17`)
- Catch fallback: `localStore.get()` counts (`:20-24`) — matches Spec §8 localStore fallback pattern.

Not modified for revenue, which is expected. No split-payment logic needed here.

---

## 6. Typecheck PASS — PASS

```
npm run typecheck  (tsc --noEmit)
# (no output, exit 0)
EXIT_CODE:0
```

Verified 2026-08-30 twice. `src/db/schema.ts:126-132` prospects 6 columns + `src/db/schema.ts:236-247` settings 12 columns typed correctly. `AppSettings` (`src/lib/settings.ts:30-41`) matches schema. Pay route `finalPaymentStatus/finalPaymentDate/depositStatus/depositDate/workflowStage/deliveryDate` all exist in Drizzle schema so no type error. Dashboard/analytics use `any` casts for `depositAmount` etc — intentional to tolerate legacy rows, avoids strict null errors.

---

## Verdict: PASS

All 5 checklist items PASS. No fixes required. Task 6 correctly implements Spec §5.3 split pay API (deposit/final) and Spec §5.4/§8 analytics CA split with localStore fallback, preserving back-compat and passing typecheck.

**Optional nits (non-blocking, tracked for Task 7 polish):**
- Consider adding `quoteCurrency===curr` guard to dashboard legacy fallback for parity with analytics.
- Consider explicit `updatedAt` in deposit `localUpdates` for symmetry (currently injected by `updateProspect`).
- `src/app/analytics/page.tsx` remains localStore-only; if DB becomes primary, evaluate switching to DB path like dashboard.

