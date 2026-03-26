import { PrismaClient } from '@prisma/client';

jest.mock('../services/workflow.service', () => ({
  workflowService: {
    createWorkflowInstance: jest.fn(),
  },
}));

import { actionService } from '../services/action.service';
import { workflowService } from '../services/workflow.service';

const prisma = new PrismaClient();

describe('actionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createSystemAction serializes contextSchema and applies defaults', async () => {
    (prisma.systemAction.create as jest.Mock).mockResolvedValue({ id: 'a1' });

    await actionService.createSystemAction({
      actionKey: 'x.y',
      displayName: 'X',
      contextSchema: { amount: 'number' },
    });

    expect(prisma.systemAction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionKey: 'x.y',
        category: 'CUSTOM',
        contextSchema: JSON.stringify({ amount: 'number' }),
        isSystem: false,
      }),
    });
  });

  it('getAllSystemActions applies category and isActive filters', async () => {
    (prisma.systemAction.findMany as jest.Mock).mockResolvedValue([]);

    await actionService.getAllSystemActions('INVOICES' as any, true);

    expect(prisma.systemAction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { category: 'INVOICES', isActive: true } })
    );
  });

  it('updateSystemAction serializes contextSchema when provided', async () => {
    (prisma.systemAction.update as jest.Mock).mockResolvedValue({ actionKey: 'a' });

    await actionService.updateSystemAction('a', { contextSchema: { foo: 'bar' } as any });

    expect(prisma.systemAction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { actionKey: 'a' },
        data: expect.objectContaining({ contextSchema: JSON.stringify({ foo: 'bar' }) }),
      })
    );
  });

  it('deleteSystemAction throws for isSystem actions', async () => {
    (prisma.systemAction.findUnique as jest.Mock).mockResolvedValue({ isSystem: true });

    await expect(actionService.deleteSystemAction('sys.key')).rejects.toThrow(
      'System Actions können nicht gelöscht werden'
    );
  });

  it('deleteSystemAction deletes non-system action', async () => {
    (prisma.systemAction.findUnique as jest.Mock).mockResolvedValue({ isSystem: false });
    (prisma.systemAction.delete as jest.Mock).mockResolvedValue({});

    await actionService.deleteSystemAction('custom.key');

    expect(prisma.systemAction.delete).toHaveBeenCalledWith({ where: { actionKey: 'custom.key' } });
  });

  it('createWorkflowTrigger throws when workflow does not exist', async () => {
    (prisma.workflow.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      actionService.createWorkflowTrigger({ workflowId: 'w1', actionKey: 'invoice.sent' })
    ).rejects.toThrow('Workflow nicht gefunden');
  });

  it('createWorkflowTrigger throws when action does not exist', async () => {
    (prisma.workflow.findUnique as jest.Mock).mockResolvedValue({ id: 'w1' });
    (prisma.systemAction.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      actionService.createWorkflowTrigger({ workflowId: 'w1', actionKey: 'invoice.sent' })
    ).rejects.toThrow('System Action nicht gefunden');
  });

  it('createWorkflowTrigger upserts with defaults', async () => {
    (prisma.workflow.findUnique as jest.Mock).mockResolvedValue({ id: 'w1' });
    (prisma.systemAction.findUnique as jest.Mock).mockResolvedValue({ actionKey: 'invoice.sent' });
    (prisma.workflowTrigger.upsert as jest.Mock).mockResolvedValue({ id: 't1' });

    await actionService.createWorkflowTrigger({ workflowId: 'w1', actionKey: 'invoice.sent' });

    expect(prisma.workflowTrigger.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ timing: 'AFTER', priority: 100 }),
        update: expect.objectContaining({ timing: 'AFTER', priority: 100, isActive: true }),
      })
    );
  });

  it('updateWorkflowTrigger maps condition null when empty object is passed', async () => {
    (prisma.workflowTrigger.update as jest.Mock).mockResolvedValue({ id: 't1' });

    await actionService.updateWorkflowTrigger('t1', { condition: null as any, priority: 5 });

    expect(prisma.workflowTrigger.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 't1' },
        data: expect.objectContaining({ condition: null, priority: 5 }),
      })
    );
  });

  it('triggerAction returns error when action is missing', async () => {
    (prisma.systemAction.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await actionService.triggerAction('missing.action', { entityId: '1', entityType: 'INVOICE' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Action nicht gefunden');
  });

  it('triggerAction returns success message when action is inactive', async () => {
    (prisma.systemAction.findUnique as jest.Mock).mockResolvedValue({ actionKey: 'a', isActive: false });

    const result = await actionService.triggerAction('a', { entityId: '1', entityType: 'INVOICE' });

    expect(result.success).toBe(true);
    expect(result.message).toContain('deaktiviert');
  });

  it('triggerAction skips trigger when condition is not met', async () => {
    (prisma.systemAction.findUnique as jest.Mock).mockResolvedValue({ actionKey: 'a', isActive: true });
    (prisma.workflowTrigger.findMany as jest.Mock).mockResolvedValue([
      {
        workflowId: 'w1',
        condition: JSON.stringify({ field: 'amount', operator: 'gt', value: 1000 }),
        workflow: { name: 'WF1' },
      },
    ]);
    (prisma.actionLog.create as jest.Mock).mockResolvedValue({});

    const result = await actionService.triggerAction('a', {
      entityId: 'inv-1',
      entityType: 'INVOICE',
      amount: 100,
    });

    expect((workflowService.createWorkflowInstance as jest.Mock)).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('triggerAction skips trigger when context misses entity data', async () => {
    (prisma.systemAction.findUnique as jest.Mock).mockResolvedValue({ actionKey: 'a', isActive: true });
    (prisma.workflowTrigger.findMany as jest.Mock).mockResolvedValue([
      { workflowId: 'w1', condition: null, workflow: { name: 'WF1' } },
    ]);
    (prisma.actionLog.create as jest.Mock).mockResolvedValue({});

    const result = await actionService.triggerAction('a', { userId: 'u1' });

    expect((workflowService.createWorkflowInstance as jest.Mock)).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('triggerAction starts workflows and writes success log', async () => {
    (prisma.systemAction.findUnique as jest.Mock).mockResolvedValue({ actionKey: 'a', isActive: true });
    (prisma.workflowTrigger.findMany as jest.Mock).mockResolvedValue([
      { workflowId: 'w1', condition: null, workflow: { name: 'WF1' } },
    ]);
    (workflowService.createWorkflowInstance as jest.Mock).mockResolvedValue({ id: 'inst-1' });
    (prisma.actionLog.create as jest.Mock).mockResolvedValue({});

    const result = await actionService.triggerAction('a', {
      entityId: 'inv-1',
      entityType: 'INVOICE',
      userId: 'u1',
    });

    expect((workflowService.createWorkflowInstance as jest.Mock)).toHaveBeenCalledWith(
      'w1',
      'inv-1',
      'INVOICE',
      'u1'
    );
    expect(prisma.actionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ success: true }) })
    );
    expect(result.success).toBe(true);
    expect(result.workflows).toHaveLength(1);
  });

  it('triggerAction catches errors and writes failure log', async () => {
    (prisma.systemAction.findUnique as jest.Mock).mockResolvedValue({ actionKey: 'a', isActive: true });
    (prisma.workflowTrigger.findMany as jest.Mock).mockRejectedValue(new Error('db down'));
    (prisma.actionLog.create as jest.Mock).mockResolvedValue({});

    const result = await actionService.triggerAction('a', {
      entityId: 'inv-1',
      entityType: 'INVOICE',
      userId: 'u1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('db down');
    expect(prisma.actionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ success: false, errorMessage: 'db down' }) })
    );
  });

  it('evaluateCondition supports operators and nested fields', () => {
    const context = { entityData: { amount: 1500, code: 'INV-123', status: 'SENT' } };

    expect(actionService.evaluateCondition({ field: 'entityData.amount', operator: 'gt', value: 1000 }, context)).toBe(true);
    expect(actionService.evaluateCondition({ field: 'entityData.code', operator: 'startsWith', value: 'INV' }, context)).toBe(true);
    expect(actionService.evaluateCondition({ field: 'entityData.status', operator: 'in', value: ['DRAFT', 'SENT'] }, context)).toBe(true);
    expect(actionService.evaluateCondition({ field: 'entityData.amount', operator: 'lt', value: 1000 }, context)).toBe(false);
  });

  it('getActionLogs returns logs with paging metadata', async () => {
    (prisma.actionLog.findMany as jest.Mock).mockResolvedValue([{ id: 'l1' }]);
    (prisma.actionLog.count as jest.Mock).mockResolvedValue(1);

    const result = await actionService.getActionLogs({ actionKey: 'a', limit: 10, offset: 20 });

    expect(result.total).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(20);
  });

  it('getActionStatistics computes success rate and avg time', async () => {
    (prisma.actionLog.count as jest.Mock)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(3);
    (prisma.actionLog.aggregate as jest.Mock).mockResolvedValue({ _avg: { executionTime: 123 } });

    const result = await actionService.getActionStatistics('a');

    expect(result.total).toBe(10);
    expect(result.successful).toBe(7);
    expect(result.failed).toBe(3);
    expect(result.successRate).toBe(70);
    expect(result.avgExecutionTime).toBe(123);
  });

  it('seedSystemActions creates missing actions only', async () => {
    let call = 0;
    (prisma.systemAction.findUnique as jest.Mock).mockImplementation(() => {
      call += 1;
      if (call <= 2) return Promise.resolve(null);
      return Promise.resolve({ actionKey: 'exists' });
    });
    (prisma.systemAction.create as jest.Mock).mockResolvedValue({ id: 'new-action' });

    const created = await actionService.seedSystemActions();

    expect(prisma.systemAction.create).toHaveBeenCalledTimes(2);
    expect(created).toHaveLength(2);
  });
});
