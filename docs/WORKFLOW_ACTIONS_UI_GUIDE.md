# Workflow Actions UI - Benutzerhandbuch

## Wo finde ich die UI?

**Admin Dashboard → Tab "⚡ Workflow Actions"**

Zugriff nur für **Administratoren**.

## Übersicht

Die Workflow Actions UI ermöglicht es Ihnen, Workflows mit System-Events zu verknüpfen, sodass diese automatisch bei bestimmten Aktionen im System ausgelöst werden.

### UI-Layout

Die Seite ist in **zwei Bereiche** aufgeteilt:

1. **Links: System Actions Liste**
   - Zeigt alle verfügbaren System Actions
   - Filter nach Kategorie
   - Anzeige der Anzahl aktiver Triggers

2. **Rechts: Trigger-Management**
   - Details zur ausgewählten Action
   - Liste aller Triggers für diese Action
   - Formular zum Erstellen neuer Triggers

## Schritt-für-Schritt: Workflow mit Action verknüpfen

### 1. System Actions initialisieren (einmalig)

Beim ersten Mal müssen die System Actions initialisiert werden:

1. Öffnen Sie das **Admin Dashboard**
2. Gehen Sie zum Tab **"⚡ Workflow Actions"**
3. Falls noch keine Actions vorhanden sind, erscheint eine Meldung
4. Alternativ: Via API `POST /api/actions/seed` aufrufen

### 2. Action auswählen

1. **Kategorie filtern** (optional)
   - Wählen Sie eine Kategorie aus dem Dropdown (z.B. "Rechnungen", "Bestellungen")
   - Oder lassen Sie "Alle" ausgewählt

2. **Action anklicken**
   - Klicken Sie auf eine Action in der Liste (z.B. "Rechnung auf versendet setzen")
   - Die Action wird rechts im Detail angezeigt

### 3. Trigger erstellen

1. **Button "➕ Trigger erstellen" klicken**
   - Ein Formular öffnet sich

2. **Workflow auswählen** (Pflichtfeld)
   - Wählen Sie den Workflow aus, der getriggert werden soll
   - Nur aktive Workflows werden angezeigt

3. **Timing festlegen**
   - **AFTER** (Standard) - Workflow startet nach der Action
   - **BEFORE** - Workflow startet vor der Action
   - **INSTEAD** - Workflow ersetzt die Action

4. **Priorität** (optional)
   - Niedrigere Zahl = höhere Priorität
   - Standard: 100
   - Wichtig wenn mehrere Workflows auf dieselbe Action reagieren

5. **Bedingung** (optional)
   - **Feld**: z.B. `entityData.totalAmount` (für Rechnungsbetrag)
   - **Operator**: `>`, `<`, `=`, `enthält`, etc.
   - **Wert**: z.B. `5000` (nur bei Betrag > 5000)

6. **Trigger erstellen klicken**

### 4. Trigger verwalten

**Trigger aktivieren/deaktivieren:**
- Klicken Sie auf den grünen (✓) oder roten (✗) Button

**Trigger löschen:**
- Klicken Sie auf das Papierkorb-Symbol 🗑️

**Trigger bearbeiten:**
- Derzeit: Löschen und neu erstellen

## Beispiel-Szenarien

### Beispiel 1: Bestellgenehmigung über 1000 CHF

**Ziel:** Jede Bestellung über 1000 CHF soll automatisch einen Genehmigungsworkflow starten.

**Schritte:**
1. Gehen Sie zu **"⚡ Workflow Actions"**
2. Kategorie: **"Bestellungen"** wählen
3. Action: **"Bestellung anlegen"** anklicken
4. **"➕ Trigger erstellen"** klicken
5. Ausfüllen:
   - Workflow: "Bestellgenehmigung Manager"
   - Timing: AFTER
   - Priorität: 10
   - Bedingung:
     - Feld: `entityData.totalAmount`
     - Operator: `>`
     - Wert: `1000`
6. **Speichern**

✅ **Fertig!** Jetzt startet bei jeder Bestellung > 1000 CHF automatisch der Workflow.

### Beispiel 2: Rechnung versendet → Buchhaltung benachrichtigen

**Ziel:** Bei jeder versendeten Rechnung soll die Buchhaltung benachrichtigt werden.

**Schritte:**
1. Kategorie: **"Rechnungen"**
2. Action: **"Rechnung auf versendet setzen"** wählen
3. **"➕ Trigger erstellen"**
4. Ausfüllen:
   - Workflow: "Buchhaltung Benachrichtigung"
   - Timing: AFTER
   - Priorität: 100
   - Bedingung: *leer lassen* (immer triggern)
5. **Speichern**

### Beispiel 3: Compliance-Verstoß → Vorfall erstellen

**Ziel:** Bei jedem Compliance-Verstoß soll automatisch ein Vorfall erstellt werden.

**Schritte:**
1. Kategorie: **"Compliance"**
2. Action: **"Compliance-Verstoß erkannt"**
3. **"➕ Trigger erstellen"**
4. Ausfüllen:
   - Workflow: "Compliance-Verstoß Management"
   - Timing: AFTER
   - Priorität: 1 (sehr wichtig!)
5. **Speichern**

## Verfügbare Bedingungen

### Operatoren

| Operator | Symbol | Bedeutung | Beispiel |
|----------|--------|-----------|----------|
| `eq` | = | Gleich | Status = "SENT" |
| `ne` | ≠ | Nicht gleich | Status ≠ "DRAFT" |
| `gt` | > | Größer als | Betrag > 5000 |
| `gte` | ≥ | Größer/gleich | Betrag ≥ 1000 |
| `lt` | < | Kleiner als | Betrag < 100 |
| `lte` | ≤ | Kleiner/gleich | Betrag ≤ 500 |
| `contains` | enthält | String enthält | Name enthält "GmbH" |
| `startsWith` | beginnt mit | String beginnt | PLZ beginnt mit "80" |
| `endsWith` | endet mit | String endet | Email endet mit "@firma.ch" |

### Häufige Felder

**Für Rechnungen (`invoice.sent`, `invoice.created`):**
- `entityData.totalAmount` - Rechnungsbetrag
- `entityData.status` - Status (DRAFT, SENT, PAID, etc.)
- `entityData.customer.name` - Kundenname
- `entityData.invoiceNumber` - Rechnungsnummer

**Für Bestellungen (`order.created`, `order.approved`):**
- `entityData.totalAmount` - Bestellbetrag
- `entityData.status` - Status (DRAFT, REQUESTED, APPROVED, etc.)
- `entityData.orderNumber` - Bestellnummer

**Für Zeiterfassung (`timeentry.clockin`, `timeentry.clockout`):**
- `entityData.totalHours` - Gesamtstunden (nur bei clockout)
- `entityData.userId` - Benutzer-ID

## Trigger testen

**Test-Button:**
- Klicken Sie auf **"🧪 Test"** neben der Action
- Sendet Test-Daten an die Action
- Zeigt an, ob Workflows getriggert wurden
- Zeigt Ausführungszeit an

⚠️ **Hinweis:** Test-Daten sind nur Demo-Daten, keine echten Entities!

## Trigger-Status

**Aktiv (✓ grün):**
- Trigger ist aktiviert
- Workflow wird bei Auslösung der Action gestartet

**Inaktiv (✗ rot):**
- Trigger ist deaktiviert
- Workflow wird NICHT gestartet
- Nützlich für temporäres Deaktivieren

## Prioritäten

Wenn **mehrere Workflows** auf dieselbe Action reagieren:

- **Niedrigere Zahl = höhere Priorität**
- Workflows werden nach Priorität sortiert ausgeführt
- Beispiel:
  - Priorität 1: Sehr wichtig (z.B. Compliance)
  - Priorität 10: Wichtig (z.B. Genehmigungen)
  - Priorität 100: Normal (z.B. Benachrichtigungen)

## Monitoring

### Logs ansehen (via API)

```bash
GET /api/actions/logs?actionKey=invoice.sent&limit=50
```

Zeigt:
- Wann wurde die Action ausgelöst
- Von wem
- Welche Workflows wurden gestartet
- Erfolg/Fehler

### Statistics (via API)

```bash
GET /api/actions/statistics?actionKey=invoice.sent
```

Zeigt:
- Gesamtanzahl Ausführungen
- Erfolgsrate
- Durchschnittliche Ausführungszeit

## Troubleshooting

### ❌ Workflow wird nicht gestartet

**Prüfen Sie:**

1. **Ist die Action aktiv?**
   - Sollte nicht ausgegraut sein

2. **Ist der Trigger aktiv?**
   - Grüner Haken (✓) sollte angezeigt werden

3. **Ist der Workflow aktiv?**
   - Gehen Sie zum Tab "🔄 Workflows"
   - Prüfen Sie ob Workflow aktiviert ist

4. **Wird die Bedingung erfüllt?**
   - Prüfen Sie Ihre Bedingung
   - Testen Sie mit dem Test-Button

5. **Gibt es Fehler?**
   - Prüfen Sie Backend-Logs
   - Oder via API: `GET /api/actions/logs?success=false`

### ⚠️ Trigger wird nicht gespeichert

**Mögliche Ursachen:**
- Kein Workflow ausgewählt (Pflichtfeld)
- Workflow existiert nicht mehr
- Keine Admin-Berechtigung
- Backend-Fehler (siehe Console/Network Tab)

### 🐌 Performance-Probleme

**Wenn zu viele Triggers:**
- Reduzieren Sie Anzahl der Triggers pro Action
- Nutzen Sie Bedingungen (frühes Ausschließen)
- Erhöhen Sie Prioritäten sinnvoll

## Best Practices

✅ **Do:**
- Sinnvolle Namen für Workflows wählen
- Bedingungen nutzen (Performance)
- Prioritäten für wichtige Workflows setzen
- Regelmäßig Logs prüfen
- Trigger testen vor Produktiv-Einsatz

❌ **Don't:**
- Zu viele Triggers auf eine Action (max. 3-5)
- Komplexe Bedingungen (besser im Workflow)
- System Actions löschen (nur Custom Actions)
- BEFORE ohne Business-Logic-Anpassung

## Weitere Informationen

- **Vollständige Dokumentation:** `docs/WORKFLOW_ACTION_SYSTEM.md`
- **Quick Start:** `docs/WORKFLOW_ACTIONS_QUICKSTART.md`
- **Backend API:** Alle Endpunkte unter `/api/actions`

## Zusammenfassung

Die Workflow Actions UI macht es einfach:

1. **Action auswählen** (was soll getriggert werden?)
2. **Workflow verknüpfen** (was soll passieren?)
3. **Bedingung setzen** (wann soll es passieren?)
4. **Fertig!** (automatisch bei jeder Auslösung)

Keine Programmierung nötig - alles über die UI! 🎉
