# 🚀 CFlux - Quick Start

## Installation (3 Schritte)

### 1. Repository klonen
```bash
git clone <repository-url>
cd cflux
```

### 2. Docker starten
```bash
docker-compose up --build -d
```

### 3. Browser öffnen
```
http://localhost:3002
```

## 🔐 Login

**Standard Admin-Zugangsdaten:**
```
Email:    admin@timetracking.local
Passwort: admin123
```

**Nach dem ersten Login:**
- ✅ Modal erscheint automatisch
- ✅ Passwort ändern (im Browser)
- ✅ Fertig!

## 📍 URLs

- **Frontend:** http://localhost:3002
- **Backend:** http://localhost:3001
- **Health:** http://localhost:3001/health

## 🛠️ Befehle

```bash
# Starten
docker-compose up -d

# Stoppen
docker-compose down

# Logs anzeigen
docker-compose logs -f backend

# Zurücksetzen (löscht alle Daten!)
docker-compose down -v
docker-compose up --build -d
```

## ✨ Das war's!

Keine Kommandozeilen-Befehle für Setup nötig.  
Alles läuft über den Browser.

---

**Probleme?** → Siehe [DOCKER-AUTO-SETUP.md](DOCKER-AUTO-SETUP.md)
