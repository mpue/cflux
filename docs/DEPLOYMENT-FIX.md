# API URL Fix für Server-Deployment

## Problem

Das Frontend versuchte, von einer öffentlichen IP auf `http://localhost:3001` zuzugreifen, was von der CORS-Policy blockiert wurde:

```
Access to XMLHttpRequest at 'http://localhost:3001/api/auth/login' 
from origin 'http://162.55.212.153:3002' has been blocked by CORS policy
```

## Ursache

In [frontend/src/services/api.ts](frontend/src/services/api.ts) wurde als Fallback `http://localhost:3001/api` verwendet, wenn `REACT_APP_API_URL` leer war.

## Lösung

Die Fallback-URL wurde von `http://localhost:3001/api` zu `/api` geändert. Damit verwendet das Frontend relative Pfade, die nginx automatisch an das Backend weiterleitet.

**Geänderte Dateien:**
- [frontend/src/services/api.ts](frontend/src/services/api.ts#L4)
- [frontend/src/pages/ComplianceDashboard.tsx](frontend/src/pages/ComplianceDashboard.tsx#L6)

## Deployment auf dem Server

### 1. Code auf Server aktualisieren

```bash
# Auf dem Server
cd /pfad/zu/cflux
git pull origin main
```

### 2. Frontend neu bauen und starten

```bash
# Stoppe die Container
docker-compose down

# Baue das Frontend neu (ohne Cache)
docker-compose build --no-cache frontend

# Starte alle Container
docker-compose up -d

# Prüfe die Logs
docker-compose logs -f frontend
docker-compose logs -f backend
```

### 3. Testen

Öffne im Browser:
- Frontend: `http://162.55.212.153:3002`
- Login mit: `admin@timetracking.local` / `admin123`

## Konfiguration

### Lokale Entwicklung

Für lokale Entwicklung (außerhalb Docker) erstelle `.env.local`:

```bash
# frontend/.env.local
REACT_APP_API_URL=http://localhost:3001/api
```

### Production (Docker)

Die Datei `.env.production` bleibt leer, nginx leitet weiter:

```bash
# frontend/.env.production
REACT_APP_API_URL=
```

## Nginx-Konfiguration

Die [nginx.conf](frontend/nginx.conf) leitet alle `/api`-Anfragen an das Backend weiter:

```nginx
location /api {
    proxy_pass http://timetracking-backend:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Weitere Hinweise

### CORS-Konfiguration

In [docker-compose.yml](docker-compose.yml) ist CORS auf `*` gesetzt für Entwicklung:

```yaml
backend:
  environment:
    CORS_ORIGIN: "*"
```

Für Production sollte dies auf die spezifische Domain gesetzt werden:

```yaml
backend:
  environment:
    CORS_ORIGIN: "http://162.55.212.153:3002"
```

### SSL/HTTPS

Für Production sollte HTTPS verwendet werden:

1. Nginx als Reverse Proxy mit SSL konfigurieren
2. Let's Encrypt Zertifikate verwenden
3. CORS_ORIGIN auf HTTPS-URL setzen

## Troubleshooting

### Problem: Noch immer CORS-Fehler

```bash
# Prüfe, ob Frontend richtig gebaut wurde
docker exec timetracking-frontend cat /usr/share/nginx/html/static/js/main.*.js | grep -o "localhost:3001"

# Sollte nichts finden. Falls doch: Frontend neu bauen
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Problem: 502 Bad Gateway

```bash
# Prüfe Backend-Status
docker-compose ps
docker-compose logs backend

# Prüfe Netzwerk-Verbindung
docker exec timetracking-frontend ping timetracking-backend
```

### Problem: API-Anfragen werden nicht weitergeleitet

```bash
# Prüfe nginx-Konfiguration
docker exec timetracking-frontend cat /etc/nginx/conf.d/default.conf

# Prüfe nginx-Logs
docker exec timetracking-frontend cat /var/log/nginx/error.log
```

## Siehe auch

- [Docker Quick Start Guide](DOCKER-QUICKSTART.md)
- [Docker Auto Setup](DOCKER-AUTO-SETUP.md)
- [README](README.md)
