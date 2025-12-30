# Stundenbuchungs-Reports - Dokumentation

## Übersicht

Das System verfügt nun über umfassende Reports für Stundenbuchungen auf Projekte. Die Reports bieten detaillierte Auswertungen und PDF-Export-Funktionen für alle Benutzer sowie einzelne Benutzer.

## Features

### 1. Stundenbuchungs-Report (Alle Benutzer)
**Zugriff:** Admin Dashboard → "📋 Stundenbuchungen (Alle)"

#### Funktionen:
- **Detaillierte Übersicht** über alle Stundenbuchungen
- **Flexible Filter:**
  - Zeitraum (mit Quick-Select für 1, 3, 6, 12 Monate)
  - Mitarbeiter (einzelner oder alle)
  - Projekt (einzelnes oder alle)
- **Drei Ansichtsmodi:**
  1. **Alle Buchungen** - Vollständige Liste aller Zeiteinträge
  2. **Nach Mitarbeiter** - Gruppierung nach Benutzer mit Statistiken
  3. **Nach Projekt** - Gruppierung nach Projekt mit Statistiken

#### Zusammenfassung enthält:
- Gesamtstunden
- Arbeitstage (à 8h)
- Anzahl Buchungen
- Anzahl Mitarbeiter
- Anzahl Projekte

#### PDF-Export:
- Vollständiger Report im Querformat (Landscape)
- Zusammenfassung
- Aufschlüsselung nach Mitarbeiter
- Aufschlüsselung nach Projekt
- Detaillierte Buchungsliste

### 2. Mitarbeiter Stundenbuchungs-Report
**Zugriff:** Admin Dashboard → "👤 Stundenbuchungen (User)"

#### Funktionen:
- **Benutzerauswahl** - Auswahl eines einzelnen Mitarbeiters
- **Zeitraumfilter** mit Quick-Select
- **Zwei Ansichtsmodi:**
  1. **Tagesübersicht** - Aufschlüsselung nach Tag mit allen Buchungen
  2. **Projektübersicht** - Aufschlüsselung nach Projekt mit Prozentanteilen

#### Mitarbeiter-Information zeigt:
- Name und E-Mail
- Personalnummer (falls vorhanden)
- Ausgewählter Zeitraum

#### Zusammenfassung enthält:
- Gesamtstunden
- Arbeitstage (à 8h)
- Anzahl Buchungen
- Anzahl Projekte

#### Tagesübersicht zeigt:
- Datum mit Gesamtstunden pro Tag
- Details jeder Buchung (Von-Bis, Stunden, Projekt, Standort, Beschreibung)

#### Projektübersicht zeigt:
- Projektstunden und Anzahl Buchungen
- Durchschnitt Stunden pro Buchung
- Prozentuale Verteilung (visualisiert mit Fortschrittsbalken)

#### PDF-Export:
- Detaillierter individueller Bericht
- Benutzerinformationen
- Zusammenfassung
- Aufschlüsselung nach Projekt und Standort
- Tagesaufschlüsselung
- Detaillierte Zeiteinträge (optional)
- Compliance-Informationen (falls konfiguriert)

## Backend API-Endpunkte

### Detaillierte Stundenbuchungs-Reports

#### GET /api/reports/time-bookings
Ruft detaillierte Stundenbuchungen mit Filteroptionen ab.

**Query-Parameter:**
- `startDate` (string, required) - Start-Datum (ISO format)
- `endDate` (string, required) - End-Datum (ISO format)
- `userId` (string, optional) - Filter nach Benutzer-ID
- `projectId` (string, optional) - Filter nach Projekt-ID

**Response:**
```json
{
  "entries": [
    {
      "id": "uuid",
      "userId": "uuid",
      "user": { "firstName": "...", "lastName": "..." },
      "projectId": "uuid",
      "project": { "name": "..." },
      "clockIn": "2025-12-30T08:00:00Z",
      "clockOut": "2025-12-30T17:00:00Z",
      "hours": 8.5,
      "netHours": 8.0,
      "pauseMinutes": 30
    }
  ],
  "summary": {
    "totalHours": 160.5,
    "totalEntries": 20,
    "totalDays": 20.06,
    "byUser": [...],
    "byProject": [...]
  }
}
```

#### GET /api/reports/user-time-bookings/:userId
Ruft detaillierte Stundenbuchungen für einen einzelnen Benutzer ab.

**Path-Parameter:**
- `userId` (string, required) - Benutzer-ID

**Query-Parameter:**
- `startDate` (string, optional) - Start-Datum
- `endDate` (string, optional) - End-Datum

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "firstName": "...",
    "lastName": "...",
    "email": "..."
  },
  "period": {
    "startDate": "2025-11-01",
    "endDate": "2025-11-30"
  },
  "summary": {
    "totalHours": 160.5,
    "totalDays": 20.06,
    "totalEntries": 20
  },
  "dailyBreakdown": [...],
  "projectBreakdown": [...]
}
```

### PDF-Export-Endpunkte

#### GET /api/reports/time-bookings-pdf
Generiert PDF-Report für Stundenbuchungen (alle Benutzer).

**Query-Parameter:**
- `startDate` (string, required) - Start-Datum
- `endDate` (string, required) - End-Datum
- `userIds` (string, optional) - Komma-getrennte Liste von Benutzer-IDs
- `projectIds` (string, optional) - Komma-getrennte Liste von Projekt-IDs

**Response:** PDF-Datei (application/pdf)

#### GET /api/reports/user-time-bookings-pdf/:userId
Generiert PDF-Report für einen einzelnen Benutzer.

**Path-Parameter:**
- `userId` (string, required) - Benutzer-ID

**Query-Parameter:**
- `startDate` (string, required) - Start-Datum
- `endDate` (string, required) - End-Datum

**Response:** PDF-Datei (application/pdf)

## Frontend-Komponenten

### TimeBookingsReport
**Pfad:** `frontend/src/components/admin/TimeBookingsReport.tsx`

Hauptkomponente für den Stundenbuchungs-Report aller Benutzer.

**Features:**
- Filter nach Zeitraum, Mitarbeiter, Projekt
- Drei Ansichtsmodi (Alle, Nach Mitarbeiter, Nach Projekt)
- PDF-Export-Funktion
- Responsive Design

### UserTimeBookingsReport
**Pfad:** `frontend/src/components/admin/UserTimeBookingsReport.tsx`

Komponente für den individuellen Mitarbeiter-Stundenbuchungs-Report.

**Features:**
- Benutzerauswahl
- Zeitraumfilter
- Zwei Ansichtsmodi (Tagesübersicht, Projektübersicht)
- PDF-Export-Funktion
- Prozentuale Visualisierung

## Frontend-Services

### reportService
**Pfad:** `frontend/src/services/report.service.ts`

Erweiterte Methoden:

```typescript
// Detaillierte Stundenbuchungen abrufen
getDetailedTimeBookings(
  startDate?: string,
  endDate?: string,
  userId?: string,
  projectId?: string
): Promise<any>

// Benutzer-Stundenbuchungs-Report abrufen
getUserTimeBookingsReport(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<any>

// PDF-Export für alle Stundenbuchungen
downloadTimeBookingsPDF(
  startDate: string,
  endDate: string,
  userIds?: string[],
  projectIds?: string[]
): Promise<void>

// PDF-Export für einzelnen Benutzer
downloadUserTimeBookingsPDF(
  userId: string,
  startDate: string,
  endDate: string
): Promise<void>
```

## Backend-Services

### pdf.service.ts
**Pfad:** `backend/src/services/pdf.service.ts`

Neue Export-Funktion:

```typescript
// Generiert PDF-Report für Stundenbuchungen
export const generateTimeBookingsReport = async (
  startDate: Date,
  endDate: Date,
  userIds?: string[],
  projectIds?: string[]
): Promise<Buffer>
```

## Datenmodell

Die Reports basieren auf dem bestehenden `TimeEntry`-Modell:

```prisma
model TimeEntry {
  id          String           @id @default(uuid())
  userId      String
  projectId   String?
  locationId  String?
  clockIn     DateTime
  clockOut    DateTime?
  status      TimeEntryStatus  @default(CLOCKED_IN)
  description String?
  pauseMinutes Int?            @default(0)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  user     User      @relation(...)
  project  Project?  @relation(...)
  location Location? @relation(...)
  projectTimeAllocations ProjectTimeAllocation[]
}
```

## Berechtigungen

Die neuen Reports sind nur für Benutzer mit folgenden Berechtigungen zugänglich:
- **ADMIN-Rolle** oder
- **Modul "reports"** aktiviert

## Verwendung

### Stundenbuchungs-Report (Alle Benutzer)

1. Navigieren Sie zu **Admin Dashboard**
2. Klicken Sie auf **"📋 Stundenbuchungen (Alle)"**
3. Wählen Sie Filter aus:
   - Zeitraum (oder nutzen Sie Quick-Select)
   - Optional: Mitarbeiter
   - Optional: Projekt
4. Klicken Sie auf **"🔍 Report laden"**
5. Wählen Sie einen Ansichtsmodus
6. Optional: Klicken Sie auf **"📄 PDF exportieren"**

### Mitarbeiter Stundenbuchungs-Report

1. Navigieren Sie zu **Admin Dashboard**
2. Klicken Sie auf **"👤 Stundenbuchungen (User)"**
3. Wählen Sie einen Mitarbeiter aus
4. Wählen Sie einen Zeitraum (oder nutzen Sie Quick-Select)
5. Klicken Sie auf **"🔍 Report laden"**
6. Wählen Sie einen Ansichtsmodus
7. Optional: Klicken Sie auf **"📄 PDF exportieren"**

## Technische Details

### Zeitberechnung
- **Bruttostunden:** clockOut - clockIn
- **Pausenzeit:** pauseMinutes (in Minuten)
- **Nettostunden:** Bruttostunden - (Pausenzeit / 60)
- **Arbeitstage:** Nettostunden / 8

### PDF-Format
- **Alle Benutzer:** A4 Querformat (Landscape)
- **Einzelner Benutzer:** A4 Hochformat (Portrait)
- **Schriftart:** Helvetica
- **Kodierung:** UTF-8
- **Datumsformat:** DD.MM.YYYY (de-CH)
- **Zeitformat:** HH:mm (24h)

### Performance-Optimierung
- Daten werden nach Bedarf geladen (Lazy Loading)
- Paginierung für große Datenmengen
- Effiziente Datenbankabfragen mit Prisma
- Caching für wiederholte Abfragen

## Zukünftige Erweiterungen

Mögliche zukünftige Features:
- Export nach Excel/CSV
- Automatische E-Mail-Versand von Reports
- Geplante Reports (Cronjobs)
- Erweiterte Visualisierungen (Charts)
- Vergleichsansichten (z.B. Monat zu Monat)
- Export nach Excel mit Charts
- Team-Reports (nach Abteilungen/Gruppen)

## Fehlerbehebung

### PDF wird nicht generiert
- Überprüfen Sie, ob `pdfkit` korrekt installiert ist
- Prüfen Sie Backend-Logs auf Fehler
- Stellen Sie sicher, dass Daten im gewählten Zeitraum vorhanden sind

### Keine Daten werden angezeigt
- Prüfen Sie die Filter-Einstellungen
- Stellen Sie sicher, dass Zeiteinträge im System vorhanden sind
- Prüfen Sie die Benutzerberechtigungen

### Performance-Probleme bei großen Datenmengen
- Begrenzen Sie den Zeitraum
- Nutzen Sie spezifische Filter (Benutzer/Projekt)
- Erwägen Sie Datenbankindizes für häufige Abfragen

## Support

Bei Fragen oder Problemen:
1. Prüfen Sie die Backend-Logs: `backend/logs/`
2. Prüfen Sie die Browser-Konsole auf Fehler
3. Kontaktieren Sie den Administrator

## Changelog

### Version 1.0.0 (2025-12-30)
- ✅ Initiales Release
- ✅ Stundenbuchungs-Report für alle Benutzer
- ✅ Mitarbeiter Stundenbuchungs-Report
- ✅ PDF-Export für beide Report-Typen
- ✅ Flexible Filter und Ansichtsmodi
- ✅ Responsive Design
- ✅ Integration in Admin Dashboard
