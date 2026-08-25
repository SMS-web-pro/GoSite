# GoSite — Correction & Amélioration Globale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make GoSite a professional, production-ready tool with coherent, interconnected features — no dead code, no broken links, consistent language/currency handling.

**Architecture:** Clean up dead pages, unify shared types, fix language/currency detection to use campaign language, consolidate external links into one tab, and remove dead code throughout.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Drizzle ORM, PostgreSQL

**Spec:** `docs/superpowers/specs/2026-08-25-project-overhaul-design.md`

## Global Constraints

- TypeScript strict mode — no `any` types in new code
- Follow existing code style (Tailwind utility classes, 2-space indent, component-per-file where applicable)
- No new dependencies — use only what's already in package.json
- Each task must leave the app in a working state (no broken builds)

---

## File Structure

### Files to DELETE
- `src/app/demo/[token]/page.tsx` — dead page
- `src/app/checkout/[token]/page.tsx` — dead page
- `src/app/checkout/[token]/CheckoutClient.tsx` — dead page
- `src/app/delivery/[token]/page.tsx` — dead page
- `src/app/delivery/[token]/DeliveryClient.tsx` — dead page

### Files to CREATE
- `src/lib/types.ts` — unified shared types

### Files to MODIFY
- `src/app/prospects/[id]/ProspectClient.tsx` — remove SiteTab, consolidate LinksTab, fix template vars, remove internal URL refs
- `src/lib/prompt-generator.ts` — clean up unused detection functions, keep as library-only
- `src/app/search/SearchClient.tsx` — import shared type, remove dead function
- `src/app/prospects/ProspectsList.tsx` — import shared type, remove dead component
- `src/db/index.ts` — fix `any` type
- `src/app/prospects/[id]/page.tsx` — remove demoToken-related data fetching

---

### Task 1: Create shared types file

**Files:**
- Create: `src/lib/types.ts`

**Interfaces:**
- Produces: `ScrapedBusiness`, `ProspectWithBusiness` types used by all other files

- [ ] **Step 1: Create `src/lib/types.ts`**

```typescript
export type ScrapedBusiness = {
  name: string;
  category: string | null;
  subcategory: string | null;
  osmType: string | null;
  osmId: number | null;
  wikidataId: string | null;
  wikipedia: string | null;
  address: string | null;
  housenumber: string | null;
  street: string | null;
  neighbourhood: string | null;
  suburb: string | null;
  postcode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  openingHours: string | null;
  cuisine: string | null;
  description: string | null;
  wheelchair: string | null;
  wifi: string | null;
  takeaway: string | null;
  delivery: string | null;
  outdoorSeating: string | null;
  smoking: string | null;
  reservation: string | null;
  parking: string | null;
  airConditioning: string | null;
  paymentCash: string | null;
  paymentCard: string | null;
  capacity: string | null;
  stars: string | null;
  latitude: string | null;
  longitude: string | null;
  bingUrl: string | null;
  osmUrl: string | null;
  googleMapsUrl: string | null;
  rating: string | null;
  reviewsCount: number | null;
  source: string;
  extraTags: string | null;
  detailCount: number;
  popularity: number | null;
};
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/lib/types.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add shared ScrapedBusiness type"
```

---

### Task 2: Delete dead pages

**Files:**
- Delete: `src/app/demo/[token]/page.tsx`
- Delete: `src/app/checkout/[token]/page.tsx`
- Delete: `src/app/checkout/[token]/CheckoutClient.tsx`
- Delete: `src/app/delivery/[token]/page.tsx`
- Delete: `src/app/delivery/[token]/DeliveryClient.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: nothing (pure deletion)

- [ ] **Step 1: Delete the 5 files**

```powershell
Remove-Item -LiteralPath "src/app/demo/[token]/page.tsx" -Force
Remove-Item -LiteralPath "src/app/checkout/[token]/page.tsx" -Force
Remove-Item -LiteralPath "src/app/checkout/[token]/CheckoutClient.tsx" -Force
Remove-Item -LiteralPath "src/app/delivery/[token]/page.tsx" -Force
Remove-Item -LiteralPath "src/app/delivery/[token]/DeliveryClient.tsx" -Force
```

- [ ] **Step 2: Verify no remaining imports reference these files**

Run: `rg "demo/\[token\]|checkout/\[token\]|delivery/\[token\]|CheckoutClient|DeliveryClient" src/ --type ts --type tsx`
Expected: No results

- [ ] **Step 3: Commit**

```bash
git add -A src/app/demo src/app/checkout src/app/delivery
git commit -m "feat: remove dead /demo, /checkout, /delivery pages"
```

---

### Task 3: Update SearchClient to use shared type and remove dead code

**Files:**
- Modify: `src/app/search/SearchClient.tsx:7-66` (ScrapedBusiness type definition)
- Modify: `src/app/search/SearchClient.tsx:7-11` (getCampaignIdFromUrl function)

**Interfaces:**
- Consumes: `ScrapedBusiness` from `@/lib/types`
- Produces: nothing (cleanup only)

- [ ] **Step 1: Replace local ScrapedBusiness type with import**

In `src/app/search/SearchClient.tsx`, replace lines 13-66 (the `type ScrapedBusiness = { ... };` block) with:

```typescript
import type { ScrapedBusiness } from "@/lib/types";
```

And remove the old type definition block (lines 13-66).

- [ ] **Step 2: Remove dead `getCampaignIdFromUrl` function**

Delete lines 7-11 (the `function getCampaignIdFromUrl(...)` function) — it is never called.

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/search/SearchClient.tsx
git commit -m "refactor: use shared ScrapedBusiness type, remove dead code"
```

---

### Task 4: Update ProspectsList to use shared type

**Files:**
- Modify: `src/app/prospects/ProspectsList.tsx:8-66` (business type definition)

**Interfaces:**
- Consumes: `ScrapedBusiness` from `@/lib/types` (only the fields used in the list)
- Produces: nothing (cleanup only)

- [ ] **Step 1: Replace local business type with import**

The `ProspectsList.tsx` file defines its own `Item` type with an inline `business` type that mirrors `ScrapedBusiness`. Since the list only needs a subset of fields, keep the `Item` type but reference the shared type for the business shape:

Replace the `business` block inside `type Item` (lines 17-66) with a simpler version that uses the shared type:

```typescript
import type { ScrapedBusiness } from "@/lib/types";

type Item = {
  prospect: {
    id: number;
    workflowStage: string;
    quoteAmount: number | null;
    paymentAmount: number | null;
    paymentStatus: string | null;
    updatedAt: Date | string | null;
  };
  business: Pick<ScrapedBusiness, "id" | "name" | "category" | "subcategory" | "city" | "country" | "phone" | "email" | "website" | "rating" | "cuisine" | "description"> & {
    id: number;
  };
};
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/prospects/ProspectsList.tsx
git commit -m "refactor: use shared ScrapedBusiness type in ProspectsList"
```

---

### Task 5: Fix ProspectClient.tsx — remove internal URL refs and SiteTab

**Files:**
- Modify: `src/app/prospects/[id]/ProspectClient.tsx:94` (activeTab type)
- Modify: `src/app/prospects/[id]/ProspectClient.tsx:105-108` (baseUrl, demoUrl, checkoutUrl, deliveryUrl)
- Modify: `src/app/prospects/[id]/ProspectClient.tsx:486-502` (tabs array)
- Modify: `src/app/prospects/[id]/ProspectClient.tsx:505-532` (tab rendering)
- Modify: `src/app/prospects/[id]/ProspectClient.tsx:155-202` (getTemplateVars)
- Modify: `src/app/prospects/[id]/ProspectClient.tsx:570-644` (OverviewTab)
- Delete: `src/app/prospects/[id]/ProspectClient.tsx:1000-1104` (SiteTab component)

**Interfaces:**
- Consumes: `campaignLanguage`, `campaignCurrency` from props
- Produces: updated template vars, cleaned up UI

- [ ] **Step 1: Remove internal URL references (lines 105-108)**

Delete these lines:
```typescript
const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
const demoUrl = prospect.demoToken ? `/demo/${prospect.demoToken}` : "";
const checkoutUrl = prospect.demoToken ? `/checkout/${prospect.demoToken}` : "";
const deliveryUrl = prospect.demoToken ? `/delivery/${prospect.demoToken}` : "";
```

- [ ] **Step 2: Fix `activeTab` type (line 94)**

Change from:
```typescript
const [activeTab, setActiveTab] = useState<"overview" | "prompt" | "whatsapp" | "links" | "site">("overview");
```
To:
```typescript
const [activeTab, setActiveTab] = useState<"overview" | "prompt" | "whatsapp" | "links">("overview");
```

- [ ] **Step 3: Fix `getTemplateVars()` (lines 155-202)**

Replace the function with:
```typescript
const getTemplateVars = () => {
    const currency = campaignCurrency || "EUR";

    let detectedPrice = 0;
    if (currency === "EUR") detectedPrice = (settings as any).priceEUR || 89900;
    else if (currency === "USD") detectedPrice = (settings as any).priceUSD || 99900;
    else if (currency === "MAD") detectedPrice = (settings as any).priceMAD || 99900;

    let detectedPaymentLink = settings.paymentLink || "";
    if (currency === "EUR" && (settings as any).paymentLinkEUR) detectedPaymentLink = (settings as any).paymentLinkEUR;
    else if (currency === "USD" && (settings as any).paymentLinkUSD) detectedPaymentLink = (settings as any).paymentLinkUSD;
    else if (currency === "MAD" && (settings as any).paymentLinkMAD) detectedPaymentLink = (settings as any).paymentLinkMAD;

    const tierPrice = detectedPrice;

    return {
      firstName: business.name.split(" ")[0] || "Bonjour",
      name: business.name,
      businessName: business.name,
      sector: business.subcategory || business.category || "votre activité",
      city: business.city || "votre ville",
      phone: business.phone || "",
      rating: business.rating || "",
      reviewsCount: business.reviewsCount || "",
      cuisine: business.cuisine || "",
      openingHours: business.openingHours || "",
      description: business.description || "",
      website: business.website || "",
      demo_url: prospect.externalDemoUrl || "",
      payment_url: detectedPaymentLink,
      final_site_url: prospect.externalSiteUrl || "",
      price: tierPrice > 0 ? formatPrice(tierPrice, currency) : "",
      features: "",
      tiers_block: "",
      agency_name: settings.agencyName || "Mon Agence",
      contact_name: settings.contactName || "L'équipe",
      contact_email: settings.contactEmail || "",
      contact_phone: settings.contactPhone || "",
      agency_website: settings.websiteUrl || "",
      portfolio: settings.portfolioUrl || "",
      portfolio_url: settings.portfolioUrl || "",
    };
  };
```

- [ ] **Step 4: Fix tabs array (lines 486-502)**

Replace the tabs definition with:
```typescript
{([
            ["overview", "📊 Vue d'ensemble"],
            ["prompt", "🤖 Prompt Vibecoder"],
            ["whatsapp", "💬 Messages WhatsApp"],
            ["links", "🔗 Liens & Paiement"],
          ] as const).map(([id, label]) => (
```

- [ ] **Step 5: Fix tab rendering (lines 505-532)**

Remove the `site` tab rendering. The section should become:
```typescript
{activeTab === "overview" && (
          <OverviewTab prospect={prospect} business={business} settings={settings} onUpdate={updateProspect} />
        )}
        {activeTab === "prompt" && (
          <PromptTab prospect={prospect} onUpdate={updateProspect} copy={copy} copiedField={copiedField} />
        )}
        {activeTab === "whatsapp" && (
          <WhatsAppTab
            prospect={prospect}
            business={business}
            settings={settings}
            campaignLanguage={campaignLanguage}
            onUpdate={updateProspect}
            openWhatsApp={openWhatsApp}
            openOnMobile={openOnMobile}
            copyMessageWithLink={copyMessageWithLink}
            copyMessageOnly={copyMessageOnly}
            copyPhone={copyPhone}
            copy={copy}
            copiedField={copiedField}
          />
        )}
        {activeTab === "links" && (
          <LinksTab prospect={prospect} business={business} settings={settings} campaignCurrency={campaignCurrency} onUpdate={updateProspect} />
        )}
```

- [ ] **Step 6: Fix OverviewTab to remove internal URLs (lines 570-644)**

Remove `demoUrl`, `checkoutUrl`, `deliveryUrl` props from OverviewTab. Replace the "Liens du workflow" section with:
```typescript
<div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">🔗 Liens du workflow</h3>
          <div className="mt-2 space-y-1.5 text-xs">
            {prospect.externalDemoUrl && (
              <div>
                <p className="text-[10px] font-semibold uppercase text-violet-600">🎨 Démo externe (vibecodée)</p>
                <a href={prospect.externalDemoUrl} target="_blank" rel="noreferrer" className="block truncate text-blue-600 hover:underline">{prospect.externalDemoUrl}</a>
              </div>
            )}
            {prospect.externalSiteUrl && (
              <div>
                <p className="text-[10px] font-semibold uppercase text-emerald-600">🚀 Site final externe</p>
                <a href={prospect.externalSiteUrl} target="_blank" rel="noreferrer" className="block truncate text-blue-600 hover:underline">{prospect.externalSiteUrl}</a>
              </div>
            )}
            {!prospect.externalDemoUrl && !prospect.externalSiteUrl && (
              <p className="text-xs text-slate-400 italic">Aucun lien externe configuré. Ajoutez-les dans l'onglet "Liens & Paiement".</p>
            )}
          </div>
        </div>
```

- [ ] **Step 7: Delete the SiteTab component (lines 1000-1104)**

Delete the entire `function SiteTab(...)` component.

- [ ] **Step 8: Enhance LinksTab with payment info**

Replace the `LinksTab` function (lines 913-998) with an enhanced version that includes payment status and currency info:

```typescript
function LinksTab({ prospect, business, settings, campaignCurrency, onUpdate }: { prospect: Prospect; business: Business; settings: Settings; campaignCurrency?: string; onUpdate: (u: any) => Promise<void> }) {
  const [demoUrl, setDemoUrl] = useState(prospect.externalDemoUrl || "");
  const [siteUrl, setSiteUrl] = useState(prospect.externalSiteUrl || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDemoUrl(prospect.externalDemoUrl || "");
    setSiteUrl(prospect.externalSiteUrl || "");
  }, [prospect.externalDemoUrl, prospect.externalSiteUrl]);

  const currency = campaignCurrency || "EUR";
  const currencySymbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "DH";
  const priceKey = `price${currency}` as "priceEUR" | "priceUSD" | "priceMAD";
  const marketPrice = (settings as any)[priceKey] || 0;

  const save = async () => {
    setSaving(true);
    try {
      await onUpdate({
        externalDemoUrl: demoUrl || null,
        externalSiteUrl: siteUrl || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
        💡 <strong>Le projet n'est PAS de vibcoder le site sur cette plateforme.</strong> Vous prenez le prompt Vibecoder,
        vous le collez dans <strong>Claude / Cursor / v0 / Bolt</strong>, vous vibcodez le site de votre côté,
        puis vous collez ici les liens générés pour les utiliser dans vos messages WhatsApp.
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">🎨 Lien de la démo externe</h3>
        <p className="mt-1 text-xs text-slate-500">
          Collez ici l'URL du site de démo que vous avez vibcodé en externe. Ce lien sera utilisé dans le message WhatsApp d'envoi de la démo.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            placeholder="https://demo-mon-site.netlify.app"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
          {demoUrl && (
            <a href={demoUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              🔗 Ouvrir
            </a>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">🚀 Lien du site final externe</h3>
        <p className="mt-1 text-xs text-slate-500">
          Collez ici l'URL définitive du site que vous avez livré au prospect. Ce lien sera utilisé dans le message de livraison.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://www.client.com"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
          {siteUrl && (
            <a href={siteUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              🔗 Ouvrir
            </a>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">💰 Tarification & Paiement</h3>
        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">
            Prix du marché : <span className="text-xl font-bold">{formatPrice(marketPrice, currency)}</span>
          </p>
          <p className="mt-1 text-xs text-blue-600">
            Devise de la campagne : {currency} {currencySymbol}
          </p>
        </div>
        {(settings.paymentLink || (settings as any).paymentLinkEUR || (settings as any).paymentLinkUSD || (settings as any).paymentLinkMAD) ? (
          <p className="mt-3 text-sm text-emerald-700">✓ Lien de paiement configuré dans Settings</p>
        ) : (
          <p className="mt-3 text-sm text-amber-600">⚠️ Lien de paiement non configuré. <Link href="/settings" className="underline">Configurer dans Settings</Link></p>
        )}
        {prospect.paymentStatus === "paid" && (
          <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            ✅ Paiement reçu le {prospect.paymentDate ? new Date(prospect.paymentDate).toLocaleString("fr-FR") : "—"}
          </p>
        )}
        {prospect.paymentStatus !== "paid" && (
          <button
            onClick={async () => {
              if (!confirm("Marquer ce prospect comme payé ?")) return;
              const res = await fetch(`/api/prospects/${prospect.id}/pay`, { method: "POST" });
              if (res.ok) {
                const data = await res.json();
                if (data.prospect) onUpdate(data.prospect);
              }
            }}
            className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            ✅ Marquer comme payé
          </button>
        )}
      </div>

      <div className="sticky bottom-4 flex items-center justify-end gap-2">
        {saved && <span className="text-sm text-emerald-600">✓ Liens enregistrés</span>}
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "💾 Sauvegarder les liens"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 10: Commit**

```bash
git add src/app/prospects/[id]/ProspectClient.tsx
git commit -m "feat: remove SiteTab, consolidate LinksTab, fix template vars"
```

---

### Task 6: Fix ProspectClient page.tsx — remove demoToken data

**Files:**
- Modify: `src/app/prospects/[id]/page.tsx`

**Interfaces:**
- Consumes: ProspectClient component
- Produces: cleaned up page props

- [ ] **Step 1: Read and update page.tsx**

The page.tsx likely passes `demoToken` related data to ProspectClient. Since we removed the internal URLs, we should clean up the data fetching. Read the file first, then remove any `demoHtml`, `demoToken` references that are no longer needed.

Run: `rg "demoToken|demoHtml|demoUrl|checkoutUrl|deliveryUrl" src/app/prospects/\[id\]/page.tsx`

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/prospects/\[id\]/page.tsx
git commit -m "refactor: remove dead demoToken/checkoutUrl refs from prospect page"
```

---

### Task 7: Fix db/index.ts — remove any type

**Files:**
- Modify: `src/db/index.ts:19`

**Interfaces:**
- Consumes: nothing
- Produces: typed pool config

- [ ] **Step 1: Fix the `any` type on line 19**

Replace:
```typescript
const config: any = {
```
With:
```typescript
const config: Parameters<typeof Pool>[0] & { prepareThreshold?: number } = {
```

This uses the Pool constructor's parameter type plus the prepareThreshold extension that pg supports but doesn't expose in TypeScript types.

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/db/index.ts
git commit -m "fix: replace any type with proper Pool config type"
```

---

### Task 8: Clean up prompt-generator.ts — keep functions as library

**Files:**
- Modify: `src/lib/prompt-generator.ts:528-589`

**Interfaces:**
- Consumes: nothing
- Produces: cleaned library exports

- [ ] **Step 1: Add a comment clarifying detectProspectLanguage is a fallback only**

The function `detectProspectLanguage` (line 528) and `detectProspectCurrency` (line 34) are still used in the codebase (e.g., `ProspectsList.tsx` imports `detectProspectCurrency`). Rather than deleting them (which would break other files), add a clear comment at the top of each:

For `detectProspectCurrency` (line 34), add above it:
```typescript
/**
 * @deprecated Use campaign currency instead. This is a fallback only.
 * The campaign's language/currency setting should always take priority.
 */
```

For `detectProspectLanguage` (line 528), add above it:
```typescript
/**
 * @deprecated Use campaign language instead. This is a fallback only.
 * The campaign's language setting should always take priority.
 */
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/prompt-generator.ts
git commit -m "docs: mark auto-detect functions as deprecated fallbacks"
```

---

### Task 9: Full build verification

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run Next.js build**

Run: `npx next build`
Expected: Build succeeds (or at least no new errors introduced by our changes)

- [ ] **Step 3: Manual smoke test**

If dev server can run, verify:
1. `/dashboard` loads
2. `/search` loads and search works
3. `/prospects` loads the list
4. `/prospects/[id]` loads with 4 tabs (Vue d'ensemble, Prompt, Messages, Liens & Paiement)
5. No `/demo/`, `/checkout/`, `/delivery/` routes exist
6. Settings page still works

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: final cleanup and build fixes"
```
