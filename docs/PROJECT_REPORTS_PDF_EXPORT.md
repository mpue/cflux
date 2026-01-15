# Projekt Reports - PDF Export Feature

## Überblick

Die Projekt Reports-Komponente verfügt über einen professionellen PDF-Export, der hochwertige Reports mit korrekt gerenderten Diagrammen erstellt. Die PDFs sind für die Weitergabe an Kunden optimiert.

## Features

### ✨ Funktionen

- **Hochwertige Diagramme**: Alle Recharts-Diagramme werden mit html2canvas erfasst und in hoher Qualität ins PDF eingebettet
- **Professionelles Layout**: 
  - Blauer Header mit Titel und Datum
  - Strukturierte Abschnitte mit Überschriften
  - Tabellarische Darstellung von Projektdaten
  - Footer mit Seitenzahlen und Vertraulichkeitshinweis
- **Mehrseitige PDFs**: Automatischer Seitenumbruch bei langen Reports
- **Zwei Report-Typen**:
  - **Projekt-Übersicht**: Zusammenfassung aller Projekte mit Diagrammen und Detailtabelle
  - **Zeiterfassung**: Detaillierte Zeiterfassung pro Projekt mit Charts und Tabellen

## Verwendung

### 1. Projekt-Übersicht PDF

1. Navigieren Sie zum Tab "Projekt-Übersicht"
2. Wählen Sie optional Filter (Status, Zeitraum)
3. Klicken Sie auf "Aktualisieren" um Daten zu laden
4. Klicken Sie auf den roten **"Export PDF"** Button
5. Das PDF wird automatisch heruntergeladen

**PDF Inhalt:**
- Header mit Titel und Erstellungsdatum
- Zusammenfassung-Statistiken (Projekte, Budget, Kosten, Stunden)
- 6 Diagramme:
  - Budget-Verteilung nach Projekt (Pie Chart)
  - Budget vs. Tatsächliche Kosten (Bar Chart)
  - Arbeitsstunden nach Projekt (Bar Chart)
  - Budget-Auslastung in % (Bar Chart)
  - Projekte nach Status (Pie Chart)
  - Team-Größe pro Projekt (Bar Chart)
- Detaillierte Projekt-Tabelle mit allen Projekten

### 2. Zeiterfassung PDF

1. Navigieren Sie zum Tab "Zeiterfassung"
2. Wählen Sie ein Projekt aus
3. Optional: Zeitraum und Gruppierung einstellen
4. Klicken Sie auf "Report laden"
5. Klicken Sie auf den roten **"Export PDF"** Button

**PDF Inhalt:**
- Header mit Titel und Erstellungsdatum
- Projektname und Budget-Info
- Zusammenfassung (Zeitraum, Stunden, Kosten, Einträge)
- 2 Diagramme:
  - Stunden-Verteilung (Bar Chart mit dual axis)
  - Kosten-Verteilung (Pie Chart)
- Gruppierte Daten Tabelle

## Technische Details

### Abhängigkeiten

```json
{
  "jspdf": "^2.x.x",
  "html2canvas": "^1.x.x",
  "@types/html2canvas": "^1.x.x"
}
```

### Installation

```bash
cd frontend
npm install jspdf html2canvas @types/html2canvas
```

### Implementierung

Die PDF-Export-Funktion verwendet:

1. **jsPDF**: PDF-Generierung und Layout
2. **html2canvas**: Screenshot-Erfassung von HTML-Elementen (Diagramme)
3. **React Refs**: Zugriff auf DOM-Elemente für Chart-Erfassung

#### Code-Struktur

```typescript
// Refs für Content-Bereiche
const overviewContentRef = useRef<HTMLDivElement>(null);
const timeContentRef = useRef<HTMLDivElement>(null);

// PDF Export Funktion
const exportToPDF = async () => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // 1. Header erstellen
  // 2. Statistiken hinzufügen
  // 3. Charts mit html2canvas erfassen und einbetten
  // 4. Tabellen hinzufügen
  // 5. Footer auf allen Seiten
  // 6. PDF speichern
};
```

### PDF-Spezifikationen

- **Format**: A4 (210 x 297 mm)
- **Orientierung**: Portrait
- **Ränder**: 15mm auf allen Seiten
- **Header-Höhe**: 35mm (blauer Hintergrund)
- **Chart-Maximalgröße**: 80mm Höhe
- **Schriftart**: Helvetica
- **Dateiname-Format**: 
  - Übersicht: `Projekt-Uebersicht_YYYY-MM-DD.pdf`
  - Zeiterfassung: `Zeiterfassung_Projektname_YYYY-MM-DD.pdf`

### Layout-Details

#### Header (alle PDFs)
- Blauer Hintergrund (#2196F3)
- Weißer Text
- Titel: 24pt bold
- Datum: 10pt normal
- Format: "Erstellt am: DD. MMMM YYYY"

#### Content-Bereiche
- Abschnittstitel: 16pt bold
- Sub-Titel: 12-14pt bold
- Normaler Text: 10pt
- Tabellen: 8pt

#### Footer (alle Seiten)
- Links: n/a
- Mitte: "Seite X von Y"
- Rechts: "Vertraulich - Nur für internen Gebrauch"
- Schriftgröße: 8pt
- Farbe: Grau (#969696)

### Chart-Rendering

Die Diagramme werden folgendermaßen erfasst:

```typescript
const canvas = await html2canvas(chartCard, {
  backgroundColor: '#ffffff',
  logging: false,
  useCORS: true,
} as any);

const imgData = canvas.toDataURL('image/png');
const imgWidth = contentWidth;
const imgHeight = (canvas.height * imgWidth) / canvas.width;

pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
```

**Wichtig**: 
- Charts werden als PNG-Bilder eingebettet
- Weißer Hintergrund wird erzwungen
- Aspect Ratio bleibt erhalten
- Maximale Höhe: 80mm (verhindert Überläufe)

### Seitenumbruch-Logik

```typescript
if (yPosition > pageHeight - 100) {
  pdf.addPage();
  yPosition = margin;
}
```

Neue Seiten werden automatisch hinzugefügt, wenn:
- Weniger als 100mm Platz bis zum Seitenende
- Vor jedem neuen großen Element (Chart, Tabelle)

## UI-Komponenten

### Export-Buttons

```tsx
<button 
  onClick={exportToPDF} 
  className="btn-export btn-pdf" 
  disabled={(!overviewData && !timeTrackingData) || isPdfGenerating}
>
  <FileText size={18} />
  {isPdfGenerating ? 'PDF wird erstellt...' : 'Export PDF'}
</button>
```

**Styling:**
- Roter Button (#dc3545) für bessere Sichtbarkeit
- Icon: FileText (Lucide)
- Disabled State während PDF-Generierung
- Tooltip: "Als PDF exportieren"

### CSS-Klassen

```css
.btn-pdf {
  background-color: #dc3545;
}

.btn-pdf:hover:not(:disabled) {
  background-color: #c82333;
}
```

## Performance

### Optimierungen

1. **Chart-Erfassung**: Erfolgt sequenziell (nicht parallel) um Speicher zu schonen
2. **Fehlerbehandlung**: Try-catch für jedes Chart, damit ein Fehler nicht den ganzen Export abbricht
3. **Loading-State**: `isPdfGenerating` verhindert doppelte Ausführung
4. **Lazy Rendering**: Nur sichtbare Charts werden erfasst

### Typische Generierungszeiten

- Projekt-Übersicht (6 Charts + Tabelle): 5-8 Sekunden
- Zeiterfassung (2 Charts + Tabellen): 3-5 Sekunden

**Hinweis**: Die Zeit hängt stark von der Anzahl der Projekte/Einträge und der Browser-Performance ab.

## Einschränkungen

1. **Tabellengröße**: Nur die ersten 30 Projekte werden in die Detail-Tabelle aufgenommen (Performance)
2. **Chart-Qualität**: Abhängig von der Display-Auflösung des Benutzers
3. **Browser-Kompatibilität**: Getestet mit Chrome, Firefox, Edge (moderne Browser erforderlich)
4. **Große Datenmengen**: Bei 100+ Projekten kann die Generierung langsam sein

## Troubleshooting

### Problem: PDF ist leer oder unvollständig

**Lösung:**
- Stellen Sie sicher, dass Daten geladen sind (Button "Aktualisieren" / "Report laden")
- Warten Sie bis alle Charts vollständig gerendert sind
- Prüfen Sie Browser-Console auf Fehler

### Problem: Charts sind unscharf

**Ursache:** html2canvas erfasst in aktueller Display-Auflösung

**Lösung:**
- Zoomen Sie die Seite auf 100% (Strg+0)
- Verwenden Sie einen hochauflösenden Monitor

### Problem: "PDF wird erstellt..." bleibt hängen

**Ursache:** JavaScript-Fehler während der Generierung

**Lösung:**
- Browser-Console öffnen und Fehler prüfen
- Seite neu laden und erneut versuchen
- Falls Problem bestehen bleibt: Entwickler kontaktieren

### Problem: Footer fehlt

**Ursache:** Möglicherweise wurde die Footer-Logik übersprungen

**Lösung:**
- Dies ist ein Bug - bitte melden
- Footer wird auf allen Seiten am Ende der Generierung hinzugefügt

## Erweiterungsmöglichkeiten

### Geplante Features

1. **Logo einbetten**: Firmenlogo im Header
2. **Custom Branding**: Farben konfigurierbar
3. **Detaillierte Einträge**: Option zum Einbinden aller Zeit-Einträge
4. **Excel-Export**: Alternative zu CSV mit Formatierung
5. **Email-Integration**: PDF direkt per Email versenden
6. **Vorschau**: PDF-Vorschau vor dem Download
7. **Templates**: Verschiedene Report-Templates zur Auswahl

### Customization-Optionen

Die PDF-Funktion kann erweitert werden durch:

```typescript
interface PDFExportOptions {
  includeLogo?: boolean;
  logoUrl?: string;
  primaryColor?: string;
  includeTimestamp?: boolean;
  maxProjects?: number;
  includeAllEntries?: boolean;
  confidentialityNote?: string;
}
```

## Code-Beispiele

### PDF mit Custom Header

```typescript
// Custom Header mit Logo
const addCustomHeader = (pdf: jsPDF, title: string, logoUrl?: string) => {
  pdf.setFillColor(33, 150, 243);
  pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 35, 'F');
  
  if (logoUrl) {
    // Logo einbetten
    pdf.addImage(logoUrl, 'PNG', 15, 8, 20, 20);
  }
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text(title, logoUrl ? 45 : 15, 20);
};
```

### Tabelle mit Styling

```typescript
const addStyledTable = (
  pdf: jsPDF,
  headers: string[],
  rows: string[][],
  startY: number
) => {
  // Header mit Hintergrund
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, startY - 4, 180, 6, 'F');
  
  // Zebra-Striping für Zeilen
  rows.forEach((row, idx) => {
    if (idx % 2 === 0) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(15, startY + (idx * 5), 180, 5, 'F');
    }
  });
};
```

## Best Practices

1. **Immer Daten laden** bevor PDF exportiert wird
2. **Filter setzen** um relevante Daten zu zeigen
3. **Zeitraum begrenzen** bei großen Datenmengen
4. **Projekt-Namen überprüfen** (sollten aussagekräftig für Kunden sein)
5. **Vorher testen** mit verschiedenen Datenmengen
6. **Browser-Cache leeren** bei Problemen

## Siehe auch

- [PROJECT_REPORTS_MODULE.md](./PROJECT_REPORTS_MODULE.md) - Allgemeine Dokumentation
- [PDF_DESIGN_INTEGRATION.md](./PDF_DESIGN_INTEGRATION.md) - PDF-Template-System für Rechnungen
- [docs/DEPLOYMENT-FIX.md](./DEPLOYMENT-FIX.md) - Deployment-Hinweise

## Support

Bei Fragen oder Problemen:
1. Prüfen Sie diese Dokumentation
2. Schauen Sie in den Browser-Console-Logs
3. Kontaktieren Sie das Entwicklungsteam

---

**Version:** 1.0.0  
**Letzte Aktualisierung:** Januar 2026  
**Autor:** Development Team
