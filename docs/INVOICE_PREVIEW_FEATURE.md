# Rechnungsvorschau mit Druckfunktion

## Übersicht

In der Rechnungsansicht gibt es jetzt einen **"Vorschau"** Button, der eine formatierte Ansicht der Rechnung öffnet - perfekt zum Überprüfen und Drucken.

## Features

### ✅ Vorschau-Button
- Neuer Button in der Rechnungsliste: **👁️ Vorschau**
- Öffnet Modal mit formatierter Rechnungsansicht
- Zeigt echte Rechnungsdaten (nicht Mock-Daten wie im Template-Editor)

### ✅ Formatierte Ansicht
Die Vorschau zeigt:
- **Logo** mit Position aus Template
- **Firmendaten** aus Template
- **Kundenadresse** von der Rechnung
- **Rechnungsdetails** (Nummer, Datum, Fälligkeit)
- **Positionstabelle** mit allen Items
- **Beträge** (Zwischentotal, MwSt., Gesamtbetrag)
- **Zahlungsinformationen** (Bank, IBAN)
- **Bemerkungen** falls vorhanden
- **Texte** aus Template (Header, Intro, Footer)

### ✅ Design aus Template
Die Vorschau verwendet alle Design-Elemente:
- Primärfarbe für Überschriften und Akzente
- Logo an der konfigurierten Position
- Alle Texte aus dem Template
- Einstellungen (Logo anzeigen, Zahlungsinfo, etc.)

### ✅ Drucken-Funktion
- **🖨️ Drucken** Button im Modal-Header
- Öffnet Browser-Druckdialog
- Optimiertes Print-Layout (entfernt Buttons, Navigation)
- Professionelles A4-Format

## Verwendung

### 1. Vorschau öffnen
```
Rechnungsverwaltung → Rechnung auswählen → Klick auf "👁️ Vorschau"
```

### 2. Rechnung prüfen
- Alle Details überprüfen
- Design-Elemente kontrollieren
- Daten validieren

### 3. Drucken
- Klick auf "🖨️ Drucken" Button
- Browser-Druckdialog öffnet sich
- Drucker/PDF auswählen
- Drucken bestätigen

## Komponenten

### InvoicePreviewModal.tsx
Neue Komponente für die Rechnungsvorschau:
```tsx
<InvoicePreviewModal
  invoice={invoice}
  onClose={() => setShowPreview(false)}
/>
```

**Props:**
- `invoice: Invoice` - Rechnung mit allen Daten
- `onClose: () => void` - Callback zum Schließen

**Features:**
- Lädt Template automatisch (aus Rechnung oder Default)
- Rendert komplette Rechnung mit Template-Design
- Unterstützt Drucken via window.print()

### InvoicePreviewModal.css
Styles mit Print-Optimierung:
```css
@media print {
  .no-print { display: none; }
  /* Optimiertes Layout für Druck */
}
```

## Buttons in Rechnungsliste

```tsx
// Reihenfolge der Buttons:
1. 👁️ Vorschau  (Lila)   - Neue Funktion
2. 📄 PDF       (Grün)   - Download PDF
3. Bearbeiten   (Blau)   - Rechnung bearbeiten
4. Löschen      (Rot)    - Rechnung löschen
```

## Print-Optimierung

### Was wird gedruckt:
✅ Logo
✅ Firmendaten
✅ Kundenadresse
✅ Rechnungsdetails
✅ Positionstabelle
✅ Beträge
✅ Zahlungsinformationen
✅ Bemerkungen
✅ Footer-Text

### Was wird NICHT gedruckt:
❌ Modal-Header mit Buttons
❌ Schließen-Button
❌ Hintergrund-Overlay
❌ Navigation

### Print-CSS
```css
@media print {
  .no-print {
    display: none !important;
  }
  
  .preview-page {
    padding: 20mm;
    /* A4-Format optimiert */
  }
}
```

## Unterschied: Vorschau vs. PDF-Download

| Feature | Vorschau | PDF-Download |
|---------|----------|--------------|
| Zweck | Schnelle Ansicht | Archivierung |
| Ladezeit | Sofort | 1-2 Sekunden |
| Datei | Keine | .pdf Datei |
| Drucken | Browser-Druck | Separate PDF öffnen |
| Editieren | Nicht möglich | Nicht möglich |
| Template | Live aus DB | Im PDF eingebettet |

## Vorteile

### Schnelle Überprüfung
- Keine PDF-Generierung nötig
- Sofortige Ansicht
- Direkt im Browser

### Flexible Verwendung
- Schnelles Drucken ohne Download
- Einfaches Teilen via Bildschirm
- Kein Dateichaos

### Konsistentes Design
- Zeigt exakt das Template-Design
- Identisch mit PDF (gleiche Template-Daten)
- WYSIWYG - What You See Is What You Get

## Technische Details

### Template-Laden
```typescript
// Lädt Template aus Rechnung oder Default
if (invoice.templateId) {
  template = await invoiceTemplateService.getById(invoice.templateId);
} else {
  template = await invoiceTemplateService.getDefault();
}
```

### Druck-Funktion
```typescript
const handlePrint = () => {
  window.print(); // Browser-native Druckdialog
};
```

### Responsive Design
- Desktop: Volle Breite (max 900px)
- Tablet: Angepasste Ansicht
- Mobile: Scrollbar, kompakte Darstellung
- Print: A4-Format, 20mm Ränder

## Browser-Kompatibilität

✅ Chrome/Edge - Vollständig unterstützt
✅ Firefox - Vollständig unterstützt
✅ Safari - Vollständig unterstützt
⚠️ IE11 - Nicht unterstützt (veraltet)

## Keyboard Shortcuts

- `Esc` - Vorschau schließen
- `Ctrl+P` / `Cmd+P` - Direkt drucken (wenn Vorschau fokussiert)

## Zukünftige Erweiterungen

Mögliche Verbesserungen:
- [ ] PDF-Vorschau (eingebetteter PDF-Viewer)
- [ ] E-Mail direkt aus Vorschau
- [ ] QR-Code in Vorschau anzeigen
- [ ] Vorschau-Export als Bild
- [ ] Vollbild-Modus
- [ ] Zoom-Funktion
- [ ] Vergleich mit früheren Versionen

## Zusammenfassung

Der neue **"Vorschau"** Button bietet:
- 🚀 Schnelle Ansicht ohne PDF-Generierung
- 🎨 Design aus Template-Editor
- 🖨️ Direkte Druckfunktion
- 📱 Responsive für alle Geräte
- ✨ Professionelles Layout

**Perfekt für schnelle Kontrolle und Druck direkt aus dem Browser!** 🎉
