import { PrismaClient } from '@prisma/client';

jest.mock('../services/systemSettings.service', () => ({
  systemSettingsService: {
    getSettings: jest.fn(),
  },
}));

jest.mock('../controllers/message.controller', () => ({
  sendSystemMessage: jest.fn(),
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

import { workflowService } from '../services/workflow.service';
import { systemSettingsService } from '../services/systemSettings.service';

const nodemailer = require('nodemailer');
const prisma = new PrismaClient();

describe('workflowService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createWorkflow creates workflow and steps, then returns workflow with sorted steps', async () => {
    (prisma.workflow.create as jest.Mock).mockResolvedValue({ id: 'w1' });
    (prisma.workflowStep.create as jest.Mock).mockResolvedValue({});
    (prisma.workflow.findUnique as jest.Mock).mockResolvedValue({ id: 'w1', steps: [{ order: 1 }] });

    const result = await workflowService.createWorkflow({
      name: 'WF',
      definition: '{}',
      steps: [
        { name: 'S1', type: 'APPROVAL' as any, order: 1 },
        { name: 'S2', type: 'EMAIL' as any, order: 2 },
      ],
    });

    expect(prisma.workflowStep.create).toHaveBeenCalledTimes(2);
    expect(result!.id).toBe('w1');
  });

  it('getAllWorkflows and getWorkflowById call prisma with includes', async () => {
    (prisma.workflow.findMany as jest.Mock).mockResolvedValue([{ id: 'w1' }]);
    (prisma.workflow.findUnique as jest.Mock).mockResolvedValue({ id: 'w1' });

    const all = await workflowService.getAllWorkflows();
    const one = await workflowService.getWorkflowById('w1');

    expect(all).toHaveLength(1);
    expect(one!.id).toBe('w1');
  });

  it('updateWorkflow replaces all steps when no instance references exist', async () => {
    (prisma.workflow.update as jest.Mock).mockResolvedValue({ id: 'w1' });
    (prisma.workflowStep.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: 's1' }])
      .mockResolvedValueOnce([{ id: 's1', order: 1 }]);
    (prisma.workflowInstanceStep.count as jest.Mock).mockResolvedValue(0);
    (prisma.workflowStep.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.workflowStep.create as jest.Mock).mockResolvedValue({});
    (prisma.workflow.findUnique as jest.Mock).mockResolvedValue({ id: 'w1' });

    await workflowService.updateWorkflow('w1', {
      name: 'WF2',
      steps: [{ name: 'S1', type: 'APPROVAL' as any, order: 1 }],
    });

    expect(prisma.workflowStep.deleteMany).toHaveBeenCalledWith({ where: { workflowId: 'w1' } });
    expect(prisma.workflowStep.create).toHaveBeenCalledTimes(1);
  });

  it('deleteWorkflow throws when template usage exists', async () => {
    (prisma.invoiceTemplateWorkflow.count as jest.Mock).mockResolvedValue(1);

    await expect(workflowService.deleteWorkflow('w1')).rejects.toThrow(
      'Workflow wird von Rechnungsvorlagen verwendet'
    );
  });

  it('deleteWorkflow deletes when unused', async () => {
    (prisma.invoiceTemplateWorkflow.count as jest.Mock).mockResolvedValue(0);
    (prisma.workflow.delete as jest.Mock).mockResolvedValue({ id: 'w1' });

    const result = await workflowService.deleteWorkflow('w1');

    expect(result.id).toBe('w1');
  });

  it('link/unlink template workflow links', async () => {
    (prisma.invoiceTemplateWorkflow.create as jest.Mock).mockResolvedValue({ id: 'l1' });
    (prisma.invoiceTemplateWorkflow.findFirst as jest.Mock).mockResolvedValue({ id: 'l1' });
    (prisma.invoiceTemplateWorkflow.delete as jest.Mock).mockResolvedValue({ id: 'l1' });

    await workflowService.linkWorkflowToTemplate('t1', 'w1', 1);
    await workflowService.unlinkWorkflowFromTemplate('t1', 'w1');

    expect(prisma.invoiceTemplateWorkflow.create).toHaveBeenCalled();
    expect(prisma.invoiceTemplateWorkflow.delete).toHaveBeenCalledWith({ where: { id: 'l1' } });
  });

  it('evaluateValueCondition handles operators and unknown fields/operators', () => {
    const stepGt = { config: JSON.stringify({ field: 'amount', operator: '>', value: '100' }) };
    const stepEq = { config: JSON.stringify({ field: 'totalAmount', operator: 'equal', value: '200' }) };
    const stepUnknownField = { config: JSON.stringify({ field: 'x', operator: '>', value: '1' }) };
    const stepUnknownOp = { config: JSON.stringify({ field: 'amount', operator: '???', value: '1' }) };

    expect(workflowService.evaluateValueCondition(stepGt, { amount: 150 })).toBe(true);
    expect(workflowService.evaluateValueCondition(stepEq, { totalAmount: 200 })).toBe(true);
    expect(workflowService.evaluateValueCondition(stepUnknownField, { amount: 150 })).toBe(false);
    expect(workflowService.evaluateValueCondition(stepUnknownOp, { amount: 150 })).toBe(false);
  });

  it('sendWorkflowEmail returns false when recipients are missing', async () => {
    const result = await workflowService.sendWorkflowEmail({ config: '{}' }, {});
    expect(result).toBe(false);
  });

  it('sendWorkflowEmail returns false when smtpHost missing', async () => {
    (systemSettingsService.getSettings as jest.Mock).mockResolvedValue({ smtpHost: null });

    const result = await workflowService.sendWorkflowEmail(
      { config: JSON.stringify({ recipients: ['a@example.com'] }) },
      {}
    );

    expect(result).toBe(false);
  });

  it('sendWorkflowEmail resolves user IDs and sends email', async () => {
    (systemSettingsService.getSettings as jest.Mock).mockResolvedValue({
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: 'smtp-user',
      smtpPassword: 'smtp-pass',
      smtpFromName: 'cflux',
      smtpFromEmail: 'noreply@example.com',
      companyName: 'cflux AG',
    });
    const sendMail = jest.fn().mockResolvedValue({});
    nodemailer.createTransport.mockReturnValue({ sendMail });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: 'u1@example.com' });

    const result = await workflowService.sendWorkflowEmail(
      {
        config: JSON.stringify({
          recipients: ['u1', 'direct@example.com'],
          subject: 'Invoice {invoiceNumber}',
          body: 'Amount {totalAmount} for {customerName}',
        }),
      },
      {
        invoiceNumber: 'INV-1',
        totalAmount: 100,
        customer: { name: 'Acme' },
      }
    );

    expect(sendMail).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('sendWorkflowEmail returns false when no recipient emails can be resolved', async () => {
    (systemSettingsService.getSettings as jest.Mock).mockResolvedValue({
      smtpHost: 'smtp.example.com',
      smtpFromEmail: 'noreply@example.com',
      companyName: 'cflux',
    });
    const sendMail = jest.fn().mockResolvedValue({});
    nodemailer.createTransport.mockReturnValue({ sendMail });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await workflowService.sendWorkflowEmail(
      { config: JSON.stringify({ recipients: ['unknown-user-id'] }) },
      {}
    );

    expect(result).toBe(false);
  });

  it('sendWorkflowEmail returns false on transport error', async () => {
    (systemSettingsService.getSettings as jest.Mock).mockResolvedValue({
      smtpHost: 'smtp.example.com',
      smtpFromEmail: 'noreply@example.com',
      companyName: 'cflux',
    });
    const sendMail = jest.fn().mockRejectedValue(new Error('smtp fail'));
    nodemailer.createTransport.mockReturnValue({ sendMail });

    const result = await workflowService.sendWorkflowEmail(
      { config: JSON.stringify({ recipients: ['direct@example.com'] }) },
      {}
    );

    expect(result).toBe(false);
  });
});
