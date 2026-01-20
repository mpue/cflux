# Zeitmodell-Spezifikation cflux ERP

## Übersicht
Zeitmodelle definieren zeitabhängige Stundensätze für Mitarbeiter in CHF. Jedes Zeitmodell enthält Einträge mit Stundensatz, Zeitbereich und optionalen Wochentagen. Feiertage werden über die bestehende Vacation-Tabelle integriert.

## Datenmodell

### Zeitmodell
```
id: UUID
name: String
beschreibung: String?
gueltig_von: Date
gueltig_bis: Date?
version: Integer
erstellt_am: Timestamp
geaendert_am: Timestamp
geaendert_von: UUID
```

### ZeitmodellEintrag
```
id: UUID
zeitmodell_id: UUID (FK)
stundensatz: Decimal(10,2)
startzeit: Time
endzeit: Time
wochentage: Integer[]         // [0-6], leer = alle Tage
nur_feiertage: Boolean
keine_feiertage: Boolean
prioritaet: Integer
```

### MitarbeiterZeitmodell
```
mitarbeiter_id: UUID (FK)
zeitmodell_id: UUID (FK)
gueltig_von: Date
gueltig_bis: Date?
```

### ZeitmodellAenderung
```
id: UUID
zeitmodell_id: UUID (FK)
geaendert_am: Timestamp
geaendert_von: UUID (FK)
aenderungstyp: Enum(CREATE, UPDATE, DELETE)
alt_json: JSON?
neu_json: JSON
kommentar: String?
```

## Geschäftsregeln

### Überlappungsprüfung
- Einträge mit gleichen Wochentagen dürfen sich zeitlich nicht überschneiden
- Prüfung bei Create/Update von Einträgen
- Fehler bei Verstoß

### Mitternachtsübergang
- Zeiträume über Mitternacht = zwei separate Einträge
- Beispiel 22:00-06:00:
  - Eintrag 1: 22:00-23:59:59, Wochentage [0,1,2,3,4]
  - Eintrag 2: 00:00-06:00, Wochentage [1,2,3,4,5]

### Feiertags-Logik
- `nur_feiertage=TRUE`: Gilt nur an Feiertagen
- `keine_feiertage=TRUE`: Gilt nicht an Feiertagen
- Beide FALSE: Gilt unabhängig von Feiertagen
- Beide TRUE: Validierungsfehler
- Feiertags-Prüfung gegen Vacation-Tabelle

### Gültigkeitszeitraum
- `gueltig_von` ist Pflicht
- `gueltig_bis` optional (NULL = unbegrenzt)
- Falls gesetzt: `gueltig_bis >= gueltig_von`

### Änderungsmanagement
- Bestehende Einträge werden direkt geändert (keine Versionierung)
- Änderungen wirken retroaktiv
- Audit-Log dokumentiert alle Änderungen
- Version-Counter inkrementiert
- Warnung bei betroffenen Abrechnungen

### Nicht-abgedeckte Zeiträume
- Kein passender Eintrag = Fehler
- Keine impliziten Standardwerte

## Stundensatz-Ermittlung

**Input:** Mitarbeiter-ID, Datum, Uhrzeit

**Algorithmus:**
1. Aktives Zeitmodell für Mitarbeiter finden
2. Wochentag bestimmen (0=Mo, 6=So)
3. Feiertag prüfen (Vacation-Tabelle)
4. Einträge filtern:
   - Feiertags-Filter anwenden
   - Wochentag prüfen
   - Zeitbereich prüfen (startzeit <= uhrzeit <= endzeit)
5. Bei mehreren Treffern: Höchste Priorität
6. Feiertags-Einträge haben implizit Vorrang

**Output:** Stundensatz (Decimal) oder Fehler

## Arbeitszeitabrechnung

**Input:** Mitarbeiter-ID, von-Timestamp, bis-Timestamp

**Prozess:**
1. Zeitraum in Segmente aufteilen (bei Stundensatz-Wechsel)
2. Pro Segment: Stundensatz ermitteln, Dauer × Stundensatz
3. Summieren

**Output:**
```
{
  positionen: [
    {zeitraum, stundensatz, dauer, betrag}
  ],
  gesamt_stunden: Decimal,
  gesamt_betrag: Decimal
}
```

## Validierungen

**Zeitmodell speichern:**
- Überlappungsprüfung durchführen
- Gültigkeitszeitraum prüfen
- Feiertags-Flags prüfen
- Mitternachtsübergänge korrekt

**Zeitmodell ändern:**
1. Alten Zustand sichern (JSON)
2. Änderungen durchführen
3. Version inkrementieren
4. Timestamps aktualisieren
5. Audit-Log erstellen
6. Betroffene Abrechnungen prüfen
7. Warnung ausgeben

## Beispiele

### Standard Bürozeit
```
Name: "Standard Techniker CH"
Gültig ab: 01.01.2025
Einträge:
  - Mo-Fr, 08:00-17:00, 95.00 CHF, keine_feiertage=TRUE
```

### Schichtmodell
```
Name: "Schichtmodell 24/7 CH"
Gültig ab: 01.01.2025
Einträge:
  - Mo-Fr, 06:00-18:00, 95.00 CHF, keine_feiertage=TRUE
  - Mo-Fr, 18:00-23:59:59, 118.75 CHF, keine_feiertage=TRUE
  - Di-Sa, 00:00-06:00, 118.75 CHF, keine_feiertage=TRUE
  - Sa-So, 00:00-23:59:59, 142.50 CHF, keine_feiertage=TRUE
```

### Mit Feiertagszuschlag
```
Name: "Techniker mit Feiertagszuschlag CH"
Gültig ab: 01.01.2025
Einträge:
  - Mo-Fr, 08:00-17:00, 95.00 CHF, keine_feiertage=TRUE
  - Sa-So, 00:00-23:59:59, 142.50 CHF, keine_feiertage=TRUE
  - Alle Tage, 00:00-23:59:59, 190.00 CHF, nur_feiertage=TRUE
```

## Integration Vacation-Tabelle

Feiertags-Prüfung erfolgt gegen bestehende Vacation-Tabelle. Annahme: Feiertage sind über Typ/Kategorie oder fehlende Mitarbeiter-Zuordnung identifizierbar.

## Offene Punkte

1. Exakte Struktur Vacation-Tabelle klären
2. Feiertags-Identifikation in Vacation-Tabelle
3. Kantonal-Zuordnung (falls erforderlich)
4. Prioritäts-Standard festlegen (Vorschlag: Feiertag=100, Normal=50)
5. UI: Auto-Split bei Mitternachtsübergang
