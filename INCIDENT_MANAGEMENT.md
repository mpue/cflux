# Incident Management System

## Übersicht

Das Incident Management System ermöglicht es Benutzern, Vorfälle zu melden, zu verfolgen und zu verwalten. Es umfasst Funktionen für Priorisierung, Statusverfolgung, Zuweisungen und Kommentare.

## Features

### Hauptfunktionen
- ✅ Vorfälle erstellen, bearbeiten und löschen
- ✅ Prioritätsstufen: Niedrig, Mittel, Hoch, Kritisch
- ✅ Status-Tracking: Offen, In Bearbeitung, Gelöst, Geschlossen
- ✅ Zuweisungen an Benutzer
- ✅ Kategorisierung (IT, HR, Facility, Security, etc.)
- ✅ Kommentarfunktion für Zusammenarbeit
- ✅ Dashboard mit Statistiken
- ✅ Filter nach Status und Priorität
- ✅ Betroffene Systeme erfassen

### Datenmodell

#### Incident
- `id`: Eindeutige ID
- `title`: Titel des Vorfalls
- `description`: Detaillierte Beschreibung
- `priority`: LOW | MEDIUM | HIGH | CRITICAL
- `status`: OPEN | IN_PROGRESS | RESOLVED | CLOSED
- `reportedById`: Benutzer der den Vorfall gemeldet hat
- `assignedToId`: Zugewiesener Benutzer
- `category`: Kategorie (optional)
- `affectedSystem`: Betroffenes System (optional)
- `reportedAt`: Meldezeitpunkt
- `resolvedAt`: Lösungszeitpunkt
- `closedAt`: Schließungszeitpunkt
- `dueDate`: Fälligkeitsdatum
- `solution`: Lösungsbeschreibung
- `notes`: Interne Notizen
- `tags`: Tags als JSON-Array

#### IncidentComment
- `id`: Eindeutige ID
- `incidentId`: Zugehöriger Incident
- `userId`: Kommentierender Benutzer
- `comment`: Kommentartext
- `createdAt`: Erstellungszeitpunkt

## Installation & Setup

### 1. Datenbank-Migration ausführen

Da PowerShell-Skripte deaktiviert sind, führe die Migration direkt aus:

```bash
# Navigiere zum Backend-Verzeichnis
cd backend

# Führe die Migration aus (verwende cmd.exe statt PowerShell)
cmd /c "npx prisma migrate dev --name add_incident_management"

# Oder generiere nur den Prisma Client
cmd /c "npx prisma generate"
```

### Alternative: Verwendung von Node direkt

```bash
cd backend
node node_modules/.bin/prisma migrate dev --name add_incident_management
```

### 2. Backend starten

```bash
cd backend
npm run dev
```

### 3. Frontend starten

```bash
cd frontend
npm start
```

## API Endpunkte

### Incidents

#### GET `/api/incidents`
Alle Vorfälle abrufen (mit optionalen Filtern)

Query Parameter:
- `status`: OPEN | IN_PROGRESS | RESOLVED | CLOSED
- `priority`: LOW | MEDIUM | HIGH | CRITICAL
- `assignedToId`: Benutzer-ID

Response: Array von Incident-Objekten

#### GET `/api/incidents/statistics`
Statistiken abrufen

Response:
```json
{
  "total": 10,
  "open": 3,
  "inProgress": 4,
  "resolved": 2,
  "critical": 1,
  "high": 2
}
```

#### GET `/api/incidents/:id`
Einzelnen Vorfall abrufen

Response: Incident-Objekt mit Kommentaren

#### POST `/api/incidents`
Neuen Vorfall erstellen

Body:
```json
{
  "title": "Server offline",
  "description": "Produktionsserver ist nicht erreichbar",
  "priority": "CRITICAL",
  "category": "IT",
  "affectedSystem": "Production Server",
  "assignedToId": "user-id",
  "dueDate": "2025-12-25T00:00:00Z",
  "tags": ["server", "production"]
}
```

#### PUT `/api/incidents/:id`
Vorfall aktualisieren

Body: Gleiche Felder wie POST (alle optional)

#### DELETE `/api/incidents/:id`
Vorfall löschen

#### POST `/api/incidents/:id/comments`
Kommentar hinzufügen

Body:
```json
{
  "comment": "Problem wurde identifiziert. Arbeite an Lösung."
}
```

#### GET `/api/incidents/:id/comments`
Kommentare abrufen

Response: Array von Comment-Objekten

## Frontend-Nutzung

### Zugriff
- Navigation: Dashboard → "Incidents" Button in der Navbar
- Direkter Link: `/incidents`

### Funktionen

#### Neuen Vorfall erstellen
1. Klicke auf "Neuer Vorfall"
2. Fülle das Formular aus:
   - Titel (erforderlich)
   - Beschreibung (erforderlich)
   - Priorität
   - Kategorie
   - Betroffenes System
   - Zuweisung an Benutzer
3. Klicke "Erstellen"

#### Vorfall bearbeiten
1. Klicke in der Tabelle auf "Details"
2. Im Detail-Modal kannst du:
   - Status ändern (Dropdown)
   - Priorität ändern (Dropdown)
   - Zuweisung ändern (Dropdown)
   - Kommentare hinzufügen
   - Vorfall löschen

#### Filtern
Nutze die Dropdown-Menüs über der Tabelle:
- Status-Filter
- Prioritäts-Filter

#### Statistiken
Das Dashboard zeigt:
- Gesamt-Vorfälle
- Offene Vorfälle
- In Bearbeitung
- Gelöste Vorfälle
- Kritische Vorfälle

## Datenbank-Schema Details

### Prisma Schema Änderungen

```prisma
enum IncidentPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum IncidentStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

model Incident {
  id              String           @id @default(uuid())
  title           String
  description     String           @db.Text
  priority        IncidentPriority @default(MEDIUM)
  status          IncidentStatus   @default(OPEN)
  reportedById    String
  assignedToId    String?
  category        String?
  affectedSystem  String?
  reportedAt      DateTime         @default(now())
  resolvedAt      DateTime?
  closedAt        DateTime?
  dueDate         DateTime?
  solution        String?          @db.Text
  notes           String?          @db.Text
  tags            String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  reportedBy      User             @relation("IncidentsReported", fields: [reportedById], references: [id], onDelete: Restrict)
  assignedTo      User?            @relation("IncidentsAssigned", fields: [assignedToId], references: [id], onDelete: SetNull)
  comments        IncidentComment[]
  
  @@index([reportedById])
  @@index([assignedToId])
  @@index([status])
  @@index([priority])
  @@index([reportedAt])
  @@map("incidents")
}

model IncidentComment {
  id          String   @id @default(uuid())
  incidentId  String
  userId      String
  comment     String   @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  incident    Incident @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  
  @@index([incidentId])
  @@index([createdAt])
  @@map("incident_comments")
}
```

### User Model Erweiterung

```prisma
model User {
  // ... bestehende Felder ...
  reportedIncidents Incident[] @relation("IncidentsReported")
  assignedIncidents Incident[] @relation("IncidentsAssigned")
  
  @@map("users")
}
```

## Berechtigungen

- **Alle Benutzer** können:
  - Vorfälle erstellen
  - Ihre eigenen Vorfälle anzeigen
  - Zugewiesene Vorfälle bearbeiten
  - Kommentare hinzufügen

- **Admins** können zusätzlich:
  - Alle Vorfälle sehen und bearbeiten
  - Vorfälle löschen
  - Vorfälle anderen Benutzern zuweisen

## Troubleshooting

### Migration schlägt fehl
Falls die Migration nicht funktioniert:

1. Überprüfe die Datenbankverbindung in `.env`
2. Stelle sicher, dass PostgreSQL läuft
3. Führe aus:
   ```bash
   cmd /c "npx prisma generate"
   cmd /c "npx prisma db push"
   ```

### Frontend zeigt Fehler
1. Überprüfe, dass Backend läuft (Port 3001)
2. Prüfe Browser-Konsole auf Fehler
3. Stelle sicher, dass `REACT_APP_API_URL` korrekt ist

### Backend-Fehler
1. Prüfe Console-Output des Backend-Servers
2. Stelle sicher, dass Prisma Client generiert wurde:
   ```bash
   cmd /c "npx prisma generate"
   ```

## Nächste Schritte / Mögliche Erweiterungen

- [ ] E-Mail-Benachrichtigungen bei neuen Vorfällen
- [ ] Dateianhänge für Vorfälle
- [ ] SLA (Service Level Agreement) Tracking
- [ ] Incident-Templates
- [ ] Automatische Eskalation bei Überschreitung der Fälligkeit
- [ ] Export-Funktion (PDF, CSV)
- [ ] Dashboard-Widgets für Admin-Panel
- [ ] Incident-Historie und Audit-Log
- [ ] Knowledge Base Integration
- [ ] Mobile App

## Support

Bei Fragen oder Problemen:
1. Prüfe die Logs (Backend-Console)
2. Prüfe Browser-Konsole (Frontend)
3. Stelle sicher, dass alle Dependencies installiert sind
4. Führe `npm install` in beiden Verzeichnissen aus
