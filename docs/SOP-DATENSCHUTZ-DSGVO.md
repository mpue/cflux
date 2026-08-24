# SOP – Datenschutz & Datenaufbewahrung (CFlux)

Version: 1.0 · Stand: 2026-07-13 · Verantwortlich: Datenschutz / HR / IT-Betrieb

Regelt den Umgang mit personenbezogenen Daten in CFlux gemäß DSGVO bzw.
CH-DSG (revDSG).

> Hinweis: Diese SOP ersetzt keine Rechtsberatung. Fristen und Rechtsgrundlagen
> mit dem/der Datenschutzverantwortlichen bzw. der Rechtsabteilung final festlegen.

---

## 1. Zweck & Geltungsbereich
Rechtskonforme Verarbeitung, Aufbewahrung und Löschung personenbezogener Daten,
die CFlux verarbeitet – insbesondere Mitarbeiter-, Bewerber- und Zeitdaten.

## 2. Datenkategorien in CFlux
| Kategorie | Beispiele | Sensibilität |
|-----------|-----------|--------------|
| Stammdaten Mitarbeiter | Name, Adresse, Telefon, Personalnummer | hoch |
| Sozialdaten | AHV-Nummer, Grenzgänger-Status | besonders schützenswert |
| Finanzdaten | Bankverbindung | hoch |
| Zeit-/Leistungsdaten | Zeiteinträge, Projekte, Überstunden | hoch (Verhaltenskontrolle) |
| Bewerberdaten | Bewerbungen, Dokumente, Interview-Notizen | hoch |
| Gesundheitsbezug | Abwesenheiten (Krankheit) | besonders schützenswert |
| E-Learning/Onboarding | Kursfortschritt, Onboarding-Aufgaben | mittel |

## 3. Grundsätze
- **Zweckbindung & Datenminimierung:** Nur Daten erheben, die benötigt werden.
- **Zugriffsbeschränkung:** Sensible Module (HR, Lohn, Bewerber) nur an berechtigte
  Gruppen (siehe SOP Benutzer- & Zugriffsverwaltung).
- **Vertraulichkeit:** Datenbank-Port nur intern (`127.0.0.1`), Transport per HTTPS.
- **Nachvollziehbarkeit:** Zugriffe/Änderungen über Audit-Log.

## 4. Aufbewahrung & Löschung
> Fristen sind Vorschläge – organisationsspezifisch verbindlich festlegen.

| Datenart | Empfohlene Aufbewahrung | Aktion danach |
|----------|-------------------------|---------------|
| Bewerberdaten (Absage) | 3–6 Monate nach Absage (CH: bis 3 Monate; Nachweispflichten beachten) | Löschen/Anonymisieren |
| Mitarbeiterdaten | Dauer Beschäftigung + gesetzl. Fristen (Lohn/Steuer i. d. R. bis 10 Jahre) | Prüfen, dann löschen |
| Zeiterfassungsdaten | Gesetzl. Aufbewahrung (CH ArG: 5 Jahre) | Archivieren/löschen |
| Rechnungen | 10 Jahre (Buchführung) | Aufbewahren |
| Abwesenheiten (Gesundheit) | Nur solange erforderlich | Minimieren/löschen |

**Löschprozess:**
1. Betroffene Datensätze identifizieren (Modul/DB).
2. Prüfen, ob gesetzliche Aufbewahrung entgegensteht.
3. Löschen bzw. anonymisieren; Vorgang dokumentieren (was, wer, wann, Rechtsgrundlage).
4. Beachten: **Backups** enthalten die Daten ebenfalls – Löschung wirkt erst nach
   Ablauf der Backup-Retention vollständig. Retention entsprechend dokumentieren.

## 5. Betroffenenrechte (Auskunft, Berichtigung, Löschung)
1. Antrag entgegennehmen, **Identität prüfen**.
2. Frist: DSGVO i. d. R. **1 Monat**.
3. Auskunft: Zusammenstellung der zur Person gespeicherten Daten aus den Modulen.
4. Berichtigung: Daten korrigieren, Änderung dokumentieren.
5. Löschung: nach §4-Prozess, sofern keine Aufbewahrungspflicht besteht.
6. Antwort dokumentieren (Datum, Bearbeiter, Ergebnis).

## 6. Auftragsverarbeiter / Drittdienste
- **Action1** (Geräte-/Software-Inventar): verarbeitet Endgeräte-/Nutzungsdaten –
  AV-Vertrag prüfen, Datenfluss dokumentieren.
- **Gotenberg** (PDF): läuft lokal im Netzwerk, keine externe Übermittlung.
- E-Mail-Versand (Passwort-Reset, Bewerber-Mails): Dienstleister im Verzeichnis führen.

## 7. Datenschutzvorfall
- Bei (mutmaßlichem) Verlust/Offenlegung personenbezogener Daten:
  → **SOP Security Incident Response** auslösen.
- **Meldepflicht:** DSGVO **72 Stunden** an die Aufsichtsbehörde (CH revDSG: „so rasch
  als möglich"), falls Risiko für Betroffene. Datenschutzverantwortlichen sofort informieren.

## 8. Verzeichnis von Verarbeitungstätigkeiten (VVT)
- CFlux als Verarbeitungstätigkeit im VVT führen (Zweck, Kategorien, Empfänger,
  Fristen, TOMs). Bei neuen Modulen/Integrationen aktualisieren.

## 9. Referenzen
- `docs/security.md`, `docs/SWISS_COMPLIANCE_CHECKLIST.md`
- SOP Benutzer- & Zugriffsverwaltung, SOP Security Incident Response
- Betriebs-SOP (`docs/SOP-BETRIEB.md`) – Backups/Retention
