# Playwright Tests - Status & Hinweise

## ✅ Funktionierende Tests

### Smoke Tests (100% funktionsfähig)
Alle 5 Smoke-Tests bestehen in allen Browsern:
```powershell
npm run test:smoke
```

Diese Tests prüfen:
- Homepage lädt erfolgreich
- Login-Seite erreichbar unter `/#/login`  
- Login-Formular ist bedienbar
- Formular-Validierung funktioniert
- Fehlerbehandlung bei falschen Credentials

### Auth Tests (80% funktionsfähig)  
4 von 5 Tests bestehen:
```powershell
npm run test:auth
```

## ⚠️ Bekannte Einschränkungen

### 1. Admin-Login mit Passwort-Änderung
Der erste Login mit `admin@timetracking.local` / `admin123` erfordert eine Passwortänderung.

**Workaround für Tests:**
- Einmal manuell einloggen und Passwort ändern
- Dann Tests mit neuem Passwort ausführen
- ODER: Test-User ohne `requiresPasswordChange` Flag verwenden

### 2. Authentifizierte Tests
Tests die `adminPage` Fixture verwenden, benötigen einen eingeloggten User.

**Optionen:**
- Verwende `test:smoke` für Tests ohne Login
- Erstelle Test-User in der Datenbank ohne Passwort-Änderungs-Pflicht
- Passe `TEST_USERS` in `test-helpers.ts` an

## 🎯 Empfohlene Verwendung

### Für CI/CD Pipeline:
```yaml
# .github/workflows/playwright.yml
- run: npm run test:smoke
```

### Für lokale Entwicklung:
```powershell
# 1. Docker starten
docker-compose up -d

# 2. Smoke Tests ausführen
npm run test:smoke

# 3. Bei Bedarf: Spezifische Tests
npm run test:auth

# 4. Interaktives Debugging
npm run test:ui
```

### Für Test-Entwicklung:
```powershell
# Code Generator starten
npm run test:codegen

# Playwright öffnet Browser und zeichnet Aktionen auf
# Generierter Code kann in neue Tests kopiert werden
```

## 🔧 Anpassungen für dein Projekt

### Test-Credentials aktualisieren
Bearbeite `e2e/helpers/test-helpers.ts`:
```typescript
export const TEST_USERS = {
  admin: {
    email: 'dein-admin@example.com',
    password: 'DeinPasswort123!',
  },
};
```

### Neue Test-Suite hinzufügen
1. Erstelle `e2e/tests/mein-feature.spec.ts`
2. Verwende Smoke-Tests als Vorlage
3. Teste mit `npx playwright test mein-feature.spec.ts`

### Selektoren anpassen
Die App verwendet:
- `input#email` und `input#password` für Login
- `/#/login` für Login-Route
- `/#/dashboard` nach erfolgreichem Login

Bei UI-Änderungen müssen Selektoren in Tests aktualisiert werden.

## 📚 Weitere Ressourcen

- [PLAYWRIGHT_TESTING.md](PLAYWRIGHT_TESTING.md) - Vollständige Dokumentation
- [Playwright Docs](https://playwright.dev) - Offizielle Dokumentation
- Test Reports: `npm run test:report` (nach Test-Ausführung)

## 🐛 Troubleshooting

### Tests hängen
```powershell
# Timeout erhöhen
npx playwright test --timeout=60000
```

### Browser startet nicht
```powershell
# Browser neu installieren
npx playwright install chromium --with-deps
```

### "No tests found"
```powershell
# Stelle sicher, dass du im Root-Verzeichnis bist
cd d:\devel\cflux
npm run test:smoke
```

### Docker läuft nicht
```powershell
# Status prüfen
docker-compose ps

# Neu starten
docker-compose down
docker-compose up -d
```
