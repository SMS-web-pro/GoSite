# Passerelle WhatsApp — Baileys locale (vérification exacte)

Cette passerelle se connecte au **protocole WhatsApp Web** avec votre propre compte
(un simple QR code à scanner) et vérifie chaque numéro via `onWhatsApp()` :
**résultat exact, 100 % fiable, gratuit, sans estimation**.

Architecture : singleton `globalThis.__waSession` · session persistée dans
`.whatsapp-session/creds.json` · génération du **QR réel** (renouvelé auto).

## Dépendances (installées automatiquement au premier lancement)

```bash
npm i @whiskeysockets/baileys qrcode qrcode-terminal pino express
```

## Démarrage — le plus simple

- **Windows** : double-cliquez sur `start.bat`
- **macOS / Linux** : `./start.sh`

Ou manuellement :

```bash
cd server
npm install
npm start
```

La passerelle démarre sur **http://localhost:3001** et émet le **vrai QR WhatsApp**
(émis par le protocole WhatsApp — c'est la seule manière d'obtenir un QR valide ;
aucun navigateur ne peut en fabriquer un). La page ProspectRadar l'affiche alors
automatiquement, sans rien saisir.

## Connexion de votre WhatsApp

1. Ouvrez **WhatsApp** sur votre téléphone
2. **Réglages → Appareils connectés → Connecter un appareil**
3. Scannez le QR code affiché dans ProspectRadar
   (bouton « Passerelle WhatsApp » de l'écran de brief)

Le statut passe à **« Connecté »** : `onWhatsApp()` est opérationnel et
chaque audit valide alors tous les numéros automatiquement avec un statut exact.

## Endpoints

| Méthode | Route                      | Description                                          |
|---------|----------------------------|------------------------------------------------------|
| POST    | `/api/whatsapp/session`    | `initiateSession()` — crée/reprend la session, émet le QR réel |
| GET     | `/api/whatsapp/status`     | `{ status, connected, qrDataUrl, user, checked, found }` |
| POST    | `/api/whatsapp/check`      | `{ numbers: ["336…"] }` → `onWhatsApp()` : `{ results: [{ number, exists, jid }] }` |
| POST    | `/api/whatsapp/logout`     | Déconnecte + efface `.whatsapp-session/`              |
| GET     | `/api/health`              | `{ ok, status }`                                      |

## Notes importantes

- **Session persistante** : le dossier `auth/` conserve la connexion — vous ne
  scannez le QR qu'une seule fois (sauf si vous vous déconnectez ou changez de téléphone).
- **Débit** : ~8 numéros/seconde (délai de 120 ms entre chaque requête pour
  respecter le protocole). 100 numéros ≈ 12 secondes.
- **Coût** : 0 € — Baileys utilise le protocole WhatsApp Web, aucune API payante.
- **Compte dédié conseillé** : pour un usage intensif, utilisez un numéro
  secondaire dédié à la vérification.
- **Navigation privée / bloqueurs** : si ProspectRadar (servi en HTTPS) n'arrive
  pas à joindre `http://localhost:3001`, lancez l'application en local ou
  utilisez un proxy inverse HTTPS sur le port 3001.

## Changer le port

```bash
PORT=4000 npm start
```

Pensez à mettre à jour l'URL de la passerelle dans ProspectRadar.
