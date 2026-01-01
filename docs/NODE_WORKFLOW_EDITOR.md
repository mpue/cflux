# Node-basierter Workflow-Editor

## Übersicht

Der Workflow-Editor wurde zu einem vollwertigen grafischen, node-basierten Editor umgebaut, der eine intuitive visuelle Gestaltung von Workflows ermöglicht.

## Features

### 1. **Drag & Drop Interface**
- Workflow-Schritte können per Drag & Drop aus der Palette in den Editor gezogen werden
- Nodes können frei im Canvas positioniert werden
- Verbindungen zwischen Nodes werden visuell durch Pfeile dargestellt

### 2. **Verfügbare Node-Typen**

#### Start (🚀)
- **Automatischer Einstiegspunkt** für jeden Workflow
- Wird automatisch bei der Erstellung eines neuen Workflows hinzugefügt
- Kann nicht gelöscht werden
- Ausgabe: Ein Pfad zum ersten Workflow-Schritt

#### Genehmigung (✅)
- Genehmigung durch einen oder mehrere Benutzer
- Konfiguration: Auswahl von Genehmigern, Option "Alle erforderlich"
- Ausgabe: Ein Pfad nach Genehmigung

#### E-Mail (📧)
- Versenden von E-Mails an bestimmten Punkten im Workflow
- Konfiguration:
  - Empfänger-Auswahl (Benutzer)
  - Betreff
  - Nachrichtentext
- Ausgabe: Ein Pfad nach erfolgreichem Versand

#### Datumsbedingung (📅)
- Vergleich von Datumsfeldern
- Konfiguration:
  - Feld: Rechnungsdatum, Fälligkeitsdatum, Erstellungsdatum
  - Operator: größer als, kleiner als, gleich, zwischen
  - Vergleichstyp: 
    - Relativ (Tage): z.B. "älter als 30 Tage"
    - Absolut: konkretes Datum
- Ausgabe: Zwei Pfade (true/false)

#### Wertbedingung (💰)
- Vergleich von numerischen Werten
- Konfiguration:
  - Feld: Gesamtbetrag, Nettobetrag, Steuerbetrag, Rabatt
  - Operator: größer als, kleiner als, gleich, größer/gleich, kleiner/gleich, zwischen
  - Wert: Vergleichswert in CHF
- Ausgabe: Zwei Pfade (true/false)
- Beispiel: "Gesamtbetrag > CHF 10'000" → dann Manager-Genehmigung erforderlich

#### Allgemeine Bedingung (❓)
- Flexible Bedingungsprüfung mit Ausdrücken
- Konfiguration: 
  - **Ausdruck**: Mathematischer Ausdruck mit `x` als Input-Variable
  - Beispiele: `x > 1000`, `x <= 500`, `x == 0`, `x != 100`
  - `x` entspricht dem Gesamtbetrag der Rechnung bzw. dem Betrag der Reisekosten
- Ausgabe: 
  - **Ausgang A (true)**: Wenn der Ausdruck `true` ergibt
  - **Ausgang B (false)**: Wenn der Ausdruck `false` ergibt
- Beispiel: "x > 10000" → Ausgang A für Beträge über CHF 10'000, sonst Ausgang B

#### Logik-Verknüpfung (🔀)
- UND/ODER-Verknüpfung mehrerer Bedingungen
- Konfiguration:
  - UND: Alle verbundenen Bedingungen müssen erfüllt sein
  - ODER: Eine der verbundenen Bedingungen muss erfüllt sein
- Eingabe: Zwei Pfade (input1, input2)
- Ausgabe: Ein Pfad (Ergebnis der Verknüpfung)

#### Verzögerung (⏱️)
- Zeitverzögerung im Workflow
- Konfiguration:
  - Einheit: Minuten, Stunden, Tage
  - Dauer: Anzahl
- Beispiel: "Warte 24 Stunden bevor Mahnung gesendet wird"

#### Benachrichtigung (🔔)
- Benachrichtigung an Benutzer
- Konfiguration:
  - Empfänger (Benutzer-Auswahl)
  - Nachricht
- Ausgabe: Ein Pfad

#### Ende (🏁)
- **Workflow-Endpunkt** (optional)
- Markiert das Ende eines Workflow-Pfades
- Kann per Drag & Drop hinzugefügt werden
- Eingabe: Ein Pfad (kein Ausgang)

## Bedienung

### Workflow erstellen

1. **Navigation**: Admin Dashboard → Workflows → "Neuer Workflow"
Start-Node**:
   - Wird automatisch beim Erstellen eines neuen Workflows hinzugefügt
   - Positioniert sich oben in der Mitte des Canvas
   - **Alle Workflows müssen hier beginnen**

4. **
2. **Grundeinstellungen**:
   - Workflow-Name eingeben
   - Optional: Beschreibung hinzufügen
   - Status: Aktiv/Inaktiv

3. **Nodes hinzufügen**:
   - Node aus der linken Palette auswählen
   - Per Drag & Drop in den Canvas ziehen
   - Node wird an der Drop-Position platziert

4. **Nodes verbinden**:
   - Auf einen Output-Handle (unterer Punkt) eines Nodes klicken
   - Linie zum Input-Handle (oberer Punkt) des Ziel-Nodes ziehen
   - Verbindung wird automatisch erstellt

5. **Node konfigurieren**:
   - Node im Canvas anklicken
   - Eigenschaften-Panel rechts öffnet sich
   - Konfiguration anpassen:
     - Name
     - Spezifische Einstellungen (je nach Node-Typ)
   - Änderungen werden automatisch gespeichert

6. **Node löschen**:
   - Node anklicken
   - Im Eigenschaften-Panel auf "Node löschen" klicken
   - Bestätigung erforderlich

7. **Workflow speichern**:
   - Oben rechts auf "Speichern" klicken
   - Workflow wird validiert und gespeichert

### Na 🚀] → [Genehmigung: Manager] → [Ende 🏁]
```

### Beispiel 2: Betragsabhängiger Workflow
```
[Start 🚀] 
  → [Wertbedingung: Betrag > CHF 5'000]
      ├─ true → [Genehmigung: Geschäftsführung] → [Ende 🏁]
      └─ false → [Genehmigung: Abteilungsleiter] → [Ende 🏁]
```

### Beispiel 3: Workflow mit E-Mail-Benachrichtigung
```
[Start 🚀] 
  → [Genehmigung: Manager] 
  → [E-Mail: Buchhaltung benachrichtigen]
  → [Verzögerung: 1 Tag]
  → [E-Mail: Erinnerung an Zahlung]
  → [Ende 🏁]
```

### Beispiel 4: Komplexer Workflow mit mehreren Bedingungen
```
[Start 🚀]
  → [Datumsbedingung: Rechnungsdatum > 30 Tage]
      ├─ true → [E-Mail: Mahnung] → [Ende 🏁]
      └─ false → [Wertbedingung: Betrag > CHF 10'000]
          ├─ true → [Genehmigung: Geschäftsführung + CFO] → [Ende 🏁]
          └─ false → [Genehmigung: Abteilungsleiter] → [Ende 🏁]
```

### Beispiel 5: Logische Verknüpfungen
```
[Start 🚀]
  → [Datumsbedingung: Rechnungsdatum < 7 Tage] ──┐
  → [Wertbedingung: Betrag < CHF 1'000] ─────────┤
                                                   │
  → [Logik: UND] ←────────────────────────────────┘
      ├─ true → [Auto-Genehmigung] → [Ende 🏁]
      └─ false → [Genehmigung: Manager] → [Ende 🏁

### Beispiel 5: Logische Verknüpfungen
```
[Start]
  → [Datumsbedingung: Rechnungsdatum < 7 Tage] ──┐
  → [Wertbedingung: Betrag < CHF 1'000] ─────────┤
                                                   │
  → [Logik: UND] ←────────────────────────────────┘
      ├─ true → [Auto-Genehmigung]
      └─ false → [Genehmigung: Manager]
  → [Ende]
```

## Backend-Erweiterungen

### Neue Node-Typen in der Datenbank

Die folgenden Node-Typen wurden hinzugefügt:

```typescript
enum WorkflowStepType {
  APPROVAL          // Genehmigung durch Benutzer/Gruppe
  NOTIFICATION      // Benachrichtigung
  CONDITION         // Bedingung prüfen
  DELAY             // Zeitverzögerung
  EMAIL             // E-Mail senden
  DATE_CONDITION    // Datumsvergleich
  VALUE_CONDITION   // Wertvergleich (Beträge, Zahlen)
  TEXT_CONDITION    // Textvergleich
  LOGIC_AND         // UND-Verknüpfung
  LOGIC_OR          // ODER-Verknüpfung
}
```

### Workflow-Definition-Format

Die Workflow-Definition wird als JSON gespeichert:

```json
{
  "nodes": [
    {
      "id": "approval_1234567890",
      "type": "approval",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "✅ Genehmigung",
        "config": {
          "name": "Manager Genehmigung",
          "approverUserIds": ["user-id-1", "user-id-2"],
          "requireAllApprovers": false
        }
      }
    },
    {
      "id": "email_1234567891",
      "type": "email",
      "position": { "x": 100, "y": 250 },
      "data": {
        "label": "📧 E-Mail",
        "config": {
          "name": "Benachrichtigung senden",
          "recipients": ["user@example.com"],
          "subject": "Rechnung genehmigt",
          "body": "Die Rechnung wurde genehmigt."
        }
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "approval_1234567890",
      "target": "email_1234567891"
    }
  ]
}
```

## Node-Konfigurationen

### Approval Node
```typescript
{
  name: string;
  approverUserIds: string[];
  requireAllApprovers: boolean;
}
```

### Email Node
```typescript
{
  name: string;
  recipients: string[];  // E-Mail-Adressen
  subject: string;
  body: string;
  template?: string;     // Optional: Template-Name
}
```

### Date Condition Node
```typescript
{
  name: string;
  field: 'invoiceDate' | 'dueDate' | 'createdAt';
  operator: 'greater' | 'less' | 'equals' | 'between';
  compareType: 'relative' | 'absolute';
  relativeDays?: number;        // Für relative Vergleiche
  absoluteDate?: string;        // Für absolute Vergleiche (ISO-Format)
}
```

### Value Condition Node
```typescript
{
  name: string;
  field: 'totalAmount' | 'netAmount' | 'taxAmount' | 'discountAmount';
  operator: 'greater' | 'less' | 'equals' | 'greaterOrEqual' | 'lessOrEqual' | 'between';
  value: number;
}
```

### Delay Node
```typescript
{
  name: string;
  delayType: 'minutes' | 'hours' | 'days';
  delayValue: number;
}
```

### Logic Node
```typescript
{
  name: string;
  logicType: 'AND' | 'OR';
}
```

## Technische Details

### Frontend-Technologien
- **React Flow**: Node-basierter Editor
- **React**: UI-Framework
- **TypeScript**: Typsicherheit

### Komponenten-Struktur
```
frontend/src/components/admin/
├── NodeBasedWorkflowEditor.tsx       # Haupt-Editor-Komponente
├── NodeBasedWorkflowEditor.css       # Editor-Styles
└── nodes/
    ├── ApprovalNode.tsx              # Genehmigungsnode
    ├── EmailNode.tsx                 # E-Mail-Node
    ├── DateConditionNode.tsx         # Datumsbedingungsnode
    ├── ValueConditionNode.tsx        # Wertbedingungsnode
    ├── ConditionNode.tsx             # Allgemeine Bedingung
    ├── DelayNode.tsx                 # Verzögerungsnode
    ├── NotificationNode.tsx          # Benachrichtigungsnode
    ├── LogicNode.tsx                 # Logik-Verknüpfung
    └── CustomNodes.css               # Node-Styles
```

## Migration

Die Datenbank-Migration wurde automatisch durchgeführt:
```
npx prisma migrate dev --name add_workflow_node_types
```

Bestehende Workflows bleiben kompatibel, da das `definition`-Feld flexibel JSON speichert.

## Zukünftige Erweiterungen

Mögliche zukünftige Features:
- **Start/End Nodes**: Dedizierte Start- und End-Nodes
- **Parallel Execution**: Parallele Ausführung von Branches
- **Sub-Workflows**: Verschachtelte Workflows
- **Custom Actions**: Benutzerdefinierte Aktionen (API-Calls, etc.)
- **Template-System**: Vordefinierte Workflow-Templates
- **Simulation**: Test-Modus zum Simulieren von Workflows
- **Versionierung**: Workflow-Versionen und Rollback
- **Analytics**: Workflow-Performance und Engpässe analysieren

## Fehlerbehebung

### Node lässt sich nicht verbinden
- Überprüfen Sie, ob Sie von einem Output-Handle (unten) zu einem Input-Handle (oben) verbinden
- Einige Nodes haben mehrere Handles (z.B. Bedingungen mit true/false)

### Workflow lässt sich nicht speichern
- Mindestens ein Node muss vorhanden sein
- Workflow-Name darf nicht leer sein
- Überprüfen Sie alle Node-Konfigurationen auf Vollständigkeit

### Performance-Probleme bei großen Workflows
- Nutzen Sie die Mini-Map zur Navigation
- Verwenden Sie die Zoom-Funktion
- Gruppieren Sie verwandte Nodes nahe beieinander

## Support

Bei Fragen oder Problemen:
1. Überprüfen Sie diese Dokumentation
2. Schauen Sie sich die Beispiele an
3. Kontaktieren Sie den Support

---

**Version**: 1.0  
**Datum**: 27. Dezember 2025  
**Autor**: cflux Development Team
