# Bestellungen Modul (Orders Module)

## Übersicht

Das Bestellungen-Modul ermöglicht die Verwaltung von Bestellungen, Wareneingängen und Lieferanten-Bestellungen in einem strukturierten Workflow-System.

## Features

### Kernfunktionen

- ✅ **Bestellverwaltung** - Erstellen, Bearbeiten und Verwalten von Bestellungen
- ✅ **Freigabe-Workflow** - Mehrstufiger Genehmigungsprozess für Bestellungen
- ✅ **Wareneingang** - Erfassung von Lieferungen und Teillieferungen
- ✅ **Lieferantenanbindung** - Verknüpfung mit Lieferanten-Stammdaten
- ✅ **Artikelverwaltung** - Integration mit bestehenden Artikeln
- ✅ **Projektzuordnung** - Optional: Zuordnung zu Projekten und Kostenstellen
- ✅ **Statusverfolgung** - Vollständige Nachverfolgung des Bestellstatus
- ✅ **Statistiken** - Übersicht über Bestellungen und Bestellwerte

### Bestellstatus

| Status | Beschreibung |
|--------|-------------|
| `DRAFT` | Entwurf - Bestellung wird erstellt |
| `REQUESTED` | Angefordert - Wartet auf Freigabe |
| `APPROVED` | Freigegeben - Kann bestellt werden |
| `ORDERED` | Bestellt - Bei Lieferant aufgegeben |
| `PARTIALLY_RECEIVED` | Teilweise erhalten - Erste Lieferungen eingegangen |
| `RECEIVED` | Vollständig erhalten - Alle Positionen geliefert |
| `CANCELLED` | Storniert |
| `REJECTED` | Abgelehnt - Freigabe verweigert |

### Prioritäten

- **LOW** - Niedrig
- **MEDIUM** - Normal (Standard)
- **HIGH** - Hoch
- **URGENT** - Dringend

## Datenbankschema

### Tabellen

#### `orders` - Bestellungen
Haupttabelle für Bestellungen mit allen relevanten Informationen.

```sql
- id (UUID, Primary Key)
- orderNumber (String, Unique) - Auto-generiert: BO-XXXXXX
- supplierId (UUID, Optional) - Referenz zu Supplier
- orderDate (DateTime) - Bestelldatum
- expectedDeliveryDate (DateTime, Optional) - Erwartetes Lieferdatum
- actualDeliveryDate (DateTime, Optional) - Tatsächliches Lieferdatum
- status (OrderStatus) - Aktueller Status
- priority (OrderPriority) - Priorität
- title (String) - Titel/Betreff
- description (Text, Optional) - Beschreibung
- notes (Text, Optional) - Notizen
- internalNotes (Text, Optional) - Interne Notizen
- totalAmount (Float) - Nettobetrag
- vatAmount (Float) - MwSt-Betrag
- grandTotal (Float) - Bruttobetrag
- currency (String) - Währung (Default: CHF)
- deliveryAddress (Text, Optional) - Lieferadresse
- deliveryContact (String, Optional) - Lieferkontakt
- deliveryPhone (String, Optional) - Telefon für Lieferung
- requestedById (UUID) - Benutzer der bestellt hat
- approvedById (UUID, Optional) - Genehmiger
- approvedAt (DateTime, Optional) - Freigabedatum
- rejectedById (UUID, Optional) - Ablehner
- rejectedAt (DateTime, Optional) - Ablehnungsdatum
- rejectionReason (Text, Optional) - Grund für Ablehnung
- projectId (UUID, Optional) - Projektzuordnung
- costCenter (String, Optional) - Kostenstelle
- isActive (Boolean) - Soft-Delete Flag
```

#### `order_items` - Bestellpositionen
Einzelne Positionen einer Bestellung.

```sql
- id (UUID, Primary Key)
- orderId (UUID) - Referenz zu Order
- position (Int) - Reihenfolge
- articleId (UUID, Optional) - Referenz zu Article
- articleNumber (String, Optional) - Artikelnummer (falls kein Article)
- name (String) - Artikelname
- description (Text, Optional) - Beschreibung
- quantity (Float) - Bestellmenge
- unit (String) - Einheit (Stück, kg, m, etc.)
- receivedQuantity (Float) - Bereits gelieferte Menge
- unitPrice (Float) - Einzelpreis
- vatRate (Float) - MwSt-Satz in %
- totalPrice (Float) - Gesamtpreis
- notes (Text, Optional) - Notizen
```

#### `order_deliveries` - Wareneingänge
Erfassung von Lieferungen.

```sql
- id (UUID, Primary Key)
- orderId (UUID) - Referenz zu Order
- deliveryDate (DateTime) - Lieferdatum
- deliveryNumber (String, Optional) - Lieferschein-Nummer
- notes (Text, Optional) - Notizen
- receivedById (UUID) - Benutzer der Wareneingang erfasst hat
```

#### `order_delivery_items` - Wareneingangs-Positionen
Einzelne gelieferte Artikel.

```sql
- id (UUID, Primary Key)
- deliveryId (UUID) - Referenz zu OrderDelivery
- orderItemId (UUID, Optional) - Referenz zu OrderItem
- name (String) - Artikelname
- quantity (Float) - Gelieferte Menge
- unit (String) - Einheit
- notes (Text, Optional) - Notizen
```

## API Endpoints

### Basis-URL: `/api/orders`

#### Bestellungen abrufen
```http
GET /api/orders
```

**Query Parameters:**
- `search` - Suche in Bestellnummer, Titel, Beschreibung
- `status` - Filter nach Status
- `supplierId` - Filter nach Lieferant
- `priority` - Filter nach Priorität
- `projectId` - Filter nach Projekt
- `isActive` - Filter aktive/inaktive (true/false)
- `startDate` - Filter Bestelldatum von
- `endDate` - Filter Bestelldatum bis

**Response:** Array von Order-Objekten

#### Einzelne Bestellung abrufen
```http
GET /api/orders/:id
```

**Response:** Order-Objekt mit allen Details

#### Bestellung erstellen
```http
POST /api/orders
```

**Request Body:**
```json
{
  "title": "Büromaterial",
  "description": "Bestellung von Büromaterial für Q1",
  "supplierId": "uuid",
  "orderDate": "2026-01-07",
  "expectedDeliveryDate": "2026-01-14",
  "priority": "MEDIUM",
  "deliveryAddress": "Musterstrasse 1, 8000 Zürich",
  "deliveryContact": "Max Mustermann",
  "deliveryPhone": "+41 44 123 45 67",
  "projectId": "uuid",
  "costCenter": "IT-001",
  "notes": "Bitte bis 14 Uhr liefern",
  "internalNotes": "Budget bereits freigegeben",
  "items": [
    {
      "articleId": "uuid",
      "name": "Kopierpapier A4",
      "quantity": 10,
      "unit": "Packung",
      "unitPrice": 25.50,
      "vatRate": 7.7,
      "notes": "Weiss, 80g/m²"
    }
  ]
}
```

**Response:** Erstellte Order

#### Bestellung aktualisieren
```http
PUT /api/orders/:id
```

**Request Body:** Wie POST, alle Felder optional

**Response:** Aktualisierte Order

#### Freigabe anfordern
```http
POST /api/orders/:id/request-approval
```

Setzt Status von `DRAFT` auf `REQUESTED`.

**Response:** Aktualisierte Order

#### Bestellung freigeben
```http
POST /api/orders/:id/approve
```

Setzt Status von `REQUESTED` auf `APPROVED`.

**Response:** Aktualisierte Order

#### Bestellung ablehnen
```http
POST /api/orders/:id/reject
```

**Request Body:**
```json
{
  "reason": "Budget nicht verfügbar"
}
```

Setzt Status von `REQUESTED` auf `REJECTED`.

**Response:** Aktualisierte Order

#### Als bestellt markieren
```http
POST /api/orders/:id/mark-ordered
```

Setzt Status von `APPROVED` auf `ORDERED`.

**Response:** Aktualisierte Order

#### Wareneingang erfassen
```http
POST /api/orders/:id/deliveries
```

**Request Body:**
```json
{
  "deliveryDate": "2026-01-14",
  "deliveryNumber": "LS-123456",
  "notes": "Alle Artikel in gutem Zustand",
  "items": [
    {
      "orderItemId": "uuid",
      "name": "Kopierpapier A4",
      "quantity": 10,
      "unit": "Packung",
      "notes": "Vollständig geliefert"
    }
  ]
}
```

Aktualisiert automatisch `receivedQuantity` und Status (PARTIALLY_RECEIVED/RECEIVED).

**Response:** OrderDelivery-Objekt

#### Bestellung stornieren
```http
POST /api/orders/:id/cancel
```

Setzt Status auf `CANCELLED`.

**Response:** Aktualisierte Order

#### Bestellung löschen (Soft Delete)
```http
DELETE /api/orders/:id
```

Setzt `isActive` auf `false`.

**Response:** Success Message

#### Statistiken abrufen
```http
GET /api/orders/statistics
```

**Query Parameters:**
- `startDate` - Zeitraum von
- `endDate` - Zeitraum bis

**Response:**
```json
{
  "totalOrders": 150,
  "byStatus": {
    "draft": 5,
    "requested": 10,
    "approved": 8,
    "ordered": 25,
    "received": 100,
    "cancelled": 2
  },
  "totalValue": 125000.50
}
```

## Frontend-Integration

### Komponenten

#### `OrdersPage` - Hauptseite
- Listenansicht aller Bestellungen
- Filter und Suche
- Statistik-Dashboard
- Aktionen (Freigeben, Ablehnen, Stornieren)

#### Navigation
Bestellungen sind unter `/orders` erreichbar.

### Berechtigungen

Das Modul nutzt das bestehende Berechtigungssystem:

- **View** - Bestellungen anzeigen
- **Create** - Neue Bestellungen erstellen
- **Edit** - Bestellungen bearbeiten
- **Delete** - Bestellungen löschen

Admin-Benutzer können zusätzlich:
- Bestellungen freigeben/ablehnen
- Alle Bestellungen sehen und bearbeiten

## Workflow

### 1. Bestellung erstellen
Benutzer erstellt eine neue Bestellung im Status `DRAFT`.

### 2. Freigabe anfordern
Benutzer fordert Freigabe an → Status: `REQUESTED`.

### 3. Genehmigung
Admin genehmigt oder lehnt die Bestellung ab:
- Genehmigt → Status: `APPROVED`
- Abgelehnt → Status: `REJECTED`

### 4. Bestellung aufgeben
Nach Freigabe wird die Bestellung beim Lieferanten aufgegeben → Status: `ORDERED`.

### 5. Wareneingang
Bei Lieferung wird der Wareneingang erfasst:
- Erste Teillieferung → Status: `PARTIALLY_RECEIVED`
- Vollständig geliefert → Status: `RECEIVED`

### 6. Stornierung (optional)
Jederzeit möglich (außer bei `RECEIVED`/`CANCELLED`) → Status: `CANCELLED`.

## Installation und Setup

### 1. Datenbank-Migration

Die Prisma-Migration wurde bereits angewendet:
```bash
cd backend
npx prisma migrate dev
```

### 2. Modul-Berechtigungen

Das SQL-Script fügt das Modul und Standardberechtigungen hinzu:
```bash
# Bereits ausgeführt via:
# Get-Content db/add_orders_module.sql | docker exec -i timetracking-db psql -U timetracking -d timetracking
```

### 3. Frontend-Build

```bash
cd frontend
npm install
npm run build
```

### 4. Backend-Neustart

Nach der Migration muss der Backend-Server neu gestartet werden:
```bash
docker-compose restart backend
```

## Verwendung

### Neue Bestellung erstellen

1. Navigiere zu "Bestellungen" im Menü
2. Klicke auf "+ Neue Bestellung"
3. Fülle die erforderlichen Felder aus:
   - Titel
   - Lieferant (optional)
   - Bestellpositionen (mindestens eine)
4. Speichere als Entwurf oder fordere direkt Freigabe an

### Bestellung freigeben (Admin)

1. Öffne die Bestellungsliste
2. Bei Bestellungen mit Status "Angefordert" erscheinen Aktions-Buttons
3. Klicke auf ✓ zum Freigeben oder ✗ zum Ablehnen
4. Bei Ablehnung Grund angeben

### Wareneingang erfassen

1. Öffne die Bestellung mit Status "Bestellt" oder "Teilweise erhalten"
2. Klicke auf den Wareneingangs-Button (📥)
3. Erfasse die gelieferten Artikel mit Mengen
4. Optional: Lieferschein-Nummer und Notizen hinzufügen
5. Speichern - Status wird automatisch aktualisiert

## Best Practices

### Bestellnummern
- Werden automatisch generiert im Format `BO-XXXXXX`
- Durchlaufende Nummerierung
- Eindeutig und nicht änderbar

### Artikelverwaltung
- Nutze vorhandene Artikel aus den Stammdaten wenn möglich
- Freie Artikel können direkt eingegeben werden
- Preise werden nicht automatisch übernommen (Verhandlungssache)

### Wareneingang
- Erfasse Teillieferungen separat
- Notiere Lieferschein-Nummern für Nachvollziehbarkeit
- Bei Abweichungen in den Notizen dokumentieren

### Projektzuordnung
- Optional: Ordne Bestellungen Projekten zu
- Ermöglicht Kostenverfolgung pro Projekt
- Kostenstelle für Buchhaltung verwenden

## Zukünftige Erweiterungen

### Geplante Features

- [ ] **PDF-Export** - Bestellungen als PDF generieren
- [ ] **E-Mail-Versand** - Bestellungen direkt an Lieferanten senden
- [ ] **Budgetkontrolle** - Automatische Prüfung gegen Budgets
- [ ] **Bestellvorlagen** - Wiederkehrende Bestellungen vorlagen
- [ ] **Lieferanten-Portal** - Lieferanten können Status aktualisieren
- [ ] **Lagerbestand** - Integration mit Lagerverwaltung
- [ ] **Automatische Wiedervorlage** - Bei fehlenden Lieferungen
- [ ] **Erweiterte Statistiken** - Auswertungen nach Lieferanten, Artikeln, etc.
- [ ] **Mobile App** - Wareneingang mit Smartphone erfassen
- [ ] **Barcode-Scanner** - Artikelerfassung via Barcode

## Troubleshooting

### Problem: Bestellung kann nicht bearbeitet werden
**Lösung:** Prüfe den Status. Bestellungen mit Status `RECEIVED` oder `CANCELLED` können nicht mehr bearbeitet werden.

### Problem: Freigabe-Button wird nicht angezeigt
**Lösung:** Nur Administratoren können Bestellungen freigeben. Prüfe deine Berechtigungen.

### Problem: Wareneingang kann nicht erfasst werden
**Lösung:** Wareneingang ist nur bei Status `ORDERED` oder `PARTIALLY_RECEIVED` möglich.

### Problem: Artikel werden nicht gefunden
**Lösung:** Stelle sicher, dass Artikel in den Stammdaten angelegt und aktiv sind.

## Support

Bei Fragen oder Problemen:
1. Prüfe diese Dokumentation
2. Kontaktiere deinen Administrator
3. Erstelle ein Ticket im Incident Management System

## Version History

### Version 1.0.0 (Januar 2026)
- ✅ Initiales Release
- ✅ Vollständiger Bestellworkflow
- ✅ Wareneingangs-Management
- ✅ Statistiken und Reporting
- ✅ Integration mit Lieferanten und Artikeln
- ✅ Berechtigungssystem
