# 🐳 Docker Schnellstart

## Voraussetzungen
1. Docker Desktop installieren und starten
2. Repository klonen

## 🚀 System starten (3 Schritte!)

### 1. Docker Container bauen und starten
```powershell
cd d:\devel\cflux
docker-compose up --build -d
```

### 2. Warten bis alles läuft
```powershell
# Logs beobachten
docker-compose logs -f backend
```
Warten Sie auf: "Server running on port 3001"

### 3. Browser öffnen
```
http://localhost:3002
```

## 🔐 Erster Login

### Standard Admin-Zugangsdaten
- **Email:** `admin@timetracking.local`  
- **Passwort:** `admin123`

### Nach dem Login
Sie werden **automatisch** aufgefordert, Ihr Passwort zu ändern.  
Dies geschieht komplett im Browser - keine Kommandozeile nötig! ✨

## ⚙️ System-URLs

- **Frontend:** http://localhost:3002
- **Backend API:** http://localhost:3001
- **API Health:** http://localhost:3001/health

## 🛠️ Nützliche Befehle

### System stoppen
```powershell
docker-compose down
```

### System neu starten
```powershell
docker-compose restart
```

### Logs anzeigen
```powershell
# Alle Logs
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Frontend
docker-compose logs -f frontend
```

### System zurücksetzen
```powershell
# ACHTUNG: Löscht alle Daten!
docker-compose down -v
docker-compose up --build -d

# Admin-Login ist wieder: admin123
```

## 📖 Was passiert automatisch?

Beim ersten Start:
1. ✅ PostgreSQL Datenbank wird erstellt
2. ✅ Datenbank-Migrationen laufen durch
3. ✅ Alle System-Module werden installiert
4. ✅ Admin-Benutzer wird angelegt
5. ✅ Server startet

**Alles komplett automatisch - Sie müssen nichts manuell machen!**

## 🎯 Erste Schritte nach dem Login

1. Passwort ändern (wird automatisch angezeigt)
2. Weitere Benutzer anlegen
3. Projekte erstellen
4. Zeiterfassung starten

## ❓ Probleme?

### Container startet nicht
```powershell
# Logs prüfen
docker-compose logs backend

# Container neu bauen
docker-compose up --build -d
```

### Kann mich nicht anmelden
- Email: `admin@timetracking.local`
- Passwort: `admin123`
- Falls geändert: System zurücksetzen (siehe oben)

### Port bereits belegt
Ports ändern in `docker-compose.yml`:
- Frontend: `3002:80` → `8080:80`
- Backend: `3001:3001` → `8001:3001`

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
