# cflux Tenant-Management System
## Automatisierte Multi-Tenant-Plattform für SaaS-Vertrieb

**Autor:** Matthias  
**Datum:** 02.02.2026  
**Status:** Konzept zur Diskussion

---

## Executive Summary

Wir erweitern cflux um ein integriertes Tenant-Management-System, das es ermöglicht, cflux als SaaS-Produkt online zu verkaufen. Kunden können sich selbst registrieren, bezahlen und erhalten automatisch ihre eigene cflux-Instanz innerhalb von 5 Minuten.

**Kernziele:**
- ✅ Automatisierte Provisionierung neuer Kundeninstanzen
- ✅ Zentrales Management aller Tenants aus einem Admin-Dashboard
- ✅ Vollautomatischer Verkaufsprozess mit Stripe-Integration
- ✅ Skalierbare Architektur auf bestehender Infrastruktur

---

## Das Problem

**Aktuell:**
- Jede neue cflux-Installation ist manueller Aufwand
- Kein standardisierter Onboarding-Prozess
- Keine zentrale Übersicht über alle Instanzen
- Support-Zugriff auf Kunden-Instanzen kompliziert

**Ziel:**
Ein System wie Shopify, WordPress.com oder Salesforce: Kunde zahlt → System läuft automatisch

---

## Die Lösung

### 1. Integriertes Tenant-Management-Modul

Ein neues Modul innerhalb von cflux, das alle Mandanten zentral verwaltet:
```
cflux Master-Instanz (demo.cflux.org)
├── Normaler cflux-Betrieb für Aquist
└── Tenant-Management-Modul
    ├── Übersicht aller Kunden-Instanzen
    ├── Provisionierung neuer Instanzen
    ├── Monitoring & Health-Checks
    ├── Billing-Integration
    └── Support-Zugriff
```

### 2. Automatisierter Verkaufsprozess

**Kundensicht:**
1. Besucht cflux.org
2. Klickt "Jetzt starten"
3. Wählt Firmenname (wird zu Subdomain: `firma.kunde.cflux.org`)
4. Bezahlt via Stripe (Kreditkarte, SEPA)
5. Erhält E-Mail mit Zugangsdaten
6. Kann sofort loslegen

**Technische Umsetzung:**
- Landing Page mit Preisübersicht
- Stripe Payment Link
- Webhook empfängt Zahlungsbestätigung
- cflux provisioniert automatisch neue Instanz
- E-Mail-Versand mit Credentials

### 3. Admin-Dashboard

Zentrale Verwaltung aller Tenants:

**Übersicht:**
- Liste aller Kunden-Instanzen
- Status (aktiv, in Einrichtung, ausgesetzt, gekündigt)
- Letzte Aktivität
- Ressourcen-Nutzung (CPU, RAM, Speicher)
- Umsatz-Übersicht

**Aktionen:**
- Neue Instanz manuell anlegen
- Instanz pausieren/aktivieren
- Instanz löschen
- Zugriff auf Kunden-Instanz für Support
- Logs einsehen

---

## Technische Architektur

### Infrastruktur

**Bestehend:**
- Hetzner Server mit Caddy + Docker Compose
- demo.cflux.org läuft bereits

**Erweiterung:**
```
Server (Hetzner CX51: 16GB RAM, 4 vCPU)
├── Caddy (Reverse Proxy + SSL)
├── Master cflux (demo.cflux.org)
│   └── Tenant-Management-Modul
├── PostgreSQL (Master)
└── Kunden-Instanzen
    ├── kunde1.kunde.cflux.org (Container)
    ├── kunde2.kunde.cflux.org (Container)
    └── kunde3.kunde.cflux.org (Container)
```

**Pro Kunden-Instanz:**
- 3 Docker Container (Backend, Frontend, PostgreSQL)
- Eigene Datenbank
- Isoliertes Netzwerk
- Automatisches SSL-Zertifikat

### Komponenten

**1. Datenbank-Schema**
- Tenant-Tabelle mit allen Kundeninformationen
- Status-Tracking
- Billing-Informationen
- Container-Metadaten

**2. Provisioner-Service**
- Erstellt Docker-Container
- Initialisiert Datenbank
- Konfiguriert Routing
- Erstellt Admin-User

**3. Monitoring-Service**
- Health-Checks alle 5 Minuten
- CPU/RAM/Disk-Überwachung
- Automatische Alerts bei Problemen

**4. Stripe-Integration**
- Webhook für Zahlungsbestätigungen
- Automatische Provisionierung
- Subscription-Management
- Automatische Kündigung bei Zahlungsausfall

---

## Features im Detail

### Für uns (Aquist)

**Automatisierung:**
- ✅ Null manueller Aufwand pro Kunde
- ✅ Skalierbar auf 50-100 Kunden
- ✅ Zentrale Verwaltung
- ✅ Automatisches Monitoring

**Geschäftsentwicklung:**
- ✅ Neue Einnahmequelle
- ✅ Showcase für potenzielle Großkunden
- ✅ Feedback-Kanal für Produktentwicklung
- ✅ Marktpositionierung als SaaS-Anbieter

**Support:**
- ✅ Direkter Zugriff auf Kunden-Instanzen
- ✅ Zentrale Log-Übersicht
- ✅ Automatische Backups
- ✅ Einfaches Troubleshooting

### Für Kunden

**Einfachheit:**
- ✅ Keine Installation notwendig
- ✅ Sofort einsatzbereit
- ✅ Immer aktuellste Version
- ✅ Keine IT-Ressourcen nötig

**Zuverlässigkeit:**
- ✅ Professionelles Hosting
- ✅ Tägliche Backups
- ✅ 99,9% Uptime
- ✅ Schweizer/Deutscher Standort (DSGVO)

**Flexibilität:**
- ✅ Monatlich kündbar
- ✅ Jederzeit skalierbar
- ✅ Eigene Subdomain
- ✅ Datenexport möglich

---

## Preismodelle (Vorschlag)

### Standard (49€/Monat)
- Bis 10 Benutzer
- 10 GB Speicher
- Alle Module
- E-Mail-Support

### Professional (99€/Monat)
- Bis 50 Benutzer
- 50 GB Speicher
- Alle Module
- Priority Support
- Eigene Domain möglich

### Enterprise (299€/Monat)
- Unbegrenzte Benutzer
- 200 GB Speicher
- Alle Module
- Dedizierte Ressourcen
- SLA 99,9%
- Telefon-Support

---

## Kostenrechnung

### Infrastruktur-Kosten

**Server:**
- Hetzner CX51: ~35€/Monat
- Kapazität: ~30-40 Instanzen
- Ab 40 Kunden: zweiter Server notwendig

**Pro Kunde (bei 30 Kunden):**
- Server-Anteil: ~1,20€
- Backup-Storage: ~0,50€
- **Kosten gesamt: ~1,70€**

**Stripe-Gebühren:**
- 1,4% + 0,25€ pro Transaktion
- Bei 49€: ~0,94€

**Gesamtkosten pro Kunde:** ~2,64€

### Revenue-Kalkulation

**Szenario 1 (Konservativ - 20 Kunden nach 6 Monaten):**
- Umsatz: 20 × 49€ = 980€/Monat
- Kosten: 20 × 2,64€ = 52,80€
- **Gewinn: ~927€/Monat**

**Szenario 2 (Realistisch - 50 Kunden nach 12 Monaten):**
- Umsatz: 50 × 49€ = 2.450€/Monat
- Kosten: 70€ (2 Server) + 132€ (Stripe) = 202€
- **Gewinn: ~2.248€/Monat**

**Szenario 3 (Optimistisch - 100 Kunden nach 18 Monaten):**
- Umsatz: 100 × 49€ = 4.900€/Monat
- Kosten: 140€ (4 Server) + 264€ (Stripe) = 404€
- **Gewinn: ~4.496€/Monat**

---

## Umsetzungsplan

### Phase 1: Foundation (Woche 1-2)
- ✅ Tenant-Entity und Datenbank-Schema
- ✅ Basis Provisioner-Service
- ✅ Docker-Compose-Template
- ✅ Manuelle Provisionierung (CLI)

**Ergebnis:** Wir können Tenants manuell anlegen und testen

### Phase 2: Automatisierung (Woche 3-4)
- ✅ Admin-Dashboard (Frontend)
- ✅ REST-API für Tenant-Management
- ✅ Monitoring & Health-Checks
- ✅ Automatische Provisionierung

**Ergebnis:** Komplettes Admin-Interface funktioniert

### Phase 3: Payment (Woche 5-6)
- ✅ Stripe-Integration
- ✅ Webhook-Handler
- ✅ Landing Page
- ✅ E-Mail-Versand

**Ergebnis:** Kompletter Self-Service funktioniert

### Phase 4: Polish (Woche 7-8)
- ✅ Monitoring-Dashboard
- ✅ Backup-System
- ✅ Dokumentation
- ✅ Beta-Tests

**Ergebnis:** Produktionsreif

---

## Risiken & Mitigation

### Technische Risiken

**Ressourcen-Knappheit:**
- ❌ Risiko: Zu viele Instanzen auf einem Server
- ✅ Lösung: Monitoring + automatisches Scaling auf neue Server

**Daten-Isolation:**
- ❌ Risiko: Kunde A könnte theoretisch Daten von Kunde B sehen
- ✅ Lösung: Separate Datenbanken + Network-Isolation + Tests

**Ausfall Master-Instanz:**
- ❌ Risiko: Wenn demo.cflux.org ausfällt, können Kunden nicht provisioniert werden
- ✅ Lösung: Master-Instanz ist entkoppelt, Kunden-Instanzen laufen weiter

### Geschäftliche Risiken

**Mangelnde Nachfrage:**
- ❌ Risiko: Niemand kauft
- ✅ Lösung: Kleine Investition (~40h), niedrige laufende Kosten, Learning Experience

**Support-Last:**
- ❌ Risiko: Zu viele Support-Anfragen
- ✅ Lösung: Gute Dokumentation, Self-Service-Portal, schrittweiser Rollout

**Konkurrenzsituation:**
- ❌ Risiko: Etablierte Anbieter
- ✅ Lösung: Fokus auf Schweizer/Deutsche KMU, spezialisierte Features, persönlicher Support

---

## Erfolgsmetriken

### Technische Metriken
- Provisionierungs-Zeit: < 5 Minuten
- Uptime: > 99,5%
- Response-Time: < 500ms
- Fehlerrate: < 1%

### Geschäftsmetriken
- Conversion-Rate: > 5% (Besucher → Kunde)
- Churn-Rate: < 10% pro Jahr
- Customer Lifetime Value: > 500€
- Time-to-Revenue: < 6 Monate Break-Even

---

## Nächste Schritte

### Entscheidung
1. ☐ Konzept mit Rado besprechen
2. ☐ Go/No-Go Entscheidung
3. ☐ Budget freigeben (wenn extern Hilfe)

### Bei Go
1. ☐ Zweiter Hetzner-Server bestellen
2. ☐ DNS Wildcard einrichten (*.kunde.cflux.org)
3. ☐ Stripe Business Account einrichten
4. ☐ Entwicklung starten (Phase 1)

### Diskussionspunkte mit Rado
- Ist SaaS-Modell strategisch gewünscht?
- Welche Preismodelle sind realistisch?
- Wer übernimmt Support bei Wachstum?
- Marketing/Sales-Strategie?
- Fokus auf Schweizer oder deutsche Kunden?
- Integration mit bestehendem Aquist-Business?

---

## Anhang

### Vergleichbare Produkte
- **Lexoffice:** 15-30€/Monat (nur Buchhaltung)
- **sevDesk:** 9-47€/Monat (Buchhaltung + Rechnungen)
- **Sage:** 25-45€/Monat (Buchhaltung)
- **Unsere Positionierung:** 49€/Monat (komplettes ERP)

### Technologie-Stack
- **Backend:** Node.js + TypeScript + NestJS
- **Frontend:** React + TypeScript
- **Database:** PostgreSQL
- **Container:** Docker + Docker Compose
- **Proxy:** Caddy (automatisches SSL)
- **Payment:** Stripe
- **Hosting:** Hetzner (Deutschland)
