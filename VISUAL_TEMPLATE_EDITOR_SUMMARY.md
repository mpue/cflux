# 🎨 Visueller Template-Editor - Implementierung abgeschlossen

## Übersicht

Der Template-Editor wurde komplett überarbeitet und bietet jetzt ein modernes, visuelles Interface mit Live-Vorschau und interaktiver Logo-Platzierung.

## ✅ Implementierte Features

### 1. Split-Screen Layout
- **Links**: Editor mit Tabs für Firmendaten, Texte, Design und Einstellungen
- **Rechts**: Live-Vorschau der Rechnung mit Beispieldaten
- Responsive Design für Desktop, Tablet und Mobile

### 2. Logo-Upload mit Drag & Drop
- Unterstützte Formate: PNG, JPG, SVG
- Maximale Dateigröße: 5MB
- Visuelles Feedback während des Uploads
- Validierung von Dateityp und -größe
- Sicherer Upload mit UUID-Dateinamen

### 3. Interaktive Logo-Positionierung
- **Drag & Drop**: Logo mit der Maus verschieben
- **Resize**: Größe durch Ziehen am Handle anpassen
- **Live-Feedback**: Visuelles Feedback beim Bewegen
- **Auto-Save**: Position wird automatisch gespeichert
- Aspect Ratio bleibt erhalten

### 4. Live-Vorschau
- Echtzeitaktualisierung bei allen Änderungen
- Vollständige Rechnungsdarstellung mit Mock-Daten
- Alle Template-Elemente werden angezeigt:
  - Logo (positionierbar)
  - Firmendaten
  - Kundenadresse
  - Rechnungsdetails
  - Positionstabelle mit MwSt.
  - Zahlungsinformationen
  - Fußzeile

## 📁 Neue Dateien

### Backend
```
backend/src/controllers/upload.controller.ts    - Upload-Handler
backend/src/routes/upload.routes.ts            - Upload-Routen
backend/prisma/migrations/
  └── 20251222_add_logo_position/
      └── migration.sql                         - Schema-Migration
```

### Frontend
```
frontend/src/components/
  ├── InvoicePreview.tsx                       - Live-Vorschau Komponente
  └── LogoUpload.tsx                           - Upload-Komponente

frontend/src/styles/
  ├── InvoicePreview.css                       - Vorschau-Styling
  └── LogoUpload.css                           - Upload-Styling
```

### Dokumentation
```
VISUAL_TEMPLATE_EDITOR.md                      - Feature-Dokumentation
VISUAL_TEMPLATE_EDITOR_SETUP.md               - Setup-Anleitung
```

## 🔧 Geänderte Dateien

### Backend
- `backend/prisma/schema.prisma` - Logo-Position und Alignment Felder
- `backend/src/index.ts` - Upload-Route und statische Dateien

### Frontend
- `frontend/src/components/InvoiceTemplateEditor.tsx` - Komplett überarbeitet
- `frontend/src/styles/InvoiceTemplateEditor.css` - Split-Screen Layout
- `frontend/src/types/invoiceTemplate.ts` - Neue Felder

## 🚀 Nächste Schritte

### 1. Datenbank vorbereiten
```bash
# PostgreSQL starten
# Dann Migration ausführen:
cd backend
npx prisma migrate dev --name add_logo_position
```

### 2. Backend starten
```bash
cd backend
npm run dev
```

### 3. Frontend starten
```bash
cd frontend
npm start
```

### 4. Testen
1. Als Admin anmelden
2. Zu "Rechnungsvorlagen" navigieren
3. "Neue Vorlage" erstellen
4. Logo hochladen im Tab "Design"
5. Logo in der Vorschau positionieren
6. Andere Einstellungen testen
7. Speichern

## 🎯 Verwendung

### Logo hochladen
1. Tab "Design" öffnen
2. Logo per Drag & Drop in den Bereich ziehen ODER
3. Auf den Bereich klicken und Datei auswählen
4. Warten auf erfolgreichen Upload

### Logo positionieren
1. Maus über das Logo in der Vorschau bewegen
2. Klicken und ziehen zum Verschieben
3. Resize-Handle (rechts unten) nutzen zum Skalieren
4. Loslassen - Position wird gespeichert

### Vorschau nutzen
- Alle Änderungen werden sofort in der Vorschau sichtbar
- Farben, Texte, Logo-Sichtbarkeit
- Realistische Darstellung mit Beispiel-Rechnungsdaten

## 🔒 Sicherheit

- **Authentifizierung**: Nur angemeldete Admins können hochladen
- **Validierung**: Dateityp und Größe werden geprüft
- **Eindeutige Namen**: UUID-basierte Dateinamen verhindern Konflikte
- **Path Traversal**: Schutz gegen Directory Traversal Angriffe
- **CORS**: Korrekte CORS-Konfiguration für Uploads

## 📱 Responsive Design

- **Desktop (>1200px)**: Split-Screen nebeneinander
- **Tablet (768-1200px)**: Editor und Vorschau vertikal gestapelt
- **Mobile (<768px)**: Optimierte, scrollbare Ansicht

## 🎨 Design-Highlights

### Visuelles Feedback
- Drag-Indicator beim Bewegen des Logos
- Hover-Effekte auf interaktiven Elementen
- Loading-Spinner während Upload
- Erfolgs-/Fehlermeldungen

### Benutzerfreundlichkeit
- Intuitive Tabs für verschiedene Bereiche
- Klare Beschriftungen und Tooltips
- Farbauswahl mit Color Picker
- Sofortige Vorschau-Aktualisierung

## 🐛 Bekannte Einschränkungen

1. **Logo-Position ist pixelbasiert**: Bei sehr unterschiedlichen Bildschirmgrößen kann die Position leicht abweichen
2. **PDF-Generierung**: Logo-Position muss noch im PDF-Controller implementiert werden
3. **Undo/Redo**: Keine Versionierung oder Undo-Funktion

## 🔮 Zukünftige Erweiterungen

- [ ] Logo-Position im PDF-Export verwenden
- [ ] Mehrere Logos (Header, Footer)
- [ ] Logo-Rotation und Filter
- [ ] Bild-Zuschnitt im Editor
- [ ] Cloud-Storage Integration (S3, Azure)
- [ ] Template-Vorschau als PDF-Download
- [ ] Undo/Redo Funktionalität
- [ ] Template-Versionierung
- [ ] Shared Templates zwischen Benutzern

## 📊 Technische Details

### API-Endpunkte
```
POST   /api/uploads/logo        - Logo hochladen
DELETE /api/uploads/:filename   - Datei löschen
GET    /uploads/:filename        - Statischer Zugriff auf Uploads
```

### Datenbank-Schema
```prisma
model InvoiceTemplate {
  // ... bestehende Felder
  logoUrl       String?
  logoPosition  String?  // JSON: {x, y, width, height}
  logoAlignment String   @default("left")
}
```

### Position-Format
```json
{
  "x": 20,
  "y": 20,
  "width": 150,
  "height": 60
}
```

## 📚 Dokumentation

Ausführliche Dokumentation siehe:
- [VISUAL_TEMPLATE_EDITOR.md](VISUAL_TEMPLATE_EDITOR.md) - Feature-Details
- [VISUAL_TEMPLATE_EDITOR_SETUP.md](VISUAL_TEMPLATE_EDITOR_SETUP.md) - Setup-Anleitung

## 🎉 Fertig!

Der visuelle Template-Editor ist vollständig implementiert und einsatzbereit. Nach dem Start der Datenbank und der Migration kann das Feature sofort verwendet werden.

**Happy Template Editing! 🎨**
