# E-Learning Module - Lessons Feature

## Implementiert am: 21.01.2026

### Neue Komponenten

**LessonEditor Component** (`frontend/src/components/elearning/LessonEditor.tsx`)
- Lektionen-Verwaltung für Kurse
- Drag & Drop Reihenfolge (mit Auf/Ab-Buttons)
- Verschiedene Inhaltstypen:
  - HTML-Inhalt
  - Video (mit URL)
  - PDF-Dokument
  - Externer Link
  - Quiz
  - SCORM-Paket
- Features:
  - Lektion hinzufügen/bearbeiten/löschen
  - Dauer in Sekunden
  - Optional-Flag für nicht-pflicht Lektionen
  - Visuelle Icons für verschiedene Content-Typen
  - Sortierung anpassen

**CourseEditorPage Updates** (`frontend/src/pages/CourseEditorPage.tsx`)
- Tab-Navigation hinzugefügt:
  - Tab 1: Grundeinstellungen (bestehend)
  - Tab 2: Lektionen (neu)
  - Tab 3: Quiz (Platzhalter für später)
- Nach Erstellen eines neuen Kurses wird automatisch zum Lektionen-Tab gewechselt
- Lektionen/Quiz-Tabs sind nur für existierende Kurse aktiviert (nicht bei "new")

### Backend-APIs verwendet

Bereits existierende Endpoints:
- `POST /api/elearning/lessons` - Lektion erstellen
- `PUT /api/elearning/lessons/:id` - Lektion aktualisieren
- `DELETE /api/elearning/lessons/:id` - Lektion löschen
- `GET /api/elearning/courses/:id` - Kurs mit Lektionen laden

### Workflow

1. **Neuen Kurs erstellen**:
   - Admin → E-Learning Tab → "Neuer Kurs"
   - Grundeinstellungen ausfüllen → Speichern
   - Automatischer Wechsel zum Lektionen-Tab

2. **Lektionen hinzufügen**:
   - "Lektion hinzufügen" Button
   - Titel, Beschreibung, Inhaltstyp wählen
   - Je nach Typ: Video-URL, HTML-Content oder Link eingeben
   - Optional-Flag setzen wenn gewünscht
   - Speichern

3. **Lektionen verwalten**:
   - Reihenfolge mit ↑↓ Buttons anpassen
   - Bearbeiten mit ✏️ Button
   - Löschen mit 🗑️ Button

### Nächste Schritte

**Noch zu implementieren**:
1. **Quiz-Builder** - Fragen/Antworten für Quiz-Lektionen erstellen
2. **Course Detail Page** - User-Ansicht zum Durcharbeiten der Lektionen
3. **Enrollment System** - "Kurs starten" Funktionalität
4. **Progress Tracking** - Fortschritt pro Lektion speichern
5. **Video Player** - Eingebetteter Player für Video-Lektionen
6. **PDF Viewer** - Eingebetteter Viewer für PDF-Dokumente
7. **Quiz Execution** - Quiz absolvieren und bewerten
8. **Certificate Generation** - Zertifikat nach Abschluss

### Technische Details

**Inhaltstypen Enum**:
```typescript
VIDEO          // Video mit URL
PDF            // PDF-Dokument
HTML           // HTML-Inhalt (WYSIWYG später?)
QUIZ           // Verlinktes Quiz
SCORM          // SCORM-Paket
EXTERNAL_LINK  // Externer Link
```

**Daten-Flow**:
```
CourseEditorPage (Tab 2) 
  → LessonEditor Component
    → Load lessons from course
    → Dialog for create/edit
    → API calls to backend
    → Reload lessons after changes
```

**Prisma Relations**:
- Course hasMany Lesson
- Lesson belongsTo Course (onDelete: Cascade)
- Quiz hasOne Lesson (unique lessonId)
