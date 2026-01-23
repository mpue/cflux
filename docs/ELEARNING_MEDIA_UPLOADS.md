# E-Learning Media Uploads

## Übersicht

Das E-Learning-Modul wurde um umfassende Upload-Funktionen erweitert:

1. **Kurs-Thumbnails**: Eigene Thumbnails für Kurse hochladen
2. **Content-Bilder**: Bilder direkt im Lektions-Editor einfügen

Alle Uploads werden auf einem Docker-Volume (`backend_uploads`) gespeichert und bleiben nach Container-Neustarts erhalten.

## Upload-Struktur

### Verzeichnisse

```
uploads/
├── course-thumbnails/     # Kurs-Vorschaubilder
│   └── thumbnail-{uuid}.{ext}
├── course-content/        # Bilder für Lektionsinhalte
│   └── content-{uuid}.{ext}
├── certificates/          # Zertifikate (bereits vorhanden)
├── attachments/          # Intranet-Anhänge (bereits vorhanden)
├── media/                # Medien-Bibliothek (bereits vorhanden)
└── ...                   # Weitere Upload-Typen
```

### Docker Volume

Das Volume `backend_uploads` ist in `docker-compose.yml` konfiguriert:

```yaml
volumes:
  - backend_uploads:/app/uploads
```

**Alle Upload-Ordner sind automatisch persistent!**

## Backend API

### Kurs-Thumbnail hochladen

**Endpoint**: `POST /api/elearning/upload/thumbnail`

**Authentifizierung**: Erforderlich (Bearer Token)

**Berechtigung**: `elearning` Modul mit `canCreate`

**Request**:
- Content-Type: `multipart/form-data`
- Body:
  - `thumbnail` (File): Bilddatei

**Validierung**:
- Erlaubte Formate: PNG, JPG, GIF, WebP, SVG
- Maximale Größe: 5 MB

**Response**:
```json
{
  "url": "/uploads/course-thumbnails/thumbnail-abc123.jpg",
  "filename": "thumbnail-abc123.jpg",
  "size": 1234567,
  "mimetype": "image/jpeg"
}
```

### Content-Bild hochladen

**Endpoint**: `POST /api/elearning/upload/content-image`

**Authentifizierung**: Erforderlich (Bearer Token)

**Berechtigung**: `elearning` Modul mit `canCreate`

**Request**:
- Content-Type: `multipart/form-data`
- Body:
  - `image` (File): Bilddatei

**Validierung**:
- Erlaubte Formate: PNG, JPG, GIF, WebP, SVG
- Maximale Größe: 10 MB

**Response**:
```json
{
  "url": "/uploads/course-content/content-xyz789.png",
  "filename": "content-xyz789.png",
  "size": 2345678,
  "mimetype": "image/png"
}
```

### Upload löschen

**Endpoint**: `DELETE /api/elearning/upload/:type/:filename`

**Parameter**:
- `type`: `thumbnail` oder `content`
- `filename`: Dateiname (UUID-basiert)

**Berechtigung**: `elearning` Modul mit `canDelete`

**Response**:
```json
{
  "message": "Datei erfolgreich gelöscht"
}
```

## Frontend Integration

### Kurs-Editor (CourseEditorPage.tsx)

#### Thumbnail-Upload

Im Tab "Grundeinstellungen" unter "Medien":

```tsx
// Thumbnail hochladen
const handleThumbnailUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('thumbnail', file);
  
  const response = await api.post('/elearning/upload/thumbnail', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  setThumbnailUrl(response.data.url);
};
```

**Features**:
- Drag & Drop Support (geplant)
- Live-Vorschau des Thumbnails
- Löschen-Button über dem Thumbnail
- Empfohlene Größe: 800x450px (16:9)
- Maximale Dateigröße: 5MB

### Lektions-Editor (LessonEditor.tsx)

#### Bild-Upload im HTML-Editor

Bei Lektionen vom Typ "HTML-Inhalt":

```tsx
// Bild hochladen und einfügen
const handleImageUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await api.post('/elearning/upload/content-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  // HTML-Tag generieren
  const imageTag = `<img src="${response.data.url}" alt="Bild" style="max-width: 100%; height: auto;" />`;
  
  // An Cursor-Position einfügen
  insertAtCursor(imageTag);
};
```

**Features**:
- Button "Bild einfügen" über dem HTML-Textfeld
- Automatisches Einfügen des `<img>`-Tags
- Responsive Styling (`max-width: 100%`)
- Maximale Dateigröße: 10MB

## Verwendung

### 1. Kurs-Thumbnail setzen

1. Kurs bearbeiten (Tab "Grundeinstellungen")
2. Im Bereich "Medien" auf "Thumbnail hochladen" klicken
3. Bilddatei auswählen (empfohlen: 800x450px, 16:9)
4. Vorschau wird sofort angezeigt
5. Bei Bedarf mit "Thumbnail ändern" ersetzen
6. Kurs speichern

Das Thumbnail wird in der Kursübersicht und auf Kurs-Detailseiten angezeigt.

### 2. Bilder in Lektionen einfügen

1. Lektion bearbeiten/erstellen
2. Inhaltstyp "HTML-Inhalt" auswählen
3. Im HTML-Editor auf "Bild einfügen" klicken
4. Bilddatei auswählen
5. Bild-Tag wird automatisch eingefügt
6. Position im Text anpassen
7. Lektion speichern

Bilder werden inline im Lektionsinhalt gerendert.

## Technische Details

### Multer-Konfiguration

#### Thumbnails

```typescript
const thumbnailStorage = multer.diskStorage({
  destination: 'uploads/course-thumbnails',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `thumbnail-${uuidv4()}${ext}`);
  }
});

export const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});
```

#### Content-Bilder

```typescript
const contentImageStorage = multer.diskStorage({
  destination: 'uploads/course-content',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `content-${uuidv4()}${ext}`);
  }
});

export const uploadContentImage = multer({
  storage: contentImageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});
```

### Statische Bereitstellung

In `backend/src/index.ts`:

```typescript
app.use('/uploads/course-thumbnails', express.static(path.join(__dirname, '../uploads/course-thumbnails')));
app.use('/uploads/course-content', express.static(path.join(__dirname, '../uploads/course-content')));
app.use('/uploads/certificates', express.static(path.join(__dirname, '../uploads/certificates')));
```

### URL-Generierung

Backend liefert relative Pfade:

```typescript
const fileUrl = `/uploads/course-thumbnails/${filename}`;
```

Frontend baut vollständige URLs:

```typescript
const baseUrl = api.defaults.baseURL?.replace('/api', '');
const fullUrl = `${baseUrl}${fileUrl}`;
```

Beispiel:
- Relativ: `/uploads/course-thumbnails/thumbnail-abc123.jpg`
- Vollständig: `http://localhost:3001/uploads/course-thumbnails/thumbnail-abc123.jpg`

## Sicherheit

### Datei-Validierung

1. **MIME-Type-Prüfung**: Nur Bilddateien erlaubt
2. **Größenbeschränkung**: 5MB (Thumbnails) / 10MB (Content)
3. **Dateinamensicherheit**: UUID-basiert, keine Pfad-Traversal-Angriffe
4. **Berechtigungsprüfung**: Module-basierte Zugriffssteuerung

### Path Traversal Prevention

```typescript
if (filename.includes('..') || filename.includes('/')) {
  return res.status(400).json({ error: 'Ungültiger Dateiname' });
}
```

## Migration bestehender Kurse

Bestehende Kurse mit URL-basierten Thumbnails (z.B. externe Links) funktionieren weiterhin:

- URL-basiert: `https://example.com/image.jpg` → wird direkt verwendet
- Upload-basiert: `/uploads/course-thumbnails/...` → wird vom Backend bereitgestellt

Das Frontend erkennt automatisch den Typ und rendert entsprechend.

## Volume-Persistenz

### Prüfung

Volume-Status prüfen:

```bash
docker volume inspect cflux_backend_uploads
```

### Backup

Volume sichern:

```bash
docker run --rm -v cflux_backend_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz /data
```

### Restore

Volume wiederherstellen:

```bash
docker run --rm -v cflux_backend_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /
```

## Zukünftige Erweiterungen

### Geplant

1. **Drag & Drop**: Direkt Dateien auf Upload-Bereiche ziehen
2. **Bild-Editor**: Cropping und Größenanpassung im Browser
3. **Medien-Bibliothek**: Zentrale Verwaltung aller Kurs-Medien
4. **Vorschau-Generierung**: Automatische Thumbnails für Videos
5. **CDN-Integration**: Optional externe Speicherung (S3, etc.)
6. **Bildoptimierung**: Automatische Kompression und Format-Konvertierung

### Rich Text Editor

Für bessere Content-Erstellung könnte ein WYSIWYG-Editor integriert werden:

- **TinyMCE**: Vollständiger Rich-Text-Editor
- **Quill**: Moderner, schlanker Editor
- **Draft.js**: React-basierter Editor

Würde ermöglichen:
- Formatierung ohne HTML-Kenntnisse
- Drag & Drop für Bilder
- Tabellen, Listen, etc.
- Live-Vorschau

## Troubleshooting

### Uploads funktionieren nicht

1. **Volume prüfen**: `docker volume ls | grep backend_uploads`
2. **Container-Logs**: `docker logs timetracking-backend`
3. **Berechtigungen**: Sicherstellen, dass User E-Learning-Rechte hat
4. **Dateiformat**: Nur unterstützte Bildformate verwenden

### Bilder werden nicht angezeigt

1. **URL prüfen**: Browser-Console auf 404-Fehler checken
2. **Statische Bereitstellung**: Index.ts korrekt konfiguriert?
3. **CORS**: Frontend darf auf Backend-Uploads zugreifen
4. **Pfade**: Relative vs. absolute URLs korrekt?

### Volume-Daten verloren

1. **Docker prüfen**: `docker volume inspect cflux_backend_uploads`
2. **Container neu starten**: `docker-compose restart backend`
3. **Backup wiederherstellen**: Siehe "Volume-Persistenz"

## Siehe auch

- [ELEARNING_MODULE.md](./ELEARNING_MODULE.md) - Allgemeine E-Learning-Dokumentation
- [INTRANET_ATTACHMENTS.md](./INTRANET_ATTACHMENTS.md) - Ähnliches Upload-System
- [DOCKER-QUICKSTART.md](./DOCKER-QUICKSTART.md) - Docker-Setup
