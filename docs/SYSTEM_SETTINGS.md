# System Settings Module

## Übersicht

Das System Settings Modul ermöglicht die zentrale Verwaltung aller systemweiten Einstellungen in CFlux. Administratoren können über das Admin-Dashboard alle relevanten Konfigurationen vornehmen.

## Features

### 🏢 Firmendaten
- Firmenname
- Firmenlogo (Upload mit Vorschau)
- Firmenadresse
- Telefon & E-Mail
- Website
- Steuernummer / UID

### ⚙️ System-Einstellungen
- **Währung**: CHF, EUR, USD, GBP
- **Sprache**: Deutsch, English, Français, Italiano
- **Datumsformat**: DD.MM.YYYY, MM/DD/YYYY, YYYY-MM-DD
- **Zeitformat**: 24h oder 12h
- **Zeitzone**: Europe/Zurich, Berlin, Vienna, London, New York

### 💾 Backup-Einstellungen
- Automatisches Backup aktivieren/deaktivieren
- **Intervall**: Täglich, Wöchentlich, Monatlich
- **Uhrzeit**: Frei wählbar
- **Aufbewahrung**: Anzahl Tage bis zur automatischen Löschung
- Anzeige des letzten Backups

### 📧 E-Mail / SMTP-Konfiguration
- E-Mail-Versand aktivieren/deaktivieren
- **SMTP Server**: Host, Port, TLS/SSL
- **Authentifizierung**: Benutzername & Passwort
- **Absender**: E-Mail & Name
- **Test-Funktion**: Test-E-Mail senden zur Validierung der Konfiguration

### 🧾 Rechnungs-Einstellungen
- **Präfix**: z.B. "RE-" für RE-2025-0001
- **Startnummer**: Erste Rechnungsnummer
- **Stellen (Padding)**: Anzahl Ziffern (4 = 0001)
- **Zahlungsziel**: Standard-Zahlungsziel in Tagen
- **Fußzeile**: Text für Rechnungs-Footer

### 🎛️ Feature-Verwaltung
Module aktivieren/deaktivieren:
- ⏱️ Zeiterfassung
- 🔄 Workflows
- 🚨 Incident Management
- 🇨🇭 Swiss Compliance

## Technische Implementierung

### Backend

#### Datenmodell (Prisma)
```prisma
model SystemSettings {
  id                      String    @id @default(uuid())
  
  // Firmendaten
  companyName            String?
  companyLogo            String?
  companyAddress         String?
  companyPhone           String?
  companyEmail           String?
  companyWebsite         String?
  companyTaxId           String?
  
  // System-Einstellungen
  currency               String    @default("CHF")
  dateFormat             String    @default("DD.MM.YYYY")
  timeFormat             String    @default("HH:mm")
  language               String    @default("de")
  timezone               String    @default("Europe/Zurich")
  
  // Backup-Einstellungen
  autoBackupEnabled      Boolean   @default(false)
  backupInterval         String    @default("daily")
  backupTime             String    @default("02:00")
  backupRetention        Int       @default(30)
  lastBackupAt           DateTime?
  
  // E-Mail-Einstellungen (SMTP)
  smtpEnabled            Boolean   @default(false)
  smtpHost               String?
  smtpPort               Int       @default(587)
  smtpSecure             Boolean   @default(true)
  smtpUser               String?
  smtpPassword           String?
  smtpFromEmail          String?
  smtpFromName           String?
  
  // Rechnungs-Einstellungen
  invoicePrefix          String    @default("RE-")
  invoiceNumberStart     Int       @default(1)
  invoiceNumberPadding   Int       @default(4)
  invoiceTermsDays       Int       @default(30)
  invoiceFooter          String?
  
  // Feature Flags
  enableTimeTracking     Boolean   @default(true)
  enableWorkflows        Boolean   @default(true)
  enableIncidents        Boolean   @default(true)
  enableCompliance       Boolean   @default(true)
  
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
  
  @@map("system_settings")
}
```

#### API Endpoints

**Public Endpoint** (ohne Authentifizierung):
- `GET /api/system-settings/public` - Öffentliche Einstellungen (Logo, Firmenname)

**Admin Endpoints** (nur für ADMIN):
- `GET /api/system-settings` - Alle Einstellungen abrufen
- `PUT /api/system-settings` - Einstellungen aktualisieren
- `POST /api/system-settings/test-email` - E-Mail-Konfiguration testen
- `POST /api/system-settings/upload-logo` - Logo hochladen (Base64)

#### Services

**systemSettings.service.ts**
```typescript
export const getSettings = async () => {
  // Gibt erste (und einzige) Settings-Instanz zurück
  // Erstellt Default-Settings falls nicht vorhanden
};

export const updateSettings = async (data: Partial<SystemSettings>) => {
  // Aktualisiert Settings
};

export const testEmailSettings = async (config: EmailTestRequest) => {
  // Testet SMTP-Konfiguration mit nodemailer
};

export const uploadLogo = async (base64: string) => {
  // Speichert Logo als Base64
};

export const getPublicSettings = async () => {
  // Gibt nur öffentliche Daten zurück (ohne Credentials)
};
```

### Frontend

#### Komponente: SystemSettingsTab

Vollständige Admin-Oberfläche mit folgenden Sektionen:

1. **Navigation**: Tab-Buttons für Sektionen
2. **Formulare**: Strukturierte Eingabefelder
3. **Logo-Upload**: Drag & Drop mit Vorschau
4. **E-Mail-Test**: Validierung der SMTP-Konfiguration
5. **Feature-Toggles**: Checkboxen für Module

#### Service: systemSettings.service.ts

```typescript
interface SystemSettings {
  id: string;
  companyName?: string;
  companyLogo?: string;
  // ... alle Felder
}

class SystemSettingsService {
  getSettings(): Promise<SystemSettings>;
  getPublicSettings(): Promise<PublicSettings>;
  updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings>;
  testEmailSettings(config: EmailTestRequest): Promise<{ success: boolean; message: string }>;
  uploadLogo(base64: string): Promise<SystemSettings>;
}
```

## Verwendung

### 1. Zugriff

Als **Administrator** im Admin-Dashboard:
1. Zum Tab "⚙️ Einstellungen" navigieren
2. Gewünschte Sektion auswählen
3. Einstellungen anpassen
4. "💾 Einstellungen speichern" klicken

### 2. Logo hochladen

1. Zur Sektion "🏢 Firmendaten" navigieren
2. Datei auswählen (PNG empfohlen, max. 500x200px)
3. Logo wird automatisch hochgeladen und angezeigt
4. Speichern nicht vergessen

### 3. E-Mail testen

1. Zur Sektion "📧 E-Mail" navigieren
2. SMTP-Einstellungen konfigurieren
3. Test-Empfänger-Adresse eingeben
4. "📧 Test-E-Mail senden" klicken
5. Feedback zur Konfiguration erhalten

### 4. Backup konfigurieren

1. Zur Sektion "💾 Backup" navigieren
2. "Automatisches Backup aktivieren" aktivieren
3. Intervall, Uhrzeit und Aufbewahrungsdauer festlegen
4. Speichern

### 5. Features verwalten

1. Zur Sektion "🎛️ Features" navigieren
2. Module nach Bedarf aktivieren/deaktivieren
3. Speichern - Änderungen werden sofort wirksam

## Sicherheit

- **Zugriff**: Nur Administratoren (Rolle: ADMIN)
- **Passwörter**: SMTP-Passwort wird verschlüsselt gespeichert (Implementierung in Entwicklung)
- **Logo**: Base64-Speicherung in Datenbank, Größenbeschränkung empfohlen
- **Public Endpoint**: Gibt keine sensiblen Daten (Credentials) zurück

## Best Practices

### Logo
- Format: PNG mit transparentem Hintergrund
- Größe: Maximal 500x200 Pixel
- Dateigröße: < 200 KB

### SMTP-Konfiguration
- Verwenden Sie App-Passwörter statt Haupt-Passwörter (z.B. Gmail)
- TLS/SSL aktivieren für sichere Verbindung
- Port 587 (STARTTLS) oder 465 (SSL/TLS)

### Backup
- Empfohlene Aufbewahrung: 30-90 Tage
- Backup-Zeit: Außerhalb der Geschäftszeiten (nachts)
- Regelmäßig testen, ob Restore funktioniert

## Migration

Die Database-Migration wurde automatisch erstellt:

```bash
npx prisma migrate dev --name add_system_settings
```

Migrations-Datei:
```
migrations/20251227193157_add_system_settings/migration.sql
```

## Erweiterungsmöglichkeiten

### Zukünftige Features

1. **Multi-Tenant**: Settings pro Mandant
2. **Verschlüsselung**: Sensible Daten (Passwörter) verschlüsselt speichern
3. **Audit Log**: Änderungen an Settings protokollieren
4. **Import/Export**: Settings exportieren für Backup/Migration
5. **Vorlagen**: Vordefinierte Settings-Vorlagen
6. **Benachrichtigungen**: Admin-Benachrichtigung bei kritischen Änderungen
7. **Validierung**: Server-seitige Validierung erweitern
8. **Logo-Komprimierung**: Automatische Größenanpassung bei Upload
9. **Theme-Settings**: Dark Mode, Farben, Schriftarten
10. **PDF-Einstellungen**: Template-Anpassungen für PDFs

## Support

Bei Fragen oder Problemen:
1. Dokumentation prüfen
2. E-Mail-Test-Funktion nutzen zur Diagnose
3. Logs prüfen (Backend-Console)
4. Backup durchführen vor kritischen Änderungen

## Changelog

### v1.0.0 (27.12.2024)
- ✅ Initiale Implementierung
- ✅ Firmendaten-Verwaltung
- ✅ System-Einstellungen (Währung, Sprache, Format)
- ✅ Backup-Konfiguration
- ✅ SMTP E-Mail-Einstellungen mit Test-Funktion
- ✅ Rechnungs-Einstellungen
- ✅ Feature-Management
- ✅ Logo-Upload mit Vorschau
- ✅ Frontend-UI mit Tabs
- ✅ Backend-API mit Validierung
- ✅ Prisma Migration
- ✅ Integration in AdminDashboard
