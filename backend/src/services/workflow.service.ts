import { PrismaClient, WorkflowStepType } from '@prisma/client';
import { systemSettingsService } from './systemSettings.service';
import { sendSystemMessage } from '../controllers/message.controller';

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

// Helper function to map node types to workflow step types
function mapNodeTypeToStepType(nodeType: string): WorkflowStepType {
  const mapping: { [key: string]: WorkflowStepType } = {
    'approval': 'APPROVAL',
    'email': 'EMAIL',
    'notification': 'NOTIFICATION',
    'condition': 'CONDITION',
    'dateCondition': 'DATE_CONDITION',
    'valueCondition': 'VALUE_CONDITION',
    'delay': 'DELAY',
    'logic': 'LOGIC_AND', // Default to AND logic
  };
  return mapping[nodeType] || 'APPROVAL';
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
      // Check if there are any workflow instance steps referencing old steps
      const existingSteps = await prisma.workflowStep.findMany({
        where: { workflowId: id },
        select: { id: true },
      });

      const stepIds = existingSteps.map(s => s.id);
      
      if (stepIds.length > 0) {
        const referencedSteps = await prisma.workflowInstanceStep.count({
          where: {
            stepId: {
              in: stepIds
            }
          }
        });

        // If there are referenced steps, update existing steps instead of deleting
        if (referencedSteps > 0) {
          console.log(`[Workflow Update] ${referencedSteps} instance step(s) reference existing steps`);
          console.log('[Workflow Update] Updating existing steps in-place to preserve references');
          
          // Create a map of existing steps by order
          const existingStepsWithOrder = await prisma.workflowStep.findMany({
            where: { workflowId: id },
            orderBy: { order: 'asc' },
          });
          
          // Update existing steps with new data (match by order)
          for (const stepData of stepsData) {
            const existingStep = existingStepsWithOrder.find(s => s.order === stepData.order);
            
            if (existingStep) {
              // Update existing step
              console.log(`[Workflow Update] Updating step ${existingStep.id} (order ${stepData.order})`);
              await prisma.workflowStep.update({
                where: { id: existingStep.id },
                data: {
                  name: stepData.name,
                  type: stepData.type,
                  order: stepData.order,
                  config: stepData.config,
                  approverUserIds: stepData.approverUserIds,
                  approverGroupIds: stepData.approverGroupIds,
                  requireAllApprovers: stepData.requireAllApprovers,
                },
              });
            } else {
              // Create new step
              console.log(`[Workflow Update] Creating new step (order ${stepData.order})`);
              await prisma.workflowStep.create({
                data: {
                  ...stepData,
                  workflowId: id,
                },
              });
            }
          }
          
          // Return workflow with updated steps
          return await prisma.workflow.findUnique({
            where: { id },
            include: {
              steps: {
                orderBy: { order: 'asc' },
              },
            },
          });
        }
      }

      // Safe to delete old steps and create new ones
      console.log('[Workflow Update] No instance steps reference old steps, safe to update');
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
    entityType: string = 'INVOICE'
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

    // Load entity data for condition evaluation (optional, only for specific types)
    let entityData: any = null;
    
    try {
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
        if (!entityData) {
          throw new Error('Rechnung nicht gefunden');
        }
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
        if (!entityData) {
          throw new Error('Reisekosten nicht gefunden');
        }
      } else {
        // For generic entity types (ORDER, USER, TIMEENTRY, etc.),
        // we don't load entity data - conditions will use action context data
        console.log(`[Workflow] Creating workflow instance for generic entity type: ${entityType}`);
        entityData = { id: entityId }; // Minimal data for workflow creation
      }
    } catch (error: any) {
      // For backwards compatibility, if loading fails for INVOICE/TRAVEL_EXPENSE, throw error
      if (entityType === 'INVOICE' || entityType === 'TRAVEL_EXPENSE') {
        throw error;
      }
      // For other types, continue with minimal data
      console.warn(`[Workflow] Could not load entity data for ${entityType}, continuing with minimal data`);
      entityData = { id: entityId };
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
    console.log(`[Workflow] Creating node-to-step mapping for ${workflow.steps.length} steps and ${nodes.length} nodes`);
    const nodeToStepMap = new Map<string, any>();
    
    const workflowSteps = workflow.steps as any[];
    
    // Try to map by nodeId stored in config first
    for (const step of workflowSteps) {
      try {
        const config = JSON.parse(step.config || '{}');
        if (config.nodeId) {
          nodeToStepMap.set(config.nodeId, step);
          console.log(`[Workflow] Mapped node ${config.nodeId} -> step ${step.id} (name: ${step.name}, type: ${step.type}) via stored nodeId`);
        }
      } catch (e) {
        console.log(`[Workflow] Failed to parse config for step ${step.id}`);
      }
    }
    
    // Fallback: map by matching step order to node order (excluding start/end nodes)
    if (nodeToStepMap.size === 0) {
      console.log('[Workflow] No nodeId mappings found, falling back to order-based mapping');
      const actionNodes = nodes.filter((n: any) => n.type !== 'start' && n.type !== 'end');
      console.log(`[Workflow] Found ${actionNodes.length} action nodes (excluding start/end)`);
      
      for (let i = 0; i < workflowSteps.length && i < actionNodes.length; i++) {
        const step = workflowSteps[i];
        const node = actionNodes[i];
        nodeToStepMap.set(node.id, step);
        console.log(`[Workflow] Mapped node ${node.id} (type: ${node.type}, label: ${node.data?.label}) -> step ${step.id} (name: ${step.name}, type: ${step.type}) via order`);
      }
    }
    
    console.log(`[Workflow] Node-to-step mapping complete with ${nodeToStepMap.size} mappings`);

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
    console.log(`[Workflow] Found start node: ${startNode?.id}`);
    
    if (startNode) {
      // Find all edges from start node
      const startEdges = edges.filter((e: any) => e.source === startNode.id);
      console.log(`[Workflow] Found ${startEdges.length} edges from start node`);
      
      for (const edge of startEdges) {
        const targetNode = nodes.find((n: any) => n.id === edge.target);
        console.log(`[Workflow] Edge target node: ${targetNode?.id} (type: ${targetNode?.type})`);
        
        if (targetNode) {
          const targetStep = nodeToStepMap.get(targetNode.id);
          if (targetStep) {
            console.log(`[Workflow] Activating step "${targetStep.name}" (id: ${targetStep.id}, type: ${targetStep.type}) from start node`);
            activeSteps.add(targetStep.id);
            if (!firstActiveStepId && targetStep.type === 'APPROVAL') {
              firstActiveStepId = targetStep.id;
            }
          } else {
            console.log(`[Workflow] WARNING: No step mapping found for target node ${targetNode.id}`);
          }
        }
      }
    }
    
    console.log(`[Workflow] Active steps after start node processing: ${activeSteps.size} steps`);

    // Process VALUE_CONDITION nodes and activate connected steps
    for (const [nodeId, conditionMet] of Array.from(evaluatedConditions.entries())) {
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

    // Execute EMAIL and NOTIFICATION steps immediately if they are active
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
      
      if (step.type === 'NOTIFICATION' && activeSteps.has(step.id)) {
        console.log(`[Workflow] Executing NOTIFICATION step "${step.name}" immediately`);
        const notificationsSent = await this.sendWorkflowNotifications(step, instance);
        
        // Update step status
        await prisma.workflowInstanceStep.updateMany({
          where: {
            instanceId: instance.id,
            stepId: step.id,
          },
          data: {
            status: notificationsSent ? 'COMPLETED' : 'SKIPPED',
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

  async getEntityWorkflowInstances(entityId: string, entityType: string) {
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

  // Test Workflow (executes workflow and cleans up old test instances)
  async testWorkflow(workflowId: string, invoiceId: string) {
    try {
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

      // Load invoice for testing
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
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

      if (!invoice) {
        throw new Error('Rechnung nicht gefunden');
      }

      // Delete old test workflow instances for this workflow and invoice to avoid conflicts
      console.log(`[WORKFLOW TEST] Cleaning up old workflow instances for workflow ${workflowId} and invoice ${invoiceId}`);
      const oldInstances = await prisma.workflowInstance.findMany({
        where: {
          workflowId: workflowId,
          entityType: 'INVOICE',
          entityId: invoiceId,
        },
        select: { id: true },
      });

      for (const oldInstance of oldInstances) {
        // Delete instance steps first (due to foreign key constraints)
        await prisma.workflowInstanceStep.deleteMany({
          where: { instanceId: oldInstance.id },
        });
        // Then delete the instance itself
        await prisma.workflowInstance.delete({
          where: { id: oldInstance.id },
        });
      }

      if (oldInstances.length > 0) {
        console.log(`[WORKFLOW TEST] Deleted ${oldInstances.length} old workflow instance(s)`);
      }

      // For testing, we need to ensure the workflow steps are up-to-date with the definition
      // Delete all instance steps that reference old workflow steps
      if (workflow.steps.length > 0) {
        const stepIds = workflow.steps.map((s: any) => s.id);
        const referencedSteps = await prisma.workflowInstanceStep.count({
          where: {
            stepId: {
              in: stepIds
            }
          }
        });
        
        if (referencedSteps > 0) {
          console.log(`[WORKFLOW TEST] Deleting ${referencedSteps} old workflow instance step(s) that reference this workflow's steps`);
          await prisma.workflowInstanceStep.deleteMany({
            where: {
              stepId: {
                in: stepIds
              }
            }
          });
        }
        
        // Now safe to delete and recreate workflow steps
        console.log(`[WORKFLOW TEST] Deleting ${workflow.steps.length} old workflow step(s)`);
        await prisma.workflowStep.deleteMany({
          where: { workflowId: workflowId }
        });
        
        // Parse definition and recreate steps
        const definition = JSON.parse(workflow.definition || '{}');
        const { nodes = [] } = definition;
        const actionNodes = nodes.filter((n: any) => n.type !== 'start' && n.type !== 'end');
        
        console.log(`[WORKFLOW TEST] Creating ${actionNodes.length} new workflow step(s)`);
        for (let i = 0; i < actionNodes.length; i++) {
          const node = actionNodes[i];
          const config = node.data?.config || {};
          
          await prisma.workflowStep.create({
            data: {
              workflowId: workflowId,
              name: config.name || node.data?.label || `Step ${i + 1}`,
              type: mapNodeTypeToStepType(node.type),
              order: i + 1,
              approverUserIds: JSON.stringify(config.approverUserIds || []),
              approverGroupIds: JSON.stringify([]),
              requireAllApprovers: config.requireAllApprovers || false,
              config: JSON.stringify({
                ...config,
                nodeId: node.id,
              }),
            },
          });
        }
        
        console.log(`[WORKFLOW TEST] Recreated workflow steps`);
      }

      // Execute the workflow for real
      console.log(`[WORKFLOW TEST] Starting workflow execution for workflow ${workflowId} with invoice ${invoiceId}`);
      
      const workflowInstance = await this.createWorkflowInstance(
        workflowId,
        invoiceId,
        'INVOICE'
      );

      console.log(`[WORKFLOW TEST] Workflow instance created: ${workflowInstance.id}`);

      // Get the workflow instance with its steps
      const instanceWithSteps = await prisma.workflowInstance.findUnique({
        where: { id: workflowInstance.id },
        include: {
          steps: {
            include: {
              step: true,
            },
          },
        },
      });

      // Format the results for the test response
      const testResults = (instanceWithSteps?.steps || []).map((step: any) => ({
        name: step.step.name,
        type: step.step.type,
        status: step.status,
        config: JSON.parse(step.step.config || '{}'),
        approvedAt: step.approvedAt,
        comment: step.comment,
      }));

      return {
        success: true,
        message: `Workflow wurde erfolgreich ausgeführt mit Rechnung ${invoice.invoiceNumber} (CHF ${invoice.totalAmount})`,
        invoice: {
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount,
          customerName: invoice.customer.name,
        },
        workflowInstanceId: workflowInstance.id,
        steps: testResults,
      };
    } catch (error: any) {
      console.error('Error testing workflow:', error);
      return {
        success: false,
        message: 'Test fehlgeschlagen',
        error: error.message,
        steps: [],
      };
    }
  },

  // Send workflow notification messages
  async sendWorkflowNotification(
    receiverId: string,
    workflowName: string,
    action: 'APPROVAL_REQUESTED' | 'APPROVED' | 'REJECTED',
    entityType: string,
    entityId: string,
    comment?: string
  ) {
    try {
      let subject = '';
      let body = '';

      switch (action) {
        case 'APPROVAL_REQUESTED':
          subject = `🔔 Genehmigungsanfrage: ${workflowName}`;
          body = `<p>Sie haben eine neue Genehmigungsanfrage im Workflow <strong>${workflowName}</strong>.</p>
                  <p><strong>Entität:</strong> ${entityType}</p>
                  <p>Bitte überprüfen Sie die Anfrage unter <a href="/my-approvals">Meine Genehmigungen</a>.</p>`;
          break;
        case 'APPROVED':
          subject = `✅ Workflow genehmigt: ${workflowName}`;
          body = `<p>Ihr Workflow-Schritt wurde genehmigt.</p>
                  <p><strong>Workflow:</strong> ${workflowName}</p>
                  <p><strong>Entität:</strong> ${entityType}</p>
                  ${comment ? `<p><strong>Kommentar:</strong> ${comment}</p>` : ''}`;
          break;
        case 'REJECTED':
          subject = `❌ Workflow abgelehnt: ${workflowName}`;
          body = `<p>Ihr Workflow-Schritt wurde abgelehnt.</p>
                  <p><strong>Workflow:</strong> ${workflowName}</p>
                  <p><strong>Entität:</strong> ${entityType}</p>
                  ${comment ? `<p><strong>Grund:</strong> ${comment}</p>` : ''}`;
          break;
      }

      await sendSystemMessage(
        receiverId,
        subject,
        body,
        'WORKFLOW',
        undefined,
        entityId
      );

      console.log(`[WORKFLOW] Notification sent to user ${receiverId}: ${action}`);
    } catch (error) {
      console.error('Error sending workflow notification:', error);
    }
  },

  // Send notifications to multiple recipients (for NOTIFICATION nodes)
  async sendWorkflowNotifications(step: any, workflowInstance: any): Promise<boolean> {
    try {
      const config = JSON.parse(step.config || '{}');
      const recipients = config.recipients || [];
      let message = config.message || 'Sie haben eine neue Workflow-Benachrichtigung.';
      
      if (recipients.length === 0) {
        console.log('[WORKFLOW] No recipients configured for notification');
        return false;
      }

      // Get workflow name
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowInstance.workflowId },
        select: { name: true }
      });

      const workflowName = workflow?.name || 'Workflow';
      const entityType = workflowInstance.entityType || 'ENTITY';
      const entityId = workflowInstance.invoiceId || workflowInstance.entityId || '';

      // Fetch entity details for template variables
      let entityData: any = {};
      
      // Support legacy invoiceId field
      if (workflowInstance.invoiceId) {
        const invoice = await prisma.invoice.findUnique({
          where: { id: workflowInstance.invoiceId },
          include: { customer: true }
        });
        entityData = {
          invoiceNumber: invoice?.invoiceNumber || '',
          customerName: invoice?.customer?.name || ''
        };
      }
      
      // Support generic entityType/entityId
      if (entityType === 'ORDER' && entityId) {
        const order = await prisma.order.findUnique({
          where: { id: entityId },
          include: { supplier: true, requestedBy: true }
        });
        entityData = {
          orderNumber: order?.orderNumber || '',
          supplierName: order?.supplier?.name || '',
          userName: order?.requestedBy ? `${order.requestedBy.firstName} ${order.requestedBy.lastName}` : '',
          userId: order?.requestedById || ''
        };
      } else if (entityType === 'INVOICE' && entityId && !workflowInstance.invoiceId) {
        const invoice = await prisma.invoice.findUnique({
          where: { id: entityId },
          include: { customer: true }
        });
        entityData = {
          invoiceNumber: invoice?.invoiceNumber || '',
          customerName: invoice?.customer?.name || ''
        };
      }

      // Template variables
      const variables: Record<string, string> = {
        workflowName,
        entityType,
        currentDate: new Date().toLocaleDateString('de-CH'),
        orderNumber: entityData.orderNumber || '',
        invoiceNumber: entityData.invoiceNumber || '',
        userName: entityData.userName || '',
        userId: entityData.userId || '',
        customerName: entityData.customerName || '',
        supplierName: entityData.supplierName || ''
      };

      // Replace template variables in message
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        message = message.replace(regex, value);
      });

      // Send message to each recipient
      for (const recipientId of recipients) {
        const subject = `🔔 ${workflowName}: ${step.name || 'Benachrichtigung'}`;
        const body = `<p>${message}</p>
                      <p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; font-size: 0.9em; color: #666;">
                        <strong>Workflow:</strong> ${workflowName}<br/>
                        <strong>Entität:</strong> ${entityType}
                      </p>`;

        await sendSystemMessage(
          recipientId,
          subject,
          body,
          'WORKFLOW',
          workflowInstance.workflowId,
          entityId
        );
      }

      console.log(`[WORKFLOW] Notifications sent to ${recipients.length} recipients`);
      return true;
    } catch (error) {
      console.error('Error sending workflow notifications:', error);
      return false;
    }
  },
};
