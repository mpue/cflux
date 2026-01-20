# Zeitmodelle-Modul - Implementierungsdokumentation

## Übersicht

Das Zeitmodelle-Modul ermöglicht die Verwaltung von differenzierten Stundensätzen basierend auf:
- Wochentag (Montag bis Sonntag)
- Uhrzeit (z.B. 08:00-17:00, 17:00-22:00, Nachtarbeit)
- Feiertagen (Nur-Feiertage, Keine-Feiertage, Normale Tage)
- Priorität (für Überlappungen)

## Datenbank-Schema

### Zeitmodell
Haupttabelle für Zeitmodelle mit Versionshistorie:
- `id` - UUID
- `name` - Name des Zeitmodells
- `beschreibung` - Optionale Beschreibung
- `gueltigVon` - Gültigkeitsbeginn (DateTime)
- `gueltigBis` - Optional: Gültigkeitsende (DateTime)
- `version` - Versionsnummer (Int, default: 1)

### ZeitmodellEintrag
Einzelne Einträge pro Zeitmodell mit Stundensatz-Regeln:
- `id` - UUID
- `zeitmodellId` - Referenz zu Zeitmodell
- `stundensatz` - Stundensatz in CHF (Decimal)
- `startzeit` - Startzeit im Format "HH:MM"
- `endzeit` - Endzeit im Format "HH:MM"
- `wochentage` - Array von Integers (0=Montag, 6=Sonntag), leer = alle Tage
- `nurFeiertage` - Boolean: Gilt nur an Feiertagen
- `keineFeiertage` - Boolean: Gilt nicht an Feiertagen
- `prioritaet` - Int: Priorität für Überlappungen (höher = bevorzugt)

### MitarbeiterZeitmodell
Zuweisungen von Zeitmodellen zu Mitarbeitern:
- `id` - UUID
- `mitarbeiterId` - Referenz zu User
- `zeitmodellId` - Referenz zu Zeitmodell
- `gueltigVon` - Gültigkeitsbeginn
- `gueltigBis` - Optional: Gültigkeitsende

### ZeitmodellAenderung
Audit-Log für alle Änderungen:
- `id` - UUID
- `zeitmodellId` - Referenz zu Zeitmodell
- `aenderungstyp` - Enum: CREATE, UPDATE, DELETE
- `altJson` - JSON: Alter Zustand
- `neuJson` - JSON: Neuer Zustand
- `kommentar` - Optional: Kommentar zur Änderung
- `timestamp` - DateTime (automatisch)

## Backend-API

### Basis-URL
`/api/zeitmodelle`

### Endpunkte

#### Zeitmodelle verwalten
- `GET /` - Alle Zeitmodelle abrufen
- `GET /:id` - Einzelnes Zeitmodell abrufen
- `POST /` - Neues Zeitmodell erstellen (Admin)
- `PUT /:id` - Zeitmodell aktualisieren (Admin)
- `DELETE /:id` - Zeitmodell löschen (Admin)

#### Mitarbeiter-Zuweisungen
- `POST /assign` - Zeitmodell einem Mitarbeiter zuweisen (Admin)
- `GET /mitarbeiter/:mitarbeiterId` - Alle Zuweisungen eines Mitarbeiters
- `DELETE /assign/:id` - Zuweisung entfernen (Admin)

#### Berechnungen
- `GET /stundensatz/:mitarbeiterId?datum=YYYY-MM-DD&uhrzeit=HH:MM` - Stundensatz berechnen
- `GET /abrechnung/:mitarbeiterId?von=YYYY-MM-DD&bis=YYYY-MM-DD` - Arbeitszeitabrechnung

#### Statistiken
- `GET /stats/overview` - Übersicht über alle Zeitmodelle (Admin)

## Frontend-Komponenten

### ZeitmodelleVerwaltung (`/zeitmodelle`)
Hauptseite zur Verwaltung von Zeitmodellen mit:
- Liste aller Zeitmodelle
- Formular zum Erstellen/Bearbeiten
- Eintrags-Editor mit Wochentags-Auswahl
- Zeit- und Feiertagsfilter
- Zuweisungs-Button

### ZeitmodellZuweisung (Komponente)
Modal/Seite zur Zuweisung von Zeitmodellen:
- Mitarbeiter-Auswahl (Dropdown)
- Zeitmodell-Auswahl (Dropdown)
- Gültigkeitsbereich (von/bis)
- Liste aktueller Zuweisungen
- Entfernen-Funktion

## Geschäftslogik

### Stundensatz-Ermittlung
Algorithmus zur Berechnung des Stundensatzes für einen bestimmten Zeitpunkt:

1. Hole alle Zeitmodelle des Mitarbeiters für das Datum
2. Hole alle Einträge der Zeitmodelle
3. Filtere Einträge nach:
   - Wochentag (falls definiert)
   - Feiertag-Flags (nurFeiertage/keineFeiertage)
   - Zeitbereich (startzeit <= uhrzeit < endzeit)
4. Wähle Eintrag mit höchster Priorität
5. Rückgabe: Stundensatz oder Fehler

### Mitternachts-Übergang
Einträge können über Mitternacht gehen (z.B. 22:00-08:00):
- Automatische Split-Logik in Backend
- Berücksichtigung bei Stundensatz-Ermittlung

### Überlappungs-Validierung
Bei Erstellen/Aktualisieren von Einträgen:
- Prüfe auf Überlappungen innerhalb eines Zeitmodells
- Warne bei Überlappungen mit gleicher Priorität
- Erlaube Überlappungen mit unterschiedlicher Priorität

### Arbeitszeitabrechnung
Berechnung für einen Zeitraum:
- Iteriere über alle TimeEntries des Mitarbeiters
- Berechne Stundensatz für Start- und Endzeitpunkt
- Split bei Mitternacht oder Stundensatz-Wechsel
- Summiere Stunden und Beträge

## Beispiel-Zeitmodell

**Name:** Standard Arbeitszeit  
**Gültig von:** 2024-01-01

**Einträge:**
1. CHF 95.00 | 08:00-17:00 | Mo-Fr | Keine Feiertage | Priorität: 50
2. CHF 120.00 | 17:00-22:00 | Mo-Fr | Alle Tage | Priorität: 60
3. CHF 150.00 | 22:00-08:00 | Alle Tage | Alle Tage | Priorität: 70 (Nachtarbeit)
4. CHF 130.00 | 00:00-23:59 | Sa-So | Keine Feiertage | Priorität: 65
5. CHF 180.00 | 00:00-23:59 | Alle Tage | Nur Feiertage | Priorität: 80

## Module-Permissions

Das Zeitmodelle-Modul ist im ModuleAccess-System registriert:
- **Module Key:** `zeitmodelle`
- **Route:** `/zeitmodelle`
- **Berechtigungen:**
  - `canView` - Zeitmodelle anzeigen
  - `canCreate` - Zeitmodelle erstellen
  - `canEdit` - Zeitmodelle bearbeiten
  - `canDelete` - Zeitmodelle löschen

**Standard:** Nur Administrators-Gruppe hat vollen Zugriff.

## Seeding

Beim ersten Start wird:
1. Modul `zeitmodelle` in Module-Tabelle erstellt
2. Administrators-Gruppe erstellt (falls nicht vorhanden)
3. Volle Berechtigungen für Administrators-Gruppe vergeben
4. Beispiel-Zeitmodell "Standard Arbeitszeit" erstellt
5. Audit-Log-Eintrag für Beispiel-Zeitmodell erstellt

**Script:** `backend/prisma/seedZeitmodelle.ts`  
**Ausführen:** `npm run seed` (wird automatisch in seed.ts integriert)

## Testing

### Manuelle Tests
1. Als Admin einloggen
2. Zu `/zeitmodelle` navigieren
3. Neues Zeitmodell erstellen mit mehreren Einträgen
4. Zeitmodell einem Mitarbeiter zuweisen
5. Stundensatz-Berechnung testen über API oder UI

### Wichtige Test-Cases
- Mitternachts-Übergang (22:00-08:00)
- Feiertags-Logik (nur/keine Feiertage)
- Überlappende Einträge mit Prioritäten
- Mehrere Zuweisungen pro Mitarbeiter
- Gültigkeitsbereich (von/bis)

## Deployment

### Datenbank-Migration
```powershell
cd backend
npm run prisma:push        # Schema zu DB synchronisieren
npm run prisma:generate    # Prisma Client generieren
npm run build              # Backend kompilieren
npm run seed               # Seeding ausführen
```

### Docker
Bei Docker-Deployment wird automatisch:
- Schema synchronisiert
- Prisma Client generiert
- Seeding durchgeführt

### Frontend-Build
```powershell
cd frontend
npm run build
```

## Bekannte Einschränkungen

1. **Feiertags-Prüfung:** Verwendet Holiday-Tabelle (muss manuell gepflegt werden)
2. **Zeitzone:** Alle Zeiten in UTC, keine Zeitzonenkonvertierung
3. **Währung:** Nur CHF, keine Multi-Currency
4. **Performance:** Bei großen Datenmengen (>10.000 TimeEntries) ggf. Optimierung notwendig

## Weitere Entwicklung

### Mögliche Erweiterungen
- [ ] Bulk-Import von Zeitmodellen (CSV/Excel)
- [ ] Zeitmodell-Templates
- [ ] Automatische Zeitmodell-Zuweisung nach Benutzergruppe
- [ ] Visualisierung der Stundensätze (Diagramm)
- [ ] Export-Funktion für Abrechnungen (PDF/Excel)
- [ ] Workflow-Integration für Zeitmodell-Änderungen
- [ ] Multi-Currency-Unterstützung
- [ ] Zeitzone-Aware Berechnungen

## Support

Bei Fragen oder Problemen:
- Dokumentation: `docs/zeitmodell_spezifikation.md`
- API-Tests: `backend/src/tests/zeitmodell.test.ts` (TODO)
- Beispiel-Daten: Via Seeding erstellt
