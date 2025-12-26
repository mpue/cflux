import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        requiresPasswordChange: true,
        vacationDays: true,
        dateOfBirth: true,
        placeOfBirth: true,
        nationality: true,
        phone: true,
        mobile: true,
        street: true,
        streetNumber: true,
        zipCode: true,
        city: true,
        country: true,
        employeeNumber: true,
        entryDate: true,
        exitDate: true,
        iban: true,
        bankName: true,
        civilStatus: true,
        religion: true,
        ahvNumber: true,
        isCrossBorderCommuter: true,
        weeklyHours: true,
        canton: true,
        exemptFromTracking: true,
        contractHours: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        vacationDays: true,
        dateOfBirth: true,
        placeOfBirth: true,
        nationality: true,
        phone: true,
        mobile: true,
        street: true,
        streetNumber: true,
        zipCode: true,
        city: true,
        country: true,
        employeeNumber: true,
        entryDate: true,
        exitDate: true,
        iban: true,
        bankName: true,
        civilStatus: true,
        religion: true,
        ahvNumber: true,
        isCrossBorderCommuter: true,
        weeklyHours: true,
        canton: true,
        exemptFromTracking: true,
        contractHours: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        vacationDays: true,
        weeklyHours: true,
        canton: true,
        exemptFromTracking: true,
        contractHours: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };
    
    // Passwort hashen falls vorhanden
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    // Datum-Strings in DateTime konvertieren
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.entryDate) {
      updateData.entryDate = new Date(updateData.entryDate);
    }
    if (updateData.exitDate) {
      updateData.exitDate = new Date(updateData.exitDate);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        vacationDays: true,
        dateOfBirth: true,
        placeOfBirth: true,
        nationality: true,
        phone: true,
        mobile: true,
        street: true,
        streetNumber: true,
        zipCode: true,
        city: true,
        country: true,
        employeeNumber: true,
        entryDate: true,
        exitDate: true,
        iban: true,
        bankName: true,
        civilStatus: true,
        religion: true,
        ahvNumber: true,
        isCrossBorderCommuter: true,
        weeklyHours: true,
        canton: true,
        exemptFromTracking: true,
        contractHours: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear requiresPasswordChange flag
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        requiresPasswordChange: false
      }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({ where: { id } });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
