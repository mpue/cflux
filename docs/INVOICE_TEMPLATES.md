# Rechnungsvorlagen (Invoice Templates)

## Übersicht

Das System unterstützt nun vollständig anpassbare Rechnungsvorlagen, die beim PDF-Export verwendet werden.

## Features

### 1. Template-Editor als Modal
- Der Template-Editor öffnet sich nun als überlagertes Modal
- Bessere Integration in das UI
- Klick außerhalb schließt den Editor
- Moderne, responsive Gestaltung mit Tabs

### 2. Template-Verwaltung
- Erstellen, Bearbeiten und Löschen von Vorlagen
- Standard-Vorlage festlegen
- Mehrere Vorlagen für verschiedene Zwecke

### 3. Anpassbare Inhalte

#### Firmendaten
- Firmenname, Adresse, Kontaktdaten
- UID/Steuernummer
- IBAN und Bankverbindung

#### Texte
- Kopfzeile (optional)
- Einleitungstext
- Zahlungsbedingungen
- Fußzeile (optional)

#### Design
- Logo-URL
- Primärfarbe für Akzente
- Anzeige-Optionen (Logo, UID, Zahlungsinfo)

### 4. Template-Auswahl beim Erstellen von Rechnungen
- Dropdown zur Auswahl der Vorlage im Rechnungsformular
- Standard-Vorlage wird automatisch vorausgewählt
- Vorlage kann jederzeit geändert werden

### 5. PDF-Export mit Template
- Firmendaten aus Vorlage werden verwendet
- Texte und Zahlungsbedingungen aus Vorlage
- Wenn keine Vorlage ausgewählt: Standard-Vorlage wird verwendet
- Fallback zu Standardwerten wenn keine Vorlage vorhanden

## Verwendung

### Template erstellen
1. Gehe zu "Admin Dashboard" → "Rechnungsvorlagen"
2. Klicke "+ Neue Vorlage"
3. Fülle die Firmendaten aus
4. Passe Texte und Design an
5. Optional: Als Standard festlegen
6. Speichern

### Rechnung mit Template erstellen
1. Gehe zu "Admin Dashboard" → "Rechnungen"
2. Klicke "Neue Rechnung"
3. Wähle eine Vorlage aus dem Dropdown
4. Fülle Rechnungsdaten aus
5. Speichern

### PDF generieren
- Beim Klick auf "PDF" wird die verknüpfte Vorlage verwendet
- Wenn keine Vorlage verknüpft ist: Standard-Vorlage
- Wenn keine Standard-Vorlage existiert: Fallback-Werte

## Datenbank-Schema

### Migration
Eine neue Migration wurde erstellt: `20251222_add_template_to_invoice`

### Änderungen
- `invoices.templateId`: Optionale Verknüpfung zu `invoice_templates`
- Foreign Key mit `ON DELETE SET NULL` (Vorlage kann gelöscht werden)
- Index für Performance

## Technische Details

### Frontend
- **InvoiceTemplateEditor**: Modal-Komponente mit Tabs
- **InvoiceTemplatesPage**: Übersichtsseite mit Karten-Layout
- **InvoiceModal**: Erweitert um Template-Auswahl

### Backend
- **Invoice Model**: Erweitert um `templateId` und `template` Relation
- **InvoiceTemplate Model**: Erweitert um `invoices` Relation
- **PDF Controller**: Verwendet Template-Daten für Personalisierung

### CSS
- Modern, responsive Design
- Animationen und Hover-Effekte
- Konsistentes Farbschema
- Mobile-freundlich

## Zukünftige Erweiterungen

Mögliche Verbesserungen:
- Logo-Upload direkt im Editor
- Vorschau der Rechnung im Editor
- Mehrsprachige Vorlagen
- QR-Code Integration für Schweizer QR-Rechnung
- Export/Import von Vorlagen
- Benutzerdefinierte Felder
- HTML/CSS Templates für erweiterte Gestaltung
