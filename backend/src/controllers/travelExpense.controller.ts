import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { workflowService } from '../services/workflow.service';

const prisma = new PrismaClient();

// Get all travel expenses (Admin) or own travel expenses (User)
export const getAllTravelExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const where = userRole === 'ADMIN' ? {} : { userId };

    const expenses = await prisma.travelExpense.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching travel expenses:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Reisekosten' });
  }
};

// Get single travel expense
export const getTravelExpenseById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const expense = await prisma.travelExpense.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Reisekosten nicht gefunden' });
    }

    // Check permission: Admin or owner
    if (userRole !== 'ADMIN' && expense.userId !== userId) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error fetching travel expense:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Reisekosten' });
  }
};

// Create travel expense
export const createTravelExpense = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Nicht angemeldet' });
    }

    const {
      type,
      date,
      description,
      destination,
      purpose,
      distance,
      vehicleType,
      amount,
      currency,
      receipt,
      notes
    } = req.body;

    if (!type || !date || !description || !amount) {
      return res.status(400).json({ error: 'Pflichtfelder fehlen' });
    }

    const expense = await prisma.travelExpense.create({
      data: {
        userId,
        type,
        date: new Date(date),
        description,
        destination,
        purpose,
        distance: distance ? parseFloat(distance) : null,
        vehicleType,
        amount: parseFloat(amount),
        currency: currency || 'CHF',
        receipt,
        notes,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Auto-start workflow if default workflow is configured for travel expenses
    try {
      // Get system settings (there's only one record)
      const settings = await prisma.systemSettings.findFirst();

      if (settings?.travelExpenseDefaultWorkflowId) {
        await workflowService.createWorkflowInstance(
          settings.travelExpenseDefaultWorkflowId, 
          expense.id, 
          'TRAVEL_EXPENSE'
        );
      }
    } catch (workflowError) {
      console.error('Error starting workflow:', workflowError);
      // Don't fail expense creation if workflow fails
    }

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating travel expense:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Reisekosten' });
  }
};

// Update travel expense
export const updateTravelExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const existing = await prisma.travelExpense.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reisekosten nicht gefunden' });
    }

    // Only owner can edit (and only if status is PENDING)
    if (existing.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    if (existing.status !== 'PENDING' && userRole !== 'ADMIN') {
      return res.status(400).json({ error: 'Genehmigte oder abgelehnte Reisekosten können nicht bearbeitet werden' });
    }

    const {
      type,
      date,
      description,
      destination,
      purpose,
      distance,
      vehicleType,
      amount,
      currency,
      receipt,
      notes
    } = req.body;

    const expense = await prisma.travelExpense.update({
      where: { id },
      data: {
        type,
        date: date ? new Date(date) : undefined,
        description,
        destination,
        purpose,
        distance: distance ? parseFloat(distance) : null,
        vehicleType,
        amount: amount ? parseFloat(amount) : undefined,
        currency,
        receipt,
        notes
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json(expense);
  } catch (error) {
    console.error('Error updating travel expense:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Reisekosten' });
  }
};

// Delete travel expense
export const deleteTravelExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const existing = await prisma.travelExpense.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reisekosten nicht gefunden' });
    }

    // Only owner can delete (and only if status is PENDING) or Admin
    if (existing.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    if (existing.status !== 'PENDING' && userRole !== 'ADMIN') {
      return res.status(400).json({ error: 'Genehmigte Reisekosten können nicht gelöscht werden' });
    }

    await prisma.travelExpense.delete({
      where: { id }
    });

    res.json({ message: 'Reisekosten gelöscht' });
  } catch (error) {
    console.error('Error deleting travel expense:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Reisekosten' });
  }
};

// Approve travel expense (Admin only)
export const approveTravelExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = req.user?.id;

    if (!approverId) {
      return res.status(401).json({ error: 'Nicht angemeldet' });
    }

    const existing = await prisma.travelExpense.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reisekosten nicht gefunden' });
    }

    if (existing.status !== 'PENDING') {
      return res.status(400).json({ error: 'Reisekosten bereits bearbeitet' });
    }

    const expense = await prisma.travelExpense.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approverId,
        approvedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json(expense);
  } catch (error) {
    console.error('Error approving travel expense:', error);
    res.status(500).json({ error: 'Fehler beim Genehmigen der Reisekosten' });
  }
};

// Reject travel expense (Admin only)
export const rejectTravelExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = req.user?.id;
    const { rejectionReason } = req.body;

    if (!approverId) {
      return res.status(401).json({ error: 'Nicht angemeldet' });
    }

    const existing = await prisma.travelExpense.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reisekosten nicht gefunden' });
    }

    if (existing.status !== 'PENDING') {
      return res.status(400).json({ error: 'Reisekosten bereits bearbeitet' });
    }

    const expense = await prisma.travelExpense.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approverId,
        approvedAt: new Date(),
        rejectionReason
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json(expense);
  } catch (error) {
    console.error('Error rejecting travel expense:', error);
    res.status(500).json({ error: 'Fehler beim Ablehnen der Reisekosten' });
  }
};
