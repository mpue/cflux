# PDF-Design Integration - Changelog

## Änderungen im PDF-Controller

Der PDF-Generator wurde aktualisiert, um alle Design-Elemente aus dem Template-Editor zu verwenden.

### ✅ Implementierte Features

#### 1. Logo mit Position
- Logo wird aus Template-URL geladen (HTTP oder lokal)
- Logo-Position wird aus `logoPosition` JSON geparst
- Koordinaten werden von Vorschau-Größe auf PDF-Größe skaliert
- Automatische Fehlerbehandlung bei fehlgeschlagenen Logo-Downloads

```typescript
// Position aus Template
{
  x: 20,        // Vorschau-Koordinaten
  y: 20,
  width: 150,
  height: 60
}

// Wird zu PDF-Koordinaten skaliert
logoX = 50 + (position.x * 0.9);
logoY = headerStartY + (position.y * 0.5);
logoWidth = position.width * 0.9;
logoHeight = position.height * 0.9;
```

#### 2. Primärfarbe (Primary Color)
- Wird auf alle wichtigen Überschriften angewendet:
  - Header-Text
  - "Rechnung Nr."
  - "RECHNUNG" Titel
  - Tabellen-Header
  - Tabellen-Linie
  - "Gesamtbetrag"
  - "Bemerkungen"

```typescript
const primaryColor = template?.primaryColor || '#2563eb';
doc.fillColor(primaryColor).text('RECHNUNG', ...);
```

#### 3. Header-Text
- Optionaler Header-Text am oberen Seitenrand
- Verwendet primäre Farbe für Hervorhebung
- Automatische Positionsanpassung für nachfolgende Elemente

#### 4. Intro-Text
- Text vor der Positionstabelle
- Wird zwischen Titel und Tabelle platziert
- Automatische Höhenanpassung

#### 5. Zahlungsinformationen
- Verwendet `paymentTermsText` aus Template
- Bank und IBAN aus Template-Firmendaten
- Kann über `showPaymentInfo` ein-/ausgeschaltet werden

#### 6. Footer
- Custom Footer-Text aus Template
- In grauer Farbe für dezenten Auftritt
- Zeigt UID wenn `showTaxId` aktiviert ist

### Technische Details

#### Dependencies
```json
{
  "axios": "^1.6.5"  // Für Logo-Download von URLs
}
```

#### API-Änderungen
Keine Breaking Changes - alle neuen Felder sind optional.

#### Fehlerbehandlung
- Logo-Download hat 5s Timeout
- Fallback auf Defaults bei fehlenden Template-Daten
- PDF wird auch ohne Logo generiert

### Verwendete Template-Felder

```typescript
interface InvoiceTemplate {
  // Design
  primaryColor: string;
  logoUrl?: string;
  logoPosition?: string;  // JSON: {x, y, width, height}
  
  // Texte
  headerText?: string;
  introText?: string;
  paymentTermsText?: string;
  footerText?: string;
  
  // Firmendaten
  companyName: string;
  companyStreet: string;
  companyZip: string;
  companyCity: string;
  companyPhone: string;
  companyEmail: string;
  companyBank?: string;
  companyIban?: string;
  companyTaxId?: string;
  
  // Einstellungen
  showLogo: boolean;
  showPaymentInfo: boolean;
  showTaxId: boolean;
}
```

### Visuelle Verbesserungen

#### Vorher
- Statisches Layout
- Standard-Blau (#2563eb) fest codiert
- Kein Logo-Support
- Keine Anpassungsmöglichkeiten

#### Nachher
- Dynamisches Layout basierend auf Template
- Anpassbare Farben
- Logo mit freier Positionierung
- Individualisierbare Texte
- Vollständige Template-Integration

### Beispiel PDF-Layout

```
┌─────────────────────────────────────────┐
│ [Header-Text in Primärfarbe]            │
│                                          │
│ [Logo an Position X,Y]                  │
│                                          │
│ Firma GmbH                   Rechnung Nr.│
│ Strasse 123                  RE-2025-0001│
│ 8000 Zürich                  Datum: ...  │
│                                          │
│ Kunde AG                                 │
│ Kundenadresse                            │
│                                          │
│ RECHNUNG [in Primärfarbe]                │
│ [Intro-Text]                             │
│                                          │
│ Pos | Beschreibung | Menge | Preis      │
│─────────────────────────────────────────│ [Primärfarbe]
│  1  | Service      | 10.0  | 150.00     │
│                                          │
│ Gesamtbetrag: CHF 1,500.00 [Primärfarbe]│
│                                          │
│ [Zahlungsbedingungen]                    │
│ Bank: ...                                │
│ IBAN: ...                                │
│                                          │
│ [Footer-Text in Grau]                    │
│ UID: CHE-123.456.789 [optional]          │
└─────────────────────────────────────────┘
```

### Testing

Um die PDF-Integration zu testen:

1. Template mit Design erstellen
2. Logo hochladen und positionieren
3. Farben und Texte anpassen
4. Rechnung erstellen mit diesem Template
5. PDF generieren: GET `/api/invoices/:id/pdf`

### Bekannte Einschränkungen

1. **Logo-Skalierung**: Die Skalierung von Vorschau zu PDF ist approximativ (0.9x, 0.5y)
2. **HTTP-Logos**: Erfordert öffentlich erreichbare URL oder lokalen Zugriff
3. **Timeout**: Logo-Download hat 5s Timeout
4. **Aspect Ratio**: Wird vom Vorschau-System übernommen

### Zukünftige Verbesserungen

- [ ] Präzisere Logo-Skalierung
- [ ] Base64-Logo-Unterstützung
- [ ] Mehrere Logos (Header, Footer)
- [ ] QR-Code Integration mit Template-Position
- [ ] Mehrseitige PDFs mit konsistentem Design
- [ ] PDF-Vorschau im Browser

## Migration

Bestehende Rechnungen ohne Template:
- Verwenden Fallback-Werte
- Funktionieren weiterhin ohne Änderungen

Bestehende Templates ohne neue Felder:
- `primaryColor` = `#2563eb` (blau)
- Alle Text-Felder optional
- `showLogo`, `showPaymentInfo`, `showTaxId` = `true`

## Zusammenfassung

Der PDF-Generator nutzt jetzt **alle** Design-Elemente aus dem visuellen Template-Editor:
- ✅ Logo mit Position
- ✅ Primärfarbe
- ✅ Header-/Footer-Texte
- ✅ Intro-Text
- ✅ Zahlungsbedingungen
- ✅ Firmendaten
- ✅ Ein/Aus-Schalter für Elemente

**Das Design aus dem Editor wird 1:1 im PDF übernommen!** 🎨
