# Onboarding-System für Bewerber

## Übersicht

Das Onboarding-System ermöglicht es Bewerbern, sich online zu bewerben, Dokumente hochzuladen und den Status ihrer Bewerbung zu verfolgen. HR-Mitarbeiter können Bewerbungen verwalten, Interviews planen und den Onboarding-Prozess steuern.

## Features

### Für Bewerber (Öffentlich zugänglich)

- ✅ **Online-Bewerbung**: Registrierung mit wenigen Klicks
- ✅ **E-Mail-Verifizierung**: Automatische Bestätigungs-E-Mail
- ✅ **Bewerber-Portal**: Persönliches Dashboard nach Login
- ✅ **Dokument-Upload**: Lebenslauf, Anschreiben, Zeugnisse hochladen
- ✅ **Status-Tracking**: Bewerbungsstatus in Echtzeit einsehen
- ✅ **Interview-Verwaltung**: Termine und Details einsehen
- ✅ **Fortschrittsanzeige**: Visualisierung des Bewerbungsfortschritts

### Für HR-Mitarbeiter (Authentifiziert)

- ✅ **Bewerberverwaltung**: Alle Bewerbungen einsehen und filtern
- ✅ **Status-Management**: Bewerbungsstatus aktualisieren
- ✅ **Interview-Planung**: Vorstellungsgespräche terminieren
- ✅ **Notizen**: Interne Notizen zu Bewerbern erstellen
- ✅ **Dashboard**: Übersicht aller aktiven Onboardings

## Benutzerfluss

### Bewerber-Registrierung

1. Besuche Landing Page: `http://localhost:3002/`
2. Klicke auf "Jetzt bewerben"
3. Fülle Registrierungsformular aus:
   - Vorname
   - Nachname
   - E-Mail-Adresse
   - Telefonnummer
   - Gewünschte Position
4. Bestätige und sende Bewerbung ab
5. Erhalte Verifizierungs-E-Mail (TODO: Email-Versand implementieren)
6. Verifiziere E-Mail durch Klick auf Link

### Bewerber-Portal

1. Login unter: `http://localhost:3002/applicant/login`
2. Gib E-Mail-Adresse ein
3. Zugang zum persönlichen Portal
4. Dokumente hochladen:
   - Lebenslauf (CV)
   - Anschreiben (Cover Letter)
   - Zeugnisse (Certificates)
   - Sonstige Dokumente
5. Status und Fortschritt einsehen
6. Interview-Termine verwalten

### HR-Verwaltung

1. Login als Admin/HR-Mitarbeiter
2. Navigiere zu: Admin → Onboarding
3. Bewerber-Übersicht:
   - Filter nach Status und Position
   - Details anzeigen
   - Status aktualisieren
4. Interviews planen
5. Notizen hinzufügen
6. Bei Einstellung: Bewerber zu Mitarbeiter konvertieren

## API-Endpunkte

### Öffentliche Endpunkte (Bewerber)

```
POST   /api/applicants/register           - Neue Bewerbung erstellen
POST   /api/applicants/login              - Bewerber anmelden
GET    /api/applicants/verify/:token      - E-Mail verifizieren
GET    /api/applicants/:id                - Bewerberdaten abrufen
POST   /api/applicants/:id/documents      - Dokument hochladen
DELETE /api/applicants/:id/documents/:id  - Dokument löschen
```

### Geschützte Endpunkte (HR)

```
GET    /api/applicants/admin/applicants         - Alle Bewerber
PATCH  /api/applicants/admin/applicants/:id/status - Status ändern
POST   /api/applicants/interviews               - Interview planen
GET    /api/applicants/admin/applicants/:id/interviews - Interviews abrufen
POST   /api/applicants/admin/applicants/:id/notes - Notiz hinzufügen
```

## Datenmodell

### Applicant (Bewerber)

```typescript
{
  id: string
  email: string (unique)
  firstName: string
  lastName: string
  phone: string
  position: string
  emailVerified: boolean
  verificationToken: string
  status: ApplicantStatus
  appliedAt: DateTime
  documents: ApplicantDocument[]
  interviews: ApplicantInterview[]
  notes: ApplicantNote[]
}
```

### ApplicantStatus (Bewerbungsstatus)

- `NEW` - Neu eingegangen
- `IN_REVIEW` - In Prüfung
- `INTERVIEW_SCHEDULED` - Gespräch geplant
- `OFFER` - Angebot gemacht
- `HIRED` - Eingestellt
- `REJECTED` - Abgelehnt

### ApplicantDocument (Dokumente)

```typescript
{
  id: string
  applicantId: string
  documentType: OnboardingDocumentType
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  version: number
  uploadedAt: DateTime
}
```

### OnboardingDocumentType (Dokumenttypen)

- `CV` - Lebenslauf
- `COVER_LETTER` - Anschreiben
- `CERTIFICATE` - Zeugnis
- `CONTRACT` - Vertrag
- `PRIVACY_POLICY` - Datenschutzerklärung
- `IT_GUIDELINES` - IT-Richtlinien
- `NDA` - Geheimhaltungsvereinbarung
- `OTHER` - Sonstiges

## Frontend-Komponenten

### Seiten

- **LandingPage** (`/`) - Einstiegsseite für Bewerber und Mitarbeiter
- **ApplicantRegisterPage** (`/applicant/register`) - Bewerbungsformular
- **ApplicantLoginPage** (`/applicant/login`) - Bewerber-Login
- **ApplicantVerifyEmailPage** (`/applicant/verify-email`) - E-Mail-Bestätigung
- **ApplicantPortalPage** (`/applicant/portal`) - Bewerber-Dashboard
- **ApplicantsPage** (`/admin/onboarding/applicants`) - HR-Verwaltung
- **OnboardingDashboardPage** (`/admin/onboarding`) - HR-Dashboard

### Hauptfunktionen

#### ApplicantPortalPage
- Persönliches Dashboard für Bewerber
- Fortschrittsanzeige (Mindestanforderungen: CV + Anschreiben + Zeugnis)
- Dokument-Upload mit Drag & Drop
- Status-Anzeige
- Interview-Termine
- Dokument-Download und -Löschung

#### ApplicantsPage (HR)
- Tabellen-Übersicht aller Bewerber
- Filter nach Status und Position
- Status-Update per Dropdown
- Detail-Ansicht mit allen Dokumenten
- Interview-Planung
- Notizen-Verwaltung

## Berechtigungen

Das Onboarding-Modul verwendet das ModuleAccess-System:

```typescript
Module Key: 'onboarding'
Permissions:
  - canView: Bewerber einsehen
  - canCreate: Interviews/Notizen erstellen
  - canEdit: Status aktualisieren
  - canDelete: Dokumente/Notizen löschen
```

## Installation & Setup

### 1. Datenbank-Migration

Das Schema ist bereits in `backend/prisma/schema.prisma` definiert:

```bash
cd backend
npm run prisma:push      # Schema zur DB pushen
npm run prisma:generate  # Prisma Client generieren
```

### 2. Module seeden

Das Onboarding-Modul ist bereits in `seedModules.ts` registriert:

```bash
cd backend
npm run seed  # Führt seedModules automatisch aus
```

### 3. Docker neu starten (empfohlen)

```bash
docker-compose down
docker-compose up --build -d
```

Das Onboarding-Modul wird automatisch erstellt und dem Admin zugewiesen.

## Testen

### Bewerber-Flow testen

1. Öffne `http://localhost:3002/`
2. Klicke "Jetzt bewerben"
3. Registriere Testbewerber:
   ```
   Vorname: Max
   Nachname: Mustermann
   E-Mail: max.mustermann@test.ch
   Telefon: +41 79 123 45 67
   Position: Software Developer
   ```
4. Nach Registrierung → Verifizierungs-Hinweis
5. Manuell verifizieren (in DB oder via Token-Link)
6. Login unter `/applicant/login`
7. Dokumente hochladen
8. Status überprüfen

### HR-Flow testen

1. Login als Admin: `admin@example.com` / `admin123`
2. Navigiere zu Admin → Onboarding
3. Prüfe Dashboard mit Statistiken
4. Klicke "Bewerber" → Übersicht aller Bewerbungen
5. Wähle Bewerber → Details anzeigen
6. Status ändern zu "IN_REVIEW"
7. Interview planen
8. Notiz hinzufügen

## TODO / Erweiterungen

### Kurzfristig
- [ ] **E-Mail-Versand**: Verifizierung, Status-Updates, Interview-Einladungen
- [ ] **Token-Authentifizierung**: JWT für Bewerber-Sessions
- [ ] **Dokumenten-Vorschau**: PDF-Viewer im Frontend
- [ ] **Interview-Reminder**: Automatische Erinnerungen
- [ ] **Bewerber-Ablehnung**: Automatische E-Mail mit Feedback

### Mittelfristig
- [ ] **Video-Interviews**: Integration mit Zoom/Teams
- [ ] **Bewerbungsformular-Builder**: Anpassbare Felder pro Position
- [ ] **Bewertungs-System**: Scoring für Bewerber
- [ ] **Collaborative Hiring**: Team-Feedback zu Bewerbern
- [ ] **Analytics**: Bewerbungsstatistiken und Kennzahlen

### Langfristig
- [ ] **AI-Matching**: Automatische Bewerbungsprüfung
- [ ] **Multi-Sprachen**: i18n für internationale Bewerber
- [ ] **ATS-Integration**: Anbindung an externe Recruiting-Tools
- [ ] **Onboarding-Checklisten**: Task-Management für neue Mitarbeiter
- [ ] **E-Signature**: Elektronische Vertragsunterzeichnung

## Sicherheit

### Implementiert
- ✅ E-Mail-Verifizierung
- ✅ File-Upload-Validierung (Typ, Größe)
- ✅ Module-basierte Berechtigungen für HR
- ✅ Separate öffentliche und geschützte Routen

### TODO
- [ ] Rate-Limiting für Registrierung
- [ ] CAPTCHA für Spam-Schutz
- [ ] Sichere Token-Verwaltung
- [ ] Audit-Logging für Änderungen
- [ ] DSGVO-konforme Datenlöschung

## Support

Bei Fragen oder Problemen:
- Dokumentation: `docs/`
- Backend-Code: `backend/src/routes/applicant.routes.ts`
- Frontend-Code: `frontend/src/pages/Applicant*.tsx`
- Service-Layer: `backend/src/services/applicant.service.ts`

## Lizenz

Teil des CFlux Swiss Compliance Time Tracking Systems
© 2026 CFlux
