import { PrismaClient, WorkflowStepType } from '@prisma/client';

const prisma = new PrismaClient();

interface WorkflowData {
  name: string;
  description?: string;
  definition: string;
  isActive?: boolean;
}

interface WorkflowStepData {
  name: string;
  type: WorkflowStepType;
  order: number;
  approverUserIds?: string;
  approverGroupIds?: string;
  requireAllApprovers?: boolean;
  config?: string;
}

export const workflowService = {
  // Workflows
  async createWorkflow(data: WorkflowData & { steps?: WorkflowStepData[] }) {
    const { steps: stepsData, ...workflowData } = data;
    
    const workflow = await prisma.workflow.create({
      data: workflowData,
      include: {
        steps: true,
      },
    });

    // Create workflow steps if provided
    if (stepsData && stepsData.length > 0) {
      for (const stepData of stepsData) {
        await prisma.workflowStep.create({
          data: {
            ...stepData,
            workflowId: workflow.id,
          },
        });
      }
    }

    // Return workflow with steps
    return await prisma.workflow.findUnique({
      where: { id: workflow.id },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
    });
  },

  async getAllWorkflows() {
    return await prisma.workflow.findMany({
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        templateLinks: {
          include: {
            template: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getWorkflowById(id: string) {
    return await prisma.workflow.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        templateLinks: {
          include: {
            template: true,
          },
        },
      },
    });
  },

  async updateWorkflow(id: string, data: Partial<WorkflowData> & { steps?: WorkflowStepData[] }) {
    const { steps: stepsData, ...workflowData } = data;
    
    const workflow = await prisma.workflow.update({
      where: { id },
      data: workflowData,
    });

    // Update workflow steps if provided
    if (stepsData && stepsData.length > 0) {
      // Delete old steps
      await prisma.workflowStep.deleteMany({
        where: { workflowId: id },
      });

      // Create new steps
      for (const stepData of stepsData) {
        await prisma.workflowStep.create({
          data: {
            ...stepData,
            workflowId: id,
          },
        });
      }
    }

    // Return workflow with steps
    return await prisma.workflow.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
    });
  },

  async deleteWorkflow(id: string) {
    // Check if workflow is used in templates
    const usage = await prisma.invoiceTemplateWorkflow.count({
      where: { workflowId: id },
    });
    
    if (usage > 0) {
      throw new Error('Workflow wird von Rechnungsvorlagen verwendet');
    }

    return await prisma.workflow.delete({
      where: { id },
    });
  },

  // Workflow Steps
  async createWorkflowStep(workflowId: string, data: WorkflowStepData) {
    return await prisma.workflowStep.create({
      data: {
        ...data,
        workflowId,
      },
    });
  },

  async updateWorkflowStep(id: string, data: Partial<WorkflowStepData>) {
    return await prisma.workflowStep.update({
      where: { id },
      data,
    });
  },

  async deleteWorkflowStep(id: string) {
    return await prisma.workflowStep.delete({
      where: { id },
    });
  },

  // Template-Workflow Links
  async linkWorkflowToTemplate(templateId: string, workflowId: string, order: number) {
    return await prisma.invoiceTemplateWorkflow.create({
      data: {
        invoiceTemplateId: templateId,
        workflowId,
        order,
      },
      include: {
        workflow: true,
        template: true,
      },
    });
  },

  async unlinkWorkflowFromTemplate(templateId: string, workflowId: string) {
    const link = await prisma.invoiceTemplateWorkflow.findFirst({
      where: {
        invoiceTemplateId: templateId,
        workflowId,
      },
    });

    if (link) {
      return await prisma.invoiceTemplateWorkflow.delete({
        where: { id: link.id },
      });
    }
  },

  async getTemplateWorkflows(templateId: string) {
    return await prisma.invoiceTemplateWorkflow.findMany({
      where: { invoiceTemplateId: templateId },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  },

  // Workflow Instances
  async createWorkflowInstance(workflowId: string, invoiceId: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!workflow) {
      throw new Error('Workflow nicht gefunden');
    }

    // Create instance
    const instance = await prisma.workflowInstance.create({
      data: {
        workflowId,
        invoiceId,
        status: 'IN_PROGRESS',
        currentStepId: workflow.steps[0]?.id,
      },
    });

    // Create instance steps
    for (const step of workflow.steps as any[]) {
      await prisma.workflowInstanceStep.create({
        data: {
          instanceId: instance.id,
          stepId: step.id,
          status: step.order === 1 ? 'PENDING' : 'PENDING',
        },
      });
    }

    return instance;
  },

  async getInvoiceWorkflowInstances(invoiceId: string) {
    return await prisma.workflowInstance.findMany({
      where: { invoiceId },
      include: {
        workflow: true,
        steps: {
          include: {
            step: true,
            approvedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  },

  async approveWorkflowStep(instanceStepId: string, userId: string, comment?: string) {
    const instanceStep = await prisma.workflowInstanceStep.update({
      where: { id: instanceStepId },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
        comment,
      },
      include: {
        instance: {
          include: {
            steps: {
              include: {
                step: true,
              },
              orderBy: {
                step: {
                  order: 'asc',
                },
              },
            },
          },
        },
      },
    });

    // Check if all steps are approved
    const allApproved = instanceStep.instance.steps.every(
      (step: any) => step.status === 'APPROVED' || step.status === 'SKIPPED'
    );

    if (allApproved) {
      await prisma.workflowInstance.update({
        where: { id: instanceStep.instanceId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    } else {
      // Move to next step
      const currentIndex = instanceStep.instance.steps.findIndex(
        (s) => s.id === instanceStepId
      );
      const nextStep = instanceStep.instance.steps[currentIndex + 1];
      
      if (nextStep) {
        await prisma.workflowInstance.update({
          where: { id: instanceStep.instanceId },
          data: {
            currentStepId: nextStep.stepId,
          },
        });
      }
    }

    return instanceStep;
  },

  async rejectWorkflowStep(instanceStepId: string, userId: string, comment?: string) {
    const instanceStep = await prisma.workflowInstanceStep.update({
      where: { id: instanceStepId },
      data: {
        status: 'REJECTED',
        approvedById: userId,
        approvedAt: new Date(),
        comment,
      },
    });

    // Reject entire workflow instance
    await prisma.workflowInstance.update({
      where: { id: instanceStep.instanceId },
      data: {
        status: 'REJECTED',
        completedAt: new Date(),
      },
    });

    return instanceStep;
  },

  async checkInvoiceWorkflowsCompleted(invoiceId: string): Promise<boolean> {
    const instances = await prisma.workflowInstance.findMany({
      where: { invoiceId },
    });

    if (instances.length === 0) {
      return true; // No workflows = automatically approved
    }

    return instances.every((instance: any) => instance.status === 'COMPLETED');
  },

  async hasAnyRejectedWorkflows(invoiceId: string): Promise<boolean> {
    const rejectedCount = await prisma.workflowInstance.count({
      where: {
        invoiceId,
        status: 'REJECTED',
      },
    });

    return rejectedCount > 0;
  },

  // Get pending approvals for a user
  async getPendingApprovalsForUser(userId: string) {
    const steps = await prisma.workflowInstanceStep.findMany({
      where: {
        status: 'PENDING',
        step: {
          OR: [
            { approverUserIds: { contains: userId } },
          ],
        },
      },
      include: {
        step: true,
        instance: {
          include: {
            workflow: true,
            invoice: {
              include: {
                customer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        instance: {
          startedAt: 'asc',
        },
      },
    });

    // Filter manually to check if user is in approverUserIds array
    return steps.filter(step => {
      const approverIds = JSON.parse(step.step.approverUserIds || '[]');
      return approverIds.includes(userId);
    });
  },
};
