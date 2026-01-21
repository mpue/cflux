# E-Learning Modul - Dokumentation

## Übersicht

Das E-Learning-Modul ermöglicht die Verwaltung von Online-Schulungen, Kursen, Quizzes und Zertifikaten. Es ist vollständig in das cflux-System integriert mit Unterstützung für:

- **Kursmanagement** - Erstellen und verwalten von Kursen mit verschiedenen Typen
- **Lektionen & Inhalte** - Mehrere Content-Typen (Video, PDF, HTML, Quiz, etc.)
- **Quiz & Tests** - 5 verschiedene Fragetypen mit automatischer Bewertung
- **Fortschrittsverfolgung** - Detailliertes Tracking pro Lektion und Kurs
- **Zertifizierung** - Automatische Zertifikatausstellung bei Bestehen
- **Compliance-Integration** - Pflichtschulungen mit Ablaufdaten und Wiederholungspflicht
- **Zuweisungen** - Automatische Kurs-Zuweisungen an Benutzer/Gruppen

## Datenbank-Schema

Das vollständige Schema befindet sich in `docs/elearning.prisma` und wurde in `backend/prisma/schema.prisma` integriert.

### Hauptmodelle

- **Course** - Hauptkurs mit Metadaten, Status, Typ, Kategorisierung
- **CourseCategory** - Hierarchische Kategorisierung (Baumstruktur)
- **Lesson** - Einzelne Lektionen mit verschiedenen Content-Typen
- **Quiz** - Quiz-Definitionen mit Einstellungen (Zeitlimit, Shuffle, etc.)
- **Question** - Fragen mit 5 verschiedenen Typen
- **Answer** - Antwortmöglichkeiten für Fragen
- **Enrollment** - Benutzer-Kurs-Zuordnung mit Fortschritt
- **LessonProgress** - Fortschritt pro Lektion (Zeit, Position, Status)
- **QuizAttempt** - Versuchs-Tracking mit Score und Bestanden-Status
- **QuestionResponse** - Benutzerantworten pro Frage
- **CourseAssignment** - Automatische Zuweisung an User/Gruppen

### Enums

```typescript
CourseStatus: DRAFT | PUBLISHED | ARCHIVED
CourseType: MANDATORY | OPTIONAL | CERTIFICATION | ONBOARDING
EnrollmentStatus: NOT_STARTED | IN_PROGRESS | COMPLETED | FAILED | EXPIRED
QuestionType: SINGLE_CHOICE | MULTIPLE_CHOICE | TRUE_FALSE | TEXT | FILL_BLANK
```

## Backend-API

### Service: `backend/src/services/elearning.service.ts`

Enthält alle Business-Logic:

- Course CRUD (getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse)
- Category Management (getAllCategories, createCategory, updateCategory)
- Lesson Management (createLesson, updateLesson, deleteLesson)
- Quiz & Question Management
- Enrollment & Progress Tracking
- Quiz Attempts mit automatischer Bewertung
- Course Assignments mit Auto-Enrollment
- Analytics (Course Analytics, User Learning Stats)

### Controller: `backend/src/controllers/elearning.controller.ts`

Express Request-Handler für alle Endpoints

### Routes: `backend/src/routes/elearning.routes.ts`

**Base URL:** `/api/elearning`

#### Kurse
- `GET /courses` - Alle Kurse (mit Filtern: status, courseType, isComplianceCourse, ehsRelevant, categoryId)
- `GET /courses/:id` - Einzelner Kurs mit Lektionen
- `POST /courses` - Kurs erstellen (Berechtigung: canCreate)
- `PUT /courses/:id` - Kurs bearbeiten (Berechtigung: canEdit)
- `DELETE /courses/:id` - Kurs löschen/deaktivieren (Berechtigung: canDelete)
- `GET /courses/:id/analytics` - Kurs-Analytics

#### Kategorien
- `GET /categories` - Alle Kategorien
- `POST /categories` - Kategorie erstellen
- `PUT /categories/:id` - Kategorie bearbeiten

#### Lektionen
- `POST /lessons` - Lektion erstellen
- `PUT /lessons/:id` - Lektion bearbeiten
- `DELETE /lessons/:id` - Lektion löschen

#### Quiz
- `POST /quizzes` - Quiz erstellen
- `PUT /quizzes/:id` - Quiz bearbeiten
- `GET /quizzes/:id` - Quiz mit Fragen laden

#### Fragen & Antworten
- `POST /questions` - Frage erstellen
- `PUT /questions/:id` - Frage bearbeiten
- `DELETE /questions/:id` - Frage löschen
- `POST /answers` - Antwort erstellen
- `PUT /answers/:id` - Antwort bearbeiten
- `DELETE /answers/:id` - Antwort löschen

#### Enrollments (Einschreibungen)
- `POST /enrollments` - Benutzer einschreiben
- `GET /enrollments/my` - Meine Kurse
- `GET /enrollments/user/:userId` - Kurse eines Benutzers
- `GET /enrollments/:id` - Einzelne Einschreibung mit Details
- `PUT /enrollments/:id` - Fortschritt aktualisieren

#### Lektionsfortschritt
- `POST /lesson-progress` - Fortschritt aktualisieren
- `GET /lesson-progress/:enrollmentId/:lessonId` - Fortschritt laden

#### Quiz-Versuche
- `POST /quiz-attempts` - Quiz-Versuch starten
- `POST /quiz-attempts/:id/submit` - Quiz-Versuch abschicken (automatische Bewertung)
- `GET /quiz-attempts/:id` - Versuch mit Ergebnissen laden

#### Zuweisungen
- `POST /assignments` - Kurs zuweisen (mit Auto-Enrollment)
- `GET /courses/:courseId/assignments` - Zuweisungen eines Kurses

#### Analytics
- `GET /analytics/my` - Meine Lernstatistiken
- `GET /analytics/user/:userId` - Lernstatistiken eines Benutzers

## Frontend

### Hauptseite: `frontend/src/pages/ELearningPage.tsx`

Zeigt:
- Lernstatistiken (Total Kurse, Abgeschlossen, Ø Score, Zertifikate)
- Filter (Status, Typ)
- Kurs-Grid mit Thumbnails, Kategorien, Chips
- Navigation zu Kursdetails

### TypeScript Types: `frontend/src/types/elearning.ts`

Alle Interfaces und Enums für TypeScript

### Route: `/elearning`

Registriert in `frontend/src/App.tsx` mit `PrivateRoute` (alle authentifizierten User)

## Module-Permissions

**Module Key:** `elearning`

**Berechtigungen:**
- `canView` - Kurse ansehen und eigene Enrollments verwalten
- `canCreate` - Kurse, Lektionen, Quiz erstellen
- `canEdit` - Kurse, Lektionen, Quiz bearbeiten
- `canDelete` - Kurse, Lektionen, Quiz löschen

**Standard-Setup:**
```sql
-- Alle Benutzer können E-Learning ansehen
INSERT INTO module_access (module_id, user_group_id, can_view, can_create, can_edit, can_delete)
SELECT 
  (SELECT id FROM modules WHERE key = 'elearning'),
  id as user_group_id,
  true,
  false,
  false,
  false
FROM user_groups;

-- HR/Training-Manager bekommen volle Rechte
UPDATE module_access 
SET can_create = true, can_edit = true, can_delete = true
WHERE user_group_id IN (SELECT id FROM user_groups WHERE name IN ('HR', 'Manager'));
```

## Compliance-Features

### Pflichtschulungen (MANDATORY Courses)

Kurse mit `courseType = MANDATORY` können:
- Ein `expiresAt` Datum haben (Ablauf der Schulung)
- `renewalMonths` definieren (automatische Wiederholung nach X Monaten)
- Mit EHS-System verknüpft werden (`ehsRelevant = true`)
- Als Compliance-relevant markiert werden (`isComplianceCourse = true`)

### Automatische Zuweisungen

CourseAssignments:
- Weisen Kurse automatisch Benutzern/Gruppen zu
- Erstellen automatisch Enrollments
- Setzen `expiresAt` basierend auf `dueDate`
- Senden Erinnerungen X Tage vorher (Standard: 7, 3, 1 Tage)

## Quiz-System

### Fragetypen

1. **SINGLE_CHOICE** - Eine richtige Antwort
2. **MULTIPLE_CHOICE** - Mehrere richtige Antworten
3. **TRUE_FALSE** - Wahr/Falsch
4. **TEXT** - Freitext-Antwort (exakter Match)
5. **FILL_BLANK** - Lückentext mit optionaler Case-Sensitivity

### Automatische Bewertung

`submitQuizAttempt` bewertet automatisch:
- Vergleicht Antworten mit korrekten Lösungen
- Berechnet Punkte pro Frage
- Summiert Gesamtscore (Prozent)
- Prüft gegen `passingScore` (Standard: 80%)
- Gibt detailliertes Feedback mit `explanation`

### Versuchs-Limitierung

- `maxAttempts` auf Course-Level (null = unbegrenzt)
- `attemptNumber` auto-incrementiert
- Blockiert weitere Versuche bei Überschreitung

## Zertifizierung

### Automatische Ausstellung

Bei erfolgreichem Abschluss:
1. `Enrollment.status` → COMPLETED
2. `Enrollment.certificateIssued` → true
3. `Enrollment.certificateIssuedAt` → now()
4. Optional: `certificateUrl` mit PDF-Link

### Certificate Templates

`Course.certificateTemplateId` referenziert Template (noch zu implementieren)

## Content-Typen für Lektionen

`Lesson.contentType`:
- `VIDEO` - Video-URL (`videoUrl`)
- `PDF` - PDF-Dokument (über `attachments` JSON mit Media IDs)
- `HTML` - Rich-Text-Content (`content` als HTML)
- `SCORM` - SCORM-Paket (URL zu Package)
- `QUIZ` - Quiz-Lektion (1:1 Relation zu Quiz)
- `EXTERNAL_LINK` - Externe URL (`content`)

## Fortschrittsverfolgung

### LessonProgress

Trackt pro Lektion:
- `status`: NOT_STARTED | IN_PROGRESS | COMPLETED
- `timeSpent`: Gesamtzeit in Sekunden
- `lastPosition`: Video/Content-Position (Sekunden)
- Auto-Update via `/lesson-progress` Endpoint

### Enrollment Progress

- `progressPercent`: 0-100% Gesamtfortschritt
- `score`: Durchschnittsscore aller Quiz-Versuche
- `attempts`: Anzahl Quiz-Versuche
- Auto-Berechnung basierend auf abgeschlossenen Lektionen

## Analytics

### Course Analytics

`/courses/:id/analytics` liefert:
- Total/Completed/In-Progress/Not-Started Enrollments
- Durchschnittsscore & Durchschnittsfortschritt
- Completion Rate (%)

### User Learning Stats

`/analytics/my` oder `/analytics/user/:userId`:
- Total Courses Enrolled
- Completed/In-Progress Courses
- Average Score über alle Kurse
- Certificates Earned
- Completion Rate

## Integration mit bestehenden Modulen

### Media-Modul

Lektionen können `attachments` als JSON-Array mit Media-IDs speichern:
```json
["media-uuid-1", "media-uuid-2"]
```

### Intranet

Kurse können in Intranet-Dokumenten verlinkt werden

### Compliance

- `isComplianceCourse` Flag für ArG/ArGV-relevante Schulungen
- `ehsRelevant` für EHS-Integration
- Auto-Tracking von Compliance-Schulungen im Compliance-Dashboard (TODO)

### Messages

Automatische Benachrichtigungen:
- Bei neuer Kurs-Zuweisung
- X Tage vor `expiresAt` (Reminder System)
- Bei Zertifikat-Ausstellung (TODO)

## Nächste Schritte / TODOs

### Backend
- [ ] Certificate Template System implementieren
- [ ] PDF-Generierung für Zertifikate
- [ ] Reminder-Cronjob für ablaufende Kurse
- [ ] SCORM-Package-Upload & -Parsing
- [ ] Export von Analytics als Excel/PDF

### Frontend
- [ ] Course Detail Page mit Lesson-Player
- [ ] Quiz-Player mit Timer
- [ ] Course Editor (WYSIWYG für Lessons)
- [ ] Certificate Viewer/Download
- [ ] My Learning Dashboard
- [ ] Course Assignment UI
- [ ] Video Player mit Progress-Tracking
- [ ] Analytics Dashboard für Admins

### Integration
- [ ] Auto-Message bei Assignment
- [ ] Compliance-Dashboard Integration
- [ ] EHS-Todo Integration für Pflichtschulungen
- [ ] Calendar Integration für Deadlines

## Deployment

### Docker
Schema wurde bereits via `prisma db push` synchronisiert.
Module wurde via `seedModules.ts` angelegt.

### Permissions
Nach dem ersten Start müssen die Modul-Berechtigungen für Gruppen gesetzt werden:
```bash
# Via Admin-UI: /modules -> "E-Learning" -> Berechtigungen für Gruppen setzen
# Oder via SQL (siehe oben)
```

### Testing
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm start
# Navigate to http://localhost:3000/#/elearning
```

## Beispiel-Workflow

### 1. Kurs erstellen
```typescript
POST /api/elearning/courses
{
  "title": "Arbeitssicherheit Grundlagen",
  "description": "Pflichtschulung für alle Mitarbeiter",
  "courseType": "MANDATORY",
  "isComplianceCourse": true,
  "ehsRelevant": true,
  "renewalMonths": 12,
  "passingScore": 80,
  "maxAttempts": 3
}
```

### 2. Lektionen hinzufügen
```typescript
POST /api/elearning/lessons
{
  "courseId": "course-uuid",
  "title": "Einführung",
  "contentType": "VIDEO",
  "videoUrl": "https://...",
  "duration": 600,
  "order": 0
}

POST /api/elearning/lessons
{
  "courseId": "course-uuid",
  "title": "Abschlusstest",
  "contentType": "QUIZ",
  "order": 1
}
```

### 3. Quiz mit Fragen erstellen
```typescript
POST /api/elearning/quizzes
{
  "lessonId": "lesson-uuid",
  "title": "Wissenstest",
  "timeLimit": 30,
  "shuffleQuestions": true,
  "passingScore": 80
}

POST /api/elearning/questions
{
  "quizId": "quiz-uuid",
  "questionText": "Was ist die maximale Arbeitszeit pro Tag?",
  "questionType": "SINGLE_CHOICE",
  "points": 1,
  "order": 0
}

POST /api/elearning/answers
{
  "questionId": "question-uuid",
  "answerText": "9 Stunden",
  "isCorrect": true,
  "order": 0
}
```

### 4. Kurs veröffentlichen
```typescript
PUT /api/elearning/courses/:id
{
  "status": "PUBLISHED"
}
```

### 5. Kurs zuweisen
```typescript
POST /api/elearning/assignments
{
  "courseId": "course-uuid",
  "assignedToGroupIds": ["all-employees-group-id"],
  "dueDate": "2026-03-31T00:00:00Z",
  "reminderDays": [14, 7, 3, 1]
}
// -> Auto-Enrollment für alle User in der Gruppe
```

### 6. Benutzer absolviert Kurs
```typescript
// Lektion starten
POST /api/elearning/lesson-progress
{
  "enrollmentId": "enrollment-uuid",
  "lessonId": "lesson-uuid",
  "status": "IN_PROGRESS",
  "startedAt": "2026-01-21T10:00:00Z"
}

// Video-Position tracken
POST /api/elearning/lesson-progress
{
  "enrollmentId": "enrollment-uuid",
  "lessonId": "lesson-uuid",
  "lastPosition": 300,
  "timeSpent": 300
}

// Quiz starten
POST /api/elearning/quiz-attempts
{
  "enrollmentId": "enrollment-uuid",
  "quizId": "quiz-uuid"
}

// Quiz abgeben
POST /api/elearning/quiz-attempts/:attemptId/submit
{
  "responses": [
    {
      "questionId": "question-uuid",
      "selectedAnswers": ["answer-uuid"]
    }
  ]
}
// -> Automatische Bewertung, Zertifikat bei Bestehen
```

## Support & Kontakt

Bei Fragen oder Problemen: Siehe README.md im Hauptverzeichnis
