# Automatische Installation beim ersten Start

## Übersicht

Das Docker-Setup wurde so erweitert, dass beim ersten Start automatisch ein vollständiger Installationsprozess durchläuft wird - **komplett ohne manuelle Kommandozeilen-Interaktion!**

## 🎯 Ziel: Null Stolpersteine

Sie sollten in der Lage sein:
1. Repository klonen
2. `docker-compose up --build -d` ausführen
3. Browser öffnen
4. **Fertig!**

Alles weitere läuft über den Browser.

## Was passiert beim ersten Start?

### 1. Datenbank-Check
Das System prüft automatisch, ob bereits Benutzer in der Datenbank existieren.

### 2. Installations-Schritte (nur beim ersten Start)

Wenn keine Benutzer gefunden werden, läuft der Installationsprozess ab:

#### a) Module installieren
Alle Systemmodule werden automatisch angelegt:
- Dashboard
- Zeiterfassung
- Projekte
- Kunden
- Lieferanten
- Artikel & Artikelgruppen
- Rechnungen & Mahnungen
- Abwesenheiten
- Berichte
- Backup
- Compliance
- Vorfälle & Workflows

#### b) Admin-Benutzer anlegen
Ein Admin-Benutzer wird mit festen Standard-Credentials erstellt:
- **Email**: `admin@timetracking.local`
- **Passwort**: `admin123`
- **Flag**: `requiresPasswordChange = true`

### 3. Login und Passwortänderung

**Alles über den Browser:**

1. Öffnen Sie http://localhost:3002
2. Melden Sie sich an:
   - Email: `admin@timetracking.local`
   - Passwort: `admin123`
3. **Automatisch wird ein Modal angezeigt**, das Sie zwingt, Ihr Passwort zu ändern
4. Ändern Sie Ihr Passwort
5. Fertig! Sie sind im System

**Keine Kommandozeilen-Befehle nötig!**

## Verwendung

### Schnellstart

```bash
# 1. Repository klonen
git clone <repository-url>
cd cflux

# 2. Docker starten
docker-compose up --build -d

# 3. Browser öffnen
# http://localhost:3002

# 4. Anmelden
# Email: admin@timetracking.local
# Passwort: admin123

# 5. Passwort ändern (im Browser-Modal)
```

### Credentials

**Standard Admin-Login:**
- Email: `admin@timetracking.local`
- Passwort: `admin123`

Diese Credentials sind **immer gleich** beim ersten Start.  
Kein Suchen in Logs oder Dateien nötig!

## Passwort ändern

### Backend-Endpoint

```http
POST /api/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "temporäres-passwort",
  "newPassword": "neues-sicheres-passwort"
}
```

### Response bei Erfolg

```json
{
  "message": "Password changed successfully"
}
```

Nach erfolgreicher Änderung wird das `requiresPasswordChange`-Flag automatisch auf `false` gesetzt.

## Frontend-Integration

### Login Response

Die Login-Response enthält jetzt ein zusätzliches Feld:

```json
{
  "user": {
    "id": "...",
    "email": "admin@timetracking.local",
    "firstName": "System",
    "lastName": "Administrator",
    "role": "ADMIN",
    "requiresPasswordChange": true
  },
  "token": "..."
}
```

### Automatisches Modal

Das Frontend prüft nach dem Login automatisch `user.requiresPasswordChange`:

```typescript
React.useEffect(() => {
  if (user && user.requiresPasswordChange) {
    setShowPasswordChangeModal(true); // Modal wird angezeigt
  } else if (user && !user.requiresPasswordChange) {
    navigate('/dashboard'); // Weiter zum Dashboard
  }
}, [user, navigate]);
```
Standard-Passwort

Das Standard-Passwort `admin123` ist:
- ✅ **Einfach zu merken** - keine Suche in Logs nötig
- ✅ **Dokumentiert** - steht im README und Quick Start Guide
- ⚠️ **Temporär** - MUSS beim ersten Login geändert werden
- 🔒 **Sicher im Setup** - Änderung wird durch `requiresPasswordChange` Flag erzwungen

### Für Entwickler

1. **Passwort ändern**: Wird automatisch beim ersten Login erzwungen (im Browser)
2. **Standard bekannt**: Das ist kein Problem, da die Änderung erzwungen wird
3. **Logs sauber**: Keine zufälligen Passwörter, die gespeichert werden müssen

### Für Produktiv-Umgebungen

1. **JWT_SECRET ändern**: Setzen Sie in `docker-compose.yml` einen sicheren JWT_SECRET
2. **Datenbank-Passwort**: Ändern Sie das Postgres-Passwort
3. **CORS konfigurieren**: Setzen Sie `CORS_ORIGIN` auf Ihre Frontend-Domain
4. **Backup**: Richten Sie regelmäßige Datenbank-Backups ein
5. **Admin-Passwort**: Wird automatisch beim ersten Login geändert - Browser-Workflow
## Sicherheitshinweise

### Für Entwickler

1. **Credentials sichern**: Kopieren Sie die Zugangsdaten und löschen Sie `/tmp/admin-credentials.txt`
2. **Passwort ändern**: Ändern Sie das Passwort sofort nach dem ersten Login
3. **Logs überprüfen**: Stellen Sie sicher, dass keine Credentials in öffentlichen Logs erscheinen

### Für Produktiv-Umgebungen

1. **JWT_SECRET ändern**: Setzen Sie in `docker-compose.yml` einen sicheren JWT_SECRET
2. **Datenbank-Passwort**: Ändern Sie das Postgres-Passwort
3. **CORS konfigurieren**: Setzen Sie `CORS_ORIGIN` auf Ihre Frontend-Domain
4. **Backup**: Richten Sie regelmäßige Datenbank-Backups ein

## Technische Details

### Skripte

- `/app/scripts/install.ts` - Hauptinstallations-Skript
- `/app/scripts/setup-admin.ts` - Admin-Benutzer-Setup
- `/app/prisma/seedModules.ts` - Modul-Initialisierung

### Ablauf im Dockerfile

1. Container startet
2. Warte auf Datenbank (5 Sekunden)
3. Führe Prisma Migrations aus
4. Prüfe Installation-Status
5. Falls neu: Installiere Module und Admin
6. Starte Node.js Server

### Datenbank-Schema

```prisma
model User {ann mich nicht anmelden

**Lösung**: Verwenden Sie die Standard-Credentials:
- Email: `admin@timetracking.local`
- Passwort: `admin123`

Falls Sie Ihr Passwort vergessen haben, setzen Sie das System zurück:
```bash
docker-compose down -v
docker-compose up -d
# Admin-Login ist wieder: admin123
```

### Problem: Passwort-Änderung schlägt fehl

**Lösung**: Prüfen Sie:
1. Ist das JWT-Token gültig?
2. Ist das aktuelle Passwort korrekt? (sollte `admin123` sein beim ersten Login)
3. Erfüllt das neue Passwort die Mindestanforderungen (min. 6 Zeichen)?
4. Stimmen die beiden neuen Passwort-Eingaben überein?

### Problem: Modal wird nicht angezeigt

**Lösung**: 
1. Browser-Cache leeren
2. Console im Browser öffnen (F12) und nach Fehlern suchen
3. Prüfen ob der User wirklich `requiresPasswordChange: true` hat:
```bash
docker exec timetracking-backend npx prisma studio
# Öffnet Prisma Studio im Browser
```
docker logs timetracking-backend --tail 100
```

### Problem: Passwort-Änderung schlägt fehl

**Lösung**: Prüfen Sie:
1. Ist das JWT-Token gültig?
2. Ist das aktuelle Passwort korrekt?
3. Erfüllt das neue Passwort die Mindestanforderungen (min. 6 Zeichen)?

### Problem: Installation läuft mehrfach

**Lösung**: Das sollte nicht passieren, da geprüft wird, ob bereits Benutzer existieren. Falls doch:
1. Container stoppen: `docker-compose down`
2. Volume löschen: `docker volume rm timetracking_postgres_data`
3. Neu starten: `docker-compose up -d`

### Problem: Migration schlägt fehl

**Lösung**: 
```bash
# Container neu bauen
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Manuelle Installation (falls automatisch fehlschlägt)

Falls die automatische Installation aus irgendeinem Grund fehlschlägt:

```bash
# In Backend-Container einloggen
docker exec -it timetracking-backend sh

# Manuell installieren
npx ts-node scripts/install.ts

# Credentials anzeigen
cat /tmp/admin-credentials.txt
```

## Bestehende Installationen aktualisieren

Für bestehende Installationen ohne automatisches Setup:

```bash
# Migration anwenden
docker exec timetracking-backend npx prisma migrate deploy

# Optional: Admin-Setup manuell ausführen (erstellt nur, falls kein Admin existiert)
docker exec timetracking-backend npx ts-node scripts/setup-admin.ts
```

## Siehe auch

- [Docker Quick Start Guide](DOCKER-QUICKSTART.md)
- [Docker Dokumentation](DOCKER.md)
- [README](README.md)
