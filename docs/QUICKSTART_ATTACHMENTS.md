# 🚀 Quick Start - Intranet Attachments

## Sofortiger Start

### 1. Backend starten

```bash
cd backend
npx prisma generate
npm run build
npm run dev
```

### 2. Frontend starten (neues Terminal)

```bash
cd frontend
npm start
```

### 3. Docker (empfohlen)

```bash
docker-compose down
docker-compose up -d --build
```

## Testen

1. Browser öffnen: http://localhost:3000
2. Einloggen
3. **Intranet** öffnen
4. Ein **Dokument oder Ordner** auswählen
5. Im Bereich **"Anhänge"** ganz unten auf der Seite:
   - ✅ "Anhang hinzufügen" klicken
   - ✅ Datei auswählen und hochladen
   - ✅ Kontextmenü (⋮) für weitere Optionen
   - ✅ "Versionsverlauf" ansehen
   - ✅ "Datei aktualisieren" für neue Version

## Features testen

### Upload
- Datei auswählen
- Optional: Beschreibung eingeben
- "Hochladen" klicken

### Download
- Download-Button (⬇️) klicken
- Oder: Kontextmenü (⋮) → "Herunterladen"

### Aktualisieren (neue Version)
- Kontextmenü (⋮) → "Datei aktualisieren"
- Neue Datei auswählen
- Änderungsgrund eingeben (empfohlen)
- "Aktualisieren" klicken
- ✅ Alte Version wird automatisch archiviert

### Versionsverlauf
- Kontextmenü (⋮) → "Versionsverlauf"
- Alle Versionen werden angezeigt
- Jede Version kann einzeln heruntergeladen werden
- Änderungsgrund wird angezeigt

### Beschreibung ändern
- Kontextmenü (⋮) → "Beschreibung ändern"
- Neue Beschreibung eingeben
- "Speichern" klicken
- ✅ Keine neue Version wird erstellt

### Löschen
- Kontextmenü (⋮) → "Löschen"
- Bestätigen
- ✅ Soft-Delete: Datei bleibt auf Server, wird nur ausgeblendet

## API-Test (optional)

### Mit curl:

```bash
# 1. Login und Token erhalten
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin"}' \
  | jq -r '.token')

# 2. Alle Attachments einer Node abrufen
curl -X GET http://localhost:3001/api/document-nodes/{nodeId}/attachments \
  -H "Authorization: Bearer $TOKEN"

# 3. Attachment hochladen
curl -X POST http://localhost:3001/api/document-nodes/{nodeId}/attachments \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf" \
  -F "description=Test-Dokument"

# 4. Attachment herunterladen
curl -X GET http://localhost:3001/api/document-nodes/attachments/{attachmentId}/download \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded.pdf

# 5. Versionsverlauf abrufen
curl -X GET http://localhost:3001/api/document-nodes/attachments/{attachmentId}/versions \
  -H "Authorization: Bearer $TOKEN"
```

## Datenbank prüfen

```bash
cd backend
npx prisma studio
```

**Oder mit SQL:**

```bash
psql -U postgres -d timetracking -f ../db/check_attachments.sql
```

## Typische Dateitypen

Die Komponente zeigt automatisch passende Icons:

- 🖼️ **Bilder:** PNG, JPG, GIF, SVG
- 📄 **PDF-Dateien**
- 📝 **Word-Dokumente:** DOC, DOCX
- 📊 **Excel-Dateien:** XLS, XLSX
- 📽️ **Präsentationen:** PPT, PPTX
- 📦 **Archive:** ZIP, RAR, 7Z
- 🎥 **Videos:** MP4, AVI, MOV
- 🎵 **Audio:** MP3, WAV, OGG
- 📃 **Text-Dateien:** TXT, MD
- 📎 **Andere**

## Troubleshooting

### "Failed to upload attachment"
```bash
# Berechtigungen prüfen
ls -la backend/uploads/

# Verzeichnis erstellen (falls nötig)
mkdir -p backend/uploads/attachments
chmod 755 backend/uploads/attachments
```

### "File not found on server"
- Prüfe ob Datei existiert: `ls backend/uploads/attachments/`
- Prüfe Datenbank-Record: `SELECT * FROM document_node_attachments WHERE id = '...'`

### Migration-Fehler
```bash
cd backend
npm run prisma:migrate:reset
npm run prisma:migrate
npx prisma generate
```

### Frontend zeigt Komponente nicht
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

## Limits anpassen

**Maximale Dateigröße ändern:**

In `backend/src/routes/documentNode.routes.ts`:
```typescript
const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB → anpassen
  }
});
```

**Dateitypen einschränken:**

```typescript
const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nur PDF und Bilder erlaubt'));
    }
  }
});
```

## Weitere Dokumentation

- **Vollständige Doku:** `docs/INTRANET_ATTACHMENTS.md`
- **Implementation:** `INTRANET_ATTACHMENTS_IMPLEMENTATION.md`
- **SQL-Checks:** `db/check_attachments.sql`

## Support

Bei Fragen oder Problemen:
1. Logs prüfen: `docker-compose logs backend`
2. Dokumentation lesen
3. Issue erstellen mit Details und Logs
