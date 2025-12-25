# Workflow-Genehmigungssystem

## Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Architektur](#architektur)
3. [Datenbank-Schema](#datenbank-schema)
4. [Backend-API](#backend-api)
5. [Frontend-Komponenten](#frontend-komponenten)
6. [Benutzer-Workflows](#benutzer-workflows)
7. [Installation & Konfiguration](#installation--konfiguration)
8. [Verwendung](#verwendung)
9. [Erweiterte Funktionen](#erweiterte-funktionen)

---

## Überblick

Das Workflow-Genehmigungssystem ermöglicht die Erstellung und Verwaltung von sequentiellen Genehmigungsprozessen für Rechnungen. Administratoren können flexible Workflows definieren, diese Rechnungsvorlagen zuordnen und Genehmiger festlegen. Das System startet Workflows automatisch und benachrichtigt Genehmiger über ausstehende Aufgaben.

### Hauptfunktionen

- ✅ **Workflow-Editor**: Grafische Erstellung und Bearbeitung von Genehmigungsworkflows
- ✅ **Sequentielle Workflows**: Mehrere Workflows werden nacheinander abgearbeitet
- ✅ **Template-Zuordnung**: Workflows können Rechnungsvorlagen zugewiesen werden
- ✅ **Automatischer Start**: Workflows starten automatisch bei Rechnungserstellung (Status: SENT)
- ✅ **Genehmiger-Benachrichtigung**: Dashboard-Widget und dedizierte Genehmigungsseite
- ✅ **Approve/Reject**: Genehmiger können Schritte genehmigen oder ablehnen
- ✅ **Kommentare**: Optionale Kommentare bei Genehmigung, Pflicht bei Ablehnung
- ✅ **Echtzeit-Updates**: Auto-Refresh der Genehmigungsseite alle 30 Sekunden
- ✅ **Berechtigungssystem**: Rollenbasierter Zugriff auf Workflow-Management

### Technologie-Stack

- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM
- **Frontend**: React, TypeScript, CSS
- **Datenbank**: PostgreSQL
- **Authentifizierung**: JWT (JSON Web Tokens)

---

## Architektur

### System-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
├─────────────────────────────────────────────────────────────┤
│  - WorkflowsTab (Admin)                                     │
│  - WorkflowEditor (Admin)                                   │
│  - TemplateWorkflowManager (Admin)                          │
│  - MyApprovals (User)                                       │
│  - Dashboard Widget                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Express.js)                     │
├─────────────────────────────────────────────────────────────┤
│  Routes → Controllers → Services → Database                 │
│                                                              │
│  - workflow.routes.ts                                       │
│  - workflow.controller.ts                                   │
│  - workflow.service.ts                                      │
│  - invoice.controller.ts (Auto-Trigger)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Prisma ORM
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
├─────────────────────────────────────────────────────────────┤
│  - Workflow                                                 │
│  - WorkflowStep                                             │
│  - InvoiceTemplateWorkflow                                  │
│  - WorkflowInstance                                         │
│  - WorkflowInstanceStep                                     │
└─────────────────────────────────────────────────────────────┘
```

### Workflow-Lebenszyklus

```
1. ERSTELLUNG (Admin)
   └─> Workflow im Admin-Panel erstellen
   └─> Schritte definieren (APPROVAL, NOTIFICATION, etc.)
   └─> Genehmiger pro Schritt festlegen

2. ZUORDNUNG (Admin)
   └─> Workflow einer Rechnungsvorlage zuordnen
   └─> Mehrere Workflows möglich (sequentielle Reihenfolge)

3. AUTO-START (System)
   └─> Rechnung mit Status "SENT" erstellt
   └─> System lädt zugeordnete Workflows
   └─> WorkflowInstances werden erstellt
   └─> Status: PENDING → IN_PROGRESS

4. GENEHMIGUNG (User)
   └─> Genehmiger sieht ausstehende Aufgaben
   └─> Prüft Rechnungsdetails
   └─> Genehmigt oder lehnt ab (mit Kommentar)
   └─> Status: PENDING → APPROVED/REJECTED

5. ABSCHLUSS (System)
   └─> Alle Schritte abgeschlossen
   └─> Workflow-Status: COMPLETED/REJECTED
   └─> Rechnung kann freigegeben werden
```

---

## Datenbank-Schema

### Workflow

Haupttabelle für Workflow-Definitionen.

```typescript
model Workflow {
  id          String   @id @default(uuid())
  name        String
  description String?
  definition  Json     // Backup der Workflow-Definition
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  steps          WorkflowStep[]
  templateLinks  InvoiceTemplateWorkflow[]
  instances      WorkflowInstance[]
}
```

**Felder:**
- `id`: Eindeutige UUID
- `name`: Name des Workflows (z.B. "Rechnungsgenehmigung Finance")
- `description`: Optionale Beschreibung
- `definition`: JSON-Backup der kompletten Workflow-Definition
- `isActive`: Aktiv/Inaktiv-Status (nur aktive Workflows können zugeordnet werden)

### WorkflowStep

Einzelne Schritte innerhalb eines Workflows.

```typescript
model WorkflowStep {
  id                   String           @id @default(uuid())
  workflowId           String
  name                 String
  type                 WorkflowStepType
  order                Int
  approverUserIds      Json?            // Array von User-IDs
  approverGroupIds     Json?            // Array von Group-IDs
  requireAllApprovers  Boolean          @default(false)
  config               Json?
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt
  
  workflow         Workflow               @relation(fields: [workflowId])
  instanceSteps    WorkflowInstanceStep[]
}

enum WorkflowStepType {
  APPROVAL      // Genehmigungsschritt
  NOTIFICATION  // Benachrichtigung
  CONDITION     // Bedingte Verzweigung
  DELAY         // Zeitverzögerung
}
```

**Felder:**
- `type`: Schritttyp (aktuell hauptsächlich APPROVAL)
- `order`: Reihenfolge des Schritts (1, 2, 3, ...)
- `approverUserIds`: JSON-Array mit User-IDs der Genehmiger
- `approverGroupIds`: JSON-Array mit Group-IDs (zukünftige Funktion)
- `requireAllApprovers`: Bei true müssen alle Genehmiger zustimmen

### InvoiceTemplateWorkflow

Verknüpfungstabelle zwischen Rechnungsvorlagen und Workflows.

```typescript
model InvoiceTemplateWorkflow {
  id                String   @id @default(uuid())
  invoiceTemplateId String
  workflowId        String
  order             Int      // Sequentielle Reihenfolge
  createdAt         DateTime @default(now())
  
  template  InvoiceTemplate @relation(fields: [invoiceTemplateId])
  workflow  Workflow        @relation(fields: [workflowId])
}
```

**Felder:**
- `order`: Reihenfolge der Workflow-Ausführung (1 = erster Workflow, 2 = zweiter, etc.)

### WorkflowInstance

Konkrete Instanz eines Workflows für eine bestimmte Rechnung.

```typescript
model WorkflowInstance {
  id             String                 @id @default(uuid())
  workflowId     String
  invoiceId      String
  status         WorkflowInstanceStatus
  currentStepId  String?
  startedAt      DateTime               @default(now())
  completedAt    DateTime?
  
  workflow   Workflow               @relation(fields: [workflowId])
  invoice    Invoice                @relation(fields: [invoiceId])
  steps      WorkflowInstanceStep[]
}

enum WorkflowInstanceStatus {
  PENDING      // Wartend auf Start
  IN_PROGRESS  // Läuft gerade
  COMPLETED    // Alle Schritte abgeschlossen
  REJECTED     // Mindestens ein Schritt abgelehnt
  CANCELLED    // Manuell abgebrochen
}
```

### WorkflowInstanceStep

Einzelner Schritt einer Workflow-Instanz.

```typescript
model WorkflowInstanceStep {
  id            String               @id @default(uuid())
  instanceId    String
  stepId        String
  status        WorkflowStepStatus
  approvedById  String?
  approvedAt    DateTime?
  comment       String?
  
  instance    WorkflowInstance @relation(fields: [instanceId])
  step        WorkflowStep     @relation(fields: [stepId])
  approvedBy  User?            @relation(fields: [approvedById])
}

enum WorkflowStepStatus {
  PENDING   // Wartet auf Genehmigung
  APPROVED  // Genehmigt
  REJECTED  // Abgelehnt
  SKIPPED   // Übersprungen (z.B. bei Bedingungen)
}
```

**Felder:**
- `approvedById`: User-ID des Genehmigers
- `approvedAt`: Zeitstempel der Genehmigung/Ablehnung
- `comment`: Optionaler Kommentar (Pflicht bei REJECTED)

### Datenbank-Beziehungen

```
Workflow (1) ─────> (n) WorkflowStep
Workflow (1) ─────> (n) InvoiceTemplateWorkflow ─────> (1) InvoiceTemplate
Workflow (1) ─────> (n) WorkflowInstance ─────> (1) Invoice
WorkflowStep (1) ─────> (n) WorkflowInstanceStep ─────> (1) WorkflowInstance
WorkflowInstanceStep (n) ─────> (1) User (approvedBy)
```

---

## Backend-API

### Authentifizierung

Alle Endpoints benötigen JWT-Authentifizierung im Header:

```
Authorization: Bearer <token>
```

### Workflow-Verwaltung

#### GET `/api/workflows`
Alle Workflows abrufen (mit Steps).

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Rechnungsgenehmigung Finance",
    "description": "Zweistufige Genehmigung durch Finance-Team",
    "isActive": true,
    "steps": [
      {
        "id": "uuid",
        "name": "Controller Genehmigung",
        "type": "APPROVAL",
        "order": 1,
        "approverUserIds": "[\"user-uuid-1\"]"
      }
    ]
  }
]
```

#### GET `/api/workflows/:id`
Einzelnen Workflow abrufen.

#### POST `/api/workflows`
Neuen Workflow erstellen.

**Request Body:**
```json
{
  "name": "Neuer Workflow",
  "description": "Beschreibung",
  "definition": {},
  "isActive": true,
  "steps": [
    {
      "name": "Schritt 1",
      "type": "APPROVAL",
      "order": 1,
      "approverUserIds": ["user-uuid-1", "user-uuid-2"],
      "requireAllApprovers": false
    }
  ]
}
```

#### PUT `/api/workflows/:id`
Workflow aktualisieren.

#### DELETE `/api/workflows/:id`
Workflow löschen (nur wenn keine aktiven Instanzen).

#### PATCH `/api/workflows/:id/toggle`
Workflow aktivieren/deaktivieren.

### Template-Workflow-Zuordnung

#### GET `/api/workflows/templates/:templateId`
Alle zugeordneten Workflows einer Template abrufen.

**Response:**
```json
[
  {
    "id": "uuid",
    "order": 1,
    "workflow": {
      "id": "uuid",
      "name": "Workflow 1"
    }
  }
]
```

#### POST `/api/workflows/templates/:templateId/assign`
Workflow einer Template zuordnen.

**Request Body:**
```json
{
  "workflowId": "workflow-uuid",
  "order": 1
}
```

#### DELETE `/api/workflows/templates/:templateId/workflows/:workflowId`
Workflow von Template entfernen.

#### PUT `/api/workflows/templates/:templateId/reorder`
Workflow-Reihenfolge ändern.

**Request Body:**
```json
{
  "workflowOrders": [
    { "workflowId": "uuid-1", "order": 1 },
    { "workflowId": "uuid-2", "order": 2 }
  ]
}
```

### Workflow-Instanzen

#### GET `/api/workflows/invoices/:invoiceId/instances`
Alle Workflow-Instanzen einer Rechnung abrufen.

**Response:**
```json
[
  {
    "id": "uuid",
    "status": "IN_PROGRESS",
    "startedAt": "2025-12-25T10:00:00Z",
    "workflow": {
      "name": "Workflow 1"
    },
    "steps": [
      {
        "id": "uuid",
        "status": "PENDING",
        "step": {
          "name": "Schritt 1",
          "type": "APPROVAL"
        }
      }
    ]
  }
]
```

#### POST `/api/workflows/invoices/:invoiceId/start`
Workflows für eine Rechnung manuell starten.

### Genehmigungen

#### GET `/api/workflows/my-approvals`
Ausstehende Genehmigungen des aktuellen Users abrufen.

**Response:**
```json
[
  {
    "id": "instance-step-uuid",
    "status": "PENDING",
    "step": {
      "id": "step-uuid",
      "name": "Controller Genehmigung",
      "type": "APPROVAL"
    },
    "instance": {
      "id": "instance-uuid",
      "workflow": {
        "name": "Rechnungsgenehmigung Finance"
      },
      "invoice": {
        "invoiceNumber": "RE-2025-001",
        "totalAmount": 5000.00,
        "customer": {
          "name": "Musterfirma GmbH"
        }
      }
    }
  }
]
```

#### POST `/api/workflows/instances/steps/:stepId/approve`
Genehmigungsschritt genehmigen.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "comment": "Sieht gut aus!"
}
```

#### POST `/api/workflows/instances/steps/:stepId/reject`
Genehmigungsschritt ablehnen.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "comment": "Betrag zu hoch, bitte prüfen!" // Pflichtfeld
}
```

#### GET `/api/workflows/invoices/:invoiceId/check-approval`
Prüfen, ob Rechnung freigegeben werden kann.

**Response:**
```json
{
  "canApprove": true,
  "allCompleted": true,
  "anyRejected": false
}
```

---

## Frontend-Komponenten

### Admin-Komponenten

#### WorkflowsTab
**Pfad:** `frontend/src/components/admin/WorkflowsTab.tsx`

Hauptverwaltung für Workflows im Admin-Panel.

**Features:**
- Liste aller Workflows mit Status (aktiv/inaktiv)
- "Workflow erstellen" Button
- Bearbeiten-Button pro Workflow
- Löschen-Button mit Bestätigung
- Toggle für Aktiv/Inaktiv
- Anzeige der Anzahl von Schritten

**Screenshot-Platzhalter:**
```
[Screenshot: WorkflowsTab mit Workflow-Liste]
```

#### WorkflowEditor
**Pfad:** `frontend/src/components/admin/WorkflowEditor.tsx`

Modal-Dialog zum Erstellen und Bearbeiten von Workflows.

**Features:**
- Name und Beschreibung eingeben
- Schritte dynamisch hinzufügen/entfernen
- Pro Schritt:
  - Name
  - Typ-Auswahl (APPROVAL, NOTIFICATION, CONDITION, DELAY)
  - Genehmiger-Auswahl (Multi-Select)
  - Reihenfolge (⬆️⬇️ Buttons)
- Speichern/Abbrechen

**Code-Beispiel:**
```typescript
// Schritt-Verwaltung
const addStep = () => {
  setSteps([...steps, {
    id: `temp-${Date.now()}`,
    name: '',
    type: 'APPROVAL',
    order: steps.length + 1,
    approverUserIds: [],
    requireAllApprovers: false
  }]);
};
```

**Screenshot-Platzhalter:**
```
[Screenshot: WorkflowEditor mit mehreren Schritten]
```

#### TemplateWorkflowManager
**Pfad:** `frontend/src/components/admin/TemplateWorkflowManager.tsx`

Modal-Dialog zur Zuordnung von Workflows zu Rechnungsvorlagen.

**Features:**
- Zwei-Spalten-Layout:
  - Links: Zugeordnete Workflows mit Reihenfolge
  - Rechts: Verfügbare aktive Workflows
- Workflows hinzufügen/entfernen
- Reihenfolge ändern (⬆️⬇️)
- Speichern übermittelt neue Zuordnung

**Screenshot-Platzhalter:**
```
[Screenshot: TemplateWorkflowManager mit zugeordneten Workflows]
```

**Integration:**
In `InvoiceTemplatesTab.tsx` wird ein Button "🔄 Workflows" pro Template angezeigt:

```typescript
<button 
  className="btn btn-secondary btn-sm"
  onClick={() => openWorkflowManager(template.id)}
>
  🔄 Workflows
</button>
```

### Benutzer-Komponenten

#### MyApprovals
**Pfad:** `frontend/src/pages/MyApprovals.tsx`
**CSS:** `frontend/src/pages/MyApprovals.css`

Dedizierte Seite für ausstehende Genehmigungen.

**Features:**
- Header mit Anzahl ausstehender Genehmigungen (Badge)
- Grid-Layout mit Genehmigungskarten
- Pro Karte:
  - Workflow-Name (Badge)
  - Schritt-Name mit Icon
  - Rechnungsnummer
  - Kundenname
  - Betrag (CHF)
  - "Genehmigen" Button
- Kein-Genehmigungen-Zustand mit ✅ Icon
- Auto-Refresh alle 30 Sekunden
- Modal für Approve/Reject:
  - Rechnungsdetails
  - Kommentar-Feld (optional bei Approve, Pflicht bei Reject)
  - "Genehmigen" / "Ablehnen" Buttons

**Code-Beispiel:**
```typescript
useEffect(() => {
  loadApprovals();
  const interval = setInterval(loadApprovals, 30000); // 30s refresh
  return () => clearInterval(interval);
}, []);

const handleApprove = async () => {
  await workflowService.approveWorkflowStep(
    selectedApproval.id,
    user!.id,
    comment
  );
  await loadApprovals();
  closeModal();
};
```

**Screenshot-Platzhalter:**
```
[Screenshot: MyApprovals mit mehreren Genehmigungskarten]
[Screenshot: Approve/Reject Modal]
```

#### Dashboard Widget
**Pfad:** `frontend/src/pages/Dashboard.tsx`

Stat-Card im Dashboard für schnellen Überblick.

**Features:**
- Zeigt Anzahl ausstehender Genehmigungen
- Rote Zahl bei ausstehenden Genehmigungen
- Klickbar → navigiert zu `/my-approvals`
- Gradient-Hintergrund

**Code-Beispiel:**
```typescript
<div 
  className="stat-card" 
  style={{ 
    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    cursor: 'pointer'
  }}
  onClick={() => navigate('/my-approvals')}
>
  <h3>🔔 Genehmigungen</h3>
  <div className="value">
    {pendingApprovalsCount > 0 ? (
      <span style={{ color: '#ff4444' }}>{pendingApprovalsCount}</span>
    ) : (
      '0'
    )}
  </div>
</div>
```

**Screenshot-Platzhalter:**
```
[Screenshot: Dashboard mit Genehmigungen-Widget]
```

#### Navigation
**Pfad:** `frontend/src/pages/Dashboard.tsx`

Button in der Navbar für direkten Zugriff.

```typescript
<button className="btn btn-primary" onClick={() => navigate('/my-approvals')}>
  🔔 Genehmigungen
</button>
```

---

## Benutzer-Workflows

### Admin: Workflow erstellen

1. **Navigation zum Admin-Panel**
   - Im Dashboard auf "Admin Panel" klicken
   - Tab "🔄 Workflows" auswählen

2. **Neuen Workflow erstellen**
   - Button "Workflow erstellen" klicken
   - Modal öffnet sich

3. **Workflow konfigurieren**
   - Name eingeben (z.B. "Rechnungsgenehmigung Finance")
   - Beschreibung hinzufügen (optional)
   - Ersten Schritt hinzufügen:
     - Name: "Controller Genehmigung"
     - Typ: APPROVAL
     - Genehmiger auswählen (Multi-Select)
   - Weitere Schritte nach Bedarf hinzufügen
   - Mit ⬆️⬇️ Reihenfolge anpassen

4. **Speichern**
   - Button "Erstellen" klicken
   - Workflow erscheint in der Liste

**Screenshot-Platzhalter:**
```
[Screenshot: Workflow-Erstellungsprozess]
```

### Admin: Workflow einer Vorlage zuordnen

1. **Navigation zu Rechnungsvorlagen**
   - Admin-Panel → Tab "📄 Rechnungsvorlagen"

2. **Workflow-Manager öffnen**
   - Bei gewünschter Vorlage auf "🔄 Workflows" klicken
   - Modal öffnet sich

3. **Workflows zuordnen**
   - In rechter Spalte verfügbare Workflows sehen
   - Mit "+" Button Workflow hinzufügen
   - Workflow erscheint links mit Ordnungsnummer
   - Weitere Workflows hinzufügen (werden sequentiell abgearbeitet)
   - Mit ⬆️⬇️ Reihenfolge anpassen

4. **Speichern**
   - Button "Speichern" klicken
   - Zuordnung ist aktiv

**Screenshot-Platzhalter:**
```
[Screenshot: Template-Workflow-Zuordnung]
```

### System: Automatischer Workflow-Start

**Trigger-Events:**
- Neue Rechnung mit Status "SENT" erstellt
- Bestehende Rechnung auf Status "SENT" geändert

**Ablauf:**
1. System prüft, ob Rechnungsvorlage Workflows zugeordnet hat
2. Lädt alle zugeordneten Workflows in Reihenfolge (order ASC)
3. Erstellt WorkflowInstance für jeden Workflow
4. Erstellt WorkflowInstanceSteps für alle Steps
5. Setzt ersten Workflow auf Status "IN_PROGRESS"
6. Weitere Workflows bleiben auf "PENDING"

**Code-Location:**
`backend/src/controllers/invoice.controller.ts` in `createInvoice()` und `updateInvoice()`

**Duplikatsschutz:**
System prüft vor Start, ob bereits Workflow-Instanzen existieren.

### User: Genehmigungen bearbeiten

1. **Benachrichtigung erhalten**
   - Dashboard-Widget zeigt Anzahl ausstehender Genehmigungen
   - Navbar-Button "🔔 Genehmigungen" ist sichtbar

2. **Zur Genehmigungsseite navigieren**
   - Auf Widget klicken ODER
   - Auf Navbar-Button klicken
   - Seite `/my-approvals` wird geladen

3. **Genehmigungen prüfen**
   - Alle ausstehenden Genehmigungen in Karten-Grid
   - Informationen einsehen:
     - Workflow-Name
     - Schritt-Name
     - Rechnungsnummer
     - Kunde
     - Betrag

4. **Genehmigung bearbeiten**
   - "Genehmigen" Button klicken
   - Modal öffnet sich mit Details
   - Kommentar eingeben (optional)
   - "Genehmigen" klicken

5. **Oder ablehnen**
   - Im Modal "Ablehnen" Button klicken
   - Kommentar eingeben (PFLICHT!)
   - "Ablehnen" klicken

6. **Bestätigung**
   - Modal schließt sich
   - Karte verschwindet aus Liste
   - Badge-Zähler aktualisiert sich

**Screenshot-Platzhalter:**
```
[Screenshot: Genehmigungsprozess - Dashboard → MyApprovals → Modal]
```

---

## Installation & Konfiguration

### Voraussetzungen

- Node.js 16+
- PostgreSQL 12+
- npm oder yarn

### Backend-Setup

1. **Migration ausführen**
```bash
cd backend
npm run prisma:migrate
```

Die folgenden Migrations wurden bereits erstellt:
- `20231220000001_add_workflow_tables`
- `20231220000002_add_invoice_template_workflow`
- `20231220000003_add_workflow_instance_tables`

2. **Seed-Daten (optional)**
Falls noch keine Test-Workflows existieren, können diese manuell erstellt werden.

### Frontend-Setup

1. **Dependencies installieren**
```bash
cd frontend
npm install
```

2. **Build**
```bash
npm run build
```

### Umgebungsvariablen

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/cflux"
JWT_SECRET="your-secret-key"
PORT=3001
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:3001/api
```

### Berechtigungen

Das Workflow-System respektiert das bestehende Berechtigungssystem:

- **Admin-Rolle**: Voller Zugriff auf Workflow-Verwaltung
- **Module-Berechtigung**: `workflows` Module kann für spezifische User/Gruppen aktiviert werden
- **Genehmigungen**: Jeder authentifizierte User kann eigene Genehmigungen sehen

**Modul-Konfiguration:**
```sql
INSERT INTO "Module" (name, description, isActive) 
VALUES ('workflows', 'Workflow-Genehmigungssystem', true);
```

---

## Verwendung

### Typische Anwendungsfälle

#### Einfache Ein-Schritt-Genehmigung

**Szenario:** Alle Rechnungen über CHF 1000 müssen vom Controller genehmigt werden.

**Setup:**
1. Workflow "Controller Approval" erstellen
2. Ein Schritt: "Controller Check"
3. Genehmiger: Controller-User
4. Workflow der entsprechenden Vorlage zuordnen

#### Mehrstufige Genehmigung

**Szenario:** Rechnungen durchlaufen Finance-Team, dann CFO.

**Setup:**
1. Workflow "Finance Approval Process" erstellen
2. Schritt 1: "Finance Team Review" → Team-Members als Genehmiger
3. Schritt 2: "CFO Final Approval" → CFO als Genehmiger
4. Workflow der Vorlage zuordnen

#### Multiple Workflows

**Szenario:** Rechnung benötigt sowohl fachliche als auch rechtliche Prüfung.

**Setup:**
1. Workflow "Technical Review" erstellen
2. Workflow "Legal Review" erstellen
3. Beide Workflows der Vorlage zuordnen
4. Order festlegen: Technical (1), Legal (2)
5. System arbeitet sequentiell ab

### Best Practices

#### Workflow-Namensgebung
- ✅ "Rechnungsgenehmigung Finance Team"
- ✅ "Legal Review Process"
- ❌ "Workflow 1"
- ❌ "Test"

#### Schritt-Namensgebung
- ✅ "Controller Prüfung"
- ✅ "CFO Freigabe"
- ❌ "Schritt 1"

#### Genehmiger-Auswahl
- Mindestens einen Genehmiger pro Schritt
- Bei kritischen Schritten: `requireAllApprovers = true`
- Mehrere Genehmiger für Urlaubsvertretung

#### Workflow-Aktivierung
- Nur aktive Workflows können zugeordnet werden
- Inaktive Workflows für Wartung/Tests
- Vor Deaktivierung prüfen: Keine laufenden Instanzen

#### Kommentare
- Klare, sachliche Begründungen
- Bei Ablehnung: Konkrete Gründe nennen
- Referenzen zu Dokumenten/Policies

### Fehlerbehandlung

#### Workflow startet nicht automatisch
**Prüfen:**
- Vorlage hat zugeordnete Workflows
- Workflows sind aktiv (`isActive = true`)
- Rechnungsstatus ist "SENT"

**Logs:**
```
[Workflow] Starting workflows for invoice {id}
[Workflow] Found {n} workflows for template {templateId}
```

#### Genehmigung wird nicht angezeigt
**Prüfen:**
- User-ID ist in `approverUserIds` enthalten
- Schritt-Status ist "PENDING"
- Workflow-Instanz ist "IN_PROGRESS"

**API-Test:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/workflows/my-approvals
```

#### Rechnung kann nicht freigegeben werden
**Prüfen:**
```bash
curl http://localhost:3001/api/workflows/invoices/{invoiceId}/check-approval
```

Response sollte sein:
```json
{
  "canApprove": true,
  "allCompleted": true,
  "anyRejected": false
}
```

---

## Erweiterte Funktionen

### Zukünftige Features

#### 1. Gruppen-basierte Genehmigungen
**Status:** Vorbereitet, aber nicht implementiert

**Konzept:**
- Genehmigungen werden Gruppen statt einzelnen Usern zugewiesen
- `approverGroupIds` JSON-Array bereits im Schema
- Benötigt: Group-Verwaltung, User-Group-Zuordnung

**Use Case:**
"Alle Mitglieder der Finance-Gruppe können genehmigen"

#### 2. Bedingte Verzweigungen (CONDITION)
**Status:** Typ definiert, Logik fehlt

**Konzept:**
- Workflow-Pfad basierend auf Bedingungen
- Beispiel: "Betrag > CHF 10.000 → CFO-Genehmigung erforderlich"
- Config-JSON für Bedingungsdefinition

#### 3. Email-Benachrichtigungen
**Status:** Nicht implementiert

**Konzept:**
- Email bei neuer Genehmigung
- Email bei Ablehnung (an Ersteller)
- Email-Template-System
- Reminder bei überfälligen Genehmigungen

**Integration:**
```typescript
// backend/src/services/email.service.ts
async notifyApprover(userId: string, approval: PendingApproval) {
  const user = await prisma.user.findUnique({ where: { id: userId }});
  await sendEmail({
    to: user.email,
    subject: `Neue Genehmigung: ${approval.invoice.invoiceNumber}`,
    template: 'approval-notification',
    data: approval
  });
}
```

#### 4. Push-Benachrichtigungen
**Status:** Nicht implementiert

**Konzept:**
- Browser-Notifications für neue Genehmigungen
- Web Push API
- Service Worker für Background-Sync

#### 5. Approval-History
**Status:** Daten vorhanden, UI fehlt

**Konzept:**
- Zeitleiste aller Genehmigungen einer Rechnung
- Wer, wann, welche Aktion
- Kommentare anzeigen
- Export als PDF

**Komponente:**
```typescript
<ApprovalTimeline invoiceId={invoice.id} />
```

#### 6. Workflow-Visualisierung
**Status:** Konzept

**Konzept:**
- Grafische Darstellung des Workflow-Fortschritts
- Status pro Schritt (pending/approved/rejected)
- Aktueller Schritt hervorgehoben
- ReactFlow oder D3.js

**Beispiel:**
```
[Schritt 1: Genehmigt ✓] → [Schritt 2: Ausstehend ⏳] → [Schritt 3: Wartet ○]
```

#### 7. Delegierung
**Status:** Nicht implementiert

**Konzept:**
- Genehmiger kann Aufgabe an anderen User delegieren
- Delegation mit Zeitraum (z.B. während Urlaub)
- Audit-Trail: Wer hat delegiert

#### 8. Eskalation
**Status:** Nicht implementiert

**Konzept:**
- Automatische Eskalation bei überfälliger Genehmigung
- Nach X Tagen: Erinnerung
- Nach Y Tagen: Eskalation an Vorgesetzten
- Konfigurierbar pro Workflow

#### 9. Analytics Dashboard
**Status:** Nicht implementiert

**Konzept:**
- Durchschnittliche Bearbeitungszeit pro Schritt
- Anzahl Genehmigungen/Ablehnungen pro User
- Engpässe identifizieren
- Charts und Statistiken

#### 10. Workflow-Vorlagen
**Status:** Nicht implementiert

**Konzept:**
- Vordefinierte Workflow-Templates
- "Einfache Genehmigung", "Drei-Stufen-Prozess", etc.
- Ein-Klick-Erstellung basierend auf Template

### Performance-Optimierungen

#### Datenbank-Indizes
```sql
CREATE INDEX idx_workflow_instance_step_status 
ON "WorkflowInstanceStep" (status);

CREATE INDEX idx_workflow_instance_step_approver 
ON "WorkflowInstanceStep" (approvedById);

CREATE INDEX idx_workflow_instance_invoice 
ON "WorkflowInstance" (invoiceId);
```

#### Caching
- Redis für ausstehende Genehmigungen
- Cache invalidation bei approve/reject
- Reduziert DB-Load bei häufigen Abfragen

#### Pagination
Für Installations mit vielen Genehmigungen:

```typescript
async getMyPendingApprovals(
  userId: string, 
  page: number = 1, 
  limit: number = 20
) {
  const skip = (page - 1) * limit;
  return prisma.workflowInstanceStep.findMany({
    where: { /* ... */ },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
}
```

### Sicherheits-Überlegungen

#### Autorisierung
- Nur Genehmiger können ihren Schritt bearbeiten
- Admins können Workflows verwalten
- Module-Permissions für granulare Kontrolle

#### Audit-Trail
Alle Aktionen werden gespeichert:
- Wer hat genehmigt/abgelehnt
- Zeitstempel
- Kommentar
- Unveränderlich (keine Updates/Deletes)

#### Manipulationsschutz
- Status-Transitions validieren (nicht von APPROVED zu PENDING)
- Workflow-Definition beim Start snapshotten
- Änderungen am Workflow beeinflussen keine laufenden Instanzen

---

## API-Referenz Cheat Sheet

```bash
# Workflows
GET    /api/workflows                          # Alle Workflows
GET    /api/workflows/:id                      # Einzelner Workflow
POST   /api/workflows                          # Erstellen
PUT    /api/workflows/:id                      # Aktualisieren
DELETE /api/workflows/:id                      # Löschen
PATCH  /api/workflows/:id/toggle               # Aktivieren/Deaktivieren

# Template-Zuordnung
GET    /api/workflows/templates/:templateId    # Workflows einer Template
POST   /api/workflows/templates/:templateId/assign
DELETE /api/workflows/templates/:templateId/workflows/:workflowId
PUT    /api/workflows/templates/:templateId/reorder

# Instanzen
GET    /api/workflows/invoices/:invoiceId/instances
POST   /api/workflows/invoices/:invoiceId/start

# Genehmigungen
GET    /api/workflows/my-approvals             # Meine Genehmigungen
POST   /api/workflows/instances/steps/:id/approve
POST   /api/workflows/instances/steps/:id/reject
GET    /api/workflows/invoices/:invoiceId/check-approval
```

---

## Troubleshooting

### Problem: "Property 'getMyPendingApprovals' does not exist"

**Lösung:**
Methode in `frontend/src/services/workflow.service.ts` hinzufügen:

```typescript
async getMyPendingApprovals(): Promise<any[]> {
  const response = await api.get('/workflows/my-approvals');
  return response.data;
}
```

### Problem: Workflow-Steps werden nicht gespeichert

**Ursache:** Alte API erwartet Steps nicht im Request Body.

**Lösung:** Backend-Service wurde aktualisiert, um Steps Array zu akzeptieren:

```typescript
// workflow.service.ts
async createWorkflow(data: any) {
  const workflow = await prisma.workflow.create({
    data: {
      name: data.name,
      description: data.description,
      // ...
    }
  });
  
  // Steps separat erstellen
  if (data.steps) {
    for (const step of data.steps) {
      await prisma.workflowStep.create({
        data: { ...step, workflowId: workflow.id }
      });
    }
  }
}
```

### Problem: Genehmigungen werden nicht geladen

**Debug-Schritte:**
1. Browser DevTools → Network Tab
2. Request zu `/api/workflows/my-approvals` prüfen
3. Status Code sollte 200 sein
4. Response sollte Array sein

**Häufige Fehler:**
- 401: Token abgelaufen → Neu einloggen
- 500: Server-Fehler → Backend-Logs prüfen
- Leeres Array: Keine Genehmigungen vorhanden

---

## Changelog

### Version 1.0 (25.12.2025)

**Neu:**
- ✨ Komplettes Workflow-Genehmigungssystem
- ✨ WorkflowsTab für Admin-Verwaltung
- ✨ WorkflowEditor mit Step-Management
- ✨ TemplateWorkflowManager für Template-Zuordnung
- ✨ MyApprovals Seite für User
- ✨ Dashboard-Widget für ausstehende Genehmigungen
- ✨ Auto-Trigger bei Invoice Status = SENT
- ✨ Approve/Reject Funktionalität mit Kommentaren
- ✨ Auto-Refresh (30s) der Genehmigungsseite

**Backend:**
- 📦 5 neue Datenbank-Models
- 📦 3 Enums für Status-Management
- 📦 15+ API-Endpoints
- 📦 workflow.service.ts mit Geschäftslogik
- 📦 Integration in invoice.controller.ts

**Frontend:**
- 🎨 4 neue Komponenten
- 🎨 MyApprovals.css mit Dark Mode Support
- 🎨 Responsive Design
- 🎨 Navigation-Integration

**Dokumentation:**
- 📝 Komplette API-Dokumentation
- 📝 Datenbank-Schema
- 📝 Benutzer-Workflows
- 📝 Architektur-Diagramme

---

## Support & Kontakt

Bei Fragen zum Workflow-System:

1. **Dokumentation prüfen**: Dieses Dokument zuerst durchlesen
2. **API testen**: Mit curl oder Postman Endpoints testen
3. **Logs prüfen**: Backend-Logs für Fehlerdetails
4. **Code-Review**: Services und Controller sind gut dokumentiert

**Wichtige Dateien:**
- Backend: `backend/src/services/workflow.service.ts`
- Frontend: `frontend/src/pages/MyApprovals.tsx`
- Datenbank: `backend/prisma/schema.prisma`
- Dokumentation: `WORKFLOW_APPROVAL_SYSTEM.md` (diese Datei)

---

**Ende der Dokumentation**

Letzte Aktualisierung: 25.12.2025
Version: 1.0
