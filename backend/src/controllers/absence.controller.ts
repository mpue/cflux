import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const createAbsenceRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { type, startDate, endDate, days, reason } = req.body;
    const userId = req.user!.id;

    const absenceRequest = await prisma.absenceRequest.create({
      data: {
        userId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days,
        reason
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

    res.status(201).json(absenceRequest);
  } catch (error) {
    console.error('Create absence request error:', error);
    res.status(500).json({ error: 'Failed to create absence request' });
  }
};

export const getMyAbsenceRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const requests = await prisma.absenceRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error('Get my absence requests error:', error);
    res.status(500).json({ error: 'Failed to get absence requests' });
  }
};

export const getAllAbsenceRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const requests = await prisma.absenceRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error('Get all absence requests error:', error);
    res.status(500).json({ error: 'Failed to get absence requests' });
  }
};

export const approveAbsenceRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const reviewerId = req.user!.id;

    const request = await prisma.absenceRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedBy: reviewerId,
        reviewedAt: new Date()
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

    // Update user's vacation days if it's a vacation request
    if (request.type === 'VACATION') {
      await prisma.user.update({
        where: { id: request.userId },
        data: {
          vacationDays: {
            decrement: request.days
          }
        }
      });
    }

    res.json(request);
  } catch (error) {
    console.error('Approve absence request error:', error);
    res.status(500).json({ error: 'Failed to approve absence request' });
  }
};

export const rejectAbsenceRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const reviewerId = req.user!.id;

    const request = await prisma.absenceRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: reviewerId,
        reviewedAt: new Date()
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

    res.json(request);
  } catch (error) {
    console.error('Reject absence request error:', error);
    res.status(500).json({ error: 'Failed to reject absence request' });
  }
};

export const deleteAbsenceRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.absenceRequest.delete({ where: { id } });

    res.json({ message: 'Absence request deleted successfully' });
  } catch (error) {
    console.error('Delete absence request error:', error);
    res.status(500).json({ error: 'Failed to delete absence request' });
  }
};
