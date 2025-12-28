# Modul-Berechtigungssystem

## Übersicht

Das Modul-Berechtigungssystem ermöglicht eine granulare Zugriffskontrolle auf verschiedene Funktionsbereiche der Anwendung. Module können einer oder mehreren Benutzergruppen zugeordnet werden, und Benutzer erhalten nur Zugriff auf Module, die ihrer Gruppe zugewiesen sind.

## Konzepte

### Module
Ein Modul repräsentiert einen funktionalen Bereich der Anwendung (z.B. Zeiterfassung, Rechnungen, Projekte).

**Eigenschaften:**
- `name`: Anzeigename des Moduls
- `key`: Eindeutiger Schlüssel (z.B. `time_tracking`, `invoices`)
- `description`: Optionale Beschreibung
- `icon`: Material-UI Icon Name
- `route`: Frontend-Route (z.B. `/time`)
- `isActive`: Status (aktiv/inaktiv)
- `sortOrder`: Reihenfolge in der Anzeige

### Berechtigungen
Jede Modulzuordnung zu einer Benutzergruppe hat vier Berechtigungsstufen:

- **canView**: Kann das Modul sehen und Daten lesen
- **canCreate**: Kann neue Einträge erstellen
- **canEdit**: Kann bestehende Einträge bearbeiten
- **canDelete**: Kann Einträge löschen

### Administratoren
Benutzer mit der Rolle `ADMIN` haben automatisch vollen Zugriff auf alle Module, unabhängig von ihrer Gruppenzugehörigkeit.

## Datenmodell

### Module-Tabelle
```prisma
model Module {
  id          String   @id @default(uuid())
  name        String   @unique
  key         String   @unique
  description String?
  icon        String?
  route       String?
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  groupAccess ModuleAccess[]
}
```

### ModuleAccess-Tabelle
```prisma
model ModuleAccess {
  id          String   @id @default(uuid())
  moduleId    String
  userGroupId String
  canView     Boolean  @default(true)
  canCreate   Boolean  @default(false)
  canEdit     Boolean  @default(false)
  canDelete   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  module      Module    @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  userGroup   UserGroup @relation(fields: [userGroupId], references: [id], onDelete: Cascade)
  
  @@unique([moduleId, userGroupId])
}
```

## Installation & Setup

### 1. Datenbank-Migration ausführen

```bash
cd backend
npm run prisma:migrate
```

### 2. Module initialisieren

Führe das Seed-Script aus, um Standard-Module zu erstellen:

```bash
cd backend
npx ts-node prisma/seedModules.ts
```

Dies erstellt folgende Module:
- Dashboard
- Zeiterfassung
- Projekte
- Kunden
- Lieferanten
- Artikel
- Rechnungen
- Mahnungen
- Abwesenheiten
- Berichte
- Compliance
- Vorfälle
- Benutzer
- Benutzergruppen
- Module
- Einstellungen

### 3. Frontend-Integration

Füge den ModuleProvider in deine App ein:

```tsx
// App.tsx
import { ModuleProvider } from './contexts/ModuleContext';

function App() {
  return (
    <AuthProvider>
      <ModuleProvider>
        {/* Rest der App */}
      </ModuleProvider>
    </AuthProvider>
  );
}
```

## Backend-Verwendung

### Module verwalten

```typescript
import { moduleService } from './services/module.service';

// Alle Module abrufen
const modules = await moduleService.getAllModules();

// Modul erstellen
const newModule = await moduleService.createModule({
  name: 'Bestellungen',
  key: 'orders',
  description: 'Bestellverwaltung',
  icon: 'shopping_cart',
  route: '/orders',
  sortOrder: 20,
});

// Module für einen Benutzer abrufen
const userModules = await moduleService.getModulesForUser(userId);
```

### Berechtigungen verwalten

```typescript
// Modulzugriff gewähren
await moduleService.grantModuleAccess(
  moduleId,
  userGroupId,
  {
    canView: true,
    canCreate: true,
    canEdit: false,
    canDelete: false,
  }
);

// Berechtigungen aktualisieren
await moduleService.updateModuleAccess(accessId, {
  canEdit: true,
  canDelete: true,
});

// Zugriff entziehen
await moduleService.revokeModuleAccess(accessId);
```

### Middleware für Route-Schutz

```typescript
import { requireModuleAccess, canCreateInModule } from './middleware/moduleAccess';

// Route nur für Benutzer mit View-Berechtigung
router.get('/time-entries', 
  authenticate, 
  requireModuleAccess('time_tracking', 'canView'),
  getAllTimeEntries
);

// Route nur für Benutzer mit Create-Berechtigung
router.post('/time-entries', 
  authenticate, 
  canCreateInModule('time_tracking'),
  createTimeEntry
);
```

## Frontend-Verwendung

### ModuleContext verwenden

```tsx
import { useModules } from '../contexts/ModuleContext';

function MyComponent() {
  const { 
    modules, 
    hasModuleAccess, 
    canCreate, 
    canEdit, 
    canDelete 
  } = useModules();

  // Prüfen, ob Benutzer Zugriff hat
  if (hasModuleAccess('invoices')) {
    // Zeige Rechnungen-Bereich
  }

  // Prüfen, ob Benutzer erstellen darf
  if (canCreate('customers')) {
    // Zeige "Neuer Kunde" Button
  }

  return (
    <div>
      {modules.map(module => (
        <MenuItem key={module.id} to={module.route}>
          {module.name}
        </MenuItem>
      ))}
    </div>
  );
}
```

### Route-Schutz

```tsx
import ProtectedModuleRoute from './components/ProtectedModuleRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route 
        path="/time" 
        element={
          <ProtectedModuleRoute moduleKey="time_tracking">
            <TimeTrackingPage />
          </ProtectedModuleRoute>
        } 
      />
      
      <Route 
        path="/invoices/new" 
        element={
          <ProtectedModuleRoute 
            moduleKey="invoices" 
            requiredPermission="canCreate"
          >
            <CreateInvoicePage />
          </ProtectedModuleRoute>
        } 
      />
    </Routes>
  );
}
```

### Bedingte UI-Elemente

```tsx
import { useModules } from '../contexts/ModuleContext';

function InvoiceList() {
  const { canCreate, canEdit, canDelete } = useModules();

  return (
    <div>
      {canCreate('invoices') && (
        <Button onClick={handleCreate}>Neue Rechnung</Button>
      )}
      
      <InvoiceTable>
        {invoices.map(invoice => (
          <TableRow key={invoice.id}>
            <TableCell>{invoice.number}</TableCell>
            {canEdit('invoices') && (
              <IconButton onClick={() => handleEdit(invoice.id)}>
                <EditIcon />
              </IconButton>
            )}
            {canDelete('invoices') && (
              <IconButton onClick={() => handleDelete(invoice.id)}>
                <DeleteIcon />
              </IconButton>
            )}
          </TableRow>
        ))}
      </InvoiceTable>
    </div>
  );
}
```

## Administration

### Module verwalten

Navigiere zu `/modules`, um:
- Neue Module zu erstellen
- Bestehende Module zu bearbeiten
- Module zu aktivieren/deaktivieren
- Die Reihenfolge der Module anzupassen

### Berechtigungen zuweisen

Navigiere zu `/module-permissions`, um:
1. Eine Benutzergruppe auszuwählen
2. Für jedes Modul die Berechtigungen zu setzen:
   - ✓ Ansehen
   - ✓ Erstellen
   - ✓ Bearbeiten
   - ✓ Löschen
3. Alle Änderungen zu speichern

## API-Endpunkte

### Module

```
GET    /api/modules                    - Alle Module abrufen
GET    /api/modules/:id                - Modul nach ID abrufen
POST   /api/modules                    - Neues Modul erstellen (Admin)
PUT    /api/modules/:id                - Modul aktualisieren (Admin)
DELETE /api/modules/:id                - Modul löschen (Admin)
GET    /api/modules/user/me            - Module des aktuellen Benutzers
GET    /api/modules/user/:userId       - Module eines Benutzers
```

### Berechtigungen

```
POST   /api/modules/:moduleId/access   - Modulzugriff gewähren (Admin)
PUT    /api/modules/access/:accessId   - Berechtigungen aktualisieren (Admin)
DELETE /api/modules/access/:accessId   - Zugriff entziehen (Admin)
GET    /api/modules/group/:groupId/access - Zugriffe einer Gruppe
GET    /api/modules/:moduleId/groups   - Gruppen für ein Modul
```

## Best Practices

### 1. Minimale Berechtigungen
Gewähre nur die Berechtigungen, die wirklich benötigt werden.

### 2. Modulare Struktur
Erstelle Module für logisch getrennte Funktionsbereiche.

### 3. Konsistente Schlüssel
Verwende einheitliche Namenskonventionen für Modulschlüssel (z.B. snake_case).

### 4. Frontend und Backend abgleichen
Stelle sicher, dass Frontend-Routes und Backend-Middleware denselben Modulschlüssel verwenden.

### 5. Testing
Teste Berechtigungen für verschiedene Benutzergruppen gründlich.

## Beispiel-Workflow

### Neues Modul "Bestellungen" hinzufügen

1. **Modul erstellen:**
```typescript
await moduleService.createModule({
  name: 'Bestellungen',
  key: 'orders',
  description: 'Verwaltung von Bestellungen',
  icon: 'shopping_cart',
  route: '/orders',
  sortOrder: 20,
});
```

2. **Backend-Routes schützen:**
```typescript
router.get('/orders', 
  authenticate, 
  requireModuleAccess('orders', 'canView'),
  getAllOrders
);
```

3. **Frontend-Route schützen:**
```tsx
<Route 
  path="/orders" 
  element={
    <ProtectedModuleRoute moduleKey="orders">
      <OrdersPage />
    </ProtectedModuleRoute>
  } 
/>
```

4. **Berechtigungen zuweisen:**
- Navigiere zu `/module-permissions`
- Wähle Benutzergruppe aus
- Setze Berechtigungen für "Bestellungen"
- Speichern

## Fehlerbehebung

### Benutzer sieht ein Modul nicht
- Prüfe, ob der Benutzer einer Benutzergruppe zugeordnet ist
- Prüfe, ob die Gruppe Zugriff auf das Modul hat
- Prüfe, ob `canView` aktiviert ist
- Prüfe, ob das Modul aktiv ist (`isActive: true`)

### Backend gibt 403 Forbidden
- Prüfe, ob die Middleware korrekt konfiguriert ist
- Prüfe, ob der richtige Modulschlüssel verwendet wird
- Prüfe die Berechtigungsstufe (canView, canCreate, etc.)

### Migration-Fehler
- Stelle sicher, dass die Datenbank läuft
- Prüfe die Verbindungskonfiguration in `.env`
- Führe `npm run prisma:generate` aus

## Sicherheitshinweise

1. **Niemals Frontend-Berechtigungen allein vertrauen:** Implementiere immer serverseitige Prüfungen.
2. **Admin-Rolle schützen:** Nur vertrauenswürdige Benutzer sollten Admin-Rechte haben.
3. **Audit-Logging:** Erwäge das Logging von Berechtigungsänderungen.
4. **Regelmäßige Reviews:** Überprüfe regelmäßig die Berechtigungen der Benutzergruppen.

## Nächste Schritte

- [ ] Migration ausführen (wenn Datenbank läuft)
- [ ] Module seeden
- [ ] Benutzergruppen erstellen
- [ ] Berechtigungen zuweisen
- [ ] Bestehende Routes mit Middleware schützen
- [ ] Frontend-Routes mit ProtectedModuleRoute schützen
- [ ] Tests schreiben
