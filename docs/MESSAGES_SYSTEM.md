# Internes Benachrichtigungssystem

Ein vollständiges internes Nachrichtensystem für die CFlux-Anwendung, das Benutzer-zu-Benutzer-Kommunikation und Systemnachrichten aus Workflows unterstützt.

## Features

### 📬 Nachrichtenverwaltung
- **Posteingang**: Empfangene Nachrichten
- **Gesendet**: Gesendete Nachrichten
- **Papierkorb**: Gelöschte Nachrichten

### ✍️ Rich-Text-Editor
- Einfacher aber leistungsstarker Editor für formatierte Nachrichten
- Unterstützte Formatierungen:
  - **Fett**, *Kursiv*, <u>Unterstrichen</u>
  - Aufzählungslisten
  - Nummerierte Listen
  - Links
  - Formatierung entfernen

### 🔔 Benachrichtigungen
- Unread-Counter im Dashboard
- Badge mit Anzahl ungelesener Nachrichten
- Automatische Markierung als gelesen beim Öffnen

### 🎯 Nachrichtentypen
1. **USER**: Benutzer-zu-Benutzer-Nachrichten
2. **SYSTEM**: Systemnachrichten
3. **WORKFLOW**: Workflow-Benachrichtigungen

### 📊 Prioritäten
- 🔴 Hoch
- Normal (Standard)
- 🔵 Niedrig

## Technische Details

### Backend

#### Datenbank-Schema
```prisma
model Message {
  id            String        @id @default(uuid())
  subject       String
  body          String        @db.Text
  senderId      String?       // null für Systemnachrichten
  receiverId    String
  type          MessageType   @default(USER)
  senderFolder  MessageFolder @default(SENT)
  receiverFolder MessageFolder @default(INBOX)
  isRead        Boolean       @default(false)
  readAt        DateTime?
  workflowId    String?
  workflowInstanceId String?
  priority      String?       @default("normal")
  replyToId     String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}
```

#### API Endpunkte

**Nachrichten abrufen**
```
GET /api/messages?folder=INBOX|SENT|TRASH
Authorization: Bearer <token>
```

**Einzelne Nachricht abrufen**
```
GET /api/messages/:id
Authorization: Bearer <token>
```

**Nachricht senden**
```
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": "user-id",
  "subject": "Betreff",
  "body": "<p>HTML Nachricht</p>",
  "priority": "normal|high|low",
  "replyToId": "optional-reply-to-id"
}
```

**Nachricht verschieben**
```
PATCH /api/messages/:id/move
Authorization: Bearer <token>
Content-Type: application/json

{
  "folder": "INBOX|SENT|TRASH"
}
```

**Nachricht löschen**
```
DELETE /api/messages/:id
Authorization: Bearer <token>
```

**Gelesen/Ungelesen markieren**
```
PATCH /api/messages/:id/read
Authorization: Bearer <token>
Content-Type: application/json

{
  "isRead": true|false
}
```

**Ungelesene Nachrichten zählen**
```
GET /api/messages/unread-count
Authorization: Bearer <token>

Response: { "count": 5 }
```

**Empfänger abrufen**
```
GET /api/messages/recipients
Authorization: Bearer <token>

Response: [
  {
    "id": "user-id",
    "firstName": "Max",
    "lastName": "Mustermann",
    "email": "max@example.com",
    "role": "USER"
  }
]
```

### Frontend

#### Komponenten

**MessagesPage** (`src/pages/MessagesPage.tsx`)
- Hauptseite mit Ordnernavigation
- Nachrichtenliste mit Vorschau
- Mehrfachauswahl für Massenaktionen
- Filter nach Ordner

**ComposeMessage** (`src/pages/ComposeMessage.tsx`)
- Neue Nachricht erstellen
- Empfängerauswahl
- Rich-Text-Editor
- Prioritätsauswahl

**MessageDetail** (`src/pages/MessageDetail.tsx`)
- Vollständige Nachrichtenansicht
- Antwortfunktion
- Nachrichten verschieben/löschen
- Anzeige von Antworten

#### Service (`src/services/message.service.ts`)
```typescript
import { getMessages, getMessage, sendMessage } from '../services/message.service';

// Nachrichten laden
const messages = await getMessages('INBOX');

// Nachricht senden
await sendMessage({
  receiverId: 'user-id',
  subject: 'Betreff',
  body: '<p>Nachricht</p>',
  priority: 'high'
});

// Unread Count
const count = await getUnreadCount();
```

### Workflow-Integration

Das System ist vollständig in das Workflow-System integriert und sendet automatisch Benachrichtigungen:

#### Benachrichtigungstypen

**Genehmigungsanfrage**
```
Betreff: 🔔 Genehmigungsanfrage: [Workflow Name]
Nachricht: Sie haben eine neue Genehmigungsanfrage...
```

**Genehmigt**
```
Betreff: ✅ Workflow genehmigt: [Workflow Name]
Nachricht: Ihr Workflow-Schritt wurde genehmigt...
```

**Abgelehnt**
```
Betreff: ❌ Workflow abgelehnt: [Workflow Name]
Nachricht: Ihr Workflow-Schritt wurde abgelehnt...
Grund: [Kommentar]
```

#### Integration im Code

```typescript
// In workflow.service.ts
import { sendSystemMessage } from '../controllers/message.controller';

// Benachrichtigung senden
await sendSystemMessage(
  receiverId,
  'Workflow Benachrichtigung',
  '<p>HTML Nachricht</p>',
  'WORKFLOW',
  workflowId,
  workflowInstanceId
);
```

## Navigation

Das Nachrichtensystem ist im Dashboard integriert:

```typescript
// Dashboard Navigation
<button onClick={() => navigate('/messages')}>
  📨 Nachrichten 
  {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
</button>
```

## Routes

```typescript
// App.tsx
<Route path="/messages" element={<MessagesPage />} />
<Route path="/messages/compose" element={<ComposeMessage />} />
<Route path="/messages/:id" element={<MessageDetail />} />
```

## Styling

Alle Styles sind in `src/styles/Messages.css` definiert:
- Responsive Design
- Dark Mode kompatibel
- Moderne UI mit Animationen
- Mobile-optimiert

## Verwendungsbeispiele

### Nachricht an Benutzer senden

```typescript
import { sendMessage } from '../services/message.service';

await sendMessage({
  receiverId: 'user-id',
  subject: 'Willkommen!',
  body: '<p>Hallo! Willkommen im Team.</p>',
  priority: 'normal'
});
```

### Systemnachricht aus Backend senden

```typescript
import { sendSystemMessage } from '../controllers/message.controller';

// In einem Controller oder Service
await sendSystemMessage(
  userId,
  'Wichtige Systemnachricht',
  '<p>Ihre Daten wurden erfolgreich gesichert.</p>',
  'SYSTEM'
);
```

### Workflow-Benachrichtigung senden

```typescript
// Automatisch bei Workflow-Ereignissen
await workflowService.sendWorkflowNotification(
  userId,
  'Rechnungsgenehmigung',
  'APPROVAL_REQUESTED',
  'INVOICE',
  invoiceId
);
```

## Migration

Um das Nachrichtensystem in der Datenbank zu aktivieren:

```bash
cd backend
npm run prisma:migrate
```

Dies erstellt die `messages` Tabelle und alle notwendigen Indizes.

## Sicherheit

- Alle API-Endpunkte erfordern Authentifizierung
- Benutzer können nur ihre eigenen Nachrichten sehen
- Nachrichten werden nur an existierende Benutzer gesendet
- Soft-Delete: Nachrichten werden erst gelöscht, wenn beide Teilnehmer sie gelöscht haben

## Best Practices

1. **HTML in Nachrichten**: Verwende sichere HTML-Tags, XSS wird automatisch bereinigt
2. **Lange Nachrichten**: Der Editor unterstützt bis zu 500 Zeichen Vorschau
3. **Prioritäten**: Nutze "Hoch" nur für wirklich wichtige Nachrichten
4. **Antworten**: Nutze die Reply-Funktion für bessere Nachrichtenverfolgung

## Zukünftige Erweiterungen

Mögliche Verbesserungen:
- [ ] Anhänge hochladen
- [ ] Gruppennachrichten
- [ ] Lesebestätigungen
- [ ] Push-Benachrichtigungen
- [ ] Nachrichtensuche
- [ ] Archivierung
- [ ] Kategorien/Tags
- [ ] Entwürfe speichern
- [ ] Automatische Antworten

## Support

Bei Fragen oder Problemen:
- Backend-Logs: `backend/logs/`
- Frontend-Konsole: Browser DevTools
- API-Tests: Postman Collection verfügbar
