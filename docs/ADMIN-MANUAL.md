# cflux Administrator-Handbuch

**Für Administratoren und System-Manager**  
Version 1.0 - Januar 2025

---

## Inhaltsverzeichnis

1. [Administrator-Rolle](#administrator-rolle)
2. [Benutzerverwaltung](#benutzerverwaltung)
3. [Projektverwaltung](#projektverwaltung)
4. [Zeitmanagement](#zeitmanagement)
5. [Urlaubsverwaltung](#urlaubsverwaltung)
6. [Rechnungswesen](#rechnungswesen)
7. [Reporting & Analytics](#reporting--analytics)
8. [System-Administration](#system-administration)
9. [Best Practices](#best-practices)

---

## Administrator-Rolle

### Berechtigungen

Als Administrator haben Sie **vollständigen Zugriff** auf alle Funktionen:

**Benutzer:**
- ✅ Benutzer erstellen, bearbeiten, löschen
- ✅ Rollen zuweisen (USER ↔ ADMIN)
- ✅ Urlaubskontingente festlegen
- ✅ Benutzer aktivieren/deaktivieren

**Projekte:**
- ✅ Projekte erstellen, bearbeiten, löschen
- ✅ Benutzer zu Projekten zuweisen
- ✅ Projekt-Status verwalten

**Zeiterfassung:**
- ✅ Zeiteinträge aller Benutzer einsehen
- ✅ Zeiteinträge korrigieren
- ✅ Zeiteinträge löschen

**Urlaub & Abwesenheiten:**
- ✅ Alle Anträge einsehen
- ✅ Anträge genehmigen/ablehnen
- ✅ Anträge stornieren

**Reports:**
- ✅ Team-weite Reports
- ✅ Projekt-Auswertungen
- ✅ Export-Funktionen

**Rechnungen:**
- ✅ Rechnungen erstellen
- ✅ Rechnungen versenden
- ✅ Zahlungen tracken

### Verantwortlichkeiten

Als Administrator sind Sie verantwortlich für:

1. **Tägliche Aufgaben:**
   - Urlaubsanträge prüfen und bearbeiten
   - Zeitkorrekturen durchführen
   - Benutzer-Support leisten

2. **Wöchentliche Aufgaben:**
   - Arbeitszeitübersichten prüfen
   - Projekt-Auslastung kontrollieren
   - System-Health überprüfen

3. **Monatliche Aufgaben:**
   - Monatsberichte erstellen
   - Abwesenheitsstatistiken prüfen
   - Rechnungen erstellen
   - Datensicherung kontrollieren

4. **Jährliche Aufgaben:**
   - Urlaubskontingente aktualisieren
   - Jahresberichte erstellen
   - System-Review durchführen

---

## Benutzerverwaltung

### Benutzer erstellen

**Manuelles Anlegen:**

1. Navigieren Sie zu **"Verwaltung" → "Benutzer"**
2. Klicken Sie auf **"Neuer Benutzer"**
3. Füllen Sie das Formular aus:
   ```
   E-Mail:         max.mustermann@firma.ch
   Vorname:        Max
   Nachname:       Mustermann
   Rolle:          USER / ADMIN
   Urlaubstage:    25 (Standard)
   Aktiv:          ✓ Ja
   ```
4. Klicken Sie **"Erstellen"**

**Initiales Passwort:**
- System generiert temporäres Passwort
- Benutzer erhält E-Mail mit Login-Daten
- Benutzer muss Passwort bei erster Anmeldung ändern

**Bulk-Import (CSV):**

Für viele Benutzer auf einmal:

1. Navigieren Sie zu **"Verwaltung" → "Benutzer" → "Import"**
2. Laden Sie die CSV-Vorlage herunter
3. Füllen Sie die CSV-Datei aus:
   ```csv
   email,firstName,lastName,role,vacationDays
   max@firma.ch,Max,Mustermann,USER,25
   anna@firma.ch,Anna,Schmidt,USER,25
   admin@firma.ch,Admin,User,ADMIN,30
   ```
4. Laden Sie die Datei hoch
5. Prüfen Sie die Vorschau
6. Klicken Sie **"Importieren"**

### Benutzer bearbeiten

**Profildaten ändern:**

1. Öffnen Sie **"Verwaltung" → "Benutzer"**
2. Klicken Sie auf den Benutzer
3. Klicken Sie **"Bearbeiten"**
4. Ändern Sie die Daten:
   - Name
   - E-Mail (wird als neuer Login verwendet)
   - Urlaubstage
   - Rolle
5. Klicken Sie **"Speichern"**

**Rolle ändern:**

**USER zu ADMIN machen:**
```
Benutzer öffnen → Rolle: ADMIN auswählen → Speichern
```

**ADMIN zu USER zurückstufen:**
```
Benutzer öffnen → Rolle: USER auswählen → Speichern
```

⚠️ **Wichtig:** Es sollte immer mindestens ein ADMIN-Benutzer existieren!

### Passwort zurücksetzen

Wenn ein Benutzer sein Passwort vergessen hat:

1. Öffnen Sie den Benutzer
2. Klicken Sie **"Passwort zurücksetzen"**
3. Wählen Sie:
   - **Temporäres Passwort generieren** (wird per E-Mail gesendet)
   - **Eigenes Passwort setzen** (geben Sie ein neues Passwort ein)
4. Bestätigen Sie

Der Benutzer kann sich nun mit dem neuen Passwort anmelden.

### Benutzer deaktivieren

**Soft Delete** (empfohlen):

Wenn ein Mitarbeiter das Unternehmen verlässt:

1. Öffnen Sie den Benutzer
2. Setzen Sie **"Aktiv"** auf **Nein**
3. Speichern Sie

**Effekt:**
- ✅ Benutzer kann sich nicht mehr anmelden
- ✅ Alle historischen Daten bleiben erhalten
- ✅ Zeiteinträge und Urlaube sind weiterhin in Reports sichtbar
- ✅ Benutzer kann bei Bedarf reaktiviert werden

**Hard Delete** (mit Vorsicht):

⚠️ **Nur in Ausnahmefällen!**

1. Öffnen Sie den Benutzer
2. Klicken Sie **"Löschen"**
3. Bestätigen Sie die Sicherheitsabfrage

**Effekt:**
- ❌ Benutzer wird aus System entfernt
- ❌ Alle Zeiteinträge gehen verloren
- ❌ Unwiderruflich!

**Empfehlung:** Verwenden Sie immer Soft Delete (Deaktivieren).

### Urlaubskontingent verwalten

**Initiales Kontingent setzen:**

Bei neuem Benutzer oder Jahreswechsel:

1. Öffnen Sie den Benutzer
2. Feld **"Urlaubstage"**: Setzen Sie die Anzahl (z.B. 25)
3. Speichern Sie

**Anpassungen während des Jahres:**

**Urlaubstage hinzufügen:**
```
Beispiel: Sonderurlaub für Hochzeit
→ Urlaubstage von 25 auf 28 erhöhen
```

**Urlaubstage reduzieren:**
```
Beispiel: Teilzeit-Wechsel
→ Urlaubstage von 25 auf 20 reduzieren
```

**Übersicht für alle Benutzer:**

Report: **"Urlaubsübersicht"** zeigt:
- Kontingent pro Benutzer
- Genommener Urlaub
- Geplanter Urlaub (genehmigt aber noch nicht genommen)
- Verbleibende Tage

---

## Projektverwaltung

### Projekt erstellen

1. Navigieren Sie zu **"Verwaltung" → "Projekte"**
2. Klicken Sie **"Neues Projekt"**
3. Füllen Sie das Formular aus:
   ```
   Name:           Website Redesign 2025
   Beschreibung:   Kompletter Relaunch der Firmenwebsite
   Aktiv:          ✓ Ja
   Kunde:          Acme Corp (optional)
   Budget:         100 Stunden (optional)
   ```
4. Klicken Sie **"Erstellen"**

### Benutzer zu Projekten zuweisen

**Einzelzuweisung:**

1. Öffnen Sie das Projekt
2. Klicken Sie **"Benutzer zuweisen"**
3. Wählen Sie Benutzer aus der Liste
4. Klicken Sie **"Zuweisen"**

**Mehrfachzuweisung:**

1. Öffnen Sie das Projekt
2. Aktivieren Sie die Checkboxen bei allen gewünschten Benutzern
3. Klicken Sie **"Ausgewählte zuweisen"**

**Benutzer entfernen:**

1. Öffnen Sie das Projekt
2. Klicken Sie auf das **"X"** neben dem Benutzer
3. Bestätigen Sie die Entfernung

💡 **Tipp:** Nur zugewiesene Benutzer können auf das Projekt Zeiten buchen!

### Projekt-Lifecycle

**Aktives Projekt:**
```
Status: Aktiv ✓
→ Benutzer können Zeiten buchen
→ Erscheint in Projekt-Listen
```

**Projekt pausieren:**
```
Status: Inaktiv ✗
→ Keine neuen Zeitbuchungen möglich
→ Historische Daten bleiben erhalten
→ Kann jederzeit reaktiviert werden
```

**Projekt abschließen:**
```
1. Setzen auf Inaktiv
2. Final-Report erstellen
3. Optional: Rechnung erstellen
4. Projekt archivieren
```

### Projekt-Übersicht

**Dashboard** zeigt für jedes Projekt:

```
Project: Website Redesign
Status:  Aktiv
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Team:           4 Mitarbeiter
Gesamtstunden:  120h von 150h Budget
Auslastung:     80%
Letzte Buchung: 15.01.2025 17:30
Top Contributor: Max Mustermann (45h)
```

**Alerts:**
- 🟡 Warnung bei 80% Budget-Auslastung
- 🔴 Kritisch bei 100% Budget überschritten
- ⏰ Keine Aktivität seit >7 Tagen

---

## Zeitmanagement

### Zeiteinträge prüfen

**Team-Übersicht:**

1. Navigieren Sie zu **"Verwaltung" → "Zeiteinträge"**
2. Filter setzen:
   - Zeitraum (heute, diese Woche, ...)
   - Benutzer
   - Projekt
   - Status (eingestempelt/ausgestempelt)

**Was Sie sehen:**
```
15.01.2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Max Mustermann
  08:00 - 12:00  Website Redesign    4h
  13:00 - 17:00  Mobile App          4h
  Gesamt: 8h ✓

Anna Schmidt
  08:30 - ???    CRM System          Eingestempelt 🔴
  
Status: 1 Benutzer noch eingestempelt
```

### Zeiteinträge korrigieren

**Wann korrigieren?**
- Vergessenes Ausstempeln
- Falsche Projektbuchung
- Zeitfehler (zu früh/zu spät)

**So korrigieren Sie:**

1. Suchen Sie den Zeiteintrag
2. Klicken Sie auf **"Bearbeiten"**
3. Ändern Sie:
   - Einstempel-Zeit
   - Ausstempel-Zeit
   - Projekt
   - Beschreibung
4. **Wichtig:** Geben Sie einen Korrektur-Grund an!
5. Klicken Sie **"Speichern"**

**Best Practice:**
```
Korrektur-Grund Beispiele:
✅ "Vergessenes Ausstempeln nachtragen"
✅ "Falsche Projektbuchung korrigiert"
✅ "Zeitanpassung nach Rücksprache mit MA"

❌ Nicht einfach leer lassen!
```

**Audit Trail:**
Alle Korrekturen werden geloggt:
- Wer hat korrigiert
- Wann wurde korrigiert
- Was wurde geändert
- Grund der Korrektur

### Zeiteintrag löschen

⚠️ **Nur in Ausnahmefällen!**

**Gründe zum Löschen:**
- Doppelte Buchung
- Test-Eintrag
- Irrtümliche Buchung

**So löschen Sie:**

1. Zeiteintrag öffnen
2. Klicken Sie **"Löschen"**
3. Geben Sie Lösch-Grund an
4. Bestätigen Sie

💡 **Besser:** Korrigieren statt Löschen (für Audit Trail)

### Offene Zeiteinträge schließen

**Problem:** Benutzer hat vergessen auszustempeln

**Lösung 1 - Manuell:**
1. Finden Sie den offenen Eintrag
2. Bearbeiten Sie ihn
3. Setzen Sie Ausstempel-Zeit
4. Speichern Sie

**Lösung 2 - Automatisch:**
Nächtlicher Cronjob schließt offene Einträge:
```
Konfiguration in .env:
AUTO_CLOCK_OUT_TIME=18:00
AUTO_CLOCK_OUT_ENABLED=true

→ Alle offenen Einträge werden um 18:00 Uhr geschlossen
```

---

## Urlaubsverwaltung

### Anträge bearbeiten

**Übersicht der Anträge:**

Navigieren Sie zu **"Verwaltung" → "Urlaubsanträge"**

```
Ausstehende Anträge (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Max Mustermann
  01.02. - 07.02.2025 (5 Tage)
  Typ: Urlaub
  Grund: Familienurlaub
  [Genehmigen] [Ablehnen]

Anna Schmidt
  15.03. - 15.03.2025 (0.5 Tage)
  Typ: Urlaub
  Grund: Arzttermin
  [Genehmigen] [Ablehnen]
```

### Antrag genehmigen

**Standard-Genehmigung:**

1. Klicken Sie **"Genehmigen"**
2. Optional: Kommentar hinzufügen
3. Bestätigen Sie

**Effekt:**
- ✅ Status → APPROVED
- ✅ Urlaubstage werden vom Kontingent abgezogen
- ✅ Benutzer erhält Benachrichtigung
- ✅ Erscheint in Kalenderübersicht

**Prüfungen vor Genehmigung:**

**1. Verfügbare Urlaubstage:**
```
Kontingent:  25 Tage
Genommen:    10 Tage
Beantragt:    5 Tage
Verbleibend: 10 Tage ✓
```

**2. Team-Auslastung:**
- Sind genug Mitarbeiter anwesend?
- Gibt es bereits viele Urlaube im Zeitraum?
- Ist das Projekt ausreichend besetzt?

**3. Projekttermine:**
- Gibt es kritische Deadlines?
- Ist der Mitarbeiter zwingend erforderlich?

**4. Vorlaufzeit:**
- Wurde rechtzeitig beantragt?
- Mindestens 2 Wochen im Voraus (Richtlinie)

### Antrag ablehnen

**Ablehnung mit Begründung:**

1. Klicken Sie **"Ablehnen"**
2. **Wichtig:** Geben Sie einen Grund an!
   ```
   Beispiele:
   "Projektdeadline am 05.02., bitte alternativen Zeitraum wählen"
   "Team-Meeting am 02.02. - Ihre Anwesenheit erforderlich"
   "Bereits 2 Kollegen im Urlaub, minimal Besetzung"
   ```
3. Bestätigen Sie

**Effekt:**
- ❌ Status → REJECTED
- ❌ Keine Urlaubstage abgezogen
- ❌ Benutzer erhält Benachrichtigung mit Begründung

**Best Practice:**
- Immer konstruktive Begründung geben
- Alternative Zeiträume vorschlagen
- Bei Ablehnung: Persönliches Gespräch empfohlen

### Genehmigten Urlaub stornieren

**Wann nötig?**
- Dringende Projektanforderung
- Mitarbeiter selbst storniert
- Fehlerhafte Genehmigung

**So stornieren Sie:**

1. Öffnen Sie den genehmigten Antrag
2. Klicken Sie **"Stornieren"**
3. Geben Sie Grund an
4. Bestätigen Sie

**Effekt:**
- Urlaubstage werden zurückgebucht
- Status → CANCELLED
- Benutzer wird benachrichtigt

⚠️ **Achtung:** Nur in Ausnahmefällen! Stornierung bereits genehmigter Urlaube ist problematisch.

### Urlaubskalender

**Team-Kalenderübersicht:**

```
Februar 2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mo Di Mi Do Fr Sa So
                1  2
3  4  5  6  7  8  9
   🏖️ 🏖️ 🏖️ 🏖️     Max M.
10 11 12 13 14 15 16
🏖️ 🏖️ 🏖️           Anna S.
17 18 19 20 21 22 23
      🤒 🤒         Tom K.
24 25 26 27 28

Legende:
🏖️ Urlaub
🤒 Krankheit
🏡 Home Office
```

**Export-Funktionen:**
- iCal Export (für Outlook/Google Calendar)
- PDF Export (für Aushang)
- Excel Export (für Planung)

---

## Rechnungswesen

### Rechnung erstellen

**Schritt 1 - Grunddaten:**

1. Navigieren Sie zu **"Verwaltung" → "Rechnungen"**
2. Klicken Sie **"Neue Rechnung"**
3. Wählen Sie:
   ```
   Kunde:          Acme Corp
   Projekt:        Website Redesign
   Rechnungsdatum: 31.01.2025
   Fälligkeitsdatum: 28.02.2025 (30 Tage)
   ```

**Schritt 2 - Positionen:**

**Manuelle Positionen:**
```
Pos  Beschreibung              Menge  Einheit  Preis    MwSt   Total
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1    Backend Entwicklung       40     Stunden  120 CHF  8.1%   5'188.80
2    Frontend Entwicklung      30     Stunden  120 CHF  8.1%   3'891.60
3    Projektmanagement         10     Stunden  150 CHF  8.1%   1'621.50
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                                                   Subtotal:    9'600.00
                                                   MwSt 8.1%:     777.60
                                                   ━━━━━━━━━━━━━━━━━━━
                                                   Total:      10'377.60 CHF
```

**Aus Zeitbuchungen:**
1. Klicken Sie **"Aus Zeiteinträgen generieren"**
2. Wählen Sie Zeitraum
3. Wählen Sie Benutzer/Projekte
4. System fasst automatisch zusammen:
   ```
   Max Mustermann - Website Redesign: 40h × 120 CHF = 4'800 CHF
   Anna Schmidt - Website Redesign: 30h × 120 CHF = 3'600 CHF
   ```
5. Prüfen und anpassen Sie

**Schritt 3 - Details:**
```
Zahlungsbedingungen:
☑ Zahlbar innerhalb 30 Tagen
☑ 2% Skonto bei Zahlung binnen 10 Tagen
☐ Anzahlung 50%

Notizen:
Vielen Dank für Ihren Auftrag!

Fußzeile:
Bankverbindung: IBAN CH...
```

**Schritt 4 - QR-Rechnung (Schweiz):**

Automatische Generierung:
- ✅ QR-Code mit allen Zahlungsinformationen
- ✅ IBAN
- ✅ Betrag
- ✅ Referenznummer
- ✅ Rechnungsadresse

### Rechnung versenden

**Als PDF:**

1. Öffnen Sie die Rechnung
2. Klicken Sie **"PDF generieren"**
3. Vorschau prüfen
4. **"Herunterladen"** oder **"Per E-Mail senden"**

**E-Mail-Versand:**
```
An:        buchhaltung@kunde.ch
Betreff:   Rechnung RE-2025-001 - Website Redesign
Text:      [Standard-Template oder benutzerdefiniert]
Anhang:    RE-2025-001.pdf
```

**Status nach Versand:**
- Status: DRAFT → SENT
- Versanddatum wird gespeichert
- Tracking: "Wann wurde versendet"

### Zahlungsstatus verwalten

**Zahlung erfassen:**

Wenn Kunde bezahlt hat:

1. Öffnen Sie die Rechnung
2. Klicken Sie **"Zahlung erfassen"**
3. Geben Sie ein:
   ```
   Zahlungsdatum:   15.02.2025
   Betrag:          10'377.60 CHF
   Zahlungsart:     Banküberweisung
   Referenz:        Buchungsbeleg XYZ
   ```
4. Speichern Sie

**Status:**
- Status: SENT → PAID
- Überfällig-Warnung wird entfernt

**Teilzahlungen:**

Bei Anzahlungen oder Ratenzahlungen:

```
Rechnungsbetrag:  10'377.60 CHF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Zahlung 1:        5'000.00 CHF  (15.02.)
Zahlung 2:        5'377.60 CHF  (15.03.)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bezahlt:         10'377.60 CHF ✓
Offen:                0.00 CHF
```

### Mahnwesen

**Überfällige Rechnungen:**

Automatische Erkennung:
- Status → OVERDUE wenn Fälligkeitsdatum überschritten
- Dashboard zeigt überfällige Rechnungen

**Mahnungen erstellen:**

**1. Mahnung (nach 7 Tagen):**
```
Betreff: Zahlungserinnerung RE-2025-001
Ton:     Freundlich
Inhalt:  "Möglicherweise haben Sie unsere Rechnung übersehen..."
```

**2. Mahnung (nach 14 Tagen):**
```
Betreff: 1. Mahnung RE-2025-001
Ton:     Bestimmt aber höflich
Mahngebühr: 50 CHF
```

**3. Mahnung (nach 30 Tagen):**
```
Betreff: 2. Mahnung RE-2025-001
Ton:     Ernst
Mahngebühr: 100 CHF
Androhung: Inkasso
```

### Finanz-Übersicht

**Dashboard "Rechnungen":**

```
Monat Januar 2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rechnungen erstellt:      15
Gesamtvolumen:            250'000 CHF

Status:
  Draft:        3  (20'000 CHF)
  Versendet:    7  (150'000 CHF)
  Bezahlt:      4  ( 70'000 CHF)
  Überfällig:   1  ( 10'000 CHF) 🔴

Ausstehend:             160'000 CHF
Durchschn. Zahlungsziel: 22 Tage
```

---

## Reporting & Analytics

### Standard-Reports

**1. Team-Übersicht:**
```
Zeitraum: Januar 2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mitarbeiter    Stunden  Tage  Projekte  Urlaub
Max M.         160h     20    3         0
Anna S.        152h     19    2         1
Tom K.         144h     18    4         2

Gesamt:        1280h    160   -         10
Durchschnitt:  160h     20    3         1.25
```

**2. Projekt-Auslastung:**
```
Projekt              Team  Stunden  Budget  Auslastung
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Website Redesign     4     320h     400h    80% ✓
Mobile App           3     240h     200h    120% 🔴
CRM System           2     80h      150h    53% 🟡
```

**3. Urlaubsübersicht:**
```
Mitarbeiter    Kontingent  Genommen  Geplant  Verfügbar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Max M.         25          5         3        17
Anna S.        25          8         0        17
Tom K.         25          3         5        17
```

### Custom Reports erstellen

**Report-Builder:**

1. Navigieren Sie zu **"Reports" → "Neuer Report"**
2. Wählen Sie:
   ```
   Typ:         Zeiterfassung / Urlaub / Projekt
   Zeitraum:    01.01.2025 - 31.01.2025
   Filter:
     ☑ Benutzer:  [Alle / Auswahl]
     ☑ Projekte:  [Alle / Auswahl]
     ☑ Status:    [Alle / Aktiv / Inaktiv]
   
   Gruppierung: Nach Benutzer / Projekt / Woche / Monat
   Sortierung:  Name / Stunden / Datum
   ```
3. **"Vorschau"** → Prüfen
4. **"Erstellen"** → Report wird generiert

**Speichern für Wiederverwendung:**
- Reports können als Vorlage gespeichert werden
- Monatliche Reports automatisieren

### Export-Funktionen

**PDF Export:**
- Formatierte Berichte
- Firmen-Logo/Header
- Professionelles Layout
- Geeignet für Präsentationen

**Excel Export:**
- Alle Rohdaten
- Pivot-Tabellen möglich
- Weitere Analyse in Excel
- Archivierung

**CSV Export:**
- Einfaches Format
- Import in andere Systeme
- Datenverarbeitung
- Backup

### Dashboards

**Admin-Dashboard:**

```
┌─────────────────────────────────────────────────────┐
│ Aktuelle Auslastung                                 │
│                                                     │
│ ████████████████░░░░  20/25 Mitarbeiter @ Arbeit   │
│                                                     │
│ Heute eingestempelt: 20                             │
│ Home Office:         3                              │
│ Urlaub/Krank:        2                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Ausstehende Aktionen                                │
│                                                     │
│ 🔔 Urlaubsanträge:      5 warten auf Genehmigung   │
│ ⏰ Offene Zeiteinträge: 2 seit gestern offen       │
│ 💰 Überfällige Rechnung: 1 (10'000 CHF)            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Monatsstatistik (Januar 2025)                       │
│                                                     │
│ Gesamtstunden:     3'200h                           │
│ Urlaubstage:       45                               │
│ Krankheitstage:    12                               │
│ Rechnungsvolumen:  250'000 CHF                      │
└─────────────────────────────────────────────────────┘
```

---

## System-Administration

### Backup & Restore

**Automatisches Backup:**

Konfiguration in `.env`:
```bash
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"  # Täglich um 2 Uhr
BACKUP_RETENTION_DAYS=30
BACKUP_LOCATION=/opt/cflux/backups
```

**Manuelles Backup:**

```bash
# Datenbank-Backup
docker exec timetracking-db pg_dump -U timetracking timetracking > \
  backup_$(date +%Y%m%d).sql

# Komprimieren
gzip backup_$(date +%Y%m%d).sql

# Auf externes Storage kopieren
scp backup_*.sql.gz backup-server:/backups/cflux/
```

**Restore:**

```bash
# Backup entpacken
gunzip backup_20250115.sql.gz

# Datenbank wiederherstellen
docker exec -i timetracking-db psql -U timetracking timetracking < backup_20250115.sql
```

### Benutzer-Aktivität überwachen

**Audit Log:**

```
Timestamp             User             Action                    Details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2025-01-15 14:30:22   admin@firma.ch   USER_CREATED              max@firma.ch
2025-01-15 14:35:10   admin@firma.ch   PROJECT_ASSIGNED          Max → Projekt ABC
2025-01-15 14:40:55   max@firma.ch     CLOCK_IN                  Projekt ABC
2025-01-15 15:20:30   admin@firma.ch   TIME_ENTRY_CORRECTED      Entry #123 (Korrektur)
2025-01-15 16:00:00   admin@firma.ch   ABSENCE_APPROVED          Urlaub Max 5 Tage
```

**Zugriff auf Audit Log:**
- Navigieren Sie zu **"System" → "Audit Log"**
- Filter nach Benutzer, Datum, Aktion
- Export als CSV möglich

### System-Einstellungen

**Globale Konfiguration:**

```
Zeiterfassung
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Max. Arbeitszeit/Tag:       10 Stunden
Pflicht-Pause ab:           6 Stunden
Auto-Ausstempeln:           18:00 Uhr
Zeitbuchung in Zukunft:     ☐ Erlauben

Urlaub
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Standard Urlaubstage:       25 Tage
Min. Vorlaufzeit:           2 Wochen
Max. Urlaubstage am Stück:  20 Tage
Resturlaub übertragbar:     ☑ Ja (bis 31.03.)

Rechnungen
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Standard Zahlungsziel:      30 Tage
MwSt-Satz:                  8.1%
Rechnungsnummer-Format:     RE-{JAHR}-{NUMMER}
Automatische Nummerierung:  ☑ Ja

E-Mail
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SMTP Server:                smtp.firma.ch
Port:                       587
Verschlüsselung:            TLS
Absender:                   noreply@cflux.firma.ch
```

### Wartungsarbeiten

**Regelmäßige Tasks:**

**Täglich:**
- Backup prüfen
- Offene Zeiteinträge schließen (Auto)
- Überfällige Rechnungen markieren (Auto)

**Wöchentlich:**
- Log-Dateien rotieren
- Performance-Metriken prüfen
- Disk Space monitoren

**Monatlich:**
- Alte Logs archivieren
- Backup-Rotation
- Security Updates prüfen

**Jährlich:**
- Urlaubskontingente zurücksetzen
- Jahresarchiv erstellen
- System-Review

### Wartungsmodus

**System für Wartung sperren:**

```bash
# Wartungsmodus aktivieren
docker exec timetracking-backend npm run maintenance:on

# Wartungsmodus deaktivieren
docker exec timetracking-backend npm run maintenance:off
```

**Effekt:**
- Benutzer sehen Wartungshinweis
- Login nicht möglich
- Admin-Zugang bleibt bestehen
- Keine Datenverluste

---

## Best Practices

### Tägliche Routine

**Morgens (08:00-09:00):**
1. Dashboard-Check
2. Urlaubsanträge prüfen (max. 24h Reaktionszeit)
3. Offene Zeiteinträge vom Vortag schließen
4. Krankheitsmeldungen prüfen

**Mittags:**
1. Aktuelle Team-Auslastung prüfen
2. Zeitkorrekturen durchführen

**Abends (17:00-18:00):**
1. Tagesübersicht erstellen
2. Kritische Alerts prüfen
3. Backup-Status kontrollieren

### Wöchentliche Aufgaben

**Montags:**
- Wochenplanung: Team-Auslastung
- Projekt-Status-Updates
- Urlaubs-Kalender prüfen

**Freitags:**
- Wochenreport erstellen
- Zeiteinträge-Qualität prüfen
- Ausstehende Genehmigungen abarbeiten

### Monatliche Aufgaben

**Monatsanfang:**
- Vormonat abschließen
- Monatsberichte erstellen
- Urlaubsübersicht aktualisieren

**Monatsende:**
- Rechnungen erstellen
- Projekt-Auswertungen
- Budget-Kontrolle

### Kommunikations-Richtlinien

**Urlaubsanträge:**
- Reaktionszeit: Max. 24 Stunden
- Bei Ablehnung: Immer Begründung + Alternative
- Bei Genehmigung: Kurzes Bestätigung-Kommentar

**Zeitkorrekturen:**
- Immer Korrektur-Grund dokumentieren
- Benutzer informieren über größere Änderungen
- Bei Unstimmigkeiten: Persönliches Gespräch

**Probleme:**
- Offene Kommunikation
- Lösungsorientiert
- Dokumentation im System

### Datenschutz & Compliance

**DSGVO-Konformität:**
- ✅ Mitarbeiter-Daten minimieren
- ✅ Zugriffskontrolle (Rollen)
- ✅ Audit-Logs führen
- ✅ Datenlöschung auf Anfrage

**Schweizer OR (Obligationenrecht):**
- ✅ Korrekte Arbeitszeiterfassung
- ✅ Pausenregelungen einhalten
- ✅ Überstunden-Tracking
- ✅ Aufbewahrungspflicht (10 Jahre)

**Tipps:**
- Regelmäßige Datenschutz-Schulungen
- Privacy by Design
- Verschlüsselung nutzen
- Zugriffsrechte regelmäßig prüfen

---

## Troubleshooting

### Häufige Admin-Probleme

**Problem: Benutzer kann sich nicht anmelden**

**Checkliste:**
1. ☐ Ist Benutzer aktiv? (Status prüfen)
2. ☐ Passwort korrekt? (Temporäres PW setzen)
3. ☐ E-Mail-Adresse korrekt?
4. ☐ Account gesperrt? (Nach zu vielen Fehlversuchen)
5. ☐ System-weites Problem? (Andere Benutzer betroffen?)

**Lösung:**
- Benutzer reaktivieren
- Passwort zurücksetzen
- Account entsperren (nach 30 Min automatisch)

**Problem: Zeiteinträge fehlen**

**Checkliste:**
1. ☐ Falscher Zeitraum gewählt?
2. ☐ Filter aktiv? (Projekt, Status)
3. ☐ Benutzer hat vergessen zu buchen?
4. ☐ Daten verloren gegangen? (Backup prüfen)

**Lösung:**
- Filter zurücksetzen
- Benutzer kontaktieren
- Bei Datenverlust: Backup einspielen

**Problem: Reports zeigen falsche Zahlen**

**Checkliste:**
1. ☐ Zeitzone korrekt?
2. ☐ Filter richtig gesetzt?
3. ☐ Inkonsistente Daten? (Offene Einträge)
4. ☐ Bug im System?

**Lösung:**
- Offene Zeiteinträge schließen
- Datenintegrität prüfen
- Bei Fehlern: Support kontaktieren

---

## Anhang

### Checklisten

**Neuer Mitarbeiter Onboarding:**
- [ ] Benutzer anlegen
- [ ] Urlaubskontingent setzen (Standard: 25)
- [ ] Zu Projekten zuweisen
- [ ] Willkommens-E-Mail mit Login-Daten
- [ ] Einführung in cflux geben
- [ ] Erste Zeitbuchung prüfen

**Mitarbeiter Offboarding:**
- [ ] Laufende Projekte abschließen
- [ ] Letzte Zeiteinträge prüfen
- [ ] Resturlaub auszahlen/dokumentieren
- [ ] Final-Report erstellen
- [ ] Benutzer deaktivieren (nicht löschen!)
- [ ] Zugriffsrechte entziehen

**Monatsabschluss:**
- [ ] Alle Zeiteinträge prüfen
- [ ] Urlaubsanträge bearbeiten
- [ ] Krankheitstage dokumentieren
- [ ] Projekt-Auswertungen erstellen
- [ ] Rechnungen erstellen
- [ ] Monatsreport an Management
- [ ] Backup kontrollieren

### Kontakte

**Technischer Support:**
- E-Mail: support@cflux.ch
- Hotline: +41 XX XXX XX XX
- Öffnungszeiten: Mo-Fr 08:00-17:00

**Entwickler:**
- GitHub: github.com/mpue/cflux
- Issues: github.com/mpue/cflux/issues

---

**Ende Administrator-Handbuch**

Vielen Dank für Ihre Arbeit als cflux Administrator!  
Bei Fragen steht Ihnen unser Support-Team zur Verfügung.
