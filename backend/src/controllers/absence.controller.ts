import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';


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
      // Find user's employee profile and update vacation days
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
        select: { employeeProfile: { select: { id: true } } }
      });
      
      if (user?.employeeProfile?.id) {
        await prisma.employee.update({
          where: { id: user.employeeProfile.id },
          data: {
            vacationDays: {
              decrement: request.days
            }
          }
        });
      }
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

export const createManualAbsence = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, type, startDate, endDate, days, reason, status } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const reviewerId = req.user!.id;
    const finalStatus = status || 'APPROVED';

    const absenceRequest = await prisma.absenceRequest.create({
      data: {
        userId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days,
        reason,
        status: finalStatus,
        reviewedBy: finalStatus !== 'PENDING' ? reviewerId : undefined,
        reviewedAt: finalStatus !== 'PENDING' ? new Date() : undefined,
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

    // Update vacation days if approved vacation
    if (finalStatus === 'APPROVED' && type === 'VACATION') {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { employeeProfile: { select: { id: true } } }
      });
      if (targetUser?.employeeProfile?.id) {
        await prisma.employee.update({
          where: { id: targetUser.employeeProfile.id },
          data: { vacationDays: { decrement: days } }
        });
      }
    }

    res.status(201).json(absenceRequest);
  } catch (error) {
    console.error('Create manual absence error:', error);
    res.status(500).json({ error: 'Failed to create manual absence' });
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

export const updateMyAbsenceRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { type, startDate, endDate, days, reason } = req.body;

    const existing = await prisma.absenceRequest.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Absence request not found or access denied' });
    }

    if (existing.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending requests can be edited' });
    }

    const updated = await prisma.absenceRequest.update({
      where: { id },
      data: {
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days,
        reason,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update my absence request error:', error);
    res.status(500).json({ error: 'Failed to update absence request' });
  }
};

export const deleteMyAbsenceRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const existing = await prisma.absenceRequest.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Absence request not found or access denied' });
    }

    if (existing.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending requests can be deleted' });
    }

    await prisma.absenceRequest.delete({ where: { id } });

    res.json({ message: 'Absence request deleted successfully' });
  } catch (error) {
    console.error('Delete my absence request error:', error);
    res.status(500).json({ error: 'Failed to delete absence request' });
  }
};
