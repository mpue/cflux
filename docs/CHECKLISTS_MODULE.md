# Checklisten-Modul Dokumentation

## Übersicht
Das Checklisten-Modul ermöglicht die Verwaltung von wiederverwendbaren Checklisten-Vorlagen und deren Instanzen für verschiedene Zwecke wie Onboarding, Offboarding, Audits, Wartung und Projekte.

## Features

### Checklisten-Typen
- **ONBOARDING**: Onboarding neuer Mitarbeiter
- **OFFBOARDING**: Offboarding ausscheidender Mitarbeiter
- **AUDIT**: Audit-Checklisten
- **MAINTENANCE**: Wartungs-Checklisten
- **PROJECT**: Projekt-spezifische Checklisten
- **CUSTOM**: Benutzerdefinierte Checklisten

### Item-Typen
- **CHECKBOX**: Einfache Ja/Nein Checkbox
- **TEXT**: Freitext-Eingabe
- **DATE**: Datums-Auswahl
- **SIGNATURE**: Digitale Unterschrift
- **FILE_UPLOAD**: Dokument hochladen
- **PHOTO**: Foto aufnehmen
- **NUMBER**: Zahlen-Eingabe
- **SELECT**: Dropdown-Auswahl
- **MULTI_SELECT**: Multiple Choice

### Checklisten-Status
- **NOT_STARTED**: Noch nicht gestartet
- **IN_PROGRESS**: In Bearbeitung
- **COMPLETED**: Abgeschlossen
- **CANCELLED**: Abgebrochen
- **OVERDUE**: Überfällig

## Datenbank-Schema

### ChecklistTemplate
Wiederverwendbare Vorlagen für Checklisten.

**Felder:**
- `id`: Eindeutige ID (CUID)
- `name`: Name der Vorlage
- `description`: Optionale Beschreibung
- `type`: Typ der Checkliste (ChecklistType)
- `category`: Optionale Kategorie (z.B. "IT", "HR", "Fachlich")
- `isActive`: Status der Vorlage
- `estimatedDuration`: Geschätzte Dauer in Minuten
- `responsibleRole`: Verantwortliche Rolle (z.B. "IT", "HR")
- `createdById`: Ersteller-User-ID
- `createdAt`: Erstellungsdatum
- `updatedAt`: Aktualisierungsdatum

**Relationen:**
- `items`: ChecklistItem[] - Template-Items
- `instances`: ChecklistInstance[] - Instanzen dieser Vorlage
- `createdBy`: User - Ersteller

### ChecklistItem
Baustein-Items einer Checklisten-Vorlage.

**Felder:**
- `id`: Eindeutige ID (CUID)
- `templateId`: Zugehörige Vorlage
- `title`: Titel der Aufgabe
- `description`: Optionale Beschreibung
- `order`: Reihenfolge
- `itemType`: Typ des Items (ChecklistItemType)
- `required`: Pflichtfeld
- `assignedRole`: Zugewiesene Rolle
- `dueAfterDays`: Fälligkeit nach X Tagen
- `dueDayOffset`: Relativer Tag-Offset
- `conditionalParentId`: Optionale bedingte Logik
- `showIfParentValue`: Bedingter Wert

**Relationen:**
- `template`: ChecklistTemplate
- `completions`: ChecklistItemCompletion[]

### ChecklistInstance
Konkrete Checklisten-Instanz für einen Benutzer.

**Felder:**
- `id`: Eindeutige ID (CUID)
- `templateId`: Zugehörige Vorlage
- `userId`: Benutzer, für den die Checkliste ist
- `status`: Aktueller Status
- `startDate`: Startdatum
- `targetEndDate`: Optionales Zieldatum
- `completedDate`: Abschlussdatum
- `totalItems`: Gesamtanzahl Items
- `completedItems`: Anzahl abgeschlossener Items
- `progressPercent`: Fortschritt in Prozent
- `assignedToId`: Optional zugewiesene HR-Person
- `notes`: Optionale Notizen
- `projectId`: Optional zugewiesenes Projekt

**Relationen:**
- `template`: ChecklistTemplate
- `user`: User - Der Mitarbeiter
- `assignedTo`: User - Zugewiesene Person
- `project`: Project - Zugewiesenes Projekt
- `completions`: ChecklistItemCompletion[]

### ChecklistItemCompletion
Abschluss-Daten für jedes Item einer Instanz.

**Felder:**
- `id`: Eindeutige ID (CUID)
- `instanceId`: Zugehörige Instanz
- `itemId`: Zugehöriges Item
- `completed`: Abgeschlossen ja/nein
- `completedAt`: Abschlussdatum
- `completedById`: Abschließender Benutzer
- `textValue`: Textwert (für TEXT, SELECT)
- `numberValue`: Zahlenwert (für NUMBER)
- `dateValue`: Datumswert (für DATE)
- `boolValue`: Boolean-Wert (für CHECKBOX)
- `jsonValue`: JSON-Wert (für MULTI_SELECT, komplexe Daten)
- `fileUrl`: Datei-URL (für FILE_UPLOAD, PHOTO, SIGNATURE)
- `comment`: Optionaler Kommentar

**Relationen:**
- `instance`: ChecklistInstance
- `item`: ChecklistItem
- `completedBy`: User - Abschließender Benutzer

## API-Endpunkte

### Templates

#### POST /api/checklists/templates
Neue Vorlage erstellen (Berechtigung: canCreate)

**Request Body:**
```json
{
  "name": "IT-Onboarding",
  "description": "Standard IT-Onboarding für neue Mitarbeiter",
  "type": "ONBOARDING",
  "category": "IT",
  "estimatedDuration": 240,
  "responsibleRole": "IT"
}
```

#### GET /api/checklists/templates
Alle Vorlagen abrufen (Berechtigung: canView)

**Query Parameter:**
- `type`: Filter nach Typ (optional)
- `isActive`: Filter nach Status (optional)

#### GET /api/checklists/templates/:id
Einzelne Vorlage abrufen (Berechtigung: canView)

#### PUT /api/checklists/templates/:id
Vorlage aktualisieren (Berechtigung: canEdit)

#### DELETE /api/checklists/templates/:id
Vorlage deaktivieren (Berechtigung: canDelete)

### Template Items

#### POST /api/checklists/templates/items
Template-Item erstellen (Berechtigung: canEdit)

**Request Body:**
```json
{
  "templateId": "xyz",
  "title": "PC einrichten",
  "description": "Laptop konfigurieren und Software installieren",
  "order": 1,
  "itemType": "CHECKBOX",
  "required": true,
  "assignedRole": "IT",
  "dueAfterDays": 1
}
```

#### PUT /api/checklists/templates/items/:id
Template-Item aktualisieren (Berechtigung: canEdit)

#### DELETE /api/checklists/templates/items/:id
Template-Item löschen (Berechtigung: canEdit)

#### POST /api/checklists/templates/:templateId/reorder
Template-Items neu sortieren (Berechtigung: canEdit)

**Request Body:**
```json
{
  "itemIds": ["id1", "id2", "id3"]
}
```

### Instances

#### POST /api/checklists/instances
Neue Instanz erstellen (Berechtigung: canCreate)

**Request Body:**
```json
{
  "templateId": "xyz",
  "userId": "user-id",
  "assignedToId": "hr-person-id",
  "startDate": "2026-01-30",
  "targetEndDate": "2026-02-15",
  "notes": "Besondere Anforderungen...",
  "projectId": "project-id"
}
```

#### GET /api/checklists/instances
Alle Instanzen abrufen (Berechtigung: canView)

**Query Parameter:**
- `userId`: Filter nach Benutzer
- `assignedToId`: Filter nach zugewiesener Person
- `status`: Filter nach Status
- `templateId`: Filter nach Vorlage

#### GET /api/checklists/instances/my
Eigene Checklisten abrufen (Berechtigung: canView)

#### GET /api/checklists/instances/assigned
Zugewiesene Checklisten abrufen (Berechtigung: canView)

#### GET /api/checklists/instances/:id
Einzelne Instanz abrufen (Berechtigung: canView)

#### PUT /api/checklists/instances/:id
Instanz aktualisieren (Berechtigung: canEdit)

#### DELETE /api/checklists/instances/:id
Instanz löschen (Berechtigung: canDelete)

### Item Completion

#### POST /api/checklists/items/complete
Item abhaken/aktualisieren (Berechtigung: canView für eigene Items)

**Request Body:**
```json
{
  "instanceId": "instance-id",
  "itemId": "item-id",
  "completed": true,
  "textValue": "Optionaler Text",
  "numberValue": 42,
  "dateValue": "2026-01-30",
  "boolValue": true,
  "jsonValue": { "key": "value" },
  "fileUrl": "/uploads/file.pdf",
  "comment": "Kommentar zum Abschluss"
}
```

### Statistics

#### GET /api/checklists/statistics
Statistiken abrufen (Berechtigung: canView)

**Response:**
```json
{
  "totalTemplates": 10,
  "activeTemplates": 8,
  "totalInstances": 25,
  "inProgressInstances": 12,
  "completedInstances": 10,
  "overdueInstances": 3
}
```

## Frontend

### Routen
- `/checklists` - Hauptseite mit Übersicht
- `/checklists/instances/:id` - Instanz-Detailseite

### Komponenten

#### ChecklistsPage
Hauptseite mit Tabs:
1. **Meine Checklisten**: Checklisten des aktuellen Benutzers
2. **Zugewiesen**: Checklisten, die dem Benutzer zur Überwachung zugewiesen sind
3. **Vorlagen**: Verfügbare Checklisten-Vorlagen

Features:
- Statistik-Karten (Gesamt, In Bearbeitung, Abgeschlossen, Überfällig)
- Fortschrittsbalken für jede Instanz
- Farbcodierte Status-Chips
- Klick zum Öffnen der Detail-Seite

#### ChecklistInstanceDetailPage
Detail-Ansicht einer Checklisten-Instanz:
- Informationen (Mitarbeiter, Zugewiesen an, Start-/Zieldatum)
- Gesamt-Fortschrittsbalken
- Liste aller Items mit:
  - Checkbox für einfache Abhak-Items
  - Bearbeitungs-Dialog für komplexe Items
  - Anzeige von Werten und Kommentaren
  - Abschluss-Informationen (Zeitstempel, Benutzer)

### TypeScript-Typen
Vollständige Typen in `frontend/src/types/checklist.ts`:
- Enums: ChecklistType, ChecklistItemType, ChecklistStatus
- Interfaces: ChecklistTemplate, ChecklistItem, ChecklistInstance, ChecklistItemCompletion
- DTOs: CreateTemplateDto, UpdateTemplateDto, etc.

## Berechtigungen

Das Modul nutzt das cflux-Berechtigungssystem:
- **canView**: Vorlagen und Instanzen ansehen
- **canCreate**: Neue Vorlagen und Instanzen erstellen
- **canEdit**: Vorlagen und Instanzen bearbeiten
- **canDelete**: Vorlagen und Instanzen löschen

## Verwendung

### Beispiel-Workflow: Onboarding

1. **Template erstellen**:
   - Admin erstellt eine "IT-Onboarding" Vorlage
   - Fügt Items hinzu (PC einrichten, Email erstellen, Software installieren, etc.)
   - Setzt Reihenfolge und Pflichtfelder

2. **Instanz erstellen**:
   - HR-Person erstellt eine Instanz für neuen Mitarbeiter
   - Weist sich selbst als Überwachende Person zu
   - Setzt Zieldatum

3. **Items abschließen**:
   - IT-Person geht durch die Liste
   - Hakt Items ab, fügt Kommentare hinzu
   - Lädt ggf. Dokumente hoch

4. **Überwachung**:
   - HR-Person sieht Fortschritt im "Zugewiesen"-Tab
   - Kann bei Bedarf Notizen hinzufügen oder Zieldatum anpassen

5. **Abschluss**:
   - Wenn alle Items abgeschlossen sind, wechselt Status automatisch zu COMPLETED
   - Abschlussdatum wird gesetzt

## Technische Details

### Service Layer (Backend)
- `checklistService` mit vollständigen CRUD-Operationen
- Automatische Fortschritts-Berechnung
- Transaction-Support für Item-Reordering
- Optimierte Queries mit Prisma includes

### Controller Layer (Backend)
- Standardisierte Error-Handling
- User-Context aus JWT-Token
- Query-Parameter-Parsing

### Routes Layer (Backend)
- Authentifizierung auf allen Routen
- Modul-basierte Berechtigungsprüfung
- RESTful API-Design

## Erweiterungsmöglichkeiten

### Geplante Features
- [ ] Workflow-Integration für Approval-Prozesse
- [ ] Email-Benachrichtigungen bei Status-Änderungen
- [ ] Bulk-Operationen für mehrere Instanzen
- [ ] Template-Versionierung
- [ ] Import/Export von Templates
- [ ] Erweiterte Reporting-Funktionen
- [ ] Mobile App-Unterstützung
- [ ] QR-Code-Scanning für Ausrüstungs-Items

### Anpassungsmöglichkeiten
- Eigene Item-Typen definieren
- Custom Validierungs-Regeln
- Bedingte Item-Logik erweitern
- Integration mit externen Systemen

## Migration

Das Schema wurde zur Datenbank hinzugefügt via:
```bash
npm run prisma:push
npm run seed:modules
```

Das Modul ist nun verfügbar und kann über die Admin-Oberfläche Benutzergruppen zugewiesen werden.
