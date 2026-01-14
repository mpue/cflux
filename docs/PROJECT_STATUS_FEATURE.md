# Projekt-Status Feature

## Übersicht

Projekten kann jetzt ein dedizierter Status zugewiesen werden, der unabhängig vom aktiv/inaktiv-Zustand verwaltet wird.

## Status-Optionen

- **PLANNING** (Planung) - Gelb mit schwarzer Schrift
- **ACTIVE** (Aktiv) - Türkis mit weißer Schrift
- **ON_HOLD** (Pausiert) - Rot mit weißer Schrift
- **COMPLETED** (Abgeschlossen) - Grün mit weißer Schrift
- **CANCELLED** (Abgebrochen) - Grau mit weißer Schrift

## Implementation

### Backend

#### Prisma Schema
```prisma
enum ProjectStatus {
  PLANNING
  ACTIVE
  ON_HOLD
  COMPLETED
  CANCELLED
}

model Project {
  ...
  status      ProjectStatus @default(PLANNING)
  ...
}
```

#### API
- **POST /api/projects** - Status kann bei Erstellung angegeben werden (default: PLANNING)
- **PUT /api/projects/:id** - Status kann geändert werden

### Frontend

#### Projektübersicht (ProjectsTab)
- Status wird als farbiges Badge in der Projekttabelle angezeigt
- Beim Erstellen/Bearbeiten von Projekten kann der Status über ein Dropdown-Menü gewählt werden

#### Projekt-Reports (ProjectReportsTab)
- Status-Labels wurden visuell verbessert (bessere Kontraste, größere Schrift)

## Verwendung

1. **Neues Projekt erstellen:**
   - Admin Dashboard → Projekte → "Neues Projekt"
   - Status auswählen (Standard: Planung)

2. **Projektstatus ändern:**
   - Admin Dashboard → Projekte → "Bearbeiten"
   - Status im Dropdown ändern
   - Speichern

3. **Status ansehen:**
   - In der Projektübersicht wird der Status als farbiges Badge angezeigt
   - Der "Aktiv"-Zustand wird zusätzlich als "(Inaktiv)" Label angezeigt, falls das Projekt deaktiviert ist

## Technische Details

- **Datenbank**: PostgreSQL mit Prisma ORM
- **Migration**: Via `prisma db push` automatisch angewendet
- **Type-Safety**: TypeScript-Type `ProjectStatus` im Frontend definiert
- **Rückwärtskompatibilität**: Bestehende Projekte erhalten automatisch den Status "PLANNING"
