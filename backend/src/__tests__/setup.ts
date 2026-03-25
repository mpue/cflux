import { PrismaClient } from '@prisma/client';

// Set environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';

// Helper to create a stateful CRUD mock with in-memory store
let autoId = 0;
const stores: Record<string, any[]> = {};

const crudMock = (tableName?: string) => {
  const key = tableName || `table-${Object.keys(stores).length}`;
  stores[key] = [];
  const store = stores[key];
  
  return {
    findUnique: jest.fn().mockImplementation((args: any) => {
      if (!args?.where) return Promise.resolve(null);
      const found = store.find((r: any) =>
        Object.entries(args.where).every(([k, v]: [string, any]) => r[k] === v)
      );
      return Promise.resolve(found || null);
    }),
    findMany: jest.fn().mockImplementation((args: any) => {
      if (!args?.where) return Promise.resolve([...store]);
      return Promise.resolve(store.filter((r: any) =>
        Object.entries(args.where).every(([k, v]: [string, any]) => {
          if (v === null) return r[k] === null || r[k] === undefined;
          if (typeof v === 'object' && v !== null) return true;
          return r[k] === v;
        })
      ));
    }),
    findFirst: jest.fn().mockImplementation((args: any) => {
      if (!args?.where) return Promise.resolve(store[0] || null);
      const found = store.find((r: any) =>
        Object.entries(args.where).every(([k, v]: [string, any]) => {
          if (v === null) return r[k] === null || r[k] === undefined;
          if (typeof v === 'object' && v !== null) return true;
          return r[k] === v;
        })
      );
      return Promise.resolve(found || null);
    }),
    create: jest.fn().mockImplementation((args: any) => {
      autoId++;
      const record = { id: `mock-id-${autoId}`, ...args?.data };
      store.push(record);
      return Promise.resolve(record);
    }),
    createMany: jest.fn(),
    update: jest.fn().mockImplementation((args: any) => {
      const idx = store.findIndex((r: any) =>
        args?.where && Object.entries(args.where).every(([k, v]: [string, any]) => r[k] === v)
      );
      if (idx >= 0) {
        Object.assign(store[idx], args?.data);
        return Promise.resolve({ ...store[idx] });
      }
      return Promise.resolve({ ...args?.where, ...args?.data });
    }),
    updateMany: jest.fn().mockImplementation((args: any) => {
      if (args?.data) {
        store.forEach((r: any) => Object.assign(r, args.data));
      }
      return Promise.resolve({ count: store.length });
    }),
    delete: jest.fn().mockImplementation((args: any) => {
      const idx = store.findIndex((r: any) =>
        args?.where && Object.entries(args.where).every(([k, v]: [string, any]) => r[k] === v)
      );
      if (idx >= 0) {
        const [deleted] = store.splice(idx, 1);
        return Promise.resolve(deleted);
      }
      return Promise.resolve(null);
    }),
    deleteMany: jest.fn().mockImplementation(() => {
      const count = store.length;
      store.length = 0;
      return Promise.resolve({ count });
    }),
    count: jest.fn().mockImplementation(() => Promise.resolve(store.length)),
    aggregate: jest.fn(),
    upsert: jest.fn(),
  };
};

// Mock Prisma Client für Tests
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: crudMock(),
    employee: crudMock(),
    department: crudMock(),
    project: crudMock(),
    location: crudMock(),
    timeEntry: crudMock(),
    absenceRequest: crudMock(),
    projectAssignment: crudMock(),
    projectBudget: crudMock(),
    projectBudgetItem: crudMock(),
    projectTimeAllocation: crudMock(),
    projectTask: crudMock(),
    taskDependency: crudMock(),
    systemSettings: crudMock(),
    zeitmodell: crudMock(),
    zeitmodellEintrag: crudMock(),
    zeitmodellAenderung: crudMock(),
    mitarbeiterZeitmodell: crudMock(),
    userGroup: crudMock(),
    userGroupMembership: crudMock(),
    module: crudMock(),
    moduleAccess: crudMock(),
    customer: crudMock(),
    supplier: crudMock(),
    article: crudMock(),
    articleGroup: crudMock(),
    invoice: crudMock(),
    invoiceItem: crudMock(),
    invoiceTemplate: crudMock(),
    invoiceTemplateWorkflow: crudMock(),
    holiday: crudMock(),
    overtimeBalance: crudMock(),
    complianceViolation: crudMock(),
    complianceSettings: crudMock(),
    reminder: crudMock(),
    reminderSettings: crudMock(),
    incident: crudMock(),
    incidentComment: crudMock(),
    workflow: crudMock(),
    workflowStep: crudMock(),
    workflowInstance: crudMock(),
    workflowInstanceStep: crudMock(),
    workflowTrigger: crudMock(),
    documentNode: crudMock(),
    documentVersion: crudMock(),
    documentNodeGroupPermission: crudMock(),
    documentNodeAttachment: crudMock(),
    documentNodeAttachmentVersion: crudMock(),
    documentNodeTypeRegistry: crudMock(),
    checklistItemCompletion: crudMock(),
    checklistInstance: crudMock(),
    checklistItem: crudMock(),
    checklistTemplate: crudMock(),
    questionResponse: crudMock(),
    quizAttempt: crudMock(),
    lessonProgress: crudMock(),
    enrollment: crudMock(),
    courseAssignment: crudMock(),
    answer: crudMock(),
    question: crudMock(),
    quiz: crudMock(),
    lesson: crudMock(),
    course: crudMock(),
    courseCategory: crudMock(),
    trainingCompletion: crudMock(),
    trainingSession: crudMock(),
    trainingCatalog: crudMock(),
    equipmentAssignment: crudMock(),
    equipment: crudMock(),
    onboardingTask: crudMock(),
    employeeDocument: crudMock(),
    applicantNote: crudMock(),
    applicantInterview: crudMock(),
    applicantDocument: crudMock(),
    applicant: crudMock(),
    jobFunctionDocument: crudMock(),
    jobFunction: crudMock(),
    newsItem: crudMock(),
    newsSource: crudMock(),
    userDashboardLayout: crudMock(),
    eHSTodo: crudMock(),
    eHSMonthlyData: crudMock(),
    orderDeliveryItem: crudMock(),
    orderDelivery: crudMock(),
    orderItem: crudMock(),
    order: crudMock(),
    media: crudMock(),
    actionLog: crudMock(),
    actionDefinition: crudMock(),
    systemAction: crudMock(),
    travelExpense: crudMock(),
    message: crudMock(),
    payrollEntry: crudMock(),
    payrollPeriod: crudMock(),
    salaryConfiguration: crudMock(),
    deviceAssignment: crudMock(),
    device: crudMock(),
    inventoryMovement: crudMock(),
    inventoryItem: crudMock(),
    costCenter: crudMock(),
    $disconnect: jest.fn(),
    $connect: jest.fn(),
    $transaction: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    InvoiceStatus: {
      DRAFT: 'DRAFT',
      SENT: 'SENT',
      PAID: 'PAID',
      OVERDUE: 'OVERDUE',
      CANCELLED: 'CANCELLED',
      ACCEPTED: 'ACCEPTED',
      DECLINED: 'DECLINED',
    },
  };
});

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});
