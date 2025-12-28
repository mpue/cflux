# Workflow-System Dokumentation

## Übersicht

Das Workflow-System ermöglicht die Erstellung und Verwaltung von Genehmigungsworkflows für Rechnungen. Rechnungsvorlagen können ein oder mehrere Workflows zugeordnet werden, die sequentiell abgearbeitet werden müssen, bevor eine Rechnung freigegeben wird.

## Komponenten

### Backend

#### Database Schema
- **Workflow**: Hauptdefinition eines Workflows
  - name: Name des Workflows
  - description: Beschreibung
  - definition: JSON mit visueller Workflow-Definition
  - isActive: Aktiv/Inaktiv Status
  - steps: Workflow-Schritte

- **WorkflowStep**: Einzelne Schritte im Workflow
  - name: Name des Schrittes
  - type: APPROVAL | NOTIFICATION | CONDITION | DELAY
  - order: Reihenfolge im Workflow
  - approverUserIds: JSON-Array mit Benutzer-IDs (für APPROVAL)
  - approverGroupIds: JSON-Array mit Gruppen-IDs (für APPROVAL)
  - requireAllApprovers: Boolean - alle Genehmiger erforderlich
  - config: JSON mit zusätzlicher Konfiguration

- **InvoiceTemplateWorkflow**: Verknüpfung zwischen Rechnungsvorlagen und Workflows
  - invoiceTemplateId: ID der Rechnungsvorlage
  - workflowId: ID des Workflows
  - order: Reihenfolge der Workflows (für sequentielle Abarbeitung)
  - isActive: Aktiv/Inaktiv Status

- **WorkflowInstance**: Instanz eines Workflows für eine bestimmte Rechnung
  - workflowId: Referenz zum Workflow
  - invoiceId: Referenz zur Rechnung
  - status: PENDING | IN_PROGRESS | COMPLETED | REJECTED | CANCELLED
  - currentStepId: Aktueller Workflow-Schritt
  - startedAt: Startzeitpunkt
  - completedAt: Endzeitpunkt

- **WorkflowInstanceStep**: Status einzelner Schritte in einer Workflow-Instanz
  - instanceId: Referenz zur Workflow-Instanz
  - stepId: Referenz zum Workflow-Schritt
  - status: PENDING | APPROVED | REJECTED | SKIPPED
  - approvedById: ID des genehmigenden Benutzers
  - approvedAt: Genehmigungszeitpunkt
  - comment: Kommentar zur Genehmigung/Ablehnung

#### API Endpoints

**Workflows**
- `POST /api/workflows` - Workflow erstellen
- `GET /api/workflows` - Alle Workflows abrufen
- `GET /api/workflows/:id` - Einzelnen Workflow abrufen
- `PUT /api/workflows/:id` - Workflow aktualisieren
- `DELETE /api/workflows/:id` - Workflow löschen

**Workflow Steps**
- `POST /api/workflows/:workflowId/steps` - Schritt hinzufügen
- `PUT /api/workflows/steps/:id` - Schritt aktualisieren
- `DELETE /api/workflows/steps/:id` - Schritt löschen

**Template-Workflow Links**
- `POST /api/workflows/template-links` - Workflow zu Vorlage zuordnen
- `DELETE /api/workflows/template-links/:templateId/:workflowId` - Zuordnung entfernen
- `GET /api/workflows/templates/:templateId` - Workflows einer Vorlage abrufen

**Workflow Instances**
- `GET /api/workflows/invoices/:invoiceId/instances` - Workflow-Instanzen einer Rechnung
- `POST /api/workflows/instances/steps/:instanceStepId/approve` - Schritt genehmigen
- `POST /api/workflows/instances/steps/:instanceStepId/reject` - Schritt ablehnen
- `GET /api/workflows/invoices/:invoiceId/check-approval` - Prüfen, ob Rechnung freigegeben werden kann

#### Services

**workflow.service.ts**
- CRUD-Operationen für Workflows und Schritte
- Verwaltung von Template-Workflow-Verknüpfungen
- Workflow-Instanz-Management
- Genehmigungs-/Ablehnungslogik
- Prüfung des Freigabe-Status

### Frontend

#### Komponenten

**WorkflowsTab** (`components/admin/WorkflowsTab.tsx`)
- Übersicht aller Workflows
- Erstellen, Bearbeiten, Löschen von Workflows
- Aktivieren/Deaktivieren von Workflows
- Card-basierte Ansicht mit Status-Informationen

**WorkflowEditor** (`components/admin/WorkflowEditor.tsx`)
- Formular zum Erstellen/Bearbeiten von Workflows
- Verwaltung von Workflow-Schritten
- Auswahl von Genehmigern
- Konfiguration der Schritttypen

**workflow.service.ts** (`services/workflow.service.ts`)
- API-Client für alle Workflow-Operationen
- TypeScript-Interfaces für Typsicherheit

## Workflow-Typen

### APPROVAL (Genehmigung)
- Erfordert explizite Genehmigung durch ausgewählte Benutzer
- Konfigurierbar: alle Genehmiger oder einer reicht aus
- Benutzer- oder Gruppenbasiert

### NOTIFICATION (Benachrichtigung)
- Sendet Benachrichtigung an ausgewählte Benutzer
- Keine Genehmigung erforderlich
- Workflow läuft automatisch weiter

### CONDITION (Bedingung)
- Prüft definierte Bedingungen
- Workflow verzweigt basierend auf Ergebnis
- Konfiguration über JSON

### DELAY (Verzögerung)
- Wartet für definierte Zeit
- Nützlich für automatische Eskalationen
- Konfiguration über JSON (z.B. `{"days": 3}`)

## Workflow-Ablauf

1. **Erstellung**: Workflow wird im Admin-Dashboard erstellt
2. **Zuordnung**: Workflow wird einer Rechnungsvorlage zugeordnet
3. **Aktivierung**: Wenn Rechnung basierend auf Vorlage erstellt wird
4. **Instanziierung**: Workflow-Instanz wird für Rechnung erstellt
5. **Ausführung**: Schritte werden sequentiell abgearbeitet
6. **Genehmigung**: Benutzer genehmigen oder lehnen Schritte ab
7. **Abschluss**: Workflow ist vollständig, Rechnung kann freigegeben werden

## Berechtigungen

Das Workflow-System ist in das bestehende Modul-Berechtigungssystem integriert:
- Module-Key: `workflows`
- Route: `/workflows`
- Icon: 🔄
- Zugriff über `hasModuleAccess('workflows')`

## Status-Codes

### WorkflowInstanceStatus
- `PENDING`: Noch nicht gestartet
- `IN_PROGRESS`: In Bearbeitung
- `COMPLETED`: Erfolgreich abgeschlossen
- `REJECTED`: Abgelehnt
- `CANCELLED`: Abgebrochen

### WorkflowStepStatus
- `PENDING`: Wartet auf Genehmigung
- `APPROVED`: Genehmigt
- `REJECTED`: Abgelehnt
- `SKIPPED`: Übersprungen (z.B. bei Bedingungen)

## Verwendung

### Workflow erstellen

1. Im Admin-Dashboard zu "Workflows" navigieren
2. "Neuer Workflow" klicken
3. Name und Beschreibung eingeben
4. Schritte hinzufügen:
   - Name des Schritts
   - Typ auswählen
   - Bei APPROVAL: Genehmiger auswählen
   - Reihenfolge anpassen (Pfeile ⬆️⬇️)
5. Speichern

### Workflow zu Rechnungsvorlage zuordnen

**Hinweis**: Diese Funktionalität muss noch in der InvoiceTemplatesTab-Komponente integriert werden.

Geplante Implementierung:
1. Rechnungsvorlage öffnen
2. "Workflows"-Tab auswählen
3. Verfügbare Workflows anzeigen
4. Workflows zuordnen und Reihenfolge festlegen
5. Speichern

### Rechnung genehmigen

**Hinweis**: Diese Funktionalität muss noch in der Rechnungs-Detailansicht integriert werden.

Geplante Implementierung:
1. Rechnung öffnen
2. Workflow-Status anzeigen
3. Aktuelle Workflow-Instanzen und deren Schritte anzeigen
4. Genehmigen/Ablehnen-Buttons für berechtigte Benutzer
5. Kommentar eingeben
6. Aktion bestätigen

## Zukünftige Erweiterungen

### Visueller Workflow-Editor
- Drag-and-Drop Interface
- Grafische Darstellung von Workflow-Schritten
- Verbindungen zwischen Schritten
- Empfohlene Library: ReactFlow oder similar

### Erweiterte Benachrichtigungen
- E-Mail-Benachrichtigungen bei Genehmigungsanfragen
- Push-Benachrichtigungen
- Reminder für ausstehende Genehmigungen

### Workflow-Templates
- Vordefinierte Workflow-Vorlagen
- Import/Export von Workflows
- Workflow-Bibliothek

### Eskalations-Management
- Automatische Eskalation bei Zeitüberschreitung
- Vertretungs-Management
- Urlaubsvertretung

### Analytics & Reporting
- Workflow-Statistiken
- Durchlaufzeiten
- Engpässe identifizieren
- Genehmigungsraten

### Bedingte Workflows
- Dynamische Workflow-Auswahl basierend auf:
  - Rechnungsbetrag
  - Kunde
  - Projekt
  - Standort

### Parallele Genehmigungen
- Mehrere Schritte gleichzeitig
- UND/ODER-Verknüpfungen
- Komplexere Workflow-Strukturen

## Technische Details

### JSON-Format für Workflow-Definition

```json
{
  "steps": [
    {
      "id": "step-1",
      "name": "Manager Genehmigung",
      "type": "APPROVAL",
      "order": 1,
      "approverUserIds": ["user-id-1", "user-id-2"],
      "requireAllApprovers": false
    },
    {
      "id": "step-2",
      "name": "CFO Genehmigung",
      "type": "APPROVAL",
      "order": 2,
      "approverUserIds": ["cfo-user-id"],
      "requireAllApprovers": true
    }
  ]
}
```

### Datenbank-Indizes

Wichtige Indizes für Performance:
- `Workflow_name_idx` - Suche nach Namen
- `WorkflowStep_workflowId_order_idx` - Sortierung der Schritte
- `InvoiceTemplateWorkflow_invoiceTemplateId_idx` - Template-Zuordnungen
- `WorkflowInstance_invoiceId_idx` - Rechnungs-Workflows
- `WorkflowInstanceStep_instanceId_idx` - Instanz-Schritte

## Wartung

### Datenbank-Migration

```bash
docker exec -it timetracking-backend npx prisma migrate dev --name add_workflow_system
```

### Backup

Workflows sind in der regulären Datenbank-Backup-Strategie enthalten.

### Monitoring

Überwachen Sie:
- Anzahl aktiver Workflow-Instanzen
- Durchschnittliche Bearbeitungszeit
- Anzahl abgelehnter Workflows
- Hängende Workflows (ohne Fortschritt)

## Fehlerbehebung

### Workflow kann nicht gelöscht werden
- Prüfen Sie, ob der Workflow von Rechnungsvorlagen verwendet wird
- Entfernen Sie zuerst alle Verknüpfungen

### Genehmigung funktioniert nicht
- Prüfen Sie Benutzerberechtigungen
- Überprüfen Sie, ob Benutzer als Genehmiger definiert ist
- Prüfen Sie Workflow-Instanz-Status

### Rechnung kann nicht freigegeben werden
- Prüfen Sie Status aller Workflow-Instanzen
- Überprüfen Sie, ob alle Schritte genehmigt sind
- Prüfen Sie auf abgelehnte Workflows

## Support

Bei Problemen:
1. Prüfen Sie Browser-Konsole auf Fehler
2. Überprüfen Sie Backend-Logs: `docker logs timetracking-backend`
3. Prüfen Sie Datenbankzustand
4. Kontaktieren Sie den Administrator
