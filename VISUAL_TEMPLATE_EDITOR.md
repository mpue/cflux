# Visueller Template-Editor - Dokumentation

## Übersicht

Der visuelle Template-Editor bietet eine interaktive Benutzeroberfläche zur Erstellung und Bearbeitung von Rechnungsvorlagen mit Live-Vorschau.

## Neue Features

### 1. Split-Screen Layout
- **Editor-Bereich (links)**: Formulare für alle Template-Einstellungen
- **Vorschau-Bereich (rechts)**: Live-Ansicht der Rechnung mit Beispieldaten
- Automatische Aktualisierung der Vorschau bei Änderungen

### 2. Logo-Upload
- Drag & Drop Upload-Funktion
- Unterstützte Formate: PNG, JPG, SVG
- Maximale Dateigröße: 5MB
- Visuelles Feedback während des Uploads

**Komponente**: `LogoUpload.tsx`
```tsx
<LogoUpload
  currentLogo={formData.logoUrl}
  onLogoChange={handleLogoChange}
  onLogoRemove={handleLogoRemove}
/>
```

### 3. Drag-and-Drop Logo-Positionierung
- Logo kann direkt in der Vorschau verschoben werden
- Größe durch Ziehen am Resize-Handle anpassbar
- Aspect Ratio wird beibehalten
- Position wird automatisch gespeichert

**Features**:
- Visuelle Hilfen beim Hovern
- Cursor-Feedback (grab/grabbing)
- Begrenzung auf den sichtbaren Bereich

### 4. Live-Vorschau
- Echtzeitdarstellung aller Template-Änderungen
- Verwendung von Mock-Rechnungsdaten
- Vollständige Rechnungsstruktur mit:
  - Firmendaten
  - Kundenadresse
  - Rechnungsdetails
  - Positionstabelle
  - Summen und MwSt.
  - Zahlungsinformationen

**Komponente**: `InvoicePreview.tsx`

## Backend-Änderungen

### Upload-Controller
**Datei**: `backend/src/controllers/upload.controller.ts`

Neue Endpunkte:
- `POST /api/uploads/logo` - Logo hochladen
- `DELETE /api/uploads/:filename` - Datei löschen

### Datenbank-Schema
**Erweiterungen in `InvoiceTemplate`**:
```prisma
logoUrl       String?
logoPosition  String?  // JSON: {x, y, width, height}
logoAlignment String   @default("left")
```

### Migration
**Datei**: `backend/prisma/migrations/20251222_add_logo_position/migration.sql`

```sql
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "logoPosition" TEXT;
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "logoAlignment" TEXT NOT NULL DEFAULT 'left';
```

### Datei-Speicherung
- Uploads werden in `backend/uploads/` gespeichert
- Eindeutige Dateinamen mit UUIDs
- Statischer Zugriff über `/uploads/:filename`

## Frontend-Komponenten

### InvoiceTemplateEditor.tsx
Haupt-Editor mit Split-Screen Layout.

**Neue Props**:
```typescript
interface InvoiceTemplateFormData {
  // ... existing fields
  logoPosition?: string;
  logoAlignment?: string;
}
```

**Neue Callbacks**:
- `handleLogoChange(url)` - Logo-URL aktualisieren
- `handleLogoRemove()` - Logo entfernen
- `handleLogoPositionChange(position)` - Position speichern

### LogoUpload.tsx
Upload-Komponente mit Drag & Drop.

**Features**:
- Dateivalidierung (Typ, Größe)
- Upload-Fortschritt
- Vorschau des hochgeladenen Logos
- Fehlerbehandlung

### InvoicePreview.tsx
Live-Vorschau mit interaktivem Logo.

**Features**:
- Mock-Daten für realistische Darstellung
- Drag & Drop Logo-Positionierung
- Resize-Funktionalität
- Responsive Design

## Styling

### Neue CSS-Dateien
- `InvoiceTemplateEditor.css` - Split-Screen Layout
- `InvoicePreview.css` - Vorschau-Styling
- `LogoUpload.css` - Upload-Komponente

### Responsive Design
- Desktop (> 1200px): Split-Screen nebeneinander
- Tablet (768-1200px): Vertikal gestapelt
- Mobile (< 768px): Optimierte Ansicht

## Verwendung

### Template erstellen/bearbeiten
1. Navigiere zu "Rechnungsvorlagen"
2. Klicke auf "Neue Vorlage" oder bearbeite eine bestehende
3. Fülle die Firmendaten aus (Tab "Firmendaten")
4. Gehe zu Tab "Design"
5. Lade ein Logo hoch (Drag & Drop oder Klick)
6. Positioniere das Logo in der Vorschau:
   - Ziehen zum Verschieben
   - Resize-Handle zum Skalieren
7. Passe Farben und Texte an
8. Vorschau aktualisiert sich automatisch
9. Speichern

### Logo-Positionierung
```typescript
// Position wird als JSON gespeichert
{
  x: 20,        // X-Koordinate in Pixel
  y: 20,        // Y-Koordinate in Pixel
  width: 150,   // Breite in Pixel
  height: 60    // Höhe in Pixel
}
```

## API-Endpunkte

### Logo hochladen
```http
POST /api/uploads/logo
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- logo: File (PNG, JPG, SVG)

Response:
{
  "url": "http://localhost:3001/uploads/uuid.png",
  "filename": "uuid.png",
  "size": 12345,
  "mimetype": "image/png"
}
```

### Logo löschen
```http
DELETE /api/uploads/:filename
Authorization: Bearer <token>

Response:
{
  "message": "Datei erfolgreich gelöscht"
}
```

## Sicherheit

### Upload-Validierung
- Dateityp-Prüfung (MIME-Type)
- Größenbeschränkung (5MB)
- Eindeutige Dateinamen (UUID)
- Authentifizierung erforderlich
- Nur Admin-Rolle

### Path Traversal Prevention
```typescript
if (filename.includes('..') || filename.includes('/')) {
  return res.status(400).json({ error: 'Ungültiger Dateiname' });
}
```

## Zukünftige Erweiterungen

Mögliche Verbesserungen:
- [ ] Mehrere Logo-Positionen (Header, Footer)
- [ ] Logo-Rotation
- [ ] Bild-Zuschnitt im Editor
- [ ] Weitere Upload-Formate (WebP)
- [ ] Cloud-Speicher Integration (S3, Azure Blob)
- [ ] Template-Vorschau als PDF
- [ ] Undo/Redo Funktionalität
- [ ] Template-Versionen

## Troubleshooting

### Logo wird nicht angezeigt
- Prüfe, ob der Upload erfolgreich war
- Stelle sicher, dass `/uploads` erreichbar ist
- Überprüfe CORS-Einstellungen

### Drag & Drop funktioniert nicht
- Browser-Kompatibilität prüfen
- JavaScript-Fehler in der Konsole suchen
- Event-Handler überprüfen

### Upload schlägt fehl
- Dateigröße überprüfen (max. 5MB)
- Dateiformat validieren (PNG, JPG, SVG)
- Backend-Logs prüfen
- Uploads-Ordner existiert und ist beschreibbar

## Performance

### Optimierungen
- Lazy Loading für große Bilder
- Debouncing bei Position-Updates
- Optimistische UI-Updates
- Caching von hochgeladenen Bildern

### Best Practices
- Logos vor Upload optimieren
- SVG bevorzugen für kleinere Dateigröße
- Angemessene Bildauflösung (max. 300x150px)
