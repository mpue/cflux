# Zeiterfassungssystem mit Swiss Compliance

Ein vollständiges Zeiterfassungssystem mit TypeScript, Node.js Backend, React Frontend und PostgreSQL Datenbank. Speziell entwickelt für Schweizer Arbeitsgesetz (ArG/ArGV 1) Compliance.

## Features

### Für Benutzer
- ✅ Ein-/Ausstempeln mit Button
- ✅ Live-Uhr in der Titelleiste
- ✅ Zeiterfassung auf Projekte und Standorte buchen
- ✅ Urlaubsanträge stellen
- ✅ Abwesenheitsanträge (Krankheit, persönliche Gründe, etc.)
- ✅ Übersicht eigener Arbeitszeiten
- ✅ Persönliche Reports und Statistiken
- ✅ Mobile-responsive Design für Smartphone-Nutzung

### Für Administratoren
- ✅ Benutzerverwaltung (anlegen, bearbeiten, löschen, deaktivieren)
- ✅ Erweiterte Personalien (Adresse, Telefon, Personalnummer, Bankverbindung, AHV-Nummer, Grenzgänger-Status)
- ✅ Projektverwaltung mit Zuweisung
- ✅ Standortverwaltung (Homeoffice, Büro, etc.)
- ✅ Genehmigung/Ablehnung von Abwesenheitsanträgen
- ✅ Zeitkorrekturen durchführen
- ✅ Reports für alle Mitarbeiter generieren
- ✅ **Urlaubsplaner** - Jahresübersicht aller Abwesenheiten
- ✅ **Backup & Restore** - Automatische PostgreSQL Backups
- ✅ **Swiss Compliance Dashboard** (siehe unten)

### 🇨🇭 Swiss Compliance Features (ArG/ArGV 1)

Das System überwacht automatisch die Einhaltung des Schweizer Arbeitsgesetzes:

#### Automatische Violations-Erkennung
- ⚠️ **Ruhezeit (11h)** - Min. 11 Stunden zwischen Arbeitstagen (Art. 15a ArG)
- ⚠️ **Tägliche Höchstarbeitszeit (12.5h)** - Max. 12,5 Stunden pro Tag (Art. 9 ArG)
- ⚠️ **Wöchentliche Höchstarbeitszeit** - 45h oder 50h je nach Kategorie (Art. 9 ArG)
- ⚠️ **Pausenregelung** - Automatische Prüfung bei >5.5h, >7h, >9h Arbeitszeit (Art. 15 ArGV 1)
- ⚠️ **Überstundenlimits** - Tracking von regulären Überstunden und Mehrarbeit

#### Compliance Dashboard
- 📊 Echtzeit-Statistiken zu Violations
- 🔴 Kritische vs. Warnungs-Violations
- 👥 Top-Benutzer mit Verstößen
- 📋 Detaillierte Violations-Tabelle mit Filter
- ✅ Violations auflösen mit Notizen
- 📅 Kantonsbasierte Feiertage (alle 26 Kantone)

#### Pro-User Einstellungen
- Wöchentliche Höchstarbeitszeit (45h Standard / 50h)
- Vertragliche Wochenstunden für Überstunden-Berechnung
- Kanton für Feiertage
- Freistellung von Arbeitszeiterfassung (Kaderpersonal)

#### Überstunden-Management
- **Reguläre Überstunden** - Differenz zwischen vertraglichen und gesetzlichen Stunden
- **Mehrarbeit (Extra Time)** - Über gesetzliche Höchstarbeitszeit hinaus
- Jahres-Saldo pro Benutzer
- Automatische Berechnung bei jedem Ausstempeln

## Technologie Stack

### Backend
- Node.js 20 & Express 4.18
- TypeScript 5.3
- PostgreSQL 16 mit Prisma 5.8 ORM
- JWT Authentication
- bcrypt für Passwort-Hashing
- Swiss Compliance Service (ArG/ArGV 1)

### Frontend
- React 18
- TypeScript 4.9
- React Router 6 für Navigation
- Axios für API-Kommunikation
- Recharts für Diagramme
- Mobile-first responsive CSS

### DevOps
- Docker & Docker Compose
- Multi-stage builds für optimierte Images
- Nginx als Reverse Proxy
- Health Checks für alle Services
- Automatische PostgreSQL Backups

## Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)
*Benutzer-Dashboard mit aktueller Zeit, Clock-In/Out, und Zeiteinträgen*

### Admin Panel
![Admin Panel](docs/screenshots/admin-panel.png)
*Verwaltung von Benutzern, Projekten, Standorten und Reports*

### Swiss Compliance Dashboard
![Compliance Dashboard](docs/screenshots/compliance-dashboard.png)
*Echtzeit-Überwachung von ArG/ArGV 1 Violations mit Statistiken*

### Urlaubsplaner
![Urlaubsplaner](docs/screenshots/vacation-planner.png)
*Jahresübersicht aller Mitarbeiter-Abwesenheiten*

### Mobile Ansicht
![Mobile View](docs/screenshots/mobile-view.png)
*Touch-freundliches Design für Smartphone-Nutzung*

> **Hinweis:** Screenshots befinden sich im `docs/screenshots/` Verzeichnis. Erstelle dieses Verzeichnis und füge aktuelle Screenshots hinzu.

## Installation

### Option 1: Mit Docker (Empfohlen) 🐳

Die einfachste Methode, um das System zu starten - **komplett über den Browser!**

#### Voraussetzungen
- Docker Desktop (Windows/Mac) oder Docker Engine (Linux)
- Docker Compose

#### 🚀 Schnellstart (3 einfache Schritte!)

**1. Repository klonen und starten:**
```bash
git clone <repository-url>
cd cflux
docker-compose up --build -d
```

**2. Warten bis alles läuft (ca. 30-60 Sekunden)**
```bash
docker-compose logs -f backend
```
Warten Sie auf die Meldung: "Server running on port 3001"

**3. Browser öffnen und fertig! 🎉**
```
http://localhost:3002
```

#### 🔐 Erster Login

**Standard Admin-Zugangsdaten:**
- **Email:** `admin@timetracking.local`
- **Passwort:** `admin123`

**⚠️ Wichtig:** Beim ersten Login werden Sie automatisch aufgefordert, Ihr Passwort zu ändern. Dies geschieht komplett im Browser - keine Kommandozeilen-Befehle nötig!

#### Das war's! ✨

Keine komplizierten Setup-Schritte, keine Datenbank-Befehle, keine Credential-Dateien.  
Einfach klonen, starten, Browser öffnen und loslegen!

#### System-URLs
- **Frontend:** http://localhost:3002
- **Backend API:** http://localhost:3001
- **API Health:** http://localhost:3001/health

#### Nützliche Docker Befehle

```bash
# Services starten
docker-compose up -d

# Services mit Neuaufbau starten
docker-compose up --build -d

# Logs anzeigen
docker-compose logs -f backend

# Services stoppen
docker-compose down

# Datenbank zurücksetzen (ACHTUNG: Löscht alle Daten!)
docker-compose down -v
docker-compose up -d
# Beim nächsten Start: Admin-Login ist wieder admin123
```

### Option 2: Manuelle Installation

#### Voraussetzungen
- Node.js (v18 oder höher)
- PostgreSQL (v14 oder höher)
- npm oder yarn

#### Backend Setup

1. Navigate zum Backend-Verzeichnis:
```bash
cd backend
```

2. Installiere Dependencies:
```bash
npm install
```

3. Erstelle eine `.env` Datei basierend auf `.env.example`:
```bash
cp .env.example .env
```

4. Konfiguriere die Datenbank in `.env`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/timetracking?schema=public"
JWT_SECRET="dein-geheimer-schlüssel"
```

5. Führe Prisma Migrationen aus:
```bash
npm run prisma:migrate
```

6. Generiere Prisma Client:
```bash
npm run prisma:generate
```

7. Starte den Development Server:
```bash
npm run dev
```

Der Backend-Server läuft nun auf `http://localhost:3001`

### Frontend Setup

1. Navigate zum Frontend-Verzeichnis:
```bash
cd frontend
```

2. Installiere Dependencies:
```bash
npm install
```

3. Starte den Development Server:
```bash
npm start
```

Das Frontend läuft nun auf `http://localhost:3000`

## Erste Schritte

1. System starten (siehe Installation oben)
2. Browser öffnen: **http://localhost:3002**
3. Registriere einen neuen Benutzer über `/register`
4. Den ersten Benutzer zum Admin machen:
   
   **Mit Docker:**
   ```bash
   docker exec -it timetracking-db psql -U timetracking -d timetracking -c "UPDATE users SET role = 'ADMIN' WHERE email = 'deine@email.com';"
   ```
   
   **Ohne Docker:**
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'deine@email.com';
   ```

5. Als Admin anmelden und System verwenden!
6. **Optional:** Swiss Compliance aktivieren:
   - Gehe zu Admin Panel → Users
   - Bearbeite Benutzer → 🇨🇭 Compliance Tab
   - Setze wöchentliche Höchstarbeitszeit (45h/50h)
   - Wähle Kanton für Feiertage
   - Violations werden automatisch bei Clock-In/Out geprüft

## API Endpunkte

### Authentication
- `POST /api/auth/register` - Benutzer registrieren
- `POST /api/auth/login` - Benutzer anmelden

### Users
- `GET /api/users/me` - Aktueller Benutzer
- `GET /api/users` - Alle Benutzer (Admin)
- `GET /api/users/:id` - Benutzer Details (Admin)
- `PUT /api/users/:id` - Benutzer aktualisieren (Admin)
- `DELETE /api/users/:id` - Benutzer löschen (Admin)

### Time Tracking
- `POST /api/time/clock-in` - Einstempeln
- `POST /api/time/clock-out` - Ausstempeln
- `GET /api/time/current` - Aktueller Zeiteintrag
- `GET /api/time/my-entries` - Eigene Zeiteinträge
- `GET /api/time/user/:userId` - Benutzer Zeiteinträge (Admin)
- `PUT /api/time/:id` - Zeiteintrag korrigieren (Admin)
- `DELETE /api/time/:id` - Zeiteintrag löschen (Admin)

### Projects
- `GET /api/projects` - Alle Projekte
- `GET /api/projects/my-projects` - Eigene Projekte
- `POST /api/projects` - Projekt erstellen (Admin)
- `PUT /api/projects/:id` - Projekt aktualisieren (Admin)
- `DELETE /api/projects/:id` - Projekt löschen (Admin)
- `POST /api/projects/:id/assign` - Benutzer zuweisen (Admin)
- `DELETE /api/projects/:id/unassign/:userId` - Benutzer entfernen (Admin)

### Absences
- `POST /api/absences` - Abwesenheitsantrag erstellen
- `GET /api/absences/my-requests` - Eigene Anträge
- `GET /api/absences` - Alle Anträge (Admin)
- `PUT /api/absences/:id/approve` - Antrag genehmigen (Admin)
- `PUT /api/absences/:id/reject` - Antrag ablehnen (Admin)
- `DELETE /api/absences/:id` - Antrag löschen (Admin)

### Locations
- `GET /api/locations` - Alle Standorte
- `POST /api/locations` - Standort erstellen (Admin)
- `PUT /api/locations/:id` - Standort aktualisieren (Admin)
- `DELETE /api/locations/:id` - Standort löschen (Admin)

### Swiss Compliance
- `GET /api/compliance/holidays` - Feiertage nach Jahr & Kanton
- `POST /api/compliance/holidays/sync` - Feiertage von API synchronisieren
- `GET /api/compliance/violations` - Violations (gefiltert)
- `GET /api/compliance/violations/stats` - Violations Statistiken
- `PATCH /api/compliance/violations/:id/resolve` - Violation auflösen
- `GET /api/compliance/overtime/:userId` - Überstunden-Saldo
- `GET /api/compliance/settings` - Compliance Einstellungen

### Backup & Restore
- `POST /api/backup/create` - Backup erstellen
- `GET /api/backup/list` - Alle Backups auflisten
- `GET /api/backup/download/:filename` - Backup herunterladen
- `POST /api/backup/restore/:filename` - Backup wiederherstellen
- `DELETE /api/backup/:filename` - Backup löschen
- `POST /api/backup/upload` - Backup hochladen
- `GET /api/backup/export` - Daten als JSON exportieren

### Reports
- `GET /api/reports/my-summary` - Eigene Zusammenfassung
- `GET /api/reports/user-summary/:userId` - Benutzer Zusammenfassung (Admin)
- `GET /api/reports/all-users-summary` - Alle Benutzer (Admin)
- `GET /api/reports/project-summary/:projectId` - Projekt Zusammenfassung (Admin)

## Datenbankmodell

### User
- ID, Email, Password (gehasht)
- Vorname, Nachname
- Rolle (USER/ADMIN)
- Urlaubstage, Aktiv-Status
- **Erweiterte Felder:**
  - Personalien (Geburtsdatum, Geburtsort, Nationalität)
  - Adresse (Strasse, PLZ, Ort, Land)
  - Kontakt (Telefon, Mobile)
  - Anstellung (Personalnummer, Eintrittsdatum, Austrittsdatum)
  - Banking (IBAN, Bankname)
  - Persönlich (Zivilstand, Konfession, AHV-Nummer, Grenzgänger)
  - **Swiss Compliance (weeklyHours, canton, exemptFromTracking, contractHours)**

### TimeEntry
- ID, Benutzer-ID, Projekt-ID, Standort-ID
- Einstempeln, Ausstempeln
- Status (CLOCKED_IN/CLOCKED_OUT)
- Beschreibung

### Project
- ID, Name, Beschreibung, Aktiv-Status
- Benutzerzuweisungen (ProjectAssignment)

### Location
- ID, Name, Beschreibung, Aktiv-Status

### AbsenceRequest
- ID, Benutzer-ID, Typ, Start, Ende
- Status (PENDING/APPROVED/REJECTED)
- Grund, Admin-Notizen

### Holiday
- ID, Datum, Name, Kanton, Prozentsatz
- Für alle 26 Schweizer Kantone + nationale Feiertage

### ComplianceViolation
- ID, Benutzer-ID, Typ, Severity (CRITICAL/WARNING)
- Datum, Beschreibung, actual/required Values
- resolved, resolvedAt, resolvedBy, Notizen

### OvertimeBalance
- ID, Benutzer-ID, Jahr
- regularOvertime (vertragliche Überstunden)
- extraTime (Mehrarbeit über gesetzlichem Limit)
- lastCalculated

### ComplianceSettings
- ID, settingKey, settingValue
- Für system-weite Compliance-Konfiguration
Mit Docker (Live-Reload für Entwicklung)

Für Entwicklung mit automatischem Reload, benutze die lokale Installation statt Docker.

### Backend Development (Lokal)
```bash
cd backend
npm run dev
```

### Frontend Development (Lokal)
```bash
cd frontend
npm start
```

### Prisma Studio (Datenbank GUI)
```bash
# Mit Docker
docker exec -it timetracking-backend npx prisma studio

# Ohne Docker
cd backend
npm run prisma:studio
```

### Production Deployment

#### Mit Docker
```bash
# Production Build und Start
docker-compose up -d --build

# Nur Backend neu bauen
docker-compose up -d --build backend

# Nur Frontend neu bauen
docker-compose up -d --build frontend
```

#### Ohne Docker
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Serve the build folder with nginx or another static server
```

## Docker Container Details

### Services
- **db** - PostgreSQL 16 Alpine (Port 5432)
- **backend** - Node.js 20 API (Port 3001)
- **frontend** - Nginx Alpine serving React app (Port 3002)

### Volumes
- `postgres_data` - Persistente Datenbank-Daten
- `./backend/backups` - PostgreSQL Backup-Dateien

### Network
- `timetracking-network` - Internes Bridge-Netzwerk für Service-Kommunikation

### Health Checks
Alle Container haben Health Checks implementiert:
- **db** - `pg_isready` Check
- **backend** - HTTP Check auf `/health` Endpoint
- **frontend** - Nginx Process Check

### Umgebungsvariablen anpassen

Bearbeite `docker-compose.yml` um Produktions-Credentials zu setzen:
```yaml
environment:
  POSTGRES_PASSWORD: dein-sicheres-passwort
  JWT_SECRET: dein-sehr-sicherer-jwt-secret
```

## Besondere Features

### Automatische Backup-Funktion
Das System erstellt automatisch PostgreSQL Backups:
- Manuell über Admin Panel → Backup & Restore
- Backups werden in `backend/backups/` gespeichert
- Download, Upload und Restore von Backups
- JSON-Export für Datenanalyse

### Live-Uhr
Die aktuelle Uhrzeit wird in der Titelleiste angezeigt und aktualisiert sich jede Sekunde.

### Responsive Design
Das komplette Interface ist für Mobile-Geräte optimiert:
- Touch-freundliche Buttons
- Responsive Tables mit horizontalem Scroll
- Mobile Navigation
- Optimierte Formulare

### Urlaubsplaner
Jahresübersicht aller Mitarbeiter-Abwesenheiten:
- Kalender-Grid mit allen Tagen des Jahres
- Farbcodierung nach Abwesenheitstyp
- Filter nach Benutzer und Typ
- Schnellnavigation zu Monaten

### Swiss Compliance Integration
Das System prüft automatisch bei jedem Clock-In/Out:
1. Ruhezeit seit letztem Clock-Out (min. 11h)
2. Tägliche Arbeitszeit (max. 12.5h)
3. Wöchentliche Arbeitszeit (45h/50h)
4. Fehlende Pausen (15min/30min/60min)
5. Überstunden-Akkumulation
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Serve the build folder with a static server
```

## Sicherheit

- Passwörter werden mit bcrypt (10 Rounds) gehasht
- JWT Tokens für Authentication mit konfigurierbarem Secret
- CORS aktiviert für Frontend-Backend Kommunikation
- Input-Validierung mit express-validator
- SQL-Injection Schutz durch Prisma ORM
- Helmet.js für Security Headers
- Rate Limiting auf API-Endpoints
- HTTPS-ready (in Produktion empfohlen)

## Testing

### Unit Tests (Backend)

```bash
cd backend
npm test
```

Das Backend verwendet Jest für Unit- und Integrationstests der Services, Controller und Middleware.

### E2E Tests (Playwright)

Das Projekt verwendet Playwright für End-to-End UI-Tests:

```bash
# Stelle sicher, dass Docker läuft
docker-compose up -d

# Schnelle Smoke-Tests (empfohlen)
npm run test:smoke

# Alle E2E-Tests
npm test

# Tests im UI Mode (interaktiv)
npm run test:ui

# Spezifische Tests
npm run test:auth         # Nur Login-Tests
npm run test:chromium     # Nur Chromium Browser
```

**Verfügbare Test-Suites:**
- `smoke.spec.ts` - ✅ Grundlegende Funktionalität (5 Tests, alle bestehen)
- `auth.spec.ts` - Login/Logout (5 Tests)
- `dashboard.spec.ts` - Dashboard Navigation (4 Tests)
- `time-tracking.spec.ts` - Zeiterfassung (6 Tests)
- `projects.spec.ts` - Projekt-Management (3 Tests)
- `admin.spec.ts` - Admin-Funktionen & Berechtigungen (6 Tests)
- `intranet.spec.ts` - Intranet Dokumenten-Management (4 Tests)

**Test Reports:**
```bash
# HTML Report anzeigen
npx playwright show-report

# Code Generator für neue Tests
npm run test:codegen
```

**Dokumentation:** Siehe [docs/PLAYWRIGHT_TESTING.md](docs/PLAYWRIGHT_TESTING.md) für Details.

### CI/CD

GitHub Actions führt automatisch Playwright-Tests aus bei:
- Push auf `main` oder `develop` Branches
- Pull Requests
- Manueller Workflow-Auslösung

## Compliance & Rechtliches

### Schweizer Arbeitsgesetz (ArG/ArGV 1)
Das System implementiert Überwachung gemäss:
- **Art. 9 ArG** - Höchstarbeitszeit (45h/50h Woche, 12.5h Tag)
- **Art. 15 ArGV 1** - Pausen (15min/30min/60min)
- **Art. 15a ArG** - Ruhezeit (11h zwischen Arbeitstagen)

**Wichtig:** Dieses System dient der Unterstützung, ersetzt aber keine rechtliche Beratung. Arbeitgeber sind selbst verantwortlich für die Einhaltung aller gesetzlichen Bestimmungen.

### Datenschutz (DSG/DSGVO)
- Benutzer-Daten werden verschlüsselt gespeichert
- Passwörter sind nicht im Klartext einsehbar
- Backup-Funktion für Datenportabilität
- Admin-Zugriff wird geloggt

## Bekannte Einschränkungen

- Überstunden-Berechnung basiert auf wöchentlichen Limits, nicht auf flexiblen Arbeitszeit-Modellen
- Nachtarbeit (23:00-06:00) wird noch nicht speziell geprüft
- Sonntagsarbeit hat keine separate Violation
- Keine Integration mit externen HR-Systemen (SAP, etc.)

## Roadmap / Geplante Features

- [ ] Mobile Apps (iOS/Android)
- [ ] Nachtarbeits-Violations (Art. 16 ArG)
- [ ] Sonntagsarbeits-Tracking
- [ ] Flexible Arbeitszeit-Modelle
- [ ] Integration mit Lohnbuchhaltungs-Software
- [ ] Erweiterte Reporting (PDF/Excel Export)
- [ ] Multi-Mandanten-Fähigkeit
- [ ] SSO/LDAP Integration
- [ ] Geofencing für Location-Based Clock-In

## Lizenz

MIT

## Autor

Zeiterfassungssystem - Erstellt mit TypeScript, React und Node.js
