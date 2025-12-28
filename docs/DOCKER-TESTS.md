# Docker Test Guide

## Tests während des Builds

Die Dockerfiles führen automatisch Tests aus während des Build-Prozesses:

### Backend
```bash
docker build -t timetracking-backend ./backend
```
- Tests werden in der `test`-Stage ausgeführt
- Build schlägt fehl, wenn Tests fehlschlagen
- Coverage-Report wird generiert

### Frontend
```bash
docker build -t timetracking-frontend ./frontend
```
- Tests werden vor dem Build ausgeführt
- Build schlägt fehl, wenn Tests fehlschlagen

## Separate Test-Ausführung

### Mit Docker Compose

Nur Tests ausführen:
```bash
# Backend Tests
docker-compose run --rm backend-test

# Oder mit Profile
docker-compose --profile test up backend-test
```

### Standard Build ohne Tests

Wenn Sie den Build ohne Tests durchführen möchten (z.B. für Entwicklung):

**Backend - nur Build-Stage:**
```bash
docker build --target build -t timetracking-backend-dev ./backend
```

**Frontend - Tests überspringen:**
```dockerfile
# Kommentieren Sie die Test-Zeile in Dockerfile aus
# RUN npm test -- --coverage --passWithNoTests --watchAll=false
```

## Production Deployment

Standard docker-compose startet Production-Container (mit Tests während Build):
```bash
docker-compose up -d
```

## Multi-Stage Builds

### Backend Stages:
1. **builder** - Basis mit Dependencies
2. **test** - Führt Tests aus
3. **build** - Kompiliert TypeScript
4. **production** - Finales Image (default)

### Vorteile:
- ✅ Tests werden bei jedem Build ausgeführt
- ✅ Fehlerhafte Builds werden frühzeitig erkannt
- ✅ Production-Images enthalten keine Test-Dependencies
- ✅ Kleinere finale Images
- ✅ CI/CD-ready

## CI/CD Integration

```yaml
# Beispiel GitHub Actions
- name: Build and Test Backend
  run: docker build -t backend ./backend

- name: Build and Test Frontend  
  run: docker build -t frontend ./frontend

# Tests schlagen automatisch fehl, wenn Code-Probleme bestehen
```

## Lokale Entwicklung

Für schnellere Entwicklung ohne Docker:
```bash
# Backend
cd backend
npm install
npm test
npm run dev

# Frontend
cd frontend
npm install
npm test
npm start
```
