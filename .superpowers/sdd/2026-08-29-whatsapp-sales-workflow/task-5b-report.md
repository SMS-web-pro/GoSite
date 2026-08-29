# Task 5b Report — Rewrite WhatsApp Message Templates

**Status:** DONE

## Changes Made

### 1. `src/lib/prompt-generator.ts`
- Updated `MessageTemplateKey` type: removed `thanks`, `followup_3`, `review_request`, `testimonial_request`; added `ask_offer`, `deposit`, `progress_update`, `preview`, `confirm_changes`, `final_payment`, `checkin`, `referral`, `has_website`, `not_interested`, `too_expensive`, `cheaper`
- Replaced all 19 templates in `DEFAULT_TEMPLATES` with exact EN variants from the spec, plus FR/AR translations
- Updated `generateDefaultWhatsAppMessages()` to return all 19 template keys

### 2. `src/db/schema.ts`
- Updated `whatsappMessages` JSONB type in prospects table to match new 19-key structure
- Updated `messageTemplates` JSONB type in settings table to match new 19-key structure

### 3. `src/lib/settings.ts`
- Updated `AppSettings.messageTemplates` type to match new 19-key structure

### 4. `src/app/settings/SettingsClient.tsx`
- Updated local `Settings` type for `messageTemplates`
- Updated `stageKeys` array to include all 19 keys
- Updated template editor UI to render all 19 stages with correct labels

### 5. `src/app/prospects/[id]/ProspectClient.tsx`
- Updated `Settings` and `Prospect` types for `messageTemplates` and `whatsappMessages`
- Updated `stageKeys` array in WhatsAppTab
- Updated `stages` array with new 19 stage definitions

### 6. `src/app/analytics/AnalyticsClient.tsx`
- Updated `stageColors` to include all new message stages

### 7. `src/app/api/prospects/[id]/schedule-followups/route.ts`
- Removed `followup_3` from scheduled follow-ups (now only 2 follow-ups: J+3, J+7)

## TypeScript Check
- `npx tsc --noEmit` passed with zero errors

## Commit
- Not committed yet (awaiting user confirmation)
