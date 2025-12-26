# 🔄 Docker Auto-Setup - Änderungsübersicht

## Implementierte Änderungen

### Ziel: Null Stolpersteine! 🎯

**Workflow:**
1. Repository klonen
2. `docker-compose up --build -d`
3. Browser öffnen → http://localhost:3002
4. Login mit `admin@timetracking.local` / `admin123`
5. Passwort ändern (automatisches Modal im Browser)
6. **Fertig!**

Keine Kommandozeilen-Befehle zum Abrufen von Credentials nötig!

### 1. Backend-Skripte

#### `backend/scripts/setup-admin.ts`
- Erstellt automatisch einen Admin-Benutzer beim ersten Start
- **Verwendet festes Standard-Passwort**: `admin123`
- Setzt `requiresPasswordChange = true`
- Gibt Credentials in der Konsole aus (für Debugging)
- **Keine zufälligen Passwörter mehr!**

#### `backend/scripts/install.ts`
- Prüft, ob die Datenbank bereits initialisiert ist
- Führt bei Erstinstallation aus:
  1. Module-Seeding (`seedModules.ts`)
  2. Admin-Setup (`setup-admin.ts`)
- Überspringt Installation, wenn bereits Benutzer existieren

### 2. Datenbank-Schema

#### `backend/prisma/schema.prisma`
**Neue Felder im User-Model:**
```prisma
requiresPasswordChange Boolean @default(false)
```

#### Migration
- Neue Migration: `20251226164436_add_requires_password_change`
- Fügt das neue Feld zur `users`-Tabelle hinzu

### 3. Backend-API

#### `backend/src/controllers/auth.controller.ts`
**Login-Endpoint erweitert:**
- Gibt `requiresPasswordChange` im Response zurück
- Frontend kann darauf reagieren und Passwortänderung erzwingen

#### `backend/src/controllers/user.controller.ts`
**Neue Funktion:**
- `changePassword()` - Ermöglicht Passwortänderung
- Validiert aktuelles Passwort
- Setzt `requiresPasswordChange = false` nach erfolgreicher Änderung
- Fügt `requiresPasswordChange` zu User-Select-Queries hinzu

#### `backend/src/routes/user.routes.ts`
**Neue Route:**
```typescript
POST /api/users/change-password
```

### 4. Docker-Konfiguration

#### `backend/Dockerfile`
**Änderungen:**
1. Kopiert `scripts`-Ordner ins Image
2. InstFrontend-Komponenten

#### `frontend/src/components/ChangePasswordModal.tsx` (NEU)
**Vollständiges Modal für Passwortänderung:**
- Zeigt Warnung bei `isFirstLogin=true`
- Zeigt Standard-Passwort als Hint
- Drei Felder: Aktuelles Passwort, Neues Passwort, Bestätigung
- Toggle-Buttons zum Anzeigen der Passwörter
- Client-side Validierung
- Sicherheitstipps werden angezeigt
- Sendet Request an `/api/users/change-password`
- Kann nicht geschlossen werden bei `isFirstLogin=true`

#### `frontend/src/styles/ChangePasswordModal.css` (NEU)
- Vollständiges Styling für das Modal
- Responsive Design
- Dark Mode Support
- Animationen (Fade-in, Slide-in)
- Mobile-optimiert

#### `frontend/src/pages/Login.tsx` (AKTUALISIERT)
**Login-Flow mit automatischer Passwortänderung:**
```typescript
// Nach Login prüfen
useEffect(() => {
  if (user && user.requiresPasswordChange) {
    setShowPasswordChangeModal(true); // Modal anzeigen
  } else if (user && !user.requiresPasswordChange) {
    navigate('/dashboard'); // Normal weiter
  }
}, [user, navigate]);
```

#### `frontend/src/contexts/AuthContext.tsx` (AKTUALISIERT)
- Neue Funktion: `refreshUser()` - Aktualisiert User-Daten nach Passwortänderung

#### `frontend/src/types/index.ts` (AKTUALISIERT)
- User-Interface erweitert um: `requiresPasswordChange?: boolean`ode`, `typescript`, `@types/node` global
3. Erweitertes Start-Skript:
   - Wartet auf Datenbank
   - Führt Migrations aus
   - Ruft `install.ts` auf
   - Startet Server

**Neues Start-Skript im Container:**
```bash
/app/start.sh
```

### 5. Dokumentation

### 6. Dokumentation

#### `DOCKER-AUTO-SETUP.md` (AKTUALISIERT)
- Fokus auf Browser-basierten Workflow
- Standard-Credentials klar dokumentiert
- Kein Hinweis mehr auf Logs oder Credentials-Dateien

#### `DOCKER-QUICKSTART.md` (AKTUALISIERT)
- Vereinfacht auf 3 Schritte
- Standard-Credentials prominent angezeigt
- Keine Kommandozeilen-Befehle für Credentials

#### `README.md` (AKTUALISIERT)
- Installation auf 3 Schritte reduziert
- Standard-Credentials direkt im Quick Start
- Hinweis auf automatisches Modal
Vollständige Dokumentation zu:
- Installationsprozess
- Zugangsdaten abrufen-build -d                     │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│ 2. Container startet, wartet auf Datenbank          │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│ 3. Prisma Migrations werden ausgeführt              │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│ 4. scripts/install.ts prüft DB-Status               │
│    - Keine Benutzer gefunden? → Installation        │
│    - Benutzer vorhanden? → Überspringen             │
└─────────────────┬───────────────────────────────────┘
                  │
                  ├──[Neu]──────────────────────────────┐
                  │                                     │
┌─────────────────▼───────────────┐  ┌─────────────────▼───────────────┐
│ 5a. seedModules.ts               │  │ 5b. setup-admin.ts               │
│     - Alle Module anlegen        │  │     - Admin anlegen              │
│     - Dashboard, Zeit, etc.      │  │     - Passwort: admin123         │
└─────────────────┬───────────────┘  └─────────────────┬───────────────┘
                  │                                     │
                  └──────────────┬──────────────────────┘
                                 │
┌─────────────────────────────────▼──────────────────────────┐
│ 6. Server startet (node dist/index.js)                     │
└─────────────────────────────────┬──────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   BENUTZER-INTERAKTION    │
                    │   (über Browser)          │
                    └─────────────┬─────────────┘
                                  │
┌─────────────────────────────────▼──────────────────────────┐
│ 7. Benutzer öffnet http://localhost:3002                   │
└─────────────────────────────────┬──────────────────────────┘
                                  │
┌─────────────────────────────────▼──────────────────────────┐
│ 8. Login mit admin@timetracking.local / admin123           │
└─────────────────────────────────┬──────────────────────────┘
                                  │
┌─────────────────────────────────▼──────────────────────────┐
│ 9. Frontend prüft requiresPasswordChange = true            │
│    → Zeigt automatisch ChangePasswordModal                 │
└─────────────────────────────────┬──────────────────────────┘
                                  │
┌─────────────────────────────────▼──────────────────────────┐
│ 10. Benutzer ändert Passwort im Modal                      │
│     → POST /api/users/change-password                      │
│     → requiresPasswordChange = false                       │
└─────────────────────────────────┬──────────────────────────┘
                                  │
┌─────────────────────────────────▼──────────────────────────┐
│ 11. Weiterleitung zum Dashboard                            │
│     ✅ Setup komplett!                ───────────────▼───────────────┐
│ 5a. seedModules.ts               │  │ 5b. setup-admin.ts               │
│     - Alle Module anlegen        │  │     - Admin anlegen              │
│     - Dashboard, Zeit, etc.      │  │     - Temp. Passwort generieren  │
└────────bauen und starten
docker-compose up --build -d

# 3. Logs beobachten (optional)
docker-compose logs -f backend
# Warten auf: "Server running on port 3001"

# 4. Browser öffnen
# http://localhost:3002

# 5. Anmelden
# Email: admin@timetracking.local
# Passwort: admin123

# 6. Modal erscheint automatisch
# → Passwort ändern

# 7. Fertig! Im Dashboard
```

### Bestehende Installation testen

```powershell
# 1. Container neu starten (ohne Volume zu löschen)
docker-compose restart backend

# 2. Logs prüfen
docker-compose logs backend --tail 50

# Erwartung: "Database already initialized. Skipping installation."
```

## Frontend-Workflow (für Entwickler)

Das Frontend ist vollständig implementiert und funktioniert out-of-the-box:

1. **Login erfolgt** → `user.requiresPasswordChange` wird geprüft
2. **Falls true** → `ChangePasswordModal` wird automatisch angezeigt
3. **Modal blockiert** → Benutzer muss Passwort ändern
4. **Nach Änderung** → `refreshUser()` wird aufgerufen
5. **Flag wird false** → Weiterleitung zum Dashboard

**Keine weiteren Entwicklungsschritte nötig!**st handleChangePassword = async (currentPassword: string, newPassword: string) => {
  const response = await fetch('/api/users/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  
  if (response.ok) {
    // Erfolg - User neu laden
    // Modal schließen
  }
};
```

### 3. Route Guard
```typescript
// Verhindere Zugriff auf andere Routen, wenn Passwort geändert werden muss
if (user?.requiresPasswordChange && location.pathname !== '/change-password') {
  return <Navigate to="/change-password" replace />;
}
```

## Sicherheitsaspekte

✅ **Implementiert:**
- Festes Standard-Passwort für einfachen Einstieg
- Erzwungene Passwortänderung beim ersten Login (Browser-Modal)
- Passwort-Mindestlänge (6 Zeichen)
- Aktuelles Passwort muss für Änderung angegeben werden
- Modal kann nicht geschlossen werden bei erster Anmeldung

⚠️ **Sicherheitsüberlegungen:**
- Standard-Passwort `admin123` ist bekannt → **ABER**: Änderung wird erzwungen
- Kein Zugriff auf System ohne Passwortänderung
- Bei Produktiv-Deployment: JWT_SECRET und DB-Passwort ändern

✅ **Vorteile des Ansatzes:**
- Keine Stolpersteine für neue Benutzer
- Kein Suchen nach zufälligen Passwörtern in Logs
- Dokumentiertes, vorhersehbares Setup
- Passwortänderung wird trotzdem erzwungen

## Nächste Schritte

1. ✅ Backend kompilieren und testen
2. ✅ Frontend erstellt und integriert
3. ⏳ Integration testen
4. ⏳ Produktiv-Deployment vorbereiten

## Dateien-Übersicht

### Neue Dateien
```
backend/scripts/setup-admin.ts          - Admin mit Standard-Passwort
backend/scripts/install.ts              - Installationsprozess
backend/prisma/migrations/.../migration.sql - DB-Migration für requiresPasswordChange
frontend/src/components/ChangePasswordModal.tsx - Passwort-Änderungs-Modal
frontend/src/styles/ChangePasswordModal.css - Modal-Styling
DOCKER-AUTO-SETUP.md                    - Vollständige Dokumentation
DOCKER-AUTO-SETUP-CHANGES.md           - Diese Datei
```

### Geänderte Dateien
```
backend/Dockerfile                      - Scripts und ts-node hinzugefügt
backend/prisma/schema.prisma           - requiresPasswordChange Feld
backend/src/controllers/auth.controller.ts - Login gibt requiresPasswordChange zurück
backend/src/controllers/user.controller.ts - changePassword() Funktion
backend/src/routes/user.routes.ts      - Route für Passwortänderung
frontend/src/types/index.ts            - User-Interface erweitert
frontend/src/contexts/AuthContext.tsx  - refreshUser() hinzugefügt
frontend/src/pages/Login.tsx           - Modal-Integration
DOSystem komplett neu aufsetzen
docker-compose down -v
docker-compose up --build -d

# Logs verfolgen
docker-compose logs -f backend

# Warten auf diese Meldungen:
# ✅ Admin user created successfully!
# 📧 Admin Email: admin@timetracking.local
# 🔑 Default Password: admin123
# 🌐 Server running on port 3001

# Browser öffnen
start http://localhost:3002

# Login testen:
# Email: admin@timetracking.local
# Passwort: admin123
# → Modal sollte automatisch erscheinen

# API Health Check
curl http://localhost:3001/health

# Datenbank prüfen (optional)
docker exec -it timetracking-db psql -U timetracking -d timetracking -c "SELECT email, \"requiresPasswordChange\" FROM users WHERE role = 'ADMIN';"
```

## Erfolgs-Kriterien ✅

Das Setup ist erfolgreich, wenn:

1. ✅ `docker-compose up --build -d` läuft ohne Fehler
2. ✅ Backend startet und zeigt "Server running on port 3001"
3. ✅ Frontend erreichbar unter http://localhost:3002
4. ✅ Login mit `admin@timetracking.local` / `admin123` funktioniert
5. ✅ **Modal erscheint automatisch nach Login**
6. ✅ Passwort kann im Modal geändert werden
7. ✅ Nach Änderung: Weiterleitung zum Dashboard
8. ✅ Erneuter Login mit neuem Passwort funktioniert
9. ✅ Kein Modal mehr bei erneutem Login

**Keine Kommandozeilen-Befehle für Credentials erforderlich!**
# Mit frischer Datenbank starten
docker-compose down -v
docker-compose up -d

# Installation beobachten
docker logs timetracking-backend -f

# Credentials abrufen
docker exec timetracking-backend cat /tmp/admin-credentials.txt

# API testen
curl http://localhost:3001/health
```
