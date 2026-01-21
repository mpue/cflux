# Projektplanung Modul - Gantt-Chart

## Übersicht
Das Projektplanung-Modul bietet einen interaktiven Gantt-Chart-Editor zur visuellen Planung und Verwaltung von Projekten auf einer Timeline.

## Features

### Visuelle Projektplanung
- **Gantt-Chart-Ansicht**: Alle Projekte werden als Balken auf einer Timeline dargestellt
- **Interaktive Bearbeitung**: Start- und Enddatum können per Drag & Drop geändert werden
- **Fortschrittsanzeige**: Visueller Fortschritt (0-100%) für jedes Projekt
- **Farbcodierung nach Status**:
  - 🔵 Blau: Aktiv (ACTIVE)
  - 🟢 Grün: Abgeschlossen (COMPLETED)
  - 🟡 Gelb: Pausiert (ON_HOLD)
  - 🔴 Rot: Abgebrochen (CANCELLED)

### Ansichtsoptionen
- **Tag-Ansicht**: Detaillierte Tagesübersicht
- **Wochen-Ansicht**: Wochenweise Planung
- **Monats-Ansicht**: Monatliche Übersicht (Standard)
- **Jahres-Ansicht**: Jahresplanung

### Interaktionen
- **Klick**: Öffnet Info-Modal mit Projektdetails
- **Doppelklick**: Navigiert zur Projekt-Detailseite
- **Drag**: Verschiebt Start-/Enddatum
- **Progress-Balken**: Ändert Fortschritt des Projekts

## Technische Details

### Datenbankschema
Neue Felder im `Project` Model:
```prisma
startDate   DateTime?    // Geplantes Startdatum für Gantt-Chart
endDate     DateTime?    // Geplantes Enddatum für Gantt-Chart
progress    Int @default(0) // Fortschritt in Prozent (0-100)
```

### Frontend-Komponente
- **Datei**: `frontend/src/pages/ProjectPlanningPage.tsx`
- **Library**: `gantt-task-react` für Gantt-Chart-Rendering
- **Styles**: `frontend/src/pages/ProjectPlanningPage.css`

### API-Integration
Verwendet bestehende Project-Service-Funktionen:
- `projectService.getAllProjects()` - Lädt alle Projekte
- `projectService.updateProject(id, data)` - Aktualisiert Projekt-Daten
- `projectService.deleteProject(id)` - Löscht Projekt

### Routing
- **Route**: `/project-planning`
- **Admin-Tab**: Unter "Projektmanagement" → "Projektplanung"
- **Modulschlüssel**: `project_planning`

## Berechtigungen
- Zugriff nur für Admins oder Benutzer mit `project_planning` Modulberechtigung
- Bearbeitungsrechte: Nur Admins können Projekte ändern

## Verwendung

### Projekt-Zeitraum festlegen
1. Klicken und ziehen Sie den Projektbalken, um Start- und Enddatum zu ändern
2. Änderungen werden automatisch gespeichert

### Fortschritt aktualisieren
1. Ziehen Sie den Fortschrittsbalken innerhalb des Projektbalkens
2. Fortschritt wird in Prozent (0-100%) gespeichert

### Projekt bearbeiten
1. Klicken Sie auf ein Projekt, um Details anzuzeigen
2. Klicken Sie auf "Projekt bearbeiten" im Modal
3. Oder doppelklicken Sie direkt auf das Projekt

## Installation

### Backend
1. Schema-Änderungen wurden automatisch angewendet bei Container-Restart
2. Modul wurde via `npm run seed:modules` erstellt

### Frontend
1. Library installiert: `npm install gantt-task-react`
2. Komponente und Route hinzugefügt
3. Tab im Admin-Panel unter Projektmanagement verfügbar

## Hinweise
- Projekte ohne Start-/Enddatum werden mit Standardwerten angezeigt (Start: heute, Ende: +30 Tage)
- Mindestdauer eines Projekts: 1 Tag
- Heute-Markierung: Rosa-transparenter Bereich
- Dark Mode: Vollständig unterstützt

## Zukünftige Erweiterungen
- [ ] Abhängigkeiten zwischen Projekten (Gantt-Links)
- [ ] Meilensteine hinzufügen
- [ ] Export als PDF/PNG
- [ ] Team-Ressourcenzuweisung auf Timeline
- [ ] Kritischer Pfad-Analyse
- [ ] Projekt-Gruppierung nach Teams/Kunden
