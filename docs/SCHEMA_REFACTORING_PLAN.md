# Database Schema Refactoring Plan

## Aktueller Zustand

Das Prisma-Schema umfasst **1725+ Zeilen** mit **80+ Modellen** und ist funktional vollständig. Jedoch zeigt die Analyse kritische Architekturprobleme:

### 🔴 Hauptproblem: User Model Overload

Das `User`-Modell hat **über 60 Relationen** und fungiert als "God Object":

- **Authentifizierung**: email, password, role
- **Personaldaten**: firstName, lastName, dateOfBirth, phone, address, etc.
- **Anstellung**: employeeNumber, entryDate, ahvNumber, iban
- **Swiss Compliance**: weeklyHours, canton, contractHours, hourlyRate
- **60+ Relationen**: timeEntries, absenceRequests, devices, orders, invoices, etc.

**Folgen:**
- Performance-Probleme bei User-Queries
- Jede neue Feature erfordert User-Änderungen
- Keine klare Separation of Concerns
- Prisma Client wird sehr groß

---

## 📋 Empfohlene Refactoring-Strategie

### Phase 1: Aktuellen Stand deployen ✅

**Rationale:**
- System ist funktional und getestet
- <10 User = Performance-Probleme vernachlässigbar
- Kein Business-Risiko bei späteren Breaking Changes

```powershell
git checkout main
git merge develop
git push origin main
docker-compose up --build -d
```

---

### Phase 2: Refactoring-Branch anlegen

```powershell
git checkout -b feature/schema-refactoring-v2
```

**Scope:**
1. **Employee-Separation** (Priorität 1) - BREAKING CHANGE
2. **AuditLog-System** (Priorität 2) - Kompatibel
3. **Generic Assignment-Table** (Priorität 3) - Optional

---

## 🎯 Milestone 1: Employee-Modell trennen

### Ziel
Trennung von **Authentifizierung** (User) und **Personaldaten** (Employee)

### Neue Struktur

```prisma
// User = NUR Authentifizierung & Zugriff
model User {
  id          String @id @default(uuid())
  email       String @unique
  password    String
  role        UserRole
  isActive    Boolean
  requiresPasswordChange Boolean
  
  // ONE-TO-ONE Relation zu Employee
  employeeProfile Employee?
  
  // Auth-bezogen
  userGroupMemberships UserGroupMembership[]
  
  // Audit Trail (wer hat was getan)
  actionLogs ActionLog[]
  entityAudits EntityAudit[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Employee = Personaldaten + Arbeitsbezogene Relations
model Employee {
  id        String @id @default(uuid())
  userId    String @unique
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // ALLE Personal-Felder von User hierhin verschieben
  firstName String
  lastName  String
  email     String  // Dupliziert für Performance
  
  // Personalien
  dateOfBirth   DateTime?
  placeOfBirth  String?
  nationality   String?
  
  // Kontakt
  phone         String?
  mobile        String?
  street        String?
  streetNumber  String?
  zipCode       String?
  city          String?
  country       String?
  
  // Anstellung
  employeeNumber String? @unique
  entryDate     DateTime?
  exitDate      DateTime?
  
  // Bankverbindung
  iban          String?
  bankName      String?
  
  // Sozialversicherung & Steuern
  ahvNumber     String? @unique
  isCrossBorderCommuter Boolean @default(false)
  
  // Swiss Compliance
  weeklyHours        Int @default(40)
  canton             String?
  exemptFromTracking Boolean @default(false)
  contractHours      Float?
  hourlyRate         Float?
  
  // ALLE arbeits-bezogenen Relations
  timeEntries TimeEntry[] @relation("EmployeeTimeEntries")
  absenceRequests AbsenceRequest[] @relation("EmployeeAbsences")
  overtimeBalances OvertimeBalance[] @relation("EmployeeOvertime")
  complianceViolations ComplianceViolation[] @relation("EmployeeViolations")
  payrollEntries PayrollEntry[] @relation("EmployeePayroll")
  devices Device[] @relation("EmployeeDevices")
  deviceAssignments DeviceAssignment[] @relation("EmployeeDeviceAssignments")
  travelExpenses TravelExpense[] @relation("EmployeeTravelExpenses")
  projectAssignments ProjectAssignment[] @relation("EmployeeProjects")
  sentMessages Message[] @relation("SentByEmployee")
  receivedMessages Message[] @relation("ReceivedByEmployee")
  createdDocumentNodes DocumentNode[] @relation("DocumentCreatedByEmployee")
  updatedDocumentNodes DocumentNode[] @relation("DocumentUpdatedByEmployee")
  assignedEHSTodos EHSTodo[] @relation("AssignedEHSTodos")
  createdEHSTodos EHSTodo[] @relation("CreatedEHSTodos")
  assignedIncidents Incident[] @relation("AssignedIncidents")
  createdIncidents Incident[] @relation("CreatedIncidents")
  // ... weitere Relations nach Bedarf
  
  isActive  Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
  @@index([employeeNumber])
  @@index([email])
  @@index([isActive])
}
```

### Migration Script

```sql
-- Phase 1: Employee-Tabelle erstellen und Daten kopieren
INSERT INTO "Employee" (
  id, "userId", "firstName", "lastName", email,
  "dateOfBirth", phone, "employeeNumber", "entryDate",
  "ahvNumber", iban, "weeklyHours", canton, "contractHours", "hourlyRate",
  "isCrossBorderCommuter", "exemptFromTracking", "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(), 
  id as "userId",
  "firstName",
  "lastName",
  email,
  "dateOfBirth",
  phone,
  "employeeNumber",
  "entryDate",
  "ahvNumber",
  iban,
  COALESCE("weeklyHours", 40),
  canton,
  "contractHours",
  "hourlyRate",
  COALESCE("isCrossBorderCommuter", false),
  COALESCE("exemptFromTracking", false),
  "isActive",
  "createdAt",
  "updatedAt"
FROM "User"
WHERE role = 'USER';

-- Phase 2: Foreign Keys umbiegen (Beispiel TimeEntry)
ALTER TABLE "TimeEntry" ADD COLUMN "employeeId" VARCHAR;

UPDATE "TimeEntry" te
SET "employeeId" = e.id
FROM "Employee" e
WHERE te."userId" = e."userId";

-- Nicht-nullable machen
ALTER TABLE "TimeEntry" ALTER COLUMN "employeeId" SET NOT NULL;

-- Alte FK löschen, neue erstellen
ALTER TABLE "TimeEntry" 
  DROP CONSTRAINT IF EXISTS "TimeEntry_userId_fkey",
  DROP COLUMN "userId",
  ADD CONSTRAINT "TimeEntry_employeeId_fkey" 
    FOREIGN KEY ("employeeId") REFERENCES "Employee"(id) ON DELETE CASCADE;

CREATE INDEX "TimeEntry_employeeId_idx" ON "TimeEntry"("employeeId");

-- Phase 3: Wiederholen für alle Relations:
-- AbsenceRequest
ALTER TABLE "AbsenceRequest" ADD COLUMN "employeeId" VARCHAR;
UPDATE "AbsenceRequest" ar SET "employeeId" = e.id FROM "Employee" e WHERE ar."userId" = e."userId";
ALTER TABLE "AbsenceRequest" ALTER COLUMN "employeeId" SET NOT NULL;
ALTER TABLE "AbsenceRequest" DROP CONSTRAINT IF EXISTS "AbsenceRequest_userId_fkey", DROP COLUMN "userId";
ALTER TABLE "AbsenceRequest" ADD CONSTRAINT "AbsenceRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"(id);
CREATE INDEX "AbsenceRequest_employeeId_idx" ON "AbsenceRequest"("employeeId");

-- OvertimeBalance
ALTER TABLE "OvertimeBalance" ADD COLUMN "employeeId" VARCHAR;
UPDATE "OvertimeBalance" ob SET "employeeId" = e.id FROM "Employee" e WHERE ob."userId" = e."userId";
ALTER TABLE "OvertimeBalance" ALTER COLUMN "employeeId" SET NOT NULL;
ALTER TABLE "OvertimeBalance" DROP CONSTRAINT IF EXISTS "OvertimeBalance_userId_fkey", DROP COLUMN "userId";
ALTER TABLE "OvertimeBalance" ADD CONSTRAINT "OvertimeBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"(id);
CREATE INDEX "OvertimeBalance_employeeId_idx" ON "OvertimeBalance"("employeeId");

-- ComplianceViolation
ALTER TABLE "ComplianceViolation" ADD COLUMN "employeeId" VARCHAR;
UPDATE "ComplianceViolation" cv SET "employeeId" = e.id FROM "Employee" e WHERE cv."userId" = e."userId";
ALTER TABLE "ComplianceViolation" ALTER COLUMN "employeeId" SET NOT NULL;
ALTER TABLE "ComplianceViolation" DROP CONSTRAINT IF EXISTS "ComplianceViolation_userId_fkey", DROP COLUMN "userId";
ALTER TABLE "ComplianceViolation" ADD CONSTRAINT "ComplianceViolation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"(id);
CREATE INDEX "ComplianceViolation_employeeId_idx" ON "ComplianceViolation"("employeeId");

-- PayrollEntry
ALTER TABLE "PayrollEntry" ADD COLUMN "employeeId" VARCHAR;
UPDATE "PayrollEntry" pe SET "employeeId" = e.id FROM "Employee" e WHERE pe."userId" = e."userId";
ALTER TABLE "PayrollEntry" ALTER COLUMN "employeeId" SET NOT NULL;
ALTER TABLE "PayrollEntry" DROP CONSTRAINT IF EXISTS "PayrollEntry_userId_fkey", DROP COLUMN "userId";
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"(id);
CREATE INDEX "PayrollEntry_employeeId_idx" ON "PayrollEntry"("employeeId");

-- Device (owner)
ALTER TABLE "Device" ADD COLUMN "employeeId" VARCHAR;
UPDATE "Device" d SET "employeeId" = e.id FROM "Employee" e WHERE d."userId" = e."userId";
-- Device kann NULL sein (nicht zugewiesen)
ALTER TABLE "Device" DROP CONSTRAINT IF EXISTS "Device_userId_fkey", DROP COLUMN "userId";
ALTER TABLE "Device" ADD CONSTRAINT "Device_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"(id);
CREATE INDEX "Device_employeeId_idx" ON "Device"("employeeId");

-- DeviceAssignment
ALTER TABLE "DeviceAssignment" ADD COLUMN "employeeId" VARCHAR;
UPDATE "DeviceAssignment" da SET "employeeId" = e.id FROM "Employee" e WHERE da."userId" = e."userId";
ALTER TABLE "DeviceAssignment" ALTER COLUMN "employeeId" SET NOT NULL;
ALTER TABLE "DeviceAssignment" DROP CONSTRAINT IF EXISTS "DeviceAssignment_userId_fkey", DROP COLUMN "userId";
ALTER TABLE "DeviceAssignment" ADD CONSTRAINT "DeviceAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"(id);
CREATE INDEX "DeviceAssignment_employeeId_idx" ON "DeviceAssignment"("employeeId");

-- TravelExpense
ALTER TABLE "TravelExpense" ADD COLUMN "employeeId" VARCHAR;
UPDATE "TravelExpense" te SET "employeeId" = e.id FROM "Employee" e WHERE te."userId" = e."userId";
ALTER TABLE "TravelExpense" ALTER COLUMN "employeeId" SET NOT NULL;
ALTER TABLE "TravelExpense" DROP CONSTRAINT IF EXISTS "TravelExpense_userId_fkey", DROP COLUMN "userId";
ALTER TABLE "TravelExpense" ADD CONSTRAINT "TravelExpense_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"(id);
CREATE INDEX "TravelExpense_employeeId_idx" ON "TravelExpense"("employeeId");

-- ProjectAssignment
ALTER TABLE "ProjectAssignment" ADD COLUMN "employeeId" VARCHAR;
UPDATE "ProjectAssignment" pa SET "employeeId" = e.id FROM "Employee" e WHERE pa."userId" = e."userId";
ALTER TABLE "ProjectAssignment" ALTER COLUMN "employeeId" SET NOT NULL;
ALTER TABLE "ProjectAssignment" DROP CONSTRAINT IF EXISTS "ProjectAssignment_userId_fkey", DROP COLUMN "userId";
ALTER TABLE "ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"(id);
CREATE INDEX "ProjectAssignment_employeeId_idx" ON "ProjectAssignment"("employeeId");

-- Message (sender/receiver)
ALTER TABLE "Message" ADD COLUMN "senderEmployeeId" VARCHAR;
ALTER TABLE "Message" ADD COLUMN "receiverEmployeeId" VARCHAR;
UPDATE "Message" m SET "senderEmployeeId" = e.id FROM "Employee" e WHERE m."senderId" = e."userId";
UPDATE "Message" m SET "receiverEmployeeId" = e.id FROM "Employee" e WHERE m."receiverId" = e."userId";
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_senderId_fkey";
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_receiverId_fkey";
ALTER TABLE "Message" DROP COLUMN "senderId", DROP COLUMN "receiverId";
ALTER TABLE "Message" RENAME COLUMN "senderEmployeeId" TO "senderId";
ALTER TABLE "Message" RENAME COLUMN "receiverEmployeeId" TO "receiverId";
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Employee"(id);
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Employee"(id);
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- DocumentNode (createdBy/updatedBy)
ALTER TABLE "DocumentNode" ADD COLUMN "createdByEmployeeId" VARCHAR;
ALTER TABLE "DocumentNode" ADD COLUMN "updatedByEmployeeId" VARCHAR;
UPDATE "DocumentNode" dn SET "createdByEmployeeId" = e.id FROM "Employee" e WHERE dn."createdById" = e."userId";
UPDATE "DocumentNode" dn SET "updatedByEmployeeId" = e.id FROM "Employee" e WHERE dn."updatedById" = e."userId";
ALTER TABLE "DocumentNode" DROP CONSTRAINT IF EXISTS "DocumentNode_createdById_fkey";
ALTER TABLE "DocumentNode" DROP CONSTRAINT IF EXISTS "DocumentNode_updatedById_fkey";
ALTER TABLE "DocumentNode" DROP COLUMN "createdById", DROP COLUMN "updatedById";
ALTER TABLE "DocumentNode" RENAME COLUMN "createdByEmployeeId" TO "createdById";
ALTER TABLE "DocumentNode" RENAME COLUMN "updatedByEmployeeId" TO "updatedById";
ALTER TABLE "DocumentNode" ADD CONSTRAINT "DocumentNode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"(id);
ALTER TABLE "DocumentNode" ADD CONSTRAINT "DocumentNode_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"(id);

-- EHSTodo (assignedTo/createdBy)
ALTER TABLE "EHSTodo" ADD COLUMN "assignedToEmployeeId" VARCHAR;
ALTER TABLE "EHSTodo" ADD COLUMN "createdByEmployeeId" VARCHAR;
UPDATE "EHSTodo" et SET "assignedToEmployeeId" = e.id FROM "Employee" e WHERE et."assignedToId" = e."userId";
UPDATE "EHSTodo" et SET "createdByEmployeeId" = e.id FROM "Employee" e WHERE et."createdById" = e."userId";
ALTER TABLE "EHSTodo" ALTER COLUMN "createdByEmployeeId" SET NOT NULL;
ALTER TABLE "EHSTodo" DROP CONSTRAINT IF EXISTS "EHSTodo_assignedToId_fkey";
ALTER TABLE "EHSTodo" DROP CONSTRAINT IF EXISTS "EHSTodo_createdById_fkey";
ALTER TABLE "EHSTodo" DROP COLUMN "assignedToId", DROP COLUMN "createdById";
ALTER TABLE "EHSTodo" RENAME COLUMN "assignedToEmployeeId" TO "assignedToId";
ALTER TABLE "EHSTodo" RENAME COLUMN "createdByEmployeeId" TO "createdById";
ALTER TABLE "EHSTodo" ADD CONSTRAINT "EHSTodo_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"(id);
ALTER TABLE "EHSTodo" ADD CONSTRAINT "EHSTodo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"(id);

-- Incident (assignedTo/createdBy)
ALTER TABLE "Incident" ADD COLUMN "assignedToEmployeeId" VARCHAR;
ALTER TABLE "Incident" ADD COLUMN "createdByEmployeeId" VARCHAR;
UPDATE "Incident" i SET "assignedToEmployeeId" = e.id FROM "Employee" e WHERE i."assignedToId" = e."userId";
UPDATE "Incident" i SET "createdByEmployeeId" = e.id FROM "Employee" e WHERE i."createdById" = e."userId";
ALTER TABLE "Incident" ALTER COLUMN "createdByEmployeeId" SET NOT NULL;
ALTER TABLE "Incident" DROP CONSTRAINT IF EXISTS "Incident_assignedToId_fkey";
ALTER TABLE "Incident" DROP CONSTRAINT IF EXISTS "Incident_createdById_fkey";
ALTER TABLE "Incident" DROP COLUMN "assignedToId", DROP COLUMN "createdById";
ALTER TABLE "Incident" RENAME COLUMN "assignedToEmployeeId" TO "assignedToId";
ALTER TABLE "Incident" RENAME COLUMN "createdByEmployeeId" TO "createdById";
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"(id);
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"(id);

-- Phase 4: User-Felder löschen (nach vollständiger Migration & Test)
-- ALTER TABLE "User" 
--   DROP COLUMN "firstName",
--   DROP COLUMN "lastName",
--   DROP COLUMN "dateOfBirth",
--   DROP COLUMN "phone",
--   DROP COLUMN "employeeNumber",
--   DROP COLUMN "entryDate",
--   DROP COLUMN "ahvNumber",
--   DROP COLUMN "iban",
--   DROP COLUMN "weeklyHours",
--   DROP COLUMN "canton",
--   DROP COLUMN "contractHours",
--   DROP COLUMN "hourlyRate",
--   DROP COLUMN "isCrossBorderCommuter",
--   DROP COLUMN "exemptFromTracking";
```

### Betroffene Bereiche

**Backend Services (60+ Stellen):**
```typescript
// ❌ ALT
const user = await prisma.user.findUnique({
  where: { id },
  include: { 
    timeEntries: true,
    absenceRequests: true 
  }
});

// ✅ NEU
const employee = await prisma.employee.findUnique({
  where: { userId: id },
  include: {
    user: { select: { email: true, role: true, isActive: true } },
    timeEntries: true,
    absenceRequests: true
  }
});
```

**Frontend:**
```typescript
// ❌ ALT - AuthContext
const { user } = useAuth(); 
// user.firstName, user.timeEntries

// ✅ NEU - AuthContext
const { user, employee } = useAuth(); 
// user.email, user.role, user.isActive
// employee.firstName, employee.lastName, employee.timeEntries
```

---

## 🎯 Milestone 2: AuditLog-System

### Ziel
Zentrale Audit-History statt 40+ separate `createdById`, `updatedById` Relations

### Neue Struktur

```prisma
model EntityAudit {
  id          String @id @default(uuid())
  entityType  String  // "Invoice", "Order", "DocumentNode"
  entityId    String
  action      String  // "CREATED", "UPDATED", "APPROVED", "DELETED"
  
  userId      String
  user        User @relation(fields: [userId], references: [id])
  
  // Snapshot der Änderungen
  oldData     Json?
  newData     Json?
  diff        Json?  // Nur geänderte Felder
  
  ipAddress   String?
  userAgent   String?
  
  createdAt   DateTime @default(now())
  
  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
  @@index([action])
}
```

### Service Implementation

```typescript
// filepath: backend/src/services/audit.service.ts
import { PrismaClient } from '@prisma/client';
import { diff } from 'deep-object-diff';

const prisma = new PrismaClient();

interface AuditLogParams {
  entityType: string;
  entityId: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'APPROVED' | 'REJECTED';
  userId: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}

class AuditService {
  async logAction(params: AuditLogParams) {
    const changes = params.oldData && params.newData 
      ? diff(params.oldData, params.newData) 
      : null;
    
    return prisma.entityAudit.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        userId: params.userId,
        oldData: params.oldData || null,
        newData: params.newData || null,
        diff: changes,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent
      }
    });
  }
  
  async getHistory(entityType: string, entityId: string) {
    return prisma.entityAudit.findMany({
      where: { entityType, entityId },
      include: { 
        user: { 
          select: { 
            email: true,
            employeeProfile: {
              select: { firstName: true, lastName: true }
            }
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  async getUserActivity(userId: string, limit = 50) {
    return prisma.entityAudit.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const auditService = new AuditService();
```

### Controller Integration (KEIN Breaking Change)

```typescript
// filepath: backend/src/controllers/invoice.controller.ts
import { auditService } from '../services/audit.service';

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.create({ data: req.body });
    
    // Parallel: Audit-Log
    await auditService.logAction({
      entityType: 'Invoice',
      entityId: invoice.id,
      action: 'CREATED',
      userId: req.user!.id,
      newData: invoice,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const oldInvoice = await prisma.invoice.findUnique({ 
      where: { id: req.params.id } 
    });
    
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: req.body
    });
    
    // Audit-Log mit diff
    await auditService.logAction({
      entityType: 'Invoice',
      entityId: invoice.id,
      action: 'UPDATED',
      userId: req.user!.id,
      oldData: oldInvoice,
      newData: invoice,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};
```

### Middleware für automatisches Logging

```typescript
// filepath: backend/src/middleware/auditLog.ts
import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';

export const auditMiddleware = (entityType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data: any) {
      // Log nach erfolgreicher Response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const action = req.method === 'POST' ? 'CREATED' : 
                       req.method === 'PUT' || req.method === 'PATCH' ? 'UPDATED' :
                       req.method === 'DELETE' ? 'DELETED' : null;
        
        if (action && req.user && data.id) {
          auditService.logAction({
            entityType,
            entityId: data.id,
            action,
            userId: req.user.id,
            newData: data,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          }).catch(err => console.error('Audit log failed:', err));
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

// Verwendung in Routes:
router.post('/invoices', authenticate, auditMiddleware('Invoice'), invoiceController.create);
```

---

## 🎯 Milestone 3: Generic Assignments (Optional)

### Ziel
Vereinfachung von Zuweisungen (assignedTo, supervisor, approver)

```prisma
model EntityAssignment {
  id          String @id @default(uuid())
  entityType  String  // "Project", "Incident", "EHSTodo", "Order"
  entityId    String
  employeeId  String
  role        String  // "ASSIGNED", "SUPERVISOR", "APPROVER", "REVIEWER"
  
  employee    Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([entityType, entityId, employeeId, role])
  @@index([employeeId])
  @@index([entityType, entityId])
  @@index([isActive])
}
```

### Service Implementation

```typescript
// filepath: backend/src/services/assignment.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class AssignmentService {
  async assign(
    entityType: string,
    entityId: string,
    employeeId: string,
    role: string
  ) {
    return prisma.entityAssignment.upsert({
      where: {
        entityType_entityId_employeeId_role: {
          entityType,
          entityId,
          employeeId,
          role
        }
      },
      create: {
        entityType,
        entityId,
        employeeId,
        role
      },
      update: {
        isActive: true
      }
    });
  }
  
  async unassign(
    entityType: string,
    entityId: string,
    employeeId: string,
    role: string
  ) {
    return prisma.entityAssignment.updateMany({
      where: {
        entityType,
        entityId,
        employeeId,
        role
      },
      data: {
        isActive: false
      }
    });
  }
  
  async getAssignments(entityType: string, entityId: string) {
    return prisma.entityAssignment.findMany({
      where: {
        entityType,
        entityId,
        isActive: true
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }
  
  async getEmployeeAssignments(employeeId: string, entityType?: string) {
    return prisma.entityAssignment.findMany({
      where: {
        employeeId,
        isActive: true,
        ...(entityType && { entityType })
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const assignmentService = new AssignmentService();
```

---

## 📊 Vorher/Nachher Vergleich

| Metrik | Vorher | Nachher |
|--------|--------|---------|
| User Relations | **60+** | **~15** |
| Employee Relations | **0** | **~50** |
| Auth Query Size | ~500KB | ~5KB |
| Employee Query Size | N/A | ~200KB |
| Schema-Änderungen bei neuem Modul | User + Modul | Nur Modul |
| Prisma Client Size | Groß | Mittel |
| Separation of Concerns | ❌ | ✅ |
| Audit Trail | 40+ Relations | 1 Tabelle |
| Assignment Management | N separate fields | 1 generic table |

---

## 🚀 Timeline & Aufwand

**Realistische Schätzung:**
- **Milestone 1 (Employee)**: 2-3 Wochen (inkl. Testing)
- **Milestone 2 (Audit)**: 1-2 Wochen (parallel möglich)
- **Milestone 3 (Assignments)**: 1-2 Wochen (optional)

**Kritischer Pfad:**
```
Week 1-2:  Prisma Schema ändern → Migration Script schreiben
Week 2-3:  Backend Services anpassen (46+ Controller/Services)
Week 3-4:  Frontend AuthContext + Components refactoren
Week 4:    Integration Testing
Week 5:    Staging Deployment & Testing
Week 6:    Production Migration
```

---

## ✅ Checkliste

### Pre-Refactoring
- [ ] Backup der Production DB erstellen (`pg_dump`)
- [ ] Feature-Freeze dokumentieren (keine neuen Features während Refactoring)
- [ ] Branch `feature/schema-refactoring-v2` erstellen
- [ ] Staging-Environment aufsetzen (separate Docker-Instance)
- [ ] Migration Script auf Kopie der Prod-DB testen

### Employee-Migration
- [ ] `Employee`-Modell in Prisma Schema definieren
- [ ] Migration Script schreiben (SQL oben)
- [ ] Script auf Staging-DB testen
- [ ] Rollback-Script schreiben
- [ ] Alle 46+ Backend Relations umbiegen
- [ ] Backend Services anpassen (Controller/Services)
- [ ] Frontend AuthContext refactoren
- [ ] Alle API Endpoints testen (Postman/Insomnia)
- [ ] Frontend Components anpassen (User → Employee)

### Testing
- [ ] Unit Tests für neue Services schreiben
- [ ] Integration Tests (kritische Flows: Login, Time Tracking, Invoices)
- [ ] Frontend E2E Tests (Playwright/Cypress)
- [ ] Performance-Tests (Query-Geschwindigkeit vergleichen)
- [ ] Load Testing (mit k6 oder Artillery)
- [ ] Rollback-Test auf Staging durchführen

### Deployment
- [ ] Migration mehrfach auf Staging testen (min. 3x)
- [ ] Rollback-Plan detailliert dokumentieren
- [ ] Downtime-Fenster planen (empfohlen: Wochenende, 2-4 Stunden)
- [ ] Monitoring-Alerts konfigurieren (Sentry, Datadog, etc.)
- [ ] Backup unmittelbar vor Production-Migration
- [ ] Production-Migration durchführen
- [ ] Smoke Tests nach Migration (Login, CRUD-Operationen)
- [ ] Post-Migration Monitoring (24h intensiv, dann 1 Woche)

---

## 🔥 Kritische Code-Stellen

### Backend Services zu ändern (46+ Dateien)

```
backend/src/controllers/
  ✓ timeController.ts              - TimeEntry Relations
  ✓ absenceController.ts           - AbsenceRequest Relations
  ✓ payrollController.ts           - PayrollEntry Relations
  ✓ deviceController.ts            - Device Relations
  ✓ travelExpenseController.ts     - TravelExpense Relations
  ✓ invoiceController.ts           - Invoice createdBy/updatedBy
  ✓ orderController.ts             - Order createdBy/updatedBy
  ✓ incidentController.ts          - Incident assignedTo/createdBy
  ✓ documentController.ts          - DocumentNode createdBy/updatedBy
  ✓ messageController.ts           - Message sender/receiver
  ✓ ehsController.ts               - EHSMonthlyData, EHSTodo
  ✓ projectController.ts           - ProjectAssignment
  ✓ complianceController.ts        - ComplianceViolation
  ✓ authController.ts              - User login/register
  ... (alle Module mit User-Bezug)

backend/src/services/
  ✓ timeService.ts
  ✓ complianceService.ts
  ✓ payrollService.ts
  ✓ emailService.ts               - Mitarbeiter-E-Mails
  ... (analog)
```

### Frontend Components zu ändern (30+ Dateien)

```
frontend/src/
  ⚠️ contexts/AuthContext.tsx      - CRITICAL: User + Employee State
  ⚠️ services/api.ts               - API calls anpassen
  
  ✓ pages/TimeTracking/*.tsx
  ✓ pages/Absences/*.tsx
  ✓ pages/Payroll/*.tsx
  ✓ pages/Devices/*.tsx
  ✓ pages/Orders/*.tsx
  ✓ pages/Invoices/*.tsx
  ✓ pages/Incidents/*.tsx
  ✓ pages/EHS/*.tsx
  ✓ pages/Projects/*.tsx
  
  ✓ components/UserProfile.tsx
  ✓ components/TimeEntry.tsx
  ✓ components/Navbar.tsx          - User-Anzeige
  ✓ components/UserSelect.tsx      - Dropdowns
  ... (alle Komponenten mit User-Daten)
```

### AuthContext Refactoring (CRITICAL)

```typescript
// filepath: frontend/src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;              // Auth-Daten
  employee: Employee | null;      // NEU: Personaldaten
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Load User + Employee on mount
useEffect(() => {
  const loadUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      // User Auth-Daten
      const userRes = await api.get('/auth/me');
      setUser(userRes.data);
      
      // Employee-Daten (falls vorhanden)
      const empRes = await api.get('/employees/me');
      setEmployee(empRes.data);
    } catch (error) {
      logout();
    }
  };
  
  loadUserData();
}, []);
```

---

## 🛡️ Rollback-Plan

### Wenn Migration fehlschlägt:

**Schritt 1: Sofort Container stoppen**
```bash
docker-compose down
```

**Schritt 2: Daten wiederherstellen**
```bash
# Backup einspielen
docker exec -i cflux-postgres-1 psql -U postgres -d cflux < backup_pre_migration.sql

# Oder via pgAdmin/psql direkt
psql -h localhost -U postgres -d cflux < backup_pre_migration.sql
```

**Schritt 3: Code zurücksetzen**
```bash
git checkout main
git pull origin main

# Container mit altem Code neu bauen
docker-compose build --no-cache
docker-compose up -d
```

**Schritt 4: Verifikation**
- [ ] Login funktioniert (admin@timetracking.local / admin123)
- [ ] Time Tracking laden (GET /api/time/my-entries)
- [ ] Neue Time Entry erstellen (POST /api/time/clock-in)
- [ ] Invoices laden (GET /api/invoices)
- [ ] Orders laden (GET /api/orders)

**Schritt 5: Post-Mortem**
- Fehlerursache dokumentieren
- Migration Script anpassen
- Erneut auf Staging testen

---

## 💡 Best Practices

### Während der Migration:

1. **Incremental Testing**: Nach jedem umgebogenen FK sofort testen
   ```bash
   npm test -- timeController.test.ts
   ```

2. **Feature Flags**: Neue Employee-Queries hinter Flag verstecken
   ```typescript
   const USE_EMPLOYEE_MODEL = process.env.USE_EMPLOYEE_MODEL === 'true';
   
   const user = USE_EMPLOYEE_MODEL 
     ? await getEmployeeData(userId) 
     : await getUserData(userId);
   ```

3. **Parallel Run**: Alte + neue Queries parallel laufen lassen (1 Woche)
   ```typescript
   const [oldResult, newResult] = await Promise.all([
     oldUserQuery(),
     newEmployeeQuery()
   ]);
   // Compare & log differences
   if (JSON.stringify(oldResult) !== JSON.stringify(newResult)) {
     logger.warn('Data mismatch detected', { oldResult, newResult });
   }
   return newResult; // Use new, but monitor
   ```

4. **Monitoring**: Query-Performance vor/nach Migration vergleichen
   - Prisma Query Insights aktivieren
   - Slow Query Log in PostgreSQL aktivieren
   - Response Times in Frontend messen

5. **Documentation**: Jede Änderung dokumentieren
   - Commit Messages: `refactor(schema): migrate TimeEntry to Employee relation`
   - Code Comments: `// BREAKING CHANGE: userId -> employeeId`

### Nach der Migration:

1. **Performance Monitoring**: 1 Woche intensiv überwachen
   - Sentry/Datadog Alerts
   - Database Query Metrics
   - Frontend Vitals (Core Web Vitals)

2. **User Feedback**: Mitarbeiter aktiv nach Problemen fragen
   - Feedback-Form im UI einbauen
   - Daily Standups mit Stakeholdern

3. **Cleanup**: Deprecated Code entfernen (nach 2 Wochen Stabilität)
   ```typescript
   // Nach 2 Wochen ohne Incidents:
   git grep -l "oldUserQuery" | xargs sed -i '/oldUserQuery/d'
   ```

4. **Documentation Update**: README und API Docs aktualisieren
   - Swagger/OpenAPI Specs updaten
   - Postman Collections aktualisieren

---

## 📚 Weiterführende Aufgaben

Nach erfolgreichem Refactoring:

1. **Indexes optimieren**: Basierend auf tatsächlichen Query-Patterns
   ```sql
   -- Analyze query patterns
   SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
   
   -- Add indexes based on findings
   CREATE INDEX idx_employee_email ON "Employee"(email) WHERE "isActive" = true;
   ```

2. **Connection Pooling**: Prisma Connection Pool tunen
   ```javascript
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     connectionLimit = 20
     poolTimeout = 30
   }
   ```

3. **Caching-Layer**: Redis für häufige Employee-Queries
   ```typescript
   const cachedEmployee = await redis.get(`employee:${userId}`);
   if (cachedEmployee) return JSON.parse(cachedEmployee);
   
   const employee = await prisma.employee.findUnique({ ... });
   await redis.setex(`employee:${userId}`, 3600, JSON.stringify(employee));
   ```

4. **GraphQL Migration**: Optional: REST → GraphQL für flexible Queries
   - Weniger Overfetching
   - Client entscheidet welche Felder
   - Apollo Server + Prisma Integration

5. **TypeScript Strict Mode**: Typing nach Employee-Trennung verbessern
   ```typescript
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

---

## 🎓 Lessons Learned

**Für zukünftige Projekte:**

1. ✅ **Schema-First Design**: Trennung von Auth und Business Logic von Anfang an
   - `User` = Authentifizierung, Zugriff
   - `Employee` = Personaldaten, Arbeitsverhältnis
   - `Customer`, `Supplier` = Externe Entitäten

2. ✅ **Bounded Contexts**: Jedes Modul hat eigenes Aggregate Root
   - Time Tracking → `Employee` als Root
   - Invoicing → `Customer` als Root
   - Orders → `Supplier` als Root

3. ✅ **Audit-First**: Zentrale Audit-Tabelle von Anfang an
   - Nicht 40+ `createdById` Relations
   - Eine `EntityAudit` Tabelle für alles

4. ✅ **Progressive Enhancement**: Neue Features modular hinzufügen
   - Keine God Objects
   - Klare Domain-Grenzen

5. ✅ **Testing Strategy**: Integration Tests vor großen Refactorings
   - Test Coverage > 80% vor Refactoring
   - E2E Tests für kritische User Journeys

---

## 🔐 Sicherheit & Compliance

### DSGVO-Konformität

Nach Refactoring:
- ✅ Personendaten in separatem `Employee` Model
- ✅ Einfacheres Löschen bei Datenauskunft (CASCADE)
- ✅ Audit-Trail für alle Änderungen
- ✅ Verschlüsselung sensibler Felder (ahvNumber, iban)

### Swiss Labor Law Compliance

- ✅ `ComplianceViolation` bleibt unverändert
- ✅ Zeiterfassung weiterhin vollständig
- ✅ Audit-Trail für Revisionssicherheit

---

## 📞 Support & Hilfe

Bei Problemen während der Migration:

1. **Dokumentation prüfen**: Dieses Dokument + `docs/` Ordner
2. **Logs prüfen**: 
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f postgres
   ```
3. **Rollback durchführen**: Siehe Rollback-Plan oben
4. **Issue erstellen**: GitHub Issues mit Label `migration`

---

**Dokument erstellt am:** 24. Januar 2025  
**Letztes Update:** 24. Januar 2025  
**Version:** 1.0  
**Status:** 📋 Planung → Ready for Implementation

**Nächste Schritte:**
1. ✅ Current State auf `main` mergen & deployen
2. ⏳ Branch `feature/schema-refactoring-v2` erstellen
3. ⏳ Milestone 1 starten: Employee-Separation