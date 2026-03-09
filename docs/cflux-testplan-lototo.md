# cflux – Testplan LOTOTO-Team
**Version:** 1.0 (Entwurf)  
**Stand:** März 2026  
**Verantwortlich:** Matthias Püski  
**Tester:** LOTOTO-Team (Testumgebung)  
**Modul:** Zeiterfassung  
**Klassifizierung:** Intern

---

## 1. Ziel und Rahmenbedingungen

### Was wir mit diesem Test erreichen wollen

- Sicherstellen, dass die Zeiterfassung **korrekt funktioniert** (Einträge werden gespeichert, berechnet, angezeigt)
- Sicherstellen, dass die **Usability alltagstauglich** ist (kein IT-Vorwissen nötig)
- Sicherstellen, dass **Daten konsistent** bleiben (keine Duplikate, keine stillen Fehler, keine falschen Summen)

### Was wir NICHT testen (in dieser Phase)

- Sicherheit / Zugriffsrechte (Sicherheitstests erfolgen separat)
- Performance unter Last
- Mobile Nutzung (außer explizit erwähnt)

### Wie wir testen

Die Tester führen parallel zur Munixo Zeiterfassung ihre Zeiterfassung in CFlux durch. Am Ende der Testphase, wird durch die Testgruppe ein volständiger Bericht über das versendete Formular erstellt.

### Testumgebung

- URL: `https://aquist-test.cflux.org`
- Zugangsdaten werden separat kommuniziert
- **Wichtig:** Nur Testumgebung verwenden – keine Produktionsdaten

---

## 2. Feedback und Fehlermeldung

Meldeformular per E-Mail-Template mit folgenden Pflichtfeldern:

| Feld | Beispiel |
|---|---|
| Testfall-Nr. | TF-07 |
| Was habe ich getan? | "Habe Eintrag von 8:00–12:00 gespeichert" |
| Was ist passiert? | "Eintrag erscheint nicht in der Übersicht" |
| Was hätte passieren sollen? | "Eintrag sollte sofort sichtbar sein" |
| Schweregrad | Kritisch / Mittel / Gering |
| Screenshot | (falls möglich) |

---

## 3. Allgemeine Hinweise für Tester

- Bitte **jeden Testfall einzeln** durchführen, nicht überspringen
- Bei Unklarheiten: erst weitermachen, dann melden – kein Testfall ist "zu trivial" um gemeldet zu werden
- Auch **positives Feedback** ist wertvoll ("hat gut funktioniert, weil...")
- Bitte **nichts "reparieren"** – wenn etwas komisch aussieht, melden, nicht selbst umgehen
- Testdaten dürfen frei erfunden sein (keine echten Personen- oder Arbeitsdaten)

---

## 4. Testfälle – Zeiterfassung

### Legende

| Symbol | Bedeutung |
|---|---|
| ✅ | Bestanden |
| ❌ | Fehlgeschlagen |
| ⚠️ | Auffälligkeit / Unsicher |
| – | Nicht getestet |

---

### 4.1 Login und Zugang

| Nr. | Testfall | Schritte | Erwartetes Ergebnis | Ergebnis | Kommentar |
|---|---|---|---|---|---|
| TF-01 | Login mit korrekten Daten | URL aufrufen → Benutzername + Passwort eingeben → "Anmelden" klicken | Weiterleitung ins Dashboard, kein Fehler | – | |
| TF-02 | Login mit falschem Passwort | URL aufrufen → falsches Passwort eingeben → "Anmelden" klicken | Fehlermeldung erscheint, kein Zugang | – | |
| TF-03 | Logout | Im System auf "Abmelden" klicken | Weiterleitung zur Login-Seite, kein Zugang mehr ohne erneuten Login | – | |

---

### 4.2 Zeiteintrag erstellen

| Nr. | Testfall | Schritte | Erwartetes Ergebnis | Ergebnis | Kommentar |
|---|---|---|---|---|---|
| TF-04 | Einfachen Eintrag anlegen | Zeiterfassung öffnen → "Neuer Eintrag" → Datum, Startzeit (08:00), Endzeit (12:00), Tätigkeit eingeben → Speichern | Eintrag erscheint sofort in der Übersicht mit korrekten Werten (4 Stunden) | – | |
| TF-05 | Eintrag über Mitternacht | Startzeit 22:00, Endzeit 06:00 (Folgetag) → Speichern | System erkennt Tagesübertritt korrekt oder gibt eine verständliche Fehlermeldung | – | |
| TF-06 | Eintrag ohne Pflichtfelder | Neuer Eintrag → Datum leer lassen → Speichern versuchen | System verhindert Speichern mit verständlicher Meldung | – | |
| TF-07 | Sehr kurzer Eintrag (< 1 Min) | Startzeit und Endzeit identisch oder 1 Minute auseinander → Speichern | Sinnvolle Reaktion (gespeichert oder abgelehnt mit Hinweis) | – | |
| TF-08 | Langer Eintrag (> 24h) | Startzeit 08:00, Endzeit 10:00 Folgetag (26 Stunden) → Speichern | System reagiert sinnvoll – Warnung oder Ablehnung | – | |

---

### 4.3 Zeiteintrag bearbeiten und löschen

| Nr. | Testfall | Schritte | Erwartetes Ergebnis | Ergebnis | Kommentar |
|---|---|---|---|---|---|
| TF-09 | Bestehenden Eintrag bearbeiten | Eintrag aus TF-04 öffnen → Endzeit auf 13:00 ändern → Speichern | Eintrag zeigt nun 5 Stunden, Änderung ist gespeichert | – | |
| TF-10 | Eintrag löschen | Eintrag auswählen → Löschen → Bestätigen | Eintrag ist weg, Gesamtsumme aktualisiert sich | – | |
| TF-11 | Löschen abbrechen | Eintrag auswählen → Löschen → Abbrechen | Eintrag bleibt unverändert bestehen | – | |

---

### 4.4 Übersicht und Datenkonsistenz

| Nr. | Testfall | Schritte | Erwartetes Ergebnis | Ergebnis | Kommentar |
|---|---|---|---|---|---|
| TF-12 | Tagesübersicht stimmt | Mehrere Einträge für heute anlegen (z.B. 2h + 3h + 1h) | Tagessumme zeigt korrekt 6 Stunden | – | |
| TF-13 | Wochenübersicht stimmt | Einträge über mehrere Tage anlegen → Wochenansicht öffnen | Alle Einträge erscheinen, Wochensumme ist korrekt | – | |
| TF-14 | Eintrag nach Reload noch da | Eintrag speichern → Seite neu laden (F5) | Eintrag ist noch vorhanden, keine Daten verloren | – | |
| TF-15 | Keine doppelten Einträge | Schnell zweimal auf "Speichern" klicken | Eintrag erscheint nur einmal in der Übersicht | – | |
| TF-16 | Gleichzeitige Einträge (Überschneidung) | Zwei Einträge für exakt gleiche Zeit anlegen | System warnt oder verhindert Überschneidung | – | |

---

### 4.5 Usability und Verständlichkeit

| Nr. | Testfall | Schritte | Erwartetes Ergebnis | Ergebnis | Kommentar |
|---|---|---|---|---|---|
| TF-17 | Fehlermeldungen verständlich | Diverse Fehler aus TF-06, TF-07 provozieren | Fehlermeldungen sind auf Deutsch, klar und hilfreich (kein "Error 500" o.ä.) | – | |
| TF-18 | Navigation nachvollziehbar | Ohne Anleitung: von Login zur Zeiterfassung, Eintrag anlegen, zurück zur Übersicht | Tester findet sich ohne Hilfe zurecht | – | |
| TF-19 | Allgemeiner Eindruck | Gesamte Session reflektieren | Freitext: Was war gut? Was war verwirrend? Was würde ich anders machen? | – | |

---

## 5. Gesamtbewertung (vom Tester auszufüllen)

| Frage | Antwort |
|---|---|
| Wie viele Testfälle bestanden? | /19 |
| Wie viele Testfälle fehlgeschlagen? | |
| Schwerwiegendster Fehler? | |
| Würde ich die Zeiterfassung im Alltag nutzen können? | Ja / Nein / Mit Einschränkungen |
| Gesamteindruck (1–5, wobei 5 = sehr gut) | |
| Sonstiges Feedback | |

---

## 6. Zeitplan

| Phase | Zeitraum | Verantwortlich |
|---|---|---|
| Testplan-Freigabe | [Datum] | Matthias Püski |
| Tester-Briefing | [Datum] | Matthias Püski |
| Testdurchführung | [Zeitraum, ca. 3 Wochen] | LOTOTO-Team |
| Feedback-Auswertung | [Datum] | Matthias Püski |
| Nachbesserungen | [Zeitraum] | Matthias Püski |
| Go-Live-Freigabe | [Datum] | Radovan Radojevic / GL |

---

*Dieser Testplan wird nach Abschluss der Testphase archiviert und ist Bestandteil der Go-Live-Dokumentation.*
