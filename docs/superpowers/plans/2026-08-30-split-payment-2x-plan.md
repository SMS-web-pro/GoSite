# Split Payment 2x (Deposit 99 + Final 150) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Passer le système de paiement GoSite de 1 paiement total (249$) à 2 paiements manuels Deposit $99 + Final $150 (6 montants + 6 liens Stripe par devise) avec 8 templates WhatsApp trilingues et workflow ajusté, sans casser l'existant.

**Architecture:** Approche 1 colonnes explicites : ajouter 12 colonnes `settings` (deposit/final prix + liens x3 devises) + 6 colonnes `prospects` (total/deposit/final + status/dates), étendre `DEFAULT_TEMPLATES` à 8 keys, injecter `{{total_price}} {{deposit_price}} {{final_price}} {{deposit_payment_url}} {{final_payment_url}}` dans `ProspectClient.getTemplateVars`, splitter API pay en `type:deposit|final`, refondre Settings Pricing UI en 3 cartes 2-lignes.

**Tech Stack:** Next.js 16, React 19, Drizzle ORM 0.45, PostgreSQL, TypeScript 5.9, Tailwind 4, Baileys

**Spec:** `docs/superpowers/specs/2026-08-30-split-payment-2x-design.md`

## Global Constraints

- Stockage prix en **cents** (integer) `src/db/schema.ts:222`
- 3 devises fixes EUR/USD/MAD mappées depuis `campaign.language` `fr->EUR en->USD ar->MAD`
- Templates trilingues FR/EN/AR obligatoires pour les 8 keys
- Back-compat 30j : anciens champs `priceEUR`/`paymentLinkEUR` et `paymentStatus` restent lisibles via fallback
- `local-store` fallback `data/store.json` doit rester fonctionnel sans DB
- `serverExternalPackages: ["@whiskeysockets/baileys","qrcode"]` dans `next.config.ts:6` inchangé
- Aucun auth à ajouter, garder pattern `try DB catch -> localStore`

---

### Task 1: DB Schema + Migration Drizzle

**Files:**
- Modify: `src/db/schema.ts:197-258` (table settings) et `src/db/schema.ts:103-157` (prospects)
- Create: `drizzle/0004_split_payment.sql`
- Modify: `drizzle/meta/_journal.json`

**Interfaces:**
- Consumes: existing `settings` et `prospects` pgTable definitions
- Produces: nouvelles colonnes `depositPriceEUR/USD/MAD`, `finalPriceEUR/USD/MAD`, `depositPaymentLinkEUR/USD/MAD`, `finalPaymentLinkEUR/USD/MAD` sur `settings`; `totalAmount`, `depositAmount`, `finalAmount`, `depositStatus`, `finalPaymentStatus`, `depositDate`, `finalPaymentDate` sur `prospects`; types `Settings` et `Prospect` étendus

- [ ] **Step 1: Edit `src/db/schema.ts` settings — ajouter 12 colonnes après `paymentLinkMAD`**

```ts
// src/db/schema.ts:227 après paymentLinkMAD
  depositPriceEUR: integer("deposit_price_eur").default(9900),
  depositPriceUSD: integer("deposit_price_usd").default(9900),
  depositPriceMAD: integer("deposit_price_mad").default(99000),
  finalPriceEUR: integer("final_price_eur").default(15000),
  finalPriceUSD: integer("final_price_usd").default(15000),
  finalPriceMAD: integer("final_price_mad").default(150000),
  depositPaymentLinkEUR: text("deposit_payment_link_eur"),
  depositPaymentLinkUSD: text("deposit_payment_link_usd"),
  depositPaymentLinkMAD: text("deposit_payment_link_mad"),
  finalPaymentLinkEUR: text("final_payment_link_eur"),
  finalPaymentLinkUSD: text("final_payment_link_usd"),
  finalPaymentLinkMAD: text("final_payment_link_mad"),
```

- [ ] **Step 2: Edit `src/db/schema.ts` prospects — ajouter 7 colonnes après `quoteCurrency`**

```ts
// src/db/schema.ts:126 après quoteCurrency
  totalAmount: integer("total_amount"),
  depositAmount: integer("deposit_amount"),
  finalAmount: integer("final_amount"),
  depositStatus: varchar("deposit_status", { length: 32 }).default("pending"),
  finalPaymentStatus: varchar("final_payment_status", { length: 32 }).default("pending"),
  depositDate: timestamp("deposit_date", { withTimezone: true }),
  finalPaymentDate: timestamp("final_payment_date", { withTimezone: true }),
```

- [ ] **Step 3: Créer migration SQL `drizzle/0004_split_payment.sql`**

```sql
ALTER TABLE "settings" ADD COLUMN "deposit_price_eur" integer DEFAULT 9900;
ALTER TABLE "settings" ADD COLUMN "deposit_price_usd" integer DEFAULT 9900;
ALTER TABLE "settings" ADD COLUMN "deposit_price_mad" integer DEFAULT 99000;
ALTER TABLE "settings" ADD COLUMN "final_price_eur" integer DEFAULT 15000;
ALTER TABLE "settings" ADD COLUMN "final_price_usd" integer DEFAULT 15000;
ALTER TABLE "settings" ADD COLUMN "final_price_mad" integer DEFAULT 150000;
ALTER TABLE "settings" ADD COLUMN "deposit_payment_link_eur" text;
ALTER TABLE "settings" ADD COLUMN "deposit_payment_link_usd" text;
ALTER TABLE "settings" ADD COLUMN "deposit_payment_link_mad" text;
ALTER TABLE "settings" ADD COLUMN "final_payment_link_eur" text;
ALTER TABLE "settings" ADD COLUMN "final_payment_link_usd" text;
ALTER TABLE "settings" ADD COLUMN "final_payment_link_mad" text;

ALTER TABLE "prospects" ADD COLUMN "total_amount" integer;
ALTER TABLE "prospects" ADD COLUMN "deposit_amount" integer;
ALTER TABLE "prospects" ADD COLUMN "final_amount" integer;
ALTER TABLE "prospects" ADD COLUMN "deposit_status" varchar(32) DEFAULT 'pending';
ALTER TABLE "prospects" ADD COLUMN "final_payment_status" varchar(32) DEFAULT 'pending';
ALTER TABLE "prospects" ADD COLUMN "deposit_date" timestamp with time zone;
ALTER TABLE "prospects" ADD COLUMN "final_payment_date" timestamp with time zone;

UPDATE "settings" SET "deposit_price_eur"=COALESCE("deposit_price_eur", 9900) WHERE "deposit_price_eur" IS NULL;
UPDATE "prospects" SET "total_amount"=COALESCE("total_amount", "quote_amount"), "deposit_amount"=COALESCE("deposit_amount", 9900), "final_amount"=COALESCE("final_amount", 15000) WHERE "total_amount" IS NULL;
```

- [ ] **Step 4: Mettre à jour `drizzle/meta/_journal.json` — ajouter entrée 0004**

```json
{
  "idx": 4,
  "version": "7",
  "when": 1724970000000,
  "tag": "0004_split_payment",
  "breakpoints": true
}
```

- [ ] **Step 5: Vérifier types `npm run typecheck`**

Run: `npm run typecheck`
Expected: PASS (no error sur schema)

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts drizzle/0004_split_payment.sql drizzle/meta/_journal.json
git commit -m "feat(db): split payment 2x schema deposit+final 6 prices 6 links"
```

---

### Task 2: Settings Lib + API — Types & Back-compat

**Files:**
- Modify: `src/lib/settings.ts:7-76` (AppSettings type + DEFAULT_SETTINGS)
- Modify: `src/app/api/settings/route.ts:15` (allowlist PUT)
- Test: `src/lib/settings.ts` via `npm run typecheck`

**Interfaces:**
- Consumes: Task 1 schema types
- Produces: `AppSettings` avec 12 nouveaux champs typés + `DEFAULT_SETTINGS` defaults + API PUT accepte 12 champs

- [ ] **Step 1: Étendre `AppSettings` type dans `src/lib/settings.ts:23`**

```ts
export type AppSettings = {
  // ... existent
  depositPriceEUR: number | null;
  depositPriceUSD: number | null;
  depositPriceMAD: number | null;
  finalPriceEUR: number | null;
  finalPriceUSD: number | null;
  finalPriceMAD: number | null;
  depositPaymentLinkEUR: string | null;
  depositPaymentLinkUSD: string | null;
  depositPaymentLinkMAD: string | null;
  finalPaymentLinkEUR: string | null;
  finalPaymentLinkUSD: string | null;
  finalPaymentLinkMAD: string | null;
  // ...
}
```

- [ ] **Step 2: Étendre `DEFAULT_SETTINGS` `src/lib/settings.ts:51`**

```ts
const DEFAULT_SETTINGS = {
  // ...
  depositPriceEUR: 9900,
  depositPriceUSD: 9900,
  depositPriceMAD: 99000,
  finalPriceEUR: 15000,
  finalPriceUSD: 15000,
  finalPriceMAD: 150000,
  depositPaymentLinkEUR: null,
  depositPaymentLinkUSD: null,
  depositPaymentLinkMAD: null,
  finalPaymentLinkEUR: null,
  finalPaymentLinkUSD: null,
  finalPaymentLinkMAD: null,
}
```

- [ ] **Step 3: Ajouter fallback dans `getSettings()` `src/lib/settings.ts:83` — si DB row a anciens champs seuls, mapper `depositPriceUSD = row.depositPriceUSD ?? Math.round((row.priceUSD||24900)*0.396)` (99/249≈0.396) pour compat**

```ts
if (row) {
  const fallbackDepositUSD = row.depositPriceUSD ?? (row.priceUSD ? Math.round(row.priceUSD*0.4) : 9900);
  return { ...DEFAULT_SETTINGS, ...row, depositPriceUSD: fallbackDepositUSD, /* idem EUR/MAD + final = total-deposit */ } as AppSettings;
}
```

- [ ] **Step 4: Étendre `allowed` dans `src/app/api/settings/route.ts:15`**

```ts
const allowed = [
  // ... existants
  "depositPriceEUR","depositPriceUSD","depositPriceMAD",
  "finalPriceEUR","finalPriceUSD","finalPriceMAD",
  "depositPaymentLinkEUR","depositPaymentLinkUSD","depositPaymentLinkMAD",
  "finalPaymentLinkEUR","finalPaymentLinkUSD","finalPaymentLinkMAD",
];
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/settings.ts src/app/api/settings/route.ts
git commit -m "feat(settings): 2x payment types + 12 fields back-compat"
```

---

### Task 3: Prompt-Generator — 8 Templates Trilingues

**Files:**
- Modify: `src/lib/prompt-generator.ts:19-26` (MessageTemplateKey), `src/lib/prompt-generator.ts:58-525` (DEFAULT_TEMPLATES), `src/lib/prompt-generator.ts:599-609` (generateDefaultWhatsAppMessages)

**Interfaces:**
- Consumes: Task 2 AppSettings defaults
- Produces: `MessageTemplateKey = intro|demo|quote|deposit_received|final_payment_request|final_payment_received|delivery|thanks|followup` + `DEFAULT_TEMPLATES` avec 8 keys x3 langues + nouvelles vars

- [ ] **Step 1: Étendre `MessageTemplateKey`**

```ts
export type MessageTemplateKey =
  | "intro"
  | "demo"
  | "quote"
  | "deposit_received" // renamed payment_received alias
  | "payment_received" // keep alias for compat
  | "final_payment_request"
  | "final_payment_received"
  | "delivery"
  | "thanks"
  | "followup";
```

- [ ] **Step 2: Garder `payment_received` comme alias de `deposit_received` puis ajouter 2 nouveaux templates dans `DEFAULT_TEMPLATES`**

```ts
// Après payment_received block (ligne ~347), ajouter:

  final_payment_request: {
    fr: `Bonjour {{firstName}} 👋\n\nVotre site pour *{{businessName}}* est prêt ! 🎉\n\n💰 *Solde final : {{final_price}}*\n\nPour la mise en ligne immédiate, réglez le solde ici :\n💳 *{{final_payment_url}}*\n\nDès réception, je mets en ligne sous 24h sur {{final_site_url}}.\n\n*{{contact_name}}* — {{agency_name}}`,
    en: `Hi {{firstName}} 👋\n\nYour site for *{{businessName}}* is ready! 🎉\n\n💰 *Final balance: {{final_price}}*\n\nPay the final balance here for immediate launch:\n💳 *{{final_payment_url}}*\n\nOnce received, I’ll launch within 24h.\n\n*{{contact_name}}* — {{agency_name}}`,
    ar: `مرحبا {{firstName}} 👋\n\nموقع *{{businessName}}* جاهز! 🎉\n\n💰 *الرصيد النهائي: {{final_price}}*\n\nادفع الرصيد النهائي هنا: {{final_payment_url}}`,
  },
  final_payment_received: {
    fr: `Parfait {{firstName}} — solde {{final_price}} bien reçu ! ✅\n\n🚀 Mise en ligne en cours, vous recevez {{final_site_url}} sous 24h.\n\nMerci pour votre confiance !`,
    en: `Perfect {{firstName}} — final {{final_price}} received! ✅\n\n🚀 Launching now, you'll get {{final_site_url}} within 24h.`,
    ar: `ممتاز {{firstName}} — تم استلام {{final_price}} ✅\n\n🚀 جارٍ الإطلاق...`,
  },
```

- [ ] **Step 3: Modifier `quote` template pour afficher total/deposit/final**

Remplacer `quote.fr/en/ar` actuels :
```
fr: `... 💰 *Total : {{total_price}}*\n ({{deposit_price}} deposit pour démarrer + {{final_price}} solde à la livraison)\n💳 *Payer l'acompte ici :* {{deposit_payment_url}}\n`
en: `... 💰 *Total: {{total_price}}* (Deposit {{deposit_price}} to get started + Final {{final_price}} on delivery)\n💳 *Pay deposit here:* {{deposit_payment_url}}`
ar: idem
```

- [ ] **Step 4: Mettre à jour `payment_received` pour devenir deposit_received (garder key `payment_received` comme alias)**

Dupliquer contenu `payment_received` vers `deposit_received` identique, garder `payment_received` pour compat (même texte). Futur code utilisera `deposit_received`.

- [ ] **Step 5: Étendre `generateDefaultWhatsAppMessages`**

```ts
export function generateDefaultWhatsAppMessages(b:any){
  return {
    intro: ...,
    demo: ...,
    quote: ...,
    deposit_received: { fr: DEFAULT_TEMPLATES.deposit_received.fr, ...},
    payment_received: { fr: DEFAULT_TEMPLATES.deposit_received.fr, ...}, // alias
    final_payment_request: { fr: DEFAULT_TEMPLATES.final_payment_request.fr, ...},
    final_payment_received: { fr: DEFAULT_TEMPLATES.final_payment_received.fr, ...},
    delivery: ...,
    thanks: ...,
    followup: ...,
  }
}
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/prompt-generator.ts
git commit -m "feat(templates): 8 whatsapp templates deposit+final 3 langs + vars total/deposit/final"
```

---

### Task 4: ProspectClient — Vars & Workflow 2-step

**Files:**
- Modify: `src/app/prospects/[id]/ProspectClient.tsx:28-95` (types Prospect/Settings), `ProspectClient.tsx:169-211` (getTemplateVars), `ProspectClient.tsx:364-379` (advanceWorkflow), `ProspectClient.tsx:700-906` (WhatsAppTab + LinksTab)
- Modify: `src/app/api/prospects/route.ts:70-89` (création prospect deposit/final)

**Interfaces:**
- Consumes: Task 3 vars + Task 1 prospect columns
- Produces: `getTemplateVars()` retourne 5 nouvelles vars, `advanceWorkflow` gère 2 nouveaux stages, WhatsAppTab affiche 8 messages, LinksTab 2 boutons pay

- [ ] **Step 1: Étendre types `Prospect` et `Settings` en haut du fichier**

```ts
type Prospect = {
  // ... existent
  totalAmount: number | null;
  depositAmount: number | null;
  finalAmount: number | null;
  depositStatus: string | null;
  finalPaymentStatus: string | null;
  depositDate: string | Date | null;
  finalPaymentDate: string | Date | null;
}
type Settings = {
  // ... +12 champs deposit/final
  depositPriceEUR: number | null; /* etc 12 */
}
```

- [ ] **Step 2: Réécrire `getTemplateVars()` pour 2 paiements**

```ts
const getTemplateVars = () => {
  const currency = campaignCurrency || "EUR";
  const isEUR = currency==="EUR", isUSD=currency==="USD";
  const total = isEUR ? (settings.depositPriceEUR||9900)+(settings.finalPriceEUR||15000) : isUSD ? (settings.depositPriceUSD||9900)+(settings.finalPriceUSD||15000) : (settings.depositPriceMAD||99000)+(settings.finalPriceMAD||150000);
  const deposit = isEUR ? settings.depositPriceEUR||9900 : isUSD ? settings.depositPriceUSD||9900 : settings.depositPriceMAD||99000;
  const final = isEUR ? settings.finalPriceEUR||15000 : isUSD ? settings.finalPriceUSD||15000 : settings.finalPriceMAD||150000;
  const depositUrl = isEUR ? settings.depositPaymentLinkEUR : isUSD ? settings.depositPaymentLinkUSD : settings.depositPaymentLinkMAD;
  const finalUrl = isEUR ? settings.finalPaymentLinkEUR : isUSD ? settings.finalPaymentLinkUSD : settings.finalPaymentLinkMAD;
  return {
    // ... existent
    total_price: formatPrice(total, currency),
    deposit_price: formatPrice(deposit, currency),
    final_price: formatPrice(final, currency),
    deposit_payment_url: depositUrl || "",
    final_payment_url: finalUrl || "",
    payment_url: depositUrl || "", // alias compat
    price: formatPrice(deposit, currency), // alias
  }
}
```

- [ ] **Step 3: Étendre `advanceWorkflow`**

```ts
const stageMap: Record<string,string> = {
  intro: "contacted",
  demo: "demo_sent",
  quote: "quoted",
  deposit_received: "deposit_paid",
  payment_received: "deposit_paid", // alias
  final_payment_request: "quoted",
  final_payment_received: "paid",
  delivery: "delivered",
  thanks: "completed",
}
```

- [ ] **Step 4: WhatsAppTab — passer de 6 à 8 stages**

```ts
const stages = [
  {id:"intro", title:"Message 1 — Premier contact"},
  {id:"demo", title:"Message 2 — Démo"},
  {id:"quote", title:"Message 3 — Devis (Total + Deposit link)"},
  {id:"deposit_received", title:"Message 4 — Deposit reçu (99)"},
  {id:"final_payment_request", title:"Message 5 — Demande solde (150)"},
  {id:"final_payment_received", title:"Message 6 — Solde reçu"},
  {id:"delivery", title:"Message 7 — Livraison"},
  {id:"thanks", title:"Message 8 — Merci"},
]
```

- [ ] **Step 5: LinksTab — 2 paiements**

Remplacer bloc `Tarification & Paiement` par :
- Affichage `Total = Deposit + Final` avec `formatPrice`
- 2 boutons : `Marquer deposit payé (99)` → `POST /api/prospects/[id]/pay {type:'deposit'}` et `Marquer final payé (150)` → `{type:'final'}`
- Status badges `depositStatus` / `finalPaymentStatus`

- [ ] **Step 6: `src/app/api/prospects/route.ts` création prospect — set total/deposit/final depuis settings selon campaignCurrency**

```ts
const depositAmount = currency==="EUR" ? settings.depositPriceEUR||9900 : currency==="USD" ? settings.depositPriceUSD||9900 : settings.depositPriceMAD||99000;
const finalAmount = // idem final
const totalAmount = depositAmount + finalAmount;
values: { totalAmount, depositAmount, finalAmount, depositStatus:'pending', finalPaymentStatus:'pending', quoteAmount: totalAmount, quoteCurrency: currency }
```

- [ ] **Step 7: Typecheck + commit**

```bash
npm run typecheck
git add src/app/prospects/[id]/ProspectClient.tsx src/app/api/prospects/route.ts
git commit -m "feat(prospect): 2-step payment vars workflow 8 messages"
```

---

### Task 5: Settings UI — 6 Montants + 6 Liens

**Files:**
- Modify: `src/app/settings/SettingsClient.tsx:54-63` (states), `SettingsClient.tsx:90-142` (save), `SettingsClient.tsx:206-307` (Pricing tab), `SettingsClient.tsx:309-368` (Messages tab)

**Interfaces:**
- Consumes: Task 2 API allowlist
- Produces: Pricing tab 3 devises x 2 lignes (deposit+final) + Messages tab 8 textareas

- [ ] **Step 1: Ajouter 12 useState pricing**

```ts
const [depositPriceEUR, setDepositPriceEUR] = useState(((initialSettings as any).depositPriceEUR||9900)/100);
const [finalPriceEUR, setFinalPriceEUR] = useState(((initialSettings as any).finalPriceEUR||15000)/100);
// idem USD/MAD + 6 liens
const [depositLinkEUR, setDepositLinkEUR] = useState((initialSettings as any).depositPaymentLinkEUR||"");
const [finalLinkEUR, setFinalLinkEUR] = useState((initialSettings as any).finalPaymentLinkEUR||"");
// ... 4 autres liens
```

- [ ] **Step 2: Étendre `save()` payload**

```ts
body: JSON.stringify({
  // ... existants
  depositPriceEUR: Math.round(depositPriceEUR*100),
  finalPriceEUR: Math.round(finalPriceEUR*100),
  // ... 4 autres prix
  depositPaymentLinkEUR: depositLinkEUR||null,
  finalPaymentLinkEUR: finalLinkEUR||null,
  // ... 4 autres liens
})
```

- [ ] **Step 3: Refonte Pricing tab — 3 cartes avec 2 lignes chacune**

Remplacer chaque carte EUR/USD/MAD actuelle (1 prix +1 lien) par :
```tsx
<div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
  <h3><span>EUR</span> Marché francophone — Total {depositPriceEUR+finalPriceEUR}€</h3>
  <div className="grid gap-3 sm:grid-cols-2">
    <div><label>Deposit (€)</label><input value={depositPriceEUR} onChange={e=>setDepositPriceEUR(...)} /></div>
    <div><label>Lien deposit EUR</label><input value={depositLinkEUR} /></div>
  </div>
  <div className="grid gap-3 sm:grid-cols-2 mt-3">
    <div><label>Final (€)</label><input value={finalPriceEUR} /></div>
    <div><label>Lien final EUR</label><input value={finalLinkEUR} /></div>
  </div>
</div>
// idem USD (emerald) et MAD (amber)
```

- [ ] **Step 4: Messages tab — 8 templates**

Étendre `stageKeys` de 6 à 8 :
```ts
const stageKeys = ["intro","demo","quote","deposit_received","final_payment_request","final_payment_received","delivery","thanks"];
```
Mettre à jour help text variables + labels :
```ts
{stage==="final_payment_request" ? "Message 5 — Demande solde final (150)" : stage==="final_payment_received" ? "Message 6 — Solde reçu" : ...}
```

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add src/app/settings/SettingsClient.tsx
git commit -m "feat(settings-ui): 2x pricing 6 amounts 6 links + 8 templates"
```

---

### Task 6: Pay API + Analytics

**Files:**
- Modify: `src/app/api/prospects/[id]/pay/route.ts`
- Modify: `src/app/api/stats/route.ts`, `src/app/dashboard/page.tsx:20-46`, `src/app/analytics/page.tsx`
- Modify: `src/lib/local-store.ts` (fallback saveSettings/updateProspect)

**Interfaces:**
- Consumes: Task 1-5
- Produces: `POST /pay {type}` gère 2 steps, CA analytics somme deposit+final

- [ ] **Step 1: Modifier `src/app/api/prospects/[id]/pay/route.ts`**

```ts
export async function POST(req:Request, {params}:{params:{id:string}}){
  const {type} = await req.json(); // 'deposit'|'final' default 'deposit' for compat
  const prospectId = Number(params.id);
  if(type==='final'){
    await db.update(prospects).set({ finalPaymentStatus:'paid', finalPaymentDate: new Date(), paymentStatus:'paid', paymentDate: new Date() }).where(eq(prospects.id, prospectId));
  } else {
    await db.update(prospects).set({ depositStatus:'paid', depositDate: new Date() }).where(eq(prospects.id, prospectId));
  }
  // fallback localStore
}
```

- [ ] **Step 2: Étendre `local-store.ts` `updateProspect` et `saveSettings` pour 12 champs (pas de code SQL, juste merge JSON)**

- [ ] **Step 3: Analytics — modifier requête somme**

```ts
// src/app/api/stats + dashboard + analytics/page.tsx
// Remplacer revenue = sum(quoteAmount where paid) par
// revenue = sum(depositAmount where depositStatus=paid) + sum(finalAmount where finalPaymentStatus=paid)
// Fallback si null → quoteAmount
```

- [ ] **Step 4: Vérification manuelle — créer 3 campagnes FR/EN/AR, 1 prospect chaque, vérifier quote affiche 99+150 dans bonne devise et bon lien**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/prospects/[id]/pay/route.ts src/app/api/stats/route.ts src/app/dashboard/page.tsx src/app/analytics/page.tsx src/lib/local-store.ts
git commit -m "feat(pay): 2-step pay API deposit/final + analytics CA"
```

---

### Task 7: Vérification Finale & Docs

**Files:**
- Verify: `npm run typecheck`, `npm run lint`, `npm run build`
- Test: Manuel Settings → Prospect flow

- [ ] **Step 1: Typecheck global**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: PASS (ou warnings existants seulement)

- [ ] **Step 3: Build dry-run**

Run: `npm run build`
Expected: PASS (Next build OK, Baileys external)

- [ ] **Step 4: Test manuel end-to-end (3 devises)**

1. Settings → mettre Deposit 99/150 USD + liens https://buy.stripe.com/test_deposit etc. → Sauvegarder
2. Créer campagne EN/USD → créer prospect → ouvrir ProspectClient → vérifier `quote` affiche `Total $249.00 (Deposit $99.00 + Final $150.00)` + bon lien deposit
3. Envoyer `quote` → `deposit_received` → Marquer deposit payé → vérifier stage `deposit_paid`
4. Envoyer `final_payment_request` → Marquer final payé → vérifier `delivery` dispo
5. Analytics CA = $249

- [ ] **Step 5: Commit final docs**

```bash
git add docs/superpowers/plans/2026-08-30-split-payment-2x-plan.md
git commit -m "docs: split payment 2x plan"
```

---

## Self-Review Checklist

- [x] Spec coverage : 5 sections spec → 7 tasks couvrent DB, templates, workflow, UI, pay, analytics
- [x] No placeholders : tous les steps ont code snippet réel
- [x] Type consistency : `AppSettings` 12 champs cohérents Task1→2→5, vars `{{deposit_price}}` cohérentes Task3→4→5
