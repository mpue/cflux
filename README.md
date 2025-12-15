# Zeiterfassungssystem

Ein vollständiges Zeiterfassungssystem mit TypeScript, Node.js Backend, React Frontend und PostgreSQL Datenbank.

## Features

### Für Benutzer
- ✅ Ein-/Ausstempeln mit Button
- ✅ Zeiterfassung auf Projekte buchen
- ✅ Urlaubsanträge stellen
- ✅ Abwesenheitsanträge (Krankheit, persönliche Gründe, etc.)
- ✅ Übersicht eigener Arbeitszeiten
- ✅ Persönliche Reports und Statistiken

### Für Administratoren
- ✅ Benutzerverwaltung (anlegen, bearbeiten, löschen, deaktivieren)
- ✅ Projektverwaltung
- ✅ Genehmigung/Ablehnung von Abwesenheitsanträgen
- ✅ Zeitkorrekturen durchführen
- ✅ Reports für alle Mitarbeiter generieren
- ✅ Urlaubstage verwalten

## Technologie Stack

### Backend
- Node.js & Express
- TypeScript
- PostgreSQL mit Prisma ORM
- JWT Authentication
- bcrypt für Passwort-Hashing

### Frontend
- React 18
- TypeScript
- React Router für Navigation
- Axios für API-Kommunikation
- CSS für Styling

## Installation

### Option 1: Mit Docker (Empfohlen) 🐳

Die einfachste Methode, um das System zu starten:

#### Voraussetzungen
- Docker Desktop (Windows/Mac) oder Docker Engine (Linux)
- Docker Compose

#### Schnellstart

1. Klone oder navigiere zum Projektverzeichnis:
```bash
cd cflux
```

2. Starte alle Services mit Docker Compose:
```bash
docker-compose up -d
```

Das wars! Das System startet automatisch:
- PostgreSQL Datenbank auf Port 5432
- Backend API auf http://localhost:3001
- Frontend auf http://localhost:3000

3. Erstelle den ersten Admin-Benutzer:
```bash
# Registriere einen Benutzer über die Web-Oberfläche
# Dann verbinde dich mit der Datenbank:
docker exec -it timetracking-db psql -U timetracking -d timetracking -c "UPDATE users SET role = 'ADMIN' WHERE email = 'deine@email.com';"
```

#### Nützliche Docker Befehle

```bash
# Services starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Services stoppen
docker-compose down

# Services neu bauen
docker-compose up -d --build

# Datenbank zurücksetzen (ACHTUNG: Löscht alle Daten!)
docker-compose down -v
docker-compose up -d
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
2. Browser öffnen: http://localhost:3000
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
- Urlaubstage
- Aktiv-Status

### TimeEntry
- ID, Benutzer-ID, Projekt-ID
- Einstempeln, Ausstempeln
- Status (CLOCKED_IN/CLOCKED_OUT)
- Beschreibung

### Project
- ID, Name, Beschreibung
- Aktiv-Status
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
- **backend** - Node.js API (Port 3001)
- **frontend** - Nginx serving React app (Port 3000)

### Volumes
- `postgres_data` - Persistente Datenbank-Daten

### Network
- `timetracking-network` - Internes Bridge-Netzwerk für Service-Kommunikation

### Umgebungsvariablen anpassen

Bearbeite `docker-compose.yml` um Produktions-Credentials zu setzen:
```yaml
environment:
  POSTGRES_PASSWORD: dein-sicheres-passwort
  JWT_SECRET: dein-sehr-sicherer-jwt-secret
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

- Passwörter werden mit bcrypt gehasht
- JWT Tokens für Authentication
- CORS aktiviert für Frontend-Backend Kommunikation
- Input-Validierung mit express-validator
- SQL-Injection Schutz durch Prisma

## Lizenz

MIT

## Autor

Zeiterfassungssystem - Erstellt mit TypeScript, React und Node.js
