# 🇨🇭 SWISS COMPLIANCE CHECKLIST für cflux

## **1. PFLICHTFELDER ZEITERFASSUNG** (Art. 73 ArGV 1)

### ✅ **Systematische Zeiterfassung** (Standard)
**Was muss erfasst werden:**
- [ ] **Personalien** der Mitarbeiter
- [ ] **Ein- und Austritt** (Datum)
- [ ] **Beginn und Ende** jeder Arbeitsphase (Uhrzeit)
- [ ] **Tägliche Arbeitszeit** (in Stunden)
- [ ] **Wöchentliche Arbeitszeit** (Summe)
- [ ] **Pausen** ab 30 Minuten (Beginn, Ende, Dauer)
- [ ] **Überstunden** (Differenz zur vertraglich vereinbarten Zeit)
- [ ] **Überzeit** (über gesetzliche Höchstarbeitszeit hinaus)
- [ ] **Wöchentliche Ruhetage** (falls nicht regelmäßig Sonntag)
- [ ] **Nacht- und Sonntagsarbeit** (separat kennzeichnen)
- [ ] **Projektzuordnung** (auf welches Projekt gebucht)

### ✅ **Vereinfachte Zeiterfassung** (Optional, Art. 73b ArGV 1)
**Voraussetzung:** Mitarbeiter kann >25% seiner Arbeitszeit selbst festlegen
**Was muss erfasst werden:**
- [ ] **Nur tägliche Arbeitszeit** (Tagessaldo)
- [ ] **Aber:** Nacht- und Sonntagsarbeit → auch Beginn/Ende

---

## **2. ARBEITSZEITLIMITS** (Art. 9 ArG)

### ✅ **Wöchentliche Höchstarbeitszeit**
- [ ] **45 Stunden/Woche** für:
  - Büropersonal
  - Technische Angestellte
  - Industriebetriebe
  - Verkaufspersonal in Großbetrieben (>50 MA)
  
- [ ] **50 Stunden/Woche** für:
  - Alle anderen Arbeitnehmer

### ✅ **Tägliche Limits**
- [ ] **Max. 12,5 Stunden** effektive Arbeitszeit/Tag (nach Abzug Pausen)
- [ ] **14 Stunden Zeitfenster** für Arbeitsbeginn bis -ende (inkl. Pausen)

### ✅ **Überzeit-Limits** (Art. 12 ArG)
- [ ] **Max. 170 Stunden/Jahr** bei 45h-Woche
- [ ] **Max. 140 Stunden/Jahr** bei 50h-Woche
- [ ] **Max. 2 Stunden/Tag** Überzeit (Ausnahme: Notfälle, arbeitsfreie Werktage)
- [ ] **Nur Tages- und Abendarbeit** (keine Nacht-Überzeit)

---

## **3. RUHEZEITEN & PAUSEN** (Art. 15-18 ArG)

### ✅ **Tägliche Ruhezeit**
- [ ] **Min. 11 Stunden** zwischen zwei Arbeitstagen
- [ ] **Ausnahme:** 1x/Woche auf 8h reduzierbar (im 2-Wochen-Schnitt 11h)

### ✅ **Wöchentliche Ruhezeit**
- [ ] **Min. 35 Stunden** zusammenhängend am Wochenende
  - = 11h täglich + 24h Sonntag

### ✅ **Pausen** (müssen erfasst werden ab 30 Min.)
- [ ] **Ab 5,5h Arbeit:** 15 Min. Pause
- [ ] **Ab 7h Arbeit:** 30 Min. Pause
- [ ] **Ab 9h Arbeit:** 60 Min. Pause (mind. 15 Min. am Stück)

---

## **4. ÜBERSTUNDEN & ÜBERZEIT**

### ✅ **Überstunden** (über Vertragsstunden, aber unter Höchstarbeitszeit)
- [ ] **Anzeige:** Differenz zur vertraglich vereinbarten Wochenzeit
- [ ] **Entschädigung:** 125% oder Freizeitausgleich 1:1
- [ ] **Optional:** Kann vertraglich wegbedungen werden

### ✅ **Überzeit** (über gesetzliche Höchstarbeitszeit)
- [ ] **Anzeige:** Separates Tracking
- [ ] **Zuschlag:** 25% obligatorisch (kann NICHT wegbedungen werden)
- [ ] **Ausnahme Büro-Angestellte:** Erste 60h/Jahr kein Zuschlag
- [ ] **Kompensation:** Freizeit 1:1 nur mit Zustimmung des Arbeitnehmers

### ✅ **Überstunden-Saldo**
- [ ] **Plus-Stunden** anzeigen
- [ ] **Minus-Stunden** anzeigen
- [ ] **Jahres-Übersicht**
- [ ] **Kompensationsmöglichkeiten** (Auszahlung vs. Freizeit)

---

## **5. FEIERTAGE SCHWEIZ** (kantonal unterschiedlich!)

### ✅ **Nationale Feiertage** (nur 1!)
- [ ] **1. August** (Bundesfeiertag) = einziger schweizweiter Feiertag

### ✅ **Kantonal unterschiedlich** (3-15 Feiertage je Kanton)
**Häufige Feiertage:**
- [ ] Neujahr (1.1.)
- [ ] Berchtoldstag (2.1.) - Zürich, Bern, etc.
- [ ] Heilige Drei Könige (6.1.) - Tessin, Graubünden, Uri, Schwyz
- [ ] Karfreitag (variabel)
- [ ] Ostermontag (variabel)
- [ ] Auffahrt/Christi Himmelfahrt (variabel)
- [ ] Pfingstmontag (variabel)
- [ ] Fronleichnam (variabel) - katholische Kantone
- [ ] Maria Himmelfahrt (15.8.) - katholische Kantone
- [ ] Allerheiligen (1.11.) - katholische Kantone
- [ ] Maria Empfängnis (8.12.) - katholische Kantone
- [ ] Weihnachten (25.12.)
- [ ] Stephanstag (26.12.)

**Implementation:**
- [ ] **Kanton-Auswahl** pro User/Firma
- [ ] **API-Integration:** https://feiertagskalender.ch/api
  - Alternative: https://date.nager.at/api/v3/publicholidays/{year}/CH
- [ ] **Automatische Reduktion** der Wochenarbeitszeit bei Feiertag
- [ ] **Feiertagsarbeit** separat kennzeichnen (Zuschlag 50%)

---

## **6. NACHT- & SONNTAGSARBEIT** (Art. 16-20 ArG)

### ✅ **Nachtarbeit** (23:00 - 6:00 Uhr)
- [ ] **Separat erfassen** (Beginn + Ende)
- [ ] **Max. 9h/Tag** Nachtarbeit
- [ ] **Zeitfenster max. 10h** (inkl. Pausen)
- [ ] **Zuschlag:** 25% für <25 Nächte/Jahr
- [ ] **Zeitzuschlag:** 10% Ausgleichsruhe bei ≥25 Nächten/Jahr
- [ ] **Medizinische Untersuchung** bei ≥25 Nächten/Jahr anbieten

### ✅ **Sonntagsarbeit**
- [ ] **Separat erfassen**
- [ ] **Zuschlag:** 50% bei vorübergehender Sonntagsarbeit
- [ ] **Ersatzruhe** innerhalb 2 Wochen

---

## **7. ABWESENHEITEN**

### ✅ **Urlaubsverwaltung**
- [ ] **Min. 4 Wochen/Jahr** (gesetzlich) = 20 Tage bei 5-Tage-Woche
- [ ] **5 Wochen für <20 Jahre** (bis 20. Geburtstag)
- [ ] **Urlaubskonto** pro User
- [ ] **Urlaubsanträge** (Genehmigungsprozess)
- [ ] **Resturlaub** Übertragung (max. 1 Jahr)

### ✅ **Krankheit & Abwesenheiten**
- [ ] **Krankheitstage** tracken
- [ ] **Persönliche Gründe** (OTHER)
- [ ] **Arzttermine**
- [ ] **Bezahlte Abwesenheiten** kennzeichnen

---

## **8. REPORTS & COMPLIANCE**

### ✅ **Pflicht-Reports**
- [ ] **Monatliche Arbeitszeit-Übersicht** pro User
- [ ] **Überstunden/Überzeit-Report**
- [ ] **Jahres-Arbeitszeit-Report**
- [ ] **Ruhezeiten-Violations** (weniger als 11h Pause)
- [ ] **Höchstarbeitszeit-Violations** (über 45h/50h/Woche)
- [ ] **Pausen-Violations** (fehlende Pausen)
- [ ] **Überzeit-Limit-Warning** (über 170h/140h Jahr)

### ✅ **Export für Behörden**
- [ ] **CSV/PDF Export** für Arbeitsinspektorat
- [ ] **5 Jahre Aufbewahrungspflicht** (Art. 46 ArG)
- [ ] **Einsichtsrecht** für Arbeitnehmer

---

## **9. WARNUNGEN & VALIDIERUNG**

### ✅ **Real-Time Warnings**
- [ ] **⚠️ Wöchentliche Höchstarbeitszeit** erreicht (45h/50h)
- [ ] **⚠️ Ruhezeit unterschritten** (<11h zwischen Tagen)
- [ ] **⚠️ Überzeit-Jahres-Limit** bald erreicht
- [ ] **⚠️ Fehlende Pause** (bei 5,5h/7h/9h Arbeit)
- [ ] **⚠️ Tägliche Höchstarbeitszeit** überschritten (12,5h)

### ✅ **Admin-Benachrichtigungen**
- [ ] **Compliance-Violations** Dashboard
- [ ] **User mit kritischen Werten** (zu viele Überstunden)
- [ ] **Monatliche Compliance-Reports**

---

## **10. DATENSCHUTZ** (DSG/DSGVO)

### ✅ **Pflichten**
- [ ] **Informationspflicht:** User über Datenverarbeitung informieren
- [ ] **Datensicherheit:** Verschlüsselung, Backups
- [ ] **Zugangskontrolle:** Nur berechtigte Personen (HR, Admin)
- [ ] **Auskunftsrecht:** User kann eigene Daten einsehen
- [ ] **Berichtigungsrecht:** User kann Korrekturen verlangen
- [ ] **Datenbearbeitungsreglement** erstellen

---

## **11. BEFREIUNGEN** (Art. 73a ArGV 1)

### ✅ **Verzicht auf Zeiterfassung möglich für:**
- [ ] **Leitende Angestellte** (Geschäftsleitung, oberes Management)
- [ ] **Handelsreisende** (überwiegend Außendienst)
- [ ] **Mit GAV:** Gehalt >120'000 CHF + große Autonomie
  - Schriftliche Vereinbarung notwendig
  - Option in cflux: "Zeiterfassung deaktiviert"

---

## **TECHNISCHE IMPLEMENTATION**

### **Datenmodell-Erweiterungen:**

```typescript
// Prisma Schema Ergänzungen

model User {
  // ... existing fields
  weeklyHours        Int      @default(45)  // 45 oder 50
  canton             String?  // ZH, BE, AG, etc.
  exemptFromTracking Boolean  @default(false)
}

model ComplianceSettings {
  id                  String   @id @default(uuid())
  companyId           String
  defaultWeeklyHours  Int      @default(45)
  defaultCanton       String   @default("ZH")
  overtimeLimit170    Boolean  @default(true)  // true=45h, false=50h
}

model ComplianceViolation {
  id              String   @id @default(uuid())
  userId          String
  type            String   // "REST_TIME", "MAX_HOURS", "MISSING_PAUSE", etc.
  date            DateTime
  description     String
  severity        String   // "WARNING", "CRITICAL"
  resolved        Boolean  @default(false)
}

model Holiday {
  id          String   @id @default(uuid())
  date        DateTime
  name        String
  canton      String   // "CH" for national, "ZH" for Zurich, etc.
  percentage  Float    @default(100)  // 100% = full day off
}

model OvertimeBalance {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  regularOvertime Float    @default(0)  // Überstunden
  extraTime       Float    @default(0)  // Überzeit
  year            Int
}
```

---

## **PRIORITY RANKING:**

### **🔴 MUST HAVE (kritisch für Compliance):**
1. Wöchentliche Höchstarbeitszeit (45h/50h) mit Warnungen
2. Ruhezeiten-Tracking (11h zwischen Tagen)
3. Pausen-Erfassung und Validierung
4. Überstunden vs. Überzeit Unterscheidung
5. Kantonsbasierte Feiertage
6. 5-Jahres Archivierung

### **🟡 SHOULD HAVE (wichtig, aber nicht kritisch):**
7. Überzeit-Jahres-Limit (170h/140h)
8. Nacht-/Sonntagsarbeit Tracking
9. Compliance-Violations Dashboard
10. Automatische Reports

### **🟢 NICE TO HAVE:**
11. Predictive Warnings ("Sie erreichen bald...")
12. Mobile Benachrichtigungen bei Violations
13. Kanton-Switcher für Multi-Standort-Firmen

---

## **QUELLEN & REFERENZEN**

- **Arbeitsgesetz (ArG):** https://www.fedlex.admin.ch/eli/cc/1966/57_57_57/de
- **Verordnung 1 zum Arbeitsgesetz (ArGV 1):** https://www.fedlex.admin.ch/eli/cc/1966/321_321_321/de
- **SECO Arbeits- und Ruhezeiten:** https://www.seco.admin.ch/seco/de/home/Arbeit/Arbeitsbedingungen/Arbeitnehmerschutz/Arbeits-und-Ruhezeiten.html
- **Feiertage API:** https://feiertagskalender.ch/api/documentation_d/liste.php
- **Alternative API:** https://date.nager.at/api/v3/publicholidays/{year}/CH

---

## **IMPLEMENTATION TIMELINE**

### **Phase 1 (23.12 - 27.12):** Grundlagen
- [ ] Prisma Schema erweitern
- [ ] Wöchentliche Höchstarbeitszeit Validierung
- [ ] Ruhezeiten-Tracking

### **Phase 2 (28.12 - 31.12):** Feiertage & Pausen
- [ ] Feiertags-API Integration
- [ ] Kanton-Auswahl
- [ ] Pausen-Validierung

### **Phase 3 (01.01 - 03.01):** Überstunden & Reports
- [ ] Überstunden vs. Überzeit Logik
- [ ] Überstunden-Saldo
- [ ] Compliance Reports

### **Phase 4 (04.01 - 05.01):** Testing & Polish
- [ ] End-to-End Tests
- [ ] UI/UX Polish
- [ ] Demo-Daten vorbereiten

**Ziel:** Live-Demo bereit für 7./8. Januar! 🚀

---

**Erstellt am:** 17.12.2025
**Für:** cflux - Moderne Zeiterfassung
**Status:** In Bearbeitung
