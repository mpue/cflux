import { workflowService, Workflow, WorkflowStep, WorkflowInstance, WorkflowInstanceStep } from '../workflow.service';
import api from '../api';

jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('Workflow Service - Complete CRUD Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CREATE Tests - Workflows
  // ============================================
  describe('CREATE - createWorkflow', () => {
    it('should create workflow with all fields', async () => {
      const newWorkflowData: Partial<Workflow> = {
        name: 'Rechnungsgenehmigung Standard',
        description: 'Standard Workflow für Rechnungen bis CHF 5000',
        definition: JSON.stringify({
          steps: [
            { type: 'APPROVAL', approver: 'manager' },
            { type: 'NOTIFICATION', recipient: 'accounting' }
          ]
        }),
        isActive: true,
      };

      const mockCreatedWorkflow: Workflow = {
        id: 'workflow-123',
        name: 'Rechnungsgenehmigung Standard',
        description: 'Standard Workflow für Rechnungen bis CHF 5000',
        definition: JSON.stringify({
          steps: [
            { type: 'APPROVAL', approver: 'manager' },
            { type: 'NOTIFICATION', recipient: 'accounting' }
          ]
        }),
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockCreatedWorkflow });

      const result = await workflowService.createWorkflow(newWorkflowData);

      expect(mockedApi.post).toHaveBeenCalledWith('/workflows', newWorkflowData);
      expect(result).toEqual(mockCreatedWorkflow);
      expect(result.name).toBe('Rechnungsgenehmigung Standard');
      expect(result.isActive).toBe(true);
    });

    it('should create workflow with minimal required fields', async () => {
      const minimalData: Partial<Workflow> = {
        name: 'Einfacher Workflow',
        definition: '{}',
        isActive: true,
      };

      const mockWorkflow: Workflow = {
        id: 'workflow-456',
        name: 'Einfacher Workflow',
        definition: '{}',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockWorkflow });

      const result = await workflowService.createWorkflow(minimalData);

      expect(result.name).toBe('Einfacher Workflow');
      expect(result.isActive).toBe(true);
    });

    it('should create inactive workflow', async () => {
      const workflowData: Partial<Workflow> = {
        name: 'Test Workflow (Entwurf)',
        definition: '{}',
        isActive: false,
      };

      const mockWorkflow: Workflow = {
        id: 'workflow-draft',
        name: 'Test Workflow (Entwurf)',
        definition: '{}',
        isActive: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockWorkflow });

      const result = await workflowService.createWorkflow(workflowData);

      expect(result.isActive).toBe(false);
    });

    it('should create workflow with complex definition', async () => {
      const complexDefinition = {
        triggers: ['invoice_created'],
        steps: [
          { id: 1, type: 'APPROVAL', approver: 'manager', condition: 'amount > 1000' },
          { id: 2, type: 'APPROVAL', approver: 'director', condition: 'amount > 5000' },
          { id: 3, type: 'NOTIFICATION', recipient: 'accounting', template: 'invoice_approved' }
        ],
        errorHandling: { retry: 3, fallback: 'notify_admin' }
      };

      const workflowData: Partial<Workflow> = {
        name: 'Komplexer Genehmigungsprozess',
        description: 'Mehrstufiger Workflow mit Bedingungen',
        definition: JSON.stringify(complexDefinition),
        isActive: true,
      };

      const mockWorkflow: Workflow = {
        id: 'workflow-complex',
        name: 'Komplexer Genehmigungsprozess',
        description: 'Mehrstufiger Workflow mit Bedingungen',
        definition: JSON.stringify(complexDefinition),
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockWorkflow });

      const result = await workflowService.createWorkflow(workflowData);

      expect(result.definition).toContain('APPROVAL');
      expect(result.definition).toContain('NOTIFICATION');
    });

    it('should handle creation error', async () => {
      const workflowData: Partial<Workflow> = {
        name: 'Test',
        definition: 'invalid-json',
        isActive: true,
      };

      mockedApi.post.mockRejectedValue(new Error('Invalid workflow definition'));

      await expect(workflowService.createWorkflow(workflowData))
        .rejects.toThrow('Invalid workflow definition');
    });
  });

  // ============================================
  // CREATE Tests - Workflow Steps
  // ============================================
  describe('CREATE - createWorkflowStep', () => {
    it('should create approval step', async () => {
      const stepData: Partial<WorkflowStep> = {
        name: 'Manager Genehmigung',
        type: 'APPROVAL',
        order: 1,
        approverUserIds: 'user-123,user-456',
        requireAllApprovers: false,
      };

      const mockStep: WorkflowStep = {
        id: 'step-123',
        workflowId: 'workflow-123',
        name: 'Manager Genehmigung',
        type: 'APPROVAL',
        order: 1,
        approverUserIds: 'user-123,user-456',
        requireAllApprovers: false,
      };

      mockedApi.post.mockResolvedValue({ data: mockStep });

      const result = await workflowService.createWorkflowStep('workflow-123', stepData);

      expect(mockedApi.post).toHaveBeenCalledWith('/workflows/workflow-123/steps', stepData);
      expect(result.type).toBe('APPROVAL');
      expect(result.order).toBe(1);
    });

    it('should create notification step', async () => {
      const stepData: Partial<WorkflowStep> = {
        name: 'Benachrichtigung Buchhaltung',
        type: 'NOTIFICATION',
        order: 2,
        config: JSON.stringify({ recipients: ['accounting@example.com'] }),
      };

      const mockStep: WorkflowStep = {
        id: 'step-notify',
        workflowId: 'workflow-123',
        name: 'Benachrichtigung Buchhaltung',
        type: 'NOTIFICATION',
        order: 2,
        requireAllApprovers: false,
        config: JSON.stringify({ recipients: ['accounting@example.com'] }),
      };

      mockedApi.post.mockResolvedValue({ data: mockStep });

      const result = await workflowService.createWorkflowStep('workflow-123', stepData);

      expect(result.type).toBe('NOTIFICATION');
    });

    it('should create step with all approvers required', async () => {
      const stepData: Partial<WorkflowStep> = {
        name: 'Doppelte Genehmigung',
        type: 'APPROVAL',
        order: 1,
        approverUserIds: 'user-1,user-2',
        requireAllApprovers: true,
      };

      const mockStep: WorkflowStep = {
        id: 'step-dual',
        workflowId: 'workflow-123',
        name: 'Doppelte Genehmigung',
        type: 'APPROVAL',
        order: 1,
        approverUserIds: 'user-1,user-2',
        requireAllApprovers: true,
      };

      mockedApi.post.mockResolvedValue({ data: mockStep });

      const result = await workflowService.createWorkflowStep('workflow-123', stepData);

      expect(result.requireAllApprovers).toBe(true);
    });
  });

  // ============================================
  // READ Tests - Workflows
  // ============================================
  describe('READ - getWorkflows', () => {
    it('should get all workflows', async () => {
      const mockWorkflows: Workflow[] = [
        {
          id: 'workflow-1',
          name: 'Standard Genehmigung',
          definition: '{}',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 'workflow-2',
          name: 'Express Genehmigung',
          definition: '{}',
          isActive: true,
          createdAt: '2026-01-02T10:00:00Z',
          updatedAt: '2026-01-02T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockWorkflows });

      const result = await workflowService.getWorkflows();

      expect(mockedApi.get).toHaveBeenCalledWith('/workflows');
      expect(result).toEqual(mockWorkflows);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no workflows found', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      const result = await workflowService.getWorkflows();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should get workflows with steps', async () => {
      const mockWorkflows: Workflow[] = [
        {
          id: 'workflow-1',
          name: 'Workflow mit Steps',
          definition: '{}',
          isActive: true,
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
          steps: [
            {
              id: 'step-1',
              workflowId: 'workflow-1',
              name: 'Approval',
              type: 'APPROVAL',
              order: 1,
              requireAllApprovers: false,
            },
          ],
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockWorkflows });

      const result = await workflowService.getWorkflows();

      expect(result[0].steps).toBeDefined();
      expect(result[0].steps).toHaveLength(1);
    });
  });

  describe('READ - getWorkflow', () => {
    it('should get workflow by id', async () => {
      const mockWorkflow: Workflow = {
        id: 'workflow-123',
        name: 'Rechnungsgenehmigung',
        description: 'Standard workflow',
        definition: '{}',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.get.mockResolvedValue({ data: mockWorkflow });

      const result = await workflowService.getWorkflow('workflow-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/workflows/workflow-123');
      expect(result).toEqual(mockWorkflow);
      expect(result.id).toBe('workflow-123');
    });

    it('should get workflow with full details', async () => {
      const mockWorkflow: Workflow = {
        id: 'workflow-full',
        name: 'Kompletter Workflow',
        description: 'Mit allen Details',
        definition: JSON.stringify({ steps: [] }),
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        steps: [
          {
            id: 'step-1',
            workflowId: 'workflow-full',
            name: 'Step 1',
            type: 'APPROVAL',
            order: 1,
            requireAllApprovers: false,
          },
          {
            id: 'step-2',
            workflowId: 'workflow-full',
            name: 'Step 2',
            type: 'NOTIFICATION',
            order: 2,
            requireAllApprovers: false,
          },
        ],
      };

      mockedApi.get.mockResolvedValue({ data: mockWorkflow });

      const result = await workflowService.getWorkflow('workflow-full');

      expect(result.steps).toHaveLength(2);
      expect(result.description).toBe('Mit allen Details');
    });

    it('should handle not found error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Workflow not found'));

      await expect(workflowService.getWorkflow('nonexistent-id'))
        .rejects.toThrow('Workflow not found');
    });
  });

  // ============================================
  // UPDATE Tests
  // ============================================
  describe('UPDATE - updateWorkflow', () => {
    it('should update workflow name', async () => {
      const updates: Partial<Workflow> = {
        name: 'Aktualisierter Workflow Name',
      };

      const mockUpdatedWorkflow: Workflow = {
        id: 'workflow-123',
        name: 'Aktualisierter Workflow Name',
        definition: '{}',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedWorkflow });

      const result = await workflowService.updateWorkflow('workflow-123', updates);

      expect(mockedApi.put).toHaveBeenCalledWith('/workflows/workflow-123', updates);
      expect(result.name).toBe('Aktualisierter Workflow Name');
    });

    it('should activate workflow', async () => {
      const updates: Partial<Workflow> = {
        isActive: true,
      };

      const mockUpdatedWorkflow: Workflow = {
        id: 'workflow-123',
        name: 'Test Workflow',
        definition: '{}',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T12:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedWorkflow });

      const result = await workflowService.updateWorkflow('workflow-123', updates);

      expect(result.isActive).toBe(true);
    });

    it('should deactivate workflow', async () => {
      const updates: Partial<Workflow> = {
        isActive: false,
      };

      const mockUpdatedWorkflow: Workflow = {
        id: 'workflow-123',
        name: 'Test Workflow',
        definition: '{}',
        isActive: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T13:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedWorkflow });

      const result = await workflowService.updateWorkflow('workflow-123', updates);

      expect(result.isActive).toBe(false);
    });

    it('should update workflow definition', async () => {
      const newDefinition = JSON.stringify({ steps: [{ type: 'APPROVAL' }] });
      const updates: Partial<Workflow> = {
        definition: newDefinition,
      };

      const mockUpdatedWorkflow: Workflow = {
        id: 'workflow-123',
        name: 'Test Workflow',
        definition: newDefinition,
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T13:30:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedWorkflow });

      const result = await workflowService.updateWorkflow('workflow-123', updates);

      expect(result.definition).toBe(newDefinition);
    });

    it('should update all fields at once', async () => {
      const updates: Partial<Workflow> = {
        name: 'Komplett aktualisiert',
        description: 'Neue Beschreibung',
        definition: JSON.stringify({ updated: true }),
        isActive: false,
      };

      const mockUpdatedWorkflow: Workflow = {
        id: 'workflow-123',
        name: 'Komplett aktualisiert',
        description: 'Neue Beschreibung',
        definition: JSON.stringify({ updated: true }),
        isActive: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T14:00:00Z',
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedWorkflow });

      const result = await workflowService.updateWorkflow('workflow-123', updates);

      expect(result.name).toBe('Komplett aktualisiert');
      expect(result.isActive).toBe(false);
    });

    it('should handle update error', async () => {
      const updates: Partial<Workflow> = {
        definition: 'invalid',
      };

      mockedApi.put.mockRejectedValue(new Error('Invalid definition format'));

      await expect(workflowService.updateWorkflow('workflow-123', updates))
        .rejects.toThrow('Invalid definition format');
    });
  });

  describe('UPDATE - updateWorkflowStep', () => {
    it('should update step name', async () => {
      const updates: Partial<WorkflowStep> = {
        name: 'Aktualisierter Step Name',
      };

      const mockUpdatedStep: WorkflowStep = {
        id: 'step-123',
        workflowId: 'workflow-123',
        name: 'Aktualisierter Step Name',
        type: 'APPROVAL',
        order: 1,
        requireAllApprovers: false,
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedStep });

      const result = await workflowService.updateWorkflowStep('step-123', updates);

      expect(mockedApi.put).toHaveBeenCalledWith('/workflows/steps/step-123', updates);
      expect(result.name).toBe('Aktualisierter Step Name');
    });

    it('should update step order', async () => {
      const updates: Partial<WorkflowStep> = {
        order: 5,
      };

      const mockUpdatedStep: WorkflowStep = {
        id: 'step-123',
        workflowId: 'workflow-123',
        name: 'Test Step',
        type: 'APPROVAL',
        order: 5,
        requireAllApprovers: false,
      };

      mockedApi.put.mockResolvedValue({ data: mockUpdatedStep });

      const result = await workflowService.updateWorkflowStep('step-123', updates);

      expect(result.order).toBe(5);
    });
  });

  // ============================================
  // DELETE Tests
  // ============================================
  describe('DELETE - deleteWorkflow', () => {
    it('should delete workflow successfully', async () => {
      mockedApi.delete.mockResolvedValue({});

      await workflowService.deleteWorkflow('workflow-123');

      expect(mockedApi.delete).toHaveBeenCalledWith('/workflows/workflow-123');
    });

    it('should delete multiple workflows', async () => {
      const workflowIds = ['workflow-1', 'workflow-2', 'workflow-3'];

      mockedApi.delete.mockResolvedValue({});

      for (const id of workflowIds) {
        await workflowService.deleteWorkflow(id);
      }

      expect(mockedApi.delete).toHaveBeenCalledTimes(3);
    });

    it('should handle delete error', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Workflow not found'));

      await expect(workflowService.deleteWorkflow('nonexistent-id'))
        .rejects.toThrow('Workflow not found');
    });

    it('should handle delete error for active workflow', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Cannot delete active workflow'));

      await expect(workflowService.deleteWorkflow('workflow-123'))
        .rejects.toThrow('Cannot delete active workflow');
    });
  });

  describe('DELETE - deleteWorkflowStep', () => {
    it('should delete workflow step successfully', async () => {
      mockedApi.delete.mockResolvedValue({});

      await workflowService.deleteWorkflowStep('step-123');

      expect(mockedApi.delete).toHaveBeenCalledWith('/workflows/steps/step-123');
    });

    it('should handle step delete error', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Step not found'));

      await expect(workflowService.deleteWorkflowStep('nonexistent-id'))
        .rejects.toThrow('Step not found');
    });
  });

  // ============================================
  // TEMPLATE LINKING Tests
  // ============================================
  describe('TEMPLATE LINKING', () => {
    it('should link workflow to template', async () => {
      const mockLink = {
        id: 'link-123',
        templateId: 'template-123',
        workflowId: 'workflow-123',
        order: 1,
      };

      mockedApi.post.mockResolvedValue({ data: mockLink });

      const result = await workflowService.linkWorkflowToTemplate('template-123', 'workflow-123', 1);

      expect(mockedApi.post).toHaveBeenCalledWith('/workflows/template-links', {
        templateId: 'template-123',
        workflowId: 'workflow-123',
        order: 1,
      });
      expect(result).toEqual(mockLink);
    });

    it('should unlink workflow from template', async () => {
      mockedApi.delete.mockResolvedValue({});

      await workflowService.unlinkWorkflowFromTemplate('template-123', 'workflow-123');

      expect(mockedApi.delete).toHaveBeenCalledWith('/workflows/template-links/template-123/workflow-123');
    });

    it('should get template workflows', async () => {
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Workflow 1',
          order: 1,
        },
        {
          id: 'workflow-2',
          name: 'Workflow 2',
          order: 2,
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockWorkflows });

      const result = await workflowService.getTemplateWorkflows('template-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/workflows/templates/template-123');
      expect(result).toEqual(mockWorkflows);
      expect(result).toHaveLength(2);
    });
  });

  // ============================================
  // WORKFLOW INSTANCES Tests
  // ============================================
  describe('WORKFLOW INSTANCES', () => {
    it('should get invoice workflow instances', async () => {
      const mockInstances: WorkflowInstance[] = [
        {
          id: 'instance-1',
          workflowId: 'workflow-1',
          entityType: 'INVOICE',
          entityId: 'invoice-123',
          invoiceId: 'invoice-123',
          status: 'IN_PROGRESS',
          startedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockInstances });

      const result = await workflowService.getInvoiceWorkflowInstances('invoice-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/workflows/invoices/invoice-123/instances');
      expect(result).toEqual(mockInstances);
    });

    it('should get workflow instances by entity', async () => {
      const mockInstances: WorkflowInstance[] = [
        {
          id: 'instance-travel',
          workflowId: 'workflow-1',
          entityType: 'TRAVEL_EXPENSE',
          entityId: 'expense-123',
          status: 'PENDING',
          startedAt: '2026-01-01T10:00:00Z',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockInstances });

      const result = await workflowService.getWorkflowInstancesByEntity('expense-123', 'TRAVEL_EXPENSE');

      expect(mockedApi.get).toHaveBeenCalledWith('/workflows/entities/TRAVEL_EXPENSE/expense-123/instances');
      expect(result[0].entityType).toBe('TRAVEL_EXPENSE');
    });

    it('should approve workflow step', async () => {
      const mockApprovedStep: WorkflowInstanceStep = {
        id: 'instance-step-123',
        instanceId: 'instance-123',
        stepId: 'step-123',
        status: 'APPROVED',
        approvedById: 'user-123',
        approvedAt: '2026-01-01T12:00:00Z',
        comment: 'Genehmigt',
      };

      mockedApi.post.mockResolvedValue({ data: mockApprovedStep });

      const result = await workflowService.approveWorkflowStep('instance-step-123', 'user-123', 'Genehmigt');

      expect(mockedApi.post).toHaveBeenCalledWith('/workflows/instances/steps/instance-step-123/approve', {
        userId: 'user-123',
        comment: 'Genehmigt',
      });
      expect(result.status).toBe('APPROVED');
      expect(result.comment).toBe('Genehmigt');
    });

    it('should approve workflow step without comment', async () => {
      const mockApprovedStep: WorkflowInstanceStep = {
        id: 'instance-step-123',
        instanceId: 'instance-123',
        stepId: 'step-123',
        status: 'APPROVED',
        approvedById: 'user-123',
        approvedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockApprovedStep });

      const result = await workflowService.approveWorkflowStep('instance-step-123', 'user-123');

      expect(result.status).toBe('APPROVED');
    });

    it('should reject workflow step', async () => {
      const mockRejectedStep: WorkflowInstanceStep = {
        id: 'instance-step-123',
        instanceId: 'instance-123',
        stepId: 'step-123',
        status: 'REJECTED',
        approvedById: 'user-123',
        approvedAt: '2026-01-01T12:00:00Z',
        comment: 'Betrag zu hoch',
      };

      mockedApi.post.mockResolvedValue({ data: mockRejectedStep });

      const result = await workflowService.rejectWorkflowStep('instance-step-123', 'user-123', 'Betrag zu hoch');

      expect(mockedApi.post).toHaveBeenCalledWith('/workflows/instances/steps/instance-step-123/reject', {
        userId: 'user-123',
        comment: 'Betrag zu hoch',
      });
      expect(result.status).toBe('REJECTED');
      expect(result.comment).toBe('Betrag zu hoch');
    });

    it('should check invoice approval status', async () => {
      const mockStatus = {
        canApprove: true,
        allCompleted: false,
        anyRejected: false,
      };

      mockedApi.get.mockResolvedValue({ data: mockStatus });

      const result = await workflowService.checkInvoiceApproval('invoice-123');

      expect(mockedApi.get).toHaveBeenCalledWith('/workflows/invoices/invoice-123/check-approval');
      expect(result.canApprove).toBe(true);
      expect(result.allCompleted).toBe(false);
      expect(result.anyRejected).toBe(false);
    });

    it('should get my pending approvals', async () => {
      const mockPendingApprovals = [
        {
          id: 'approval-1',
          workflowName: 'Rechnungsgenehmigung',
          entityType: 'INVOICE',
          entityId: 'invoice-123',
          stepName: 'Manager Genehmigung',
        },
        {
          id: 'approval-2',
          workflowName: 'Reisekostengenehmigung',
          entityType: 'TRAVEL_EXPENSE',
          entityId: 'expense-456',
          stepName: 'Direktor Genehmigung',
        },
      ];

      mockedApi.get.mockResolvedValue({ data: mockPendingApprovals });

      const result = await workflowService.getMyPendingApprovals();

      expect(mockedApi.get).toHaveBeenCalledWith('/workflows/my-approvals');
      expect(result).toHaveLength(2);
    });

    it('should test workflow', async () => {
      const mockTestResult = {
        success: true,
        instanceId: 'test-instance-123',
        steps: ['step-1', 'step-2'],
      };

      mockedApi.post.mockResolvedValue({ data: mockTestResult });

      const result = await workflowService.testWorkflow('workflow-123', 'invoice-123');

      expect(mockedApi.post).toHaveBeenCalledWith('/workflows/workflow-123/test', { invoiceId: 'invoice-123' });
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // Integration Tests
  // ============================================
  describe('INTEGRATION - Workflow Lifecycle', () => {
    it('should complete full workflow lifecycle from creation to approval', async () => {
      // CREATE workflow
      const newWorkflow: Partial<Workflow> = {
        name: 'Genehmigungsprozess',
        definition: '{}',
        isActive: true,
      };

      const createdWorkflow: Workflow = {
        id: 'workflow-lifecycle',
        name: 'Genehmigungsprozess',
        definition: '{}',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: createdWorkflow });
      const created = await workflowService.createWorkflow(newWorkflow);
      expect(created.isActive).toBe(true);

      // CREATE steps
      const stepData: Partial<WorkflowStep> = {
        name: 'Approval',
        type: 'APPROVAL',
        order: 1,
        requireAllApprovers: false,
      };

      const createdStep: WorkflowStep = {
        id: 'step-lifecycle',
        workflowId: 'workflow-lifecycle',
        name: 'Approval',
        type: 'APPROVAL',
        order: 1,
        requireAllApprovers: false,
      };

      mockedApi.post.mockResolvedValue({ data: createdStep });
      await workflowService.createWorkflowStep('workflow-lifecycle', stepData);

      // READ workflow
      const workflowWithSteps: Workflow = {
        ...createdWorkflow,
        steps: [createdStep],
      };

      mockedApi.get.mockResolvedValue({ data: workflowWithSteps });
      const fetched = await workflowService.getWorkflow('workflow-lifecycle');
      expect(fetched.steps).toHaveLength(1);

      // APPROVE step in instance
      const mockApprovedStep: WorkflowInstanceStep = {
        id: 'instance-step-1',
        instanceId: 'instance-1',
        stepId: 'step-lifecycle',
        status: 'APPROVED',
        approvedById: 'user-123',
        approvedAt: '2026-01-01T12:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockApprovedStep });
      const approved = await workflowService.approveWorkflowStep('instance-step-1', 'user-123');
      expect(approved.status).toBe('APPROVED');
    });

    it('should handle workflow rejection', async () => {
      // Create workflow with steps
      const workflow: Workflow = {
        id: 'workflow-reject',
        name: 'Test Workflow',
        definition: '{}',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: workflow });
      await workflowService.createWorkflow(workflow);

      // Reject step
      const mockRejectedStep: WorkflowInstanceStep = {
        id: 'instance-step-reject',
        instanceId: 'instance-reject',
        stepId: 'step-reject',
        status: 'REJECTED',
        approvedById: 'user-123',
        approvedAt: '2026-01-01T12:00:00Z',
        comment: 'Nicht genehmigt',
      };

      mockedApi.post.mockResolvedValue({ data: mockRejectedStep });
      const rejected = await workflowService.rejectWorkflowStep('instance-step-reject', 'user-123', 'Nicht genehmigt');

      expect(rejected.status).toBe('REJECTED');
      expect(rejected.comment).toBe('Nicht genehmigt');
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('EDGE CASES', () => {
    it('should handle workflow with empty definition', async () => {
      const workflowData: Partial<Workflow> = {
        name: 'Empty Workflow',
        definition: '{}',
        isActive: true,
      };

      const mockWorkflow: Workflow = {
        id: 'workflow-empty',
        name: 'Empty Workflow',
        definition: '{}',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockWorkflow });

      const result = await workflowService.createWorkflow(workflowData);

      expect(result.definition).toBe('{}');
    });

    it('should handle workflow with very long name', async () => {
      const longName = 'Sehr langer Workflow Name '.repeat(10);

      const workflowData: Partial<Workflow> = {
        name: longName,
        definition: '{}',
        isActive: true,
      };

      const mockWorkflow: Workflow = {
        id: 'workflow-long',
        name: longName,
        definition: '{}',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockWorkflow });

      const result = await workflowService.createWorkflow(workflowData);

      expect(result.name.length).toBeGreaterThan(100);
    });

    it('should handle workflow with German special characters', async () => {
      const workflowData: Partial<Workflow> = {
        name: 'Genehmigung für Zürich, München & Köln',
        description: 'Spezielle Zeichenprüfung: äöüßÄÖÜ',
        definition: '{}',
        isActive: true,
      };

      const mockWorkflow: Workflow = {
        id: 'workflow-umlaut',
        name: 'Genehmigung für Zürich, München & Köln',
        description: 'Spezielle Zeichenprüfung: äöüßÄÖÜ',
        definition: '{}',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      };

      mockedApi.post.mockResolvedValue({ data: mockWorkflow });

      const result = await workflowService.createWorkflow(workflowData);

      expect(result.name).toContain('Zürich');
      expect(result.description).toContain('äöüß');
    });

    it('should handle step with order zero', async () => {
      const stepData: Partial<WorkflowStep> = {
        name: 'Initial Step',
        type: 'APPROVAL',
        order: 0,
        requireAllApprovers: false,
      };

      const mockStep: WorkflowStep = {
        id: 'step-zero',
        workflowId: 'workflow-123',
        name: 'Initial Step',
        type: 'APPROVAL',
        order: 0,
        requireAllApprovers: false,
      };

      mockedApi.post.mockResolvedValue({ data: mockStep });

      const result = await workflowService.createWorkflowStep('workflow-123', stepData);

      expect(result.order).toBe(0);
    });

    it('should handle approval with very long comment', async () => {
      const longComment = 'Sehr detaillierte Begründung für die Genehmigung. '.repeat(50);

      const mockApprovedStep: WorkflowInstanceStep = {
        id: 'instance-step-long',
        instanceId: 'instance-123',
        stepId: 'step-123',
        status: 'APPROVED',
        approvedById: 'user-123',
        approvedAt: '2026-01-01T12:00:00Z',
        comment: longComment,
      };

      mockedApi.post.mockResolvedValue({ data: mockApprovedStep });

      const result = await workflowService.approveWorkflowStep('instance-step-long', 'user-123', longComment);

      expect(result.comment?.length).toBeGreaterThan(1000);
    });
  });
});
