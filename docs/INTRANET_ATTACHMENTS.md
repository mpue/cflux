# Intranet Modul - Attachment-Funktionalität

## Übersicht

Das Intranet-Modul wurde um eine revisionssichere Attachment-Funktionalität erweitert. Jede DocumentNode (Dokument oder Ordner) kann nun mehrere Attachments haben, die separat versioniert werden.

## Features

### ✅ Implementierte Funktionen

1. **Anhängen** - Dateien an Nodes hochladen
2. **Löschen** - Soft-Delete für Revisionssicherheit
3. **Aktualisieren** - Neue Version eines Attachments hochladen
4. **Versionierung** - Separate Versionierung unabhängig von Node-Änderungen
5. **Versionsverlauf** - Alle Versionen eines Attachments einsehen und herunterladen
6. **Metadaten** - Beschreibung ändern ohne neue Version zu erstellen

### 🔒 Sicherheit & Compliance

- **Revisionssicher**: Keine echte Löschung, nur Soft-Delete
- **Versionsverlauf**: Alle Versionen werden archiviert
- **Berechtigungen**: Basiert auf DocumentNode-Gruppenberechtigungen
- **Audit-Trail**: Ersteller und Bearbeiter werden gespeichert

## Datenmodell

### DocumentNodeAttachment

```prisma
model DocumentNodeAttachment {
  id              String    @id @default(uuid())
  documentNodeId  String
  filename        String
  originalFilename String
  mimeType        String
  fileSize        Int       // in bytes
  path            String
  description     String?
  version         Int       @default(1)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime? // Soft delete
  createdById     String
  updatedById     String
  
  documentNode    DocumentNode
  createdBy       User
  updatedBy       User
  versions        DocumentNodeAttachmentVersion[]
}
```

### DocumentNodeAttachmentVersion

```prisma
model DocumentNodeAttachmentVersion {
  id              String    @id @default(uuid())
  attachmentId    String
  filename        String
  originalFilename String
  mimeType        String
  fileSize        Int
  path            String
  version         Int
  changeReason    String?   // Optional reason for update
  createdAt       DateTime  @default(now())
  createdById     String
  
  attachment      DocumentNodeAttachment
  createdBy       User
}
```

## API-Endpunkte

### Attachments verwalten

```http
GET    /api/document-nodes/:nodeId/attachments
       Alle Attachments einer Node abrufen

POST   /api/document-nodes/:nodeId/attachments
       Neues Attachment hochladen
       Body: multipart/form-data
       - file: File (required)
       - description: String (optional)

PUT    /api/document-nodes/attachments/:attachmentId
       Attachment aktualisieren (neue Version)
       Body: multipart/form-data
       - file: File (required)
       - description: String (optional)
       - changeReason: String (optional)

PATCH  /api/document-nodes/attachments/:attachmentId/metadata
       Nur Beschreibung ändern (keine neue Version)
       Body: { description: string }

DELETE /api/document-nodes/attachments/:attachmentId
       Attachment löschen (Soft-Delete)

GET    /api/document-nodes/attachments/:attachmentId/download
       Attachment herunterladen
```

### Versionsverlauf

```http
GET    /api/document-nodes/attachments/:attachmentId/versions
       Versionsverlauf eines Attachments abrufen

GET    /api/document-nodes/attachments/versions/:versionId/download
       Bestimmte Version herunterladen
```

## Frontend-Komponenten

### DocumentNodeAttachments

React-Komponente zur Verwaltung von Attachments:

```tsx
<DocumentNodeAttachments 
  nodeId={currentNode.id} 
  canEdit={canEditIntranet} 
/>
```

**Features:**
- Attachment-Liste mit Icons basierend auf Dateityp
- Upload-Dialog mit Beschreibung
- Update-Dialog mit Änderungsgrund
- Versionsverlauf-Dialog
- Download-Funktionen
- Kontextmenü für alle Aktionen

### Service-Layer

```typescript
import documentNodeAttachmentService from './services/documentNodeAttachment.service';

// Attachments laden
const attachments = await documentNodeAttachmentService.getNodeAttachments(nodeId);

// Attachment hochladen
await documentNodeAttachmentService.uploadAttachment(nodeId, file, description);

// Attachment aktualisieren
await documentNodeAttachmentService.updateAttachment(attachmentId, file, description, changeReason);

// Attachment löschen
await documentNodeAttachmentService.deleteAttachment(attachmentId);

// Versionsverlauf
const versions = await documentNodeAttachmentService.getAttachmentVersions(attachmentId);
```

## Installation & Migration

### 1. Prisma Migration ausführen

```bash
cd backend
npm run prisma:migrate
```

Dies erstellt:
- `document_node_attachments` Tabelle
- `document_node_attachment_versions` Tabelle
- Notwendige Relationen in `document_nodes` und `users`

### 2. Upload-Verzeichnis erstellen

Das Backend erstellt automatisch:
- `backend/uploads/attachments/` - Aktuelle Attachments
- `backend/uploads/attachments/archive/` - Alte Versionen

### 3. Frontend kompilieren

```bash
cd frontend
npm run build
```

## Verwendung

### Für Benutzer

1. **Attachment hochladen:**
   - Node auswählen (Dokument oder Ordner)
   - Im Attachment-Bereich auf "Anhang hinzufügen" klicken
   - Datei auswählen und optional Beschreibung eingeben
   - Auf "Hochladen" klicken

2. **Attachment aktualisieren:**
   - Kontextmenü (⋮) beim Attachment öffnen
   - "Datei aktualisieren" wählen
   - Neue Datei auswählen
   - Änderungsgrund eingeben (empfohlen)
   - Auf "Aktualisieren" klicken

3. **Versionsverlauf ansehen:**
   - Kontextmenü (⋮) beim Attachment öffnen
   - "Versionsverlauf" wählen
   - Alle Versionen mit Änderungsgrund anzeigen
   - Beliebige Version herunterladen

4. **Attachment löschen:**
   - Kontextmenü (⋮) beim Attachment öffnen
   - "Löschen" wählen
   - Bestätigen

### Für Administratoren

**Dateigröße anpassen:**

In `backend/src/routes/documentNode.routes.ts`:
```typescript
const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB (anpassen)
  }
});
```

**Erlaubte Dateitypen einschränken:**

```typescript
const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nur PDF und Bilder erlaubt'));
    }
  }
});
```

## Besonderheiten

### Separate Versionierung

Die Attachments werden **separat** von den DocumentNodes versioniert:

- **Node-Version ändert sich:** Attachments bleiben unverändert
- **Attachment aktualisiert:** Node-Version bleibt unverändert
- **Unabhängige Historie:** Attachment-Versionen und Node-Versionen sind getrennt

### Archivierung

Beim Aktualisieren eines Attachments:
1. Alte Datei wird nach `uploads/attachments/archive/` verschoben
2. Dateiname wird mit Version-Präfix versehen: `v1-filename.pdf`
3. Neue Datei wird in `uploads/attachments/` gespeichert
4. Version-Record wird erstellt

### Soft-Delete

Gelöschte Attachments:
- `isActive` wird auf `false` gesetzt
- `deletedAt` wird gesetzt
- Datei bleibt auf dem Server
- Alle Versionen bleiben erhalten
- Nicht mehr in normaler Ansicht sichtbar

## Berechtigungen

Attachments nutzen die **DocumentNode-Gruppenberechtigungen**:

- **READ**: Attachments ansehen und herunterladen
- **WRITE**: Attachments hochladen, aktualisieren, löschen
- **ADMIN**: Volle Kontrolle

Wenn keine Gruppenberechtigungen gesetzt sind, haben alle Benutzer mit INTRANET-Modul-Zugriff entsprechende Rechte.

## Unterstützte Dateitypen

Die Komponente zeigt Icons basierend auf MIME-Type:

- 🖼️ Bilder (image/*)
- 📄 PDF (application/pdf)
- 📝 Word-Dokumente
- 📊 Excel-Dateien
- 📽️ PowerPoint
- 📦 Archive (ZIP, RAR, 7Z)
- 🎥 Videos
- 🎵 Audio
- 📃 Text-Dateien
- 📎 Sonstige

## Zukünftige Erweiterungen

Mögliche Verbesserungen:

- [ ] Vorschau für Bilder und PDFs
- [ ] Drag & Drop Upload
- [ ] Batch-Upload mehrerer Dateien
- [ ] Attachment-Suche
- [ ] Attachment-Tags
- [ ] E-Mail-Benachrichtigungen bei Änderungen
- [ ] Attachment-Kommentare
- [ ] Automatische Virus-Scans
- [ ] Cloud-Storage Integration (S3, Azure Blob)
- [ ] OCR für PDF-Suche

## Troubleshooting

### "Failed to upload attachment"

**Mögliche Ursachen:**
1. Datei zu groß (> 100MB)
2. Keine Schreibrechte im `uploads/` Verzeichnis
3. Disk voll

**Lösung:**
```bash
# Berechtigungen prüfen
ls -la backend/uploads/

# Bei Bedarf Berechtigungen setzen
chmod 755 backend/uploads/
chmod 755 backend/uploads/attachments/
```

### "File not found on server"

**Ursache:** Datei wurde manuell gelöscht

**Lösung:** Backup wiederherstellen oder Attachment-Record aus DB entfernen

### Migration schlägt fehl

**Ursache:** Bestehende Daten in der Datenbank

**Lösung:**
```bash
# Migration zurücksetzen
npm run prisma:migrate:reset

# Erneut migrieren
npm run prisma:migrate
```

## Performance

**Optimierungen:**
- Attachments werden lazy geladen (nur wenn Node geöffnet)
- Versionen werden on-demand geladen
- Große Dateien sollten via CDN ausgeliefert werden (zukünftig)
- Index auf `documentNodeId`, `isActive`, `deletedAt`

**Empfohlene Limits:**
- Max. 100MB pro Datei
- Max. 50 Attachments pro Node
- Max. 10 Versionen pro Attachment (alte automatisch archivieren)

## Support

Bei Fragen oder Problemen:
- Dokumentation: `/docs/INTRANET_ATTACHMENTS.md`
- API-Tests: Siehe `backend/__tests__/documentNodeAttachment.test.ts`
- Frontend-Tests: Siehe `frontend/src/components/__tests__/DocumentNodeAttachments.test.tsx`
