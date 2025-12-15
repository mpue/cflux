# 🐳 Docker Schnellstart

## Voraussetzungen
1. Docker Desktop installieren und starten
2. PowerShell öffnen

## System starten

```powershell
# Zum Projekt navigieren
cd d:\devel\cflux

# Docker Container starten
docker-compose up -d

# Warten bis alles läuft (ca. 30-60 Sekunden)
docker-compose logs -f
```

## Zugriff

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

## Ersten Admin erstellen

1. Im Browser zu http://localhost:3000 gehen
2. Neuen Benutzer registrieren
3. In PowerShell ausführen:

```powershell
docker exec -it timetracking-db psql -U timetracking -d timetracking -c "UPDATE users SET role = 'ADMIN' WHERE email = 'ihre@email.com';"
```

4. Mit Admin-Rechten einloggen!

## System stoppen

```powershell
docker-compose down
```

## System zurücksetzen

```powershell
# ACHTUNG: Löscht alle Daten!
docker-compose down -v
docker-compose up -d
```

## Logs ansehen

```powershell
# Alle Services
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Datenbank
docker-compose logs -f db
```

## Troubleshooting

### Docker Desktop läuft nicht
→ Docker Desktop starten und warten bis "Docker Desktop is running" angezeigt wird

### Port bereits belegt
→ Andere Anwendungen auf Ports 3000, 3001 oder 5432 schließen

### "Unable to get image" Fehler
→ Docker Desktop starten und neu versuchen

Mehr Details in [DOCKER.md](DOCKER.md)
