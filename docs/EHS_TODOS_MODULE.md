# EHS Todo Modul

## Übersicht

Das EHS Todo Modul ermöglicht die Verwaltung von Aufgaben im Bereich Environment, Health & Safety (EHS). Todos können Projekten und Vorfällen zugeordnet, priorisiert und nachverfolgt werden.

## Features

### ✅ Kernfunktionen

- **Todo-Verwaltung** - Erstellen, Bearbeiten, Löschen von Aufgaben
- **Prioritäten** - 4 Stufen (Low, Medium, High, Urgent)
- **Status-Tracking** - Open, In Progress, Completed, Cancelled
- **Fortschrittsanzeige** - Prozentuale Fortschrittsanzeige (0-100%)
- **Zuordnung** - Zu Projekten, Vorfällen und Personen
- **Kategorisierung** - Flexible Kategorien (Training, Inspection, Corrective Action, etc.)
- **Tags** - Array von Tags für erweiterte Kategorisierung
- **Fälligkeitsdatum** - Mit Überfällig-Warnung
- **Notizen & Anhänge** - Dokumentation und Dateiverwaltung
- **Filter & Suche** - Umfangreiche Filtermöglichkeiten
- **Statistiken** - Übersicht nach Status, Priorität und Kategorie

## Datenmodell

### EHSTodo

```prisma
model EHSTodo {
  id              String           @id @default(uuid())
  title           String
  description     String?
  priority        EHSTodoPriority  @default(MEDIUM)
  status          EHSTodoStatus    @default(OPEN)
  dueDate         DateTime?
  completedAt     DateTime?
  
  // Zuordnung
  projectId       String?
  incidentId      String?
  assignedToId    String?
  createdById     String
  
  // Kategorisierung
  category        String?
  tags            String[]
  
  // Fortschritt
  progressPercent Int             @default(0)
  
  // Notizen und Anhänge
  notes           String?
  attachmentUrls  String[]
  
  isActive        Boolean         @default(true)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}
```

### Enums

```prisma
enum EHSTodoPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum EHSTodoStatus {
  OPEN
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

## API-Endpunkte

Alle Endpunkte unter `/api/ehs-todos` erfordern Authentifizierung.

### Todos verwalten

```http
GET    /api/ehs-todos
GET    /api/ehs-todos/:id
POST   /api/ehs-todos
PUT    /api/ehs-todos/:id
DELETE /api/ehs-todos/:id
```

### Filter & Suche

```http
GET /api/ehs-todos?status=OPEN
GET /api/ehs-todos?priority=HIGH
GET /api/ehs-todos?projectId=xxx
GET /api/ehs-todos?assignedToId=xxx
GET /api/ehs-todos?category=Training
GET /api/ehs-todos?search=safety
GET /api/ehs-todos?startDate=2026-01-01&endDate=2026-12-31
```

### Spezielle Abfragen

```http
GET    /api/ehs-todos/project/:projectId
GET    /api/ehs-todos/incident/:incidentId
GET    /api/ehs-todos/my/assigned
GET    /api/ehs-todos/my/created
```

### Status & Fortschritt

```http
PATCH  /api/ehs-todos/:id/status
PATCH  /api/ehs-todos/:id/progress
```

### Statistiken

```http
GET    /api/ehs-todos/stats/overview
GET    /api/ehs-todos/stats/overview?projectId=xxx
```

## Frontend

### Komponente

`frontend/src/components/EHSTodos.tsx` - Hauptkomponente
`frontend/src/components/EHSTodos.css` - Styling

### Seite

`frontend/src/pages/EHSTodosPage.tsx` - Eigenständige Seite

### Route

```tsx
<Route path="/ehs-todos" element={<PrivateRoute><EHSTodosPage /></PrivateRoute>} />
```

### Features

- **Karten-Ansicht** - Responsive Grid-Layout
- **Statistik-Dashboard** - Übersicht über alle Todos
- **Umfangreiche Filter** - Status, Priorität, Projekt, Zugewiesen, Kategorie, Suche
- **Modal-Dialog** - Erstellen und Bearbeiten
- **Inline-Bearbeitung** - Status und Fortschritt direkt ändern
- **Überfällig-Warnung** - Visuelle Hervorhebung überfälliger Todos
- **Badge-System** - Farbcodierte Status, Prioritäten und Kategorien

## Installation

### 1. Prisma Migration durchführen

```powershell
cd backend
npm run prisma:migrate
```

Die Migration erstellt die `ehs_todos` Tabelle und fügt die notwendigen Relations zu User, Project und Incident hinzu.

### 2. Backend starten

```powershell
cd backend
npm run dev
```

### 3. Frontend starten

```powershell
cd frontend
npm start
```

### 4. Docker (empfohlen)

```powershell
docker-compose up --build -d
```

Die Migration wird automatisch beim Start ausgeführt.

## Verwendung

### Navigation

- **URL**: `http://localhost:3002/#/ehs-todos`
- **Menü**: Link in der Navbar oder im EHS-Menü hinzufügen

### Todo erstellen

1. Klick auf "+ Neues Todo"
2. Titel eingeben (Pflichtfeld)
3. Optional: Beschreibung, Priorität, Status, Fälligkeitsdatum
4. Optional: Projekt, Vorfall, Zuweisen an Benutzer
5. Optional: Kategorie, Fortschritt, Notizen
6. "Speichern" klicken

### Todo bearbeiten

1. Klick auf ✏️ Icon in der Todo-Karte
2. Änderungen vornehmen
3. "Speichern" klicken

### Status ändern

- Dropdown in der Todo-Karte direkt verwenden
- Automatische Completion bei 100% Fortschritt

### Fortschritt aktualisieren

- Slider in der Todo-Karte verwenden
- Automatische Status-Änderung zu "COMPLETED" bei 100%

### Filtern & Suchen

- **Suche**: Freitext-Suche in Titel und Beschreibung
- **Status-Filter**: Alle, Offen, In Bearbeitung, Abgeschlossen, Abgebrochen
- **Prioritäts-Filter**: Alle, Dringend, Hoch, Mittel, Niedrig
- **Projekt-Filter**: Dropdown mit allen Projekten
- **Zugewiesen-Filter**: Dropdown mit allen Benutzern
- **Kategorie-Filter**: Dynamisch basierend auf verwendeten Kategorien

### Statistiken

Dashboard zeigt:
- Gesamt-Anzahl Todos
- Anzahl nach Status (Offen, In Bearbeitung, Abgeschlossen)
- Anzahl überfälliger Todos
- Verteilung nach Priorität
- Verteilung nach Kategorie

## Best Practices

### Kategorien

Empfohlene Standard-Kategorien:
- **Training** - Schulungen und Weiterbildungen
- **Inspection** - Inspektionen und Audits
- **Corrective Action** - Korrekturmaßnahmen nach Vorfällen
- **Preventive Action** - Präventivmaßnahmen
- **Safety Equipment** - Sicherheitsausrüstung
- **Documentation** - Dokumentations-Aufgaben
- **Emergency Response** - Notfallmaßnahmen

### Prioritäten

- **URGENT** - Sofortige Handlung erforderlich (Sicherheitsgefahr)
- **HIGH** - Wichtig, zeitnah zu erledigen
- **MEDIUM** - Standard-Priorität
- **LOW** - Kann später erledigt werden

### Workflow

1. Todo erstellen mit Status "OPEN"
2. Jemandem zuweisen
3. Status auf "IN_PROGRESS" setzen wenn begonnen
4. Fortschritt regelmäßig aktualisieren
5. Bei Fertigstellung Status auf "COMPLETED" setzen
6. Bei Nichtdurchführung Status auf "CANCELLED" setzen

## Integration mit anderen Modulen

### Verknüpfung mit Incidents

Bei der Incident-Bearbeitung können direkt Todos erstellt werden:
- Korrekturmaßnahmen als Todos erfassen
- Präventivmaßnahmen als Todos erfassen
- Nachverfolgung von Incident-Maßnahmen

### Verknüpfung mit Projekten

Projektspezifische EHS-Aufgaben:
- Projekt-Safety-Inspektionen
- Projekt-Trainings
- Projekt-spezifische Audits

## Erweiterungsmöglichkeiten

### Zukünftige Features

- **Kommentare** - Diskussionen zu Todos
- **Datei-Upload** - Direkte Datei-Uploads statt URL-Links
- **Erinnerungen** - E-Mail-Benachrichtigungen bei Fälligkeit
- **Wiederkehrende Todos** - Automatische Erstellung (z.B. monatliche Inspektionen)
- **Workflow-Integration** - Genehmigungsprozesse
- **Kalender-Ansicht** - Visualisierung nach Fälligkeitsdatum
- **Gantt-Chart** - Projektplanung
- **Dependencies** - Abhängigkeiten zwischen Todos

## Troubleshooting

### Todos werden nicht angezeigt

- Prüfen ob Migration durchgelaufen ist
- Browser-Console auf Fehler prüfen
- Backend-Logs prüfen: `docker-compose logs -f backend`

### Filter funktionieren nicht

- Browser-Cache leeren
- Prüfen ob Frontend die neueste Version lädt

### Keine Berechtigungen

- Prüfen ob Benutzer angemeldet ist
- Prüfen ob JWT-Token gültig ist

## Performance

### Optimierungen

- Prisma Includes auf notwendige Felder beschränkt
- Index auf häufig verwendete Filter-Felder
- Soft-Delete für Audit-Trail
- Paginierung kann bei Bedarf hinzugefügt werden

### Datenbank-Indizes

```prisma
@@index([projectId])
@@index([incidentId])
@@index([assignedToId])
@@index([createdById])
@@index([status])
@@index([priority])
@@index([dueDate])
```

## Sicherheit

- Alle Endpunkte erfordern Authentifizierung
- JWT-Token-Validierung
- Soft-Delete für Revisionssicherheit
- Audit-Trail (createdBy, createdAt, updatedAt)

## Dokumentation

- **API-Dokumentation**: Siehe `/api/ehs-todos` Endpunkte
- **Datenmodell**: `backend/prisma/schema.prisma`
- **Frontend-Komponenten**: `frontend/src/components/EHSTodos.tsx`
- **Controller**: `backend/src/controllers/ehsTodo.controller.ts`
- **Routes**: `backend/src/routes/ehsTodo.routes.ts`
