# Design Spec — Split Payment 2x (Deposit $99 + Final $150)

**Date:** 2026-08-30
**Auteur:** GoSite + Muse Spark
**Status:** Approved (5/5 sections validées)
**Approche:** Approche 1 — Colonnes explicites (6 montants + 6 liens manuels)

---

## 1. Contexte & Problème

### Actuel (single payment)
- `settings` : 1 prix total `priceEUR/USD/MAD` (cents) + 1 `paymentLinkEUR/USD/MAD` (`src/db/schema.ts:222`)
- `prospects` : `quoteAmount`, `quoteCurrency`, `paymentStatus: pending|paid`, `paymentAmount` (`src/db/schema.ts:136`)
- Templates : `quote` utilise `{{price}}` + `{{payment_url}}` (`src/lib/prompt-generator.ts:222`), puis `payment_received` → `delivery`
- Flux : `quote -> payment_received (24h) -> delivery`

### Cible
- Paiement en 2 fois : **Deposit $99 To get started** + **Final $150 Payment** = **$249 total**
- Répliqué sur 3 devises (EUR/USD/MAD) et 3 langues (FR/EN/AR) avec 6 montants + 6 liens manuels éditables dans Settings
- Messages WhatsApp matchés (4 messages payants)

---

## 2. Objectifs & Non-Objectifs

**Objectifs:**
- 6 montants manuels (depositEUR/finalEUR, depositUSD/finalUSD, depositMAD/finalMAD) + 6 liens Stripe manuels
- 8 templates WhatsApp (vs 6 actuels) trilingues
- Workflow prospect avec 2 étapes de paiement distinctes
- Migration back-compat (anciens prospects restent lisibles)
- Analytics CA = somme deposit + final

**Non-Objectifs:**
- Intégration Stripe automatique (liens manuels uniquement)
- Gestion remboursements/partial refund
- Modification du prompt Vibecoder

---

## 3. Architecture DB

### 3.1 Table `settings` (+12 colonnes)
```sql
ALTER TABLE settings ADD COLUMN deposit_price_eur integer DEFAULT 9900;
ALTER TABLE settings ADD COLUMN deposit_price_usd integer DEFAULT 9900;
ALTER TABLE settings ADD COLUMN deposit_price_mad integer DEFAULT 99000; -- 990 MAD = ~99$
ALTER TABLE settings ADD COLUMN final_price_eur integer DEFAULT 15000;
ALTER TABLE settings ADD COLUMN final_price_usd integer DEFAULT 15000;
ALTER TABLE settings ADD COLUMN final_price_mad integer DEFAULT 150000; -- 1500 MAD

ALTER TABLE settings ADD COLUMN deposit_payment_link_eur text;
ALTER TABLE settings ADD COLUMN deposit_payment_link_usd text;
ALTER TABLE settings ADD COLUMN deposit_payment_link_mad text;
ALTER TABLE settings ADD COLUMN final_payment_link_eur text;
ALTER TABLE settings ADD COLUMN final_payment_link_usd text;
ALTER TABLE settings ADD COLUMN final_payment_link_mad text;
-- Garder priceEUR/USD/MAD + paymentLink* pour compat 30j (deprecated)
```

### 3.2 Table `prospects` (+6 colonnes)
```sql
ALTER TABLE prospects ADD COLUMN total_amount integer;
ALTER TABLE prospects ADD COLUMN deposit_amount integer;
ALTER TABLE prospects ADD COLUMN final_amount integer;
ALTER TABLE prospects ADD COLUMN deposit_status varchar(32) DEFAULT 'pending'; -- pending|paid|failed
ALTER TABLE prospects ADD COLUMN final_payment_status varchar(32) DEFAULT 'pending';
ALTER TABLE prospects ADD COLUMN deposit_date timestamp with time zone;
ALTER TABLE prospects ADD COLUMN final_payment_date timestamp with time zone;
-- Garder paymentStatus/paymentAmount/paymentDate pour compat
```

### 3.3 Table `messageLogs`
- Aucune colonne ajoutée, `messageStage` accepte déjà `deposit_received`, `final_payment_request`, `final_payment_received` (varchar 32)

### 3.4 Migration `drizzle/0004_split_payment.sql`
- `UPDATE settings SET deposit_price_usd = 9900 WHERE deposit_price_usd IS NULL` etc.
- `UPDATE prospects SET total_amount = quote_amount, deposit_amount = 9900, final_amount = 15000 WHERE total_amount IS NULL`
- Journal `drizzle/meta/_journal.json` incrémenté

---

## 4. Templates WhatsApp

### 4.1 Nouvelles variables (`src/lib/prompt-generator.ts` + `ProspectClient.tsx:169 getTemplateVars`)
- `{{total_price}}` → `formatPrice(totalAmount, currency)`
- `{{deposit_price}}` → `formatPrice(depositAmount, currency)`
- `{{final_price}}` → `formatPrice(finalAmount, currency)`
- `{{deposit_payment_url}}` → `settings.depositPaymentLinkXXX` selon `campaignCurrency`
- `{{final_payment_url}}` → `settings.finalPaymentLinkXXX`
- Alias legacy : `{{price}}` → `{{deposit_price}}`, `{{payment_url}}` → `{{deposit_payment_url}}` (30j)

### 4.2 8 Templates x 3 langues (`DEFAULT_TEMPLATES`)
1. `intro` (inchangé)
2. `demo` (inchangé)
3. `quote` **modifié** : `Total {{total_price}} (Deposit {{deposit_price}} to get started + Final {{final_price}}). Deposit link: {{deposit_payment_url}}`
   - FR: `Total {{total_price}} ({{deposit_price}} d'acompte pour démarrer + {{final_price}} final à la livraison). Payer l'acompte : {{deposit_payment_url}}`
   - AR: `الإجمالي {{total_price}} ({{deposit_price}} عربون للبدء + {{final_price}} نهائي)`
4. `deposit_received` (renommé `payment_received` gardé en alias) : `Merci deposit {{deposit_price}} reçu, on lance le développement, solde {{final_price}} à la livraison`
5. **NEW** `final_payment_request` : `Votre site est prêt ! Solde final {{final_price}} à régler : {{final_payment_url}}`
6. **NEW** `final_payment_received` : `Solde reçu, voici votre site {{final_site_url}}`
7. `delivery` (modifié : n'est envoyé qu'après `finalPaymentStatus=paid`)
8. `thanks` (inchangé)
9. `followup` (inchangé)

Seed : `generateDefaultWhatsAppMessages()` crée les 2 nouveaux si `messageTemplates.final_payment_request == null`

---

## 5. Workflow Prospect & API

### 5.1 Stages (`ProspectClient.tsx:97 STAGES`)
Garder 7 stages visuels, mapping interne :
```ts
stageMap = {
  intro: 'contacted',
  demo: 'demo_sent',
  quote: 'quoted',
  deposit_received: 'deposit_paid', // NEW stage ou reuse 'paid' intermédiaire
  final_payment_request: 'quoted',
  final_payment_received: 'paid',
  delivery: 'delivered',
  thanks: 'completed'
}
// Alternative : ajouter stage `deposit_paid` entre quoted et paid
```

### 5.2 `ProspectClient.tsx` changements
- `getTemplateVars()` : switch currency → 6 prix/liens
- `advanceWorkflow()` : `deposit_received => deposit_paid`, `final_payment_received => paid`
- `WhatsAppTab` : 8 cartes au lieu de 6
- `LinksTab` : affiche `Total = Deposit + Final`, 2 boutons `Marquer deposit payé` / `Marquer final payé`

### 5.3 API `POST /api/prospects/[id]/pay`
- Body `{type: 'deposit' | 'final'}` (default `deposit` pour compat)
- `type=deposit` → `depositStatus='paid', depositDate=now()`
- `type=final` → `finalPaymentStatus='paid', finalPaymentDate=now(), workflowStage='paid'`
- `PATCH /api/prospects/[id]` accepte `depositAmount/finalAmount/totalAmount` override

### 5.4 CA Analytics (`src/app/analytics/page.tsx`, `dashboard/page.tsx`)
- `CA = sum(depositAmount where depositStatus=paid) + sum(finalAmount where finalPaymentStatus=paid)`
- Fallback si nouveaux champs null → `paymentAmount/quoteAmount`

---

## 6. UI Settings (`src/app/settings/SettingsClient.tsx:206`)

### 6.1 Onglet Pricing refondu
```
[EUR] Marché francophone
  Deposit  [99 €]  Lien deposit  [https://buy.stripe.com/deposit_eur]
  Final    [150 €] Lien final    [https://buy.stripe.com/final_eur]
  Total auto 249€ (read-only)
[USD] 99$ / 150$ / 249$
[MAD] 990 MAD / 1500 MAD / 2490 MAD
```
- 12 useState (`depositPriceEUR` etc.)
- `save()` → `PUT /api/settings` avec 12 champs

### 6.2 Onglet Messages
- 8 textareas (vs 6), ajout `final_payment_request`, `final_payment_received`
- Help text variables mis à jour

---

## 7. Fichiers Touchés

1. `src/db/schema.ts` — +12 settings +6 prospects colonnes
2. `src/lib/settings.ts` — types `AppSettings` étendus
3. `src/lib/prompt-generator.ts` — `DEFAULT_TEMPLATES` + `generateDefaultWhatsAppMessages` + `formatPrice` legacy
4. `src/app/prospects/[id]/ProspectClient.tsx` — vars, workflow, tabs
5. `src/app/settings/SettingsClient.tsx` — pricing UI + messages UI
6. `src/app/api/settings/route.ts` — allowlist 12 nouveaux champs
7. `src/app/api/prospects/[id]/pay/route.ts` — type deposit/final
8. `src/app/api/prospects/route.ts` — création prospect avec deposit/final
9. `drizzle/0004_split_payment.sql` + `drizzle/meta/_journal.json`

---

## 8. Risques & Mitigations

- **Migration casse existants** → back-compat fallback `priceEUR` si `depositPriceEUR null` → `deposit = total*0.4`
- **Templates manquants** → seed automatique si null
- **local-store** (`data/store.json`) → `localStore.saveSettings` doit gérer 12 nouveaux champs (pas de migration SQL en local)
- **Stripe links invalides** → validation URL côté Settings (regex `https://buy.stripe.com/` warning si vide)

---

## 9. Tests & Vérification

- `npm run typecheck` + `eslint`
- Créer campagne FR/EUR, EN/USD, AR/MAD → vérifier `quote` rend `99+150=249` dans la bonne devise/langue
- Flow prospect : quote (deposit link) → deposit_received (stage deposit_paid) → final_payment_request (final link) → final_payment_received (paid) → delivery
- Analytics : CA = deposit + final
- Settings : sauvegarde 6 montants + 6 liens, rechargement OK

---

## 10. Rollout

1. Migration DB exécutée (`drizzle-kit push`)
2. Deploy Vercel + redémarrage whatsapp-server (pas d'impact)
3. Garder anciens champs 30j puis cleanup deprecated
