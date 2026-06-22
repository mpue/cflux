<img src="../web/logo.png" height="256px">

# Aquist IT-Abteilung – Tätigkeitsbericht Juni 2026
## Bericht an die Geschäftsleitung

**Berichtsdatum:** 12. Juni 2026
**Berichtszeitraum:** 24. Februar 2026 – 12. Juni 2026
**Autor:** Matthias Püski / Aquist GmbH Schweiz

---

## Management-Kurzfassung

Die IT-Abteilung hat im Berichtszeitraum auf zwei Ebenen gearbeitet:

**A) Eigenentwicklung cflux (ERP- und Zeiterfassungssystem)**
Ausbau um zwei neue Module (**Kalender** und **Kontaktverwaltung**), Erweiterung des **Onboarding-Prozesses** um Basis-Checklisten und automatischen ICS-Terminversand, Ausbau des EHS-/Incident-Managements sowie zahlreiche Plattform-Verbesserungen (systemweiter Dark Mode, Login-Schutz, Dokumenten-Konvertierung).

**B) IT-Infrastruktur & Betrieb**
Beginn der **Microsoft 365 Business Standard**-Einführung (zentralisierte Benutzerverwaltung, Outlook), **Aufarbeitung technischer Altlasten** (Rechnertausch, aktualisierte Geräteliste) und Erarbeitung eines **Standard-Software-Katalogs** für Aquist. Zudem wurde das **cflux-Deployment vereinfacht**; Anfang nächster Woche erhalten Test- und Produktiv-Instanz eine eigene Aquist-Domain, und der Zugriff wird künftig auf das interne Aquist-Netz beschränkt (Proxy-Lösung in Evaluierung).

Damit wurden sowohl die hauseigene Softwareplattform weiterentwickelt als auch die grundlegende IT-Infrastruktur modernisiert und vereinheitlicht.

---

# Teil A – Eigenentwicklung cflux

## A.1 Neue Module

### 📅 Kalender (NEU – Mai 2026)
**Status:** ✅ Produktiv

Vollständiges Kalender-Modul für Termine, Besprechungen, Erinnerungen und Aufgaben mit Team-Integration.

**Funktionen:**
- **Event-Typen:** Termin, Besprechung, Erinnerung, Aufgabe
- **Teilnehmer-Management** mit Status-Rückmeldung (Ausstehend / Zugesagt / Abgelehnt)
- **Monats- und Wochenansicht**
- **Drag & Drop und Resize** in der Wochenansicht (15-Minuten-Raster, nur eigene Termine)
- **Ganztägige und private Termine**, Orte, Beschreibungen, farbige Markierung
- **Kontextmenü** für schnelle Aktionen
- Vollständige Dark-Mode-Unterstützung

**Technisch:** Prisma-Modelle `CalendarEvent`/`CalendarEventAttendee` (Soft-Delete), REST API `/api/calendar`, Eintrag in der Hauptnavigation.

**Nutzen:** Zentrale Termin- und Besprechungsplanung im System, transparente Teilnehmer-Koordination, schnelle Umplanung per Drag & Drop.

---

### 📇 Kontaktverwaltung (NEU – Juni 2026)
**Status:** ✅ In finaler Abnahme

Zentrale Kontaktverwaltung mit Kontaktgruppen, granularer Sichtbarkeitssteuerung und automatischer Mitarbeiter-Synchronisation.

**Funktionen:**
- **Kontakte** mit umfangreichen Stammdaten (Firma, Position, E-Mail, Telefon, Mobil, Adresse, Kategorie, Notizen)
- **Kontaktgruppen** mit Name, Beschreibung und Farbe
- **Gruppenbasierte Sichtbarkeit:** Kontakte nur für freigegebene Benutzergruppen sichtbar; Admins sehen alles
- **Mitarbeiter-Synchronisation** (Mitarbeiter → Kontakt, eine Richtung, ohne Duplikate über `employeeId`)
- **Berechtigungen:** Lesen für alle (sichtbarkeitsgefiltert), Schreiben nur für Admins

**Technisch:** Prisma-Modelle `Contact`/`ContactGroup`, REST API `/api/contacts` inkl. `/groups` und `/sync-employees`, `ContactsTab` im Admin-Dashboard.

**Nutzen:** Zentrales Adressbuch für Kunden, Lieferanten, Partner und interne Kontakte; datenschutzgerechte Sichtbarkeit pro Abteilung; keine Doppelpflege.

---

## A.2 Onboarding – Erweiterungen (Juni 2026)

- **Basis-Checklisten für das Mitarbeiter-Onboarding erstellt:** standardisierte Aufgabenlisten als Grundlage für einen einheitlichen Einarbeitungsprozess.
- **Automatischer ICS-Terminversand:** basierend auf den in den Checklisten hinterlegten **Verantwortlichkeiten** werden automatisch Kalender-Einladungen (ICS) an die jeweils zuständigen Personen versendet – Termine landen direkt im Kalender der Verantwortlichen (z. B. Outlook).

**Nutzen:** Verbindlicher, nachvollziehbarer Onboarding-Ablauf; Verantwortliche werden ohne manuelle Terminpflege automatisch eingebunden.

---

## A.3 EHS / Incident-Management – Erweiterungen

- **Automatische Vorfallnummerierung** (April 2026): projektbezogenes Präfix, Neuvergabe bei Projektwechsel
- **Vorfall-Anhänge** (April 2026): Datei-Upload und -Verwaltung direkt am Vorfall
- **Neuer Workflow-Trigger „incident:comment"** (April 2026): Auslösung bei neuem Kommentar zu einem Vorfall
- **Neue Dashboard-Widgets** (Mai 2026): EHS-KPI-Widget und EHS-Pyramide (Verhältnis Beinaheunfälle/Unfälle)
- **UX-Verbesserungen** im Incident-Management (März 2026)

---

## A.4 Workflow-System

- **Condition-Node** (April 2026): Bedingungs-Knoten im node-basierten Workflow-Editor für verzweigte Prozesse (Wenn/Dann)
- Ergänzte Workflow-Trigger

---

## A.5 Dokumenten-Management – Gotenberg (März 2026)

- Serverseitige PDF-Konvertierung von Office-Dokumenten über **Gotenberg**
- Überarbeiteter Dokumenten-Import und PDF-Erzeugung im Intranet, PDF-Vorschau für Anhänge
- Bereitstellung als zusätzlicher Docker-Container

---

## A.6 Zeiterfassung

- **Automatisches Ausstempeln entfernt** (April 2026)
- **Überarbeitete Pausenlogik** und **partielle Zeitbuchungen** (März 2026)
- **Korrektur der UTC-Zeitkonvertierung** (April 2026)

---

## A.7 Sicherheit & Plattform

- **Login-Throttling** als Brute-Force-Schutz (März 2026)
- **Systemweiter Dark Mode** (Dashboard, Dokumentation, Kalender, gesamte UI; Mai/Juni 2026)
- **System-Statistik-Modul** mit Build-Versionierung (März 2026)
- Projekt-Filterung, verbesserte Benutzer-Sortierung, neue Dashboard-Elemente
- Backend-Refactoring und zusätzliche automatisierte Tests

---

# Teil B – IT-Infrastruktur & Betrieb

## B.1 Einführung Microsoft 365 Business Standard (laufend)
**Status:** 🟡 Rollout begonnen

- Beginn des unternehmensweiten Ausrollens von **Microsoft 365 Business Standard**
- Schwerpunkte:
  - **Outlook** als einheitliche E-Mail- und Kalender-Lösung
  - **Zentralisierte Benutzerverwaltung** über Microsoft 365 (einheitliche Identitäten/Konten)
- Schrittweise Migration der Arbeitsplätze

**Nutzen:** Einheitliche, gepflegte Kommunikations- und Office-Umgebung; zentrale Benutzer- und Lizenzverwaltung; Grundlage für weitere Integrationen.

---

## B.2 Aufarbeitung technischer Altlasten (laufend)
**Status:** 🟡 In Arbeit

- **Rechnertausch für 4 Benutzer** (Austausch veralteter Arbeitsplatzgeräte)
- **Geräteliste aktualisiert** und **Katalogisierung** des Hardware-Bestands
- Bereinigung und Dokumentation des bestehenden IT-Inventars

**Nutzen:** Aktueller, vollständiger Überblick über die Hardware-Ausstattung; reduzierte Ausfall- und Sicherheitsrisiken durch Ersatz veralteter Geräte.

---

## B.3 Standard-Software-Katalog für Aquist (laufend)
**Status:** 🟡 In Erarbeitung

- Erarbeitung eines **Standard-Software-Katalogs**: definierte, freigegebene Software für Arbeitsplätze
- Grundlage für einheitliche Ausstattung, Lizenzplanung und vereinfachte Beschaffung/Support

**Nutzen:** Standardisierte Arbeitsplätze, klare Vorgaben bei Neueinrichtungen, bessere Lizenz- und Kostenkontrolle.

---

## B.4 cflux Deployment & Betrieb (laufend)
**Status:** 🟡 In Umsetzung

- **Deployment vereinfacht:** Der Bereitstellungsprozess für cflux wurde verschlankt und damit Aufwand und Fehleranfälligkeit bei Updates reduziert.
- **Eigene Aquist-Domain (Anfang nächster Woche):** Die Test- und die Produktiv-Instanz von cflux erhalten eine richtige Aquist-Domain (statt provisorischer Adressierung).
- **Zugriffsbeschränkung auf das Aquist-Netz:** cflux soll für die interne Verwendung künftig nur noch von Aquist-Rechnern aus erreichbar sein. Geeignete **Proxy-Lösungen** werden derzeit evaluiert.

**Nutzen:** Professionelle, einheitliche Adressierung; einfachere und sicherere Updates; deutlich reduzierte Angriffsfläche durch Beschränkung des Zugriffs auf interne Geräte.

---

## Überblick

| Bereich | Thema | Monat | Status |
|--------|-------|-------|--------|
| cflux | Kalender-Modul (Termine, Teilnehmer, Drag & Drop) | Mai 2026 | ✅ Produktiv |
| cflux | Kontaktverwaltung (Gruppen-Sichtbarkeit, Mitarbeiter-Sync) | Juni 2026 | ✅ Abnahme |
| cflux | Onboarding-Basis-Checklisten | Juni 2026 | ✅ Produktiv |
| cflux | Automatischer ICS-Terminversand nach Verantwortlichkeit | Juni 2026 | ✅ Produktiv |
| cflux | EHS: Nummerierung, Anhänge, Comment-Trigger, KPI-/Pyramide-Widgets | April/Mai 2026 | ✅ Produktiv |
| cflux | Workflow Condition-Node | April 2026 | ✅ Produktiv |
| cflux | Gotenberg-PDF-Konvertierung | März 2026 | ✅ Produktiv |
| cflux | Zeiterfassung (Auto-Clock-Out entfernt, Pausen/UTC, Teilbuchungen) | März/April 2026 | ✅ Produktiv |
| cflux | Login-Throttling, systemweiter Dark Mode, System-Statistiken | März–Juni 2026 | ✅ Produktiv |
| Infrastruktur | Microsoft 365 Business Standard (Outlook, zentrale Benutzerverwaltung) | ab Juni 2026 | 🟡 Laufend |
| Infrastruktur | Aufarbeitung Altlasten (Rechnertausch 4 Benutzer, Geräteliste) | laufend | 🟡 Laufend |
| Infrastruktur | Standard-Software-Katalog für Aquist | laufend | 🟡 In Erarbeitung |
| Infrastruktur | cflux Deployment vereinfacht | Juni 2026 | ✅ Umgesetzt |
| Infrastruktur | Eigene Aquist-Domain für cflux (Test & Prod) | ab nächster Woche | 🟡 Geplant |
| Infrastruktur | cflux nur noch aus Aquist-Netz erreichbar (Proxy-Evaluierung) | laufend | 🟡 In Evaluierung |

---

**Erstellt am:** 12. Juni 2026
**Autor:** Matthias Püski / Aquist GmbH Schweiz
