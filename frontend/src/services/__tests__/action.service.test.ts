import { actionService } from '../action.service';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('actionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAction = {
    id: '1',
    actionKey: 'order.created',
    displayName: 'Order Created',
    description: 'Triggered when an order is created',
    category: 'ORDERS' as const,
    contextSchema: '{"type": "object"}',
    isActive: true,
    isSystem: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const mockTrigger = {
    id: 'trig1',
    workflowId: 'wf1',
    actionKey: 'order.created',
    timing: 'AFTER' as const,
    condition: '{}',
    priority: 100,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    workflow: {
      id: 'wf1',
      name: 'Order Approval Workflow',
      isActive: true
    }
  };

  const mockLog = {
    id: 'log1',
    actionKey: 'order.created',
    userId: 'user1',
    contextData: '{"orderId": "1"}',
    success: true,
    executionTime: 150,
    createdAt: '2024-01-01T00:00:00.000Z',
    action: mockAction,
    user: {
      id: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    }
  };

  describe('getAllSystemActions', () => {
    it('should fetch all system actions without filters', async () => {
      const mockActions = [mockAction];
      mockApi.get.mockResolvedValue({ data: mockActions });

      const result = await actionService.getAllSystemActions();

      expect(mockApi.get).toHaveBeenCalledWith('/actions?');
      expect(result).toEqual(mockActions);
    });

    it('should fetch system actions filtered by category', async () => {
      const mockActions = [mockAction];
      mockApi.get.mockResolvedValue({ data: mockActions });

      const result = await actionService.getAllSystemActions('ORDERS');

      expect(mockApi.get).toHaveBeenCalledWith('/actions?category=ORDERS');
      expect(result).toEqual(mockActions);
    });

    it('should fetch only active system actions', async () => {
      const mockActions = [mockAction];
      mockApi.get.mockResolvedValue({ data: mockActions });

      const result = await actionService.getAllSystemActions(undefined, true);

      expect(mockApi.get).toHaveBeenCalledWith('/actions?isActive=true');
      expect(result).toEqual(mockActions);
    });
  });

  describe('getSystemActionByKey', () => {
    it('should fetch a system action by key', async () => {
      mockApi.get.mockResolvedValue({ data: mockAction });

      const result = await actionService.getSystemActionByKey('order.created');

      expect(mockApi.get).toHaveBeenCalledWith('/actions/order.created');
      expect(result).toEqual(mockAction);
    });
  });

  describe('createSystemAction', () => {
    it('should create a new system action', async () => {
      const createData = {
        actionKey: 'custom.action',
        displayName: 'Custom Action',
        category: 'CUSTOM' as const,
        isSystem: false
      };
      mockApi.post.mockResolvedValue({ data: { ...mockAction, ...createData } });

      const result = await actionService.createSystemAction(createData);

      expect(mockApi.post).toHaveBeenCalledWith('/actions', createData);
      expect(result.actionKey).toBe('custom.action');
    });
  });

  describe('updateSystemAction', () => {
    it('should update a system action', async () => {
      const updateData = {
        displayName: 'Updated Action',
        description: 'Updated description'
      };
      const updatedAction = { ...mockAction, ...updateData };
      mockApi.put.mockResolvedValue({ data: updatedAction });

      const result = await actionService.updateSystemAction('order.created', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/actions/order.created', updateData);
      expect(result.displayName).toBe('Updated Action');
    });
  });

  describe('deleteSystemAction', () => {
    it('should delete a system action', async () => {
      mockApi.delete.mockResolvedValue({ data: null });

      await actionService.deleteSystemAction('order.created');

      expect(mockApi.delete).toHaveBeenCalledWith('/actions/order.created');
    });
  });

  describe('createWorkflowTrigger', () => {
    it('should create a workflow trigger', async () => {
      const triggerData = {
        workflowId: 'wf1',
        actionKey: 'order.created',
        timing: 'AFTER' as const,
        priority: 100
      };
      mockApi.post.mockResolvedValue({ data: mockTrigger });

      const result = await actionService.createWorkflowTrigger(triggerData);

      expect(mockApi.post).toHaveBeenCalledWith('/actions/triggers', triggerData);
      expect(result).toEqual(mockTrigger);
    });
  });

  describe('getWorkflowTriggers', () => {
    it('should fetch triggers for a workflow', async () => {
      const mockTriggers = [mockTrigger];
      mockApi.get.mockResolvedValue({ data: mockTriggers });

      const result = await actionService.getWorkflowTriggers('wf1');

      expect(mockApi.get).toHaveBeenCalledWith('/actions/workflows/wf1/triggers');
      expect(result).toEqual(mockTriggers);
    });
  });

  describe('getActionTriggers', () => {
    it('should fetch triggers for an action', async () => {
      const mockTriggers = [mockTrigger];
      mockApi.get.mockResolvedValue({ data: mockTriggers });

      const result = await actionService.getActionTriggers('order.created');

      expect(mockApi.get).toHaveBeenCalledWith('/actions/order.created/triggers');
      expect(result).toEqual(mockTriggers);
    });
  });

  describe('updateWorkflowTrigger', () => {
    it('should update a workflow trigger', async () => {
      const updateData = { priority: 50, condition: '{"status": "DRAFT"}' };
      const updatedTrigger = { ...mockTrigger, ...updateData };
      mockApi.put.mockResolvedValue({ data: updatedTrigger });

      const result = await actionService.updateWorkflowTrigger('trig1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/actions/triggers/trig1', updateData);
      expect(result.priority).toBe(50);
    });
  });

  describe('deleteWorkflowTrigger', () => {
    it('should delete a workflow trigger', async () => {
      mockApi.delete.mockResolvedValue({ data: null });

      await actionService.deleteWorkflowTrigger('trig1');

      expect(mockApi.delete).toHaveBeenCalledWith('/actions/triggers/trig1');
    });
  });

  describe('toggleWorkflowTrigger', () => {
    it('should activate a workflow trigger', async () => {
      const activatedTrigger = { ...mockTrigger, isActive: true };
      mockApi.patch.mockResolvedValue({ data: activatedTrigger });

      const result = await actionService.toggleWorkflowTrigger('trig1', true);

      expect(mockApi.patch).toHaveBeenCalledWith('/actions/triggers/trig1/toggle', {
        isActive: true
      });
      expect(result.isActive).toBe(true);
    });

    it('should deactivate a workflow trigger', async () => {
      const deactivatedTrigger = { ...mockTrigger, isActive: false };
      mockApi.patch.mockResolvedValue({ data: deactivatedTrigger });

      const result = await actionService.toggleWorkflowTrigger('trig1', false);

      expect(mockApi.patch).toHaveBeenCalledWith('/actions/triggers/trig1/toggle', {
        isActive: false
      });
      expect(result.isActive).toBe(false);
    });
  });

  describe('triggerAction', () => {
    it('should manually trigger an action', async () => {
      const context = {
        entityType: 'order',
        entityId: '1',
        entityData: { title: 'Test Order' }
      };
      const mockResponse = {
        success: true,
        workflows: ['wf1'],
        executionTime: 150,
        message: 'Action triggered successfully'
      };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await actionService.triggerAction('order.created', context, 'AFTER');

      expect(mockApi.post).toHaveBeenCalledWith('/actions/order.created/trigger', {
        context,
        timing: 'AFTER'
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getActionLogs', () => {
    it('should fetch action logs without filters', async () => {
      const mockResponse = {
        logs: [mockLog],
        total: 1,
        limit: 50,
        offset: 0
      };
      mockApi.get.mockResolvedValue({ data: mockResponse });

      const result = await actionService.getActionLogs();

      expect(mockApi.get).toHaveBeenCalledWith('/actions/logs?');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch action logs with filters', async () => {
      const mockResponse = {
        logs: [mockLog],
        total: 1,
        limit: 10,
        offset: 10
      };
      mockApi.get.mockResolvedValue({ data: mockResponse });

      const result = await actionService.getActionLogs({
        actionKey: 'order.created',
        userId: 'user1',
        success: true,
        limit: 10,
        offset: 10
      });

      expect(mockApi.get).toHaveBeenCalledWith(
        '/actions/logs?actionKey=order.created&userId=user1&success=true&limit=10&offset=10'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getActionStatistics', () => {
    it('should fetch overall action statistics', async () => {
      const mockStats = {
        total: 100,
        successful: 95,
        failed: 5,
        successRate: 95,
        avgExecutionTime: 120
      };
      mockApi.get.mockResolvedValue({ data: mockStats });

      const result = await actionService.getActionStatistics();

      expect(mockApi.get).toHaveBeenCalledWith('/actions/statistics?');
      expect(result).toEqual(mockStats);
    });

    it('should fetch statistics for a specific action', async () => {
      const mockStats = {
        total: 50,
        successful: 48,
        failed: 2,
        successRate: 96,
        avgExecutionTime: 110
      };
      mockApi.get.mockResolvedValue({ data: mockStats });

      const result = await actionService.getActionStatistics('order.created');

      expect(mockApi.get).toHaveBeenCalledWith('/actions/statistics?actionKey=order.created');
      expect(result).toEqual(mockStats);
    });
  });

  describe('seedSystemActions', () => {
    it('should seed system actions', async () => {
      const mockResponse = {
        message: 'System actions seeded',
        actions: [mockAction]
      };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await actionService.seedSystemActions();

      expect(mockApi.post).toHaveBeenCalledWith('/actions/seed');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Helper Functions', () => {
    describe('getCategoryLabel', () => {
      it('should return correct category labels', () => {
        expect(actionService.getCategoryLabel('ORDERS')).toBe('Bestellungen');
        expect(actionService.getCategoryLabel('INVOICES')).toBe('Rechnungen');
        expect(actionService.getCategoryLabel('TIME_TRACKING')).toBe('Zeiterfassung');
      });
    });

    describe('getTimingLabel', () => {
      it('should return correct timing labels', () => {
        expect(actionService.getTimingLabel('BEFORE')).toBe('Vor der Aktion');
        expect(actionService.getTimingLabel('AFTER')).toBe('Nach der Aktion');
        expect(actionService.getTimingLabel('INSTEAD')).toBe('Statt der Aktion');
      });
    });

    describe('getCategoryIcon', () => {
      it('should return correct category icons', () => {
        expect(actionService.getCategoryIcon('ORDERS')).toBe('📦');
        expect(actionService.getCategoryIcon('INVOICES')).toBe('💰');
        expect(actionService.getCategoryIcon('TIME_TRACKING')).toBe('⏱️');
      });
    });
  });
});
