# News Widget System

## Übersicht

Das News-Widget-System ermöglicht es, aktuelle Nachrichten direkt auf dem Dashboard anzuzeigen. Es unterstützt verschiedene Quellen (RSS-Feeds, manuelle Einträge) und bietet umfangreiche Konfigurationsmöglichkeiten.

## Features

### News-Quellen (NewsSource)

- **3 Quellentypen**:
  - `RSS`: Automatischer Import von RSS-Feeds
  - `MANUAL`: Manuell erstellte Nachrichten
  - `INTERNAL`: Interne Firmennachrichten

- **Konfigurierbare Eigenschaften**:
  - Name und Beschreibung
  - Feed-URL (bei RSS)
  - Aktualisierungsintervall
  - Icon und Farbe (für UI-Darstellung)
  - Priorität (für Sortierung)
  - Dashboard-Sichtbarkeit
  - Gruppen-Berechtigungen

### Nachrichten (NewsItem)

- **Inhalte**:
  - Titel, Inhalt, Kurzbeschreibung
  - Externer Link zum Original-Artikel
  - Bild-URL für visuelle Darstellung
  - Autor und Tags

- **Priorisierung**:
  - 4 Prioritätsstufen: LOW, NORMAL, HIGH, URGENT
  - Anpin-Funktion für wichtige Nachrichten
  - Automatisches Ablaufdatum

- **Read-Tracking**:
  - Automatisches Markieren gelesener Nachrichten
  - Ungelesene Nachrichten werden hervorgehoben

## Datenbank-Schema

### NewsSource Tabelle
```prisma
model NewsSource {
  id                String           @id @default(cuid())
  name              String
  type              NewsSourceType   @default(MANUAL)
  url               String?
  refreshInterval   Int              @default(3600)
  isActive          Boolean          @default(true)
  displayOnDashboard Boolean         @default(true)
  priority          Int              @default(0)
  icon              String?
  color             String?
  visibleToGroups   UserGroup[]      @relation("NewsSourceVisibility")
  items             NewsItem[]
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  createdById       String?
  createdBy         User?            @relation(fields: [createdById], references: [id])
}
```

### NewsItem Tabelle
```prisma
model NewsItem {
  id                String           @id @default(cuid())
  sourceId          String
  source            NewsSource       @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  title             String
  content           String           @db.Text
  excerpt           String?
  externalUrl       String?
  imageUrl          String?
  priority          NewsPriority     @default(NORMAL)
  isPinned          Boolean          @default(false)
  isActive          Boolean          @default(true)
  publishedAt       DateTime         @default(now())
  expiresAt         DateTime?
  readBy            User[]           @relation("NewsItemReads")
  author            String?
  tags              String[]
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  createdById       String?
  createdBy         User?            @relation("NewsItemCreator", fields: [createdById], references: [id])
}
```

## API-Endpunkte

### Öffentliche Endpunkte (authentifiziert)

#### Dashboard-News abrufen
```
GET /api/news/dashboard?limit=10
```
Gibt die aktuellen Nachrichten für das Dashboard zurück, gefiltert nach Benutzerberechtigungen.

**Query Parameter**:
- `limit`: Maximale Anzahl der Nachrichten (Standard: 10)

**Response**:
```json
[
  {
    "id": "clx...",
    "title": "Wichtiges Update",
    "content": "Lorem ipsum...",
    "excerpt": "Kurzbeschreibung...",
    "priority": "HIGH",
    "isPinned": true,
    "isRead": false,
    "source": {
      "id": "clx...",
      "name": "Firmen-Blog",
      "icon": "fas fa-building",
      "color": "#3b82f6"
    },
    "publishedAt": "2026-01-31T10:00:00Z",
    "imageUrl": "https://...",
    "externalUrl": "https://...",
    "author": "Max Mustermann",
    "tags": ["Update", "Wichtig"]
  }
]
```

#### Nachricht als gelesen markieren
```
POST /api/news/:id/read
```

### Admin-Endpunkte

#### News-Quellen verwalten
```
GET    /api/news/sources              - Alle Quellen abrufen
GET    /api/news/sources/:id          - Quelle nach ID
POST   /api/news/sources              - Neue Quelle erstellen
PUT    /api/news/sources/:id          - Quelle aktualisieren
DELETE /api/news/sources/:id          - Quelle löschen
PATCH  /api/news/sources/:id/toggle-visibility - Sichtbarkeit umschalten
```

**Beispiel POST /api/news/sources**:
```json
{
  "name": "Tech News",
  "type": "RSS",
  "url": "https://example.com/feed.xml",
  "refreshInterval": 3600,
  "isActive": true,
  "displayOnDashboard": true,
  "priority": 10,
  "icon": "fas fa-rss",
  "color": "#ff6b35",
  "visibleToGroupIds": ["group-id-1", "group-id-2"]
}
```

#### Nachrichten verwalten
```
GET    /api/news/sources/:sourceId/items  - Nachrichten einer Quelle
GET    /api/news/items/:id                - Nachricht nach ID
POST   /api/news/items                    - Neue Nachricht erstellen
PUT    /api/news/items/:id                - Nachricht aktualisieren
DELETE /api/news/items/:id                - Nachricht löschen
PATCH  /api/news/items/:id/toggle-pin     - Anpin-Status umschalten
```

**Beispiel POST /api/news/items**:
```json
{
  "sourceId": "clx...",
  "title": "Neues Feature verfügbar",
  "content": "<p>Wir freuen uns...</p>",
  "excerpt": "Kurzbeschreibung des Features",
  "externalUrl": "https://blog.example.com/new-feature",
  "imageUrl": "https://cdn.example.com/image.jpg",
  "priority": "HIGH",
  "isPinned": true,
  "publishedAt": "2026-01-31T10:00:00Z",
  "expiresAt": "2026-02-28T23:59:59Z",
  "author": "Tech Team",
  "tags": ["Feature", "Update"]
}
```

#### RSS-Feeds aktualisieren
```
POST /api/news/refresh-feeds?sourceId=clx...
```

Aktualisiert alle oder eine spezifische RSS-Quelle. Importiert automatisch neue Artikel.

**Response**:
```json
[
  {
    "sourceId": "clx...",
    "sourceName": "Tech Blog",
    "success": true,
    "newItemsCount": 5
  }
]
```

## Frontend-Integration

### NewsWidget Komponente

Die NewsWidget-Komponente zeigt Nachrichten im Card-Layout an:

```tsx
import NewsWidget from '../components/NewsWidget';

// Verwendung im Dashboard
<NewsWidget 
  limit={10}              // Anzahl der Nachrichten
  showReadMore={true}     // "Mehr lesen" Button anzeigen
/>
```

**Features**:
- Automatische Aktualisierung per Refresh-Button
- Visuelle Unterscheidung von gelesenen/ungelesenen Nachrichten
- Angepinnte Nachrichten werden hervorgehoben
- Prioritäts-Badges (Low/Normal/High/Urgent)
- Expandierbare Inhalte mit "Mehr lesen"
- Bild-Unterstützung
- Links zu Original-Artikeln
- Tags für Kategorisierung

### News-Management Admin-Seite

Vollständige Verwaltungs-UI für Administratoren unter `/news-management`:

- **Quellen-Verwaltung**:
  - Erstellen, Bearbeiten, Löschen von Quellen
  - RSS-Feed-Konfiguration
  - Icon und Farbe anpassen
  - Berechtigungen pro Benutzergruppe

- **Nachrichten-Verwaltung**:
  - WYSIWYG-Editor für Inhalte
  - Bild-Upload und URL-Eingabe
  - Priorität und Anpin-Status
  - Veröffentlichungs- und Ablaufdatum
  - Tags und Kategorien

- **RSS-Feed-Synchronisation**:
  - Manuelles Aktualisieren aller RSS-Feeds
  - Automatischer Import neuer Artikel
  - Duplikat-Erkennung über externe URLs

## Berechtigungssystem

### Gruppenbasierte Sichtbarkeit

Jede News-Quelle kann optional auf bestimmte Benutzergruppen beschränkt werden:

1. **Keine Einschränkung**: Alle Benutzer sehen die Quelle
2. **Gruppenauswahl**: Nur Mitglieder der ausgewählten Gruppen sehen die Quelle

### Read-Tracking

- Jede Nachricht speichert, welche Benutzer sie gelesen haben
- Ungelesene Nachrichten werden visuell hervorgehoben
- Automatisches Markieren beim Klick auf die Nachricht

## RSS-Feed-Integration

### Automatischer Import

1. RSS-Quelle mit Feed-URL erstellen
2. RSS-Feeds können manuell aktualisiert werden über:
   - Admin-UI: "RSS aktualisieren" Button
   - API: `POST /api/news/refresh-feeds`

3. Für jeden Feed-Eintrag:
   - Prüfung auf Duplikate (über externe URL)
   - Extraktion von Titel, Inhalt, Autor, Datum
   - Automatisches Erstellen als NewsItem
   - Übernahme von Kategorien als Tags

### Unterstützte Feed-Formate

Das System verwendet `rss-parser` und unterstützt:
- RSS 2.0
- Atom 1.0
- RSS 1.0 / RDF

### Aktualisierungsintervall

- Konfigurierbar pro Quelle (Standard: 3600 Sekunden = 1 Stunde)
- Automatische Aktualisierung kann über Cron-Jobs implementiert werden

## Styling und Theme

### CSS-Klassen

Das News-Widget verwendet folgende Hauptklassen:

- `.news-widget` - Container
- `.news-list` - Scrollbare Liste
- `.news-item` - Einzelne Nachricht
- `.news-item.unread` - Ungelesene Nachricht
- `.news-item.pinned` - Angepinnte Nachricht
- `.news-item-header` - Kopfzeile mit Quelle und Datum
- `.news-item-title` - Titel
- `.news-item-content` - Inhaltsbereich
- `.news-item-footer` - Footer mit Aktionen
- `.news-item-tags` - Tag-Liste

### Dark Mode Support

Alle Komponenten unterstützen automatisch den Dark Mode über `[data-theme='dark']` Selektoren.

## Deployment

### Datenbank-Migration

```bash
cd backend
npm run prisma:push
npm run prisma:generate
```

### Dependencies installieren

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Docker-Deployment

Das News-System ist vollständig in den bestehenden Docker-Setup integriert:

```bash
docker-compose up --build -d
```

## Verwendungsbeispiele

### Beispiel 1: Firmen-Blog als RSS-Quelle

1. Admin-Panel → News-Verwaltung
2. "Neue Quelle" → RSS
3. Name: "Firmen-Blog"
4. URL: https://blog.firma.de/feed.xml
5. Icon: `fas fa-building`
6. Farbe: #3b82f6
7. Speichern & "RSS aktualisieren"

### Beispiel 2: Wichtige interne Ankündigung

1. Admin-Panel → News-Verwaltung → Nachrichten
2. "Neue Nachricht"
3. Quelle: "Interne News" auswählen
4. Titel: "Betriebsversammlung nächste Woche"
5. Inhalt: Details zur Versammlung
6. Priorität: HIGH
7. Angepinnt: Ja
8. Ablaufdatum: Nach der Versammlung
9. Speichern

### Beispiel 3: Branchennews aggregieren

1. Mehrere RSS-Quellen erstellen:
   - TechCrunch: https://techcrunch.com/feed/
   - Heise: https://www.heise.de/rss/heise.rdf
   - t3n: https://t3n.de/rss.xml

2. Automatische Aktualisierung über Cron-Job:
```bash
# Alle 2 Stunden aktualisieren
0 */2 * * * curl -X POST http://localhost:3001/api/news/refresh-feeds
```

## Troubleshooting

### RSS-Feed kann nicht geladen werden

**Fehler**: "Error parsing feed"

**Lösung**:
- Feed-URL überprüfen
- Prüfen ob Feed öffentlich zugänglich ist
- CORS-Einstellungen überprüfen
- Feed-Format validieren

### Nachrichten werden nicht angezeigt

**Mögliche Ursachen**:
1. Quelle ist nicht aktiv (`isActive: false`)
2. Dashboard-Anzeige ist deaktiviert (`displayOnDashboard: false`)
3. Benutzer hat keine Berechtigung (Gruppen-Einschränkung)
4. Nachricht ist abgelaufen (`expiresAt` in der Vergangenheit)
5. Nachricht ist nicht aktiv (`isActive: false`)

### Performance-Optimierung

- Limit für Dashboard-News anpassen (Standard: 10)
- Alte Nachrichten archivieren (isActive = false)
- RSS-Aktualisierungsintervall erhöhen
- Bilder über CDN bereitstellen

## Best Practices

1. **RSS-Quellen**: Aktualisierungsintervall nicht unter 30 Minuten setzen
2. **Bilder**: Komprimierte Bilder verwenden (max. 200KB)
3. **Inhalte**: Kurze, prägnante Texte für bessere Lesbarkeit
4. **Prioritäten**: Sparsam mit HIGH/URGENT umgehen
5. **Ablaufdatum**: Für zeitkritische News immer setzen
6. **Tags**: Konsistente Tag-Namen verwenden für bessere Filterung
7. **Berechtigungen**: Sensible Inhalte auf entsprechende Gruppen beschränken

## Zukünftige Erweiterungen

Mögliche Features für die Zukunft:

- [ ] Automatische RSS-Aktualisierung via Cron
- [ ] Kommentarfunktion für News-Items
- [ ] Like/Reaction-System
- [ ] Push-Benachrichtigungen für wichtige News
- [ ] Newsletter-Funktion (Email-Versand)
- [ ] Erweiterte Filterung (nach Tags, Datum, Quelle)
- [ ] Analytics (welche News werden am meisten gelesen)
- [ ] Multi-Sprachen-Unterstützung
- [ ] Automatische Übersetzung via API
