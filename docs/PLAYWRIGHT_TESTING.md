# Playwright E2E Testing für cflux

Dieses Dokument beschreibt die Integration und Verwendung von Playwright für End-to-End Tests im cflux Time Tracking System.

## Schnellstart

```powershell
# 1. Stelle sicher, dass Docker läuft
docker-compose up -d

# 2. Führe Smoke-Tests aus (empfohlen für schnelle Überprüfung)
npm run test:smoke

# 3. Alle Tests ausführen
npm test

# 4. Interaktiver UI-Modus
npm run test:ui
```

## Installation

### Dependencies installieren

```powershell
# Im Hauptverzeichnis des Projekts
npm install -D @playwright/test

# Playwright Browser installieren
npx playwright install
```

## Projektstruktur

```
cflux/
├── e2e/
│   ├── helpers/
│   │   └── test-helpers.ts       # Wiederverwendbare Test-Hilfsfunktionen
│   ├── setup/
│   │   └── auth.setup.ts         # Setup für authentifizierte Tests (optional)
│   └── tests/
│       ├── smoke.spec.ts         # ✅ Smoke Tests (grundlegende Funktionalität)
│       ├── auth.spec.ts          # Login/Logout Tests
│       ├── dashboard.spec.ts     # Dashboard Tests
│       ├── time-tracking.spec.ts # Zeiterfassung Tests
│       ├── projects.spec.ts      # Projekt-Management Tests
│       ├── admin.spec.ts         # Admin-Funktionen Tests
│       └── intranet.spec.ts      # Intranet Tests
├── playwright.config.ts          # Playwright Konfiguration
└── .gitignore                    # Ignores für Test-Artefakte
```

## Test-Kategorien

### Smoke Tests (Empfohlen für CI/CD)
Die Smoke-Tests überprüfen grundlegende Funktionalität ohne Login:
- Homepage lädt erfolgreich
- Login-Seite ist erreichbar
- Login-Formular ist bedienbar
- Fehlerbehandlung bei falschen Credentials

```powershell
npm run test:smoke
```

**✅ Status: Alle Smoke-Tests funktionieren zu 100%**

## Konfiguration

Die Hauptkonfiguration befindet sich in `playwright.config.ts`:

- **Base URL**: `http://localhost:3002` (Docker) oder `http://localhost:3000` (dev)
- **Browser**: Chromium, Firefox, WebKit
- **Parallel Execution**: Ja (außer auf CI)
- **Retries**: 2x auf CI, 0x lokal
- **Reports**: HTML, JSON, List

## Tests ausführen

### Voraussetzungen

Die Anwendung muss laufen (Docker ist empfohlen):

```powershell
# Mit Docker (empfohlen für Tests)
docker-compose up -d

# Warte bis Services bereit sind
docker-compose logs -f backend
# Warte auf: "Server running on port 3001"
```

### Schnelle Tests

```powershell
# Smoke Tests - Schnelle Basis-Überprüfung (empfohlen)
npm run test:smoke

# Nur Login-Tests
npm run test:auth

# Alle Tests in einem Browser
npm run test:chromium
```

### Vollständige Tests

```powershell
# Alle Tests in allen Browsern
npx playwright test

# Nur Chromium
npx playwright test --project=chromium

# Spezifische Test-Datei
npx playwright test e2e/tests/auth.spec.ts

# Im UI Mode (interaktiv)
npx playwright test --ui

# Im Debug Mode
npx playwright test --debug
```

### Tests mit bestimmten Tags

```powershell
# Nur Tests mit @smoke Tag
npx playwright test --grep @smoke

# Alle außer @slow Tests
npx playwright test --grep-invert @slow
```

## Test-Hilfsfunktionen

### Authentifizierung

```typescript
import { test, expect, TEST_USERS } from '../helpers/test-helpers';

// Option 1: adminPage Fixture verwenden
test('my admin test', async ({ adminPage }) => {
  // Bereits eingeloggt als Admin
  await adminPage.goto('/#/dashboard');
});

// Option 2: Manuell einloggen
test('custom login', async ({ page }) => {
  await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  // Jetzt eingeloggt
});
```

### API Responses warten

```typescript
import { waitForApiResponse } from '../helpers/test-helpers';

test('wait for API', async ({ page }) => {
  const responsePromise = waitForApiResponse(page, '/api/time/entries');
  await page.click('button:has-text("Laden")');
  const response = await responsePromise;
  expect(response.status()).toBe(200);
});
```

### Element-Existenz prüfen

```typescript
import { elementExists } from '../helpers/test-helpers';

test('check element', async ({ page }) => {
  const exists = await elementExists(page, '.my-element');
  if (exists) {
    // Element gefunden
  }
});
```

## Test-Patterns

### Standard Test-Struktur

```typescript
import { test, expect } from '../helpers/test-helpers';

test.describe('Feature Name', () => {
  // Wird vor jedem Test ausgeführt
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/feature');
  });

  test('should do something', async ({ page }) => {
    // Test-Logik
    await page.click('button');
    await expect(page.locator('h1')).toHaveText('Expected');
  });

  test('should handle error', async ({ page }) => {
    // Error-Handling Test
  });
});
```

### Test mit Authentication

```typescript
test.describe('Authenticated Tests', () => {
  // Diese Storage-State wird automatisch geladen
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('protected page', async ({ adminPage }) => {
    // Bereits eingeloggt
  });
});
```

### API-Mocking (optional)

```typescript
test('mock API response', async ({ page }) => {
  await page.route('**/api/time/entries', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify([{ id: 1, hours: 8 }])
    });
  });
  
  await page.goto('/#/time');
  // API wurde gemockt
});
```

## Reports und Debugging

### HTML Report anzeigen

```powershell
npx playwright show-report
```

### Screenshots und Videos

Bei fehlgeschlagenen Tests werden automatisch erstellt:
- Screenshots: `test-results/*/test-failed-*.png`
- Videos: `test-results/*/video.webm`
- Traces: `test-results/*/trace.zip`

### Trace Viewer

```powershell
# Trace von fehlgeschlagenem Test anzeigen
npx playwright show-trace test-results/*/trace.zip
```

## CI/CD Integration

GitHub Actions Workflow ist bereits konfiguriert in `.github/workflows/playwright.yml`.

Tests laufen automatisch bei:
- Push auf `main` oder `develop`
- Pull Requests
- Manuell über GitHub UI

### CI-spezifische Konfiguration

- Verwendet PostgreSQL Service Container
- Startet Backend und Frontend
- Führt nur Chromium-Tests aus (schneller)
- Upload von Reports als Artifacts

## Best Practices

### 1. Selektoren

```typescript
// ✅ EMPFOHLEN: Text-basiert (robust)
await page.click('button:has-text("Speichern")');

// ✅ EMPFOHLEN: Data-Testid
await page.click('[data-testid="save-button"]');

// ⚠️ OK: Name-Attribut
await page.fill('input[name="email"]', 'test@example.com');

// ❌ VERMEIDEN: CSS-Klassen (fragil)
await page.click('.btn.btn-primary.save-btn');
```

### 2. Waits

```typescript
// ✅ EMPFOHLEN: Auto-waiting durch Playwright
await page.click('button');
await expect(page.locator('.result')).toBeVisible();

// ⚠️ NOTFALLS: Explizites Wait
await page.waitForSelector('.dynamic-content');

// ❌ VERMEIDEN: Feste Timeouts
await page.waitForTimeout(5000); // Nur in Ausnahmefällen!
```

### 3. Test-Isolation

```typescript
// ✅ EMPFOHLEN: Jeder Test ist unabhängig
test.beforeEach(async ({ page }) => {
  await page.goto('/#/clean-state');
});

// ❌ VERMEIDEN: Tests hängen voneinander ab
test('step 1', async ({ page }) => {
  // Erstellt Daten
});
test('step 2', async ({ page }) => {
  // Erwartet Daten von step 1 - FRAGIL!
});
```

### 4. Assertions

```typescript
// ✅ EMPFOHLEN: Spezifische Assertions
await expect(page.locator('h1')).toHaveText('Dashboard');
await expect(page).toHaveURL(/.*#\/dashboard/);

// ⚠️ OK: Mit Fallback
await expect(page.locator('.message')).toBeVisible({ timeout: 5000 })
  .catch(() => { /* Optional */ });
```

## Troubleshooting

### Tests hängen oder timeout

```powershell
# Erhöhe Timeout in playwright.config.ts
timeout: 60 * 1000, // 60 Sekunden

# Oder pro Test
test('slow test', async ({ page }) => {
  test.setTimeout(120000); // 2 Minuten
});
```

### Browser startet nicht

```powershell
# Browser neu installieren
npx playwright install --with-deps chromium
```

### Tests schlagen lokal nicht fehl, aber auf CI

```powershell
# CI-Modus lokal simulieren
CI=true npx playwright test
```

### Authentication schlägt fehl

```powershell
# Auth-Setup neu ausführen
npx playwright test e2e/setup/auth.setup.ts

# Storage State prüfen
cat e2e/.auth/admin.json
```

## Erweitern

### Neue Test-Suite hinzufügen

1. Erstelle neue Datei in `e2e/tests/`:
```typescript
// e2e/tests/invoices.spec.ts
import { test, expect } from '../helpers/test-helpers';

test.describe('Invoices', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('should display invoices', async ({ adminPage }) => {
    await adminPage.goto('/#/invoices');
    await expect(adminPage).toHaveURL(/.*#\/invoices/);
  });
});
```

2. Test ausführen:
```powershell
npx playwright test invoices
```

### Custom Fixture hinzufügen

```typescript
// e2e/helpers/test-helpers.ts
export const test = base.extend<{ managerPage: any }>({
  managerPage: async ({ page }, use) => {
    await login(page, TEST_USERS.manager.email, TEST_USERS.manager.password);
    await use(page);
  },
});
```

## Nützliche Links

- [Playwright Dokumentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)

## Support

Bei Fragen oder Problemen:
1. Prüfe die [Playwright Docs](https://playwright.dev)
2. Schau dir existierende Tests als Beispiele an
3. Nutze `--ui` Mode für interaktives Debugging
