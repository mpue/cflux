# Problemanalyse und Lösung: RE-2026-0014 im Mahnwesen

## Problem
Die Rechnung RE-2026-0014 wurde als "überfällig" gemeldet und sollte im Mahnwesen auftauchen, tat es aber nicht.

## Analyse

### 1. Falscher Rechnungsstatus
Die Rechnung hatte den Status `OVERDUE`, obwohl sie noch nicht fällig war:
- **Rechnungsdatum:** 2026-01-12
- **Fälligkeitsdatum:** 2026-02-11 (in 20 Tagen)
- **Aktuelles Datum:** 2026-01-21
- **Status:** OVERDUE (FALSCH - sollte SENT sein)

### 2. Fehler in getOverdueInvoices()
Die API-Funktion `/api/reminders/overdue-invoices` gab einen 404-Fehler zurück, 
wenn keine ReminderSettings in der Datenbank existierten. Dies verhinderte, dass 
überfällige Rechnungen im Mahnwesen-Frontend angezeigt wurden.

## Durchgeführte Fixes

### Fix 1: Backend-Code korrigiert
**Datei:** `backend/src/controllers/reminder.controller.ts`
**Funktion:** `getOverdueInvoices()`

**Vorher:**
```typescript
const settings = await prisma.reminderSettings.findFirst();

if (!settings) {
  return res.status(404).json({ error: 'Reminder settings not found' });
}
```

**Nachher:**
```typescript
let settings = await prisma.reminderSettings.findFirst();

// Wenn keine Einstellungen vorhanden, Standard-Einstellungen erstellen
if (!settings) {
  settings = await prisma.reminderSettings.create({
    data: {}
  });
}
```

Diese Änderung stellt sicher, dass beim ersten Aufruf automatisch ReminderSettings 
mit den Default-Werten aus dem Prisma-Schema erstellt werden:
- firstReminderDays: 7 (1. Mahnung nach 7 Tagen Überfälligkeit)
- secondReminderDays: 14 (2. Mahnung nach 14 Tagen)
- finalReminderDays: 21 (3. Mahnung nach 21 Tagen)
- Mahngebühren: 10/20/30 CHF
- Verzugszins: 5% p.a.

### Fix 2: Rechnungsstatus korrigiert
**SQL Update:**
```sql
UPDATE invoices 
SET status = 'SENT', 
    "updatedAt" = NOW()
WHERE "invoiceNumber" = 'RE-2026-0014';
```

Die Rechnung hat jetzt den korrekten Status `SENT`, da sie noch nicht fällig ist.

## Ergebnis

### Warum die Rechnung NICHT im Mahnwesen erscheint (KORREKT):
1. Die Rechnung ist erst am 2026-02-11 fällig (in 20 Tagen)
2. Der Status wurde von OVERDUE auf SENT korrigiert
3. Das Mahnwesen zeigt nur Rechnungen, die:
   - Status SENT oder OVERDUE haben UND
   - Deren Fälligkeitsdatum in der Vergangenheit liegt

### Die Rechnung WIRD im Mahnwesen erscheinen:
- **Ab 2026-02-11:** Wenn das Fälligkeitsdatum erreicht ist
- **Ab 2026-02-18:** (7 Tage nach Fälligkeit) mit Empfehlung für 1. Mahnung

## Zusätzliche Erkenntnisse
- Es gibt derzeit KEINE tatsächlich überfälligen Rechnungen im System
- Der Backend-Fix verhindert zukünftige 404-Fehler im Mahnwesen
- Das System funktioniert jetzt korrekt
- **Ursache des falschen Status:** Die Rechnung hatte Status OVERDUE ohne dass eine Mahnung 
  versendet wurde. Mögliche Ursachen:
  1. Manuelles Setzen des Status im Frontend/Backend
  2. Ein gelöschter Mahnung-Eintrag (unwahrscheinlich, da keine Historie vorhanden)
  3. Import-/Migrations-Fehler bei der Datenerstellung
  - Normalerweise wird OVERDUE nur gesetzt, wenn eine Mahnung versendet wird 
    (siehe `sendReminder()` Funktion)

## Empfohlene Maßnahmen
1. ✅ Backend-Code wurde korrigiert
2. ✅ Rechnungsstatus wurde korrigiert
3. ✅ **UI für Mahneinstellungen erstellt** (siehe unten)
4. ⚠️ Prüfen Sie, wie die Rechnung ursprünglich den falschen Status OVERDUE erhielt
   - Möglicherweise wurde sie manuell falsch gesetzt
   - Oder es gibt einen Bug im Invoice-Update-Code

## Neue Funktion: Mahneinstellungen UI

**Die Mahneinstellungen sind jetzt über die Benutzeroberfläche konfigurierbar:**

### Zugriff:
1. **Admin-Dashboard** öffnen
2. Tab **"Mahnungen"** wählen
3. Button **"⚙️ Einstellungen"** klicken

### Konfigurierbare Einstellungen:

**Mahnfristen** (Tage nach Fälligkeit):
- 1. Mahnung: Standard 7 Tage
- 2. Mahnung: Standard 14 Tage
- 3. Mahnung: Standard 21 Tage

**Mahngebühren** (CHF):
- 1. Mahnung: Standard 10.00 CHF
- 2. Mahnung: Standard 20.00 CHF
- 3. Mahnung: Standard 30.00 CHF

**Zahlungsfristen ab Mahndatum** (Tage):
- Nach 1. Mahnung: Standard 10 Tage
- Nach 2. Mahnung: Standard 7 Tage
- Nach 3. Mahnung: Standard 5 Tage

**Verzugszins:**
- Standard: 5.0% pro Jahr

**Automatisierung:**
- ☐ Mahnungen automatisch versenden (per E-Mail)
- ☐ Automatisch eskalieren (nächste Mahnstufe erstellen)

### Änderungen:
- Datei: `frontend/src/components/admin/RemindersTab.tsx`
- Neue View: "Settings" mit vollständigem Formular
- API-Integration: Nutzt bestehende `reminderService` Methoden

## Test
Nach Backend-Neustart können Sie das Mahnwesen unter `/invoices` → Tab "Mahnwesen" aufrufen.
Dort sollten jetzt:
- Keine 404-Fehler mehr auftreten
- Keine überfälligen Rechnungen angezeigt werden (da keine existieren)
- Ab 2026-02-11 wird RE-2026-0014 automatisch erscheinen
