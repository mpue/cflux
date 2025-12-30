import { PrismaClient, WorkflowStepType } from '@prisma/client';
import { systemSettingsService } from './systemSettings.service';

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
  async createWorkflowInstance(
    workflowId: string, 
    entityId: string, 
    entityType: 'INVOICE' | 'TRAVEL_EXPENSE' = 'INVOICE'
  ) {
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

    // Parse workflow definition to get nodes and edges
    const definition = JSON.parse(workflow.definition || '{}');
    const { nodes = [], edges = [] } = definition;

    // Load entity data for condition evaluation
    let entityData: any;
    if (entityType === 'INVOICE') {
      entityData = await prisma.invoice.findUnique({
        where: { id: entityId },
        include: {
          items: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } else if (entityType === 'TRAVEL_EXPENSE') {
      entityData = await prisma.travelExpense.findUnique({
        where: { id: entityId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });
    }

    if (!entityData) {
      throw new Error(`${entityType === 'INVOICE' ? 'Rechnung' : 'Reisekosten'} nicht gefunden`);
    }

    // Create instance (will update currentStepId later)
    const instance = await prisma.workflowInstance.create({
      data: {
        workflowId,
        entityType,
        entityId,
        invoiceId: entityType === 'INVOICE' ? entityId : null, // For backwards compatibility
        status: 'IN_PROGRESS',
        currentStepId: workflow.steps[0]?.id || null,
      },
    });

    // Create a map of node IDs to steps
    const nodeToStepMap = new Map<string, any>();
    for (const step of workflow.steps as any[]) {
      // Find the corresponding node in the definition
      const node = nodes.find((n: any) => n.data?.config?.name === step.name || n.id === step.id);
      if (node) {
        nodeToStepMap.set(node.id, step);
      }
    }

    // Evaluate conditions and determine which steps to activate
    const evaluatedConditions = new Map<string, boolean>();
    
    for (const step of workflow.steps as any[]) {
      if (step.type === 'VALUE_CONDITION') {
        const conditionMet = this.evaluateValueCondition(step, entityData);
        console.log(`[Workflow] Evaluating VALUE_CONDITION "${step.name}": ${conditionMet}`);
        // Find the node for this step
        const node = nodes.find((n: any) => n.data?.config?.name === step.name);
        if (node) {
          evaluatedConditions.set(node.id, conditionMet);
          console.log(`[Workflow] Mapped condition node ${node.id} to result: ${conditionMet}`);
        }
      }
    }

    // Determine which steps should be active based on edges
    const activeSteps = new Set<string>();
    let firstActiveStepId: string | null = null;
    
    // Start node is always the entry point
    const startNode = nodes.find((n: any) => n.type === 'start');
    if (startNode) {
      // Find all edges from start node
      const startEdges = edges.filter((e: any) => e.source === startNode.id);
      
      for (const edge of startEdges) {
        const targetNode = nodes.find((n: any) => n.id === edge.target);
        if (targetNode) {
          const targetStep = nodeToStepMap.get(targetNode.id);
          if (targetStep) {
            activeSteps.add(targetStep.id);
            if (!firstActiveStepId && targetStep.type === 'APPROVAL') {
              firstActiveStepId = targetStep.id;
            }
          }
        }
      }
    }

    // Process VALUE_CONDITION nodes and activate connected steps
    for (const [nodeId, conditionMet] of evaluatedConditions) {
      const expectedHandle = conditionMet ? 'true' : 'false';
      const conditionEdges = edges.filter((e: any) => 
        e.source === nodeId && e.sourceHandle === expectedHandle
      );
      
      console.log(`[Workflow] Condition node ${nodeId} is ${conditionMet}, following ${conditionEdges.length} edges with sourceHandle="${expectedHandle}"`);
      
      for (const edge of conditionEdges) {
        const targetNode = nodes.find((n: any) => n.id === edge.target);
        if (targetNode) {
          const targetStep = nodeToStepMap.get(targetNode.id);
          if (targetStep) {
            console.log(`[Workflow] Activating step "${targetStep.name}" (type: ${targetStep.type}) from condition edge`);
            activeSteps.add(targetStep.id);
            if (!firstActiveStepId && targetStep.type === 'APPROVAL') {
              firstActiveStepId = targetStep.id;
            }
          }
        }
      }
    }
    
    // Create instance steps with correct status
    for (const step of workflow.steps as any[]) {
      let stepStatus: 'PENDING' | 'SKIPPED' | 'COMPLETED' = 'SKIPPED';

      if (step.type === 'VALUE_CONDITION') {
        // VALUE_CONDITION is always evaluated, mark as SKIPPED (automatic)
        stepStatus = 'SKIPPED';
      } else if (activeSteps.has(step.id)) {
        // Step is in the active path
        stepStatus = 'PENDING';
      }

      await prisma.workflowInstanceStep.create({
        data: {
          instanceId: instance.id,
          stepId: step.id,
          status: stepStatus,
        },
      });
    }

    // Execute EMAIL steps immediately if they are active
    for (const step of workflow.steps as any[]) {
      if (step.type === 'EMAIL' && activeSteps.has(step.id)) {
        console.log(`[Workflow] Executing EMAIL step "${step.name}" immediately`);
        const emailSent = await this.sendWorkflowEmail(step, entityData);
        
        // Update step status
        await prisma.workflowInstanceStep.updateMany({
          where: {
            instanceId: instance.id,
            stepId: step.id,
          },
          data: {
            status: emailSent ? 'COMPLETED' : 'SKIPPED',
          },
        });
      }
    }

    // Update instance with correct current step
    if (firstActiveStepId) {
      await prisma.workflowInstance.update({
        where: { id: instance.id },
        data: {
          currentStepId: firstActiveStepId,
        },
      });
    }

    return instance;
  },

  // Evaluate VALUE_CONDITION
  evaluateValueCondition(step: any, entityData: any): boolean {
    try {
      const config = JSON.parse(step.config || '{}');
      const { field, operator, value } = config;

      let fieldValue: number;
      
      // Get field value from entity (Invoice or TravelExpense)
      if (field === 'totalAmount' || field === 'total') {
        fieldValue = parseFloat(entityData.totalAmount || entityData.amount || '0');
      } else if (field === 'subtotalAmount' || field === 'subtotal') {
        fieldValue = parseFloat(entityData.subtotalAmount || '0');
      } else if (field === 'amount') {
        fieldValue = parseFloat(entityData.amount || '0');
      } else if (field === 'distance') {
        fieldValue = parseFloat(entityData.distance || '0');
      } else {
        console.warn(`Unknown field: ${field}`);
        return false;
      }

      const compareValue = parseFloat(value);

      // Evaluate condition
      switch (operator) {
        case '>':
        case 'greater':
        case 'greater_than':
          return fieldValue > compareValue;
        case '>=':
        case 'greater_equal':
          return fieldValue >= compareValue;
        case '<':
        case 'less':
        case 'less_than':
          return fieldValue < compareValue;
        case '<=':
        case 'less_equal':
          return fieldValue <= compareValue;
        case '==':
        case '=':
        case 'equal':
        case 'equals':
          return fieldValue === compareValue;
        case '!=':
        case 'not_equal':
          return fieldValue !== compareValue;
        default:
          console.warn(`Unknown operator: ${operator}`);
          return false;
      }
    } catch (error) {
      console.error('Error evaluating VALUE_CONDITION:', error);
      return false;
    }
  },

  // Send email for EMAIL workflow step
  async sendWorkflowEmail(step: any, invoice: any): Promise<boolean> {
    try {
      const config = JSON.parse(step.config || '{}');
      const { recipients, subject, body } = config;

      if (!recipients || recipients.length === 0) {
        console.warn('No recipients configured for EMAIL step');
        return false;
      }

      // Get SMTP settings
      const settings = await systemSettingsService.getSettings();
      
      if (!settings.smtpHost) {
        console.warn('SMTP not configured in system settings');
        return false;
      }

      const nodemailer = require('nodemailer');
      
      // Create transporter config
      const transportConfig: any = {
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        secure: settings.smtpSecure || false,
      };

      // Only add auth if username is provided
      if (settings.smtpUser) {
        transportConfig.auth = {
          user: settings.smtpUser,
          pass: settings.smtpPassword,
        };
      }

      const transporter = nodemailer.createTransport(transportConfig);

      // Replace placeholders in subject and body
      const replacePlaceholders = (text: string) => {
        return text
          .replace(/\{invoiceNumber\}/g, invoice.invoiceNumber || '')
          .replace(/\{totalAmount\}/g, invoice.totalAmount || '0')
          .replace(/\{customerName\}/g, invoice.customer?.name || '')
          .replace(/\{invoiceDate\}/g, invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('de-CH') : '')
          .replace(/\{dueDate\}/g, invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('de-CH') : '');
      };

      const emailSubject = replacePlaceholders(subject || 'Workflow Benachrichtigung');
      const emailBody = replacePlaceholders(body || 'Eine Workflow-Aktion wurde ausgelöst.');

      // Get recipient email addresses
      const recipientEmails: string[] = [];
      for (const recipient of recipients) {
        // Check if it's an email address or a user ID
        if (recipient.includes('@')) {
          // It's already an email address
          recipientEmails.push(recipient);
        } else {
          // It's a user ID, look up the user
          const user = await prisma.user.findUnique({
            where: { id: recipient },
            select: { email: true },
          });
          if (user) {
            recipientEmails.push(user.email);
          }
        }
      }

      if (recipientEmails.length === 0) {
        console.warn('No valid recipient email addresses found');
        return false;
      }

      console.log(`[Workflow] Sending email to: ${recipientEmails.join(', ')}`);

      // Send email
      await transporter.sendMail({
        from: `"${settings.smtpFromName || settings.companyName}" <${settings.smtpFromEmail}>`,
        to: recipientEmails.join(', '),
        subject: emailSubject,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>${emailSubject}</h2>
          <p>${emailBody.replace(/\n/g, '<br>')}</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Diese E-Mail wurde automatisch von ${settings.companyName || 'cflux'} generiert.</p>
        </div>`,
      });

      console.log(`Email sent successfully to ${recipientEmails.length} recipients`);
      return true;
    } catch (error) {
      console.error('Error sending workflow email:', error);
      return false;
    }
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

  async getEntityWorkflowInstances(entityId: string, entityType: 'INVOICE' | 'TRAVEL_EXPENSE') {
    return await prisma.workflowInstance.findMany({
      where: { 
        entityId,
        entityType 
      },
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
      orderBy: {
        startedAt: 'desc'
      }
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
        step: true,
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
      (step: any) => step.status === 'APPROVED' || step.status === 'SKIPPED' || step.status === 'COMPLETED'
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
      // Load workflow definition to find next steps based on edges
      const workflow = await prisma.workflow.findUnique({
        where: { id: instanceStep.instance.workflowId },
        select: { definition: true, steps: true },
      });

      if (workflow) {
        const definition = JSON.parse(workflow.definition || '{}');
        const { nodes = [], edges = [] } = definition;

        // Find current step's node
        const currentStepNode = nodes.find((n: any) => 
          n.data?.config?.name === instanceStep.step.name
        );

        if (currentStepNode) {
          // Find all edges from current node
          const outgoingEdges = edges.filter((e: any) => e.source === currentStepNode.id);

          for (const edge of outgoingEdges) {
            const targetNode = nodes.find((n: any) => n.id === edge.target);
            if (!targetNode) continue;

            // Find the step that corresponds to target node
            const targetStep = workflow.steps.find((s: any) => 
              s.name === targetNode.data?.config?.name
            );
            if (!targetStep) continue;

            // Find the instance step
            const targetInstanceStep = instanceStep.instance.steps.find(
              (is: any) => is.stepId === targetStep.id
            );
            if (!targetInstanceStep) continue;

            // If target is EMAIL, send email immediately
            if (targetStep.type === 'EMAIL') {
              let entityData: any;
              
              if (instanceStep.instance.entityType === 'INVOICE' && instanceStep.instance.invoiceId) {
                entityData = await prisma.invoice.findUnique({
                  where: { id: instanceStep.instance.invoiceId },
                  include: {
                    customer: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                });
              } else if (instanceStep.instance.entityType === 'TRAVEL_EXPENSE') {
                entityData = await prisma.travelExpense.findUnique({
                  where: { id: instanceStep.instance.entityId },
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                      },
                    },
                  },
                });
              }

              if (entityData) {
                const emailSent = await this.sendWorkflowEmail(targetStep, entityData);
                
                await prisma.workflowInstanceStep.update({
                  where: { id: targetInstanceStep.id },
                  data: {
                    status: emailSent ? 'COMPLETED' : 'SKIPPED',
                  },
                });

                // Continue to next nodes after EMAIL
                const emailOutgoingEdges = edges.filter((e: any) => e.source === targetNode.id);
                for (const nextEdge of emailOutgoingEdges) {
                  const nextNode = nodes.find((n: any) => n.id === nextEdge.target);
                  if (nextNode) {
                    const nextStep = workflow.steps.find((s: any) => 
                      s.name === nextNode.data?.config?.name
                    );
                    if (nextStep) {
                      const nextInstanceStep = instanceStep.instance.steps.find(
                        (is: any) => is.stepId === nextStep.id
                      );
                      if (nextInstanceStep && nextInstanceStep.status === 'PENDING') {
                        await prisma.workflowInstance.update({
                          where: { id: instanceStep.instanceId },
                          data: {
                            currentStepId: nextStep.id,
                          },
                        });
                        break;
                      }
                    }
                  }
                }
              }
            } else if (targetInstanceStep.status === 'PENDING') {
              // Move to next PENDING step
              await prisma.workflowInstance.update({
                where: { id: instanceStep.instanceId },
                data: {
                  currentStepId: targetStep.id,
                },
              });
              break;
            }
          }
        }
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
