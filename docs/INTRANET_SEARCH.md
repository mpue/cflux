# Intranet Search - Intelligente Suchfunktion

## Überblick

Das Intranet-Modul verfügt über eine intelligente Suchfunktion, die DocumentNodes, Attachments und Version durchsucht und nach Relevanz sortiert.

## Features

### 1. Volltext-Suche
- **DocumentNodes**: Suche in Titel und Inhalt
- **Attachments**: Suche in Dateinamen und Beschreibungen
- **Versionen**: Suche in Node-Versionen und Attachment-Versionen
- Case-insensitive Matching
- Respektiert Berechtigungen (Group Permissions)

### 2. Relevanz-Ranking
Die Suchergebnisse werden nach Relevanz sortiert:
- **Exakte Titel-Übereinstimmung**: +100 Punkte
- **Titel beginnt mit Suchterm**: +50 Punkte
- **Titel enthält Suchterm**: +30 Punkte
- **Jedes Vorkommen im Inhalt**: +5 Punkte
- **Typ-Bonus**:
  - Document Node: +20 Punkte
  - Attachment: +10 Punkte
  - Version: +5 Punkte

### 3. Snippet-Highlighting
- Zeigt Kontext um den gefundenen Suchterm (200 Zeichen)
- Markiert Suchterme mit `**bold**` Markup
- Frontend konvertiert zu `<mark>` HTML-Tags

### 4. Filter nach Typ
- Alle Ergebnisse
- Nur Dokumente
- Nur Anhänge
- Nur Versionen

### 5. Auto-Complete / Suggestions
- Schnelle Vorschläge während der Eingabe
- Limitiert auf Top-10 Ergebnisse
- Debounced Input (300ms)

## Backend-Implementierung

### API-Endpunkte

#### GET /api/document-nodes/search
Haupt-Suchendpunkt mit Relevanz-Ranking.

**Query-Parameter:**
```typescript
{
  query: string;      // Suchbegriff (min. 2 Zeichen)
  limit?: number;     // Max. Anzahl Ergebnisse (Standard: 50)
  type?: 'node' | 'attachment' | 'version';  // Optional: Filter nach Typ
}
```

**Response:**
```typescript
{
  query: string;
  total: number;
  results: SearchResult[];
}
```

**SearchResult:**
```typescript
{
  id: string;
  nodeId: string;
  type: 'node' | 'attachment' | 'version';
  title: string;
  snippet: string;
  relevance: number;
  path: string[];  // Breadcrumb-Pfad
  metadata: {
    createdAt: Date;
    createdBy: {
      firstName: string;
      lastName: string;
    };
    fileSize?: number;
    version?: number;
  };
}
```

#### GET /api/document-nodes/search/suggestions
Schnelle Auto-Complete Vorschläge.

**Query-Parameter:**
```typescript
{
  query: string;
  limit?: number;  // Standard: 10
}
```

**Response:**
```typescript
{
  query: string;
  suggestions: SearchSuggestion[];
}
```

**SearchSuggestion:**
```typescript
{
  id: string;
  nodeId: string;
  type: 'node' | 'attachment' | 'version';
  title: string;
}
```

### Controller-Logik

**Datei:** `backend/src/controllers/documentNodeSearch.controller.ts`

**Wichtige Funktionen:**
- `calculateRelevance()`: Berechnet Relevanz-Score
- `createSnippet()`: Erstellt Kontext-Snippet mit Highlighting
- `hasNodeAccess()`: Prüft Berechtigungen
- `getNodePath()`: Ermittelt Breadcrumb-Pfad

### Berechtigungen

Die Suche respektiert die Group-Permissions:
- Nur Nodes mit READ-Berechtigung werden zurückgegeben
- Attachments werden nur angezeigt, wenn User READ-Zugriff auf die Node hat
- Versionen werden nur angezeigt, wenn User READ-Zugriff auf die Node hat

## Frontend-Implementierung

### Komponenten

#### IntranetSearch
**Datei:** `frontend/src/components/IntranetSearch.tsx`

**Features:**
- Material-UI TextField mit debounced Input (300ms)
- Type-Filter mit ToggleButtonGroup
- Results als Dropdown-Paper
- Highlighting von Suchterms
- Breadcrumb-Anzeige
- Metadata (Autor, Datum, Dateigröße, Version)
- Icons basierend auf Typ

**Props:**
```typescript
{
  onResultClick: (nodeId: string) => void;
}
```

### Service

**Datei:** `frontend/src/services/documentNodeSearch.service.ts`

**API-Methoden:**
```typescript
search(query: string, limit?: number, type?: 'node' | 'attachment' | 'version'): Promise<SearchResponse>
getSuggestions(query: string, limit?: number): Promise<SuggestionsResponse>
```

**UI-Helper:**
```typescript
highlightText(text: string): string          // Konvertiert **bold** zu <mark>
getResultIcon(result: SearchResult): JSX.Element
getTypeLabel(result: SearchResult): string
formatFileSize(bytes: number): string
```

### Integration in IntranetPage

Die Suchkomponente ist oberhalb der Navigation/Content-Area integriert:

```tsx
<IntranetSearch 
  onResultClick={(nodeId) => {
    documentNodeService.getById(nodeId).then((node) => {
      handleNodeClick(node);
    });
  }} 
/>
```

Beim Klick auf ein Suchergebnis:
1. Node wird via API geladen
2. `handleNodeClick()` navigiert zur Node
3. Suchfeld wird geleert
4. Results-Dropdown wird geschlossen

## Verwendung

### Als User

1. **Suche starten:**
   - Mindestens 2 Zeichen im Suchfeld eingeben
   - Wartet 300ms (Debounce) bevor Suche startet

2. **Filter verwenden:**
   - "Alle" - Zeigt alle Typen
   - "Dokumente" - Nur DocumentNodes
   - "Anhänge" - Nur Attachments
   - "Versionen" - Nur Versionsverlauf

3. **Ergebnisse:**
   - Sortiert nach Relevanz (höchste zuerst)
   - Zeigt Breadcrumb-Pfad zur Orientierung
   - Highlighting zeigt Kontext des Treffers
   - Metadata zeigt Autor, Datum, Größe

4. **Navigation:**
   - Klick auf Ergebnis öffnet die Node im Editor
   - Suchfeld wird automatisch geleert

### Best Practices

**Suchbegriffe:**
- Verwende präzise Begriffe für bessere Ergebnisse
- Exakte Titel-Treffer haben höchste Priorität
- Mehrere Wörter werden als UND-Verknüpfung behandelt

**Filter:**
- Nutze Type-Filter um Ergebnisse einzugrenzen
- "Anhänge" findet auch Dateinamen und Descriptions
- "Versionen" durchsucht historische Inhalte

**Berechtigungen:**
- Du siehst nur Nodes mit READ-Berechtigung
- Wenn keine Group Permissions gesetzt: Alle sehen alles
- Admins haben immer Zugriff auf alle Inhalte

## Performance

### Optimierungen

1. **Debouncing:**
   - 300ms Verzögerung verhindert übermäßige API-Calls
   - Verbessert UX bei schneller Eingabe

2. **Limit:**
   - Standard: 50 Ergebnisse
   - Suggestions: 10 Ergebnisse
   - Reduziert Payload-Größe

3. **Indexierung:**
   - PostgreSQL nutzt case-insensitive `contains`
   - Prisma generiert effiziente WHERE-Clauses
   - Soft-Delete (`deletedAt: null`) bereits indexiert

### Skalierung

Für große Datenmengen (>10.000 Nodes):
- **PostgreSQL Full-Text Search** implementieren (`tsvector`, `tsquery`)
- **Elasticsearch** für komplexe Queries
- **Caching** für häufige Suchanfragen
- **Pagination** statt Limit

## Beispiele

### Suche nach "Budget"

**Request:**
```bash
GET /api/document-nodes/search?query=budget&limit=20
```

**Response:**
```json
{
  "query": "budget",
  "total": 5,
  "results": [
    {
      "id": "node-123",
      "nodeId": "node-123",
      "type": "node",
      "title": "Budget 2025",
      "snippet": "Das **Budget** für das Jahr 2025 wurde genehmigt...",
      "relevance": 135,
      "path": ["Finanzen", "Planung"],
      "metadata": {
        "createdAt": "2025-01-01T10:00:00Z",
        "createdBy": {
          "firstName": "Max",
          "lastName": "Mustermann"
        }
      }
    }
  ]
}
```

### Filter nach Attachments

**Request:**
```bash
GET /api/document-nodes/search?query=rechnung&type=attachment
```

**Response:**
```json
{
  "query": "rechnung",
  "total": 12,
  "results": [
    {
      "id": "att-456",
      "nodeId": "node-789",
      "type": "attachment",
      "title": "Rechnung_Januar_2025.pdf",
      "snippet": "**Rechnung** für Dienstleistungen im Januar 2025",
      "relevance": 60,
      "path": ["Rechnungen", "2025", "Januar"],
      "metadata": {
        "createdAt": "2025-01-15T14:30:00Z",
        "createdBy": {
          "firstName": "Anna",
          "lastName": "Schmidt"
        },
        "fileSize": 524288
      }
    }
  ]
}
```

## Testing

### Manuelle Tests

1. **Basic Search:**
   - Suche nach existierendem Begriff
   - Prüfe Relevanz-Sortierung
   - Prüfe Highlighting

2. **Type-Filter:**
   - Teste jeden Filter einzeln
   - Prüfe dass nur entsprechende Typen zurückkommen

3. **Permissions:**
   - Als User mit eingeschränkten Rechten
   - Prüfe dass nur erlaubte Nodes angezeigt werden

4. **Edge Cases:**
   - Leeres Suchfeld (< 2 Zeichen)
   - Sonderzeichen
   - Sehr lange Suchbegriffe
   - Keine Ergebnisse

### Automatisierte Tests

**TODO:** Integration Tests für Search-Controller:
```typescript
describe('DocumentNodeSearch', () => {
  it('should find nodes by title', async () => {
    // Test
  });
  
  it('should respect permissions', async () => {
    // Test
  });
  
  it('should calculate relevance correctly', async () => {
    // Test
  });
});
```

## Fehlerbehebung

### Keine Suchergebnisse

**Problem:** Suche findet keine Ergebnisse, obwohl Inhalt existiert.

**Lösungen:**
1. Prüfe Berechtigungen (Group Permissions)
2. Prüfe dass Suchbegriff mindestens 2 Zeichen hat
3. Prüfe dass Nodes nicht soft-deleted sind (`deletedAt`)
4. Backend-Logs prüfen: `docker logs timetracking-backend`

### Langsame Suche

**Problem:** Suche dauert mehrere Sekunden.

**Lösungen:**
1. Reduce Limit (z.B. 20 statt 50)
2. PostgreSQL Indizes prüfen
3. Datenbank-Performance analysieren
4. Caching implementieren

### Highlighting funktioniert nicht

**Problem:** Suchterme werden nicht hervorgehoben.

**Lösungen:**
1. Prüfe dass `**bold**` Markup vorhanden ist
2. Prüfe CSS für `<mark>` Tags
3. Browser-Console auf Fehler prüfen
4. `highlightText()` Funktion debuggen

## Zukünftige Erweiterungen

### Geplant
- [ ] Fuzzy Search (Tippfehler-Toleranz)
- [ ] Boolean Operators (AND, OR, NOT)
- [ ] Phrase Search ("exact phrase")
- [ ] Date Range Filter
- [ ] Author Filter
- [ ] File Type Filter (PDF, DOCX, etc.)
- [ ] Recent Searches (History)
- [ ] Saved Searches (Favorites)
- [ ] Search Analytics (Popular Queries)

### Technisch
- [ ] Elasticsearch Integration
- [ ] PostgreSQL Full-Text Search (`tsvector`)
- [ ] Search Result Caching (Redis)
- [ ] Pagination (Infinite Scroll)
- [ ] Export Search Results (CSV, Excel)
- [ ] Advanced Query Builder UI

## Verwandte Dokumentation

- [INTRANET.md](./INTRANET.md) - Intranet Module Übersicht
- [INTRANET_ATTACHMENTS.md](./INTRANET_ATTACHMENTS.md) - Attachment System
- [MODULE_PERMISSIONS.md](./MODULE_PERMISSIONS.md) - Berechtigungssystem
- [API_REFERENCE.md](./API_REFERENCE.md) - Alle API-Endpunkte

## Changelog

### 2026-01-06
- ✅ Initial Implementation
- ✅ Search Controller mit Relevanz-Ranking
- ✅ Frontend Search Component
- ✅ Type-Filter (All, Documents, Attachments, Versions)
- ✅ Snippet Highlighting
- ✅ Permission Filtering
- ✅ Breadcrumb Paths
- ✅ Integration in IntranetPage
- ✅ Dokumentation erstellt
