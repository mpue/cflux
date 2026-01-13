import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAllCostCenters = async (req: AuthRequest, res: Response) => {
  try {
    const { includeInactive } = req.query;
    
    const costCenters = await prisma.costCenter.findMany({
      where: includeInactive === 'true' ? {} : { isActive: true },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            timeEntries: true,
            invoices: true,
            orders: true
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    res.json(costCenters);
  } catch (error) {
    console.error('Error fetching cost centers:', error);
    res.status(500).json({ error: 'Failed to fetch cost centers' });
  }
};

export const getCostCenterById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const costCenter = await prisma.costCenter.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            timeEntries: true,
            invoices: true,
            orders: true
          }
        }
      }
    });

    if (!costCenter) {
      return res.status(404).json({ error: 'Cost center not found' });
    }

    res.json(costCenter);
  } catch (error) {
    console.error('Error fetching cost center:', error);
    res.status(500).json({ error: 'Failed to fetch cost center' });
  }
};

export const createCostCenter = async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, description, managerId } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }

    // Check if code already exists
    const existing = await prisma.costCenter.findUnique({
      where: { code }
    });

    if (existing) {
      return res.status(400).json({ error: 'Cost center code already exists' });
    }

    const costCenter = await prisma.costCenter.create({
      data: {
        code,
        name,
        description,
        managerId
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(costCenter);
  } catch (error) {
    console.error('Error creating cost center:', error);
    res.status(500).json({ error: 'Failed to create cost center' });
  }
};

export const updateCostCenter = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name, description, managerId, isActive } = req.body;

    // Check if code is being changed and already exists
    if (code) {
      const existing = await prisma.costCenter.findFirst({
        where: {
          code,
          NOT: { id }
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'Cost center code already exists' });
      }
    }

    const costCenter = await prisma.costCenter.update({
      where: { id },
      data: {
        code,
        name,
        description,
        managerId,
        isActive
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json(costCenter);
  } catch (error) {
    console.error('Error updating cost center:', error);
    res.status(500).json({ error: 'Failed to update cost center' });
  }
};

export const deleteCostCenter = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Soft delete - set isActive to false
    const costCenter = await prisma.costCenter.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Cost center deleted successfully', costCenter });
  } catch (error) {
    console.error('Error deleting cost center:', error);
    res.status(500).json({ error: 'Failed to delete cost center' });
  }
};

export const getCostCenterStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = {
      costCenterId: id
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const [timeEntries, invoices, orders] = await Promise.all([
      prisma.timeEntry.findMany({
        where: {
          ...where,
          clockOut: { not: null }
        },
        select: {
          clockIn: true,
          clockOut: true,
          pauseMinutes: true
        }
      }),
      prisma.invoice.findMany({
        where,
        select: {
          totalAmount: true,
          status: true
        }
      }),
      prisma.order.findMany({
        where,
        select: {
          grandTotal: true,
          status: true
        }
      })
    ]);

    // Calculate total hours
    const totalHours = timeEntries.reduce((sum, entry) => {
      if (!entry.clockOut) return sum;
      const duration = (new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) / (1000 * 60 * 60);
      const pause = (entry.pauseMinutes || 0) / 60;
      return sum + (duration - pause);
    }, 0);

    // Calculate invoice totals
    const invoiceStats = {
      total: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      count: invoices.length,
      paid: invoices.filter(inv => inv.status === 'PAID').length,
      pending: invoices.filter(inv => inv.status === 'SENT').length
    };

    // Calculate order totals
    const orderStats = {
      total: orders.reduce((sum, ord) => sum + ord.grandTotal, 0),
      count: orders.length,
      completed: orders.filter(ord => ord.status === 'RECEIVED').length,
      pending: orders.filter(ord => ['REQUESTED', 'APPROVED', 'ORDERED'].includes(ord.status)).length
    };

    res.json({
      totalHours: Math.round(totalHours * 100) / 100,
      invoices: invoiceStats,
      orders: orderStats
    });
  } catch (error) {
    console.error('Error fetching cost center stats:', error);
    res.status(500).json({ error: 'Failed to fetch cost center stats' });
  }
};
