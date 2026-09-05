@echo off
REM ProspectRadar - demarrage de la passerelle WhatsApp Baileys (un seul lancement)
cd /d "%~dp0"
if not exist "node_modules" (
  echo Installation des dependances...
  npm install
)
echo Passerelle WhatsApp Baileys sur http://localhost:3001
echo Laissez cette fenetre ouverte pendant vos audits.
npm start
pause
