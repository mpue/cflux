# Projekt-Budget Modul

## Übersicht

Das Projekt-Budget Modul ermöglicht die detaillierte Planung, Überwachung und Analyse von Projektbudgets mit Verbindungen zu Lagerverwaltung, Projekten, Zeiterfassung und Kostenstellen.

## Features

### Budget-Verwaltung
- **Budget-Planung**: Erstellen und verwalten von Projekt-Budgets mit Gesamtbudget
- **Echtzeit-Berechnung**: Automatische Berechnung von geplanten Kosten, tatsächlichen Kosten, verbleibendem Budget und Auslastung
- **Status-Tracking**: 4 Budget-Status (PLANNING, ACTIVE, COMPLETED, EXCEEDED)
- **Budget-Übersicht**: Kartenansicht mit Budget-Statistiken und Auslastungsbalken

### Budget-Positionen
- **Kategorien**: 6 Kategorien für strukturierte Kostenverfolgung
  - LABOR (Personalkosten) - mit Stunden- und Stundensatz-Tracking
  - MATERIALS (Materialkosten)
  - INVENTORY (Lagerbestand) - mit Verknüpfung zu Lagerartikeln
  - EXTERNAL_SERVICES (Externe Dienstleistungen)
  - OVERHEAD (Gemeinkosten)
  - OTHER (Sonstige)

- **Kosten-Tracking**: 
  - Geplante Menge/Kosten vs. tatsächliche Menge/Kosten
  - Einheitspreis-Verwaltung
  - Automatische Varianz-Berechnung (Abweichung in CHF und %)

- **Integrationen**:
  - Kostenstellen-Zuordnung (auf Budget- und Positionsebene)
  - Lagerartikel-Verknüpfung (für INVENTORY-Kategorie)
  - Zeiteintrags-Filter (nach Budget-Zeitraum)

## Datenbankmodelle

### ProjectBudget
```prisma
model ProjectBudget {
  id                  Int      @id @default(autoincrement())
  projectId           Int      @unique
  totalBudget         Decimal  @db.Decimal(12, 2)
  plannedCosts        Decimal  @db.Decimal(12, 2) @default(0)
  actualCosts         Decimal  @db.Decimal(12, 2) @default(0)
  remainingBudget     Decimal  @db.Decimal(12, 2)
  budgetUtilization   Decimal  @db.Decimal(5, 2)  // Percentage
  status              BudgetStatus @default(PLANNING)
  startDate           DateTime?
  endDate             DateTime?
  costCenterId        Int?
  notes               String?  @db.Text
  createdById         Int
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  project             Project  @relation(fields: [projectId], references: [id])
  costCenter          CostCenter? @relation(fields: [costCenterId], references: [id])
  createdBy           User     @relation(fields: [createdById], references: [id])
  items               ProjectBudgetItem[]
}
```

### ProjectBudgetItem
```prisma
model ProjectBudgetItem {
  id                  Int      @id @default(autoincrement())
  budgetId            Int
  category            BudgetItemCategory
  description         String
  plannedQuantity     Decimal? @db.Decimal(10, 2)
  actualQuantity      Decimal? @db.Decimal(10, 2) @default(0)
  unitPrice           Decimal? @db.Decimal(10, 2)
  plannedCost         Decimal  @db.Decimal(12, 2)
  actualCost          Decimal  @db.Decimal(12, 2) @default(0)
  plannedHours        Decimal? @db.Decimal(8, 2)  // For LABOR category
  actualHours         Decimal? @db.Decimal(8, 2) @default(0)
  hourlyRate          Decimal? @db.Decimal(10, 2) // For LABOR category
  variance            Decimal  @db.Decimal(12, 2) @default(0)
  variancePercent     Decimal  @db.Decimal(5, 2) @default(0)
  inventoryItemId     Int?     // For INVENTORY category
  costCenterId        Int?
  notes               String?  @db.Text
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  budget              ProjectBudget @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  inventoryItem       InventoryItem? @relation(fields: [inventoryItemId], references: [id])
  costCenter          CostCenter? @relation(fields: [costCenterId], references: [id])
}
```

## API Endpunkte

### Budget-Endpunkte

#### GET `/api/project-budgets`
Alle Budgets abrufen (mit Projekt, Kostenstelle, Positionen)

**Response:**
```json
[
  {
    "id": 1,
    "projectId": 5,
    "totalBudget": "150000.00",
    "plannedCosts": "145000.00",
    "actualCosts": "98500.00",
    "remainingBudget": "51500.00",
    "budgetUtilization": "65.67",
    "status": "ACTIVE",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.999Z",
    "project": {
      "id": 5,
      "name": "Website Relaunch",
      "projectNumber": "PRJ-2025-005"
    },
    "items": [...],
    "costCenter": {...}
  }
]
```

#### GET `/api/project-budgets/:id`
Budget nach ID abrufen

#### GET `/api/project-budgets/project/:projectId`
Budget für bestimmtes Projekt abrufen

#### POST `/api/project-budgets`
Neues Budget erstellen

**Request Body:**
```json
{
  "projectId": 5,
  "totalBudget": 150000.00,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "costCenterId": 3,
  "notes": "Budget für Website Relaunch Projekt"
}
```

**Response:** Erstelltes Budget-Objekt

#### PUT `/api/project-budgets/:id`
Budget aktualisieren

**Request Body:** Wie POST (alle Felder optional)

#### POST `/api/project-budgets/:id/recalculate`
Budget neu berechnen (Summen, Auslastung, Status)

**Berechnet:**
- `plannedCosts` = Summe aller `item.plannedCost`
- `actualCosts` = Summe aller `item.actualCost`
- `remainingBudget` = `totalBudget` - `actualCosts`
- `budgetUtilization` = (`actualCosts` / `totalBudget`) * 100
- `status` = EXCEEDED wenn `actualCosts` > `totalBudget`

#### DELETE `/api/project-budgets/:id`
Budget löschen (soft delete mit Cascade auf Positionen)

### Budget-Positionen Endpunkte

#### POST `/api/project-budgets/:id/items`
Neue Budget-Position hinzufügen

**Request Body:**
```json
{
  "category": "LABOR",
  "description": "Senior Developer",
  "plannedHours": 500,
  "hourlyRate": 120.00,
  "plannedCost": 60000.00,
  "costCenterId": 2
}
```

**Response:** Aktualisiertes Budget mit neuer Position

#### PUT `/api/project-budgets/items/:itemId`
Budget-Position aktualisieren

**Request Body:** Wie POST (alle Felder optional)

**Automatische Berechnungen:**
- Für LABOR: `plannedCost` = `plannedHours` * `hourlyRate`
- `variance` = `actualCost` - `plannedCost`
- `variancePercent` = (`variance` / `plannedCost`) * 100

#### DELETE `/api/project-budgets/items/:itemId`
Budget-Position löschen

### Zusätzliche Endpunkte

#### GET `/api/project-budgets/:id/time-entries`
Zeiteinträge für Budget-Zeitraum abrufen

**Query Parameters:**
- `startDate` (optional) - Filter Startdatum (Standard: Budget startDate)
- `endDate` (optional) - Filter Enddatum (Standard: Budget endDate)

## Frontend-Komponenten

### ProjectBudgetTab
Haupt-Komponente für Budget-Verwaltung

**Features:**
- Responsive Karten-Grid mit Budget-Übersicht
- Echtzeit-Budget-Statistiken
- Auslastungsbalken mit Prozentanzeige
- Status-Badges mit Farbcodierung
- Zwei Modals:
  - Budget erstellen/bearbeiten
  - Positionen verwalten
- Positionen-Tabelle mit Kategorie-Badges, Kosten-Vergleich, Varianz-Anzeige
- Währungsformatierung (CHF, Schweizer Format)

**CSS-Klassen:**
- `.project-budget-tab` - Haupt-Container
- `.budget-card` - Budget-Karte
- `.budget-stats` - Statistik-Grid
- `.utilization-bar` - Auslastungsbalken
- `.status-badge` - Status-Badge
- `.items-table` - Positionen-Tabelle
- `.category-badge` - Kategorie-Badge

## Berechtigungen

Das Modul nutzt das ModuleAccess-System:

**Module Key:** `project_budget`

**Standard-Berechtigungen:**
- **Administrators**: Vollzugriff (View, Create, Edit, Delete)
- **Managers**: View, Create, Edit (kein Delete)
- **Users**: View only

**Setup:**
```bash
# Module seeden
cd backend
npm run seed:modules

# Berechtigungen setzen
docker-compose exec db psql -U timetracking -d timetracking -f /docker-entrypoint-initdb.d/add_project_budget_permissions.sql
```

## Verwendung

### Budget erstellen
1. Im AdminDashboard zu "💼 Projekt-Budget" Tab navigieren
2. Auf "Neues Budget" klicken
3. Projekt auswählen, Gesamtbudget eingeben
4. Optional: Kostenstelle, Start-/Enddatum, Notizen
5. "Erstellen" klicken

### Positionen hinzufügen
1. Budget-Karte finden
2. Auf "Positionen verwalten" klicken
3. Im Modal auf "Neue Position" klicken
4. Kategorie wählen (LABOR, MATERIALS, INVENTORY, etc.)
5. Beschreibung, Menge, Preis eingeben
6. Optional: Lagerartikel oder Kostenstelle verknüpfen
7. "Erstellen" klicken

### Budget-Auslastung verfolgen
- **Geplante Kosten**: Summe aller Positionen (plannedCost)
- **Tatsächliche Kosten**: Summe aller actualCost (manuell erfasst)
- **Verbleibendes Budget**: totalBudget - actualCosts
- **Auslastung**: (actualCosts / totalBudget) * 100%
- **Status**: 
  - PLANNING: Budget in Planung
  - ACTIVE: Budget aktiv
  - COMPLETED: Projekt abgeschlossen
  - EXCEEDED: Budget überschritten

### Budget neu berechnen
Wenn Positionen geändert wurden:
1. Auf "Neu berechnen" klicken
2. System aktualisiert automatisch:
   - Geplante Kosten (Summe)
   - Verbleibendes Budget
   - Auslastung (%)
   - Status (bei Überschreitung)

### Zeiteinträge anzeigen
1. Budget-Karte öffnen
2. Auf "Zeiteinträge anzeigen" klicken
3. Zeigt alle Zeiteinträge im Budget-Zeitraum (startDate bis endDate)

## Integration mit anderen Modulen

### Lagerverwaltung
- Budget-Positionen mit Kategorie INVENTORY können mit Lagerartikeln verknüpft werden
- Inventar-Dropdown in Position-Modal
- Automatische Preis-Übernahme aus Lagerartikel möglich

### Projekte
- One-to-One Beziehung: Ein Projekt kann ein Budget haben
- Budget-Status folgt Projekt-Lebenszyklus
- Projekt-Details in Budget-Karte angezeigt

### Zeiterfassung
- Zeiteinträge-Filter nach Budget-Zeitraum
- LABOR-Positionen mit Stunden-Tracking
- Vergleich geplante vs. tatsächliche Arbeitsstunden

### Kostenstellen
- Budget-Ebene: Gesamtes Budget einer Kostenstelle zuordnen
- Positions-Ebene: Einzelne Positionen verschiedenen Kostenstellen zuordnen
- Kostenstellen-Reporting und -Analyse

## Workflow-Beispiel

1. **Budget-Planung**:
   ```
   Projekt erstellen → Budget anlegen (PLANNING) → Positionen hinzufügen
   ```

2. **Projekt-Start**:
   ```
   Status auf ACTIVE setzen → Start-/Enddatum definieren
   ```

3. **Laufende Überwachung**:
   ```
   Positionen mit actualCost/actualQuantity aktualisieren → 
   Budget neu berechnen → 
   Auslastung prüfen → 
   Bei Überschreitung: Status EXCEEDED
   ```

4. **Projekt-Abschluss**:
   ```
   Finale Kosten erfassen → 
   Status auf COMPLETED setzen → 
   Budget-Report erstellen
   ```

## Best Practices

1. **Budget-Struktur**:
   - Nutze aussagekräftige Beschreibungen für Positionen
   - Gruppiere ähnliche Kosten in Kategorien
   - Ordne Kostenstellen konsistent zu

2. **Kosten-Tracking**:
   - Aktualisiere actualCost/actualQuantity regelmäßig
   - Nutze die Neu-berechnen-Funktion nach Änderungen
   - Überwache Varianz-Prozentsätze

3. **LABOR-Positionen**:
   - Erfasse geplante Stunden realistisch
   - Nutze konsistente Stundensätze
   - Vergleiche mit tatsächlichen Zeiteinträgen

4. **Lagerbestand-Integration**:
   - Verknüpfe INVENTORY-Positionen mit Lagerartikeln
   - Prüfe Verfügbarkeit vor Budget-Freigabe
   - Aktualisiere Kosten bei Preisänderungen

5. **Reporting**:
   - Exportiere Budget-Daten für Management-Reports
   - Analysiere Varianz-Trends
   - Nutze Status-Badges für schnelle Übersicht

## Migration bestehender Daten

Wenn bereits Projekte existieren:

```sql
-- Beispiel: Budgets für bestehende Projekte erstellen
INSERT INTO "ProjectBudget" (
  "projectId", 
  "totalBudget", 
  "plannedCosts", 
  "actualCosts", 
  "remainingBudget", 
  "budgetUtilization", 
  "status", 
  "createdById"
)
SELECT 
  p.id,
  100000.00, -- Beispiel-Budget
  0,
  0,
  100000.00,
  0,
  'PLANNING',
  1 -- Admin User ID
FROM "Project" p
WHERE NOT EXISTS (
  SELECT 1 FROM "ProjectBudget" pb WHERE pb."projectId" = p.id
);
```

## Fehlerbehebung

### Budget lässt sich nicht erstellen
- Prüfe ob Projekt bereits ein Budget hat (unique constraint)
- Prüfe ob Projekt existiert
- Prüfe Berechtigungen (canCreate)

### Neu-Berechnung schlägt fehl
- Prüfe ob Budget existiert
- Prüfe ob Positionen vorhanden
- Prüfe Decimal-Werte (keine NULL)

### Positionen werden nicht angezeigt
- Prüfe Cascade-Löschen (onDelete: Cascade)
- Prüfe budgetId-Referenz
- Prüfe Frontend-Service-Call

### Zeiteinträge werden nicht gefunden
- Prüfe startDate/endDate im Budget
- Prüfe TimeEntry.date-Filterung
- Prüfe Projekt-Zuordnung

## Support

Bei Fragen oder Problemen:
1. Prüfe Dokumentation: `docs/PROJECT_BUDGET_MODULE.md`
2. Prüfe API-Logs: `docker-compose logs -f backend`
3. Prüfe Frontend-Konsole: Browser DevTools
4. Prüfe Datenbank: `docker-compose exec db psql -U timetracking`
