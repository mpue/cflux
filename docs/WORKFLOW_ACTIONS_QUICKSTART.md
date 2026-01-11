# Workflow Action System - Quick Start

## Das Problem

Vorher: "Ich möchte, dass bei jeder Bestellung über CHF 1'000 automatisch ein Genehmigungsworkflow gestartet wird."

❌ **Lösung vorher:** 
- Workflows konnten nur an Templates gebunden werden
- Keine flexiblen Bedingungen (z.B. Betrag)
- Workflows mussten manuell gestartet werden

✅ **Lösung jetzt:**
- Workflows können auf beliebige System-Actions reagieren
- Flexible Bedingungen möglich
- Vollautomatisch

## Schnellstart

### 1. System Actions initialisieren

**Via API (einmalig):**
```bash
POST http://localhost:3001/api/actions/seed
Authorization: Bearer <admin-token>
```

✅ Erstellt 20+ vordefinierte System Actions

### 2. Workflow erstellen

Erstelle einen Workflow wie gewohnt über die UI oder API:

```typescript
const workflow = await workflowService.createWorkflow({
  name: 'Bestellgenehmigung über 1000 CHF',
  description: 'Workflow für Bestellungen über 1000 CHF',
  definition: JSON.stringify({
    nodes: [
      { id: 'start', type: 'start', data: { label: 'Start' } },
      { id: 'approval', type: 'approval', data: { 
        label: 'Manager Genehmigung',
        approverGroupIds: ['manager-group-id']
      }}
    ],
    edges: [
      { source: 'start', target: 'approval' }
    ]
  })
});
```

### 3. Action Trigger erstellen

Verknüpfe den Workflow mit der System Action `order.created`:

```typescript
await actionService.createWorkflowTrigger({
  workflowId: workflow.id,
  actionKey: 'order.created',
  timing: 'AFTER', // Nach dem Anlegen der Bestellung
  condition: {
    field: 'entityData.totalAmount',
    operator: 'gt',
    value: 1000
  },
  priority: 10
});
```

**Das war's!** 🎉

Jetzt wird automatisch:
1. Bei jeder neuen Bestellung die Action `order.created` getriggert
2. Die Bedingung geprüft (totalAmount > 1000)
3. Falls erfüllt: Workflow gestartet
4. Manager erhält Genehmigungsanfrage

## Weitere Beispiele

### Beispiel 1: Rechnung versendet → Benachrichtigung

```typescript
// Workflow erstellen (Notification)
const workflow = await workflowService.createWorkflow({
  name: 'Rechnung versendet Benachrichtigung',
  definition: { ... } // NOTIFICATION Step
});

// Trigger erstellen
await actionService.createWorkflowTrigger({
  workflowId: workflow.id,
  actionKey: 'invoice.sent',
  timing: 'AFTER'
  // Keine Bedingung = immer triggern
});
```

### Beispiel 2: Compliance-Verstoß → Vorfall erstellen

```typescript
const workflow = await workflowService.createWorkflow({
  name: 'Compliance-Verstoß Management',
  definition: { ... }
});

await actionService.createWorkflowTrigger({
  workflowId: workflow.id,
  actionKey: 'compliance.violation',
  timing: 'AFTER',
  priority: 1 // Sehr hohe Priorität
});
```

### Beispiel 3: Zeiterfassung → Überstunden-Warnung

```typescript
const workflow = await workflowService.createWorkflow({
  name: 'Überstunden Warnung',
  definition: { ... } // DELAY + NOTIFICATION
});

await actionService.createWorkflowTrigger({
  workflowId: workflow.id,
  actionKey: 'timeentry.clockin',
  timing: 'AFTER'
});
```

## Verfügbare System Actions

### Rechnungen (INVOICES)
- ✅ `invoice.created` - Rechnung erstellt
- ✅ `invoice.sent` - Rechnung versendet
- ✅ `invoice.paid` - Rechnung bezahlt
- ✅ `invoice.cancelled` - Rechnung storniert

### Bestellungen (ORDERS)
- ✅ `order.created` - Bestellung angelegt
- ✅ `order.approved` - Bestellung genehmigt
- ✅ `order.rejected` - Bestellung abgelehnt
- ✅ `order.ordered` - Bestellung bestellt

### Zeiterfassung (TIME_TRACKING)
- ✅ `timeentry.clockin` - Einstempeln
- ✅ `timeentry.clockout` - Ausstempeln

### Benutzer (USERS)
- ✅ `user.created` - Benutzer angelegt
- ✅ `user.updated` - Benutzer bearbeitet
- ✅ `user.deleted` - Benutzer gelöscht

### Authentifizierung (AUTHENTICATION)
- ✅ `user.login` - Benutzer meldet sich an
- ✅ `user.logout` - Benutzer meldet sich ab

### Vorfälle (INCIDENTS)
- ✅ `incident.created` - Vorfall gemeldet
- ✅ `incident.approved` - Vorfall genehmigt

### Compliance (COMPLIANCE)
- ✅ `compliance.violation` - Compliance-Verstoß

### Dokumente (DOCUMENTS)
- ✅ `document.created` - Dokument erstellt
- ✅ `document.updated` - Dokument bearbeitet

## Bedingungen (Conditions)

### Operatoren

| Operator | Bedeutung | Beispiel |
|----------|-----------|----------|
| `eq` | Gleich | `value: 100` |
| `ne` | Nicht gleich | `value: 0` |
| `gt` | Größer als | `value: 1000` |
| `gte` | Größer oder gleich | `value: 1000` |
| `lt` | Kleiner als | `value: 100` |
| `lte` | Kleiner oder gleich | `value: 100` |
| `contains` | Enthält | `value: "GmbH"` |
| `startsWith` | Beginnt mit | `value: "CH-"` |
| `endsWith` | Endet mit | `value: ".pdf"` |
| `in` | In Array | `value: ["PENDING", "DRAFT"]` |

### Beispiele

**Betrag größer als 5000:**
```json
{
  "field": "entityData.totalAmount",
  "operator": "gt",
  "value": 5000
}
```

**Status ist SENT:**
```json
{
  "field": "entityData.status",
  "operator": "eq",
  "value": "SENT"
}
```

**Kunde enthält "GmbH":**
```json
{
  "field": "entityData.customer.name",
  "operator": "contains",
  "value": "GmbH"
}
```

**Status ist PENDING oder DRAFT:**
```json
{
  "field": "entityData.status",
  "operator": "in",
  "value": ["PENDING", "DRAFT"]
}
```

## Timing

### AFTER (Standard)
Workflow wird **nach** der Action gestartet.

**Verwendung:** Benachrichtigungen, Audit-Trail, Follow-up Actions

**Beispiel:** Rechnung wurde versendet → Manager benachrichtigen

### BEFORE
Workflow wird **vor** der Action gestartet.

**Verwendung:** Genehmigungen, Validierungen

**Beispiel:** Bestellung soll angelegt werden → Erst Manager genehmigen

⚠️ **Hinweis:** BEFORE-Trigger blockieren die Hauptaktion nicht automatisch. Dies muss in der Business-Logik implementiert werden.

### INSTEAD
Workflow **ersetzt** die Action.

**Verwendung:** Custom Logic, Alternative Prozesse

⚠️ **Selten verwendet**

## Admin UI (zukünftig)

Die Admin-UI für Actions und Triggers kann später implementiert werden mit:

### Actions-Übersicht
- Liste aller System Actions
- Filter nach Kategorie
- Anzahl aktiver Triggers pro Action
- Statistics (Erfolgsrate, Durchschnittliche Zeit)

### Trigger-Management
- Workflows mit Actions verknüpfen
- Bedingungen visuell editieren
- Prioritäten setzen
- Aktivieren/Deaktivieren

### Logs & Monitoring
- Action-Ausführungen in Echtzeit
- Fehler-Dashboard
- Performance-Metriken

## Testing

### Manuell testen via API

```bash
POST http://localhost:3001/api/actions/invoice.sent/trigger
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "context": {
    "entityType": "INVOICE",
    "entityId": "test-invoice-123",
    "entityData": {
      "totalAmount": 10000,
      "status": "SENT",
      "customer": {
        "name": "Test GmbH"
      }
    }
  },
  "timing": "AFTER"
}
```

Response:
```json
{
  "success": true,
  "workflows": [
    {
      "id": "workflow-instance-uuid",
      "workflowId": "workflow-uuid",
      "status": "IN_PROGRESS"
    }
  ],
  "executionTime": 234
}
```

### Logs prüfen

```bash
GET http://localhost:3001/api/actions/logs?actionKey=invoice.sent&limit=10
Authorization: Bearer <admin-token>
```

### Statistics prüfen

```bash
GET http://localhost:3001/api/actions/statistics?actionKey=invoice.sent
Authorization: Bearer <admin-token>
```

## Troubleshooting

### ❌ Workflow wird nicht gestartet

**1. Action existiert?**
```bash
GET /api/actions/invoice.sent
```

**2. Trigger aktiv?**
```bash
GET /api/actions/invoice.sent/triggers
```

**3. Bedingung erfüllt?**
- Prüfe Context-Daten im Log
- Teste mit `GET /api/actions/logs`

**4. Workflow aktiv?**
```bash
GET /api/workflows/:workflowId
```

### ❌ Fehler beim Triggern

Prüfe Error-Logs:
```bash
GET /api/actions/logs?success=false&limit=10
```

Typische Fehler:
- Entity nicht gefunden (entityId falsch)
- Workflow nicht gefunden (workflowId falsch)
- Context-Daten fehlerhaft

## Best Practices

✅ **Do:**
- Actions nach Konvention benennen (`module.action`)
- Context vollständig mitgeben (entityType, entityId, entityData)
- Bedingungen sinnvoll einsetzen (Performance)
- Prioritäten nutzen (wichtige Workflows zuerst)
- Logs regelmäßig prüfen

❌ **Don't:**
- Zu viele Trigger pro Action (Performance)
- Komplexe Bedingungen (besser im Workflow)
- BEFORE ohne Business-Logic-Anpassung
- System Actions löschen

## Migration

Bestehende Template-gebundene Workflows bleiben funktionsfähig!

**Optional:** Konvertiere Template-Workflows zu Action-Triggers:

```typescript
// Vorher: Template-Workflow
await workflowService.linkWorkflowToTemplate(templateId, workflowId, 1);

// Nachher: Action-Trigger (flexibler)
await actionService.createWorkflowTrigger({
  workflowId: workflowId,
  actionKey: 'invoice.sent',
  timing: 'AFTER'
});
```

Beide Ansätze können parallel verwendet werden.

## Zusammenfassung

🎯 **Problem gelöst:**
- ✅ Workflows auf beliebige System-Events triggern
- ✅ Flexible Bedingungen (Betrag, Status, etc.)
- ✅ Vollautomatisch
- ✅ Audit-Trail inklusive

🚀 **Nächste Schritte:**
1. System Actions seeden (`POST /api/actions/seed`)
2. Workflow erstellen
3. Trigger mit Bedingung erstellen
4. Testen!

📚 **Weitere Infos:**
- [Vollständige Dokumentation](./WORKFLOW_ACTION_SYSTEM.md)
- [Workflow System Docs](./WORKFLOW_APPROVAL_SYSTEM.md)
