# Testdaten Generator für cflux

Dieses Script generiert umfangreiche Testdaten für die cflux-Datenbank.

## 🎯 Was wird generiert?

Das Script erstellt **realistische Test-Daten** in großer Menge:

| Datentyp | Anzahl | Beschreibung |
|----------|--------|--------------|
| **Benutzer** | 150 | Mit verschiedenen Rollen (Admin, Manager, User), Abteilungen, Positionen |
| **Benutzergruppen** | 10 | Management, Entwicklung, Marketing, HR, Finanzen, etc. |
| **Projekte** | 80 | Mit verschiedenen Status, Budgets, Team-Mitgliedern |
| **Zeiteinträge** | 5000+ | Verteilte Clock-In/Out Zeiten über 2 Jahre (2024-2026) |
| **Kunden** | 100 | Schweizer Firmen mit vollständigen Kontaktdaten |
| **Rechnungen** | 300 | Mit Items, MWST, verschiedenen Status |
| **Bestellungen** | 200 | Orders mit verschiedenen Workflow-Status |
| **Vorfälle (Incidents)** | 150 | EHS-Vorfälle mit verschiedenen Schweregraden |
| **Geräte (Devices)** | 300 | IT-Equipment mit Zuweisungen und Status |
| **Intranet-Dokumente** | 200 | Hierarchische Dokumentenstruktur |
| **Nachrichten** | 500 | Interne Nachrichten zwischen Benutzern |
| **Compliance-Verstöße** | 80 | ArG/ArGV 1 Verstöße |
| **Kostenstellen** | 9 | Mit Budgets und Managern |
| **Überstunden** | 145+ | Für alle aktiven Benutzer |
| **Feiertage** | 10+ | Schweizer Feiertage 2025 |

## 🚀 Verwendung

### Voraussetzungen

1. Docker Container muss laufen:
   ```powershell
   docker-compose up -d
   ```

2. Oder lokale Entwicklungsumgebung:
   ```powershell
   cd backend
   npm install
   ```

### Testdaten generieren

```powershell
cd backend
npm run seed:test-data
```

⏱️ **Dauer:** Ca. 2-5 Minuten (je nach Hardware)

### Testdaten generieren (mit Docker)

```powershell
docker-compose exec backend npm run seed:test-data
```

## 🔐 Login-Daten nach dem Seeding

### Alle Benutzer haben das gleiche Passwort

```
Passwort: Test123!
```

### Beispiel-Logins

**Admins (Benutzer 1-5):**
- Email-Format: `[vorname.nachname][nummer]@example.com`
- Beispiel: `anna.mueller0@example.com`

**Manager (Benutzer 6-15):**
- Beispiel: `beat.meier5@example.com`

**Normale Benutzer (16-150):**
- Beispiel: `carmen.schmidt15@example.com`

> **Tipp:** Die genauen Email-Adressen werden nach dem Seeding in der Konsole angezeigt.

## 📊 Datencharakteristika

### Realistische Verteilungen

- **Zeiteinträge:** Jeder aktive Benutzer hat 30-100 Einträge über 2 Jahre
- **Arbeitszeiten:** Zwischen 7-10 Stunden pro Tag
- **Pausen:** 30-60 Minuten
- **Projektmitgliedschaften:** 2-8 Mitglieder pro Projekt
- **Gruppenzugehörigkeit:** Jeder Benutzer ist in 1-3 Gruppen

### Status-Verteilungen

- **Projekte:** Mix aus ACTIVE, COMPLETED, PLANNING, ON_HOLD
- **Rechnungen:** DRAFT, SENT, PAID, OVERDUE, CANCELLED
- **Bestellungen:** Alle 7 Workflow-Status vertreten
- **Incidents:** REPORTED, UNDER_INVESTIGATION, RESOLVED, CLOSED

### Schweizer Kontext

- Schweizer Städte (Zürich, Bern, Basel, etc.)
- CH-Telefonnummern (+41)
- Schweizer Firmen-Namen
- MWST 7.7%
- Schweizer Feiertage

## 🔄 Datenbank zurücksetzen

**Achtung:** Dies löscht ALLE Daten!

```powershell
cd backend
npm run prisma:push --accept-data-loss
npm run seed:test-data
```

Mit Docker:
```powershell
docker-compose down -v
docker-compose up -d
docker-compose exec backend npm run seed:test-data
```

## 📝 Anpassungen

Das Script kann einfach angepasst werden, um mehr oder weniger Daten zu generieren:

```typescript
// In scripts/generate-test-data.ts

// Anzahl Benutzer ändern
for (let i = 0; i < 150; i++) {  // <- Hier ändern

// Anzahl Projekte ändern
for (let i = 0; i < 80; i++) {   // <- Hier ändern

// Zeitraum für Zeiteinträge ändern
const startDate = new Date('2024-01-01');  // <- Start
const endDate = new Date('2026-01-19');    // <- Ende
```

## 🎲 Zufallsdaten

Das Script verwendet Zufallsgeneratoren für:
- Namen (70+ Vornamen, 64+ Nachnamen)
- Abteilungen (15 verschiedene)
- Positionen (12 verschiedene)
- Projektnamen (30 verschiedene)
- Firmen (realistische Schweizer Namen)
- Und vieles mehr...

## 🔍 Daten überprüfen

Nach dem Seeding kannst du die Daten überprüfen:

### Via Prisma Studio
```powershell
cd backend
npm run prisma:studio
```
Öffnet automatisch: http://localhost:5555

### Via SQL (Docker)
```powershell
docker-compose exec postgres psql -U timetracking -d timetracking
```

Beispiel-Queries:
```sql
-- Anzahl Benutzer
SELECT COUNT(*) FROM "User";

-- Anzahl Zeiteinträge
SELECT COUNT(*) FROM "TimeEntry";

-- Benutzer nach Rolle
SELECT role, COUNT(*) FROM "User" GROUP BY role;

-- Projekte nach Status
SELECT status, COUNT(*) FROM "Project" GROUP BY status;
```

## 🐛 Troubleshooting

### "Connection refused" Fehler
➡️ Datenbank läuft nicht. Starte Docker Container:
```powershell
docker-compose up -d
```

### "Unique constraint" Fehler
➡️ Daten existieren bereits. Datenbank zurücksetzen (siehe oben)

### Script läuft sehr lange
➡️ Normal bei 5000+ Zeiteinträgen. Geduld haben oder Anzahl reduzieren.

### "Out of memory" Fehler
➡️ Anzahl der Datensätze im Script reduzieren

## 💡 Tipps

- **Performance:** Nutze Docker für bessere Performance
- **Testing:** Erstelle regelmäßig Backups vor dem Seeding
- **Entwicklung:** Nutze kleinere Datenmengen für schnellere Iterationen
- **CI/CD:** Integriere das Script in deine Test-Pipeline

## 📚 Weitere Scripts

- `npm run seed` - Standard Seed (minimal)
- `npm run seed:modules` - Nur Module
- `npm run seed:intranet` - Nur Intranet
- `npm run seed:devices` - Nur Geräte
- `npm run backup` - Backup erstellen

---

**Erstellt für cflux - Swiss Compliance Time Tracking System**
