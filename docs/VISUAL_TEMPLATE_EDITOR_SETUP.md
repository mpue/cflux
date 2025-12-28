# Installation & Setup - Visueller Template-Editor

## Voraussetzungen

- Node.js 18+ und npm
- PostgreSQL Datenbank
- Bestehendes cflux Projekt

## Installation

### 1. Backend Dependencies

Die benötigten Dependencies sind bereits in der `package.json` vorhanden. Falls nicht, installiere:

```bash
cd backend
npm install multer @types/multer
```

### 2. Datenbank-Migration

Führe die Migration aus, um die neuen Felder hinzuzufügen:

```bash
cd backend
npm run prisma:migrate
```

Oder manuell:

```bash
cd backend
npx prisma migrate dev --name add_logo_position
```

### 3. Upload-Ordner erstellen

Der Upload-Ordner wird automatisch erstellt, kann aber auch manuell angelegt werden:

```bash
cd backend
mkdir -p uploads
```

**Wichtig**: Stelle sicher, dass der Ordner Schreibrechte hat.

### 4. Umgebungsvariablen (optional)

In `backend/.env`:

```env
# API URL für Logo-URLs
API_URL=http://localhost:3001

# CORS Origin
CORS_ORIGIN=http://localhost:3000
```

### 5. Frontend Dependencies

Keine zusätzlichen Dependencies erforderlich. Die benötigten Komponenten nutzen nur React Standard-Features.

### 6. Backend starten

```bash
cd backend
npm run dev
```

Der Server läuft auf `http://localhost:3001`

### 7. Frontend starten

```bash
cd frontend
npm start
```

Das Frontend läuft auf `http://localhost:3000`

## Testen

### Template-Editor öffnen

1. Melde dich als Admin an
2. Navigiere zu "Rechnungsvorlagen"
3. Klicke auf "Neue Vorlage"

### Logo hochladen

1. Gehe zum Tab "Design"
2. Ziehe ein Logo in den Upload-Bereich oder klicke zum Auswählen
3. Warte auf erfolgreichen Upload
4. Logo erscheint in der Vorschau

### Logo positionieren

1. Bewege die Maus über das Logo in der Vorschau
2. Klicke und ziehe, um zu verschieben
3. Nutze den Resize-Handle (rechts unten) zum Skalieren
4. Position wird automatisch gespeichert beim Klick auf "Speichern"

## Fehlerbehebung

### "Cannot POST /api/uploads/logo"

**Ursache**: Upload-Route nicht registriert

**Lösung**: Stelle sicher, dass `upload.routes.ts` in `index.ts` importiert ist:

```typescript
import uploadRoutes from './routes/upload.routes';
app.use('/api/uploads', uploadRoutes);
```

### "413 Payload Too Large"

**Ursache**: Datei zu groß

**Lösung**: Maximale Größe anpassen in `upload.controller.ts`:

```typescript
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
```

### Logo wird nicht angezeigt

**Ursache**: Upload-Ordner nicht erreichbar

**Lösung**: Prüfe in `backend/src/index.ts`:

```typescript
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

### Migration schlägt fehl

**Ursache**: Datenbank-Verbindung oder Syntax-Fehler

**Lösung 1**: Prüfe `.env` Datei:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/cflux?schema=public"
```

**Lösung 2**: Manuelle SQL-Ausführung:
```sql
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "logoPosition" TEXT;
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "logoAlignment" TEXT NOT NULL DEFAULT 'left';
```

## Docker Setup (optional)

### docker-compose.yml aktualisieren

```yaml
services:
  backend:
    volumes:
      - ./backend/uploads:/app/uploads
```

### Uploads in Docker persistent machen

```bash
docker-compose down
docker-compose up -d
```

## Produktion

### Build erstellen

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Uploads sichern

Wichtig: Sichere regelmäßig den `backend/uploads` Ordner:

```bash
# Backup
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz backend/uploads/

# Restore
tar -xzf uploads-backup-20251222.tar.gz
```

### Nginx-Konfiguration

Für Produktion sollte Nginx die statischen Dateien servieren:

```nginx
server {
    location /uploads/ {
        alias /var/www/cflux/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## Upgrade von bestehenden Templates

Bestehende Templates ohne Logo-Position funktionieren weiterhin. Das Logo wird automatisch an der Standardposition (x:20, y:20) angezeigt.

## Checklist

- [ ] Backend Dependencies installiert
- [ ] Migration ausgeführt
- [ ] Upload-Ordner existiert und ist beschreibbar
- [ ] Backend startet ohne Fehler
- [ ] Frontend startet ohne Fehler
- [ ] Upload-Endpunkt erreichbar (`POST /api/uploads/logo`)
- [ ] Statische Dateien erreichbar (`GET /uploads/:filename`)
- [ ] Template-Editor öffnet sich
- [ ] Logo-Upload funktioniert
- [ ] Drag & Drop funktioniert
- [ ] Vorschau aktualisiert sich live

## Support

Bei Problemen:
1. Prüfe Browser-Konsole auf Fehler
2. Prüfe Backend-Logs
3. Teste API-Endpunkte mit Postman/curl
4. Prüfe Dateirechte auf Upload-Ordner
