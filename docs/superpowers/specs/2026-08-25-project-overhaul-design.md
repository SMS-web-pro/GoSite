# GoSite — Correction & Amélioration Globale (Approche A)

## Contexte

GoSite est un outil de prospection pour une agence digitale. Le workflow réel est :
1. **Search** via l'app (ou ajout manuel de liste de prospects)
2. **Copier le prompt** Vibecoder depuis l'app
3. **Vibecoder externe** (Claude/Cursor/v0) pour générer la démo
4. **Coller les liens** (démo externe, site live, paiement) dans l'app
5. **Envoyer les messages** WhatsApp via l'app
6. **Livrer** le site final

Les pages `/demo/[token]`, `/checkout/[token]`, `/delivery/[token]` sont mortes — le workflow est 100% externe.

## Objectifs

1. Supprimer le code mort et les pages inutiles
2. Corriger la détection langue/devise pour qu'elle utilise **uniquement la langue de la campagne**
3. Rendre les liens démo/paiement/livraison 100% manuels (pas de fallback interne)
4. Ajouter l'enrichissement semi-automatique des données prospect
5. Unifier les types partagés
6. Nettoyer le code mort

---

## Changement 1 : Supprimer les pages mortes

### Fichiers à supprimer
- `src/app/demo/[token]/page.tsx`
- `src/app/checkout/[token]/page.tsx`
- `src/app/checkout/[token]/CheckoutClient.tsx`
- `src/app/delivery/[token]/page.tsx`
- `src/app/delivery/[token]/DeliveryClient.tsx`

### Fichiers à modifier
- `src/app/prospects/[id]/ProspectClient.tsx` : supprimer les refs à `demoUrl`, `checkoutUrl`, `deliveryUrl` internes. Supprimer l'onglet "Démo & Paiement" ( SiteTab). Les liens de démo/paiement/livraison sont gérés dans l'onglet "Liens externes" (LinksTab).
- `src/app/prospects/[id]/page.tsx` : ne plus passer `demoToken` au client
- `src/app/api/prospects/[id]/pay/route.ts` : garder (marquer comme payé manuellement)

### Résultat
- Plus de pages `/demo/`, `/checkout/`, `/delivery/`
- L'onglet "Liens externes" devient l'endroit unique pour gérer démo + site + paiement
- Le bouton "Marquer comme payé" reste dans l'onglet Vue d'ensemble

---

## Changement 2 : Langue = langue de la campagne

### Problème actuel
`detectProspectLanguage()` se base sur le pays du business → faux positifs (business américain géré par un Français).

### Solution
La langue des messages WhatsApp est **toujours** `campaign.language`. Pas de détection auto.

### Fichiers à modifier
- `src/lib/prompt-generator.ts` : garder `detectProspectLanguage()` comme fallback mais ne plus l'utiliser dans le flux principal
- `src/app/prospects/[id]/ProspectClient.tsx` : dans `prepareMessage()`, utiliser `campaignLanguage` en priorité absolue. Si pas de campagne, défaut "fr"
- `src/app/prospects/[id]/ProspectClient.tsx` : dans `getTemplateVars()`, la devise est aussi basée sur `campaignCurrency`

### Résultat
- Tous les prospects d'une campagne reçoivent les messages dans la même langue
- La devise est aussi celle de la campagne (EUR/USD/MAD)
- Pas de surprise de détection automatique

---

## Changement 3 : Liens externes 100% manuels

### Problème actuel
Les URLs internes (`/demo/xxx`, `/checkout/xxx`) sont utilisées comme fallback dans les messages.

### Solution
- `externalDemoUrl` = lien collé manuellement par l'utilisateur
- `externalSiteUrl` = lien collé manuellement par l'utilisateur
- `payment_url` = lien de paiement depuis les Settings (EUR/USD/MAD)
- Plus aucun fallback vers des URLs internes

### Fichiers à modifier
- `src/app/prospects/[id]/ProspectClient.tsx` :
  - `getTemplateVars()` : `demo_url` = `prospect.externalDemoUrl` UNIQUEMENT (pas de fallback `/demo/xxx`)
  - `payment_url` = lien depuis Settings selon la devise de la campagne
  - `final_site_url` = `prospect.externalSiteUrl` UNIQUEMENT
- `src/app/prospects/[id]/ProspectClient.tsx` : supprimer `SiteTab`, tout est dans `LinksTab`
- `src/app/prospects/[id]/ProspectClient.tsx` : `LinksTab` devient "Liens & Paiement" avec :
  - Champ lien démo externe
  - Champ lien site live
  - Affichage du prix selon la devise de la campagne
  - Affichage du statut de paiement
  - Bouton "Marquer comme payé"

### Résultat
- L'utilisateur a le contrôle total des liens
- Pas de confusion entre liens internes et externes
- Workflow simplifié : tout dans un seul onglet

---

## Changement 4 : Enrichissement semi-automatique

### Problème actuel
Le scraper ne récupère que les données OSM/Photon. Beaucoup d'infos manquent (email, téléphone exact, note Google).

### Solution
Après le scraping initial, un bouton "Enrichir" permet de lancer un enrichissement ciblé :
1. **Google Maps** : récupérer note, avis, téléphone, horaires (via scraping web basique)
2. **Enrichissement manuel** : l'utilisateur peut éditer TOUTES les champs du prospect

### Fichiers à modifier
- `src/app/prospects/[id]/ProspectClient.tsx` : ajouter un composant `EditBusinessButton` qui permet d'éditer tous les champs du business (nom, téléphone, email, site, note, adresse, etc.)
- `src/app/api/prospects/[id]/business/route.ts` : endpoint PUT pour mettre à jour les infos du business lié au prospect
- `src/app/search/SearchClient.tsx` : ajouter un bouton "Enrichir" sur chaque carte de business qui appelle une API d'enrichissement

### Nouvel endpoint API
- `POST /api/prospects/[id]/enrich` : lance l'enrichissement d'un prospect (Google Maps scraping)
- `PUT /api/prospects/[id]/business` : met à jour les infos du business

### Résultat
- Chaque prospect peut être enrichi manuellement
- L'enrichissement automatique complète les données manquantes
- Tous les champs sont éditables

---

## Changement 5 : Unifier les types partagés

### Problème actuel
`ScrapedBusiness` est défini 3 fois (scraper.ts, SearchClient.tsx, ProspectsList.tsx).

### Solution
Définir le type une seule fois dans `src/lib/types.ts` et l'importer partout.

### Fichiers à créer
- `src/lib/types.ts` : types partagés (`ScrapedBusiness`, `ProspectWithBusiness`, etc.)

### Fichiers à modifier
- `src/lib/scraper.ts` : exporter `ScrapedBusiness` depuis `types.ts`
- `src/app/search/SearchClient.tsx` : importer depuis `types.ts`
- `src/app/prospects/ProspectsList.tsx` : importer depuis `types.ts`
- `src/app/prospects/[id]/ProspectClient.tsx` : importer depuis `types.ts`

---

## Changement 6 : Nettoyage du code mort

### Code à supprimer
- `src/app/search/SearchClient.tsx` : fonction `getCampaignIdFromUrl()` (non utilisée)
- `src/app/prospects/ProspectsList.tsx` : composant `DeleteProspectButtonSmall()` (non utilisé)
- `src/app/page.tsx` : les refs à `demoToken`/`checkoutUrl`/`deliveryUrl` dans les prospects
- `src/app/prospects/[id]/ProspectClient.tsx` : `SiteTab` (remplacé par LinksTab élargi)

### Code à corriger
- `src/db/index.ts:19` : remplacer `any` par le type correct
- `src/app/settings/SettingsClient.tsx` : remplacer les `as any` par des types corrects

---

## Ordre d'implémentation

1. Créer `src/lib/types.ts` avec les types unifiés
2. Supprimer les 5 fichiers de pages mortes
3. Modifier `ProspectClient.tsx` : supprimer SiteTab, élargir LinksTab, corriger les templates vars
4. Modifier `prompt-generator.ts` : la langue = langue de la campagne
5. Ajouter l'API `PUT /api/prospects/[id]/business`
6. Ajouter le composant `EditBusinessButton` dans ProspectClient
7. Nettoyer le code mort dans SearchClient, ProspectsList
8. Corriger les types `any` dans db/index.ts et SettingsClient
9. Tests et vérification

---

## Risques

- **Rupture des messages existants** : les prospects avec des `whatsappMessages` existants pourraient ne plus fonctionner si on change le format → Mitigation : garder le fallback sur l'ancien format
- **Perte de liens internes** : les prospects avec des `demoToken` mais pas de `externalDemoUrl` n'auront plus de lien de démo → Mitigation : afficher un avertissement dans l'UI
