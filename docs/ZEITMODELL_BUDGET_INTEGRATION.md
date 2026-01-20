# Zeitmodell-Budget Integration

## Übersicht

Die Zeitmodell-Stundensätze sind jetzt mit dem Budget-System integriert. Das System verwendet eine intelligente Fallback-Hierarchie, um den passenden Stundensatz zu ermitteln.

## Hierarchie der Stundensatz-Ermittlung

**Neue Hierarchie (ab Januar 2026):**

1. **Zeitmodell-Stundensatz** (höchste Priorität)
   - Wird verwendet, wenn für den User ein aktives Zeitmodell existiert
   - Zeitbasiert: Nutzt den Stundensatz zum Zeitpunkt des Clock-Out
   - Unterstützt variable Sätze (z.B. Nachtzuschläge, Feiertagszuschläge)
   - Quelle: `ZeitmodellEintrag.stundensatz`

2. **User-spezifischer Stundensatz**
   - Fallback wenn kein Zeitmodell vorhanden
   - Quelle: `User.hourlyRate`

3. **Projekt-Default-Stundensatz**
   - Fallback wenn User.hourlyRate nicht gesetzt
   - Quelle: `Project.defaultHourlyRate`

4. **System-Default-Stundensatz** (niedrigste Priorität)
   - Letzter Fallback
   - Quelle: `SystemSettings.defaultHourlyRate`

## Technische Implementierung

### hourlyRate.service.ts

```typescript
export async function getHourlyRateForUser(
  userId: string,
  projectId?: string,
  timestamp?: Date  // NEU: Optional für Zeitmodell-Lookup
): Promise<number>
```

**Logik:**
1. Wenn `timestamp` übergeben wird → Prüfe Zeitmodell
2. Wenn Zeitmodell gefunden → Verwende `zeitmodell.service.getStundensatz()`
3. Sonst → Fallback auf User → Project → System

### budgetUpdate.service.ts

Bei Clock-Out wird der Stundensatz mit Timestamp übergeben:

```typescript
hourlyRate = await getHourlyRateForUser(
  timeEntry.userId, 
  timeEntry.projectId,
  timeEntry.clockOut  // Clock-Out Zeitpunkt für Zeitmodell-Lookup
);
```

### zeitmodell.service.ts

Die `ZeitmodellService` Klasse ist jetzt exportiert:

```typescript
export class ZeitmodellService {
  async getStundensatz(
    mitarbeiterId: string,
    datum: Date,
    uhrzeit: string
  ): Promise<StundensatzResult>
}
```

## Anwendungsfälle

### Use Case 1: Mitarbeiter mit Zeitmodell

**Szenario:** Ein Mitarbeiter hat ein Zeitmodell mit Nachtzuschlägen:
- 08:00-18:00 → 100 CHF/h
- 18:00-08:00 → 125 CHF/h (Nachtzuschlag)

**Verhalten:**
- Clock-Out um 16:00 → Budget wird mit 100 CHF/h berechnet
- Clock-Out um 22:00 → Budget wird mit 125 CHF/h berechnet

### Use Case 2: Mitarbeiter ohne Zeitmodell

**Szenario:** Ein Mitarbeiter hat kein Zeitmodell, aber `User.hourlyRate = 85 CHF/h`

**Verhalten:**
- Jeder Clock-Out → Budget wird mit 85 CHF/h berechnet (unabhängig von der Zeit)

### Use Case 3: Feiertagszuschlag

**Szenario:** Zeitmodell mit Feiertagsregel:
- Normaler Tag → 100 CHF/h
- Feiertag → 200 CHF/h

**Verhalten:**
- Clock-Out am 1. Januar → Budget wird mit 200 CHF/h berechnet
- Clock-Out am 15. Januar → Budget wird mit 100 CHF/h berechnet

## Logging

Das System loggt die verwendete Quelle für Transparenz:

```
[HOURLY_RATE] Zeitmodell-Stundensatz verwendet: 125 CHF/h (Schichtmodell 2025)
[HOURLY_RATE] Kein Zeitmodell verfügbar, verwende Standard-System
[HOURLY_RATE] User-Stundensatz verwendet: 85 CHF/h
[HOURLY_RATE] Projekt-Stundensatz verwendet: 95 CHF/h
[HOURLY_RATE] System-Default-Stundensatz verwendet: 100 CHF/h
```

## Rückwärtskompatibilität

Die Integration ist vollständig rückwärtskompatibel:

- **Bestehende Projekte:** Funktionieren ohne Änderungen weiter
- **Mitarbeiter ohne Zeitmodell:** Nutzen weiterhin User/Project/System-Stundensätze
- **Optionaler Parameter:** `timestamp` ist optional in `getHourlyRateForUser()`

## Budget-Berechnung

### Zeitpunkt der Berechnung

Budget-Updates erfolgen automatisch bei **Clock-Out**:

1. User macht Clock-Out
2. `time.controller.ts` triggert `updateBudgetFromTimeEntry()`
3. System ermittelt Stundensatz mit Clock-Out Zeitpunkt
4. Budget-Position wird aktualisiert

### Formel

```
workedHours = (clockOut - clockIn - pauseMinutes) / 3600000
hourlyRate = getHourlyRateForUser(userId, projectId, clockOut)
cost = workedHours × hourlyRate
```

### Budget-Position

Für jeden User wird ein `ProjectBudgetItem` angelegt:

```typescript
{
  category: 'LABOR',
  itemName: 'Max Mustermann',
  actualHours: 8.5,
  hourlyRate: 125,  // Aus Zeitmodell oder Fallback
  actualCost: 1062.50
}
```

## Migration

### Für bestehende Systeme

Keine Migration erforderlich! Das System funktioniert sofort:

1. **Phase 1:** Alle Mitarbeiter nutzen weiterhin User/Project/System-Stundensätze
2. **Phase 2:** Nach und nach Zeitmodelle für Mitarbeiter anlegen
3. **Phase 3:** System verwendet automatisch Zeitmodelle, sobald aktiv

### Empfohlene Schritte

1. Zeitmodelle in Admin-Bereich erstellen
2. Mitarbeitern Zeitmodelle zuweisen (`MitarbeiterZeitmodell`)
3. `gueltigVon`/`gueltigBis` Datumsbereich definieren
4. System verwendet automatisch Zeitmodell-Stundensätze

## Unterschied zu Payroll

**Wichtig:** Dies betrifft nur **Budget-Berechnungen** für Projekte.

- **Projekt-Budget:** Nutzt Zeitmodell-Stundensätze für Kostenberechnung
- **Payroll:** Nutzt separate `SalaryConfiguration` (Gehalt, Zuschläge, Abzüge)

Die Systeme sind getrennt, weil:
- Budget: "Was kostet dieser Mitarbeiter das Projekt?"
- Payroll: "Was verdient der Mitarbeiter?"

Diese können unterschiedlich sein (z.B. interner Verrechnungssatz vs. tatsächliches Gehalt).

## Testing

### Manuelle Tests

```bash
# 1. Mitarbeiter ohne Zeitmodell → Sollte User.hourlyRate verwenden
POST /api/time/clock-in
POST /api/time/clock-out

# 2. Mitarbeiter mit Zeitmodell → Sollte Zeitmodell-Stundensatz verwenden
POST /api/zeitmodelle
POST /api/zeitmodelle/:id/zuweisen
POST /api/time/clock-in
POST /api/time/clock-out

# 3. Logs prüfen für "[HOURLY_RATE]"
docker-compose logs -f backend | grep HOURLY_RATE
```

### Erwartete Log-Ausgaben

```
[HOURLY_RATE] Zeitmodell-Stundensatz verwendet: 125 CHF/h (Schichtmodell 2025)
Budget aktualisiert: 8.00h für Max Mustermann (125 CHF/h = 1000.00 CHF)
```

## Troubleshooting

### Problem: Zeitmodell wird nicht verwendet

**Symptome:** Logs zeigen "Kein Zeitmodell verfügbar"

**Lösung:**
1. Prüfe ob `MitarbeiterZeitmodell` existiert: `GET /api/zeitmodelle/mitarbeiter/:userId`
2. Prüfe `gueltigVon`/`gueltigBis` Datumsbereich
3. Prüfe ob `ZeitmodellEintrag` für die Clock-Out Zeit existiert

### Problem: Falscher Stundensatz berechnet

**Symptome:** Budget-Kosten stimmen nicht

**Lösung:**
1. Prüfe Logs für "[HOURLY_RATE]" um Quelle zu sehen
2. Prüfe `ZeitmodellEintrag` Zeitbereiche und Prioritäten
3. Prüfe Feiertagslogik (`nurFeiertage`/`keineFeiertage`)

## Siehe auch

- [MODULE_PERMISSIONS.md](./MODULE_PERMISSIONS.md) - Zeitmodell-Berechtigungen
- [ZEITMODELLE_MODULE.md](./ZEITMODELLE_MODULE.md) - Zeitmodell-Dokumentation
- [PROJECT_BUDGET_MODULE.md](./PROJECT_BUDGET_MODULE.md) - Budget-System
- [CALCULATIONS_CONSISTENCY_CHECK.md](./CALCULATIONS_CONSISTENCY_CHECK.md) - Berechnungslogik
