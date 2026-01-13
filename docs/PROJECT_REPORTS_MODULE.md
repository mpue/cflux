# Projekt-Reports Modul

## Überblick

Das Projekt-Reports Modul bietet umfassende Berichts- und Analysefunktionen für Projekte. Es kombiniert Budget-, Zeit- und Teamdaten in übersichtlichen Reports.

## Features

### 1. Projekt-Übersicht Report

Zeigt eine Übersicht aller Projekte mit folgenden Informationen:

#### Zusammenfassungs-Karten
- **Projekte**: Anzahl aktive/gesamt
- **Gesamtbudget**: Summe aller Projektbudgets
- **Kosten**: Summe aller tatsächlichen Kosten
- **Stunden**: Summe aller erfassten Stunden

#### Projekt-Tabelle
Pro Projekt:
- Name und Status
- Kunde
- Budget-Status
- Gesamtbudget, Kosten, Restbudget
- Budget-Auslastung (visuell als Fortschrittsbalken)
- Erfasste Stunden
- Teamgröße

#### Filter
- Status: Alle / Aktiv / Inaktiv
- Zeitraum: Von/Bis Datum für Zeiterfassung
- Kunde (geplant)

### 2. Zeiterfassung Report

Detaillierter Report für ein einzelnes Projekt:

#### Projekt-Info
- Projektname und Kunde
- Budget-Übersicht (Total, Geplant, Aktuell)

#### Zusammenfassung
- Gesamtstunden
- Gesamtkosten (berechnet mit Stundensätzen)
- Anzahl Zeiteinträge
- Zeitraum

#### Gruppierte Daten
Aggregation nach:
- **Benutzer** (Standard)
- **Tag**
- **Woche**
- **Monat**

Pro Gruppierung:
- Stunden
- Kosten
- Anzahl Einträge

#### Detaillierte Einträge
Liste aller Zeiteinträge mit:
- Datum
- Benutzer
- Von/Bis Uhrzeit
- Stunden
- Beschreibung

#### Filter
- Projekt (Dropdown)
- Zeitraum: Von/Bis Datum
- Benutzer (geplant)
- Gruppierung

### 3. Export-Funktion

Beide Reports können als CSV exportiert werden:
- **Projekt-Übersicht**: projekt-uebersicht.csv
- **Zeiterfassung**: zeiterfassung-report.csv

CSV-Format: Semikolon-getrennt (;) für Excel-Kompatibilität

## Backend API

### Endpunkte

#### GET /api/project-reports/overview
Projekt-Übersicht Report

**Query Parameters:**
- `status` (optional): 'active' | 'inactive'
- `customerId` (optional): Kunde ID
- `startDate` (optional): ISO-Datum
- `endDate` (optional): ISO-Datum

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Projekt Name",
      "description": "Beschreibung",
      "isActive": true,
      "customer": { "id": "uuid", "name": "Kunde" },
      "budget": {
        "totalBudget": 50000,
        "plannedCosts": 45000,
        "actualCosts": 30000,
        "remainingBudget": 20000,
        "utilization": 60,
        "status": "ACTIVE"
      },
      "timeTracking": {
        "totalHours": 250.5,
        "userCount": 5,
        "topUsers": [
          { "userId": "uuid", "name": "Max Müller", "hours": 80.5 }
        ]
      },
      "teamSize": 5
    }
  ],
  "summary": {
    "totalProjects": 10,
    "activeProjects": 7,
    "totalBudget": 500000,
    "totalActualCosts": 300000,
    "totalHours": 2000
  }
}
```

#### GET /api/project-reports/time-tracking
Zeiterfassung Report

**Query Parameters:**
- `projectId` (required): Projekt ID
- `startDate` (optional): ISO-Datum
- `endDate` (optional): ISO-Datum
- `userId` (optional): User ID
- `groupBy` (optional): 'user' | 'day' | 'week' | 'month' (default: 'user')

**Response:**
```json
{
  "project": {
    "id": "uuid",
    "name": "Projekt Name",
    "customer": "Kunde",
    "budget": {
      "total": 50000,
      "planned": 45000,
      "actual": 30000
    }
  },
  "summary": {
    "totalHours": 250.5,
    "totalCost": 25050,
    "entryCount": 45,
    "period": {
      "from": "2025-01-01",
      "to": "2025-01-31"
    }
  },
  "groupedData": [
    {
      "key": "user-id",
      "userName": "Max Müller",
      "hours": 80.5,
      "cost": 8050,
      "entries": 15
    }
  ],
  "entries": [
    {
      "id": "uuid",
      "date": "2025-01-15",
      "user": "Max Müller",
      "clockIn": "2025-01-15T08:00:00Z",
      "clockOut": "2025-01-15T17:00:00Z",
      "hours": 8.5,
      "description": "Feature Entwicklung"
    }
  ]
}
```

## Frontend Komponenten

### ProjectReportsTab.tsx
Haupt-Komponente mit Tab-Navigation zwischen Übersicht und Zeiterfassung.

**Verwendung:**
```tsx
import ProjectReportsTab from '../components/tabs/ProjectReportsTab';

// In AdminDashboard
{activeTab === 'projectReports' && <ProjectReportsTab />}
```

### ProjectReportsTab.css
Styling mit Dark Mode Support via `[data-theme='dark']`.

## Berechtigungen

**Modul-Key:** `project_reports`

**Erforderliche Berechtigungen:**
- `canView`: Report ansehen (erforderlich für beide Tabs)
- `canCreate`: (reserviert für zukünftige Features)
- `canEdit`: (reserviert)
- `canDelete`: (reserviert)

## Kostenberechnung

Die Kosten werden automatisch mit dem 3-stufigen Stundensatz-System berechnet:

1. **User.hourlyRate** - Benutzerspezifischer Stundensatz
2. **Project.defaultHourlyRate** - Projekt-Standard
3. **SystemSettings.defaultHourlyRate** - System-Standard (100 CHF)

Formel: `Kosten = Stunden × Stundensatz`

## Stundenberechnung

Stunden werden aus TimeEntry-Daten berechnet:

```
workedMs = clockOut - clockIn - (pauseMinutes * 60 * 1000)
hours = workedMs / (1000 * 60 * 60)
```

Nur abgeschlossene Einträge (`status = 'CLOCKED_OUT'`) werden berücksichtigt.

## Integration

### Modul registrieren

1. **Backend:** Route in [backend/src/index.ts](../backend/src/index.ts)
   ```typescript
   import projectReportsRoutes from './routes/projectReports.routes';
   app.use('/api/project-reports', projectReportsRoutes);
   ```

2. **Frontend:** Tab in [frontend/src/pages/AdminDashboard.tsx](../frontend/src/pages/AdminDashboard.tsx)
   ```tsx
   type TabType = ... | 'projectReports';
   
   {(user?.role === 'ADMIN' || hasModuleAccess('project_reports')) && (
     <TabButton
       active={activeTab === 'projectReports'}
       onClick={() => setActiveTab('projectReports')}
       label="📊 Projekt-Reports"
     />
   )}
   
   {activeTab === 'projectReports' && <ProjectReportsTab />}
   ```

3. **Modul-Seed:** In [backend/prisma/seedModules.ts](../backend/prisma/seedModules.ts)
   ```typescript
   {
     name: 'Projekt-Reports',
     key: 'project_reports',
     description: 'Umfassende Projekt-Berichte und Analysen',
     icon: 'assessment',
     route: '/project-reports',
     sortOrder: 20,
   }
   ```

### Berechtigungen zuweisen

Via Admin-UI:
1. Module → Projekt-Reports
2. Berechtigungen → Benutzergruppe auswählen
3. canView aktivieren

Via Script:
```bash
docker exec timetracking-backend node scripts/grant-project-reports.js
```

## Erweiterungsmöglichkeiten

### Geplante Features (Zukunft)
1. **Budget-Entwicklung Report**: Zeitliche Entwicklung des Budgets
2. **Ressourcen-Auslastung**: Auslastung pro Mitarbeiter
3. **Kosten-Analyse**: Kostenarten-Vergleich
4. **Custom Reports**: Benutzerdefinierte Report-Templates
5. **Scheduled Reports**: Automatische Email-Reports

### Erweiterungspunkte
- Weitere Filter (Abteilung, Kostenstelle, etc.)
- Grafische Auswertungen (Charts mit recharts)
- PDF-Export zusätzlich zu CSV
- Drill-Down Funktionalität
- Benchmark-Vergleiche zwischen Projekten

## Technische Details

### Dependencies
- **lucide-react**: Icons (Download, Calendar, TrendingUp, Users, DollarSign)
- **Frontend API Client**: Axios mit automatischer JWT-Token-Injektion
- **Backend**: Prisma ORM für Datenbankzugriff

### Performance
- Berechnungen erfolgen im Backend
- Aggregation auf Datenbankebene wo möglich
- Frontend cached Projekt-Liste zwischen Tabs
- Lazy Loading der Reports (nur bei Abruf)

### Dark Mode
Vollständige Dark Mode Unterstützung via CSS `[data-theme='dark']` Selektoren.

## Troubleshooting

### "Modul nicht gefunden"
```bash
# Modul-Seed ausführen
docker exec timetracking-backend npx ts-node prisma/seedModules.ts
```

### "Keine Berechtigung"
```bash
# Berechtigungen prüfen
docker exec timetracking-backend node scripts/grant-project-reports.js
```

### "Keine Daten"
- Sicherstellen, dass Projekte existieren
- Zeiteinträge müssen `status = 'CLOCKED_OUT'` haben
- Budget muss `isActive = true` haben

### Backend-Logs
```bash
docker logs timetracking-backend -f
```

## Changelog

### Version 1.0.0 (2025-01-13)
- ✅ Projekt-Übersicht Report
- ✅ Zeiterfassung Report
- ✅ CSV-Export
- ✅ Filter (Status, Zeitraum, Gruppierung)
- ✅ Dark Mode Support
- ✅ Backend API mit Prisma
- ✅ Module Permission System Integration
