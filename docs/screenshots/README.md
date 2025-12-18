# Screenshots für README

Dieses Verzeichnis enthält Screenshots für die Hauptdokumentation.

## Benötigte Screenshots

### 1. Dashboard (`dashboard.png`)
- Benutzer eingeloggt
- Dashboard-Ansicht mit Live-Uhr
- Aktiver Zeiteintrag oder Clock-In Button
- Liste der letzten Zeiteinträge sichtbar
- **Empfohlene Größe:** 1920x1080px

### 2. Admin Panel (`admin-panel.png`)
- Als Admin eingeloggt
- Admin Panel geöffnet
- Tabs sichtbar (Users, Projects, Locations, etc.)
- Zeige z.B. Users-Tab mit Benutzerliste
- **Empfohlene Größe:** 1920x1080px

### 3. Swiss Compliance Dashboard (`compliance-dashboard.png`)
- Admin Panel → 🇨🇭 Compliance Tab
- Statistik-Cards oben sichtbar (Total, Unresolved, Critical)
- Violations-Breakdown Diagramm
- Violations-Tabelle mit mindestens 2-3 Einträgen
- Filter-Buttons sichtbar (Alle, Ungelöst, Kritisch)
- **Empfohlene Größe:** 1920x1080px

### 4. Urlaubsplaner (`vacation-planner.png`)
- Admin Panel → Urlaub Tab
- Kalender-Grid für ganzes Jahr
- Mehrere Abwesenheiten farblich markiert
- Filter oben (Benutzer-Auswahl)
- **Empfohlene Größe:** 1920x1080px

### 5. Mobile Ansicht (`mobile-view.png`)
- Browser im Mobile-Device-Modus (F12 → Device Toggle)
- Eingeloggt als Benutzer
- Dashboard-Ansicht
- Touch-freundliche Buttons sichtbar
- **Empfohlene Größe:** 375x812px (iPhone X/11/12)

## Wie Screenshots erstellen?

### Option 1: Browser Screenshot-Tool
1. Öffne http://localhost:3002
2. Drücke `F12` für Developer Tools
3. Drücke `Ctrl+Shift+M` für Mobile-Ansicht (für mobile-view.png)
4. Drücke `Ctrl+Shift+P` und tippe "Screenshot"
5. Wähle "Capture full size screenshot"

### Option 2: Windows Snipping Tool
1. Drücke `Windows + Shift + S`
2. Wähle Bereich aus
3. Screenshot wird in Zwischenablage kopiert
4. Füge in Paint ein und speichere

### Option 3: macOS Screenshot
1. Drücke `Cmd + Shift + 4`
2. Wähle Bereich mit Maus aus
3. Screenshot wird auf Desktop gespeichert

## Dateinamen

Bitte folgende exakte Dateinamen verwenden:
- `dashboard.png`
- `admin-panel.png`
- `compliance-dashboard.png`
- `vacation-planner.png`
- `mobile-view.png`

## Bildoptimierung (Optional)

Für kleinere Dateigrößen verwende:
- **Windows:** [TinyPNG](https://tinypng.com/)
- **CLI:** `npm install -g pngquant` → `pngquant *.png`
