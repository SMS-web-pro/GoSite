# Task 5: Rewrite WhatsApp Message Templates — Report

- **Status:** DONE
- **Commit:** `50f47c98` feat: rewrite all 7 WhatsApp templates, add 4 new types
- **TypeScript check:** PASS (no errors)

## Changes Made

### `src/lib/prompt-generator.ts`

1. **`MessageTemplateKey` type** — Added 4 new keys: `followup_2`, `followup_3`, `review_request`, `testimonial_request`

2. **Rewrote all 7 existing templates** (FR/EN/AR variants):
   - `intro` — Shortened from ~20 lines to 8 lines per language
   - `demo` — Simplified feature list, removed emoji-heavy formatting
   - `quote` — Added deposit/final price split (`{{price_deposit}}`, `{{price_final}}`, `{{payment_deposit_url}}`)
   - `payment_received` — Now references deposit payment, next steps numbered
   - `delivery` — Shortened checklist, added Google review CTA
   - `thanks` — Simplified referral offer
   - `followup` — Shortened to 3-line casual check-in

3. **Added 4 new templates:**
   - `followup_2` — Bonus incentive follow-up
   - `followup_3` — Final warning / competitor urgency
   - `review_request` — Google review CTA with `{{google_review_url}}`
   - `testimonial_request` — 2-line testimonial ask

4. **Updated `generateDefaultWhatsAppMessages()`** — Now returns all 11 templates

## Concerns

- The `payment_received` AR template has an extraneous space before `بدأت` (line ` started now`). Minor — cosmetic only.
- Template variables `{{payment_deposit_url}}` and `{{google_review_url}}` must be populated by ProspectClient's `getTemplateVars()` (Task 6) — this task only defines the templates.
