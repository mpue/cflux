# Backup-System

## Übersicht

Das Backup-System erstellt vollständige JSON-Backups der gesamten Datenbank einschließlich aller 31 Tabellen.

## Version 2.0 - Vollständiges Backup

Seit Version 2.0 werden **alle Tabellen** gesichert:

### Benutzerverwaltung
- ✅ users (Benutzer mit allen Feldern inkl. AHV, Bankverbindung, etc.)
- ✅ userGroups (Benutzergruppen)
- ✅ userGroupMemberships (Many-to-Many Zuordnungen)

### Module & Berechtigungen
- ✅ modules (System-Module)
- ✅ moduleAccess (Modul-Berechtigungen pro Gruppe)

### Kunden & Lieferanten
- ✅ customers (Kunden)
- ✅ suppliers (Lieferanten)

### Artikel & Produkte
- ✅ articleGroups (Artikelgruppen)
- ✅ articles (Artikel mit Preisen und MwSt)

### Projekte & Zeiterfassung
- ✅ projects (Projekte)
- ✅ locations (Standorte)
- ✅ projectAssignments (Projekt-Zuordnungen)
- ✅ timeEntries (Zeiteinträge mit Pausen)
- ✅ absenceRequests (Abwesenheitsanträge)

### Compliance & Arbeitszeit
- ✅ holidays (Feiertage)
- ✅ overtimeBalances (Überstunden-Salden)
- ✅ complianceViolations (Verstöße gegen Arbeitszeitgesetz)
- ✅ complianceSettings (Compliance-Einstellungen)

### Rechnungswesen
- ✅ invoiceTemplates (Rechnungsvorlagen)
- ✅ invoices (Rechnungen)
- ✅ invoiceItems (Rechnungspositionen)
- ✅ reminders (Mahnungen)
- ✅ reminderSettings (Mahnwesen-Einstellungen)

### Incident Management
- ✅ incidents (Vorfälle/Tickets)
- ✅ incidentComments (Kommentare zu Vorfällen)

### Workflow-System
- ✅ workflows (Workflow-Definitionen)
- ✅ workflowSteps (Workflow-Schritte)
- ✅ invoiceTemplateWorkflows (Workflow-Zuordnungen zu Vorlagen)
- ✅ workflowInstances (Workflow-Instanzen)
- ✅ workflowInstanceSteps (Ausgeführte Workflow-Schritte)

### System
- ✅ systemSettings (System-Einstellungen)

## Backup erstellen

### Methode 1: npm-Script (empfohlen)
```bash
cd backend
npm run backup
```

### Methode 2: Direkt über TypeScript
```bash
cd backend
npx ts-node scripts/create-full-backup.ts
```

### Methode 3: API-Endpoint (mit Authentication)
```bash
POST /api/backup/create
Authorization: Bearer <jwt-token>
```

## Backup-Dateien

**Speicherort:** `backend/backups/`

**Dateiformat:** `backup_YYYY-MM-DDTHH-MM-SS-MSSZ.json`

**Beispiel:** `backup_2025-12-29T11-42-54-421Z.json`

## Backup-Struktur

```json
{
  "version": "2.0",
  "timestamp": "2025-12-29T11:42:54.421Z",
  "schemaInfo": {
    "tablesCount": 31,
    "description": "Complete database backup including all modules"
  },
  "data": {
    "users": [...],
    "userGroups": [...],
    "modules": [...],
    "customers": [...],
    "invoices": [...],
    // ... alle 31 Tabellen
  },
  "statistics": {
    "usersCount": 12,
    "userGroupsCount": 2,
    "customersCount": 30,
    // ... Statistiken
  }
}
```

## Backup-Größen (Referenz)

- Kleine Installation: ~100-500 KB
- Mittlere Installation: ~1-5 MB
- Große Installation: ~10-50 MB

## Restore (Wiederherstellung)

⚠️ **ACHTUNG:** Restore überschreibt die gesamte Datenbank!

1. Backup-Datei im `backups/` Ordner platzieren
2. Restore über API:
   ```bash
   POST /api/backup/restore/:filename
   Authorization: Bearer <jwt-token>
   ```

## Automatische Backups

Automatische Backups können in den System-Einstellungen konfiguriert werden:

- **Intervall:** täglich, wöchentlich, monatlich
- **Uhrzeit:** z.B. 02:00 Uhr
- **Aufbewahrung:** z.B. 30 Tage

## Best Practices

1. **Regelmäßige Backups:** Mindestens täglich
2. **Externe Speicherung:** Backups außerhalb des Containers speichern
3. **Versionierung:** Mehrere Backup-Generationen aufbewahren
4. **Test-Restore:** Regelmäßig Wiederherstellung testen
5. **Verschlüsselung:** Backups bei sensiblen Daten verschlüsseln

## Unterschiede zu Version 1.0

**Version 1.0** (veraltet):
- ❌ Nur 5 Tabellen (users, projects, timeEntries, absenceRequests, projectAssignments)
- ❌ Keine Benutzergruppen
- ❌ Keine Module
- ❌ Keine Kunden/Lieferanten
- ❌ Keine Rechnungen
- ❌ Keine Workflows

**Version 2.0** (aktuell):
- ✅ Alle 31 Tabellen
- ✅ Vollständige Datenintegrität
- ✅ Statistiken im Backup enthalten
- ✅ Bessere Fehlerbehandlung

## Migration von v1.0 zu v2.0

Alte Backups (v1.0) können nicht direkt wiederhergestellt werden. Bei Bedarf manuell migrieren oder neues Backup erstellen.

## Support

Bei Problemen mit Backups:
1. Logs prüfen: `docker logs timetracking-backend`
2. Backup-Verzeichnis prüfen: `ls -lah backend/backups/`
3. Berechtigungen prüfen: Container muss Schreibrechte haben

## Beispiel-Ausgabe

```
🔄 Erstelle vollständiges Backup...
✅ Backup erfolgreich erstellt!
📄 Datei: backup_2025-12-29T11-42-54-421Z.json
📊 Größe: 0.54 MB

Statistiken:
  - Benutzer: 12
  - Benutzergruppen: 2
  - Module: 16
  - Kunden: 30
  - Lieferanten: 20
  - Artikel: 25
  - Projekte: 8
  - Standorte: 1
  - Zeiteinträge: 644
  - Abwesenheitsanträge: 62
  - Rechnungen: 21
  - Vorfälle: 2
  - Workflows: 2
```
