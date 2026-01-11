# Workflow Action System - Dokumentation

## Übersicht

Das **Workflow Action System** ermöglicht es, Workflows automatisch durch System-Events zu triggern. Anstatt Workflows manuell oder nur an Templates zu binden, können sie jetzt auf jede beliebige Aktion im System reagieren.

## Architektur

### 1. **System Actions** - Katalog aller verfügbaren Trigger-Events

System Actions sind vordefinierte oder benutzerdefinierte Events, die im System ausgelöst werden können.

**Beispiele:**
- `user.login` - Benutzer meldet sich an
- `timeentry.clockin` - Benutzer stempelt sich ein
- `order.created` - Bestellung wird angelegt
- `invoice.sent` - Rechnung wird auf versendet gesetzt
- `compliance.violation` - Compliance-Verstoß erkannt

**Kategorien:**
- `AUTHENTICATION` - Login, Logout
- `TIME_TRACKING` - Clock-in, Clock-out
- `ORDERS` - Bestellungen anlegen, genehmigen, etc.
- `INVOICES` - Rechnungen erstellen, versenden, etc.
- `USERS` - Benutzer anlegen, bearbeiten, löschen
- `DOCUMENTS` - Dokumente erstellen, bearbeiten
- `INCIDENTS` - Vorfälle melden, genehmigen
- `COMPLIANCE` - Compliance-Verstöße
- `CUSTOM` - Benutzerdefinierte Actions

### 2. **Workflow Triggers** - Verknüpfung zwischen Actions und Workflows

Ein Workflow Trigger definiert:
- **Welcher Workflow** auf **welche Action** reagiert
- **Wann** der Workflow gestartet wird (BEFORE, AFTER, INSTEAD)
- **Unter welchen Bedingungen** (optional)
- **Priorität** (wenn mehrere Workflows auf dieselbe Action reagieren)

### 3. **Action Logs** - Audit-Trail aller ausgeführten Actions

Jede Action-Ausführung wird geloggt mit:
- Welche Action wurde ausgelöst
- Von welchem Benutzer
- Mit welchen Context-Daten
- Erfolg/Fehler
- Welche Workflows wurden gestartet
- Ausführungszeit

## Datenbank Schema

### SystemAction
```prisma
model SystemAction {
  id              String            @id @default(uuid())
  actionKey       String            @unique  // z.B. "invoice.sent"
  displayName     String            // "Rechnung auf versendet setzen"
  description     String?
  category        ActionCategory
  contextSchema   String?           // JSON Schema der verfügbaren Daten
  isActive        Boolean           @default(true)
  isSystem        Boolean           @default(false) // Kann nicht gelöscht werden
  
  triggers        WorkflowTrigger[]
  logs            ActionLog[]
}
```

### WorkflowTrigger
```prisma
model WorkflowTrigger {
  id              String                @id @default(uuid())
  workflowId      String
  actionKey       String                // FK zu SystemAction
  timing          ActionTriggerTiming   @default(AFTER)
  condition       String?               // JSON mit Bedingungsregeln
  priority        Int                   @default(100)
  isActive        Boolean               @default(true)
  
  workflow        Workflow
  action          SystemAction
}
```

### ActionLog
```prisma
model ActionLog {
  id              String            @id @default(uuid())
  actionKey       String
  userId          String?
  contextData     String?           // JSON
  success         Boolean           @default(true)
  errorMessage    String?
  triggeredWorkflows String?        // JSON Array von Workflow IDs
  executionTime   Int?              // in ms
  createdAt       DateTime          @default(now())
}
```

## Backend API

### System Actions

**GET /api/actions**
- Alle System Actions abrufen
- Query params: `category`, `isActive`

**GET /api/actions/:actionKey**
- System Action nach Key abrufen

**POST /api/actions**
- Neue System Action erstellen (Admin)
```json
{
  "actionKey": "custom.action",
  "displayName": "Benutzerdefinierte Aktion",
  "description": "Beschreibung...",
  "category": "CUSTOM",
  "contextSchema": {
    "field1": "string",
    "field2": "number"
  }
}
```

**PUT /api/actions/:actionKey**
- System Action aktualisieren (Admin)

**DELETE /api/actions/:actionKey**
- System Action löschen (Admin, nur nicht-System Actions)

### Workflow Triggers

**POST /api/actions/triggers**
- Workflow Trigger erstellen (Admin)
```json
{
  "workflowId": "workflow-uuid",
  "actionKey": "invoice.sent",
  "timing": "AFTER",
  "condition": {
    "field": "entityData.totalAmount",
    "operator": "gt",
    "value": 5000
  },
  "priority": 100
}
```

**GET /api/actions/workflows/:workflowId/triggers**
- Alle Trigger für einen Workflow

**GET /api/actions/:actionKey/triggers**
- Alle Triggers für eine Action

**PUT /api/actions/triggers/:id**
- Workflow Trigger aktualisieren (Admin)

**DELETE /api/actions/triggers/:id**
- Workflow Trigger löschen (Admin)

**PATCH /api/actions/triggers/:id/toggle**
- Workflow Trigger aktivieren/deaktivieren (Admin)
```json
{
  "isActive": false
}
```

### Action Execution

**POST /api/actions/:actionKey/trigger**
- Action manuell triggern (Admin, für Tests)
```json
{
  "context": {
    "entityType": "INVOICE",
    "entityId": "invoice-uuid",
    "entityData": { ... },
    "metadata": { ... }
  },
  "timing": "AFTER"
}
```

### Action Logs

**GET /api/actions/logs**
- Action Logs abrufen (Admin)
- Query params: `actionKey`, `userId`, `success`, `limit`, `offset`

**GET /api/actions/statistics**
- Action Statistics abrufen (Admin)
- Query params: `actionKey`

Response:
```json
{
  "total": 1234,
  "successful": 1200,
  "failed": 34,
  "successRate": 97.24,
  "avgExecutionTime": 145
}
```

## Backend Integration

### Action in Controller triggern

```typescript
import { actionService } from '../services/action.service';

// In Invoice Controller
await actionService.triggerAction('invoice.sent', {
  entityType: 'INVOICE',
  entityId: invoice.id,
  entityData: invoice,
  userId: req.user?.id,
});
```

### Mit Bedingungen

```typescript
// Nur Trigger wenn Betrag > 5000
const trigger = await actionService.createWorkflowTrigger({
  workflowId: 'workflow-uuid',
  actionKey: 'invoice.sent',
  timing: 'AFTER',
  condition: {
    field: 'entityData.totalAmount',
    operator: 'gt',
    value: 5000
  },
  priority: 100
});
```

### Unterstützte Operatoren

- `eq` - Equal (=)
- `ne` - Not Equal (≠)
- `gt` - Greater Than (>)
- `gte` - Greater Than or Equal (≥)
- `lt` - Less Than (<)
- `lte` - Less Than or Equal (≤)
- `contains` - String enthält
- `startsWith` - String beginnt mit
- `endsWith` - String endet mit
- `in` - Wert ist in Array

## Frontend Service

```typescript
import { actionService } from './services/action.service';

// Alle Actions laden
const actions = await actionService.getAllSystemActions('INVOICES', true);

// Trigger für Workflow erstellen
const trigger = await actionService.createWorkflowTrigger({
  workflowId: workflow.id,
  actionKey: 'invoice.sent',
  timing: 'AFTER',
  priority: 100
});

// Action manuell triggern (Test)
const result = await actionService.triggerAction('invoice.sent', {
  entityType: 'INVOICE',
  entityId: 'invoice-123',
  entityData: invoiceData
});

// Logs abrufen
const logs = await actionService.getActionLogs({
  actionKey: 'invoice.sent',
  limit: 50
});

// Statistics
const stats = await actionService.getActionStatistics('invoice.sent');
```

## Verwendungsbeispiele

### 1. Rechnungs-Genehmigungsworkflow

**Szenario:** Rechnungen über CHF 5'000 müssen vor dem Versand genehmigt werden.

```typescript
// 1. Workflow erstellen
const workflow = await workflowService.createWorkflow({
  name: 'Rechnungsgenehmigung über 5000 CHF',
  definition: { ... } // Workflow-Definition mit Genehmigungsschritten
});

// 2. Trigger erstellen
await actionService.createWorkflowTrigger({
  workflowId: workflow.id,
  actionKey: 'invoice.sent',
  timing: 'BEFORE', // BEFORE = Rechnung wird erst versendet nach Genehmigung
  condition: {
    field: 'entityData.totalAmount',
    operator: 'gt',
    value: 5000
  },
  priority: 10 // Hohe Priorität
});
```

### 2. Bestellungs-Benachrichtigung

**Szenario:** Einkaufsleiter soll bei jeder neuen Bestellung benachrichtigt werden.

```typescript
const workflow = await workflowService.createWorkflow({
  name: 'Einkaufsleiter Benachrichtigung',
  definition: { ... } // Workflow mit NOTIFICATION Step
});

await actionService.createWorkflowTrigger({
  workflowId: workflow.id,
  actionKey: 'order.created',
  timing: 'AFTER',
  priority: 100
});
```

### 3. Compliance-Verstoß Management

**Szenario:** Bei Compliance-Verstößen soll automatisch ein Vorfall erstellt und der Vorgesetzte benachrichtigt werden.

```typescript
const workflow = await workflowService.createWorkflow({
  name: 'Compliance-Verstoß Behandlung',
  definition: { ... } // Workflow mit:
  // 1. NOTIFICATION an Vorgesetzten
  // 2. APPROVAL für Gegenmaßnahmen
});

await actionService.createWorkflowTrigger({
  workflowId: workflow.id,
  actionKey: 'compliance.violation',
  timing: 'AFTER',
  priority: 1 // Sehr hohe Priorität
});
```

### 4. Zeiterfassung Erinnerung

**Szenario:** Wenn ein Benutzer sich einstempelt, aber über 10 Stunden arbeitet, Erinnerung senden.

```typescript
const workflow = await workflowService.createWorkflow({
  name: 'Überstunden Warnung',
  definition: { ... } // Workflow mit DELAY (10h) + NOTIFICATION
});

await actionService.createWorkflowTrigger({
  workflowId: workflow.id,
  actionKey: 'timeentry.clockin',
  timing: 'AFTER',
  priority: 50
});
```

## Setup & Initialisierung

### 1. Datenbank Schema synchronisieren

```powershell
cd backend
npm run prisma:push
```

### 2. System Actions seeden

**Via API:**
```bash
POST http://localhost:3001/api/actions/seed
Authorization: Bearer <admin-token>
```

**Via Script:**
```powershell
cd backend
npm run seed:actions
```

**Im package.json hinzufügen:**
```json
{
  "scripts": {
    "seed:actions": "ts-node scripts/seedActions.ts"
  }
}
```

### 3. Docker Auto-Setup

Füge in `backend/src/index.ts` nach dem Server-Start hinzu:

```typescript
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Auto-seed System Actions
  try {
    const { actionService } = await import('./services/action.service');
    await actionService.seedSystemActions();
    console.log('✅ System Actions initialized');
  } catch (error) {
    console.error('❌ Error initializing System Actions:', error);
  }
});
```

## Standard System Actions

Nach dem Seeding sind folgende Actions verfügbar:

### Authentication
- `user.login` - Benutzer meldet sich an
- `user.logout` - Benutzer meldet sich ab

### Time Tracking
- `timeentry.clockin` - Benutzer stempelt sich ein
- `timeentry.clockout` - Benutzer stempelt sich aus

### Orders
- `order.created` - Bestellung anlegen
- `order.approved` - Bestellung genehmigt
- `order.rejected` - Bestellung abgelehnt
- `order.ordered` - Bestellung bestellt

### Invoices
- `invoice.created` - Rechnung erstellt
- `invoice.sent` - Rechnung auf versendet setzen
- `invoice.paid` - Rechnung bezahlt
- `invoice.cancelled` - Rechnung storniert

### Users
- `user.created` - Benutzer angelegt
- `user.updated` - Benutzer bearbeitet
- `user.deleted` - Benutzer gelöscht

### Documents
- `document.created` - Dokument erstellt
- `document.updated` - Dokument bearbeitet

### Incidents
- `incident.created` - Vorfall gemeldet
- `incident.approved` - Vorfall genehmigt

### Compliance
- `compliance.violation` - Compliance-Verstoß erkannt

## Best Practices

### 1. Action Keys Namenskonvention

```
<module>.<action>
```

Beispiele:
- `invoice.created`
- `order.approved`
- `user.login`

### 2. Context-Daten

Immer folgende Felder mitgeben:
```typescript
{
  entityType: 'INVOICE' | 'TRAVEL_EXPENSE' | 'ORDER' | ...,
  entityId: 'uuid',
  entityData: { ... }, // Vollständiges Entity-Objekt
  userId: 'uuid',
  metadata: { ... } // Zusätzliche Daten
}
```

### 3. Fehlerbehandlung

Actions sollten nie die Hauptaktion blockieren:

```typescript
try {
  await actionService.triggerAction(...);
} catch (error) {
  console.error('Error triggering action:', error);
  // Don't fail main operation
}
```

### 4. Performance

- Actions werden asynchron ausgeführt
- Mehrere Workflows können parallel starten
- Logs werden für Audit-Trail gespeichert
- Bedingungen werden vor Workflow-Start evaluiert

### 5. Testing

```typescript
// Manuell testen via API
POST /api/actions/invoice.sent/trigger
{
  "context": {
    "entityType": "INVOICE",
    "entityId": "test-invoice-123",
    "entityData": {
      "totalAmount": 10000
    }
  },
  "timing": "AFTER"
}
```

## Migration bestehender Workflows

### Vorher: Template-gebundene Workflows

```typescript
// Workflows waren nur an Templates gebunden
const template = await prisma.invoiceTemplate.create({ ... });
await workflowService.linkWorkflowToTemplate(template.id, workflow.id, 1);
```

### Nachher: Action-getriggerte Workflows

```typescript
// Workflows können jetzt auf jede Action reagieren
await actionService.createWorkflowTrigger({
  workflowId: workflow.id,
  actionKey: 'invoice.sent',
  timing: 'AFTER'
});

// Template-Binding bleibt weiterhin unterstützt!
```

## Monitoring & Debugging

### Logs prüfen

```typescript
// Alle Logs für eine Action
const logs = await actionService.getActionLogs({
  actionKey: 'invoice.sent',
  limit: 100
});

// Nur Fehler
const errorLogs = await actionService.getActionLogs({
  success: false,
  limit: 50
});
```

### Statistics

```typescript
const stats = await actionService.getActionStatistics('invoice.sent');

console.log(`
  Total: ${stats.total}
  Erfolg: ${stats.successful} (${stats.successRate.toFixed(2)}%)
  Fehler: ${stats.failed}
  Ø Zeit: ${stats.avgExecutionTime}ms
`);
```

### Backend Logs

```typescript
[ActionService] Triggering action: invoice.sent (timing: AFTER)
[ActionService] Found 2 triggers for invoice.sent (timing: AFTER)
[ActionService] Condition not met for workflow "Kleine Rechnungen"
[ActionService] Starting workflow: Große Rechnungen Genehmigung
[ActionService] Workflow instance created: workflow-instance-uuid
[ActionService] Action completed in 234ms, triggered 1 workflows
```

## Troubleshooting

### Workflow wird nicht getriggert

1. **Prüfe ob Action existiert:**
   ```bash
   GET /api/actions/invoice.sent
   ```

2. **Prüfe ob Trigger aktiv ist:**
   ```bash
   GET /api/actions/invoice.sent/triggers
   ```

3. **Prüfe Bedingungen:**
   ```typescript
   const trigger = await prisma.workflowTrigger.findFirst({
     where: { actionKey: 'invoice.sent' }
   });
   console.log('Condition:', JSON.parse(trigger.condition || '{}'));
   ```

4. **Prüfe Logs:**
   ```bash
   GET /api/actions/logs?actionKey=invoice.sent&success=false
   ```

### Action wird mehrfach ausgelöst

- Prüfe Prioritäten der Trigger
- Prüfe ob mehrere Trigger auf dieselbe Action reagieren
- Prüfe Timing (BEFORE vs AFTER)

### Performance-Probleme

- Reduziere Anzahl der Trigger pro Action
- Optimiere Bedingungen (früh ausschließen)
- Prüfe durchschnittliche Ausführungszeit in Statistics

## Erweiterungen

### Eigene Actions hinzufügen

```typescript
// In deinem Controller
import { actionService } from '../services/action.service';

export const myCustomAction = async (req, res) => {
  // Hauptlogik
  const result = await doSomething();
  
  // Action triggern
  await actionService.triggerAction('custom.my_action', {
    entityType: 'CUSTOM_ENTITY',
    entityId: result.id,
    entityData: result,
    userId: req.user?.id
  });
  
  res.json(result);
};
```

### Eigene Action registrieren

```typescript
await actionService.createSystemAction({
  actionKey: 'custom.my_action',
  displayName: 'Meine eigene Aktion',
  description: 'Wird ausgelöst wenn...',
  category: 'CUSTOM',
  contextSchema: {
    field1: 'string',
    field2: 'number'
  }
});
```

## Zusammenfassung

Das Workflow Action System bietet:

✅ **Flexibilität** - Workflows können auf jede System-Aktion reagieren
✅ **Automatisierung** - Keine manuelle Workflow-Starts nötig
✅ **Bedingungen** - Workflows nur unter bestimmten Bedingungen starten
✅ **Prioritäten** - Kontrolle über Ausführungsreihenfolge
✅ **Audit-Trail** - Vollständiges Logging aller Actions
✅ **Monitoring** - Statistics & Logs für Performance-Analyse
✅ **Erweiterbar** - Einfach eigene Actions hinzufügen

Das System ist kompatibel mit dem bestehenden Workflow-System und erweitert es um event-basiertes Triggering.
