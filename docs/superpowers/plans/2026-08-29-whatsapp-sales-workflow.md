# WhatsApp Sales Workflow — $249 Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the WhatsApp message templates and workflow to match a $99 deposit → $150 final payment sales model, with shorter messages, multi-stage follow-ups, and automatic scheduling.

**Architecture:** Rewrite 7 existing templates to be shorter (5-8 lines), add 4 new message types, extend workflow stages, split pricing into deposit/final, and build a cron-based auto-sender for follow-ups.

**Tech Stack:** Next.js 16, Drizzle ORM, PostgreSQL, node-cron (new dependency), React 19, Tailwind CSS 4

**Spec:** WhatsApp Sales Workflow reference document ($249 website model)

---

## Global Constraints

- All message templates must be trilingual (fr/en/ar)
- Prices stored in cents in DB, displayed as whole units in UI
- Campaign currency determines which price/payment link is used
- WhatsApp sending uses Baileys (local) or external server (via WHATSAPP_SERVER_URL)
- All DB changes require migration SQL files in `drizzle/` folder
- Follow-up scheduling uses `node-cron` running in the Next.js Node.js process

---

## File Structure

### Files to Create
| File | Purpose |
|------|---------|
| `drizzle/0004_whatsapp_workflow_upgrade.sql` | Schema migration: new columns + tables |
| `src/lib/auto-messenger.ts` | Cron scheduler for automatic follow-ups |

### Files to Modify
| File | Changes |
|------|---------|
| `src/db/schema.ts` | Add deposit/final pricing columns to settings, add scheduledMessages table, extend workflowStage enum |
| `src/lib/prompt-generator.ts` | Rewrite all 7 templates, add 4 new types, update DEFAULT_TEMPLATES |
| `src/lib/settings.ts` | Add `priceDepositEUR/USD/MAD`, `priceFinalEUR/USD/MAD`, `paymentLinkDepositEUR/USD/MAD`, `paymentLinkFinalEUR/USD/MAD` fields |
| `src/app/settings/SettingsClient.tsx` | Redesign Pricing tab: deposit + final per currency |
| `src/app/api/settings/route.ts` | Add new pricing fields to allowlist |
| `src/app/prospects/[id]/ProspectClient.tsx` | Add new message stages, update template vars for deposit/final pricing, update workflow stages |
| `src/app/api/prospects/[id]/pay/route.ts` | Handle deposit vs final payment |
| `src/app/api/whatsapp/send/route.ts` | Support scheduled sending |
| `next.config.ts` | Register node-cron as serverExternalPackage |
| `package.json` | Add node-cron dependency |

---

## Task 1: Database Schema Migration

**Files:**
- Create: `drizzle/0004_whatsapp_workflow_upgrade.sql`
- Modify: `src/db/schema.ts`

**Interfaces:**
- Consumes: existing `settings`, `prospects`, `messageLogs` tables
- Produces: new columns on `settings`, new `scheduledMessages` table, extended `prospects.workflowStage`

- [ ] **Step 1: Create migration SQL file**

```sql
-- drizzle/0004_whatsapp_workflow_upgrade.sql

-- 1. Add deposit/final pricing columns to settings
ALTER TABLE settings ADD COLUMN price_deposit_eur INTEGER DEFAULT 9900;
ALTER TABLE settings ADD COLUMN price_deposit_usd INTEGER DEFAULT 9900;
ALTER TABLE settings ADD COLUMN price_deposit_mad INTEGER DEFAULT 9900;
ALTER TABLE settings ADD COLUMN price_final_eur INTEGER DEFAULT 15000;
ALTER TABLE settings ADD COLUMN price_final_usd INTEGER DEFAULT 15000;
ALTER TABLE settings ADD COLUMN price_final_mad INTEGER DEFAULT 15000;

-- 2. Add deposit/final payment link columns to settings
ALTER TABLE settings ADD COLUMN payment_link_deposit_eur TEXT;
ALTER TABLE settings ADD COLUMN payment_link_deposit_usd TEXT;
ALTER TABLE settings ADD COLUMN payment_link_deposit_mad TEXT;
ALTER TABLE settings ADD COLUMN payment_link_final_eur TEXT;
ALTER TABLE settings ADD COLUMN payment_link_final_usd TEXT;
ALTER TABLE settings ADD COLUMN payment_link_final_mad TEXT;

-- 3. Add deposit/final tracking to prospects
ALTER TABLE prospects ADD COLUMN deposit_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE prospects ADD COLUMN deposit_paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE prospects ADD COLUMN final_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE prospects ADD COLUMN final_paid_at TIMESTAMP WITH TIME ZONE;

-- 4. Create scheduled_messages table for auto follow-ups
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id SERIAL PRIMARY KEY,
  prospect_id INTEGER NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  message_type VARCHAR(32) NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(16) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduled_messages_pending ON scheduled_messages(status, scheduled_at)
  WHERE status = 'pending';

-- 5. Migrate old pricing data: set deposit = 50% of old price, final = 50%
-- Users can adjust in settings after migration
UPDATE settings SET
  price_deposit_eur = GREATEST(price_eur / 2, 9900),
  price_deposit_usd = GREATEST(price_usd / 2, 9900),
  price_deposit_mad = GREATEST(price_mad / 2, 9900),
  price_final_eur = GREATEST(price_eur / 2, 15000),
  price_final_usd = GREATEST(price_usd / 2, 15000),
  price_final_mad = GREATEST(price_mad / 2, 15000);
```

- [ ] **Step 2: Run migration against database**

```bash
node -e "const { Pool } = require('pg'); require('dotenv').config(); const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); const fs = require('fs'); const sql = fs.readFileSync('drizzle/0004_whatsapp_workflow_upgrade.sql', 'utf8'); pool.query(sql).then(() => { console.log('Migration applied'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });"
```

- [ ] **Step 3: Update schema.ts with new fields**

In `src/db/schema.ts`, add to the `settings` table definition:

```typescript
// Deposit pricing (stored in cents)
priceDepositEUR: integer("price_deposit_eur").default(9900),
priceDepositUSD: integer("price_deposit_usd").default(9900),
priceDepositMAD: integer("price_deposit_mad").default(9900),

// Final pricing (stored in cents)
priceFinalEUR: integer("price_final_eur").default(15000),
priceFinalUSD: integer("price_final_usd").default(15000),
priceFinalMAD: integer("price_final_mad").default(15000),

// Deposit payment links
paymentLinkDepositEUR: text("payment_link_deposit_eur"),
paymentLinkDepositUSD: text("payment_link_deposit_usd"),
paymentLinkDepositMAD: text("payment_link_deposit_mad"),

// Final payment links
paymentLinkFinalEUR: text("payment_link_final_eur"),
paymentLinkFinalUSD: text("payment_link_final_usd"),
paymentLinkFinalMAD: text("payment_link_final_mad"),
```

Add to the `prospects` table definition:

```typescript
depositPaid: boolean("deposit_paid").default(false),
depositPaidAt: timestamp("deposit_paid_at", { withTimezone: true }),
finalPaid: boolean("final_paid").default(false),
finalPaidAt: timestamp("final_paid_at", { withTimezone: true }),
```

Add the new `scheduledMessages` table definition:

```typescript
export const scheduledMessages = pgTable("scheduled_messages", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  messageType: varchar("message_type", { length: 32 }).notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  status: varchar("status", { length: 16 }).default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

- [ ] **Step 4: Verify schema compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add drizzle/0004_whatsapp_workflow_upgrade.sql src/db/schema.ts
git commit -m "feat: add deposit/final pricing, scheduled messages, extend workflow schema"
```

---

## Task 2: Update Settings Library

**Files:**
- Modify: `src/lib/settings.ts`

**Interfaces:**
- Consumes: new schema fields from Task 1
- Produces: `AppSettings` type with deposit/final pricing fields, available to SettingsClient and ProspectClient

- [ ] **Step 1: Add new fields to AppSettings type**

In `src/lib/settings.ts`, add to the `AppSettings` type:

```typescript
// Deposit pricing (cents)
priceDepositEUR: number | null;
priceDepositUSD: number | null;
priceDepositMAD: number | null;

// Final pricing (cents)
priceFinalEUR: number | null;
priceFinalUSD: number | null;
priceFinalMAD: number | null;

// Deposit payment links
paymentLinkDepositEUR: string | null;
paymentLinkDepositUSD: string | null;
paymentLinkDepositMAD: string | null;

// Final payment links
paymentLinkFinalEUR: string | null;
paymentLinkFinalUSD: string | null;
paymentLinkFinalMAD: string | null;
```

- [ ] **Step 2: Add default values**

In the `DEFAULT_SETTINGS` object, add:

```typescript
priceDepositEUR: 9900,
priceDepositUSD: 9900,
priceDepositMAD: 9900,
priceFinalEUR: 15000,
priceFinalUSD: 15000,
priceFinalMAD: 15000,
paymentLinkDepositEUR: null,
paymentLinkDepositUSD: null,
paymentLinkDepositMAD: null,
paymentLinkFinalEUR: null,
paymentLinkFinalUSD: null,
paymentLinkFinalMAD: null,
```

- [ ] **Step 3: Update getSettings to read new fields**

Ensure the DB query in `getSettings()` selects the new columns.

- [ ] **Step 4: Update saveSettingsToDb to save new fields**

Add the new fields to the update query in `saveSettingsToDb()`.

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/settings.ts
git commit -m "feat: add deposit/final pricing to settings library"
```

---

## Task 3: Update Settings API Route

**Files:**
- Modify: `src/app/api/settings/route.ts`

**Interfaces:**
- Consumes: new AppSettings fields from Task 2
- Produces: API accepts deposit/final pricing fields in PUT

- [ ] **Step 1: Add new fields to allowlist**

In `src/app/api/settings/route.ts`, add to the allowed fields array:

```typescript
"priceDepositEUR", "priceDepositUSD", "priceDepositMAD",
"priceFinalEUR", "priceFinalUSD", "priceFinalMAD",
"paymentLinkDepositEUR", "paymentLinkDepositUSD", "paymentLinkDepositMAD",
"paymentLinkFinalEUR", "paymentLinkFinalUSD", "paymentLinkFinalMAD",
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/settings/route.ts
git commit -m "feat: add deposit/final pricing to settings API"
```

---

## Task 4: Redesign Settings Pricing Tab

**Files:**
- Modify: `src/app/settings/SettingsClient.tsx`

**Interfaces:**
- Consumes: settings object with deposit/final pricing
- Produces: UI with 3 currency blocks, each showing deposit + final pricing + payment links

- [ ] **Step 1: Update state initialization**

Add the new fields to the settings state in SettingsClient.

- [ ] **Step 2: Redesign Pricing tab UI**

Replace the current pricing section with:

```
┌─────────────────────────────────────────────┐
│ 💰 Tarifs & Paiement                        │
├─────────────────────────────────────────────┤
│                                             │
│ 🇪🇺 EUR                                     │
│ ┌───────────────┬───────────────┐           │
│ │ Acompte       │ Solde final   │           │
│ │ [__99.00__] € │ [__150.00__]€│           │
│ └───────────────┴───────────────┘           │
│ Lien paiement acompte: [________________]   │
│ Lien paiement solde:   [________________]   │
│                                             │
│ 🇺🇸 USD                                     │
│ ┌───────────────┬───────────────┐           │
│ │ Deposit       │ Final payment │           │
│ │ [__99.00__] $ │ [__150.00__]$│           │
│ └───────────────┴───────────────┘           │
│ Deposit payment link: [________________]    │
│ Final payment link:   [________________]    │
│                                             │
│ 🇲🇦 MAD                                     │
│ ┌───────────────┬───────────────┐           │
│ │ Acompte       │ Solde final   │           │
│ │ [__99.00__] dh│ [__150.00__]dh│           │
│ └───────────────┴───────────────┘           │
│ Lien paiement acompte: [________________]   │
│ Lien paiement solde:   [________________]   │
│                                             │
└─────────────────────────────────────────────┘
```

- [ ] **Step 3: Update save handler**

Ensure the save function sends the new deposit/final fields to the API.

- [ ] **Step 4: Verify compilation and visual check**

Run: `npx tsc --noEmit && npm run dev`
Open http://localhost:3000/settings → Pricing tab → Verify layout

- [ ] **Step 5: Commit**

```bash
git add src/app/settings/SettingsClient.tsx
git commit -m "feat: redesign settings pricing tab with deposit + final"
```

---

## Task 5: Rewrite Message Templates

**Files:**
- Modify: `src/lib/prompt-generator.ts`

**Interfaces:**
- Consumes: settings pricing (deposit/final), prospect business data
- Produces: `DEFAULT_TEMPLATES` with 11 bilingual message types

- [ ] **Step 1: Update MessageTemplateKey type**

```typescript
export type MessageTemplateKey =
  | "intro"
  | "demo"
  | "quote"
  | "payment_received"
  | "delivery"
  | "thanks"
  | "followup"
  | "followup_2"
  | "followup_3"
  | "review_request"
  | "testimonial_request";
```

- [ ] **Step 2: Rewrite intro template (FR/EN/AR)**

```typescript
intro: {
  fr: `Bonjour {{firstName}} 👋

Je suis passé par *{{businessName}}* sur Google et j'ai vu que vous avez une excellente réputation avec *{{rating}} ⭐ et {{reviewCount}} avis*.

J'ai créé un concept de site web rapide spécialement pour votre commerce.

Voulez-vous que je vous envoie l'aperçu ?

Aucune pression — je pensais simplement que ça pourrait être utile pour votre activité.

*{{contact_name}}* — {{agency_name}}`,

  en: `Hi {{firstName}} 👋

I came across *{{businessName}}* on Google and noticed you have a great reputation with *{{rating}} ⭐ and {{reviewCount}} reviews*.

I put together a quick website concept specifically for your business.

Would you like me to send you the preview?

No pressure at all — I just thought it might be useful for your business.

*{{contact_name}}* — {{agency_name}}`,

  ar: `مرحبا {{firstName}} 👋

لاحظت أن *{{businessName}}* لديها سمعة ممتازة على Google مع *{{rating}} ⭐ و{{reviewCount}} تقييم*.

لقد أعددت مفهوم موقع ويب سريع خصيصاً لعملك.

هل تريد أن أرسل لك المعاينة؟

لا ضغط — فقط أردت أن أكون مفيداً لنشاطك.

*{{contact_name}}* — {{agency_name}}`,
},
```

- [ ] **Step 3: Rewrite demo template**

```typescript
demo: {
  fr: `Bonjour {{firstName}} 👋

Voici l'aperçu du site que j'ai créé pour *{{businessName}}* :
👉 *{{demo_url}}*

Ce qui est inclus :
• Site complet responsive (mobile + desktop)
• Design professionnel sur-mesure
• Optimisé pour Google (SEO local)
• Bouton WhatsApp + formulaire de contact

Voulez-vous que je vous envoie un devis ?

*{{contact_name}}* — {{agency_name}}`,

  en: `Hi {{firstName}} 👋

Here's the preview I created for *{{businessName}}*:
👉 *{{demo_url}}*

What's included:
• Full responsive website (mobile + desktop)
• Professional custom design
• Google-optimized (local SEO)
• WhatsApp button + contact form

Would you like me to send you a quote?

*{{contact_name}}* — {{agency_name}}`,

  ar: `مرحبا {{firstName}} 👋

إليك المعاينة التي أعددتها لـ *{{businessName}}*:
👉 *{{demo_url}}*

ما هو مشمول:
• موقع ويب كامل متجاوب (جوال + سطح مكتب)
• تصميم احترافي مخصص
• مُحسّن لـ Google (تحسين محلي)
• زر WhatsApp + نموذج اتصال

هل تريد أن أرسل لك عرض أسعار؟

*{{contact_name}}* — {{agency_name}}`,
},
```

- [ ] **Step 4: Rewrite quote template with deposit/final split**

```typescript
quote: {
  fr: `Bonjour {{firstName}} 👋

Voici ma proposition pour *{{businessName}}* :

💰 *Prix total : {{price}}*
• Acompte : *{{price_deposit}}* (pour démarrer)
• Solde : *{{price_final}}* (à la livraison)

📦 *Inclus :*
• Site web professionnel responsive
• Design sur-mesure
• SEO local optimisé
• Hébergement 1 an
• Livraison sous 48-72h

💳 *Payer l'acompte :* {{payment_deposit_url}}

Offre valable 7 jours. Des questions ?

*{{contact_name}}* — {{agency_name}}`,

  en: `Hi {{firstName}} 👋

Here's my proposal for *{{businessName}}*:

💰 *Total price: {{price}}*
• Deposit: *{{price_deposit}}* (to get started)
• Balance: *{{price_final}}* (on delivery)

📦 *Included:*
• Professional responsive website
• Custom design
• Local SEO optimization
• 1 year hosting
• Delivery in 48-72h

💳 *Pay the deposit:* {{payment_deposit_url}}

Offer valid for 7 days. Any questions?

*{{contact_name}}* — {{agency_name}}`,

  ar: `مرحبا {{firstName}} 👋

إليك عرضي لـ *{{businessName}}*:

💰 *السعر الإجمالي: {{price}}*
• الدفعة الأولى: *{{price_deposit}}* (للبدء)
• الرصيد: *{{price_final}}* (عند التسليم)

📦 *مشمول:*
• موقع ويب احترافي متجاوب
• تصميم مخصص
• تحسين محلي لمحركات البحث
• استضافة لمدة سنة
• التسليم خلال 48-72 ساعة

💳 *ادفع الدفعة الأولى:* {{payment_deposit_url}}

العرض صالح لمدة 7 أيام. أي سؤال؟

*{{contact_name}}* — {{agency_name}}`,
},
```

- [ ] **Step 5: Rewrite payment_received template**

```typescript
payment_received: {
  fr: `Bonjour {{firstName}} 👋

Bien reçu votre acompte, merci pour votre confiance ! 🎉

Le développement du site pour *{{businessName}}* commence maintenant.

*Prochaines étapes :*
1. Je vous envoie une première version pour validation
2. Vous me faites vos retours
3. Je finalise et je mets en ligne

Si vous avez des photos, un logo ou des horaires à me transmettre, envoyez-les-moi ici.

*{{contact_name}}* — {{agency_name}}`,

  en: `Hi {{firstName}} 👋

Payment received, thank you for your trust! 🎉

Development of *{{businessName}}*'s website starts now.

*Next steps:*
1. I'll send you a first version for approval
2. You give me your feedback
3. I finalize and go live

If you have any photos, logo, or hours to share, send them here.

*{{contact_name}}* — {{agency_name}}`,

  ar: `مرحبا {{firstName}} 👋

تم استلام الدفعة الأولى، شكراً على ثقتك! 🎉

بدأت الآن عملية تطوير موقع *{{businessName}}*.

*الخطوات التالية:*
1. أرسل لك نسخة أولى للموافقة
2. تعطيني ملاحظاتك
3. أ finalize وأنشر الموقع

إذا كان لديك أي صور أو شعار أو أوقات عمل، أرسلها هنا.

*{{contact_name}}* — {{agency_name}}`,
},
```

- [ ] **Step 6: Rewrite delivery template**

```typescript
delivery: {
  fr: `🎉 *Votre site est en ligne !*

Bonjour {{firstName}}, le site de *{{businessName}}* est accessible ici :
👉 *{{final_site_url}}*

✅ Hébergement 1 an inclus
✅ SSL sécurisé
✅ Optimisé Google
✅ Compatible mobile

🛠️ *Modifications gratuites pendant 1 an :* texte, images, horaires — dites-moi tout.

Si vous êtes satisfait, un petit avis Google nous aiderait énormément 🙏

*{{contact_name}}* — {{agency_name}}`,

  en: `🎉 *Your site is live!*

Hi {{firstName}}, *{{businessName}}*'s website is live at:
👉 *{{final_site_url}}*

✅ 1 year hosting included
✅ Secure SSL
✅ Google-optimized
✅ Mobile-friendly

🛠️ *Free changes for 1 year:* text, images, hours — just ask.

If you're happy, a Google review would mean the world to us 🙏

*{{contact_name}}* — {{agency_name}}`,

  ar: `🎉 *موقعك الآن مباشر!*

مرحبا {{firstName}}، موقع *{{businessName}}* متاح هنا:
👉 *{{final_site_url}}*

✅ استضافة مشمولة لمدة سنة
✅ SSL آمن
✅ مُحسّن لـ Google
✅ متوافق مع الجوال

🛠️ *تعديلات مجانية لمدة سنة:* نصوص، صور، أوقات عمل — فقط اسأل.

إذا كنت راضياً، تقييم على Google سيكون مفيداً جداً 🙏

*{{contact_name}}* — {{agency_name}}`,
},
```

- [ ] **Step 7: Rewrite thanks template**

```typescript
thanks: {
  fr: `Merci beaucoup {{firstName}} 🙏

Votre confiance me touche. Voici ce que vous pouvez retenir :

📅 Je reste dispo pour toute maintenance ou modification.

🎁 *Offre parrainage :* Si vous recommandez un commerce et qu'il commande un site, **votre hébergement et domaine sont OFFERTS la 2ème année !**

Et si vous avez 30 secondes, un petit avis Google serait super 🙏

Belle continuation !

*{{contact_name}}* — {{agency_name}}`,

  en: `Thank you so much {{firstName}} 🙏

Your trust means a lot. Here's what to remember:

📅 I'm available for any maintenance or changes.

🎁 *Referral offer:* If you refer a business and they order a website, **your hosting and domain are FREE for the 2nd year!**

And if you have 30 seconds, a Google review would be amazing 🙏

All the best!

*{{contact_name}}* — {{agency_name}}`,

  ar: `شكراً جزيلاً {{firstName}} 🙏

ثقتك تلمسني. إليك ما يجب تذكره:

📅 أنا متاح لأي صيانة أو تعديل.

🎁 *عرض الإحالة:* إذا أوصيت بشركة وطلبوا موقعًا، **الاستضافة والنطاق ستكون مجانية للسنة الثانية!**

وإذا كان لديك 30 ثانية، تقييم على Google سيكون رائعًا 🙏

أتمنى لك كل خير!

*{{contact_name}}* — {{agency_name}}`,
},
```

- [ ] **Step 8: Rewrite followup template**

```typescript
followup: {
  fr: `Bonjour {{firstName}} 👋

Juste pour savoir si vous avez eu l'occasion de regarder l'aperçu du site pour *{{businessName}}* ?

Si ce n'est pas le bon moment, pas de souci. Sinon, dites-moi et on en discute.

*{{contact_name}}* — {{agency_name}}`,

  en: `Hi {{firstName}} 👋

Just checking — did you get a chance to look at the website preview for *{{businessName}}*?

If now's not the right time, no worries. Otherwise, let me know and we can chat.

*{{contact_name}}* — {{agency_name}}`,

  ar: `مرحبا {{firstName}} 👋

مجرد سؤال — هل حصلت على فرصة لمشاهدة معاينة الموقع لـ *{{businessName}}*؟

إذا لم يكن الوقت المناسب، لا مشكلة. وإلا، أخبرني وسنناقش الأمر.

*{{contact_name}}* — {{agency_name}}`,
},
```

- [ ] **Step 9: Add followup_2 template**

```typescript
followup_2: {
  fr: `Bonjour {{firstName}} 👋

Je reviens vers vous concernant le site web pour *{{businessName}}*.

J'ai une petite surprise pour vous : si vous validez cette semaine, je vous offre un *bonus supplémentaire* sur votre site.

Voulez-vous en discuter ? Il suffit de répondre "oui".

*{{contact_name}}* — {{agency_name}}`,

  en: `Hi {{firstName}} 👋

Following up on the website for *{{businessName}}*.

I have a little surprise for you: if you approve this week, I'll include a *free bonus* on your website.

Want to discuss? Just reply "yes".

*{{contact_name}}* — {{agency_name}}`,

  ar: `مرحبا {{firstName}} 👋

أعود بخصوص الموقع لـ *{{businessName}}*.

لدي مفاجأة صغيرة لك: إذا وافقت هذا الأسبوع، سأضف *مجاناً ميزة إضافية* لموقعك.

هل تريد مناقشة الأمر؟ فقط رد "نعم".

*{{contact_name}}* — {{agency_name}}`,
},
```

- [ ] **Step 10: Add followup_3 template**

```typescript
followup_3: {
  fr: `Bonjour {{firstName}} 👋

Dernier petit mot de ma part au sujet du site pour *{{businessName}}*.

Je ne voudrais pas que vous perdiez cette opportunité — vos concurrents investissent de plus en plus dans leur présence en ligne.

Si vous changez d'avis, je suis toujours disponible. Bonne continuation ! 🙏

*{{contact_name}}* — {{agency_name}}`,

  en: `Hi {{firstName}} 👋

Just a quick final note about the website for *{{businessName}}*.

I'd hate for you to miss this opportunity — your competitors are investing more and more in their online presence.

If you change your mind, I'm always here. All the best! 🙏

*{{contact_name}}* — {{agency_name}}`,

  ar: `مرحبا {{firstName}} 👋

ملاحظة أخيرة بخصوص الموقع لـ *{{businessName}}*.

لا أريد أن تفوتك هذه الفرصة — منافسوك يستثمرون أكثر فأكثر في حضورهم عبر الإنترنت.

إذا غيرت رأيك، أنا هنا دائماً. كل التمنيات! 🙏

*{{contact_name}}* — {{agency_name}}`,
},
```

- [ ] **Step 11: Add review_request template**

```typescript
review_request: {
  fr: `Bonjour {{firstName}} 👋

J'espère que vous êtes satisfait du site de *{{businessName}}* !

Un petit geste qui nous aiderait énormément : pourriez-vous nous laisser un avis Google ?

👉 Cliquez ici pour laisser un avis : {{google_review_url}}

Merci d'avance, ça compte beaucoup pour nous ! 🙏

*{{contact_name}}* — {{agency_name}}`,

  en: `Hi {{firstName}} 👋

I hope you're happy with *{{businessName}}*'s website!

A small gesture that would mean a lot: could you leave us a Google review?

👉 Click here to leave a review: {{google_review_url}}

Thanks in advance, it really means a lot! 🙏

*{{contact_name}}* — {{agency_name}}`,

  ar: `مرحبا {{firstName}} 👋

أرجو أن تكون راضياً عن موقع *{{businessName}}*!

 Gesture صغير سيكون مفيداً جداً: هل يمكنك أن تترك لنا تقييم على Google?

👉 انقر هنا لترك تقييم: {{google_review_url}}

شكراً مقدماً، هذا يعني لنا الكثير! 🙏

*{{contact_name}}* — {{agency_name}}`,
},
```

- [ ] **Step 12: Add testimonial_request template**

```typescript
testimonial_request: {
  fr: `Bonjour {{firstName}} 👋

Merci encore pour votre confiance pour le site de *{{businessName}}* !

Pourriez-vous me donner un témoignage de 2 lignes que je pourrais utiliser pour mes futurs clients ?

Exemple : "Très satisfait du site, livraison rapide et travail de qualité."

Merci beaucoup ! 🙏

*{{contact_name}}* — {{agency_name}}`,

  en: `Hi {{firstName}} 👋

Thank you again for trusting me with *{{businessName}}*'s website!

Could you give me a short 2-line testimonial I could use for future clients?

Example: "Very happy with the website, fast delivery and quality work."

Thanks so much! 🙏

*{{contact_name}}* — {{agency_name}}`,

  ar: `مرحبا {{firstName}} 👋

شكراً مرة أخرى على ثقتك في موقع *{{businessName}}*!

هل يمكنك أن تعطيني شهادة قصيرة من سطرين يمكنني استخدامها لعملائي المستقبليين?

مثال: "راضٍ جداً عن الموقع، تسليم سريع وجودة عمل."

شكراً جزيلاً! 🙏

*{{contact_name}}* — {{agency_name}}`,
},
```

- [ ] **Step 13: Update generateDefaultWhatsAppMessages**

```typescript
export function generateDefaultWhatsAppMessages(b: any) {
  return {
    intro: { fr: DEFAULT_TEMPLATES.intro.fr, en: DEFAULT_TEMPLATES.intro.en, ar: DEFAULT_TEMPLATES.intro.ar },
    demo: { fr: DEFAULT_TEMPLATES.demo.fr, en: DEFAULT_TEMPLATES.demo.en, ar: DEFAULT_TEMPLATES.demo.ar },
    quote: { fr: DEFAULT_TEMPLATES.quote.fr, en: DEFAULT_TEMPLATES.quote.en, ar: DEFAULT_TEMPLATES.quote.ar },
    payment_received: { fr: DEFAULT_TEMPLATES.payment_received.fr, en: DEFAULT_TEMPLATES.payment_received.en, ar: DEFAULT_TEMPLATES.payment_received.ar },
    delivery: { fr: DEFAULT_TEMPLATES.delivery.fr, en: DEFAULT_TEMPLATES.delivery.en, ar: DEFAULT_TEMPLATES.delivery.ar },
    thanks: { fr: DEFAULT_TEMPLATES.thanks.fr, en: DEFAULT_TEMPLATES.thanks.en, ar: DEFAULT_TEMPLATES.thanks.ar },
    followup: { fr: DEFAULT_TEMPLATES.followup.fr, en: DEFAULT_TEMPLATES.followup.en, ar: DEFAULT_TEMPLATES.followup.ar },
    followup_2: { fr: DEFAULT_TEMPLATES.followup_2.fr, en: DEFAULT_TEMPLATES.followup_2.en, ar: DEFAULT_TEMPLATES.followup_2.ar },
    followup_3: { fr: DEFAULT_TEMPLATES.followup_3.fr, en: DEFAULT_TEMPLATES.followup_3.en, ar: DEFAULT_TEMPLATES.followup_3.ar },
    review_request: { fr: DEFAULT_TEMPLATES.review_request.fr, en: DEFAULT_TEMPLATES.review_request.en, ar: DEFAULT_TEMPLATES.review_request.ar },
    testimonial_request: { fr: DEFAULT_TEMPLATES.testimonial_request.fr, en: DEFAULT_TEMPLATES.testimonial_request.en, ar: DEFAULT_TEMPLATES.testimonial_request.ar },
  };
}
```

- [ ] **Step 14: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 15: Commit**

```bash
git add src/lib/prompt-generator.ts
git commit -m "feat: rewrite all 7 WhatsApp templates, add 4 new types (followup_2, followup_3, review_request, testimonial_request)"
```

---

## Task 6: Update ProspectClient for New Workflow

**Files:**
- Modify: `src/app/prospects/[id]/ProspectClient.tsx`

**Interfaces:**
- Consumes: new message types from Task 5, new settings fields from Task 2
- Produces: updated UI with new message stages, deposit/final pricing in template vars

- [ ] **Step 1: Update Prospect type**

Add to the Prospect type:

```typescript
depositPaid: boolean | null;
depositPaidAt: Date | string | null;
finalPaid: boolean | null;
finalPaidAt: Date | string | null;
```

- [ ] **Step 2: Update STAGES constant**

```typescript
const STAGES = [
  { id: "discovered", label: "Découvert", icon: "🔍" },
  { id: "contacted", label: "Contacté", icon: "💬" },
  { id: "demo_sent", label: "Démo envoyée", icon: "🎨" },
  { id: "quoted", label: "Devis envoyé", icon: "💰" },
  { id: "negotiating", label: "En discussion", icon: "🤝" },
  { id: "deposit_paid", label: "Acompte reçu", icon: "💳" },
  { id: "in_development", label: "En développement", icon: "🔨" },
  { id: "awaiting_review", label: "En attente validation", icon: "👀" },
  { id: "revision", label: "En révision", icon: "✏️" },
  { id: "delivered", label: "Livré", icon: "🚀" },
  { id: "completed", label: "Terminé", icon: "🎉" },
  { id: "lost", label: "Perdu", icon: "❌" },
];
```

- [ ] **Step 3: Update advanceWorkflow mapping**

```typescript
const advanceWorkflow = (messageStage: string) => {
  const stageMap: Record<string, string> = {
    intro: "contacted",
    demo: "demo_sent",
    quote: "quoted",
    payment_received: "deposit_paid",
    delivery: "delivered",
    thanks: "completed",
    followup: "contacted",
    followup_2: "contacted",
    followup_3: "contacted",
    review_request: "completed",
    testimonial_request: "completed",
  };
  const nextStage = stageMap[messageStage];
  if (nextStage) {
    advanceStage(nextStage);
  }
};
```

- [ ] **Step 4: Add deposit/final pricing to getTemplateVars**

```typescript
const getTemplateVars = () => {
  // ... existing vars ...
  const depositPrice = campaignCurrency === "USD"
    ? (settings.priceDepositUSD ?? 9900)
    : campaignCurrency === "MAD"
    ? (settings.priceDepositMAD ?? 9900)
    : (settings.priceDepositEUR ?? 9900);
  const finalPrice = campaignCurrency === "USD"
    ? (settings.priceFinalUSD ?? 15000)
    : campaignCurrency === "MAD"
    ? (settings.priceFinalMAD ?? 15000)
    : (settings.priceFinalEUR ?? 15000);
  const totalPrice = depositPrice + finalPrice;

  const paymentDepositUrl = campaignCurrency === "USD"
    ? settings.paymentLinkDepositUSD
    : campaignCurrency === "MAD"
    ? settings.paymentLinkDepositMAD
    : settings.paymentLinkDepositEUR;
  const paymentFinalUrl = campaignCurrency === "USD"
    ? settings.paymentLinkFinalUSD
    : campaignCurrency === "MAD"
    ? settings.paymentLinkFinalMAD
    : settings.paymentLinkFinalEUR;

  return {
    // ... existing vars ...
    price: formatPrice(totalPrice, campaignCurrency),
    price_deposit: formatPrice(depositPrice, campaignCurrency),
    price_final: formatPrice(finalPrice, campaignCurrency),
    payment_deposit_url: paymentDepositUrl || "",
    payment_final_url: paymentFinalUrl || "",
    google_review_url: business.googleMapsUrl || "",
  };
};
```

- [ ] **Step 5: Add new message stages to WhatsAppTab**

Add `followup_2`, `followup_3`, `review_request`, `testimonial_request` to the stages rendered in the WhatsApp tab.

- [ ] **Step 6: Add scheduleFollowups function**

After sending the intro message, schedule automatic follow-ups:

```typescript
const scheduleFollowups = async () => {
  try {
    await fetch(`/api/prospects/${prospect.id}/schedule-followups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId: prospect.campaignId,
      }),
    });
  } catch (e) {
    console.error("Failed to schedule follow-ups", e);
  }
};
```

Call this after `openWhatsApp("intro", ...)` succeeds.

- [ ] **Step 7: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add src/app/prospects/[id]/ProspectClient.tsx
git commit -m "feat: update ProspectClient with new workflow stages, deposit/final pricing, auto follow-ups"
```

---

## Task 7: Update Pay Route for Deposit/Final

**Files:**
- Modify: `src/app/api/prospects/[id]/pay/route.ts`

**Interfaces:**
- Consumes: prospect with depositPaid/finalPaid fields
- Produces: handles deposit vs final payment separately

- [ ] **Step 1: Rewrite pay route**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import { prospects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { localStore } from "@/lib/local-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prospectId = parseInt(id, 10);
  if (Number.isNaN(prospectId)) {
    return NextResponse.json({ error: "Invalid prospect ID" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const paymentType = body.type || "deposit"; // "deposit" or "final"

  const now = new Date();
  const updateData: any = {};

  if (paymentType === "deposit") {
    updateData.depositPaid = true;
    updateData.depositPaidAt = now;
    updateData.paymentStatus = "deposit_paid";
    updateData.workflowStage = "deposit_paid";
  } else {
    updateData.finalPaid = true;
    updateData.finalPaidAt = now;
    updateData.paymentStatus = "paid";
    updateData.workflowStage = "paid";
    updateData.deliveryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  let updated;
  try {
    [updated] = await db
      .update(prospects)
      .set(updateData)
      .where(eq(prospects.id, prospectId))
      .returning();
  } catch {
    updated = null;
  }

  if (!updated) {
    const data = localStore.get();
    const p = data.prospects.find((p: any) => p.id === prospectId);
    if (p) {
      Object.assign(p, updateData);
      localStore.save(data);
      updated = p;
    }
  }

  if (!updated) {
    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }

  return NextResponse.json({ prospect: updated, ok: true });
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/prospects/[id]/pay/route.ts
git commit -m "feat: update pay route for deposit/final payment split"
```

---

## Task 8: Create Schedule Follow-ups API

**Files:**
- Create: `src/app/api/prospects/[id]/schedule-followups/route.ts`

**Interfaces:**
- Consumes: prospect ID, campaign ID
- Produces: 3 scheduled follow-up messages in `scheduledMessages` table

- [ ] **Step 1: Create the route**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import { scheduledMessages, prospects } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prospectId = parseInt(id, 10);
  if (Number.isNaN(prospectId)) {
    return NextResponse.json({ error: "Invalid prospect ID" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { campaignId } = body;

  const now = new Date();

  // Schedule 3 follow-ups: J+3, J+7, J+14
  const followUps = [
    { messageType: "followup",   delayDays: 3  },
    { messageType: "followup_2", delayDays: 7  },
    { messageType: "followup_3", delayDays: 14 },
  ];

  try {
    // Cancel any existing pending follow-ups for this prospect
    await db
      .update(scheduledMessages)
      .set({ status: "cancelled" })
      .where(
        eq(scheduledMessages.prospectId, prospectId) &&
        eq(scheduledMessages.status, "pending")
      );

    // Insert new scheduled follow-ups
    for (const fu of followUps) {
      const scheduledAt = new Date(now.getTime() + fu.delayDays * 24 * 60 * 60 * 1000);
      await db.insert(scheduledMessages).values({
        prospectId,
        campaignId: campaignId || null,
        messageType: fu.messageType,
        scheduledAt,
        status: "pending",
      });
    }

    return NextResponse.json({ ok: true, scheduled: followUps.length });
  } catch (e: any) {
    console.error("[schedule-followups] Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/prospects/[id]/schedule-followups/route.ts
git commit -m "feat: add schedule follow-ups API endpoint"
```

---

## Task 9: Create Auto-Messenger Cron

**Files:**
- Create: `src/lib/auto-messenger.ts`
- Modify: `package.json` (add node-cron)
- Modify: `next.config.ts` (add serverExternalPackage)

**Interfaces:**
- Consumes: `scheduledMessages` table, `prospects` + `businesses` tables, WhatsApp send API
- Produces: sends pending messages when their scheduled time arrives

- [ ] **Step 1: Install node-cron**

```bash
npm install node-cron
npm install -D @types/node-cron
```

- [ ] **Step 2: Add to next.config.ts serverExternalPackages**

```typescript
const nextConfig = {
  serverExternalPackages: ["node-cron"],
  // ... existing config
};
```

- [ ] **Step 3: Create auto-messenger.ts**

```typescript
import cron from "node-cron";
import { db } from "@/db";
import { scheduledMessages, prospects, businesses, messageLogs, campaigns } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { isExternalServerConfigured, callServer } from "./whatsapp-client";
import { getSessionStatusAsync, sendMessage } from "./whatsapp-session";
import { normalizePhone } from "./phone-normalizer";
import { DEFAULT_TEMPLATES, formatPrice } from "./prompt-generator";
import { getSettings } from "./settings";
import type { MessageTemplateKey } from "./prompt-generator";

let cronTask: cron.ScheduledTask | null = null;

/**
 * Start the auto-messenger cron job.
 * Runs every 5 minutes to check for pending scheduled messages.
 */
export function startAutoMessenger() {
  if (cronTask) return; // Already running

  cronTask = cron.schedule("*/5 * * * *", async () => {
    try {
      await processScheduledMessages();
    } catch (e: any) {
      console.error("[AutoMessenger] Error:", e.message);
    }
  });

  console.log("[AutoMessenger] Started — checks every 5 minutes");
}

export function stopAutoMessenger() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    console.log("[AutoMessenger] Stopped");
  }
}

async function processScheduledMessages() {
  const now = new Date();

  // Find all pending messages whose scheduled time has passed
  const pending = await db
    .select()
    .from(scheduledMessages)
    .where(
      and(
        eq(scheduledMessages.status, "pending"),
        lte(scheduledMessages.scheduledAt, now)
      )
    );

  if (pending.length === 0) return;

  console.log(`[AutoMessenger] Processing ${pending.length} pending message(s)`);

  for (const msg of pending) {
    try {
      await sendScheduledMessage(msg);
      await db
        .update(scheduledMessages)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(scheduledMessages.id, msg.id));
    } catch (e: any) {
      console.error(`[AutoMessenger] Failed to send message ${msg.id}:`, e.message);
      await db
        .update(scheduledMessages)
        .set({ status: "failed" })
        .where(eq(scheduledMessages.id, msg.id));
    }
  }
}

async function sendScheduledMessage(msg: any) {
  // Get prospect + business + campaign
  const [row] = await db
    .select({ prospect: prospects, business: businesses, campaign: campaigns })
    .from(prospects)
    .innerJoin(businesses, eq(prospects.businessId, businesses.id))
    .leftJoin(campaigns, eq(prospects.campaignId, campaigns.id))
    .where(eq(prospects.id, msg.prospectId))
    .limit(1);

  if (!row) throw new Error(`Prospect ${msg.prospectId} not found`);

  const { prospect, business, campaign } = row;
  const settings = await getSettings();
  const campaignLanguage = (campaign as any)?.language || "fr";
  const campaignCurrency = (campaign as any)?.currency || "EUR";

  // Get the message template
  const templateKey = msg.messageType as MessageTemplateKey;
  const templates = (prospect as any).whatsappMessages || settings.messageTemplates;
  const template = templates?.[templateKey];

  if (!template) throw new Error(`No template for ${templateKey}`);

  // Resolve template text by language
  let rawText: string;
  if (typeof template === "string") {
    rawText = template;
  } else if (typeof template === "object" && template !== null) {
    rawText = template[campaignLanguage] || template.fr || "";
  } else {
    throw new Error(`Invalid template format for ${templateKey}`);
  }

  // Replace variables
  const vars = buildTemplateVars(prospect, business, settings, campaignLanguage, campaignCurrency);
  const text = processTemplate(rawText, vars);

  // Normalize phone
  const phoneRaw = business.phone?.replace(/[^0-9]/g, "") || "";
  const phone = normalizePhone(phoneRaw, business.country) || phoneRaw;

  if (!phone || phone.length < 8) {
    throw new Error(`Invalid phone number for prospect ${msg.prospectId}`);
  }

  // Send via WhatsApp
  if (isExternalServerConfigured()) {
    await callServer("/send", {
      method: "POST",
      body: JSON.stringify({ phone, message: text }),
    });
  } else {
    const status = await getSessionStatusAsync();
    if (status.status !== "connected") {
      throw new Error("WhatsApp session not connected");
    }
    await sendMessage(phone, text);
  }

  // Log the message
  await db.insert(messageLogs).values({
    prospectId: msg.prospectId,
    campaignId: msg.campaignId,
    messageStage: msg.messageType,
    status: "sent",
    phone,
    language: campaignLanguage,
    messageBody: text,
  });
}

function buildTemplateVars(prospect: any, business: any, settings: any, lang: string, currency: string) {
  const phone = business.phone || "";
  const phoneClean = phone.replace(/[^0-9]/g, "");

  const firstName = business.name?.split(" ")[0] || "there";
  const rating = business.rating || "";
  const reviewsCount = business.reviewsCount || "";

  const depositPrice = currency === "USD"
    ? (settings.priceDepositUSD ?? 9900)
    : currency === "MAD"
    ? (settings.priceDepositMAD ?? 9900)
    : (settings.priceDepositEUR ?? 9900);
  const finalPrice = currency === "USD"
    ? (settings.priceFinalUSD ?? 15000)
    : currency === "MAD"
    ? (settings.priceFinalMAD ?? 15000)
    : (settings.priceFinalEUR ?? 15000);
  const totalPrice = depositPrice + finalPrice;

  const paymentDepositUrl = currency === "USD"
    ? settings.paymentLinkDepositUSD
    : currency === "MAD"
    ? settings.paymentLinkDepositMAD
    : settings.paymentLinkDepositEUR;

  return {
    firstName,
    businessName: business.name || "",
    city: business.city || "",
    sector: business.subcategory || business.category || "",
    rating: rating ? String(rating) : "",
    reviewCount: reviewsCount ? String(reviewsCount) : "50",
    contact_name: settings.contactName || "",
    agency_name: settings.agencyName || "",
    contact_email: settings.contactEmail || "",
    agency_website: settings.websiteUrl || "",
    portfolio_url: settings.portfolioUrl || "",
    demo_url: prospect.externalDemoUrl || "",
    final_site_url: prospect.externalSiteUrl || "",
    price: formatPrice(totalPrice, currency),
    price_deposit: formatPrice(depositPrice, currency),
    price_final: formatPrice(finalPrice, currency),
    payment_url: paymentDepositUrl || "",
    payment_deposit_url: paymentDepositUrl || "",
    payment_final_url: (currency === "USD" ? settings.paymentLinkFinalUSD : currency === "MAD" ? settings.paymentLinkFinalMAD : settings.paymentLinkFinalEUR) || "",
    google_review_url: business.googleMapsUrl || "",
    cuisine: business.cuisine || "",
  };
}

function processTemplate(template: string, vars: Record<string, any>): string {
  let result = template;
  // Handle {{#if var}}...{{/if}} blocks
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
    return vars[key] ? content : "";
  });
  // Handle simple {{var}} replacements
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return vars[key] !== undefined ? String(vars[key]) : "";
  });
  return result;
}
```

- [ ] **Step 4: Import auto-messenger in the app**

In `src/app/layout.tsx` or a dedicated startup file, add:

```typescript
import { startAutoMessenger } from "@/lib/auto-messenger";

// Start the auto-messenger cron on server startup
if (typeof window === "undefined") {
  startAutoMessenger();
}
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/auto-messenger.ts package.json package-lock.json next.config.ts src/app/layout.tsx
git commit -m "feat: add auto-messenger cron with node-cron for scheduled follow-ups"
```

---

## Task 10: Cancel Follow-ups on Reply

**Files:**
- Modify: `src/app/api/prospects/[id]/log-message/route.ts` (or create a new endpoint)

**Interfaces:**
- Consumes: prospect ID when a message is sent (reply detected)
- Produces: cancels pending scheduled follow-ups

- [ ] **Step 1: Add cancel logic to log-message route**

When a message is logged (indicating the prospect replied or the user sent a message), cancel pending scheduled follow-ups:

```typescript
// After logging the message, cancel pending follow-ups
try {
  await db
    .update(scheduledMessages)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(scheduledMessages.prospectId, prospectId),
        eq(scheduledMessages.status, "pending")
      )
    );
} catch {}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/prospects/[id]/log-message/route.ts
git commit -m "feat: cancel scheduled follow-ups when message is sent"
```

---

## Task 11: End-to-End Verification

**Files:** None (verification only)

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Start dev server and test settings page**

Run: `npm run dev`
Open http://localhost:3000/settings → Pricing tab
Verify: 3 currency blocks, each with deposit + final price + payment links

- [ ] **Step 4: Test prospect detail page**

Open a prospect → WhatsApp tab
Verify: All 11 message types displayed, send buttons work

- [ ] **Step 5: Test schedule follow-ups**

Send an intro message → Check `scheduled_messages` table has 3 pending entries

- [ ] **Step 6: Test auto-messenger**

Wait 5 minutes (or manually trigger) → Verify pending messages are sent

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete WhatsApp Sales Workflow overhaul with auto follow-ups"
```
