# Änderungen für CFlux Demo Version

## 📋 Übersicht der modifizierten Dateien

### 1. Backend: Prisma Schema
**Datei:** `backend/prisma/schema.prisma`

**Änderungen:**
```prisma
// Vorher:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Nachher:
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Zusätzlich:
- `@db.Text` Annotationen entfernt (nicht nötig in SQLite)
- `@default(uuid())` → `@default(cuid())` (SQLite-kompatibel)

**Backup:** Original wird automatisch als `schema.prisma.postgres.backup` gesichert

---

### 2. Desktop: Main Process
**Datei:** `desktop/main.js`

**Neue Features:**
```javascript
// Backend Integration
- startBackend()      // Startet Backend automatisch
- stopBackend()       // Beendet Backend sauber
- findAvailablePort() // Findet freien Port

// Datenbank-Handling
- Automatische DB-Initialisierung beim ersten Start
- Prisma Migrations automatisch ausführen
- DB im User-Data Verzeichnis
```

**Key Changes:**
1. Backend wird als Child Process gestartet
2. Wartet bis Backend ready ist (Health Check)
3. Bei App-Close wird Backend gestoppt
4. SQLite DB wird im User-Data Folder gespeichert

---

### 3. Desktop: Package.json
**Datei:** `desktop/package.json`

**Änderungen:**

```json
{
  "name": "cflux-demo",  // war: cflux-desktop
  "scripts": {
    "prebuild": "node scripts/prepare-backend.js"  // NEU
  },
  "build": {
    "extraResources": [
      // NEU: Backend mit einpacken
      {
        "from": "../backend/dist",
        "to": "backend/dist"
      },
      {
        "from": "../backend/node_modules/@prisma",
        "to": "backend/node_modules/@prisma"
      },
      // ... weitere Backend-Dateien
    ]
  }
}
```

---

### 4. Desktop: Build Script
**Datei:** `desktop/scripts/prepare-backend.js` (NEU)

**Was es macht:**
1. ✅ Sichert Original PostgreSQL Schema
2. ✅ Konvertiert Schema zu SQLite
3. ✅ Generiert Prisma Client für SQLite
4. ✅ Baut Backend

---

## 🔄 Migration Flow

### Entwicklung (Original):
```
Developer → Docker Compose → PostgreSQL + Backend + Frontend
```

### Demo Version:
```
User → .exe → [Electron → Backend (embedded) → SQLite (local)]
                      ↓
                  Frontend (embedded)
```

---

## 📦 Was wird alles gepackt?

```
CFlux Demo.exe (ca. 150-200 MB)
├── Electron Framework
├── Frontend (React Build)
├── Backend (Node.js)
│   ├── dist/ (kompiliertes Backend)
│   ├── node_modules/ (nur Prisma)
│   └── prisma/ (Schema & Migrations)
└── node (embedded Runtime)

Beim ersten Start erstellt:
└── User Data/
    └── cflux-demo.db (SQLite)
```

---

## ⚡ Performance Unterschiede

### PostgreSQL (Original):
- ✅ Optimal für viele gleichzeitige User
- ✅ Bessere Performance bei großen Datenmengen
- ❌ Braucht externen Datenbankserver

### SQLite (Demo):
- ✅ Keine Installation nötig
- ✅ Perfekt für Demos/Single-User
- ✅ Sehr schnell für kleine/mittlere Datenmengen
- ❌ Nicht optimal für viele gleichzeitige Schreibzugriffe
- ❌ File-basiert (kein Network-Access)

---

## 🚦 Testing Checklist

Vor dem Build testen:

1. **Backend isoliert testen:**
   ```bash
   cd backend
   # Schema zu SQLite konvertieren
   # DATABASE_URL auf file:./test.db setzen
   npx prisma migrate deploy
   npm start
   ```

2. **Frontend isoliert testen:**
   ```bash
   cd frontend
   npm run build
   # Build Ordner prüfen
   ```

3. **Electron Development Mode:**
   ```bash
   cd desktop
   npm run dev
   ```

4. **Production Build:**
   ```bash
   cd desktop
   npm run build:win
   # Installer testen!
   ```

---

## 🔧 Bekannte Anpassungen

### Backend Code
Möglicherweise musst du in deinem Backend-Code prüfen:

1. **PostgreSQL-spezifische Queries:**
   - Raw SQL Queries könnten angepasst werden müssen
   - Prüfe auf `pg_*` Funktionen

2. **JSON Handling:**
   - SQLite hat eingeschränktere JSON-Funktionen
   - Evtl. JSON Parse/Stringify im Code nötig

3. **Transactions:**
   - Sollten funktionieren, aber teste kritische Bereiche

### Frontend Code
Keine Änderungen nötig! 
Frontend weiß nicht ob Backend SQLite oder PostgreSQL nutzt.

---

## 📊 File Sizes (ungefähr)

| Component | Size |
|-----------|------|
| Electron Framework | ~50 MB |
| Node.js Runtime | ~20 MB |
| Backend (dist + node_modules) | ~30 MB |
| Frontend Build | ~5 MB |
| **Total (vor Compression)** | **~105 MB** |
| **Installer (komprimiert)** | **~70 MB** |

---

## 🎯 Nächste Schritte

1. ✅ Dateien in dein Projekt kopieren
2. ✅ Dependencies installieren
3. ✅ Development Build testen (`npm run dev`)
4. ✅ Production Build erstellen (`npm run build:win`)
5. ✅ Demo-Daten Seeds erstellen (optional)
6. ✅ Installer auf sauberem System testen

---

## 💡 Tipps

### Kleinerer Build?
- Nur benötigte node_modules packen
- Frontend Build optimieren (Webpack)
- Electron besser konfigurieren

### Auto-Updates?
- `electron-updater` integrieren
- GitHub Releases nutzen

### Code Signing?
- Für Windows: Code Signing Certificate kaufen
- Für Mac: Apple Developer Account

---

## 🆘 Support

Wenn etwas nicht funktioniert:
1. Prüfe Logs in der Console (F12)
2. Schaue in `%APPDATA%/cflux-demo/` nach Logs
3. Teste Backend einzeln mit SQLite
4. Checke ob alle Dependencies installiert sind
