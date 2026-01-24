# Onboarding-Modul Implementierung (Kapitel 1-3)

## Übersicht
Implementierung des Onboarding-Moduls gemäß `docs/onboarding.md` Kapitel 1-3:
- **Kapitel 1**: Pre-Onboarding (Bewerbungsphase)
- **Kapitel 2**: Main Onboarding (Einstellungsprozess)
- **Kapitel 3**: Post-Onboarding (Integration mit Equipment und Training)

## Implementierte Features

### 1. Backend (Node.js/Express + Prisma)

#### Database Schema (`backend/prisma/schema.prisma`)
Neue Models hinzugefügt:

**Enums:**
- `ApplicantStatus`: NEW, IN_REVIEW, INTERVIEW_SCHEDULED, OFFER, HIRED, REJECTED
- `DocumentType`: CV, CERTIFICATE, COVER_LETTER, CONTRACT, etc.
- `DocumentStatus`: PENDING, UPLOADED, SIGNED, ARCHIVED
- `InterviewType`: PHONE, VIDEO_CALL, IN_PERSON, ASSESSMENT, TRIAL_WORK
- `OnboardingTaskStatus`: NOT_STARTED, IN_PROGRESS, COMPLETED, OVERDUE
- `EquipmentCondition`: NEW, GOOD, FAIR, DAMAGED
- `TrainingStatus`: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED

**Models:**
- `Applicant` - Bewerberverwaltung mit Email-Verifikation
- `ApplicantDocument` - Hochgeladene Bewerbungsunterlagen
- `ApplicantInterview` - Terminverwaltung für Gespräche
- `ApplicantNote` - HR-interne Notizen zu Bewerbern
- `Employee` - Mitarbeiterstammdaten (erweitert)
- `EmployeeDocument` - Vertragsunterlagen mit Unterschriftenstatus
- `OnboardingTask` - Aufgabenverwaltung mit Zuweisungen
- `TrainingCatalog` - Schulungskatalog mit Auto-Zuweisung
- `TrainingSession` - Geplante Schulungen
- `TrainingCompletion` - Schulungsteilnahmen mit Zertifikaten
- `Equipment` - Ausrüstungskatalog
- `EquipmentAssignment` - Gerätezuweisungen mit Übergabeprotokoll

#### Services (`backend/src/services/`)
- `applicant.service.ts` - Bewerberverwaltung, Dokumente, Interviews, Notizen
- `onboarding.service.ts` - Mitarbeiter-Onboarding, Tasks, Fortschrittsverfolgung
- `equipment-training.service.ts` - Equipment und Schulungsverwaltung

#### Controllers (`backend/src/controllers/`)
- `applicant.controller.ts` - REST API für Bewerbungen
- `onboarding.controller.ts` - REST API für Onboarding-Prozess
- `equipment-training.controller.ts` - REST API für Equipment & Training

#### Routes (`backend/src/routes/`)
- `applicant.routes.ts` - `/api/applicants/*`
- `onboarding.routes.ts` - `/api/onboarding/*`
- `equipment-training.routes.ts` - `/api/equipment-training/*`

**Wichtige Features:**
- Automatische Task-Erstellung beim Einstellen (8 Standard-Tasks)
- Dokument-Upload mit Multer (max 10MB, PDF/DOCX/JPG/PNG)
- Übergabeprotokoll-PDF-Generierung (PDFKit)
- Email-Verifizierung für Bewerber (Token-basiert)
- Schulungs-Auto-Zuweisung nach Position

### 2. Frontend (React + TypeScript)

#### Types (`frontend/src/types/onboarding.ts`)
TypeScript Interfaces für alle Onboarding-Entitäten mit vollständiger Typsicherheit.

#### Services (`frontend/src/services/onboardingService.ts`)
API-Clients für alle Backend-Endpoints:
- `applicantService` - Bewerberverwaltung
- `onboardingService` - Mitarbeiter & Tasks
- `equipmentService` - Equipment-Verwaltung
- `trainingService` - Schulungsverwaltung

#### Pages
- `ApplicantsPage.tsx` - Bewerberliste mit Status-Filter und Schnellaktionen
- `OnboardingDashboardPage.tsx` - Übersicht aller laufenden Onboarding-Prozesse

#### Widgets
- `OnboardingWidget.tsx` - UserDashboard-Widget für Mitarbeiter-Selbstansicht

#### Routing (`frontend/src/App.tsx`)
- `/admin/onboarding` - Onboarding Dashboard (Admin)
- `/admin/onboarding/applicants` - Bewerberliste (Admin)

### 3. Modul-Registrierung

**Module Key:** `onboarding`
- Name: "Onboarding"
- Icon: `person_add`
- Route: `/onboarding`
- Permissions: canView, canCreate, canEdit, canDelete

Registriert in `backend/prisma/seedModules.ts` (wird automatisch beim Docker-Start erstellt).

## API Endpoints

### Applicants (Bewerber)
```
POST   /api/applicants/register              - Bewerber-Registrierung (öffentlich)
GET    /api/applicants/verify/:token         - Email-Verifizierung (öffentlich)
GET    /api/applicants/applicants            - Alle Bewerber abrufen
GET    /api/applicants/applicants/:id        - Einzelner Bewerber
PATCH  /api/applicants/applicants/:id/status - Status ändern
POST   /api/applicants/applicants/:id/documents - Dokument hochladen
GET    /api/applicants/applicants/:id/documents/check - Pflichtdokumente prüfen
POST   /api/applicants/interviews            - Gespräch planen
POST   /api/applicants/applicants/:id/notes  - Notiz hinzufügen
```

### Onboarding (Mitarbeiter)
```
POST   /api/onboarding/hire                  - Bewerber einstellen
GET    /api/onboarding/employees             - Alle Mitarbeiter
GET    /api/onboarding/employees/:id         - Einzelner Mitarbeiter
PUT    /api/onboarding/employees/:id         - Mitarbeiter aktualisieren
POST   /api/onboarding/employees/:id/documents - Dokument hochladen
PATCH  /api/onboarding/documents/:id/status  - Dokumentstatus ändern
POST   /api/onboarding/tasks                 - Task erstellen
GET    /api/onboarding/employees/:id/tasks   - Tasks abrufen
PATCH  /api/onboarding/tasks/:id/status      - Task-Status ändern
GET    /api/onboarding/dashboard             - Dashboard-Daten
GET    /api/onboarding/employees/:id/progress - Fortschritt abrufen
```

### Equipment & Training
```
GET    /api/equipment-training/equipment                      - Equipment-Liste
POST   /api/equipment-training/equipment                      - Equipment erstellen
POST   /api/equipment-training/equipment/assign               - Equipment zuweisen
POST   /api/equipment-training/equipment/assignments/:id/protocol - PDF generieren

GET    /api/equipment-training/training/catalog               - Schulungskatalog
POST   /api/equipment-training/training/catalog               - Schulung erstellen
POST   /api/equipment-training/training/sessions              - Session planen
POST   /api/equipment-training/training/assign                - Mitarbeiter zuweisen
PATCH  /api/equipment-training/training/completions/:id       - Als abgeschlossen markieren
```

## Verwendung

### Backend starten
```powershell
cd backend
npm run prisma:push      # Schema in DB pushen
npm run prisma:generate  # Prisma Client generieren
npm run dev             # Backend starten (Port 3001)
```

### Frontend starten
```powershell
cd frontend
npm start               # Frontend starten (Port 3000)
```

### Docker Deployment
```powershell
docker-compose up -d --build
```
Das Onboarding-Modul wird automatisch beim Start angelegt (seedModules.ts).

## Nächste Schritte (Kapitel 4+)

Noch **nicht** implementiert (außerhalb Scope):
- ❌ Bewerber-Detailansicht mit Tabs
- ❌ Formular zum Einstellen mit allen Stammdaten
- ❌ Employee-Detailansicht mit Tasks/Equipment/Training
- ❌ Equipment-Verwaltungsseite
- ❌ Training-Verwaltungsseite
- ❌ Öffentliches Bewerber-Portal
- ❌ Email-Benachrichtigungen (Templates vorbereitet, aber nicht implementiert)
- ❌ Kalender-Integrationen (iCal)
- ❌ Workflow-Integrationen für Approvals

Diese Features können in späteren Iterationen basierend auf den bestehenden Services implementiert werden.

## Besonderheiten der Implementierung

1. **cflux-Architektur eingehalten:**
   - Admin-Panel für HR-Verwaltung (`/admin/onboarding/*`)
   - UserDashboard-Widget für Mitarbeiter-Selbstansicht
   - Module-basierte Berechtigungen via `requireModuleAccess`

2. **Automatisierungen:**
   - 8 Standard-Tasks werden beim Einstellen automatisch erstellt
   - Relative Fälligkeitsdaten (z.B. 7 Tage vor Startdatum)
   - Auto-Zuweisung von Schulungen nach Position

3. **Compliance:**
   - Dokumenten-Versionierung
   - Unterschriftenstatus-Tracking
   - Audit-Trail durch createdAt/updatedAt

4. **File Handling:**
   - Uploads in `backend/uploads/applicant-documents/`
   - Uploads in `backend/uploads/employee-documents/`
   - PDF-Generierung für Übergabeprotokolle in `backend/uploads/handover-protocols/`

5. **Sicherheit:**
   - Email-Verifizierung für Bewerber
   - Admin-Only Zugriff auf HR-Funktionen
   - JWT-basierte Authentifizierung

## Testing

Nach Implementierung testen:
1. Bewerber registrieren (öffentlich)
2. Bewerber-Status im Admin-Panel ändern
3. Bewerber einstellen → Employee-Record wird erstellt
4. Tasks automatisch generiert prüfen
5. Equipment zuweisen und Protokoll generieren
6. Schulung erstellen und Mitarbeiter zuweisen
7. Onboarding-Widget im UserDashboard prüfen

## Troubleshooting

**Prisma-Fehler nach Schema-Änderung:**
```powershell
cd backend
npm run prisma:push
npm run prisma:generate
```

**Frontend kann Backend nicht erreichen:**
- `.env` prüfen: `REACT_APP_API_URL=http://localhost:3001`
- Backend läuft auf Port 3001?

**Modul wird nicht angezeigt:**
- Backend-Logs prüfen: Wurde `seedModules` ausgeführt?
- Benutzergruppe hat Zugriff auf `onboarding` Modul?
