# Intranet Attachments - API Endpunkte

## Übersicht

Alle Endpunkte erfordern Authentifizierung via JWT-Token im `Authorization: Bearer <token>` Header.

## Basis-URL

```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## Endpunkte

### 1. Alle Attachments einer Node abrufen

```http
GET /document-nodes/:nodeId/attachments
```

**Parameter:**
- `nodeId` (path): UUID der DocumentNode

**Berechtigung:** INTRANET_READ

**Response:**
```json
[
  {
    "id": "uuid",
    "documentNodeId": "uuid",
    "filename": "attachment-1234567890.pdf",
    "originalFilename": "Vertrag.pdf",
    "mimeType": "application/pdf",
    "fileSize": 1048576,
    "path": "uploads/attachments/attachment-1234567890.pdf",
    "description": "Wichtiger Vertrag",
    "version": 2,
    "isActive": true,
    "createdAt": "2026-01-06T10:30:00.000Z",
    "updatedAt": "2026-01-06T11:45:00.000Z",
    "deletedAt": null,
    "createdBy": {
      "id": "uuid",
      "firstName": "Max",
      "lastName": "Mustermann",
      "email": "max@example.com"
    },
    "updatedBy": {
      "id": "uuid",
      "firstName": "Max",
      "lastName": "Mustermann",
      "email": "max@example.com"
    }
  }
]
```

---

### 2. Attachment hochladen

```http
POST /document-nodes/:nodeId/attachments
Content-Type: multipart/form-data
```

**Parameter:**
- `nodeId` (path): UUID der DocumentNode
- `file` (form-data): Die hochzuladende Datei (required)
- `description` (form-data): Beschreibung (optional)

**Berechtigung:** INTRANET_WRITE + Node-Schreibzugriff

**Request:**
```bash
curl -X POST http://localhost:3001/api/document-nodes/{nodeId}/attachments \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf" \
  -F "description=Wichtiges Dokument"
```

**Response:** 
```json
{
  "id": "uuid",
  "documentNodeId": "uuid",
  "filename": "attachment-1234567890.pdf",
  "originalFilename": "document.pdf",
  "mimeType": "application/pdf",
  "fileSize": 1048576,
  "path": "uploads/attachments/attachment-1234567890.pdf",
  "description": "Wichtiges Dokument",
  "version": 1,
  "isActive": true,
  "createdAt": "2026-01-06T10:30:00.000Z",
  "updatedAt": "2026-01-06T10:30:00.000Z",
  "deletedAt": null,
  "createdBy": { /* ... */ },
  "updatedBy": { /* ... */ }
}
```

**Fehler:**
- `400`: Keine Datei hochgeladen
- `403`: Keine Berechtigung
- `404`: Node nicht gefunden
- `413`: Datei zu groß (>100MB)

---

### 3. Attachment aktualisieren (neue Version)

```http
PUT /document-nodes/attachments/:attachmentId
Content-Type: multipart/form-data
```

**Parameter:**
- `attachmentId` (path): UUID des Attachments
- `file` (form-data): Die neue Datei (required)
- `description` (form-data): Neue Beschreibung (optional)
- `changeReason` (form-data): Grund für die Änderung (optional, empfohlen)

**Berechtigung:** INTRANET_WRITE + Node-Schreibzugriff

**Request:**
```bash
curl -X PUT http://localhost:3001/api/document-nodes/attachments/{attachmentId} \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@updated_document.pdf" \
  -F "description=Aktualisiertes Dokument" \
  -F "changeReason=Korrigierte Version nach Review"
```

**Response:**
```json
{
  "id": "uuid",
  "documentNodeId": "uuid",
  "filename": "attachment-9876543210.pdf",
  "originalFilename": "updated_document.pdf",
  "mimeType": "application/pdf",
  "fileSize": 2097152,
  "path": "uploads/attachments/attachment-9876543210.pdf",
  "description": "Aktualisiertes Dokument",
  "version": 2,
  "isActive": true,
  "createdAt": "2026-01-06T10:30:00.000Z",
  "updatedAt": "2026-01-06T11:45:00.000Z",
  "deletedAt": null,
  "createdBy": { /* ... */ },
  "updatedBy": { /* ... */ }
}
```

**Hinweis:** 
- Alte Datei wird nach `uploads/attachments/archive/` verschoben
- Version wird automatisch erhöht
- Alte Version bleibt im Versionsverlauf

---

### 4. Attachment-Metadaten ändern

```http
PATCH /document-nodes/attachments/:attachmentId/metadata
Content-Type: application/json
```

**Parameter:**
- `attachmentId` (path): UUID des Attachments

**Body:**
```json
{
  "description": "Neue Beschreibung"
}
```

**Berechtigung:** INTRANET_WRITE + Node-Schreibzugriff

**Request:**
```bash
curl -X PATCH http://localhost:3001/api/document-nodes/attachments/{attachmentId}/metadata \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Neue Beschreibung"}'
```

**Response:** Attachment-Objekt mit aktualisierter Beschreibung

**Hinweis:** 
- Ändert **nur** die Beschreibung
- Erstellt **keine** neue Version
- Datei bleibt unverändert

---

### 5. Attachment löschen

```http
DELETE /document-nodes/attachments/:attachmentId
```

**Parameter:**
- `attachmentId` (path): UUID des Attachments

**Berechtigung:** INTRANET_WRITE + Node-Schreibzugriff

**Request:**
```bash
curl -X DELETE http://localhost:3001/api/document-nodes/attachments/{attachmentId} \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "message": "Attachment deleted successfully"
}
```

**Hinweis:**
- **Soft-Delete**: `isActive = false`, `deletedAt` gesetzt
- Datei bleibt auf dem Server
- Alle Versionen bleiben erhalten
- Nicht mehr in normaler Ansicht sichtbar

---

### 6. Attachment herunterladen

```http
GET /document-nodes/attachments/:attachmentId/download
```

**Parameter:**
- `attachmentId` (path): UUID des Attachments

**Berechtigung:** INTRANET_READ

**Request:**
```bash
curl -X GET http://localhost:3001/api/document-nodes/attachments/{attachmentId}/download \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded_file.pdf
```

**Response:**
- Content-Type: `<mimeType des Attachments>`
- Content-Disposition: `attachment; filename="<originalFilename>"`
- Body: File-Stream

**Fehler:**
- `404`: Attachment oder Datei nicht gefunden
- `403`: Keine Berechtigung

---

### 7. Versionsverlauf abrufen

```http
GET /document-nodes/attachments/:attachmentId/versions
```

**Parameter:**
- `attachmentId` (path): UUID des Attachments

**Berechtigung:** INTRANET_READ

**Request:**
```bash
curl -X GET http://localhost:3001/api/document-nodes/attachments/{attachmentId}/versions \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
[
  {
    "id": "uuid",
    "attachmentId": "uuid",
    "filename": "attachment-9876543210.pdf",
    "originalFilename": "updated_document.pdf",
    "mimeType": "application/pdf",
    "fileSize": 2097152,
    "path": "uploads/attachments/attachment-9876543210.pdf",
    "version": 2,
    "changeReason": "Korrigierte Version nach Review",
    "createdAt": "2026-01-06T11:45:00.000Z",
    "createdBy": {
      "id": "uuid",
      "firstName": "Max",
      "lastName": "Mustermann",
      "email": "max@example.com"
    }
  },
  {
    "id": "uuid",
    "attachmentId": "uuid",
    "filename": "attachment-1234567890.pdf",
    "originalFilename": "document.pdf",
    "mimeType": "application/pdf",
    "fileSize": 1048576,
    "path": "uploads/attachments/attachment-1234567890.pdf",
    "version": 1,
    "changeReason": "Initial upload",
    "createdAt": "2026-01-06T10:30:00.000Z",
    "createdBy": { /* ... */ }
  }
]
```

**Sortierung:** Neueste Version zuerst (DESC)

---

### 8. Bestimmte Version herunterladen

```http
GET /document-nodes/attachments/versions/:versionId/download
```

**Parameter:**
- `versionId` (path): UUID der Version (aus Versionsverlauf)

**Berechtigung:** INTRANET_READ

**Request:**
```bash
curl -X GET http://localhost:3001/api/document-nodes/attachments/versions/{versionId}/download \
  -H "Authorization: Bearer $TOKEN" \
  -o version_1.pdf
```

**Response:**
- Content-Type: `<mimeType>`
- Content-Disposition: `attachment; filename="v<version>-<originalFilename>"`
- Body: File-Stream

**Hinweis:**
- Aktuelle Version liegt in `uploads/attachments/`
- Alte Versionen liegen in `uploads/attachments/archive/`

---

## Fehler-Codes

| Code | Bedeutung | Mögliche Ursache |
|------|-----------|------------------|
| 400 | Bad Request | Keine Datei hochgeladen, ungültige Parameter |
| 403 | Forbidden | Keine Berechtigung für diese Operation |
| 404 | Not Found | Attachment, Node oder Datei nicht gefunden |
| 413 | Payload Too Large | Datei größer als 100MB |
| 500 | Internal Server Error | Server-Fehler, siehe Logs |

## Rate Limiting

Aktuell **kein** Rate Limiting implementiert.

**Empfehlung für Produktion:**
- Max. 10 Uploads pro Minute pro Benutzer
- Max. 100 Downloads pro Minute pro Benutzer

## Berechtigungen

### Module-Ebene
- `INTRANET_READ`: Attachments ansehen und herunterladen
- `INTRANET_WRITE`: Attachments hochladen, aktualisieren, löschen

### Node-Ebene (Gruppenberechtigungen)
- `READ`: Attachments der Node ansehen
- `WRITE`: Attachments der Node verwalten
- `ADMIN`: Volle Kontrolle

**Fallback:** 
Wenn keine Gruppenberechtigungen gesetzt sind, haben alle Benutzer mit entsprechendem Modul-Zugriff die Rechte.

## Datentypen

### Attachment
```typescript
interface DocumentNodeAttachment {
  id: string;
  documentNodeId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;  // in bytes
  path: string;
  description?: string;
  version: number;
  isActive: boolean;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
  deletedAt?: string; // ISO 8601
  createdBy: User;
  updatedBy: User;
}
```

### Version
```typescript
interface AttachmentVersion {
  id: string;
  attachmentId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  path: string;
  version: number;
  changeReason?: string;
  createdAt: string;  // ISO 8601
  createdBy: User;
}
```

## Beispiel-Workflow

### Kompletter Upload-Update-Download Workflow

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.token')

# 2. Node-ID ermitteln (z.B. aus Intranet-Tree)
NODE_ID="your-node-uuid"

# 3. Attachment hochladen
ATTACHMENT=$(curl -X POST http://localhost:3001/api/document-nodes/$NODE_ID/attachments \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document_v1.pdf" \
  -F "description=Erste Version")

ATTACHMENT_ID=$(echo $ATTACHMENT | jq -r '.id')

# 4. Attachment aktualisieren (neue Version)
curl -X PUT http://localhost:3001/api/document-nodes/attachments/$ATTACHMENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document_v2.pdf" \
  -F "changeReason=Fehler korrigiert"

# 5. Versionsverlauf abrufen
curl -X GET http://localhost:3001/api/document-nodes/attachments/$ATTACHMENT_ID/versions \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# 6. Aktuelle Version herunterladen
curl -X GET http://localhost:3001/api/document-nodes/attachments/$ATTACHMENT_ID/download \
  -H "Authorization: Bearer $TOKEN" \
  -o current_version.pdf

# 7. Alte Version herunterladen (Version-ID aus Schritt 5)
VERSION_ID="version-uuid"
curl -X GET http://localhost:3001/api/document-nodes/attachments/versions/$VERSION_ID/download \
  -H "Authorization: Bearer $TOKEN" \
  -o old_version.pdf

# 8. Beschreibung ändern
curl -X PATCH http://localhost:3001/api/document-nodes/attachments/$ATTACHMENT_ID/metadata \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Aktualisierte Beschreibung"}'

# 9. Attachment löschen (Soft-Delete)
curl -X DELETE http://localhost:3001/api/document-nodes/attachments/$ATTACHMENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Testing

### Mit Postman/Insomnia

1. **Collection importieren:** (siehe unten)
2. **Environment-Variable setzen:**
   - `baseUrl`: `http://localhost:3001/api`
   - `token`: `<JWT-Token nach Login>`

3. **Tests ausführen:**
   - Login → Token speichern
   - Alle Attachment-Endpunkte testen

### Postman Collection

```json
{
  "info": {
    "name": "Intranet Attachments API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Attachments",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/document-nodes/{{nodeId}}/attachments",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ]
      }
    },
    {
      "name": "Upload Attachment",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/document-nodes/{{nodeId}}/attachments",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "file",
              "type": "file",
              "src": "test.pdf"
            },
            {
              "key": "description",
              "value": "Test attachment"
            }
          ]
        }
      }
    }
  ]
}
```

## Support

Bei Fragen oder Problemen:
- API-Dokumentation: `API_ATTACHMENTS.md` (diese Datei)
- Vollständige Doku: `docs/INTRANET_ATTACHMENTS.md`
- Implementation: `INTRANET_ATTACHMENTS_IMPLEMENTATION.md`
