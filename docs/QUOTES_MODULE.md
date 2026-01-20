# Angebots-/Offertenmodul (Quotes)

## Übersicht

Das Rechnungsmodul wurde erweitert, um auch **Angebote/Offerten** zu erstellen. Ein Angebot unterscheidet sich von einer Rechnung hauptsächlich durch:

1. **Kein Zahlungsziel** - Angebote haben kein Fälligkeitsdatum
2. **Gültigkeitsdatum** - Angebote haben stattdessen ein optionales "Gültig bis"-Datum
3. **Andere Status** - Angebote können "Angenommen" oder "Abgelehnt" werden
4. **PDF-Layout** - Auf dem PDF steht "ANGEBOT" statt "RECHNUNG"

## Datenbank-Schema

### Neue Felder im `Invoice` Model

```prisma
model Invoice {
  id            String        @id @default(uuid())
  documentType  DocumentType  @default(INVOICE)  // NEU: INVOICE oder QUOTE
  invoiceNumber String        @unique
  invoiceDate   DateTime
  dueDate       DateTime?     // Optional für Angebote
  validUntil    DateTime?     // NEU: Nur für Angebote
  // ... weitere Felder
}

enum DocumentType {
  INVOICE   // Rechnung
  QUOTE     // Angebot/Offerte
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID      // Nur Rechnungen
  OVERDUE   // Nur Rechnungen
  CANCELLED
  ACCEPTED  // Nur Angebote
  DECLINED  // Nur Angebote
}
```

## API-Endpunkte

### Rechnung erstellen (wie bisher)

```http
POST /api/invoices
Content-Type: application/json

{
  "documentType": "INVOICE",  // Optional, Default ist INVOICE
  "invoiceNumber": "RE-2026-001",
  "invoiceDate": "2026-01-20",
  "dueDate": "2026-02-20",       // Pflichtfeld für Rechnungen
  "customerId": "customer-123",
  "status": "DRAFT",
  "items": [...]
}
```

### Angebot erstellen (NEU)

```http
POST /api/invoices
Content-Type: application/json

{
  "documentType": "QUOTE",
  "invoiceNumber": "AN-2026-001",
  "invoiceDate": "2026-01-20",
  "validUntil": "2026-02-20",    // Optional: Gültigkeitsdatum
  "customerId": "customer-123",
  "status": "DRAFT",
  "items": [...]
}
```

**Wichtig:** 
- Bei `documentType: "INVOICE"` ist `dueDate` Pflicht
- Bei `documentType: "QUOTE"` ist `dueDate` optional, dafür kann `validUntil` gesetzt werden

### PDF-Generierung

```http
GET /api/invoices/:id/pdf
```

Die PDF-Generierung erkennt automatisch den `documentType`:
- **Rechnung**: Titel "RECHNUNG", zeigt "Fällig am:", Zahlungsinformationen, QR-Bill-Hinweis
- **Angebot**: Titel "ANGEBOT", zeigt "Gültig bis:", freundlicher Schlusstext, kein QR-Bill

Dateiname wird entsprechend generiert:
- Rechnung: `Rechnung_RE-2026-001.pdf`
- Angebot: `Angebot_AN-2026-001.pdf`

## Frontend-Komponenten

### InvoicesTab.tsx

Die Komponente wurde erweitert um:

1. **Zwei separate Buttons**: "Neue Rechnung" und "Neues Angebot"
2. **Dokumenttyp-Auswahl** im Formular (nur bei Neuanlage, nicht änderbar)
3. **Bedingte Felder**:
   - Rechnung: "Fälligkeitsdatum" (Pflicht)
   - Angebot: "Gültig bis" (Optional)
4. **Status-Optionen** abhängig vom Dokumenttyp:
   - Rechnung: DRAFT, SENT, PAID, OVERDUE, CANCELLED
   - Angebot: DRAFT, SENT, ACCEPTED, DECLINED, CANCELLED
5. **Tabellenspalte "Typ"** zeigt Badge (Rechnung/Angebot)

### Status-Farben

- **DRAFT** (Entwurf): Blau (#e3f2fd / #1565c0)
- **SENT** (Versendet): Orange (#fff3e0 / #e65100)
- **PAID** (Bezahlt): Grün (#d4edda / #155724)
- **OVERDUE** (Überfällig): Rot (#f8d7da / #721c24)
- **ACCEPTED** (Angenommen): Grün (#d4edda / #155724)
- **DECLINED** (Abgelehnt): Rot (#f8d7da / #721c24)
- **CANCELLED** (Storniert): Grau (#f5f5f5 / #616161)

## TypeScript Types

```typescript
export type DocumentType = 'INVOICE' | 'QUOTE';

export type InvoiceStatus = 
  | 'DRAFT' 
  | 'SENT' 
  | 'PAID'      // Nur Rechnungen
  | 'OVERDUE'   // Nur Rechnungen
  | 'CANCELLED' 
  | 'ACCEPTED'  // Nur Angebote
  | 'DECLINED'; // Nur Angebote

export interface Invoice {
  id: string;
  documentType: DocumentType;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;        // Optional für Angebote
  validUntil?: string;     // Nur für Angebote
  customerId: string;
  templateId?: string;
  status: InvoiceStatus;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  items?: InvoiceItem[];
}
```

## Verwendungsbeispiele

### 1. Angebot erstellen

```typescript
const quote = await invoiceService.createInvoice({
  documentType: 'QUOTE',
  invoiceNumber: 'AN-2026-005',
  invoiceDate: '2026-01-20',
  validUntil: '2026-03-20',  // 2 Monate Gültigkeit
  customerId: 'customer-123',
  status: 'DRAFT',
  items: [
    {
      description: 'Webseite Entwicklung',
      quantity: 1,
      unitPrice: 5000,
      unit: 'Pauschal',
      vatRate: 7.7
    }
  ]
});
```

### 2. Angebot in Rechnung umwandeln

```typescript
// Schritt 1: Angebot auf ACCEPTED setzen
await invoiceService.updateInvoice(quoteId, {
  status: 'ACCEPTED'
});

// Schritt 2: Neue Rechnung aus Angebot erstellen
const invoice = await invoiceService.createInvoice({
  documentType: 'INVOICE',
  invoiceNumber: 'RE-2026-042',
  invoiceDate: new Date().toISOString(),
  dueDate: addDays(new Date(), 30).toISOString(),
  customerId: quote.customerId,
  items: quote.items,
  notes: `Basierend auf Angebot ${quote.invoiceNumber}`
});
```

### 3. PDF für Angebot generieren

```typescript
// Backend
const pdfBuffer = await generateInvoicePdf(quoteId);

// Frontend
const pdfUrl = `/api/invoices/${quoteId}/pdf`;
window.open(pdfUrl, '_blank');
```

## Workflow: Von Angebot zu Rechnung

1. **Angebot erstellen**: `documentType: QUOTE`, Status: `DRAFT`
2. **Angebot versenden**: Status → `SENT`
3. **Kunde entscheidet**:
   - Angenommen → Status: `ACCEPTED` → Neue Rechnung erstellen
   - Abgelehnt → Status: `DECLINED`
4. **Rechnung erstellen**: Neue `Invoice` mit `documentType: INVOICE` und Referenz zum Angebot

## Migration bestehender Daten

Alle bestehenden Einträge in der `invoices` Tabelle erhalten automatisch:
- `documentType = 'INVOICE'` (Default-Wert)
- `dueDate` bleibt wie es ist (NOT NULL → nullable)
- `validUntil = NULL`

Keine manuellen Anpassungen erforderlich.

## Berechtigungen

Das Angebots-Feature nutzt die bestehenden Rechnungs-Berechtigungen:
- Modul: `invoices`
- Aktionen: `canView`, `canCreate`, `canEdit`, `canDelete`

Es sind keine zusätzlichen Berechtigungen erforderlich.

## PDF-Unterschiede

### Rechnung-PDF
```
╔════════════════════════════════════════╗
║           RECHNUNG                     ║
║  Rechnung Nr.: RE-2026-001             ║
║  Rechnungsdatum: 20.01.2026            ║
║  Fällig am: 20.02.2026                 ║
║                                        ║
║  [Positionen]                          ║
║                                        ║
║  Zahlungsinformationen:                ║
║  IBAN: CH...                           ║
║  QR-Rechnung folgt separat             ║
╚════════════════════════════════════════╝
```

### Angebot-PDF
```
╔════════════════════════════════════════╗
║           ANGEBOT                      ║
║  Angebot Nr.: AN-2026-001              ║
║  Angebotsdatum: 20.01.2026             ║
║  Gültig bis: 20.03.2026                ║
║                                        ║
║  [Positionen]                          ║
║                                        ║
║  Wir freuen uns über Ihre              ║
║  Rückmeldung zu diesem Angebot.        ║
╚════════════════════════════════════════╝
```

## Best Practices

### Nummerierung

Empfohlene Nummerierungsschemata:
- **Rechnungen**: `RE-YYYY-XXX` (z.B. RE-2026-001)
- **Angebote**: `AN-YYYY-XXX` (z.B. AN-2026-001)

### Status-Transitions

**Angebot:**
```
DRAFT → SENT → ACCEPTED/DECLINED → [CANCELLED]
```

**Rechnung:**
```
DRAFT → SENT → PAID → [CANCELLED]
                 ↓
             OVERDUE (automatisch bei Fälligkeit)
```

### Gültigkeitsdatum

Typische Gültigkeitsdauern:
- **Standardangebot**: 30 Tage
- **Komplexe Projekte**: 60-90 Tage
- **Zeitkritisch**: 14 Tage

## Zusammenfassung

Das Rechnungsmodul wurde elegant um Angebote erweitert, ohne Breaking Changes:
- ✅ Bestehende Rechnungen bleiben unverändert
- ✅ Neues Feld `documentType` mit Default-Wert
- ✅ Flexible Status-Optionen je nach Dokumenttyp
- ✅ PDF-Generierung erkennt Typ automatisch
- ✅ Frontend zeigt beide Typen in einer Tabelle
- ✅ Keine zusätzlichen Berechtigungen erforderlich

---

**Erstellt am:** 20. Januar 2026  
**Version:** 1.0  
**Autor:** Entwicklungsteam cflux
