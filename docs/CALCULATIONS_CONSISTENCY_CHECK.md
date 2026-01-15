# Berechnungs-Konsistenz-Prüfung: Projekte und Stunden

**Datum:** 15. Januar 2026  
**Status:** ✅ Geprüft und korrigiert

## Überblick

Diese Dokumentation beschreibt die Prüfung und Korrektur aller Berechnungen im Zusammenhang mit Projekten, Stunden, Kosten und Budget-Auslastung im cflux-System.

## Geprüfte Bereiche

### 1. Stunden-Berechnung aus TimeEntries

**Formel (konsistent in allen Bereichen):**
```typescript
const workedMs = (clockOut - clockIn) - (pauseMinutes * 60 * 1000);
const workedHours = workedMs / (1000 * 60 * 60);
```

**Verwendung:**
- ✅ `budgetUpdate.service.ts` (Zeile 78-84)
- ✅ `projectReports.controller.ts` (Zeile 112-117, 303-308, 389-394)
- ✅ `pdf.service.ts` (calculateWorkHours Funktion)
- ✅ `projectBudget.controller.ts` (Zeile 627)

**Status:** ✅ Konsistent - Alle verwenden die gleiche Formel

---

### 2. Stundensatz-Ermittlung

**Hierarchie (von spezifisch zu allgemein):**
1. `User.hourlyRate`
2. `Project.defaultHourlyRate`
3. `SystemSettings.defaultHourlyRate`
4. Fallback: 100 CHF

**Implementierung:**

#### hourlyRate.service.ts (Zentrale Funktion)
```typescript
export async function getHourlyRateForUser(userId: string, projectId?: string): Promise<number>
```

**Verwendung:**
- ✅ `budgetUpdate.service.ts` - Nutzt `getHourlyRateForUser()` (Zeile 70)
- ✅ `projectReports.controller.ts` - Manuelle Hierarchie mit Fallback 100 CHF (Zeile 311-315)

**Status:** ✅ Konsistent - Beide folgen der gleichen Hierarchie

---

### 3. Budget-Auslastung (Utilization)

**Problem gefunden:** ❌ Inkonsistente Berechnung

#### Falsche Berechnung (VORHER):
```typescript
// budgetUpdate.service.ts - FALSCH
const utilization = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
```

Dies berechnete die Auslastung basierend auf `plannedCosts` statt `totalBudget`!

#### Korrekte Berechnung (NACHHER):
```typescript
// budgetUpdate.service.ts - KORRIGIERT
const utilization = budget.totalBudget > 0 ? (totalActual / budget.totalBudget) * 100 : 0;
```

**Definition:**
```
Budget-Auslastung = (Tatsächliche Kosten / Gesamtbudget) × 100%
```

**Status:** ✅ Korrigiert

**Betroffene Dateien:**
- ✅ `budgetUpdate.service.ts` - KORRIGIERT (Zeile 161-173)
- ✅ `projectReports.controller.ts` - Bereits korrekt (Zeile 154-156)
- ✅ `projectBudget.controller.ts` - Bereits korrekt (Zeile 331)

---

### 4. Budget-Neuberechnung

**Zwei Implementierungen gefunden:**

#### A) budgetUpdate.service.ts - `recalculateBudget()`
Wird automatisch nach jedem TimeEntry-Clock-Out aufgerufen.

**Berechnet:**
- `plannedCosts` = Summe aller `item.plannedCost`
- `actualCosts` = Summe aller `item.actualCost`
- `remainingBudget` = `totalBudget - actualCosts`
- `budgetUtilization` = `(actualCosts / totalBudget) × 100`

**Status:** ✅ Korrigiert - Nutzt jetzt `totalBudget` statt `plannedCosts` für Utilization

#### B) projectBudget.controller.ts - `recalculateBudget()`
Kann manuell über API aufgerufen werden.

**Berechnet:**
- `plannedCosts` = Summe aller `item.plannedCost`
- `actualCosts` = Summe aller `item.actualCost`
- `remainingBudget` = `totalBudget - actualCosts`
- `budgetUtilization` = `(actualCosts / totalBudget) × 100`

**Status:** ✅ Bereits korrekt

---

### 5. Projekt-Reports Budget-Daten

**Problem gefunden:** ❌ Doppelzählung von Zeitkosten

#### Falsche Berechnung (VORHER):
```typescript
const budgetItemCosts = project.budget.items?.reduce((sum, item) => sum + item.actualCost, 0) || 0;
const actualCosts = budgetItemCosts + timeCosts; // DOPPELZÄHLUNG!
```

Dies addierte die Zeitkosten doppelt:
1. Einmal in den `actualCost` der Budget-Items (LABOR-Kategorie)
2. Nochmal durch separate Berechnung aus TimeEntries

#### Korrekte Berechnung (NACHHER):
```typescript
const actualCosts = project.budget.actualCosts || 0;
```

Nutzt die bereits im `ProjectBudget` gespeicherten `actualCosts`, die durch `budgetUpdate.service.ts` korrekt berechnet werden.

**Status:** ✅ Korrigiert

---

## Datenfluss: TimeEntry → Budget

### Schritt-für-Schritt Ablauf

1. **User macht Clock-Out**
   - TimeEntry Status wird auf `CLOCKED_OUT` gesetzt
   - `clockOut` Timestamp wird gesetzt

2. **Budget-Update wird getriggert** (automatisch)
   - `budgetUpdate.service.ts` → `updateBudgetFromTimeEntry(timeEntryId)`

3. **Stunden berechnen**
   ```typescript
   workedHours = (clockOut - clockIn - pauseMinutes*60*1000) / (1000*60*60)
   ```

4. **Stundensatz ermitteln**
   - Via `getHourlyRateForUser(userId, projectId)`
   - Hierarchie: User → Project → System

5. **Budget-Item finden/erstellen**
   - Kategorie: `LABOR`
   - ItemName: `Vorname Nachname`

6. **Budget-Item aktualisieren**
   ```typescript
   actualHours = bisherige actualHours + neue workedHours
   actualCost = actualHours * hourlyRate
   ```

7. **Budget neu berechnen** (Summen)
   - Summiert alle `item.plannedCost` → `budget.plannedCosts`
   - Summiert alle `item.actualCost` → `budget.actualCosts`
   - Berechnet `remainingBudget = totalBudget - actualCosts`
   - Berechnet `budgetUtilization = (actualCosts / totalBudget) * 100`

---

## Budget-Felder im Detail

### ProjectBudget (Projekt-Level)

| Feld | Typ | Beschreibung | Berechnung |
|------|-----|--------------|------------|
| `totalBudget` | Float | Gesamt-Budget (manuell eingegeben) | Manuell |
| `plannedCosts` | Float | Summe aller geplanten Kosten | Σ item.plannedCost |
| `actualCosts` | Float | Summe aller tatsächlichen Kosten | Σ item.actualCost |
| `remainingBudget` | Float | Restbudget | totalBudget - actualCosts |
| `budgetUtilization` | Float | Auslastung in % | (actualCosts / totalBudget) × 100 |

### ProjectBudgetItem (Positions-Level)

| Feld | Typ | Beschreibung | Berechnung |
|------|-----|--------------|------------|
| `plannedCost` | Float | Geplante Kosten | plannedQuantity × unitPrice ODER plannedHours × hourlyRate |
| `actualCost` | Float | Tatsächliche Kosten | actualQuantity × unitPrice ODER actualHours × hourlyRate |
| `plannedHours` | Float | Geplante Stunden (nur LABOR) | Manuell |
| `actualHours` | Float | Tatsächliche Stunden (nur LABOR) | Summiert aus TimeEntries |
| `hourlyRate` | Float | Stundensatz (nur LABOR) | Aus User/Project/System |
| `variance` | Float | Abweichung | actualCost - plannedCost |
| `variancePercent` | Float | Abweichung in % | (variance / plannedCost) × 100 |

---

## Konsistenz-Regeln

### ✅ Regel 1: Einheitliche Stundenberechnung
**Alle** Stunden-Berechnungen müssen diese Formel verwenden:
```typescript
const workedMs = (clockOut - clockIn) - (pauseMinutes * 60 * 1000);
const workedHours = workedMs / (1000 * 60 * 60);
```

### ✅ Regel 2: Einheitliche Stundensatz-Hierarchie
Reihenfolge: User → Project → System (→ Fallback 100 CHF)

### ✅ Regel 3: Budget-Auslastung basiert auf totalBudget
```typescript
budgetUtilization = (actualCosts / totalBudget) × 100
```
**NICHT** `(actualCosts / plannedCosts) × 100`

### ✅ Regel 4: Keine Doppelzählung
`budget.actualCosts` wird automatisch durch Budget-Items berechnet.
**Niemals** manuell Zeitkosten nochmal addieren!

### ✅ Regel 5: Rundung konsistent
Stunden: 2 Dezimalstellen (`Math.round(hours * 100) / 100`)
CHF: 2 Dezimalstellen (`Math.round(cost * 100) / 100`)

---

## Gefundene und korrigierte Fehler

### Fehler 1: Falsche Budget-Auslastung ❌→✅
**Datei:** `budgetUpdate.service.ts`  
**Zeile:** 169 (alt)  
**Problem:** Utilization wurde basierend auf `plannedCosts` berechnet statt `totalBudget`  
**Lösung:** Korrigiert auf `(actualCosts / totalBudget) × 100`

### Fehler 2: Doppelzählung Zeitkosten ❌→✅
**Datei:** `projectReports.controller.ts`  
**Zeile:** 148 (alt)  
**Problem:** Zeitkosten wurden aus Budget-Items summiert UND nochmal aus TimeEntries berechnet  
**Lösung:** Nutze nur `project.budget.actualCosts`

### Fehler 3: Fehlende plannedCosts Update ❌→✅
**Datei:** `budgetUpdate.service.ts`  
**Zeile:** 185 (alt)  
**Problem:** `plannedCosts` wurde nicht aktualisiert bei Budget-Neuberechnung  
**Lösung:** `plannedCosts: totalPlanned` hinzugefügt

---

## Test-Szenarien

### Szenario 1: Neue Zeiterfassung
```
User: Max Mustermann (hourlyRate: 120 CHF)
Projekt: Web-Entwicklung (totalBudget: 10000 CHF)
TimeEntry: 8:00 - 17:00 (1h Pause) = 8h

Erwartetes Ergebnis:
- Budget-Item "Max Mustermann" wird erstellt/aktualisiert
- actualHours = 8.0h
- actualCost = 960 CHF (8h × 120 CHF)
- budget.actualCosts += 960 CHF
- budget.budgetUtilization wird neu berechnet
```

### Szenario 2: Mehrere Mitarbeiter
```
Projekt totalBudget: 20000 CHF

User A: 10h × 100 CHF = 1000 CHF
User B: 15h × 120 CHF = 1800 CHF
User C: 5h × 80 CHF = 400 CHF

Gesamt actualCosts: 3200 CHF
Utilization: (3200 / 20000) × 100 = 16%
```

### Szenario 3: Budget überschritten
```
Projekt totalBudget: 5000 CHF
actualCosts: 5100 CHF

Utilization: (5100 / 5000) × 100 = 102%
Status: EXCEEDED
remainingBudget: -100 CHF
```

---

## API-Endpunkte mit Berechnungen

### GET /api/project-reports/overview
**Berechnet:**
- Stunden pro Projekt (aus TimeEntries)
- Kosten pro Projekt (aus `budget.actualCosts`)
- Budget-Auslastung (aus `budget.budgetUtilization`)

**Status:** ✅ Korrekt nach Fixes

### GET /api/project-reports/time-tracking
**Berechnet:**
- Gruppierte Stunden (nach User/Tag/Woche/Monat)
- Kosten pro Gruppe (hours × hourlyRate)
- Gesamt-Stunden und -Kosten

**Status:** ✅ Korrekt

### POST /api/project-budgets/:id/recalculate
**Berechnet:**
- plannedCosts, actualCosts
- remainingBudget, budgetUtilization
- Status-Update

**Status:** ✅ Korrekt

---

## Prüf-Checkliste für zukünftige Änderungen

Bei Änderungen an Budget/Stunden-Logik:

- [ ] Verwendet die Berechnung die Standard-Stundenformel?
- [ ] Wird die Stundensatz-Hierarchie eingehalten?
- [ ] Basiert budgetUtilization auf totalBudget?
- [ ] Gibt es Doppelzählungen? (z.B. Zeitkosten)
- [ ] Werden plannedCosts UND actualCosts aktualisiert?
- [ ] Wird der Status korrekt gesetzt? (PLANNING/ACTIVE/EXCEEDED)
- [ ] Sind die Rundungen konsistent? (2 Dezimalstellen)
- [ ] Wurden Tests geschrieben?

---

## Zusammenfassung

### Vor der Korrektur ❌
- Budget-Auslastung wurde falsch berechnet (basierend auf plannedCosts)
- Zeitkosten wurden doppelt gezählt in Reports
- plannedCosts wurden nicht bei Neuberechnung aktualisiert

### Nach der Korrektur ✅
- Alle Budget-Berechnungen verwenden `totalBudget` für Utilization
- Keine Doppelzählung mehr - nur `budget.actualCosts` wird verwendet
- Konsistente Stunden- und Kostenberechnung in allen Bereichen
- plannedCosts wird korrekt aktualisiert

### Nächste Schritte
1. ✅ Backend neu starten (um Änderungen zu aktivieren)
2. 🔄 Manuelle Prüfung mit Test-Daten
3. 📊 Reports testen (Übersicht + Zeiterfassung)
4. 💾 Optional: Historische Budgets neu berechnen

---

**Geprüft von:** AI Development Assistant  
**Dokumentiert am:** 15. Januar 2026  
**Version:** 1.0
