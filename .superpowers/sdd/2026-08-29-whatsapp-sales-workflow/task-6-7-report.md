# Task 6-7 Report: ProspectClient + Pay Route

## Status: DONE

## Commits
- `7ed8f7f4` feat: update ProspectClient with new workflow stages, deposit/final pricing, auto follow-ups
- `e50aecb2` feat: update pay route for deposit/final payment split

## TypeScript Check
- `npx tsc --noEmit` — **No errors**

## Changes Made

### Task 6: ProspectClient (`src/app/prospects/[id]/ProspectClient.tsx`)
1. **Prospect type**: Added `depositPaid`, `depositPaidAt`, `finalPaid`, `finalPaidAt` fields; expanded `whatsappMessages` with `followup_2`, `followup_3`, `review_request`, `testimonial_request`
2. **Business type**: Added `googleMapsUrl` field
3. **Settings type**: Added deposit/final pricing fields (`priceDepositEUR/USD/MAD`, `priceFinalEUR/USD/MAD`, payment link variants) and expanded `messageTemplates` with 4 new keys
4. **STAGES constant**: Replaced 7 stages with 12 stages (added negotiating, deposit_paid, in_development, awaiting_review, revision, lost)
5. **advanceWorkflow**: Updated stage mapping — `payment_received` now maps to `deposit_paid`; added mappings for `followup_2`, `followup_3`, `review_request`, `testimonial_request`
6. **getTemplateVars**: Added `depositPrice`/`finalPrice`/`totalPrice` calculations, `payment_deposit_url`/`payment_final_url`, and `google_review_url`
7. **scheduleFollowups**: Added function that POSTs to `/api/prospects/{id}/schedule-followups`; called after intro message sent successfully
8. **WhatsAppTab stages**: Added followup, followup_2, followup_3, review_request, testimonial_request to the UI stages array and normalized values init

### Task 7: Pay Route (`src/app/api/prospects/[id]/pay/route.ts`)
- Rewritten to accept `{ type: "deposit" | "final" }` in request body
- **Deposit**: sets `depositPaid: true`, `depositPaidAt`, `paymentStatus: "deposit_paid"`, `workflowStage: "deposit_paid"`
- **Final**: sets `finalPaid: true`, `finalPaidAt`, `paymentStatus: "paid"`, `workflowStage: "paid"`, `deliveryDate: now + 24h`
- Falls back to `localStore` if DB is unreachable

### Supporting Change: Settings Library (`src/lib/settings.ts`)
- Updated `AppSettings.messageTemplates` type to include 4 new template keys

## Concerns
- The `localStore.get()` / `localStore.save()` pattern in the pay route is consistent with existing codebase patterns
- The `scheduleFollowups` API endpoint (Task 8) is referenced but not yet created — will cause a harmless 404 if called before Task 8 is implemented
