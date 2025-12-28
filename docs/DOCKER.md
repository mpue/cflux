# Docker Setup - Zeiterfassungssystem

Vollständige Docker-Containerisierung des Zeiterfassungssystems mit PostgreSQL, Backend und Frontend.

## 🚀 Schnellstart

```bash
# Alle Services starten
docker-compose up -d

# System ist erreichbar unter:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# PostgreSQL: localhost:5432
```

## 📦 Container-Architektur

### 1. PostgreSQL Datenbank (db)
- **Image:** postgres:16-alpine
- **Port:** 5432
- **Volumes:** postgres_data (persistente Daten)
- **Health Check:** Überprüft Datenbank-Verfügbarkeit

### 2. Backend API (backend)
- **Base Image:** node:20-alpine
- **Port:** 3001
- **Build:** Multi-Stage Build (Builder + Production)
- **Features:**
  - Automatische Prisma-Migrationen beim Start
  - Wartet auf Datenbank-Verfügbarkeit
  - TypeScript kompiliert zu optimiertem JavaScript

### 3. Frontend (frontend)
- **Base Image:** node:20-alpine (Build) → nginx:alpine (Production)
- **Port:** 3000 (gemappt auf Port 80 im Container)
- **Features:**
  - React Build optimiert für Production
  - Nginx mit Gzip-Kompression
  - SPA-Routing Support
  - Cache-Optimierung für statische Assets

## 🔧 Konfiguration

### Umgebungsvariablen (docker-compose.yml)

#### Datenbank
```yaml
POSTGRES_USER: timetracking
POSTGRES_PASSWORD: timetracking123  # ÄNDERN FÜR PRODUCTION!
POSTGRES_DB: timetracking
```

#### Backend
```yaml
DATABASE_URL: "postgresql://timetracking:timetracking123@db:5432/timetracking?schema=public"
JWT_SECRET: "change-this-secret-in-production"  # ÄNDERN FÜR PRODUCTION!
JWT_EXPIRES_IN: "7d"
PORT: 3001
NODE_ENV: "production"
CORS_ORIGIN: "http://localhost:3000"
```

#### Frontend
```yaml
REACT_APP_API_URL: "http://localhost:3001/api"
```

### Für Production

Erstelle eine `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  db:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
  
  backend:
    environment:
      DATABASE_URL: "postgresql://timetracking:${DB_PASSWORD}@db:5432/timetracking?schema=public"
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: "https://deine-domain.com"
  
  frontend:
    environment:
      REACT_APP_API_URL: "https://api.deine-domain.com/api"
```

Dann starten mit:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📝 Docker Commands

### Basis-Operationen

```bash
# Alle Services starten
docker-compose up -d

# Services im Vordergrund starten (mit Logs)
docker-compose up

# Services stoppen
docker-compose down

# Services stoppen und Volumes löschen (ACHTUNG: Datenverlust!)
docker-compose down -v

# Services neu starten
docker-compose restart

# Einzelnen Service neu starten
docker-compose restart backend
```

### Build & Update

```bash
# Services neu bauen
docker-compose build

# Services neu bauen und starten
docker-compose up -d --build

# Nur einen Service neu bauen
docker-compose build backend
docker-compose up -d backend

# Cache ignorieren beim Build
docker-compose build --no-cache
```

### Logs & Monitoring

```bash
# Logs aller Services ansehen
docker-compose logs

# Logs live verfolgen
docker-compose logs -f

# Logs eines Services
docker-compose logs backend

# Logs mit Timestamps
docker-compose logs -t

# Letzte 100 Zeilen
docker-compose logs --tail=100
```

### Container-Zugriff

```bash
# Shell im Backend-Container öffnen
docker exec -it timetracking-backend sh

# Shell im Datenbank-Container öffnen
docker exec -it timetracking-db sh

# PostgreSQL CLI öffnen
docker exec -it timetracking-db psql -U timetracking -d timetracking

# Command im Container ausführen
docker exec timetracking-backend npm run prisma:studio
```

### Datenbank-Operationen

```bash
# Prisma Migrationen manuell ausführen
docker exec timetracking-backend npx prisma migrate deploy

# Prisma Studio starten
docker exec -it timetracking-backend npx prisma studio

# Datenbank-Backup erstellen
docker exec timetracking-db pg_dump -U timetracking timetracking > backup.sql

# Datenbank-Backup wiederherstellen
cat backup.sql | docker exec -i timetracking-db psql -U timetracking -d timetracking

# Ersten User zum Admin machen
docker exec -it timetracking-db psql -U timetracking -d timetracking -c "UPDATE users SET role = 'ADMIN' WHERE email = 'deine@email.com';"
```

## 🔍 Troubleshooting

### Problem: Backend startet nicht

```bash
# Logs prüfen
docker-compose logs backend

# Häufige Ursache: Datenbank noch nicht bereit
# Lösung: Warten oder Backend neu starten
docker-compose restart backend
```

### Problem: Datenbank-Verbindungsfehler

```bash
# Datenbank-Status prüfen
docker-compose ps db

# Health-Check prüfen
docker inspect timetracking-db | grep -A 10 Health

# Manuell Verbindung testen
docker exec -it timetracking-db psql -U timetracking -d timetracking -c "SELECT 1;"
```

### Problem: Frontend zeigt alte Version

```bash
# Browser-Cache löschen oder
# Frontend neu bauen
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Problem: Prisma/OpenSSL Fehler

```
Error loading shared library libssl.so.1.1
```

**Lösung**: Das Dockerfile installiert bereits `openssl1.1-compat` in Alpine Linux. Wenn der Fehler trotzdem auftritt:
```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

### Problem: Ports bereits belegt

```bash
# Prüfen welcher Prozess Port verwendet
# Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Ports in docker-compose.yml ändern:
ports:
  - "8000:3000"  # Extern:Intern
```

### Problem: Volumes/Daten löschen

```bash
# ACHTUNG: Alle Daten gehen verloren!
docker-compose down -v
docker volume rm cflux_postgres_data

# Dann neu starten
docker-compose up -d
```

## 🔐 Sicherheit für Production

### 1. Secrets ändern
```bash
# Sichere Secrets generieren
openssl rand -base64 32  # Für JWT_SECRET
openssl rand -base64 24  # Für DB_PASSWORD
```

### 2. Docker Compose für Production
- Verwende `.env` Datei für Secrets
- Keine Default-Passwörter
- HTTPS für Frontend (mit Reverse Proxy)
- Sichere CORS-Konfiguration

### 3. Nginx Hardening
Die `nginx.conf` enthält bereits:
- Security Headers (X-Frame-Options, etc.)
- Gzip-Kompression
- Asset-Caching
- SPA-Routing

## 📊 Performance-Optimierung

### Multi-Stage Builds
Beide Dockerfiles verwenden Multi-Stage Builds:
- Kleinere finale Images
- Nur Production-Dependencies
- Keine Build-Tools im finalen Container

### Image-Größen
```bash
# Image-Größen prüfen
docker images | grep timetracking

# Erwartete Größen:
# backend: ~150MB
# frontend: ~40MB
# postgres: ~240MB
```

### Resource-Limits setzen

In `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          memory: 256M
```

## 🌐 Reverse Proxy Setup (Optional)

Für Production mit Domain und SSL:

```nginx
# nginx reverse proxy config
server {
    listen 443 ssl http2;
    server_name app.deine-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🧪 Testing

```bash
# Health Checks
curl http://localhost:3001/health
curl http://localhost:3000

# API Test
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 📚 Weitere Resourcen

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Nginx Documentation](https://nginx.org/en/docs/)
