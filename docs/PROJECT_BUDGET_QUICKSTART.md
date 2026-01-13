# Projekt-Budget Modul - Schnellstart

## 1. Datenbank aktualisieren

Das Prisma-Schema wurde bereits aktualisiert. Pushen Sie die Änderungen zur Datenbank:

```powershell
cd backend
npx prisma db push
npx prisma generate
```

Oder mit Docker:

```powershell
docker-compose restart backend
# Die Datenbank wird automatisch aktualisiert beim Start
```

## 2. Module seeden

Führen Sie das Seed-Script aus um das Modul zu registrieren:

```powershell
cd backend
npm run seed:modules
```

Oder direkt:

```powershell
cd backend
npx ts-node prisma/seedModules.ts
```

## 3. Berechtigungen setzen

Führen Sie das SQL-Script aus um Standard-Berechtigungen zu setzen:

```powershell
# Mit Docker
docker-compose exec db psql -U timetracking -d timetracking < db/add_project_budget_permissions.sql

# Oder direkt
psql -U timetracking -d timetracking -f db/add_project_budget_permissions.sql
```

## 4. Backend neu starten

```powershell
# Mit Docker
docker-compose restart backend

# Oder lokal
cd backend
npm run dev
```

## 5. Frontend neu starten

```powershell
# Mit Docker
docker-compose restart frontend

# Oder lokal
cd frontend
npm start
```

## 6. Zugriff testen

1. Als Admin einloggen (admin@timetracking.local / admin123)
2. Zu AdminDashboard navigieren
3. Tab "💼 Projekt-Budget" sollte sichtbar sein
4. Neues Budget für bestehendes Projekt erstellen

## Verifizierung

### Backend-Tests

```powershell
cd backend

# API-Endpunkt testen
curl http://localhost:3001/api/project-budgets

# Mit Authentifizierung
$token = "YOUR_JWT_TOKEN"
curl -H "Authorization: Bearer $token" http://localhost:3001/api/project-budgets
```

### Datenbank-Checks

```sql
-- Module prüfen
SELECT * FROM "Module" WHERE key = 'project_budget';

-- Berechtigungen prüfen
SELECT 
    m.name AS module_name,
    ug.name AS group_name,
    ma."canView",
    ma."canCreate",
    ma."canEdit",
    ma."canDelete"
FROM "ModuleAccess" ma
JOIN "Module" m ON ma."moduleId" = m.id
JOIN "UserGroup" ug ON ma."userGroupId" = ug.id
WHERE m.key = 'project_budget';

-- Budgets prüfen
SELECT COUNT(*) FROM "ProjectBudget";
SELECT COUNT(*) FROM "ProjectBudgetItem";
```

## Beispiel-Budget erstellen

### Via Frontend
1. AdminDashboard → "💼 Projekt-Budget"
2. "Neues Budget" klicken
3. Projekt auswählen (z.B. "Website Relaunch")
4. Gesamtbudget: 150000.00 CHF
5. Start: 01.01.2025, Ende: 31.12.2025
6. Kostenstelle optional wählen
7. "Erstellen" klicken

### Via API (curl)

```bash
# Budget erstellen
curl -X POST http://localhost:3001/api/project-budgets \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 1,
    "totalBudget": 150000.00,
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "notes": "Beispiel-Budget"
  }'

# Position hinzufügen
curl -X POST http://localhost:3001/api/project-budgets/1/items \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "LABOR",
    "description": "Senior Developer",
    "plannedHours": 500,
    "hourlyRate": 120.00,
    "plannedCost": 60000.00
  }'
```

## Troubleshooting

### Module nicht sichtbar
```sql
-- Prüfen ob Module existiert
SELECT * FROM "Module" WHERE key = 'project_budget';

-- Falls nicht, manuell erstellen
INSERT INTO "Module" (name, key, description, icon, route, "sortOrder", "createdAt", "updatedAt")
VALUES ('Projekt-Budget', 'project_budget', 'Projektbudget-Planung und -Überwachung', 'account_balance_wallet', '/project-budget', 19, NOW(), NOW());
```

### Keine Berechtigungen
```sql
-- Prüfen ob Berechtigungen existieren
SELECT * FROM "ModuleAccess" ma
JOIN "Module" m ON ma."moduleId" = m.id
WHERE m.key = 'project_budget';

-- Manuell für Admin-Gruppe erstellen
INSERT INTO "ModuleAccess" ("moduleId", "userGroupId", "canView", "canCreate", "canEdit", "canDelete", "createdAt", "updatedAt")
SELECT m.id, ug.id, true, true, true, true, NOW(), NOW()
FROM "Module" m, "UserGroup" ug
WHERE m.key = 'project_budget' AND ug.name = 'Administrators';
```

### API gibt 404
- Backend neu starten: `docker-compose restart backend`
- Route prüfen: `backend/src/index.ts` sollte `app.use('/api/project-budgets', projectBudgetRoutes)` enthalten
- Logs prüfen: `docker-compose logs -f backend`

### Frontend zeigt Tab nicht
- Frontend neu bauen: `docker-compose up --build frontend`
- Browser-Cache leeren
- Prüfen ob Benutzer in Gruppe mit Berechtigung ist
- Prüfen ob `hasModuleAccess('project_budget')` true zurückgibt

## Next Steps

Nach erfolgreichem Setup:

1. **Demo-Daten erstellen**: Erstelle Budgets für bestehende Projekte
2. **Positionen hinzufügen**: Füge verschiedene Kategorien (LABOR, MATERIALS, etc.) hinzu
3. **Kosten verfolgen**: Aktualisiere actualCost/actualQuantity
4. **Berichte erstellen**: Nutze Budget-Übersicht für Management-Reports

## Support

Vollständige Dokumentation: `docs/PROJECT_BUDGET_MODULE.md`
