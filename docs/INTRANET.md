# cflux Modul #22: Intranet & Document Management

## Übersicht
Generisches Document-Tree-System mit typbasierten Knoten und gruppenbasierter Zugriffskontrolle.
Initiale Nutzung: Intranet, später erweiterbar für Wiki, Knowledge Base, etc.

## Anforderungen

### Funktional
- Tree-Struktur für hierarchische Dokument-Organisation
- Typ-System für verschiedene Dokumentarten
- Gruppenbasierte Rechteverwaltung pro Knoten
- WYSIWYG-Editor mit Markdown-Backend für Content-Erstellung
- Lesbare Darstellung für normale User
- Admin-Interface zum Strukturaufbau und Rechtevergabe

### Technisch
- Integration in bestehende cflux-Architektur
- Generisches DocumentNode-Modell mit Type-System
- Nutzung vorhandener Benutzer- und Gruppenmodelle
- SQLAlchemy Models mit Optional Polymorphic Inheritance
- React Frontend mit TipTap Editor
- react-markdown für Content-Rendering

## Datenmodell

### DocumentNode (Basis-Modell)
```python
class DocumentNode(Base):
    __tablename__ = 'document_nodes'
    
    id = Column(Integer, primary_key=True)
    parent_id = Column(Integer, ForeignKey('document_nodes.id'), nullable=True)
    
    # Type System
    node_type = Column(String(50))  # 'intranet_page', 'wiki_article', 'process_doc', etc.
    content_type = Column(Enum('markdown', 'link', 'container'))
    
    # Content
    title = Column(String(200), nullable=False)
    slug = Column(String(200))  # für URLs
    content = Column(Text)  # Markdown content
    external_url = Column(String(500))  # falls content_type == 'link'
    
    # Metadata
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    tags = Column(JSON)  # für spätere Kategorisierung
    metadata = Column(JSON)  # flexibles Feld für type-spezifische Daten
    
    # Timestamps & Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('users.id'))
    updated_by = Column(Integer, ForeignKey('users.id'))
    
    # Relationships
    parent = relationship('DocumentNode', remote_side=[id], backref='children')
    allowed_groups = relationship('Group', secondary='document_node_groups')
    creator = relationship('User', foreign_keys=[created_by])
    updater = relationship('User', foreign_keys=[updated_by])
    
    # Polymorphic Identity (optional für später)
    __mapper_args__ = {
        'polymorphic_on': node_type,
        'polymorphic_identity': 'base'
    }
```

### DocumentNodeType (Type Registry)
```python
class DocumentNodeType(Base):
    __tablename__ = 'document_node_types'
    
    id = Column(Integer, primary_key=True)
    type_key = Column(String(50), unique=True)  # 'intranet_page', 'wiki_article'
    display_name = Column(String(100))
    icon = Column(String(50))  # für UI
    module = Column(String(50))  # 'intranet', 'wiki', etc.
    schema = Column(JSON)  # JSON Schema für metadata-Validierung
    is_active = Column(Boolean, default=True)
```

### DocumentNodeGroup (Association Table)
```python
document_node_groups = Table(
    'document_node_groups',
    Base.metadata,
    Column('node_id', Integer, ForeignKey('document_nodes.id')),
    Column('group_id', Integer, ForeignKey('groups.id')),
    Column('permission_level', Enum('read', 'write', 'admin'), default='read'),
    Column('inherited', Boolean, default=False)
)
```

## Type-System Beispiele

### Vordefinierte Types
```python
DOCUMENT_TYPES = {
    'intranet_page': {
        'display_name': 'Intranet-Seite',
        'icon': 'globe',
        'module': 'intranet',
        'schema': {}
    },
    'intranet_link': {
        'display_name': 'Externer Link',
        'icon': 'external-link',
        'module': 'intranet',
        'schema': {'required': ['external_url']}
    },
    'wiki_article': {
        'display_name': 'Wiki-Artikel',
        'icon': 'book',
        'module': 'wiki',
        'schema': {'properties': {'version': 'string'}}
    },
    'process_doc': {
        'display_name': 'Prozessdokumentation',
        'icon': 'workflow',
        'module': 'quality',
        'schema': {'properties': {'process_owner': 'string'}}
    }
}
```

## Spätere Erweiterung via Inheritance (Optional)
```python
class IntranetPage(DocumentNode):
    __mapper_args__ = {
        'polymorphic_identity': 'intranet_page'
    }
    
    # Zusätzliche intranet-spezifische Felder falls nötig
    # z.B. featured = Column(Boolean, default=False)

class WikiArticle(DocumentNode):
    __mapper_args__ = {
        'polymorphic_identity': 'wiki_article'
    }
    
    # Wiki-spezifische Felder
    # z.B. version = Column(String(20))
```

## Zugriffskontrolle

### Logik
1. User sieht Knoten, wenn er Mitglied mindestens einer allowed_group ist
2. Falls keine Gruppen definiert: alle sehen den Knoten (oder konfigurierbar pro Type)
3. Optionale Vererbung: Child-Knoten können Rechte vom Parent erben
4. Permission Levels: read, write, admin
5. Module-Filter: z.B. nur 'intranet' Types für Intranet-View

## API Endpoints
```
# Generic Document API
GET  /api/documents/tree?module=intranet          # Tree gefiltert nach Type/Module
GET  /api/documents/nodes/{id}                    # Einzelner Knoten
POST /api/documents/nodes                         # Neuen Knoten erstellen
PUT  /api/documents/nodes/{id}                    # Knoten bearbeiten
DELETE /api/documents/nodes/{id}                  # Knoten löschen
PUT  /api/documents/nodes/{id}/groups             # Gruppen zuweisen
PUT  /api/documents/nodes/{id}/move               # Im Tree verschieben

# Type Management
GET  /api/documents/types                         # Verfügbare Types
POST /api/documents/types                         # Neuen Type registrieren (Admin)

# Module-spezifische Convenience-Endpoints
GET  /api/intranet/tree                           # Alias für /documents/tree?module=intranet
GET  /api/wiki/tree                               # Für späteres Wiki-Modul
```

## Frontend Komponenten

### Generic Document Components
```
DocumentTree
├── TreeNode (rekursiv, type-aware rendering)
└── NodeIcon (basierend auf node_type)

DocumentViewer
├── MarkdownRenderer (react-markdown)
├── LinkRenderer
└── ContainerRenderer

DocumentEditor (Admin)
├── TipTapEditor
├── TypeSelector
└── MetadataForm (basierend auf type schema)
```

### Module-spezifische Views
```
IntranetView
└── DocumentTree (filter: module='intranet')

WikiView (später)
└── DocumentTree (filter: module='wiki')
```

## Beispiel Tree-Struktur mit Types
```
Root (container)
├─ Intranet (container, module=intranet)
│  ├─ Unternehmen (intranet_page, Gruppe: Alle)
│  │  ├─ News & Updates (intranet_page, Gruppe: Alle)
│  │  └─ Organigramm (intranet_link, external_url, Gruppe: Alle)
│  ├─ IT (container, Gruppe: IT-Team)
│  │  └─ Anleitungen (intranet_page, Gruppe: IT-Team)
│  └─ EHS-Bereich (container, Gruppe: EHS-Teams)
│     └─ Compliance-Docs (intranet_page, Gruppe: Compliance)
│
└─ Wiki (container, module=wiki) [für später]
   └─ Technische Docs (wiki_article)
```

## Implementierungs-Schritte

1. **Phase 1: Basis-System**
   - DocumentNode Model & Migrations
   - DocumentNodeType Registry
   - Generic API Endpoints
   - Basis Tree-Navigation (React)

2. **Phase 2: Intranet-Modul**
   - Intranet-spezifische Types registrieren
   - TipTap Editor Integration
   - Admin UI für Tree-Management
   - Gruppenzuweisung

3. **Phase 3: Erweiterungen**
   - Weitere Module (Wiki, etc.)
   - Polymorphic Inheritance falls nötig
   - Advanced Features (Search, Versioning)

## Vorteile dieses Ansatzes

- **Wiederverwendbarkeit**: Ein System für alle dokumentbasierten Module
- **Flexibilität**: Types können zur Laufzeit hinzugefügt werden
- **Skalierbarkeit**: Einfach neue Module hinzufügen
- **Konsistenz**: Gleiche UI/UX für alle Dokumenttypen
- **DRY**: Keine Code-Duplikation für ähnliche Module

## Technologie-Stack

### Backend
- FastAPI/Flask
- SQLAlchemy mit optional polymorphic inheritance
- JSON Schema für Type-Validierung

### Frontend
- React
- **TipTap** für WYSIWYG
- **react-markdown** für Rendering
- Type-aware Component Rendering

### Dependencies
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-markdown react-markdown
pip install jsonschema  # für metadata validation
```

## Migration Path

1. Start mit DocumentNode als generischem Model
2. Intranet-Types als erste Implementierung
3. Später: Specialized Models via Inheritance nur wenn wirklich nötig
4. Type Registry ermöglicht dynamisches Hinzufügen neuer Dokumenttypen