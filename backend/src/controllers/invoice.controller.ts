import { Response } from 'express';
import { PrismaClient, InvoiceStatus } from '@prisma/client';
import { AuthRequest } from '../types/auth';
import { workflowService } from '../services/workflow.service';

const prisma = new PrismaClient();

// Get all invoices
export const getAllInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, customerId, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search as string, mode: 'insensitive' } },
        { customer: { name: { contains: search as string, mode: 'insensitive' } } },
        { notes: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        template: true,
        items: {
          orderBy: {
            position: 'asc',
          },
          include: {
            article: {
              select: {
                id: true,
                articleNumber: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        invoiceDate: 'desc',
      },
    });

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

// Get invoice by ID
export const getInvoiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        template: true,
        customer: true,
        items: {
          orderBy: {
            position: 'asc',
          },
          include: {
            article: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// Create invoice
export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      customerId,
      templateId,
      status = InvoiceStatus.DRAFT,
      notes,
      items = [],
    } = req.body;

    // Validate required fields
    if (!invoiceNumber || !invoiceDate || !dueDate || !customerId) {
      return res.status(400).json({
        error: 'invoiceNumber, invoiceDate, dueDate, and customerId are required',
      });
    }

    // Check if invoice number already exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
    });

    if (existingInvoice) {
      return res.status(400).json({ error: 'Invoice number already exists' });
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Calculate totals
    let subtotal = 0;
    let vatAmount = 0;

    const processedItems = items.map((item: any, index: number) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemVat = (itemTotal * item.vatRate) / 100;
      
      subtotal += itemTotal;
      vatAmount += itemVat;

      return {
        ...item,
        position: item.position || index + 1,
        totalPrice: itemTotal,
      };
    });

    const totalAmount = subtotal + vatAmount;

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        customerId,
        templateId: templateId || null,
        status,
        subtotal,
        vatAmount,
        totalAmount,
        notes,
        items: {
          create: processedItems,
        },
      },
      include: {
        customer: true,
        template: true,
        items: {
          orderBy: {
            position: 'asc',
          },
          include: {
            article: true,
          },
        },
      },
    });

    // Auto-start workflows if template has workflows and invoice is SENT
    if (templateId && status === InvoiceStatus.SENT) {
      try {
        const templateWorkflows = await workflowService.getTemplateWorkflows(templateId);
        
        // Create workflow instances for all assigned workflows in order
        for (const link of templateWorkflows.sort((a, b) => a.order - b.order)) {
          if (link.isActive) {
            await workflowService.createWorkflowInstance(link.workflowId, invoice.id);
          }
        }
      } catch (workflowError) {
        console.error('Error starting workflows:', workflowError);
        // Don't fail invoice creation if workflows fail
      }
    }

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

// Update invoice
export const updateInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      customerId,
      templateId,
      status,
      notes,
      isActive,
      items,
    } = req.body;

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check for duplicate invoice number if changed
    if (invoiceNumber && invoiceNumber !== existingInvoice.invoiceNumber) {
      const duplicate = await prisma.invoice.findUnique({
        where: { invoiceNumber },
      });

      if (duplicate) {
        return res.status(400).json({ error: 'Invoice number already exists' });
      }
    }

    // If customerId is being changed, verify it exists
    if (customerId && customerId !== existingInvoice.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
    }

    const updateData: any = {};
    
    if (invoiceNumber !== undefined) updateData.invoiceNumber = invoiceNumber;
    if (invoiceDate !== undefined) updateData.invoiceDate = new Date(invoiceDate);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (templateId !== undefined) updateData.templateId = templateId || null;
    if (customerId !== undefined) updateData.customerId = customerId;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (isActive !== undefined) updateData.isActive = isActive;

    // If items are provided, recalculate totals
    if (items && Array.isArray(items)) {
      let subtotal = 0;
      let vatAmount = 0;

      const processedItems = items.map((item: any, index: number) => {
        const itemTotal = item.quantity * item.unitPrice;
        const itemVat = (itemTotal * item.vatRate) / 100;
        
        subtotal += itemTotal;
        vatAmount += itemVat;

        return {
          ...item,
          position: item.position || index + 1,
          totalPrice: itemTotal,
        };
      });

      const totalAmount = subtotal + vatAmount;

      updateData.subtotal = subtotal;
      updateData.vatAmount = vatAmount;
      updateData.totalAmount = totalAmount;

      // Delete old items and create new ones
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      updateData.items = {
        create: processedItems,
      };
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        template: true,
        items: {
          orderBy: {
            position: 'asc',
          },
          include: {
            article: true,
          },
        },
      },
    });

    // Auto-start workflows if status changes to SENT and template has workflows
    if (status === InvoiceStatus.SENT && status !== existingInvoice.status) {
      const templateId = invoice.templateId || existingInvoice.templateId;
      
      if (templateId) {
        try {
          // Check if workflows already exist for this invoice
          const existingInstances = await workflowService.getInvoiceWorkflowInstances(id);
          
          // Only create workflows if none exist yet
          if (existingInstances.length === 0) {
            const templateWorkflows = await workflowService.getTemplateWorkflows(templateId);
            
            // Create workflow instances for all assigned workflows in order
            for (const link of templateWorkflows.sort((a, b) => a.order - b.order)) {
              if (link.isActive) {
                await workflowService.createWorkflowInstance(link.workflowId, id);
              }
            }
          }
        } catch (workflowError) {
          console.error('Error starting workflows:', workflowError);
          // Don't fail invoice update if workflows fail
        }
      }
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

// Delete invoice
export const deleteInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Soft delete if invoice is paid, otherwise hard delete
    if (invoice.status === InvoiceStatus.PAID) {
      await prisma.invoice.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      await prisma.invoice.delete({
        where: { id },
      });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};

// Generate next invoice number
export const getNextInvoiceNumber = async (req: AuthRequest, res: Response) => {
  try {
    const year = new Date().getFullYear();
    const prefix = `RE-${year}-`;

    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    const invoiceNumber = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    res.json({ invoiceNumber });
  } catch (error) {
    console.error('Error generating invoice number:', error);
    res.status(500).json({ error: 'Failed to generate invoice number' });
  }
};
