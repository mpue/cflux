# Test-Dokumentation

## Backend Tests

### Setup
Die Backend-Tests verwenden **Jest** und **Supertest** für API-Tests.

### Test-Dateien
- `src/__tests__/auth.test.ts` - Authentifizierungs-Tests (Register, Login)
- `src/__tests__/time.test.ts` - Zeiterfassungs-Tests (Clock-in, Clock-out, Bearbeitung)
- `src/__tests__/project-location.test.ts` - Projekt- und Standort-Tests
- `src/__tests__/user-absence.test.ts` - Benutzer- und Abwesenheits-Tests

### Tests ausführen

```bash
cd backend
npm test                # Alle Tests ausführen
npm run test:watch      # Tests im Watch-Mode
```

### Test-Abdeckung

Die Tests decken folgende Bereiche ab:
- ✅ Benutzer-Registrierung und -Anmeldung
- ✅ Zeit ein-/ausstempeln
- ✅ Zeiteinträge bearbeiten und löschen
- ✅ Projekte verwalten (CRUD)
- ✅ Standorte verwalten (CRUD)
- ✅ Abwesenheitsanträge erstellen und genehmigen
- ✅ Benutzer-Verwaltung (Admin)

## Frontend Tests

### Setup
Die Frontend-Tests verwenden **React Testing Library** (bereits in react-scripts enthalten).

### Test-Dateien
- `src/__tests__/Login.test.tsx` - Login-Komponenten-Tests
- `src/services/__tests__/time.service.test.ts` - Zeit-Service-Tests
- `src/services/__tests__/location.service.test.ts` - Standort-Service-Tests

### Tests ausführen

```bash
cd frontend
npm test                # Alle Tests im interaktiven Mode
npm test -- --coverage  # Mit Coverage-Report
```

### Test-Abdeckung

Die Frontend-Tests decken folgende Bereiche ab:
- ✅ Login-Formular und Validierung
- ✅ Authentifizierungs-Service
- ✅ Zeit-Service (Clock-in/out, Bearbeitung)
- ✅ Standort-Service (CRUD-Operationen)

## Mocking

### Backend
- Prisma Client wird für alle Tests gemockt
- JWT-Token werden für authentifizierte Requests generiert

### Frontend
- API-Aufrufe werden mit jest.mock gemockt
- localStorage wird gemockt
- window.alert und window.confirm werden gemockt

## Continuous Integration

Die Tests können in CI/CD-Pipelines integriert werden:

```yaml
# Beispiel GitHub Actions
- name: Run Backend Tests
  run: |
    cd backend
    npm install
    npm test

- name: Run Frontend Tests
  run: |
    cd frontend
    npm install
    npm test -- --coverage --watchAll=false
```

## Best Practices

1. **Isolation**: Jeder Test ist unabhängig und hat keinen Einfluss auf andere Tests
2. **Mocking**: Externe Abhängigkeiten (DB, API) werden gemockt
3. **Assertions**: Klare und aussagekräftige Assertions
4. **Coverage**: Ziel ist mindestens 80% Code-Abdeckung
5. **Naming**: Tests sind nach dem Muster "should [expected behavior]" benannt
