# cflux Zeiterfassung - Implementierungs-Proposal

## 1. Projektsoll-basierte Erfassung

**Mitarbeiter bekommt Vorgabe:**
- Projekt: Kunde XY
- Sollzeit: 06:00 - 17:00 (10h netto)
- Pause: 1h

**System cuttet automatisch:**
- Alles vor 06:00 → Nicht abrechenbar
- 06:00 - 17:00 → Abrechenbar für Kunde
- Alles nach 17:00 → Nicht abrechenbar

**Für Lohn:** Volle gestempelte Zeit
**Für Kunde:** Nur Sollzeit

## 2. Zwei-Konten-System

**AZK:** Alle Überstunden (für Auszahlung/Abbau)
**ÜZK:** Indikator für 25% Zuschlag (ab 45h)

**Abbau:** LIFO (erst zuschlagsberechtigte)

## 3. Flexible Zuschläge

**Zeitmodell definiert:**
- Nachtzeit, Sonn-/Feiertage
- Zuschlagssätze (25%, 50%, 100%)
- Option "nicht zuschlagsberechtigt" bei Bedarf

## 4. Validation & Tickets

**Warnung:** Stempelzeit außerhalb Projektsoll
**Ticket:** Fehlendes Stempeln nach 40h
**Dashboard:** Soll/Ist-Vergleich für Vorgesetzte

## Timeline

- **KW 9:** Basis-Features (Projektsoll, Cutten)
- **KW 10:** Zwei-Konten + Zuschläge
- **KW 11:** Testing mit Pilotgruppe