# Intranet Drag-and-Drop Dokumentation

## Übersicht

Das Intranet-Modul unterstützt jetzt **Drag-and-Drop** zum intuitiven Verschieben von Dokumenten und Ordnern innerhalb der Baumstruktur.

## Implementierung

### Technologie
- **@dnd-kit** - Moderne, performante React Drag-and-Drop Bibliothek
  - `@dnd-kit/core` - Kern-Funktionalität
  - `@dnd-kit/sortable` - Sortier-Utilities
  - `@dnd-kit/utilities` - Helper-Funktionen

### Komponenten

#### 1. DraggableTreeNode (`frontend/src/components/DraggableTreeNode.tsx`)
Wiederverwendbare Komponente für draggable/droppable Tree-Nodes.

**Features:**
- Kombiniert `useDraggable` und `useDroppable` Hooks
- Visuelles Feedback während des Ziehens
- Highlight des Drop-Targets
- Unterstützt Ordner und Dokumente
- Nur aktiv wenn `canEdit` Permission vorhanden

**Props:**
```typescript
interface DraggableTreeNodeProps {
  node: DocumentNode;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  isDraggedOver: boolean;
  onToggleFolder: (e: React.MouseEvent) => void;
  onNodeClick: () => void;
  onMenuClick: (e: React.MouseEvent<HTMLElement>) => void;
  canEdit: boolean;
}
```

#### 2. IntranetPage - Drag-and-Drop Integration

**Neue State-Variablen:**
```typescript
const [activeId, setActiveId] = useState<string | null>(null);
const [overId, setOverId] = useState<string | null>(null);
const [draggedNode, setDraggedNode] = useState<DocumentNode | null>(null);
```

**Sensor-Konfiguration:**
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Minimum 8px Bewegung zum Start
    },
  })
);
```
- Verhindert ungewolltes Drag bei normalen Klicks
- Aktiviert Drag nur bei mindestens 8px Mausbewegung

### Drag-and-Drop Logik

#### handleDragStart
```typescript
const handleDragStart = (event: DragStartEvent) => {
  const { active } = event;
  setActiveId(active.id as string);
  const node = findNodeById(tree, active.id as string);
  setDraggedNode(node);
};
```
- Speichert ID und Daten der gezogenen Node
- Triggert visuelle Änderungen (Opacity, Cursor)

#### handleDragOver
```typescript
const handleDragOver = (event: DragOverEvent) => {
  const { over } = event;
  setOverId(over?.id as string | null);
};
```
- Erkennt über welcher Node sich der Cursor befindet
- Aktiviert visuelles Highlight des potenziellen Drop-Ziels

#### handleDragEnd
```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  
  // Validierung
  if (!over || active.id === over.id) return;
  
  // Zirkuläre Referenzen verhindern
  if (draggedNode.type === 'FOLDER') {
    // Prüfe ob Ziel-Node ein Kind des gezogenen Ordners ist
    let checkNode = targetNode;
    while (checkNode) {
      if (checkNode.id === draggedNodeId) {
        setError('Ordner kann nicht in sich selbst verschoben werden');
        return;
      }
      checkNode = checkNode.parentId ? findNodeById(tree, checkNode.parentId) : null;
    }
  }
  
  // Drop-Logik
  let newParentId: string | null | undefined;
  if (targetNode.type === 'FOLDER') {
    newParentId = targetNodeId; // Drop IN den Ordner
  } else {
    newParentId = targetNode.parentId; // Drop neben Dokument (gleicher Parent)
  }
  
  // API Call
  await documentNodeService.move(draggedNodeId, { newParentId });
  await loadTree(); // Tree neu laden
};
```

**Wichtige Validierungen:**
1. ✅ Keine Selbst-Referenz (Node auf sich selbst droppen)
2. ✅ Keine zirkuläre Referenz (Ordner in eigenes Kind)
3. ✅ Permission-Check (nur mit WRITE-Berechtigung)

### DragOverlay

Zeigt Preview der gezogenen Node während des Drags:

```typescript
<DragOverlay dropAnimation={null}>
  {activeId && draggedNode ? (
    <Box sx={{ /* Preview-Styling */ }}>
      {/* Icon + Titel */}
    </Box>
  ) : null}
</DragOverlay>
```

- Folgt dem Cursor während des Ziehens
- Zeigt Ordner/Dokument-Icon und Titel
- Box Shadow für 3D-Effekt

## Visuelles Feedback

### 1. Dragging State
- **Node während Drag**: `opacity: 0.5`, `cursor: grabbing`
- **Drag-Preview**: Folgt Cursor mit Box-Shadow

### 2. Drop-Target Highlighting
```css
bgcolor: isOver || isDraggedOver ? 'primary.light' : 'transparent'
border: '2px dashed'
borderColor: 'primary.main'
```

### 3. Cursor-Änderungen
- **Standard**: `cursor: grab`
- **Während Drag**: `cursor: grabbing`
- **Ohne Permission**: `cursor: pointer` (kein Drag)

### 4. Navigation-Hinweis
```typescript
<Typography variant="caption" display="block" color="text.secondary">
  Drag & Drop zum Verschieben
</Typography>
```
- Wird nur angezeigt wenn `canEditIntranet === true`

## Backend-Integration

### API Endpoint
```
POST /api/intranet/:id/move
```

**Request Body:**
```typescript
{
  newParentId?: string;  // null für Root-Level
  newOrder?: number;     // Optional, wird automatisch berechnet
}
```

**Backend-Validierungen:**
- ✅ Node existiert
- ✅ newParentId existiert und ist ein Ordner
- ✅ Keine zirkulären Referenzen
- ✅ User hat WRITE-Permission

**Response:**
```typescript
DocumentNode // Updated node mit neuen Daten
```

## Service-Methode

`frontend/src/services/documentNode.service.ts`:
```typescript
move: async (id: string, data: MoveDocumentNodeData): Promise<DocumentNode> => {
  const response = await api.post(`/intranet/${id}/move`, data);
  return response.data;
}
```

## Benutzer-Erfahrung

### Drag-Verhalten

1. **Dokument ziehen**
   - Kann in jeden Ordner gedroppt werden
   - Wird zum Kind des Ziel-Ordners

2. **Ordner ziehen**
   - Kann in andere Ordner gedroppt werden
   - Kann auf Root-Level gedroppt werden
   - Kann NICHT in sich selbst oder eigene Kinder

3. **Drop auf Dokument**
   - Node wird neben das Dokument platziert (gleicher Parent)

### Aktivierung

- **Mit WRITE-Permission**: Drag & Drop aktiviert
- **Ohne Permission**: Normales Klick-Verhalten, kein Drag

### Aktivierungs-Schwelle
- Mindestens **8px Mausbewegung** erforderlich
- Verhindert ungewolltes Drag bei normalen Klicks
- Click-to-Select funktioniert weiterhin normal

## Performance-Überlegungen

### Optimierungen
1. **Sensor mit Aktivierungs-Constraint**
   - Reduziert unnötige Re-Renders
   - Verbessert Click-Responsiveness

2. **Collision Detection**
   - `closestCenter` Algorithmus
   - Effizient für Baum-Strukturen

3. **Tree Reload nach Move**
   - Lädt kompletten Tree nach API-Call
   - Stellt Konsistenz sicher
   - Erhält expanded-State für Ordner

## Erweiterte Features (zukünftig)

### Mögliche Erweiterungen

1. **Multi-Select Drag**
   - Mehrere Nodes gleichzeitig verschieben
   - Benötigt Selection-State

2. **Drag-and-Drop zwischen Listen**
   - Z.B. von Suchresultaten in Tree
   - Benötigt separate Droppable-Contexts

3. **Undo/Redo**
   - Action-History für Move-Operationen
   - "Verschieben rückgängig machen"

4. **Sortierung innerhalb Parent**
   - Präzise Order-Kontrolle per Drag
   - Zeigt Drop-Indicator zwischen Nodes

5. **Copy statt Move**
   - Mit Modifier-Key (Ctrl/Cmd)
   - Dupliziert Node an neuen Ort

## Testing

### Manuelle Test-Szenarien

✅ **Basis-Funktionalität**
- [ ] Dokument in Ordner ziehen
- [ ] Ordner in anderen Ordner ziehen
- [ ] Node auf Root-Level ziehen

✅ **Validierung**
- [ ] Ordner kann nicht in sich selbst gezogen werden
- [ ] Ordner kann nicht in eigenes Kind gezogen werden
- [ ] Drop ohne Permission wird verhindert

✅ **UI/UX**
- [ ] Drag-Preview erscheint
- [ ] Drop-Target wird gehighlightet
- [ ] Cursor ändert sich korrekt
- [ ] Error-Meldungen bei ungültigen Aktionen

✅ **Edge Cases**
- [ ] Drop auf sich selbst macht nichts
- [ ] Expanded-State bleibt nach Move erhalten
- [ ] Klick funktioniert trotz Drag-Sensor

## Fehlerbehebung

### Häufige Probleme

**Problem**: Drag startet nicht
- **Lösung**: `activationConstraint.distance` prüfen
- **Ursache**: Zu kurze Mausbewegung

**Problem**: Nodes werden nicht gehighlightet
- **Lösung**: `overId` State und `isDraggedOver` Prop prüfen
- **Ursache**: `handleDragOver` wird nicht aufgerufen

**Problem**: API-Error beim Drop
- **Lösung**: Backend-Logs prüfen, Permissions validieren
- **Ursache**: Zirkuläre Referenz oder fehlende Berechtigung

**Problem**: Tree aktualisiert sich nicht
- **Lösung**: `loadTree()` nach Move aufrufen
- **Ursache**: Tree-State nicht synchronisiert

## Zusammenfassung

Die Drag-and-Drop Implementierung bietet:
- ✅ Intuitive Node-Verschiebung
- ✅ Visuelles Feedback in Echtzeit
- ✅ Robuste Validierung (Client + Server)
- ✅ Permission-basierte Kontrolle
- ✅ Performante Umsetzung mit @dnd-kit
- ✅ Saubere Trennung von UI und Logik

**Entwicklungszeit**: ~4 Stunden
**LOC Added**: ~250 Zeilen (inkl. Komponente)
**Abhängigkeiten**: +4 npm packages (~100KB)
