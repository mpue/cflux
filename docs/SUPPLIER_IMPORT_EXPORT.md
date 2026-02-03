# Lieferanten Im- und Export

## Überblick

Das System unterstützt den Import und Export von Lieferantendaten im JSON-Format. Dies ermöglicht:
- Backup von Lieferantendaten
- Migration zwischen Systemen
- Bulk-Updates von Lieferanten
- Integration mit externen Systemen

## JSON-Format

```json
[
  {
    "name": "Muster AG",
    "contactPerson": "Max Mustermann",
    "email": "info@muster.ch",
    "phone": "+41 44 123 45 67",
    "address": "Musterstrasse 123",
    "zipCode": "8000",
    "city": "Zürich",
    "country": "Schweiz",
    "taxId": "CHE-123.456.789",
    "notes": "Hauptlieferant für Büromaterial",
    "isActive": true
  },
  {
    "name": "Beispiel GmbH",
    "contactPerson": "Anna Beispiel",
    "email": "kontakt@beispiel.ch",
    "phone": "+41 31 987 65 43",
    "address": "Beispielweg 456",
    "zipCode": "3000",
    "city": "Bern",
    "country": "Schweiz",
    "taxId": "CHE-987.654.321",
    "notes": "IT-Lieferant",
    "isActive": true
  }
]
```

## Backend API

### Export
```
GET /api/suppliers/export/json
```
- **Auth**: JWT + Admin-Rolle erforderlich
- **Response**: JSON-Array mit allen Lieferanten (ohne IDs und Timestamps)
- **Headers**: 
  - `Content-Type: application/json`
  - `Content-Disposition: attachment; filename=suppliers-export.json`

### Import
```
POST /api/suppliers/import/json
Content-Type: application/json

[
  { "name": "...", ... },
  { "name": "...", ... }
]
```
- **Auth**: JWT + Admin-Rolle erforderlich
- **Body**: JSON-Array mit Lieferanten
- **Logik**:
  - Existiert ein Lieferant mit gleichem Namen bereits → **Update**
  - Lieferant existiert nicht → **Create**
  - Fehlende Pflichtfelder (name) → Skip mit Fehlermeldung
- **Response**:
```json
{
  "message": "Import completed",
  "results": {
    "success": 15,
    "failed": 2,
    "errors": [
      "Supplier without name skipped",
      "Failed to import XY: Validation error"
    ]
  }
}
```

## Frontend Service

```typescript
// Export
const blob = await supplierService.exportSuppliers();
// Erstellt Download-Link für JSON-Datei

// Import
const suppliers = [{ name: "...", ... }];
const result = await supplierService.importSuppliers(suppliers);
console.log(result.results); // { success: X, failed: Y, errors: [] }
```

## UI-Integration

In der Lieferantenverwaltung (`/admin` → Tab "Lieferanten"):

- **📥 Export-Button**: Lädt alle Lieferanten als JSON-Datei herunter
  - Dateiname: `lieferanten-export-YYYY-MM-DD.json`
  
- **📤 Import-Button**: Öffnet Datei-Auswahl für JSON-Import
  - Zeigt nach Import eine Zusammenfassung (Erfolg/Fehler)
  - Aktualisiert automatisch die Lieferantenliste

## Verwendungsszenarien

### 1. Backup erstellen
1. In Admin-Bereich navigieren
2. Tab "Lieferanten" öffnen
3. "📥 Export" klicken
4. JSON-Datei wird heruntergeladen

### 2. Daten importieren
1. JSON-Datei vorbereiten (siehe Format oben)
2. "📤 Import" klicken
3. Datei auswählen
4. Ergebnis in Alert-Dialog prüfen

### 3. Bulk-Update
1. Daten exportieren
2. JSON-Datei in Editor öffnen
3. Gewünschte Änderungen vornehmen
4. Datei importieren (bestehende Lieferanten werden aktualisiert)

## Technische Details

### Datenfelder
- **Pflichtfeld**: `name`
- **Optionale Felder**: Alle anderen
- **Standard-Werte**:
  - `country`: "Schweiz"
  - `isActive`: true

### Duplikat-Erkennung
- Basis: `name` (Case-sensitive)
- Bei Match: Alle Felder werden aktualisiert (außer ID, createdAt, updatedAt)

### Fehlerbehandlung
- Ungültiges JSON → Fehler im Frontend
- Fehlende Pflichtfelder → Skip mit Fehlermeldung
- Datenbank-Fehler → Einzelner Eintrag fehlgeschlagen, Import läuft weiter
- Alle Fehler werden in `results.errors[]` gesammelt

## Sicherheit

- Beide Endpunkte erfordern Admin-Rechte
- Keine Passwörter oder sensitive Daten werden exportiert
- IDs werden nicht exportiert (verhindert ID-Konflikte)
- Import validiert alle Daten vor dem Speichern
