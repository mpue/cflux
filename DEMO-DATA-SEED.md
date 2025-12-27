# Datenbank mit Demodaten befüllen

## Übersicht

Das Seed-Skript erstellt umfangreiche Demodaten für alle Bereiche der Anwendung:

### Erstellt werden:

- ✅ **1 Admin-Benutzer** (admin@example.com)
- ✅ **10 Mitarbeiter** mit verschiedenen Namen
- ✅ **8 Projekte** (Website, Mobile App, CRM, etc.)
- ✅ **30 Kunden** (Schweizer Firmen mit vollständigen Adressen)
- ✅ **20 Lieferanten** (IT, Bürobedarf, Software, etc.)
- ✅ **5 Artikelgruppen** (Dienstleistungen, Hardware, Software, etc.)
- ✅ **25 Artikel** mit Preisen und MwSt
- ✅ **Projektzuweisungen** (jeder User ist 2-4 Projekten zugewiesen)
- ✅ **40-80 Zeiteinträge pro User** (letzte 6 Monate)
- ✅ **3-8 Abwesenheitsanträge pro User** (Urlaub, Krankheit, etc.)
- ✅ **15 Rechnungen** mit verschiedenen Status

## Ausführung auf dem Server

### Variante 1: Direkt im Docker-Container (empfohlen)

```bash
# Auf dem Server einloggen
ssh user@162.55.212.153

# In das Projektverzeichnis wechseln
cd /pfad/zu/cflux

# Seed-Skript im Backend-Container ausführen
docker exec timetracking-backend npm run seed:dev

# Oder alternativ (falls kompiliert):
docker exec timetracking-backend npm run seed
```

### Variante 2: Mit docker-compose exec

```bash
# Auf dem Server
cd /pfad/zu/cflux

# Seed-Skript ausführen
docker-compose exec backend npm run seed:dev
```

### Variante 3: Manuell im Container

```bash
# In den Container einloggen
docker exec -it timetracking-backend sh

# Im Container:
cd /app
npx ts-node prisma/seed.ts

# Container verlassen
exit
```

## ⚠️ Wichtig: Bestehende Daten

Das Seed-Skript verwendet `upsert` für die meisten Entitäten, d.h.:

- **Bestehende Einträge werden NICHT überschrieben** (werden geupdatet oder übersprungen)
- **Neue Einträge werden hinzugefügt**

**Wenn Sie eine komplett leere Datenbank mit nur Demodaten wollen:**

```bash
# Stoppe alle Container
docker-compose down

# Lösche das Datenbank-Volume
docker volume rm timetracking_postgres_data

# Starte neu (führt Migrations und Installation aus)
docker-compose up -d

# Warte 30 Sekunden, dann Demodaten einfügen
sleep 30
docker exec timetracking-backend npm run seed:dev
```

## Test-Zugangsdaten nach dem Seeding

### Admin
- **Email**: `admin@example.com`
- **Passwort**: `admin123`

### Mitarbeiter (alle mit gleichem Passwort)
- **Passwort für alle**: `password123`

Beispiel-Logins:
- `anna.schmidt@example.com` / `password123`
- `thomas.mueller@example.com` / `password123`
- `julia.weber@example.com` / `password123`
- `michael.wagner@example.com` / `password123`
- `sarah.becker@example.com` / `password123`
- `daniel.schulz@example.com` / `password123`
- `lisa.hoffmann@example.com` / `password123`
- `sebastian.koch@example.com` / `password123`
- `laura.bauer@example.com` / `password123`
- `markus.richter@example.com` / `password123`

## Ausgabe des Seed-Skripts

Wenn das Skript erfolgreich läuft, sehen Sie:

```
🌱 Seeding database with dummy data...
✅ Admin user created: admin@example.com
✅ 10 users created
✅ 8 projects created
✅ 30 customers created
✅ Projects linked to customers
✅ 20 suppliers created
✅ 43 project assignments created
✅ 650 time entries created
✅ 58 absence requests created

🏷️ Creating article groups...
✅ Created 5 article groups

📦 Creating articles...
✅ Created 25 articles

💰 Creating invoices...
✅ Created 15 invoices

🎉 Seeding completed successfully!

📝 Test Credentials:
Admin: admin@example.com / admin123
Users: [firstname].[lastname]@example.com / password123
Example: anna.schmidt@example.com / password123
```

## Überprüfung der Daten

### Via Prisma Studio (empfohlen)

```bash
# Prisma Studio im Container starten
docker exec timetracking-backend npx prisma studio

# Öffne im Browser:
# http://162.55.212.153:5555
```

### Via SQL-Abfrage

```bash
# In Datenbank-Container einloggen
docker exec -it timetracking-db psql -U timetracking -d timetracking

# Anzahl der Einträge prüfen
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Project";
SELECT COUNT(*) FROM "Customer";
SELECT COUNT(*) FROM "Supplier";
SELECT COUNT(*) FROM "Article";
SELECT COUNT(*) FROM "TimeEntry";
SELECT COUNT(*) FROM "Invoice";

# Datenbank verlassen
\q
```

### Via API-Endpoint

```bash
# Zuerst einloggen und Token erhalten
curl -X POST http://162.55.212.153:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Mit dem erhaltenen Token Daten abrufen
curl -X GET http://162.55.212.153:3002/api/users \
  -H "Authorization: Bearer <IHR_TOKEN>"

curl -X GET http://162.55.212.153:3002/api/customers \
  -H "Authorization: Bearer <IHR_TOKEN>"
```

## Nur bestimmte Bereiche seeden

Falls Sie nur bestimmte Bereiche mit Daten füllen möchten, können Sie das Seed-Skript anpassen:

```bash
# Seed-Skript bearbeiten
docker exec -it timetracking-backend sh
vi /app/prisma/seed.ts

# Kommentieren Sie die Bereiche aus, die Sie nicht benötigen
# z.B. wenn Sie keine Rechnungen möchten:
# // Kommentieren Sie den Bereich "💰 Creating invoices..." aus
```

## Demodaten löschen

### Alle Demodaten löschen (behält Schema):

```bash
docker exec -it timetracking-db psql -U timetracking -d timetracking -c "
  TRUNCATE TABLE \"Invoice\", \"InvoiceItem\", \"InvoiceReminder\", 
  \"Article\", \"ArticleGroup\", \"AbsenceRequest\", \"TimeEntry\", 
  \"ProjectAssignment\", \"Project\", \"Customer\", \"Supplier\", 
  \"User\" CASCADE;"
```

⚠️ **Achtung**: Dadurch werden ALLE Daten gelöscht, inklusive des Admin-Users!

Nach dem Löschen müssen Sie die Installation neu durchführen:

```bash
# Module und Admin neu erstellen
docker exec timetracking-backend npx ts-node scripts/install.ts

# Dann wieder Demodaten einfügen
docker exec timetracking-backend npm run seed:dev
```

## Eigene Seed-Daten hinzufügen

Sie können das [Seed-Skript](backend/prisma/seed.ts) anpassen:

1. Datei bearbeiten: `backend/prisma/seed.ts`
2. Eigene Daten hinzufügen oder bestehende ändern
3. Code commiten und auf Server deployen
4. Seed-Skript erneut ausführen

Beispiel - Weiteren Kunden hinzufügen:

```typescript
// In backend/prisma/seed.ts
const customerData = [
  // Bestehende Kunden...
  { 
    name: 'Meine Firma GmbH', 
    contactPerson: 'Max Mustermann', 
    email: 'max@meine-firma.ch', 
    phone: '+41 44 123 45 67',
    address: 'Teststrasse 1',
    zipCode: '8000',
    city: 'Zürich',
    country: 'Schweiz',
    taxId: 'CHE-999.888.777',
    notes: 'Wichtiger Kunde'
  },
];
```

## Troubleshooting

### Problem: "Cannot find module 'ts-node'"

```bash
# ts-node installieren (sollte bereits vorhanden sein)
docker exec timetracking-backend npm install --save-dev ts-node

# Oder npm run build verwenden und dann:
docker exec timetracking-backend npm run seed
```

### Problem: "Unique constraint failed"

Das bedeutet, dass einige Einträge bereits existieren. Das ist normal.
Das Skript überspringt diese und fügt nur neue hinzu.

### Problem: Seed dauert sehr lange

Das ist normal. Das Skript erstellt hunderte von Einträgen.
Erwarten Sie ca. 30-60 Sekunden Laufzeit.

### Problem: "Out of memory"

Bei sehr vielen Daten kann der Container zu wenig RAM haben:

```yaml
# In docker-compose.yml
backend:
  deploy:
    resources:
      limits:
        memory: 1G
      reservations:
        memory: 512M
```

## Performance nach dem Seeding

Nach dem Einfügen der Demodaten:

- **Dashboard** zeigt echte Statistiken
- **Zeiterfassung** hat historische Daten
- **Berichte** können generiert werden
- **Rechnungen** sind vorhanden
- **Alle Listen** sind gefüllt

Die Anwendung verhält sich wie in einem echten Produktivbetrieb!

## Siehe auch

- [Seed-Skript](backend/prisma/seed.ts) - Vollständiger Quellcode
- [Docker Auto Setup](DOCKER-AUTO-SETUP.md) - Installation
- [Quick Start Guide](QUICK-START.md) - Erste Schritte
- [README](README.md) - Hauptdokumentation
