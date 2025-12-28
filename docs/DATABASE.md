# Zeiterfassungssystem - Datenbankschema

## Übersicht

Das Datenmodell besteht aus 5 Haupttabellen:

1. **users** - Benutzer und ihre Daten
2. **projects** - Projekte für Zeitbuchungen
3. **project_assignments** - Zuordnung Benutzer zu Projekten
4. **time_entries** - Zeiterfassungen (Ein-/Ausstempeln)
5. **absence_requests** - Urlaubsanträge und Abwesenheiten

## Tabellen Details

### users
Speichert alle Benutzerinformationen inkl. Authentication.

**Felder:**
- `id` - UUID, Primary Key
- `email` - String, Unique, für Login
- `password` - String, bcrypt gehasht
- `firstName` - String
- `lastName` - String
- `role` - Enum (ADMIN, USER)
- `isActive` - Boolean, für Aktivierung/Deaktivierung
- `vacationDays` - Float, verbleibende Urlaubstage
- `createdAt` - DateTime
- `updatedAt` - DateTime

### projects
Projekte auf die Arbeitszeit gebucht werden kann.

**Felder:**
- `id` - UUID, Primary Key
- `name` - String
- `description` - String, optional
- `isActive` - Boolean
- `createdAt` - DateTime
- `updatedAt` - DateTime

### project_assignments
Many-to-Many Relation zwischen Benutzern und Projekten.

**Felder:**
- `id` - UUID, Primary Key
- `userId` - UUID, Foreign Key → users
- `projectId` - UUID, Foreign Key → projects
- `createdAt` - DateTime
- Unique Constraint auf (userId, projectId)

### time_entries
Zeiteinträge für Ein-/Ausstempeln.

**Felder:**
- `id` - UUID, Primary Key
- `userId` - UUID, Foreign Key → users
- `projectId` - UUID, Foreign Key → projects, optional
- `clockIn` - DateTime, Einstempelzeit
- `clockOut` - DateTime, Ausstempelzeit, optional
- `status` - Enum (CLOCKED_IN, CLOCKED_OUT)
- `description` - String, optional
- `createdAt` - DateTime
- `updatedAt` - DateTime
- Index auf (userId, clockIn)

### absence_requests
Urlaubs- und Abwesenheitsanträge.

**Felder:**
- `id` - UUID, Primary Key
- `userId` - UUID, Foreign Key → users
- `type` - Enum (VACATION, SICK_LEAVE, PERSONAL_LEAVE, UNPAID_LEAVE, OTHER)
- `startDate` - DateTime
- `endDate` - DateTime
- `days` - Float, Anzahl Tage
- `reason` - String, optional
- `status` - Enum (PENDING, APPROVED, REJECTED)
- `reviewedBy` - String, User-ID des Genehmigers, optional
- `reviewedAt` - DateTime, optional
- `createdAt` - DateTime
- `updatedAt` - DateTime
- Index auf (userId, status)

## Beziehungen

### User → TimeEntry (1:n)
Ein Benutzer kann viele Zeiteinträge haben.
Cascade Delete: Wenn User gelöscht wird, werden alle TimeEntries gelöscht.

### User → AbsenceRequest (1:n)
Ein Benutzer kann viele Abwesenheitsanträge haben.
Cascade Delete: Wenn User gelöscht wird, werden alle AbsenceRequests gelöscht.

### User → ProjectAssignment (1:n)
Ein Benutzer kann vielen Projekten zugeordnet sein.
Cascade Delete: Wenn User gelöscht wird, werden alle Zuordnungen gelöscht.

### Project → TimeEntry (1:n)
Ein Projekt kann viele Zeiteinträge haben.
Set Null: Wenn Project gelöscht wird, wird projectId auf NULL gesetzt.

### Project → ProjectAssignment (1:n)
Ein Projekt kann viele Benutzerzuordnungen haben.
Cascade Delete: Wenn Project gelöscht wird, werden alle Zuordnungen gelöscht.

## Enums

### UserRole
- ADMIN - Administrator mit vollen Rechten
- USER - Normaler Benutzer

### TimeEntryStatus
- CLOCKED_IN - Aktuell eingestempelt
- CLOCKED_OUT - Ausgestempelt

### AbsenceType
- VACATION - Urlaub
- SICK_LEAVE - Krankheit
- PERSONAL_LEAVE - Persönliche Gründe
- UNPAID_LEAVE - Unbezahlter Urlaub
- OTHER - Sonstiges

### RequestStatus
- PENDING - Warte auf Genehmigung
- APPROVED - Genehmigt
- REJECTED - Abgelehnt

## Migrationen

Datenbank-Migrationen werden mit Prisma verwaltet:

```bash
# Neue Migration erstellen
npx prisma migrate dev --name beschreibung

# Migration auf Production anwenden
npx prisma migrate deploy

# Prisma Client neu generieren
npx prisma generate

# Prisma Studio öffnen (GUI)
npx prisma studio
```
