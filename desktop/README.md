# CFlux Desktop Application

Desktop-Version der CFlux Time Tracking Applikation mit Electron.

## Funktionen

- ✅ Native Desktop-Anwendung für Windows, macOS und Linux
- ✅ Offline-fähig (nach initialem Laden)
- ✅ Automatisches Speichern von Fenstergröße und Position
- ✅ Native Menüleiste mit deutschen Übersetzungen
- ✅ Sicherer Context (Context Isolation)
- ✅ Unterstützung für externe Links

## Voraussetzungen

- Node.js 16.x oder höher
- npm oder yarn
- Gebautes React Frontend (`frontend/build`)

## Installation

```bash
cd desktop
npm install
```

## Konfiguration

Erstelle eine `.env` Datei basierend auf `.env.example`:

```bash
cp .env.example .env
```

Konfiguriere die Backend-URL in der `.env`:

```env
REACT_APP_API_URL=http://localhost:5000
```

## Entwicklung

### Frontend vorbereiten

Zuerst muss das React Frontend gebaut werden:

```bash
cd ../frontend
npm run build
cd ../desktop
```

### Entwicklungsmodus mit React Dev Server

Für die Entwicklung kann die App direkt mit dem React Dev Server verbunden werden:

```bash
# Terminal 1: React Dev Server starten
cd ../frontend
npm start

# Terminal 2: Electron im Dev-Modus starten
cd ../desktop
npm run dev
```

Im Dev-Modus lädt Electron automatisch von `http://localhost:3000` und öffnet die DevTools.

### Produktionsmodus lokal testen

```bash
npm start
```

Dies lädt die gebaute Version aus `frontend/build`.

## Build

### Für alle Plattformen bauen

```bash
npm run build:all
```

### Plattform-spezifische Builds

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Die fertigen Installer befinden sich im `dist/` Ordner.

### Build ohne Installation (portable)

```bash
npm run pack
```

## Projektstruktur

```
desktop/
├── main.js           # Electron Hauptprozess
├── preload.js        # Preload Script für IPC
├── package.json      # Dependencies und Build-Konfiguration
├── .env.example      # Umgebungsvariablen Template
├── assets/           # Icons und Ressourcen
│   ├── icon.ico      # Windows Icon
│   ├── icon.icns     # macOS Icon
│   └── icon.png      # Linux Icon
└── dist/             # Build-Ausgabe (nach Build)
```

## Icons

Für professionelle Builds sollten eigene Icons erstellt werden:

- **Windows**: `assets/icon.ico` (256x256 oder mehrere Größen)
- **macOS**: `assets/icon.icns` (512x512@2x)
- **Linux**: `assets/icon.png` (512x512)

Tools für Icon-Konvertierung:
- [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder)
- [png2icons](https://www.npmjs.com/package/png2icons)

## Anpassungen

### Application Menu

Das Menü kann in [main.js](main.js#L70) angepasst werden.

### Fenstergröße

Die Standard-Fenstergröße kann in [main.js](main.js#L15) geändert werden:

```javascript
mainWindow = new BrowserWindow({
  width: 1400,
  height: 900,
  minWidth: 1024,
  minHeight: 768,
  // ...
});
```

### Backend-URL

Die Backend-URL wird über Umgebungsvariablen konfiguriert. Im Frontend muss `REACT_APP_API_URL` verwendet werden.

## Troubleshooting

### "Cannot find module 'electron'"

```bash
npm install
```

### Frontend wird nicht geladen

Stelle sicher, dass das Frontend gebaut wurde:

```bash
cd ../frontend
npm run build
```

### Icons werden nicht angezeigt

Erstelle die benötigten Icon-Dateien im `assets/` Ordner oder entferne die Icon-Referenzen aus der Build-Konfiguration.

### DevTools öffnen nicht

Im Entwicklungsmodus sollten die DevTools automatisch öffnen. Alternativ kann man sie mit `Ctrl+Shift+I` (Windows/Linux) oder `Cmd+Option+I` (macOS) öffnen.

## Verteilung

### Code Signing (Optional aber empfohlen)

Für professionelle Verteilung sollte die App signiert werden:

- **Windows**: Benötigt ein Code Signing Certificate
- **macOS**: Benötigt Apple Developer Account und Notarisierung
- **Linux**: Keine Signierung erforderlich

Siehe [electron-builder Dokumentation](https://www.electron.build/code-signing) für Details.

### Auto-Update (Optional)

Electron-builder unterstützt Auto-Updates über verschiedene Dienste:

- GitHub Releases
- S3
- Eigener Update-Server

## Bekannte Einschränkungen

- Backend muss separat laufen (nicht in die Electron-App eingebettet)
- Größerer Download (~150-200 MB durch Chromium)
- Erste Installation dauert länger

## Alternative: Backend einbetten

Um eine vollständig standalone Desktop-App zu erstellen, kann das Node.js Backend in Electron eingebettet werden. Dafür müsste `main.js` erweitert werden, um den Express-Server zu starten.

## Ressourcen

- [Electron Dokumentation](https://www.electronjs.org/docs)
- [electron-builder Dokumentation](https://www.electron.build/)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)

## Support

Für Fragen oder Probleme, siehe das Haupt-[README](../README.md) des Projekts.
