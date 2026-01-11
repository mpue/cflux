# Generic Workflow Actions - Entity Type Support

## Problem gelöst

Das Workflow-System war ursprünglich auf `INVOICE` und `TRAVEL_EXPENSE` Entity-Typen hardcodiert. Dies verhinderte die Verwendung von Workflows für andere Module wie Orders, Users, Time Entries, etc.

## Lösung

### Backend Änderungen

#### 1. workflow.service.ts - Generische Entity-Typen

**Vorher:**
```typescript
async createWorkflowInstance(
  workflowId: string, 
  entityId: string, 
  entityType: 'INVOICE' | 'TRAVEL_EXPENSE' = 'INVOICE'
)
```

**Nachher:**
```typescript
async createWorkflowInstance(
  workflowId: string, 
  entityId: string, 
  entityType: string = 'INVOICE'
)
```

Die Methode lädt jetzt optional Entity-Daten:
- Für `INVOICE` und `TRAVEL_EXPENSE`: Lädt vollständige Daten inkl. Relations
- Für andere Typen (`ORDER`, `USER`, `TIMEENTRY`, etc.): Verwendet minimale Daten
- Fallback-Logik: Bei Fehler wird mit minimalen Daten fortgefahren

```typescript
try {
  if (entityType === 'INVOICE') {
    entityData = await prisma.invoice.findUnique({ /* ... */ });
  } else if (entityType === 'TRAVEL_EXPENSE') {
    entityData = await prisma.travelExpense.findUnique({ /* ... */ });
  } else {
    // Generische Entity-Typen
    console.log(`[Workflow] Creating workflow instance for generic entity type: ${entityType}`);
    entityData = { id: entityId };
  }
} catch (error) {
  // Für INVOICE/TRAVEL_EXPENSE: Fehler werfen (backwards compatibility)
  // Für andere: Mit minimalen Daten fortfahren
  if (entityType === 'INVOICE' || entityType === 'TRAVEL_EXPENSE') {
    throw error;
  }
  entityData = { id: entityId };
}
```

#### 2. action.service.ts - Entfernung des Type Casts

**Vorher:**
```typescript
const instance = await workflowService.createWorkflowInstance(
  trigger.workflowId,
  context.entityId,
  context.entityType as 'INVOICE' | 'TRAVEL_EXPENSE'  // ❌ Type Cast
);
```

**Nachher:**
```typescript
const instance = await workflowService.createWorkflowInstance(
  trigger.workflowId,
  context.entityId,
  context.entityType  // ✅ Beliebiger String
);
```

## Verwendung

### Workflow für Order-Erstellung

1. Workflow erstellen über Admin UI → Workflows
2. Workflow Actions aufrufen: Admin UI → ⚡ Workflow Actions
3. Action auswählen: `order.created`
4. "Neuer Trigger" klicken
5. Workflow auswählen
6. Timing: `AFTER` (nach Bestellung erstellen)
7. Optional: Condition definieren (z.B. nur für Beträge > 1000 CHF)

### Verfügbare Actions

**Orders:**
- `order.created` - Bestellung angelegt
- `order.approved` - Bestellung genehmigt
- `order.rejected` - Bestellung abgelehnt
- `order.ordered` - Bestellung bestellt

**Authentication:**
- `user.login` - Benutzer meldet sich an
- `user.logout` - Benutzer meldet sich ab

**Time Tracking:**
- `timeentry.clockin` - Benutzer stempelt sich ein
- `timeentry.clockout` - Benutzer stempelt sich aus

**Users:**
- `user.created` - Benutzer erstellt
- `user.updated` - Benutzer aktualisiert
- `user.deleted` - Benutzer gelöscht

**Documents:**
- `document.created` - Dokument erstellt
- `document.updated` - Dokument aktualisiert

**Invoices:**
- `invoice.created` - Rechnung erstellt
- `invoice.sent` - Rechnung versendet
- `invoice.paid` - Rechnung bezahlt
- `invoice.cancelled` - Rechnung storniert

**Incidents/EHS:**
- `incident.created` - Vorfall erstellt
- `incident.approved` - Vorfall genehmigt

**Compliance:**
- `compliance.violation` - Compliance-Verstoß erkannt

## Context-Daten für Conditions

Jede Action hat ein `contextSchema`, das die verfügbaren Felder für Conditions definiert:

### order.created
```json
{
  "entityType": "ORDER",
  "entityId": "order-uuid",
  "userId": "user-uuid",
  "orderNumber": "BO-123456",
  "totalAmount": 1500.50,
  "status": "DRAFT"
}
```

### timeentry.clockin
```json
{
  "entityType": "TIMEENTRY",
  "entityId": "timeentry-uuid",
  "userId": "user-uuid",
  "startTime": "2025-01-08T08:00:00Z"
}
```

## Beispiel: Workflow bei großen Bestellungen

**Szenario:** Orders über 1000 CHF benötigen Geschäftsführer-Genehmigung

1. Workflow erstellen mit 1 Approval-Step (Approver: Geschäftsführer)
2. Workflow-Trigger erstellen:
   - Action: `order.created`
   - Workflow: "Großbestellungen Genehmigung"
   - Timing: `AFTER`
   - Condition:
     ```json
     {
       "field": "totalAmount",
       "operator": "gt",
       "value": 1000
     }
     ```

Ergebnis: Bei Order-Erstellung über 1000 CHF wird automatisch Workflow-Instanz erstellt und Geschäftsführer erhält E-Mail mit Genehmigungsanfrage.

## API Endpoints

### Actions
- `GET /api/actions` - Liste aller System-Actions
- `GET /api/actions/:actionKey` - Details einer Action
- `POST /api/actions/:actionKey/trigger` - Action manuell triggern (Testing)

### Triggers
- `GET /api/actions/:actionKey/triggers` - Alle Triggers für eine Action
- `POST /api/actions/:actionKey/triggers` - Neuen Trigger erstellen
- `PATCH /api/actions/triggers/:triggerId` - Trigger aktualisieren
- `DELETE /api/actions/triggers/:triggerId` - Trigger löschen

### Logs
- `GET /api/actions/logs` - Action-Ausführungs-Logs
- `GET /api/actions/statistics` - Statistiken

## Technische Details

### Condition Evaluation

Die `evaluateCondition` Methode in `action.service.ts` unterstützt:
- `eq` - Equal
- `ne` - Not equal
- `gt` - Greater than
- `gte` - Greater than or equal
- `lt` - Less than
- `lte` - Less than or equal
- `contains` - String contains
- `startsWith` - String starts with
- `endsWith` - String ends with

### Timing

- `BEFORE` - Vor der Aktion (kann z.B. Validation durchführen)
- `AFTER` - Nach der Aktion (Standard, startet Workflows nach erfolgreicher Ausführung)
- `INSTEAD` - Statt der Aktion (komplett eigene Logik)

### Priority

Bei mehreren Triggern für dieselbe Action bestimmt die Priority die Ausführungsreihenfolge:
- Höhere Zahl = höhere Priority
- Default: 100

## Integration in Controller

Um eine neue Action zu integrieren:

```typescript
// order.controller.ts
import { actionService } from '../services/action.service';

async createOrder(req: Request, res: Response) {
  const order = await prisma.order.create({ data: /* ... */ });
  
  // Action triggern
  await actionService.triggerAction('order.created', {
    entityType: 'ORDER',
    entityId: order.id,
    userId: req.user!.id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    status: order.status
  });
  
  res.json(order);
}
```

## Deployment

Nach Schema-Änderungen:
```bash
cd backend
npm run prisma:push      # Schema zu DB synchronisieren
npm run prisma:generate  # Prisma Client neu generieren
```

Oder in Docker:
```bash
docker exec timetracking-backend npx prisma db push
docker exec timetracking-backend node -e "require('./dist/services/action.service').actionService.seedSystemActions().then(() => console.log('Seeded')).catch(console.error)"
```

## Siehe auch

- [MODULE_PERMISSIONS.md](./MODULE_PERMISSIONS.md) - Berechtigungssystem
- [ORDERS_MODULE.md](./ORDERS_MODULE.md) - Orders-Modul Details
- [WORKFLOW_APPROVAL_SYSTEM.md](./WORKFLOW_APPROVAL_SYSTEM.md) - Workflow-Basics
