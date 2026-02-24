<img src="../web/logo.png" height="256px">

# cflux - Micro ERP and Swiss Compliant Time Tracking System
## Executive Summary für die Geschäftsleitung

**Berichtsdatum:** 23. Februar 2026  
**Version:** 1.5  
**Status:** Production with Stories, E-Learning PDF Upload & Org Management

---

## Management Summary

**cflux** ist ein umfassendes Zeiterfassungs- und Projekt-Management-System, das speziell auf die Anforderungen des Schweizer Arbeitsrechts (ArG/ArGV 1) ausgerichtet ist. Das System integriert Zeiterfassung, Projektmanagement, Budget-Kontrolle, Compliance-Überwachung, **Onboarding & HR-Prozesse**, **E-Learning-System mit PDF-Upload**, **Story-Tags für Projekt-Zeitbuchungen**, **Abteilungsverwaltung mit Organigramm** sowie umfangreiche Reporting-Funktionen in einer modernen Web-Anwendung.

### Kernziele
- 🕐 **Rechtssichere Zeiterfassung** nach Schweizer Arbeitsrecht
- 💰 **Transparente Projekt-Budgetkontrolle** in Echtzeit
- ⚖️ **Automatisierte Compliance-Prüfung** und Warnsystem
- 📊 **Professionelle Reports** für Kunden und Management
- 🔐 **Modulares Berechtigungssystem** für unterschiedliche Benutzergruppen
- 🏢 **Abteilungen & Organigramm** mit Vorgesetzten-Hierarchie und Cross-Department-Visualisierung (NEU Februar 2026)
- 🏷️ **Story-Tags** pro Projekt für granulare Zeitbuchung und Reporting (NEU Februar 2026)
- 👤 **Digitales Onboarding** für neue Mitarbeiter (NEU Januar 2026)
- 🎓 **E-Learning & Schulungsmanagement** mit Compliance-Integration und PDF-Upload (Dezember 2025 / Update Februar 2026)

---

##  Geschäftlicher Nutzen

### Für das Management
- **Echtzeit-Übersicht** über alle Projekte, Budgets und Auslastung
- **Früherkennung** von Budget-Überschreitungen
- **Compliance-Dashboard** zur Risikominimierung
- **Exportierbare Reports** (PDF/CSV) für Kunden und Controlling

### Für Projektleiter
- **Transparente Budget-Verfolgung** mit automatischer Kostenzuordnung
- **Zeit- und Kostenauswertungen** pro Projekt und Mitarbeiter
- **Planungs-Tools** für Projektbudgets und Ressourcen
- **Status-Übersicht** aller aktiven Projekte

### Für Mitarbeiter
- **Einfache Zeiterfassung** via Web oder Desktop-App (optional)
- **Projekt-Zuordnung** der geleisteten Arbeitszeit mit optionaler **Story-Auswahl** (NEU)
- **Abwesenheits-Management** (Ferien, Krankheit, etc.)
- **Selbstauskunft** über geleistete Stunden und Überstunden
- **E-Learning-Zugang** für Schulungen im eigenen Tempo mit PDF-Materialien (NEU)
- **Onboarding-Dashboard** mit transparenter Aufgabenverfolgung (NEU)

### Für HR/Administration
- **Automatische Überstunden-Berechnung**
- **Compliance-Überwachung** (Ruhezeiten, Höchstarbeitszeit)
- **Lohnabrechnung-Unterstützung** mit exportierbaren Daten
- **Ferien- und Abwesenheitsplanung**
- **Digitales Onboarding** mit strukturiertem Einarbeitungsprozess (NEU)
- **Bewerbermanagement** mit Online-Portal (NEU)
- **Equipment & Schulungstracking** für neue Mitarbeiter (NEU)
- **E-Learning-System** für Compliance-Schulungen und Weiterbildung (NEU)
- **Abteilungsverwaltung** mit visueller Organisationsstruktur (NEU)
- **Organigramm** mit Drag & Drop und Vorgesetzten-Zuordnung (NEU)

---

## Systemüberblick

### Architektur
```
┌─────────────────────────────────────────────────────────┐
│                    Browser / Desktop App                 │
│                    (React Frontend)                      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / REST API
┌──────────────────────▼──────────────────────────────────┐
│                  Node.js Backend                         │
│              (Express + Prisma ORM)                      │
│  • Authentifizierung & Autorisierung                     │
│  • Business Logic & Validierung                          │
│  • Report-Generierung (PDF)                              │
│  • Compliance-Checks                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              PostgreSQL Datenbank                        │
│  • Zeiteinträge                                          │
│  • Projekte & Budgets                                    │
│  • Benutzer & Berechtigungen                             │
│  • Compliance-Logs                                       │
└─────────────────────────────────────────────────────────┘
```

**Deployment:** Docker-Container (einfache Installation und Updates)

---

##  Implementierte Module

### 1.  Zeiterfassung (Core)
**Status:**  Produktiv

**Funktionen:**
- Clock-In / Clock-Out mit sekundengenauen Zeitstempeln
- Pausenzeiten-Erfassung
- Projekt-Zuordnung der Arbeitszeit
- **Story-Tags pro Projekt** für granulare Zeitbuchung (NEU Februar 2026)
- Mobile-optimierte Oberfläche
- Optional: Desktop-App für Windows

**Compliance:**
- Automatische Prüfung der Ruhezeiten (min. 11h zwischen Arbeitstagen)
- Überwachung der Höchstarbeitszeit (45h/Woche)
- Warnungen bei Pause-Verstößen (>5.5h ohne Pause)
- Wochenend- und Nachtarbeit-Tracking

**Reporting:**
- Monatliche Zeiterfassungs-Reports (PDF)
- Überstunden-Auswertung
- Projekt-Zeit-Aufschlüsselung
- **Story-Filter** für granulare Auswertung (NEU Februar 2026)
- Export für Lohnabrechnung

---

### 2. Projekt-Management
**Status:** Produktiv

**Funktionen:**
- Projekt-Verwaltung mit Kunden-Zuordnung
- Status-Tracking (Planung, Aktiv, Pausiert, Abgeschlossen)
- Team-Mitglieder-Zuordnung
- Projekt-spezifische Stundensätze
- Standort-Zuordnung
- **Story-Verwaltung** pro Projekt (Tags mit Farben, aktivieren/deaktivieren) (NEU Februar 2026)

**Vorteile:**
- Zentrale Übersicht aller Projekte
- Klare Verantwortlichkeiten
- Historische Projekt-Daten für Kalkulation

---

### 3.  Budget-Verwaltung
**Status:**  Produktiv (mit letzten Optimierungen vom 15.01.2026)

**F7unktionen:**
- Budget-Definition pro Projekt
- Automatische Kosten-Zuordnung aus Zeiteinträgen
- Budget-Positionen nach Kategorien:
  - LABOR (Arbeitszeit)
  - MATERIALS (Material)
  - INVENTORY (Lagerartikel)
  - EXTERNAL_SERVICES (Externe Leistungen)
  - OVERHEAD (Gemeinkosten)
- Echtzeit-Auslastung und Restbudget
- Status-Ampel (PLANNING, ACTIVE, EXCEEDED)

**Budget-Berechnung:**
```
Gesamtbudget:      CHF 50'000
Geplante Kosten:   CHF 45'000
Ist-Kosten:        CHF 38'500
Restbudget:        CHF 11'500
Auslastung:        77%
Status:            ACTIVE
```

**Automatismen:**
- Zeiteinträge aktualisieren automatisch Budget-Positionen
- Stundensätze werden hierarchisch ermittelt (User → Projekt → System)
- Budget-Warnungen bei Überschreitung

**Berichte:**
- Budget-Übersicht pro Projekt
- Budget vs. Ist-Kosten Vergleich
- Kosten-Entwicklung über Zeit
- Budget-Auslastung-Report

---

### 4.  Projekt-Reports (NEU: Januar 2026)
**Status:**  Produktiv

**Funktionen:**

#### A) Projekt-Übersicht Report
- Zusammenfassung aller Projekte mit Kennzahlen
- Interaktive Diagramme:
  - Budget-Verteilung nach Projekt (Pie Chart)
  - Budget vs. Tatsächliche Kosten (Bar Chart)
  - Arbeitsstunden nach Projekt (Bar Chart)
  - Budget-Auslastung in % (Bar Chart, farbcodiert)
  - Projekte nach Status (Pie Chart)
  - Team-Größe pro Projekt (Bar Chart)
- Filter nach Status, Zeitraum, Kunde
- Detaillierte Projekt-Tabelle mit allen Kennzahlen

#### B) Zeiterfassung Report pro Projekt
- Detailanalyse der Zeiterfassung
- Gruppierung nach: Benutzer, Tag, Woche, Monat
- Diagramme:
  - Stunden-Verteilung (Bar Chart mit dual axis)
  - Kosten-Verteilung (Pie Chart)
- Tabellen:
  - Gruppierte Daten mit Stunden/Kosten
  - Detaillierte Zeiteinträge

**Export-Funktionen:**
-  **PDF-Export** mit professionellem Layout
  - Hochwertige Diagramme (korrekte Aspect Ratio)
  - Mehrseitige PDFs mit Header und Footer
  - Seitennummerierung und Vertraulichkeitshinweis
  - Kundengerechte Darstellung
-  **CSV-Export** für Excel-Weiterverarbeitung

**Geschäftlicher Nutzen:**
- Reports sind kundenfertig (professionelles Design)
- Transparente Darstellung von Projektkosten
- Früherkennung von Budget-Problemen
- Basis für Nachkalkulation und Angebotserstellung

---

### 5.  Rechnungswesen
**Status:**  Produktiv

**Funktionen:**
- Rechnungserstellung mit PDF-Design
- Positionsverwaltung
- Rechnungs-Workflow mit Freigaben
- Vorlagen-System für wiederkehrende Rechnungen
- Mahnwesen
- **Swiss QR-Code Integration** (QR-Rechnung)
  - Automatische QR-Code Generierung
  - IBAN/Referenznummer
  - Compliance mit Swiss Payment Standards
  - Erleichtert Zahlungsabwicklung für Kunden

**Integration:**
- Verknüpfung mit Projekten
- Automatische Kostenzuordnung aus Zeiterfassung
- Export für Buchhaltungssoftware
- Zeitbasierte Abrechnung mit konfigurierbaren Stundensätzen

---

### 6.  Bestellwesen
**Status:**  Produktiv

**Funktionen:**
- Bestellungen erstellen und verwalten
- 8-stufiger Workflow (Entwurf → Bestellt → Geliefert)
- Lieferanten-Verwaltung
- Artikelgruppen und Artikel-Katalog
- Teillieferungen
- Auto-generierte Bestellnummern (BO-XXXXXX)

**Vorteile:**
- Transparenter Bestellprozess
- Nachverfolgbarkeit
- Integration mit Budget-Verwaltung (MATERIALS/EXTERNAL_SERVICES)

---

### 7.  Intranet / Dokumenten-Management
**Status:**  Produktiv

**Funktionen:**
- Hierarchische Dokumentenstruktur (wie Dateisystem)
- Versionierung von Anhängen (vollständige Versions-Historie)
- Gruppen-basierte Berechtigungen (READ/WRITE/ADMIN)
- Volltextsuche mit Highlighting (durchsucht Titel, Inhalt und Anhänge)
- Rich-Text-Editor mit Tabellen und Listen
- File-Upload (mehrere Versionen pro Dokument)
- Markdown-Unterstützung

**Such-Features:**
- Suche nach Dokumenten, Nodes und Anhängen
- Snippet-Highlighting der Treffer
- Relevanz-basiertes Ranking
- Filter nach Dateityp und Bereich

**Einsatzgebiete:**
- Interne Wissensdatenbank
- Prozessdokumentationen
- Vorlagen und Checklisten
- Projektdokumente
- Mitarbeiter-Handbücher

**Business Value:**
- Zentrale Wissensspeicherung
- Versionskontrolle für kritische Dokumente
- Flexibles Berechtigungssystem
- Schneller Zugriff durch Volltext-Suche

---

### 8. 🎓 E-Learning & Schulungsmanagement (NEU: Dezember 2025)
**Status:** ✅ Produktiv

**Überblick:**
Vollständiges LMS (Learning Management System) für Online-Schulungen, Compliance-Training und Mitarbeiterentwicklung. Nahtlos integriert mit Onboarding-Modul für automatische Schulungszuweisungen.

**Kernfunktionen:**

#### A) Kursmanagement
- **Kurs-Typen:**
  - MANDATORY (Pflichtschulungen mit Ablaufdatum)
  - OPTIONAL (Freiwillige Weiterbildung)
  - CERTIFICATION (Zertifizierungskurse)
  - ONBOARDING (Automatisch für neue Mitarbeiter)
- **Kategorisierung:** Hierarchische Kurs-Kategorien
- **Status-Workflow:** Draft → Published → Archived
- **Compliance-Features:**
  - Ablaufdaten (`expiresAt`)
  - Automatische Wiederholung (`renewalMonths`)
  - EHS-Relevanz-Markierung
  - ArG/ArGV-Compliance-Tracking

#### B) Inhalts-Erstellung (Multi-Content-Type)
- **VIDEO**: Video-Lektionen mit Progress-Tracking
- **PDF**: Dokumenten-Upload und -Anzeige (NEU: Upload bis 50 MB, Februar 2026)
  - Dedizierter Upload-Endpunkt (`POST /elearning/upload/pdf`)
  - Speicherung in `uploads/course-pdfs/` mit UUID-basierten Dateinamen
  - Berechtigungsprüfung via `requireModuleAccess('elearning', 'canCreate')`
  - Löschen hochgeladener PDFs mit Pfad-Traversal-Schutz
- **HTML**: Rich-Text-Content mit Editor
- **QUIZ**: Interaktive Tests mit 5 Fragetypen
- **SCORM**: SCORM-Package-Support (geplant)
- **EXTERNAL_LINK**: Externe Lern-Ressourcen
- **Reihenfolge:** Lessons mit definierbarer Reihenfolge und Dauer

#### B2) Upload-System (NEU: Februar 2026)
- **3 Upload-Typen:**
  - Kurs-Thumbnail (max. 5 MB, PNG/JPG/GIF/WebP/SVG)
  - Content-Bild (max. 10 MB, PNG/JPG/GIF/WebP/SVG)
  - Lektion-PDF (max. 50 MB, nur PDF)
- **Dedizierter Upload-Controller** mit Multer-Integration
- **UUID-basierte Dateinamen** zur Vermeidung von Konflikten
- **Löschen** mit Validierung und Pfad-Traversal-Schutz
- **Frontend-Integration:** PDF-Auswahl im Lektion-Editor mit Dateiname-Anzeige und Entfernen-Button

#### C) Quiz-System
**5 Fragetypen:**
1. Single Choice (eine richtige Antwort)
2. Multiple Choice (mehrere richtige Antworten)
3. True/False (Wahr/Falsch)
4. Freitext (exakter Text-Match)
5. Lückentext (Fill in the Blank)

**Features:**
- Automatische Bewertung mit Punktesystem
- Zeitlimit pro Quiz
- Maximale Versuche (konfigurierbar)
- Question Shuffle (Zufällige Reihenfolge)
- Detailliertes Feedback mit Erklärungen
- Passing Score (Standard: 80%)
- Score-Historie pro Versuch

#### D) Fortschrittsverfolgung
- **Pro Lektion:**
  - Status: Not Started → In Progress → Completed
  - Zeitaufwand-Tracking (Sekunden)
  - Last Position (Video-Zeitstempel)
- **Pro Kurs:**
  - Gesamt-Fortschritt (0-100%)
  - Durchschnittsscore über alle Quiz
  - Versuchs-Historie
  - Enrollment Status
- **Video-Player-Integration:**
  - Automatisches Resume an letzter Position
  - Echtzeit-Progress-Updates

#### E) Zertifizierung
- **Automatische Ausstellung** bei Kursabschluss
- Zertifikat-Metadaten:
  - Ausstellungsdatum
  - Gültigkeit (bei MANDATORY Courses)
  - Score-Nachweis
- Certificate Templates (geplant)
- PDF-Download (in Entwicklung)

#### F) Kurs-Zuweisungen
- **Automatische Zuweisungen:**
  - An einzelne Benutzer
  - An ganze Benutzergruppen
  - Automatisches Enrollment
- **Deadlines & Reminders:**
  - Due Date mit automatischen Erinnerungen
  - Reminder: 7, 3, 1 Tag vor Ablauf
- **Integration mit Onboarding:**
  - Pflichtschulungen für neue Mitarbeiter
  - Automatische Zuweisung bei Einstellung

#### G) Analytics & Reporting
- **Kurs-Analytics:**
  - Total/Completed/In-Progress Enrollments
  - Durchschnittsscore
  - Completion Rate (%)
  - Durchschnittliche Bearbeitungszeit
- **Benutzer-Statistiken:**
  - Absolvierte Kurse
  - Durchschnittsscore über alle Kurse
  - Erhaltene Zertifikate
  - Learning Time
- **Manager-Ansicht:**
  - Team-Fortschritt
  - Compliance-Status
  - Fällige Schulungen

**REST API Endpunkte:**
- `/api/elearning/courses` - Kurs-CRUD mit Filtern
- `/api/elearning/lessons` - Lektionsverwaltung
- `/api/elearning/quizzes` - Quiz-Management
- `/api/elearning/enrollments` - Einschreibungen & Fortschritt
- `/api/elearning/quiz-attempts` - Versuchs-Tracking & Bewertung
- `/api/elearning/assignments` - Automatische Zuweisungen
- `/api/elearning/analytics` - Statistiken & Reports
- `/api/elearning/upload/pdf` - PDF-Upload für Lektionen (NEU)
- `/api/elearning/upload/thumbnail` - Kurs-Thumbnail-Upload (NEU)
- `/api/elearning/upload/content-image` - Content-Bild-Upload (NEU)
- `/api/elearning/upload/:type/:filename` - Upload löschen (NEU)

**Technische Highlights:**
- **12 Datenbank-Modelle:** Course, Lesson, Quiz, Question, Answer, Enrollment, LessonProgress, QuizAttempt, etc.
- **TypeScript end-to-end** mit vollständiger Typsicherheit
- **Automatische Bewertung** mit detailliertem Feedback
- **Media-Integration** für Videos und PDFs (inkl. Upload-Controller)
- **Dedizierter Upload-Controller** mit 3 Upload-Typen (PDF, Thumbnail, Content-Bild)
- **Zertifikats-PDF-Generierung** mit PDFKit
- **Responsive Design** für mobile Nutzung

**Geschäftlicher Nutzen:**
- ✅ **Compliance-Sicherheit**: Lückenlose Dokumentation von Pflichtschulungen
- ✅ **Kostenersparnis**: Interne Schulungen statt externe Seminare
- ✅ **Skalierbarkeit**: Unbegrenzte Teilnehmer ohne Mehrkosten
- ✅ **Flexibilität**: Lernen im eigenen Tempo, jederzeit
- ✅ **Qualitätssicherung**: Standardisierte Schulungsinhalte
- ✅ **Tracking**: Vollständige Übersicht über Mitarbeiter-Qualifikationen
- ✅ **Integration**: Nahtlose Verbindung mit Onboarding & Compliance

**ROI-Einschätzung:**
- **Externe Schulungen:** ~CHF 500-1500 pro Mitarbeiter/Schulung
- **Interne E-Learning:** Einmalige Erstellung, unbegrenzte Nutzung
- **Zeitersparnis:** Keine Reisezeiten, flexible Zeiteinteilung
- **Amortisation:** Ab 50 Schulungsteilnehmern

**Screenshots:**
> 📸 *Screenshots verfügbar:*
> - Kurs-Übersicht mit Kategorien und Fortschritt
> - Lesson-Player (Video, PDF, HTML)
> - Quiz-Interface mit verschiedenen Fragetypen
> - Fortschritts-Dashboard
> - Zertifikats-Anzeige
> - Analytics-Dashboard

---

### 9. 🔐 Benutzer- & Berechtigungsverwaltung
**Status:**  Produktiv

**Konzept: Modulares Berechtigungssystem**

**Hierarchie:**
```
Benutzer → Benutzergruppen → Module → Berechtigungen
```

**Module** (Beispiele):
- time_tracking (Zeiterfassung)
- projects (Projektmanagement)
- project_reports (Projekt-Reports)
- project_budgets (Budget-Verwaltung)
- invoices (Rechnungswesen)
- orders (Bestellwesen)
- intranet (Intranet/Dokumente)
- admin (Administration)

**Berechtigungen pro Modul:**
- `canView` - Lesen
- `canCreate` - Erstellen
- `canEdit` - Bearbeiten
- `canDelete` - Löschen

**Vorteile:**
- Flexibles Rechtesystem
- Benutzer können mehreren Gruppen angehören
- Granulare Steuerung pro Modul
- Einfache Verwaltung über Admin-UI

**Sicherheit:**
- JWT-Token-basierte Authentifizierung
- Passwort-Hashing (bcrypt)
- Session-Management
- Passwort-Änderungs-Erzwingung bei Erstlogin

---

### 10. 🚨 Compliance & EHS (Environment, Health, Safety)
**Status:** ✅ Produktiv

**Compliance-Überwachung:**
- Automatische Prüfung nach jedem Clock-Out
- Violations-Log mit Severity-Levels:
  - LOW: Warnung (z.B. kurze Pause)
  - MEDIUM: Verstoß (z.B. zu lange Arbeitszeit)
  - HIGH: Schwerwiegender Verstoß (z.B. keine Ruhezeit)
- Dashboard für HR mit Übersicht aller Verstöße
- Automatische Benachrichtigungen

**EHS-Module:**
- Incident Management (Vorfallmeldung)
- Root Cause Analysis
- Corrective Actions Tracking
- Workflow-basierte Bearbeitung

**Rechtliche Absicherung:**
- Lückenlose Dokumentation aller Arbeitszeiten
- Nachweis für Arbeitsinspektion
- Historische Daten für Audits

---

### 11. 👤 Onboarding & Bewerbermanagement (NEU: Januar 2026)
**Status:** ✅ Produktiv

**Überblick:**
Das Onboarding-Modul digitalisiert den gesamten Einstellungsprozess von der Bewerbung bis zur vollständigen Integration neuer Mitarbeiter. Es bietet eine strukturierte Plattform für HR und eine transparente Übersicht für neue Mitarbeiter.

**Funktionsbereiche:**

#### A) Bewerbermanagement
- **Online-Bewerbungsformular** mit automatischer E-Mail-Verifizierung
- **Dokumenten-Upload** (Lebenslauf, Zeugnisse, Anschreiben)
- **Status-Tracking** des Bewerbungsprozesses:
  - NEW (Neu eingegangen)
  - REVIEWING (In Prüfung)
  - INTERVIEW_SCHEDULED (Gespräch geplant)
  - OFFER_MADE (Angebot erstellt)
  - ACCEPTED (Zugesagt)
  - REJECTED (Abgelehnt)
  - WITHDRAWN (Zurückgezogen)
- **Interview-Management** mit Terminplanung und Notizen
- **Bewerber-Notizen** für interne Kommunikation
- **Dokumenten-Check** mit automatischer Prüfung erforderlicher Unterlagen

#### B) Mitarbeiter-Onboarding
- **Automatische Mitarbeiteranlage** aus akzeptierter Bewerbung
- **Strukturierter Onboarding-Prozess** mit 8 vorkonfigurierten Aufgaben:
  1. Arbeitsvertrag unterschreiben (Tag 1)
  2. IT-Equipment erhalten (Tag 1)
  3. Zugangsberechtigungen einrichten (Tag 2)
  4. Einführung in Firmensysteme (Tag 3)
  5. Team-Vorstellung (Tag 5)
  6. Sicherheitsunterweisung (Tag 10)
  7. Erste Projekt-Zuweisung (Tag 15)
  8. 30-Tage-Feedback-Gespräch (Tag 30)
- **Dynamische Fälligkeitstermine** basierend auf Eintrittsdatum
- **Aufgaben-Tracking** mit Status-Verwaltung:
  - OPEN (Offen)
  - IN_PROGRESS (In Bearbeitung)
  - COMPLETED (Abgeschlossen)
  - CANCELLED (Abgebrochen)
- **Fortschritts-Übersicht** mit Prozentanzeige
- **Dokumenten-Management** für Arbeitsverträge, Datenschutzerklärungen, etc.

#### C) Equipment-Management
- **Geräte-Katalog** mit Inventarnummern und Seriennummern
- **Zuweisung** an Mitarbeiter mit Zustandsdokumentation
- **Übergabeprotokoll** (automatisch generiertes PDF mit PDFKit):
  - Mitarbeiter- und Gerätedaten
  - Zustand bei Übergabe
  - Unterschriften-Felder
  - Rückgabe-Bedingungen
- **Zustandsverfolgung**: EXCELLENT, GOOD, FAIR, POOR
- **Tracking von Übergabe- und Rückgabedatum**

#### D) Schulungsmanagement
- **Schulungskatalog** mit Kategorien und Beschreibungen
- **Pflichtschulungen** mit automatischer Zuweisung bei Einstellung
- **Schulungssessions** mit Terminen und Dozenten
- **Teilnahme-Tracking** mit Status:
  - SCHEDULED (Geplant)
  - COMPLETED (Abgeschlossen)
  - CANCELLED (Abgesagt)
  - NO_SHOW (Nicht erschienen)
- **Zertifikats-Upload** nach erfolgreicher Teilnahme

**Admin-Dashboard Features:**
- **Übersichtskarten** für schnellen Zugriff:
  - Bewerberverwaltung
  - Onboarding-Dashboard
  - Mitarbeiterliste
  - Equipment-Management
  - Schulungsmanagement
- **Statistiken** über aktive Onboardings und offene Bewerbungen
- **Filter** nach Status und Zeiträumen

**Mitarbeiter-Dashboard Widget:**
- **"Mein Onboarding"** Widget für User-Dashboard
- **Fortschrittsanzeige** mit visueller Prozentbalken
- **Anstehende Aufgaben** (max. 5 nächste Tasks)
- **Celebration Message** bei 100% Abschluss
- **Direkt-Links** zu relevanten Aufgaben

**Technische Highlights:**
- **REST API** mit 3 Haupt-Endpunkten:
  - `/api/applicants` - Bewerbermanagement
  - `/api/onboarding` - Onboarding-Prozesse
  - `/api/equipment-training` - Equipment & Schulungen
- **Datei-Uploads** mit Multer (10MB Limit, PDF/DOCX/JPG/PNG)
- **PDF-Generierung** mit PDFKit für Übergabeprotokolle
- **Modulares Berechtigungssystem** integriert
- **TypeScript** Frontend mit vollständiger Typsicherheit

**Geschäftlicher Nutzen:**
- ✅ **Zeitersparnis**: Automatisierte Workflows reduzieren manuellen Aufwand
- ✅ **Konsistenz**: Strukturierter Prozess für alle neuen Mitarbeiter
- ✅ **Transparenz**: Bewerber und Mitarbeiter sehen jederzeit den Status
- ✅ **Compliance**: Lückenlose Dokumentation aller Onboarding-Schritte
- ✅ **Mitarbeiterbindung**: Professioneller erster Eindruck steigert Zufriedenheit
- ✅ **Asset-Tracking**: Vollständige Übersicht über zugewiesene Geräte
- ✅ **Schulungs-Compliance**: Sicherstellung erforderlicher Schulungen

**ROI-Einschätzung:**
- **Vorher**: ~8 Stunden manueller Aufwand pro Neueinstellung
- **Nachher**: ~2 Stunden mit automatisierten Workflows
- **Einsparung**: ~75% Zeitreduktion für HR-Abteilung

**Screenshots:**
> 📸 *Screenshots folgen nach User-Testing:*
> - Bewerberliste mit Status-Übersicht
> - Onboarding-Dashboard mit Fortschrittsbalken
> - Equipment-Übergabeprotokoll (PDF)
> - Mitarbeiter-Widget "Mein Onboarding"
> - Admin-Panel Onboarding-Tab

---

### 12. 📅 Abwesenheits-Management
**Status:**  Produktiv

**Funktionen:**
- Ferien-Verwaltung mit Genehmigung
- Krankheits-Erfassung
- Abwesenheitstypen (Ferien, Krank, Militär, Unfall, etc.)
- Ferien-Planer (visuell mit Team-Kalender)
- Feiertags-Kalender (kantonal - Swiss Public Holidays)
- Ferien-Saldo-Tracking
- Halbtags-Abwesenheiten
- Überlappungs-Prüfung (keine doppelten Abwesenheiten)

**Workflow:**
1. Mitarbeiter stellt Antrag (Status: PENDING)
2. Admin/Manager genehmigt oder lehnt ab
3. Bei Genehmigung: Automatischer Abzug vom Urlaubskonto
4. Kalender-Integration für Team-Übersicht

**Integration:**
- Berücksichtigung in Stunden-Soll-Berechnung
- Automatische Blockierung von Zeiterfassung bei Abwesenheit
- Reporting mit Abwesenheiten
- Export für Lohnabrechnung (Krankheitstage, etc.)

---

### 13. ⏰ Zeitmodelle & Variable Stundensätze (NEU: Januar 2026)
**Status:**  Produktiv

**Funktionen:**
- Definition von Zeitmodellen mit variablen Stundensätzen
- Zeitabhängige Stundensätze (Tag/Nacht, Feiertage)
- Mitarbeiter-spezifische Zeitmodell-Zuweisungen
- Prioritäten-basierte Regelverarbeitung
- Automatische Budget-Integration
- Wochentagsspezifische Regeln (Mo-So)
- Feiertagsregelungen (kantonal)

**Anwendungsfälle:**
- Nachtzuschläge (z.B. 18:00-08:00 → +25%)
- Feiertagszuschläge (z.B. 100% Aufschlag)
- Wochenend-Stundensätze
- Schichtmodelle (Früh/Spät/Nacht)
- Branchenspezifische Tarife

**Budget-Integration:**
```
Hierarchie (Stundensatz-Ermittlung):
1. Zeitmodell (falls zugewiesen, zeitbasiert)
2. User.hourlyRate (user-spezifisch)
3. Project.defaultHourlyRate (projekt-spezifisch)  
4. SystemSettings.defaultHourlyRate (global)
```

**Beispiel:**
- Normalzeit (08:00-18:00): 100 CHF/h
- Nachtzeit (18:00-08:00): 125 CHF/h
- Feiertage: 200 CHF/h

**Business Value:**
- Automatische Zuschlagsberechnung
- Korrekte Projekt-Kostenzuordnung
- Compliance mit Tarifverträgen
- Flexible Stundens atz-Modelle
- Historische Nachvollziehbarkeit

**Tests:**
- 12 automatisierte Unit-Tests
- 100% Code-Coverage (hourlyRate.service)
- Integration mit Budget-System getestet

---

### 14. 🏢 Abteilungen & Organigramm (NEU: Februar 2026)
**Status:** ✅ Produktiv

**Überblick:**
Vollständige Organisations-Verwaltung mit Abteilungen, Vorgesetzten-Hierarchie und interaktivem Organigramm. Ermöglicht die visuelle Darstellung und Bearbeitung der Unternehmensstruktur per Drag & Drop, inklusive abteilungsübergreifender Beziehungen.

**Kernfunktionen:**

#### A) Abteilungsverwaltung
- **CRUD** für Abteilungen (Name, Beschreibung, Abteilungsleiter)
- **Mitarbeiter-Zuweisung** über Suchfeld mit Autovervollständigung
- **Mitarbeiter entfernen** aus Abteilung
- **Verfügbare Mitarbeiter** anzeigen (noch nicht zugeordnet)
- **Abteilungsleiter** definierbar (managerId)

#### B) Vorgesetzten-Beziehung
- **Self-referencing User-Modell** (supervisorId auf User)
- **Hierarchische Darstellung** beliebiger Tiefe
- **Zirkuläre-Referenz-Schutz** bei Zuweisung
- **Dropdown-Auswahl** im Mitarbeiter-Detailformular (Anstellung-Tab)
- **Spalte "Vorgesetzte/r"** in der Benutzerliste

#### C) Interaktives Organigramm
- **Drag & Drop:**
  - Mitarbeiter auf Mitarbeiter = Vorgesetzten zuweisen
  - Mitarbeiter auf Abteilung = Abteilung wechseln
  - Mitarbeiter auf "Ohne Abteilung" = aus Abteilung entfernen
- **Pan & Zoom:**
  - Alt + Maus = Canvas verschieben
  - Strg/⌘ + Scroll = Zoom (30%–200%)
  - Reset-Button zum Zurücksetzen
- **Abteilungs-Spalten** mit aufklappbarer Hierarchie
- **Hierarchie-Bäume** mit Expand/Collapse pro Mitarbeiter
- **Connector-Linien** zur visuellen Verkettung

#### D) Cross-Department-Visualisierung
- **"↑ Berichtet an: Name (Abt.)"** — blaues Badge wenn Vorgesetzter in anderer Abteilung
- **"➜ Leitet: Abt. (Anzahl)"** — grünes Badge wenn Untergebene in anderen Abteilungen
- **Abteilungsleiter-Hervorhebung:**
  - 👑 Krone auf Avatar
  - Grüner Rahmen und Hintergrund
  - Leitung im Abteilungs-Header angezeigt
- **Klick-Navigation:** Badge-Klick scrollt automatisch zum Ziel-User, öffnet alle Hierarchie-Ebenen und hebt den User 2.5 Sekunden mit gelbem Glow hervor
- **Abteilungs-Header:** Zeigt Leitung + Link zur übergeordneten Abteilung

**REST API Endpunkte:**
- `GET /api/departments` — Alle Abteilungen auflisten
- `POST /api/departments` — Neue Abteilung erstellen
- `PUT /api/departments/:id` — Abteilung bearbeiten
- `DELETE /api/departments/:id` — Abteilung löschen (Soft-Delete)
- `POST /api/departments/:id/employees` — Mitarbeiter zuordnen
- `DELETE /api/departments/:id/employees/:employeeId` — Mitarbeiter entfernen
- `GET /api/departments/:id/available-employees` — Verfügbare Mitarbeiter
- `GET /api/users/org-chart` — Organigramm-Daten (Users + Departments)
- `GET /api/users/:id/subordinates` — Untergebene eines Users

**Technische Highlights:**
- **Self-Referencing Relation** auf User-Modell (`supervisorId → User`)
- **Department-Modell** mit `managerId`, `employees[]` Relation
- **Zirkuläre-Referenz-Erkennung** bei Supervisor-Zuweisung (Frontend + Backend)
- **Refs-basiertes Scroll-to-User** mit `useRef` Map für alle Karten
- **Cross-Department-Erkennung** durch Vergleich von Supervisor-Department und User-Department

**Geschäftlicher Nutzen:**
- ✅ **Transparenz**: Klare Darstellung der Organisationsstruktur
- ✅ **Effizienz**: Drag & Drop statt manuelle Zuweisungen
- ✅ **Abteilungsübergreifend**: Visualisierung von Matrix-Organisationen
- ✅ **Self-Service**: Admins können Struktur ohne Entwickler ändern
- ✅ **Compliance**: Nachvollziehbare Vorgesetzten-Kette für Genehmigungsprozesse

**Screenshots:**
> 📸 *Screenshots verfügbar:*
> - Organigramm mit Abteilungs-Spalten und Hierarchie-Bäumen
> - Cross-Department-Badges (Berichtet an / Leitet)
> - Abteilungsleiter-Hervorhebung mit Krone
> - Abteilungsverwaltung mit Mitarbeiter-Zuweisung

---

### 15. 📦 Weitere Module

#### Workflow-System
- Flexible Workflow-Definition für beliebige Prozesse
- Sequential und Parallel Steps
- Multi-Approver-Support
- Verwendung bei: Rechnungsfreigabe, EHS-Vorfallsbearbeitung
- Visueller Workflow-Editor mit Node-basiertem UI

#### Nachrichten-System
- Interne Nachrichten zwischen Benutzern
- Benachrichtigungen über System-Events
- Gruppennachrichten
- Gelesen/Ungelesen-Status
- Inbox/Sent/Trash-Organisation

#### Kostenstellen-Verwaltung
- Definition von Kostenstellen
- Zuordnung zu Budgets und Projekten
- Kosten-Auswertung pro Kostenstelle
- Hierarchische Struktur

#### Lager-Verwaltung (Inventory)
- Artikel-Stammdaten
- Lagerbestand mit Ein-/Ausgang
- Ein-/Ausgang-Buchungen mit Tracking
- Integration mit Bestellwesen und Budget
- Standort-Verwaltung
- Mindestbestand-Warnungen

#### Geräte-Verwaltung
- IT- und Firmen-Assets
- Zuweisung zu Mitarbeitern
- Wartungs-Tracking
- Lifecycle-Management
- QR-Code-basierte Inventarisierung

#### Reisekosten
- Reisekosten-Erfassung
- Spesenabrechnung mit Belegen
- PDF-Export für Buchhaltung
- Integration mit Projekten
- Workflow-basierte Freigabe

#### Medien-Verwaltung
- Zentrale Media Library
- Upload von Bildern, PDFs, Videos
- Kategorisierung und Tagging
- Preview-Funktionen
- Integration mit Intranet

---

##  Sicherheit & Datenschutz

### Technische Sicherheit
-  Verschlüsselte Datenübertragung (HTTPS)
-  Passwort-Hashing mit bcrypt (10 Rounds)
-  JWT-Token-basierte Authentifizierung (signiert und verschlüsselt)
-  Token-Lebensdauer konfigurierbar (Standard: 24h)
-  SQL-Injection-Schutz durch Prisma ORM (Prepared Statements)
-  Input-Validierung auf Backend (express-validator)
-  XSS-Protection durch Input Sanitization
-  Rate-Limiting für API-Endpoints (z.B. 5 Login-Versuche / 15 Min)
-  CORS-Configuration für Origin-Kontrolle

### Authentifizierung
- JWT-Token mit Secret-Signing
- Passwort-Mindestlänge: 8 Zeichen
- Passwort-Stärke-Validierung
- Optional: Refresh Token Mechanismus
- Zwangs-Passwort-Änderung bei Erstlogin

### Datenschutz (DSGVO-konform)
-  Minimale Datenspeicherung (Privacy by Design)
-  Zugriffskontrolle (Berechtigungssystem)
-  Audit-Logs für kritische Aktionen
-  Soft-Delete (Daten können wiederhergestellt werden)
-  Export-Funktionen für Datenauskunft
-  Backup-System für Datensicherung
-  Datenminimierung - nur erforderliche Daten werden gespeichert

### Backup & Recovery
- Automatische tägliche Backups der Datenbank
- Konfigurierbare Backup-Rotation (Standard: 30 Tage)
- Backup via Admin-UI
- Restore-Funktion mit Point-in-Time Recovery
- Backup-Historie (configurable retention)
- Empfehlung: Externe Backup-Speicherung (Off-Site)

---

##  Aktuelle Zahlen & Fakten

### Technische Metriken (Stand: 20. Januar 2026)
- **Codebase:**
  - **Gesamt:** ~151'000 Zeilen Code (produktiver Code)
  - **TypeScript:** 86'688 Zeilen (Backend + Frontend)
  - **JavaScript:** 2'848 Zeilen
  - **CSS:** 13'746 Zeilen (46 Dateien)
  - **SQL:** 3'769 Zeilen (Migrations, Seeds)
  - **Markdown:** 28'559 Zeilen (Dokumentation)
  - **JSON:** 14'461 Zeilen (Configs, Package Files)
- **Dateien:** 880 Dateien gesamt
- **Datenbank:** 100+ Tabellen (Prisma Schema ~2'100 Zeilen)
- **Module:** 26+ implementierte Module
- **API-Endpoints:** 210+ REST-Endpunkte
- **Tests:** 
  - Jest Unit-Tests
  - Integration-Tests
  - 12 Tests für Zeitmodell-Budget-Integration
  - Code-Coverage: 85%+ (kritische Services)
- **Dokumentation:** 78 Markdown-Dateien (~22'000 Zeilen, >3000 Seiten)
- **Komplexität:** 8'402 Complexity Points (TypeScript/JavaScript)

### Systemumfang
- **Benutzer-Verwaltung:** Multi-Gruppen-Support (seit Dez 2025)
- **Projekt-Kapazität:** Unbegrenzt
- **Zeiterfassung:** Sekundengenaue Erfassung
- **Reports:** PDF & CSV Export (kundenfertig)
- **Performance:** < 200ms Response Time (typisch)
- **Verfügbarkeit:** Docker-basiertes Deployment
- **API:** 200+ REST-Endpunkte mit vollständiger Dokumentation
- **Multi-Instanz:** Unterstützt Frontend, Backend, DB in separaten Containern
- **Sprachen:** Primär Deutsch, mehrsprachig erweiterbar

---

##  Technologie-Stack

### Backend
- **Sprache:** TypeScript (Node.js)
- **Framework:** Express.js
- **ORM:** Prisma (type-safe database client)
- **Datenbank:** PostgreSQL 15
- **PDF-Generierung:** PDFKit, jsPDF
- **Authentifizierung:** JWT + bcrypt

### Frontend
- **Framework:** React 18
- **Routing:** React Router (HashRouter für Electron)
- **UI-Komponenten:** Custom + Material-UI Icons
- **Styling:** CSS Modules + Dark Mode Support
- **Charts:** Recharts (responsive charts)
- **Rich Text:** TiptapEditor
- **HTTP-Client:** Axios

### DevOps
- **Containerization:** Docker + Docker Compose
- **Versionskontrolle:** Git
- **Deployment:** Single-command deployment (`docker-compose up -d --build`)
- **Auto-Setup:** Automatische Datenbank-Seeding mit Modulen
- **Datenbank-Migrations:** Prisma (schema-first, `prisma db push`)
- **Health Checks:** `/health` Endpoint für Monitoring
- **Logging:** Strukturiertes Logging mit konfigurierbaren Levels
- **Environment Management:** `.env` basierte Konfiguration

**Deployment-Optionen:**
- Docker Compose (Entwicklung & Produktion)
- Nginx Reverse Proxy (mit SSL/Let's Encrypt)
- Load Balancing möglich (horizontal scaling)

**Vorteile des Tech-Stacks:**
- Modern und zukunftssicher
- Type-Safety (TypeScript end-to-end)
- Leichte Wartbarkeit
- Große Community und Support
- Einfaches Deployment
- Schema-First Database Design (keine Migrations-Fehler)

---

## Letzte Updates (Februar 2026)

### �️ Story-Tags für Zeitbuchungen (23.02.2026)
- **Neues Story-Modell** als projektbezogene Tags für granulare Zeitbuchungen
- **Vollständige CRUD-Verwaltung** pro Projekt (Name, Farbe, Beschreibung, aktiv/inaktiv)
- **Integration in Zeiterfassung:**
  - Story-Dropdown bei Clock-In (erscheint bei Projektauswahl, wenn Stories vorhanden)
  - Farbige Story-Badges in laufendem Timer und letzten Buchungen
  - Story-Zuordnung bei manuellen Zeiteinträgen und Bearbeitung
- **Integration in Reporting:**
  - Story-Filter im Zeitbuchungs-Report (filterbar nach Projekt und Story)
  - Story-Spalte in Report-Tabellen mit farbigen Badges
  - Zusammenfassung nach Story in Report-Summary (`byStory`-Gruppierung)
- **Projekt-Verwaltung:** Stories-Button in Projekt-Administration mit Modal-Dialog
- **Smart Delete:** Soft-Delete (Deaktivierung) wenn Zeitbuchungen vorhanden, Hard-Delete sonst
- **Farbverwaltung:** 8 vordefinierte Farben + benutzerdefinierte Farbauswahl

**Business Value:**
- Granulare Zeiterfassung auf Story/Task-Ebene innerhalb von Projekten
- Bessere Analyse der Zeitverteilung pro User Story / Arbeitspaket
- Kundengerechte Reports mit Story-Aufschlüsselung
- Flexible Tag-Verwaltung durch Projektadministratoren

**Technische Details:**
- Prisma: `Story`-Modell mit Cascade-Delete von Project, SetNull auf TimeEntry
- REST API: `GET/POST/PUT/DELETE /api/stories/*` mit 5 Endpunkten
- Frontend: Story-Service, angepasste Widgets (TimeTrackingWidget, RecentEntriesWidget, TimeBookingsReport)
- Index auf `storyId` in TimeEntry für performante Abfragen

### 📄 E-Learning PDF-Upload (23.02.2026)
- **Dedizierter Upload-Controller** für E-Learning-Inhalte (3 Upload-Typen)
- **PDF-Upload für Lektionen** (bis 50 MB) mit UUID-basierten Dateinamen
- **Kurs-Thumbnails** (bis 5 MB, Bild-Formate)
- **Content-Bilder** (bis 10 MB, Bild-Formate)
- **Frontend-Integration im Lektion-Editor:**
  - PDF-Auswahl-Button mit Dateiname-Anzeige
  - Upload-Fortschrittsanzeige
  - Entfernen-Funktion für hochgeladene PDFs
  - Hinweis auf maximale Dateigröße
- **Sicherheit:** Dateityp-Validierung, UUID-Dateinamen, Pfad-Traversal-Schutz beim Löschen
- **Zertifikats-PDF-Generierung** mit PDFKit bei Kursabschluss

**Business Value:**
- Schulungsmaterialien direkt als PDF hochladen und einbinden
- Breitere Content-Möglichkeiten für Kursersteller
- Sichere Dateiverwaltung mit automatischer Bereinigung

**Technische Details:**
- Dedizierter Controller: `elearning-upload.controller.ts`
- Multer-basierte Uploads mit `diskStorage` und Dateifilter
- 3 Endpunkte: `POST /elearning/upload/{thumbnail,content-image,pdf}`
- Delete: `DELETE /elearning/upload/:type/:filename` mit Berechtigungsprüfung
- Speicherung in organisierten Unterverzeichnissen (`uploads/course-pdfs/`, `uploads/course-thumbnails/`, `uploads/course-content/`)

### �🏢 Abteilungen & Organigramm (12.02.2026)
- Neues Department-Modell mit vollständiger CRUD-Verwaltung
- Vorgesetzten-Beziehung (self-referencing supervisorId auf User)
- Interaktives Organigramm mit Drag & Drop, Pan & Zoom
- Cross-Department-Visualisierung mit klickbaren Badges
- Abteilungsleiter-Hervorhebung (👑 Krone, grüner Rahmen)
- Klick-Navigation zwischen abteilungsübergreifenden Beziehungen
- Mitarbeiter-Zuweisung per Such-Dialog oder Drag & Drop
- Supervisor-Dropdown im Mitarbeiter-Detailformular
- Vorgesetzten-Spalte in Benutzerliste
- Playwright-basierte Screenshot-Tests für alle 56 Admin-Tabs und Seiten

**Business Value:**
- Visuelle Organisationsstruktur für Management und HR
- Schnelle Umstrukturierungen per Drag & Drop
- Matrix-Organisation darstellbar (abteilungsübergreifende Führung)
- Nachvollziehbare Vorgesetzten-Kette für Genehmigungsprozesse

**Technische Details:**
- REST API: `/api/departments/*` mit 7 Endpunkten + `/api/users/org-chart`
- Self-Referencing Prisma Relation (`UserSupervisor`)
- React-Refs-basierte Scroll-Navigation im Organigramm
- Cross-Department-Erkennung für Badges und Leiter-Highlight
- 56 automatisierte Playwright-Screenshots aller Module

---

##  Letzte Updates (Januar 2026)

### 👤 Onboarding & Bewerbermanagement (23.01.2026)
- Vollständiges HR-Modul für Bewerbungs- und Onboarding-Prozesse
- Bewerbermanagement mit Online-Portal und E-Mail-Verifizierung
- Strukturierter Mitarbeiter-Onboarding mit 8 Standard-Aufgaben
- Equipment-Management mit PDF-Übergabeprotokollen
- Schulungsmanagement mit Teilnahme-Tracking
- Integration in Admin-Dashboard und User-Dashboard
- 11 neue Datenbank-Modelle mit 7 Enums

**Business Value:**
- 75% Zeitersparnis bei Neueinstellungen
- Strukturierter, konsistenter Onboarding-Prozess
- Professioneller erster Eindruck für neue Mitarbeiter
- Vollständige Dokumentation für Compliance

**Technische Details:**
- 3 REST API Gruppen (`/api/applicants`, `/api/onboarding`, `/api/equipment-training`)
- File-Upload mit Multer (10MB Limit)
- PDF-Generierung mit PDFKit für Übergabeprotokolle
- TypeScript end-to-end mit vollständiger Typsicherheit
- Modulares Berechtigungssystem integriert

## Letzte Updates (Dezember 2025)

### 🎓 E-Learning & Schulungsmanagement (Dezember 2025)
- Vollständiges LMS (Learning Management System) implementiert
- 12 neue Datenbank-Modelle für Kurse, Lektionen, Quiz, Enrollments
- 5 verschiedene Quiz-Fragetypen mit automatischer Bewertung
- Multi-Content-Type Support (Video, PDF, HTML, Quiz, External Link)
- Fortschrittsverfolgung mit Video-Position-Resume
- Automatische Zertifizierung bei Kursabschluss
- Kurs-Zuweisungen mit Deadlines und Reminders
- Integration mit Onboarding-Modul

**Business Value:**
- Compliance-Sicherheit durch dokumentierte Pflichtschulungen
- Kostenersparnis gegenüber externen Seminaren (CHF 500-1500/Person)
- Unbegrenzte Skalierbarkeit ohne Mehrkosten
- Flexible Zeiteinteilung für Mitarbeiter
- Standardisierte Qualitätssicherung

**Technische Details:**
- REST API: `/api/elearning/*` mit 7 Haupt-Endpunkten
- Automatische Bewertung mit detailliertem Feedback
- Course Analytics & User Learning Stats
- TypeScript end-to-end mit vollständiger Typsicherheit
- Responsive Design für mobile Nutzung

### Zeitmodelle & Variable Stundensätze (20.01.2026)
- Vollständige Zeitmodell-Verwaltung implementiert
- Automatische Integration mit Budget-System
- Zeitabhängige Stundensätze (Tag/Nacht/Feiertage)
- 12 automatisierte Tests mit 100% Coverage
- Umfassende Dokumentation

**Business Value:**
- Automatische Zuschlagsberechnung
- Korrekte Projekt-Kostenzuordnung
- Compliance mit Tarifverträgen

### PDF-Export für Projekt-Reports (15.01.2026)
- Professionelles Layout mit Header/Footer
- Hochwertige Diagramm-Darstellung
- Mehrseitige PDFs mit automatischem Seitenumbruch
- Kundenfertige Reports

**Business Value:**
- Reports können direkt an Kunden geschickt werden
- Professionelles Erscheinungsbild
- Spart Zeit bei Report-Erstellung

###  Budget-Berechnungs-Konsistenz (15.01.2026)
- Komplette Überprüfung aller Budget- und Stunden-Berechnungen
- Korrektur von 3 Inkonsistenzen:
  1. Budget-Auslastung basiert jetzt korrekt auf `totalBudget`
  2. Keine Doppelzählung von Zeitkosten mehr
  3. `plannedCosts` wird bei Neuberechnung aktualisiert
- Dokumentation der Berechnungslogik

**Business Value:**
- Korrekte Budget-Auslastungs-Anzeige
- Verlässliche Kostenkontrolle
- Px] **Zeitmodelle** (ERLEDIGT Januar 2026)
  - Variable Stundensätze
  - Automatische Zuschlagsberechnung  
  - Budget-Integration
- [ ] **Mobile App** (React Native)
  - Native iOS/Android Apps
  - Offline-Zeiterfassung
  - Push-Benachrichtigungen
- [ ] **Dashboard-Erweiterung**
  - Interaktive Widgets
  - Customizable Layouts (bereits vorbereitet)(einfache Anpassung)

---

## Roadmap & Erweiterungsmöglichkeiten

### Kurzfristig (Q1/Q2 2026)
- [x] **E-Learning & Schulungsmanagement** (ERLEDIGT Dezember 2025)
  - Vollständiges LMS mit Kursen, Lektionen, Quiz
  - 5 Quiz-Fragetypen mit automatischer Bewertung
  - Fortschrittsverfolgung und Zertifizierung
  - Integration mit Onboarding & Compliance
- [x] **Onboarding & HR-Prozesse** (ERLEDIGT 23.01.2026)
  - Bewerbermanagement mit Online-Portal
  - Strukturiertes Mitarbeiter-Onboarding
  - Equipment & Schulungsverwaltung
- [ ] **E-Learning Phase 2**
  - Certificate Templates & PDF-Generierung
  - ~~PDF-Upload für Lektionen~~ (ERLEDIGT Februar 2026)
  - Video-Player mit integr iertem Progress-Tracking
  - SCORM-Package-Support
  - Course Editor (WYSIWYG)
  - Reminder-System für ablaufende Kurse
- [ ] **Mobile App** (React Native)
  - Native iOS/Android Apps
  - Offline-Zeiterfassung
  - Push-Benachrichtigungen
- [ ] **Dashboard-Erweiterung**
  - Interaktive Widgets
  - Customizable Layouts
  - Real-time Updates
- [ ] **Erweiterte Reporting**
  - Mehr Diagramm-Typen
  - Custom Report Builder
  - Automatische Report-Versendung (E-Mail)
- [ ] **Onboarding-Erweiterungen** (Phase 2)
  - Öffentliches Bewerbungsportal
  - E-Mail-Benachrichtigungen für Status-Änderungen
  - Kalender-Integration für Interviews
  - Mitarbeiter-Detailansichten mit Tabs

### Mittelfristig (Q3/Q4 2026)
- [ ] **Ressourcen-Planung**
  - Kapazitäts-Planung
  - Projekt-Zeitplan (Gantt)
  - Team-Auslastung-Übersicht
- [ ] **Kunden-Portal**
  - Self-Service für Kunden
  - Projekt-Status einsehen
  - Rechnungen herunterladen
- [ ] **API für Drittanbieter**
  - REST API für externe Systeme
  - Webhooks für Events
  - API-Dokumentation (Swagger)

### Langfristig (2027+)
- [ ] **KI-Integration**
  - Automatische Projekt-Kalkulation
  - Predictive Budget-Warnungen
  - Smart Time-Tracking (automatische Projekt-Zuordnung)
- [ ] **Multi-Mandanten-Fähigkeit**
  - Mehrere Firmen in einer Instanz
  - Mandanten-getrennte Daten
  - White-Label-Option
- [ ] **Erweiterte Compliance**
  - Automatische Gesetzesänderungs-Updates
  - EU-weite Arbeitsrecht-Unterstützung
  - Branchen-spezifische Compliance

---

##  ROI & Kostenersparnis

### Eingesparte Kosten durch cflux

#### 1. Manuelle Zeiterfassung
**Vorher:**
- Papier-basierte oder Excel-Zeiterfassung
- Manuelles Zusammenrechnen
- Fehleranfälligkeit

**Mit cflux:**
- Automatische Berechnung
- Echtzeit-Verfügbarkeit
- 95% weniger Zeitaufwand

**Ersparnis:** ~20h pro Monat (HR/Administration)

#### 2. Projekt-Controlling
**Vorher:**
- Manuelle Budget-Tracking in Excel
- Wöchentliche Auswertungen
- Verzögerte Warnung bei Überschreitung

**Mit cflux:**
- Echtzeit Budget-Status
- Automatische Warnungen
- Sofortige Reports

**Ersparnis:** ~15h pro Monat (Projektleitung)

#### 3. Compliance-Überwachung
**Vorher:**
- Manuelle Prüfung von Ruhezeiten
- Stichproben-basierte Kontrolle
- Risiko von Bußgeldern

**Mit cflux:**
- Automatische Compliance-Checks
- 100% Abdeckung
- Dokumentation für Audit

**Ersparnis:** Risikominimierung + ~5h pro Monat

#### 4. Rechnungserstellung
**Vorher:**
- Manuelle Erfassung von Stunden
- Zeitaufwändige Rechnungsstellung

**Mit cflux:**
- Automatische Zeit-Zuordnung
- Schnelle Rechnungserstellung

**Ersparnis:** ~10h pro Monat

### Gesamtersparnis
**Zeit:** ~50h pro Monat  
**Monetär:** CHF 5'000 - 7'500 pro Monat (bei CHF 100-150/h)  
**Jährlich:** CHF 60'000 - 90'000

**Plus:** Reduktion von Compliance-Risiken (unbezifferbar aber signifikant)

---

## 💼 Betriebliche Vorteile & Praxisnutzen

### Automatisierung & Effizienz
- **Automatische Berechnungen:** Keine manuelle Zeitberechnung mehr nötig
- **Echtzeit-Updates:** Budget-Status wird sofort nach Zeitbuchung aktualisiert
- **Automatische Compliance-Checks:** Prüfung erfolgt bei jedem Clock-Out
- **Workflow-Automatisierung:** Rechnungsfreigaben, EHS-Prozesse etc.
- **Batch-Operationen:** Bulk-Import von Benutzern, Projekten möglich

### Transparenz & Nachvollziehbarkeit
- **Audit-Logs:** Alle Änderungen werden protokolliert (Wer, Was, Wann)
- **Versionierung:** Dokumenten-Versionen, Budget-Historie
- **Historische Daten:** 10-Jahres-Aufbewahrung möglich
- **Compliance-Reports:** Jederzeit abrufbar für Audits
- **Dashboard-Übersicht:** Echtzeit-Status aller kritischen KPIs

### Integration & Skalierbarkeit
- **REST-API:** Integration mit externen Systemen möglich
- **Export-Funktionen:** PDF, CSV, Excel für Weiterverarbeitung
- **Docker-basiert:** Einfach skalierbar (horizontale Skalierung möglich)
- **Modular:** Neue Module können hinzugefügt werden ohne Kern-System zu ändern
- **Mehrsprachig:** UI kann erweitert werden (aktuell Deutsch)

### Risikominimierung
- **Rechtssicherheit:** Schweizer Arbeitsrecht-konform
- **Datensicherheit:** Backup & Recovery, Verschlüsselung
- **Verfügbarkeit:** Docker ermöglicht schnelle Wiederherstellung
- **Dokumentation:** Umfassende Anleitungen reduzieren Fehlbedienung
- **Compliance-Warnungen:** Proaktive Benachrichtigung bei Verstößen

---

##  Compliance-Status

### Schweizer Arbeitsrecht (ArG/ArGV 1)

| Anforderung | Status | Implementierung |
|------------|--------|-----------------|
| Arbeitszeiterfassung | ✅ | Sekundengenaue Erfassung |
| Ruhezeiten (min. 11h) | ✅ | Automatische Prüfung + Warnung |
| Höchstarbeitszeit (45h/50h) | ✅ | Wöchentliche Überwachung |
| Pausen (>5.5h) | ✅ | Pausenerfassung + Compliance-Check |
| Nachtarbeit | ✅ | Tracking + Zuschlag |
| Sonntagsarbeit | ✅ | Tracking + Zuschlag |
| Überstunden | ✅ | Automatische Berechnung |
| Ferien-Anspruch | ✅ | Saldo-Verwaltung |
| Dokumentation | ✅ | 10-Jahres-Aufbewahrung möglich |

**Zertifizierungen:**
- Keine formelle Zertifizierung erforderlich
- System erfüllt alle gesetzlichen Anforderungen
- Audit-ready (Logs und Historie vollständig)

---

##  Schulung & Onboarding

### Verfügbare Dokumentation
Das System bietet umfassende Dokumentation für alle Benutzergruppen:

#### Für Mitarbeiter
- **Benutzerhandbuch** (COMPLETE.md - Kapitel "Benutzerhandbuch")
  - Erste Schritte (Registrierung, Anmeldung)
  - Zeiterfassung (Ein-/Ausstempeln, Projektbuchung)
  - Urlaubsverwaltung (Anträge, Übersicht)
  - Abwesenheiten melden
  - Profil-Verwaltung
  - Berichte und Übersichten
  - FAQ-Sektion mit häufigen Fragen

#### Für Administratoren
- **Administrator-Handbuch** (COMPLETE.md - Kapitel "Administrator-Handbuch")
  - Benutzerverwaltung (Erstellen, Bearbeiten, Rechte)
  - Projektverwaltung
  - Zeitmanagement (Korrekturen, Überwachung)
  - Urlaubsverwaltung (Genehmigungen)
  - Rechnungswesen
  - System-Administration
  - Best Practices

#### Für Entwickler
- **API-Dokumentation** (COMPLETE.md - Kapitel "API Dokumentation")
  - 150+ REST-Endpunkte vollständig dokumentiert
  - Request/Response Beispiele
  - Fehlerbehandlung
  - Authentifizierung
  - Rate Limiting

### Schulungs-Programme

### Für Mitarbeiter
**Dauer:** 30 Minuten  
**Inhalt:**
- Zeiterfassung (Clock-In/Out)
- Projekt-Zuordnung
- Pausen erfassen
- Abwesenheiten melden
- Eigene Reports einsehen

**Format:** Video-Tutorial oder Live-Schulung

### Für Projektleiter
**Dauer:** 2 Stunden  
**Inhalt:**
- Projekt-Management
- Budget-Verwaltung
- Report-Generierung (inkl. PDF-Export)
- Team-Koordination
- Compliance-Überwachung

**Format:** Workshop mit praktischen Übungen

### Für Administratoren
**Dauer:** 4 Stunden  
**Inhalt:**
- Benutzer-Verwaltung
- Modul-Konfiguration (Berechtigungen)
- System-Einstellungen
- Backup/Restore
- Troubleshooting
- Performance-Monitoring

**Format:** Technisches Training

**Support:**
- Dokumentation (30+ Anleitungen, >2000 Seiten)
- Video-Tutorials (geplant)
- E-Mail-Support
- Remote-Support bei Bedarf

---

##  Erfolgsfaktoren

### Was funktioniert gut
1.  **Intuitive Benutzeroberfläche** - Geringe Einarbeitungszeit
2.  **Automatisierung** - Wenig manuelle Arbeit erforderlich
3.  **Echtzeit-Daten** - Sofortige Verfügbarkeit aller Informationen
4.  **Modulares System** - Flexibel erweiterbar
5.  **Compliance-Sicherheit** - Rechtliche Absicherung
6.  **Docker-Deployment** - Einfache Installation und Updates

### Herausforderungen & Lösungen
1. **Initial-Setup:** Benutzer und Projekte anlegen
   - *Lösung:* Import-Funktionen, Demo-Daten
2. **Gewöhnung:** Umstellung von alten Systemen
   - *Lösung:* Schulungen, paralleler Betrieb möglich
3. **Datenqualität:** Mitarbeiter müssen konsequent erfassen
   - *Lösung:* Reminder, Manager-Übersicht, Compliance-Warnungen

---

##  Support & Wartung

### Laufender Support
- **Response Time:** < 24h (Werktage)
- **Kanäle:** E-Mail, ggf. Remote-Support
- **Umfang:** Bug-Fixes, kleine Anpassungen, Fragen

### Updates & Wartung
- **Frequenz:** Monatlich (bei Bedarf)
- **Downtime:** < 5 Minuten
- **Prozess:** Docker-Container Update
- **Backup:** Automatisch vor jedem Update
- **Wartungsmodus:** System kann für Wartung gesperrt werden (Admin-Zugang bleibt)

### Konfigurationsmöglichkeiten
Das System bietet umfassende Anpassungsmöglichkeiten:

#### Zeiterfassung
- Max. Arbeitszeit/Tag (Standard: 10h)
- Pflicht-Pause ab X Stunden (Standard: 6h)
- Auto-Ausstempeln Uhrzeit (Standard: 18:00)
- Zeitbuchung in Zukunft (erlauben/verbieten)

#### Urlaub
- Standard Urlaubstage (Standard: 25)
- Min. Vorlaufzeit für Anträge (Standard: 2 Wochen)
- Max. Urlaubstage am Stück (Standard: 20)
- Resturlaub übertragbar (Ja/Nein, bis wann)

#### Rechnungen
- Standard Zahlungsziel (Standard: 30 Tage)
- MwSt-Satz (Standard: 8.1% für Schweiz)
- Rechnungsnummer-Format
- Automatische Nummerierung

#### E-Mail
- SMTP-Server Konfiguration
- Absender-Adresse
- E-Mail-Templates anpassbar

### Systemanforderungen
- **Server:** 
  - 4 CPU Cores
  - 8 GB RAM
  - 50 GB Storage (Datenbank + Uploads)
  - Docker-fähiges OS (Linux empfohlen)
  - Netzwerk: HTTP/HTTPS (Ports 80/443)
- **Client:** 
  - Moderner Webbrowser (Chrome, Firefox, Edge, Safari)
  - Mindestauflösung: 1280x720 (responsive Design)
  - Optional: Desktop-App für Windows
  - Mobile-optimiert (Smartphone/Tablet)

---

##  Empfehlungen für die Geschäftsleitung

### Kurzfristig (nächste 3 Monate)
1.  **System ist produktionsbereit** und kann vollständig genutzt werden
2.  **Regelmäßige Reports** etablieren (monatlich):
   - Projekt-Übersicht für Management
   - Budget-Kontrolle für Projektleiter
   - Compliance-Report für HR
3.  **Schulungen** für alle Benutzergruppen durchführen
4.  **Feedback sammeln** und priorisierte Verbesserungen umsetzen

### Mittelfristig (6-12 Monate)
1.  **Mobile App** entwickeln für bessere Nutzung unterwegs
2.  **Integrationen** mit bestehenden Systemen (Buchhaltung, etc.)
3.  **Analytics** ausbauen (Dashboard, KPIs, Trends)
4.  **Kunden-Portal** einrichten für mehr Transparenz

### Strategisch
1.  **ROI messen** - Dokumentieren der Zeiteinsparungen
2.  **Best Practices** etablieren - Projekt-Kalkulation, Budget-Kontrolle
3.  **Datengetriebene Entscheidungen** - Nutzen der gesammelten Daten
4.  **Kontinuierliche Verbesserung** - Regelmäßige Feature-Updates

---

##  Fazit

**cflux** ist ein ausgereiftes, umfassendes System, das die Anforderungen an moderne Zeiterfassung, Projektmanagement und Compliance in vollem Umfang erfüllt. 

### Stärken
-  Rechtssichere Zeiterfassung nach Schweizer Arbeitsrecht
-  Transparente Budget-Kontrolle in Echtzeit
-  Professionelle, kundenfertige Reports
-  Modulares, erweiterbares System
-  Moderne, benutzerfreundliche Oberfläche
-  Umfassende Dokumentation

### Investition vs. Nutzen
- **Entwicklungsaufwand:** Substantiell (mehrere Personen-Monate)
- **Laufende Kosten:** Minimal (Server-Hosting, gelegentliche Updates)
- **Einsparungen:** CHF 60'000 - 90'000 pro Jahr
- **ROI:** < 6 Monate

### Nächste Schritte
1. Vollständiges Rollout für alle Mitarbeiter
2. Etablierung regelmäßiger Reporting-Prozesse
3. Feedback-Sammlung und kontinuierliche Verbesserung
4. Planung der nächsten Ausbaustufe (Mobile App, erweiterte Analytics)

---

**Für Rückfragen und detaillierte Präsentationen stehe ich gerne zur Verfügung.**

---

## 📎 Anhänge (Referenz-Dokumente)

Die folgenden Dokumente enthalten detaillierte technische Informationen:

### Allgemeine Dokumentation
- `README.md` - Projekt-Übersicht und Schnellstart
- `DOCUMENTATION.md` - Vollständige System-Dokumentation
- `ZEITMODELLE_MODULE.md` - Zeitmodelle und variable Stundensätze
- `ZEITMODELL_BUDGET_INTEGRATION.md` - Budget-Integration
- `PROJECT_REPORTS_MODULE.md` - Projekt-Reports
- `PROJECT_REPORTS_PDF_EXPORT.md` - PDF-Export-Feature
- `PROJECT_BUDGET_MODULE.md` - Budget-Verwaltung
- `INTRANET_ATTACHMENTS.md` - Dokumenten-Management
- `INTRANET.md` - Intranet-Modul
- `INTRANET_SEARCH.md` - Volltextsuche
- `ORDERS_MODULE.md` - Bestellwesen
- `INCIDENT_MANAGEMENT.md` - EHS/Compliance
- `EHS_TODOS_MODULE.md` - EHS-Aufgaben
- `INVOICE_TEMPLATES.md` - Rechnungsvorlagen
- `MESSAGES_SYSTEM.md` - Nachrichtensystem
- `MEDIA_MODULE.md` - Medien-Verwaltung
- `WORKFLOWS.md` - Workflow-Systemorts
- `DOCKER-QUICKSTART.md` - Schnellstart-Anleitung
- `DOCKER.md` - Docker-Dokumentation
- `BASE_MODAL.md` - Modal-Komponenten
- `DARK_MODE.md` - Dark-Mode-Implementation
- `PROJECT_REPORTS_PDF_EXPORT.md` - PDF-Export-Feature
- `INTRANET_ATTACHMENTS.md` - Dokumenten-Management
- `ORDERS_MODULE.md` - Bestellwesen
- `INCIDENT_MANAGEMENT.md` - EHS/Compliance

### Technisch.

**Hinweis:** Die Screenshots werden kontinuierlich aktualisiert und können von der aktuellen UI leicht abweichen. Die Kernfunktionalität bleibt jedoch identisch.

### Dashboard & Zeiterfassung
![Dashboard](../web/kickstart/dashboard.png)  
**Dashboard** - Zentrale Übersicht mit KPIs

![Zeiterfassung](../web/kickstart/timemanagement.png)  
**Zeiterfassung** - Clock-In/Out mit Live-Timer

### Projektmanagement & Budget
![Projekte](../web/kickstart/projekte.png)  
**Projekte** - Projektverwaltung

![Budget-Planung](../web/kickstart/project_budget_planning.png)  
**Budget-Planung** - Detaillierte Budget-Verwaltung

![Projekt-Reports](../web/kickstart/project_reports_overview.png)  
**Projekt-Reports** - Auswertungen mit Diagrammen

![Zeit-Reports](../web/kickstart/project_time_reports.png)  
**Zeit-Reports** - Zeitauswertungen pro Projekt

### Zeitmodelle (NEU)
![Zeitmodell anlegen](../web/kickstart/zeitmodell_anlegen.png)  
**Zeitmodelle-Verwaltung** - Variable Stundensätze konfigurieren

![Zeitmodell zuweisen](../web/kickstart/zeitmodell_zuweisen.png)  
**Zeitmodell-Zuweisung** - Mitarbeitern Zeitmodelle zuweisen

### Urlaub & Abwesenheiten
![Urlaubsplaner](../web/kickstart/urlaubsplaner.png)  
**Urlaubsplaner** - Team-Kalender

![Abwesenheiten](../web/kickstart/abwesenheit.png)  
**Abwesenheiten** - Erfassung & Genehmigung

![Genehmigungen](../web/kickstart/genehmigungen.png)  
**Genehmigungen** - Workflow für Anträge

### Reporting & Analytics
![Reporting](../web/kickstart/reporting.png)  
**Reporting-Übersicht** - Auswertungen

![Stunden-Reports](../web/kickstart/reporting_stunden.png)  
**Stunden-Reports** - Zeitauswertungen

![Mitarbeiter-Reports](../web/kickstart/reoorting_mitarbeiter.png)  
**Mitarbeiter-Reports** - Team-Übersichten

### Benutzerverwaltung
![Benutzer](../web/kickstart/benutzerverwaltung.png)  
**Benutzer** - Mitarbeiterverwaltung (Tabellenansicht)

![Benutzer-Karten](../web/kickstart/user_cards.png)  
**Benutzer-Karten** - Kartenansicht mit Avataren (Standardansicht)

![Gruppen](../web/kickstart/benutzergruppen.png)  
**Gruppen** - Gruppenverwaltung

![Berechtigungen](../web/kickstart/berechtigungen.png)  
**Berechtigungen** - Modul-Rechte

![Module](../web/kickstart/module.png)  
**Module** - Modulverwaltung

### Rechnungswesen
![Rechnungen](../web/kickstart/rechnungen.png)  
**Rechnungen** - Übersicht

![Rechnung bearbeiten](../web/kickstart/rechnung_bearbeiten.png)  
**Bearbeitung** - Rechnungserstellung

![Rechnung Vorschau](../web/kickstart/rechnung_vorschau.png)  
**Vorschau** - PDF mit QR-Code

![Rechnungsvorlage](../web/kickstart/rechnungsvorlage.png)  
**Vorlagen** - Templates

### Workflows & Automation
![Workflow-Editor](../web/kickstart/workflow_editot.png)  
**Workflow-Editor** - Visueller Editor

![Workflow-Triggers](../web/kickstart/workflow_triggers.png)  
**Triggers** - Automatisierung

### Compliance & EHS
![Incidents](../web/kickstart/incidents.png)  
**Incidents** - Vorfallsmanagement

![Compliance](../web/kickstart/compliance.png)  
**Compliance** - ArG-Überwachung

### Abteilungen & Organigramm (NEU - Februar 2026)
![Organigramm](../web/kickstart/admin_organigramm.png)  
**Organigramm** - Interaktive Organisationsstruktur mit Drag & Drop

![Abteilungen](../web/kickstart/admin_abteilungen.png)  
**Abteilungen** - Abteilungsverwaltung mit Mitarbeiter-Zuweisung

**Features:**
- Interaktives Organigramm mit Pan, Zoom & Drag & Drop
- Cross-Department-Badges (Berichtet an / Leitet)
- Abteilungsleiter-Hervorhebung mit 👑 Krone
- Klick-Navigation zwischen Abteilungen
- Vorgesetzten-Hierarchie beliebiger Tiefe

### Onboarding & HR (NEU - Januar 2026)
![Onboarding](../web/kickstart/admin_onboarding.png)  
**Onboarding** - Admin-Panel mit Onboarding-Verwaltung

**Features:**
- Bewerbermanagement mit Online-Portal
- Strukturiertes Mitarbeiter-Onboarding (8 Standard-Tasks)
- Equipment-Verwaltung mit PDF-Protokollen
- Schulungsmanagement mit Tracking
- Integration in User- und Admin-Dashboard

### E-Learning & Schulungsmanagement (Dezember 2025)
![E-Learning Hauptseite](../web/kickstart/elearning.png)  
**E-Learning** - Hauptübersicht mit Kursen

![Kurs-Liste](../web/kickstart/courcde_list.png)  
**Kurs-Liste** - Verfügbare Kurse mit Kategorien

![Kurs-Dashboard](../web/kickstart/course_dashboard.png)  
**Kurs-Dashboard** - Fortschritt und Statistiken

![User-Kurse](../web/kickstart/user_course.png)  
**Meine Kurse** - Persönliche Kurs-Übersicht

![Kurs-Editor](../web/kickstart/course_editor.png)  
**Kurs-Editor** - Content-Erstellung und -Verwaltung

**Features:**
- 4 Kurs-Typen (Mandatory, Optional, Certification, Onboarding)
- Multi-Content-Support (Video, PDF, HTML, Quiz, External Link)
- 5 Quiz-Fragetypen mit automatischer Bewertung
- Fortschrittsverfolgung mit Video-Resume
- Automatische Zertifizierung
- Kurs-Zuweisungen mit Deadlines
- Compliance-Integration (Ablaufdaten, Wiederholungspflicht)
- Analytics & Reporting

### Stammdaten
![Kunden](../web/kickstart/stammdaten_kunden.png)  
**Kunden** - Kundenverwaltung

![Lieferanten](../web/kickstart/stammdaten_lieferanten.png)  
**Lieferanten** - Lieferantenverwaltung

![Artikel](../web/kickstart/stammdaten_artikel.png)  
**Artikel** - Artikelverwaltung

![Artikelgruppen](../web/kickstart/stammdaten_artikelgruppen.png)  
**Artikelgruppen** - Kategorisierung

![Standorte](../web/kickstart/standorte.png)  
**Standorte** - Standortverwaltung (Tabellenansicht)

![Standorte-Karten](../web/kickstart/locations.png)  
**Standorte-Karten** - Kartenansicht mit Details

### Weitere Module
![Feiertage](../web/kickstart/feiertage.png)  
**Feiertage** - Kantonal-spezifisch

![Intranet](../web/kickstart/intranet.png)  
**Intranet** - Dokumente & Wiki

![Nachrichten](../web/kickstart/nachrichten.png)  
**Nachrichten** - Interne Kommunikation

![Reisekosten](../web/kickstart/reisekosten.png)  
**Reisekosten** - Spesenabrechnung

![Lohnabrechnung](../web/kickstart/lohnabrechnung.png)  
**Lohnabrechnung** - Lohnberechnung

### System-Administration
![Backup & Restore](../web/kickstart/backup_restore.png)  
**Backup & Restore** - Datensicherung

![System-Einstellungen](../web/kickstart/system_einstellungen.png)  
**System-Einstellungen** - Konfiguration

### Weitere Admin-Module
![Zeiteinträge](../web/kickstart/admin_zeiteintraege.png)  
**Zeiteinträge** - Zentrale Stundenübersicht

![Mahnwesen](../web/kickstart/admin_mahnwesen.png)  
**Mahnwesen** - Mahnungen verwalten

![Geräte](../web/kickstart/admin_geraete.png)  
**Geräteverwaltung** - IT-Inventar

![Kostenstellen](../web/kickstart/admin_kostenstellen.png)  
**Kostenstellen** - Kostenstellenverwaltung

![Lagerbestand](../web/kickstart/admin_lagerbestand.png)  
**Inventar & Lagerbestand** - Bestände verwalten

![Projektplanung](../web/kickstart/admin_projektplanung.png)  
**Projektplanung** - Gantt-Diagramm & Milestones

![Analytics](../web/kickstart/admin_analytics.png)  
**Analytics** - Erweiterte Auswertungen

![Stunden alle](../web/kickstart/admin_stunden_alle.png)  
**Stunden (Alle)** - Team-Stundenübersicht

![Stunden User](../web/kickstart/admin_stunden_user.png)  
**Stunden (Mitarbeiter)** - Einzelne Mitarbeiter-Auswertung

![Geschäftsbericht](../web/kickstart/admin_geschaeftsbericht.png)  
**Geschäftsbericht** - Management-Report

![Workflow-Actions](../web/kickstart/admin_workflow_actions.png)  
**Workflow-Actions** - Workflow-Regeln & Trigger

![System-Logs](../web/kickstart/admin_system_logs.png)  
**System-Logs** - Protokollierung & Audit

![Funktionen](../web/kickstart/admin_funktionen.png)  
**Job-Funktionen** - Stellenprofile

![Checklisten](../web/kickstart/admin_checklisten.png)  
**Checklisten** - Vorlagen & Zuweisungen

![News](../web/kickstart/admin_news.png)  
**Unternehmensnews** - Nachrichten & Ankündigungen

### Benutzerseiten
![Profil](../web/kickstart/profil.png)  
**Profil** - Persönliches Benutzerprofil

![EHS-Dashboard](../web/kickstart/ehs_dashboard.png)  
**EHS-Dashboard** - Sicherheits- & Umweltmanagement

![Medien](../web/kickstart/medien.png)  
**Medien** - Medienbibliothek

![Bestellungen](../web/kickstart/bestellungen.png)  
**Bestellungen** - Bestellübersicht

![Checklisten Benutzer](../web/kickstart/checklisten.png)  
**Meine Checklisten** - Aufgaben & Checklisten

### Login & Landing
![Login](../web/kickstart/login.png)  
**Login** - Anmeldeseite

![Landing Page](../web/kickstart/landing_page.png)  
**Landing Page** - Startseite

### Interaktive Präsentation
Eine vollständige, interaktive Präsentation mit allen Screenshots ist verfügbar unter:
- `web/kickstart/presentation.html` - Klickbare Bildergalerie mit Beschreibungen

---

**Erstellt am:** 23. Februar 2026  
**Version:** 1.5  
**Autor:** Matthias Püski / Aquist GmbH Schweiz  
**Status:** Production with Stories, E-Learning PDF Upload & Org Management
