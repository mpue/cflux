# cflux - Swiss Compliance Time Tracking System

## Architecture Overview

**Monorepo structure** with 3 main components:
- `backend/` - Node.js/Express REST API with Prisma ORM
- `frontend/` - React SPA (HashRouter for Electron compatibility)
- `desktop/` - Electron wrapper (optional deployment)

**Key principle**: Module-based permissions system (`ModuleAccess`) where admins define modules (time_tracking, invoices, etc.) and assign granular permissions (canView, canCreate, canEdit, canDelete) to user groups. Multi-group membership supported since Dec 2025.

## Database Schema

**Prisma schema**: `backend/prisma/schema.prisma` (1661 lines) - single source of truth
- **Core entities**: User, UserGroup, UserGroupMembership, Module, ModuleAccess
- **Domain models**: TimeEntry, Project, Invoice, DocumentNode, Order, Incident, Device, etc.
- **Swiss-specific**: ComplianceViolation (ArG/ArGV 1), OvertimeBalance, canton-based public holidays
- **Soft-delete pattern**: Most models have `isActive` boolean or `deletedAt` timestamp for audit compliance

**Migration workflow**: 
```powershell
cd backend
npm run prisma:migrate  # Creates and applies migrations
npm run prisma:generate # Updates Prisma client types
```

## Backend Patterns

**API structure**: `backend/src/`
- Routes (`routes/*.routes.ts`) → Controllers (`controllers/*.controller.ts`) → Services (`services/*.service.ts`) → Prisma
- All routes prefixed `/api/*` (see `backend/src/index.ts` for 26+ registered routes)
- **Auth middleware**: `authenticate` (JWT validation), `authorize(role)`, `requireAdmin`
- **Module permissions middleware**: `requireModuleAccess(moduleKey, action)` - checks user group permissions

**Example route pattern**:
```typescript
// time.routes.ts
router.post('/clock-in', authenticate, timeController.clockIn);
router.get('/user/:userId', authenticate, authorize('ADMIN'), timeController.getUserTimeEntries);
```

**Compliance service** (`services/compliance.service.ts`): Auto-triggered on clock-out to check violations (rest time, max hours, pause requirements) per Swiss labor law (ArG/ArGV 1). Creates `ComplianceViolation` records with severity levels.

**File uploads**: Use `multer` middleware, store in `backend/uploads/` with UUID filenames. DocumentNode attachments support versioning (see `docs/INTRANET_ATTACHMENTS.md`).

## Frontend Patterns

**API client**: `frontend/src/services/api.ts` - Axios instance with JWT token auto-injection from localStorage
```typescript
api.get('/time/my-entries')  // Automatically adds /api prefix and Bearer token
```

**Context providers** (React Context API):
- `AuthContext` - User state, login/logout, token management
- `ModuleContext` - Available modules for current user (fetched from `/api/modules/my-modules`)
- `ThemeContext` - Dark mode toggle

**Routing**: HashRouter (not BrowserRouter!) for Electron compatibility. `PrivateRoute` wrapper checks auth + admin/module permissions.

**Page structure**: `frontend/src/pages/` - Each page typically imports multiple components from `frontend/src/components/`

## Development Workflow

**Local development** (without Docker):
```powershell
# Terminal 1 - Backend
cd backend
npm install
npm run dev  # nodemon on port 3001

# Terminal 2 - Frontend  
cd frontend
npm install
npm start    # react-scripts on port 3000
```

**Docker deployment** (recommended):
```powershell
docker-compose up --build -d
# Frontend: http://localhost:3002
# Backend: http://localhost:3001
# Auto-seeds modules + creates admin@timetracking.local / admin123 (password change required on first login)
```

**Testing**:
```powershell
cd backend
npm test              # Jest unit tests
npm run test:backup   # Backup/restore integration tests
```

## Key Module Implementations

**Intranet** (DocumentNode tree):
- Hierarchical documents with `parentId` (like file system)
- **Attachments**: Separate versioning (`DocumentNodeAttachment` + `DocumentNodeAttachmentVersion`)
- **Permissions**: Group-based (`DocumentNodeGroupPermission`) with levels READ/WRITE/ADMIN
- **Search**: Full-text search across nodes/attachments with snippet highlighting (`/api/intranet/search`)

**Orders** (Bestellungen):
- 8-stage workflow: Draft → Requested → Approved → Ordered → Partially Received → Received/Cancelled/Rejected
- Auto-generated order numbers: `BO-XXXXXX`
- Supports partial deliveries via `OrderDelivery` table
- See `docs/ORDERS_MODULE.md` for full API

**Workflows** (Invoice approvals):
- Sequential approval steps (`Workflow` → `WorkflowStep` → `WorkflowInstance` → `WorkflowInstanceStep`)
- Auto-triggered on invoice status change to SENT
- Visual workflow editor component: `frontend/src/components/WorkflowEditor.tsx`

**Incidents/EHS**: Safety incident tracking with workflow approvals and root cause analysis

## Critical Files

- `backend/src/index.ts` - Express app setup, all route registrations
- `backend/prisma/schema.prisma` - Complete data model
- `backend/src/middleware/moduleAccess.ts` - Permission enforcement
- `frontend/src/App.tsx` - All route definitions + PrivateRoute logic
- `docs/MODULE_PERMISSIONS.md` - Permission system documentation
- `docs/DOCKER-QUICKSTART.md` - Fastest setup guide

## Common Tasks

**Add new module**:
1. Add to `Module` table via `backend/prisma/seedModules.ts`
2. Create routes/controllers in backend
3. Add route in `backend/src/index.ts`
4. Add page in `frontend/src/pages/`
5. Add route in `frontend/src/App.tsx`
6. Assign permissions via `/api/modules` endpoints or admin UI

**Add new model**:
1. Define in `backend/prisma/schema.prisma`
2. Run `npm run prisma:migrate` + `prisma:generate`
3. Create controller/service/routes in backend
4. Add TypeScript types in `frontend/src/types/` if needed

**Debugging**: Backend logs to console, check Docker logs with `docker-compose logs -f backend`. Frontend uses browser DevTools.
