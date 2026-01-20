# Zeitmodell-Budget Integration Tests

## Übersicht

Diese Tests verifizieren die korrekte Integration von Zeitmodellen mit dem Budget-System.

## Test-Datei

`backend/src/__tests__/zeitmodell-budget-integration.test.ts`

## Test-Kategorien

### 1. Hierarchie der Stundensatz-Ermittlung

Tests für `getHourlyRateForUser()`:

- ✅ Zeitmodell-Stundensatz hat höchste Priorität (wenn timestamp übergeben)
- ✅ Fallback auf `User.hourlyRate` wenn kein Zeitmodell gefunden
- ✅ Fallback auf `Project.defaultHourlyRate` wenn User.hourlyRate fehlt
- ✅ Fallback auf `SystemSettings.defaultHourlyRate` als letztes
- ✅ Fehler wenn kein Stundensatz gefunden werden kann
- ✅ Rückwärtskompatibilität (ohne timestamp → kein Zeitmodell-Lookup)

### 2. Budget-Berechnung mit Zeitmodell

Tests für `updateBudgetFromTimeEntry()`:

- ✅ Budget wird mit Zeitmodell-Stundensatz aktualisiert (z.B. Nachtzuschlag)
- ✅ Budget wird mit Standard-Stundensatz aktualisiert wenn kein Zeitmodell
- ✅ Pausenzeit wird korrekt von Arbeitsstunden abgezogen
- ✅ Nichts passiert wenn kein aktives Budget vorhanden
- ✅ Nichts passiert wenn TimeEntry noch nicht ausgeclockt

### 3. Zeitbasierte Stundensätze

Tests für variable Stundensätze:

- ✅ Tag- vs. Nachtstundensatz (z.B. 100 CHF/h vs. 125 CHF/h)
- ✅ Feiertagszuschlag (z.B. 200 CHF/h am Neujahr)

## Tests ausführen

### Alle Tests

```bash
cd backend
npm test
```

### Nur Zeitmodell-Budget-Tests

```bash
npm test zeitmodell-budget-integration
```

### Mit Coverage

```bash
npm run test:coverage
```

### Watch Mode (während Entwicklung)

```bash
npm test -- --watch
```

## Test-Struktur

```typescript
describe('Zeitmodell-Budget Integration', () => {
  
  describe('getHourlyRateForUser', () => {
    // Tests für Stundensatz-Hierarchie
  });

  describe('Budget-Berechnung mit Zeitmodell', () => {
    // Tests für Budget-Updates
  });

  describe('Zeitbasierte Stundensätze', () => {
    // Tests für variable Stundensätze
  });
});
```

## Mock-Strategie

### Prisma Client

Alle Prisma-Operationen werden gemockt in `setup.ts`:

```typescript
(prisma.user.findUnique as jest.Mock).mockResolvedValue({...})
(prisma.projectBudget.findFirst as jest.Mock).mockResolvedValue({...})
```

### ZeitmodellService

Der `ZeitmodellService` wird gemockt um verschiedene Szenarien zu testen:

```typescript
const mockGetStundensatz = jest.fn().mockResolvedValue({
  stundensatz: 125,
  zeitmodellName: 'Schichtmodell',
});

(ZeitmodellService as jest.Mock).mockImplementation(() => ({
  getStundensatz: mockGetStundensatz,
}));
```

## Test-Szenarien

### Szenario 1: Nachtzuschlag

```typescript
it('sollte Budget mit Zeitmodell-Stundensatz aktualisieren', async () => {
  // TimeEntry: 18:00 - 20:00 (2h Nachtarbeit)
  // Zeitmodell gibt: 125 CHF/h (Nachtzuschlag)
  // Expected: actualCost = 2h × 125 = 250 CHF
});
```

### Szenario 2: Kein Zeitmodell (Fallback)

```typescript
it('sollte Budget mit Standard-Stundensatz aktualisieren', async () => {
  // TimeEntry: 09:00 - 17:00 (8h, 1h Pause = 7h)
  // Kein Zeitmodell → User.hourlyRate = 80 CHF/h
  // Expected: actualCost = 7h × 80 = 560 CHF
});
```

### Szenario 3: Feiertagszuschlag

```typescript
it('sollte Feiertagszuschlag verwenden', async () => {
  // Datum: 01.01.2026 (Neujahr)
  // Zeitmodell gibt: 200 CHF/h (Feiertagszuschlag)
  // Expected: hourlyRate = 200 CHF/h
});
```

## Erwartete Test-Ausgabe

```bash
PASS  src/__tests__/zeitmodell-budget-integration.test.ts
  Zeitmodell-Budget Integration
    getHourlyRateForUser
      ✓ sollte Zeitmodell-Stundensatz verwenden wenn Zeitmodell vorhanden (5ms)
      ✓ sollte auf User.hourlyRate zurückfallen wenn kein Zeitmodell gefunden (3ms)
      ✓ sollte auf Project.defaultHourlyRate zurückfallen wenn User.hourlyRate fehlt (2ms)
      ✓ sollte auf SystemSettings.defaultHourlyRate zurückfallen als letztes (2ms)
      ✓ sollte Fehler werfen wenn kein Stundensatz gefunden werden kann (2ms)
      ✓ sollte ohne timestamp User.hourlyRate verwenden (Rückwärtskompatibilität) (2ms)
    Budget-Berechnung mit Zeitmodell
      ✓ sollte Budget mit Zeitmodell-Stundensatz aktualisieren (4ms)
      ✓ sollte Budget mit Standard-Stundensatz aktualisieren wenn kein Zeitmodell (3ms)
      ✓ sollte nichts tun wenn kein aktives Budget vorhanden (2ms)
      ✓ sollte nichts tun wenn TimeEntry noch nicht ausgeclockt (2ms)
    Zeitbasierte Stundensätze
      ✓ sollte verschiedene Stundensätze für Tag und Nacht verwenden (3ms)
      ✓ sollte Feiertagszuschlag verwenden (2ms)

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
```

## Fehlerbehandlung

Die Tests decken folgende Fehlerfälle ab:

1. **Kein Zeitmodell gefunden** → Fallback auf User/Project/System
2. **Kein Stundensatz definiert** → Error wird geworfen
3. **Kein Budget vorhanden** → Keine Aktion
4. **TimeEntry nicht ausgeclockt** → Keine Aktion
5. **ZeitmodellService wirft Fehler** → Fallback funktioniert

## Integration mit CI/CD

Die Tests können in CI/CD-Pipelines integriert werden:

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: |
    cd backend
    npm ci
    npm test
```

## Debugging

### Einzelnen Test ausführen

```bash
npm test -- -t "sollte Zeitmodell-Stundensatz verwenden"
```

### Verbose Output

```bash
npm test -- --verbose
```

### Test mit Console Logs

```bash
npm test -- --silent=false
```

## Coverage Ziele

Ziel ist mindestens **80% Coverage** für:

- `hourlyRate.service.ts`
- `budgetUpdate.service.ts`
- Integration zwischen beiden Services

## Weitere Tests

Zusätzliche Tests, die noch erstellt werden könnten:

1. **End-to-End Tests** mit echter Datenbank
2. **Performance Tests** für große Zeiträume
3. **Concurrency Tests** für parallele Clock-Outs
4. **Regression Tests** für bekannte Bugs

## Siehe auch

- [ZEITMODELL_BUDGET_INTEGRATION.md](../../docs/ZEITMODELL_BUDGET_INTEGRATION.md) - Dokumentation
- [jest.config.js](../jest.config.js) - Jest Konfiguration
- [setup.ts](./setup.ts) - Test Setup und Mocks
