#!/usr/bin/env bash
# ProspectRadar — démarrage de la passerelle WhatsApp Baileys (un seul lancement)
cd "$(dirname "$0")"
if [ ! -d "node_modules" ]; then
  echo "Installation des dépendances…"
  npm install
fi
echo "Passerelle WhatsApp Baileys sur http://localhost:3001"
echo "Laissez ce terminal ouvert pendant vos audits."
npm start
