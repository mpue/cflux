# CFlux Demo Version - Build Instructions

Diese Version von CFlux ist eine **standalone Demo-Version** mit integriertem Backend und SQLite-Datenbank.

## 🎯 Was ist anders?

### Original Version:
- Backend und Frontend getrennt
- PostgreSQL Datenbank (extern)
- Docker Compose Setup
- Für Production gedacht

### Demo Version:
- **Alles in einer .exe**
- Integriertes Node.js Backend
- SQLite Datenbank (lokal)
- Keine externe Datenbank nötig
- Perfekt für Demos und Tests

## 📋 Voraussetzungen

- Node.js 20+
- npm

## 🔧 Setup & Build

### 1. Dependencies installieren

```bash
# Im Root-Verzeichnis
cd cflux-electron-demo

# Frontend Dependencies
cd frontend
npm install
npm run build
cd ..

# Backend Dependencies
cd backend
npm install
cd ..

# Desktop Dependencies
cd desktop
npm install
cd ..
```

### 2. Demo-Version bauen

```bash
cd desktop

# Für Windows
npm run build:win

# Für Mac
npm run build:mac

# Für Linux
npm run build:linux
```

Das Build-Script macht automatisch:
1. ✅ Konvertiert Prisma Schema von PostgreSQL zu SQLite
2. ✅ Generiert Prisma Client für SQLite
3. ✅ Baut das Backend
4. ✅ Packt alles zusammen in eine Electron App

### 3. Demo starten (Development)

```bash
cd desktop
npm run dev
```

## 📁 Projekt-Struktur (Demo)

```
cflux-electron-demo/
├── backend/              # Node.js Backend (wird integriert)
│   ├── dist/            # Kompiliertes Backend
│   ├── prisma/          # Prisma Schema & Migrations
│   └── package.json
├── frontend/            # React Frontend
│   ├── build/          # Production Build (wird eingebettet)
│   └── package.json
└── desktop/            # Electron Wrapper
    ├── main.js         # Main Process (startet Backend)
    ├── preload.js
    ├── scripts/
    │   └── prepare-backend.js  # Build-Script
    └── package.json
```

## 🗄️ Datenbank

### Speicherort
Die SQLite-Datenbank wird automatisch erstellt in:
- **Windows:** `%APPDATA%/cflux-demo/cflux-demo.db`
- **Mac:** `~/Library/Application Support/cflux-demo/cflux-demo.db`
- **Linux:** `~/.config/cflux-demo/cflux-demo.db`

### Erster Start
Beim ersten Start wird automatisch:
1. Datenbank erstellt
2. Migrations ausgeführt
3. Demo-Daten eingespielt (wenn vorhanden)

### Demo-Daten
Demo-User (wird beim ersten Start angelegt):
- **Email:** demo@cflux.de
- **Passwort:** demo123

## 🔄 Zurück zur Original-Version

Das Build-Script erstellt automatisch ein Backup des Original Prisma Schemas:

```bash
# Original PostgreSQL Schema wiederherstellen
cd backend/prisma
cp schema.prisma.postgres.backup schema.prisma
npx prisma generate
```

## 📦 Build Output

Nach erfolgreichem Build findest du die fertige App hier:

- **Windows:** `desktop/dist/CFlux Demo Setup 1.0.0.exe`
- **Mac:** `desktop/dist/CFlux Demo-1.0.0.dmg`
- **Linux:** `desktop/dist/CFlux-Demo-1.0.0.AppImage`

## 🚀 Features der Demo-Version

✅ Vollständig funktionsfähig (alle cflux Module)
✅ Keine externe Datenbank erforderlich
✅ Keine Docker erforderlich
✅ Einfache Installation (nur .exe ausführen)
✅ Automatische Updates möglich (über electron-updater)
✅ Portable (kann auf USB-Stick laufen)

## ⚠️ Limitierungen

- SQLite statt PostgreSQL (leichte Performance-Unterschiede bei großen Datenmengen)
- Kein Multi-User gleichzeitig (SQLite Write-Lock)
- Für Demos und Tests, nicht für Production mit vielen Usern

## 🐛 Troubleshooting

### Backend startet nicht
1. Prüfe ob Port 3001 frei ist
2. Schaue in die Logs (F12 -> Console)
3. Prüfe ob `backend/dist/` existiert

### Frontend lädt nicht
1. Prüfe ob `frontend/build/` existiert
2. Führe `npm run build` im frontend Ordner aus

### Build schlägt fehl
1. Lösche `node_modules` in allen Ordnern
2. Führe `npm install` erneut aus
3. Prüfe Node.js Version (sollte 20+ sein)

## 📝 Weitere Infos

- Original Prisma Schema wird automatisch gesichert
- Backend läuft im Hintergrund als Child Process
- Bei App-Close wird Backend sauber beendet
- Logs findest du in der Electron Console (F12)

## 🎨 Anpassungen

### Demo-Daten ändern
Bearbeite: `backend/prisma/seed.ts`

### Port ändern
In `desktop/main.js` die Zeile ändern:
```javascript
let backendPort = 3001; // Gewünschten Port eintragen
```

### App-Name/Icon ändern
In `desktop/package.json` unter `build` Section.
