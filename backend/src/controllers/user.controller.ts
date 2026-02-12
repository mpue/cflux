import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';
import { actionService } from '../services/action.service';

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
        createdAt: true,
        employeeProfile: {
          select: {
            id: true,
            dateOfBirth: true,
            placeOfBirth: true,
            nationality: true,
            phone: true,
            mobile: true,
            street: true,
            streetNumber: true,
            zipCode: true,
            postalCode: true,
            city: true,
            country: true,
            employeeNumber: true,
            startDate: true,
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
            hourlyRate: true,
            vacationDays: true,
            department: true,
            position: true
          }
        }
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

export const getUsersList = async (req: AuthRequest, res: Response) => {
  try {
    // Return only basic user info for all authenticated users
    // This is used for dropdowns (e.g., assign incidents to users)
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    res.json(users);
  } catch (error) {
    console.error('Get users list error:', error);
    res.status(500).json({ error: 'Failed to get users list' });
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
        createdAt: true,
        userGroupId: true,
        jobFunctionId: true,
        jobFunction: {
          select: {
            id: true,
            title: true,
            titleEn: true,
            department: true,
            level: true,
            category: true,
          },
        },
        userGroupMemberships: {
          include: {
            userGroup: {
              select: {
                id: true,
                name: true,
                color: true,
                isActive: true,
              },
            },
          },
        },
        supervisorId: true,
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        employeeProfile: {
          select: {
            id: true,
            dateOfBirth: true,
            placeOfBirth: true,
            nationality: true,
            phone: true,
            mobile: true,
            street: true,
            streetNumber: true,
            zipCode: true,
            postalCode: true,
            city: true,
            country: true,
            employeeNumber: true,
            startDate: true,
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
            hourlyRate: true,
            vacationDays: true,
            department: true,
            position: true
          }
        },
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
        createdAt: true,
        supervisorId: true,
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        employeeProfile: {
          select: {
            id: true,
            vacationDays: true,
            weeklyHours: true,
            canton: true,
            exemptFromTracking: true,
            contractHours: true,
            hourlyRate: true,
            department: true,
            position: true,
            employeeNumber: true,
            startDate: true,
            entryDate: true,
            exitDate: true
          }
        }
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

export const getOrgChart = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        supervisorId: true,
        jobFunctionId: true,
        jobFunction: {
          select: {
            id: true,
            title: true,
            department: true,
          },
        },
        employeeProfile: {
          select: {
            id: true,
            position: true,
            department: true,
            departmentId: true,
            departmentRef: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ users, departments });
  } catch (error) {
    console.error('Get org chart error:', error);
    res.status(500).json({ error: 'Failed to get org chart data' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };
    
    // Separate user data from employee data
    const employeeFields = [
      'dateOfBirth', 'placeOfBirth', 'nationality', 'phone', 'mobile',
      'street', 'streetNumber', 'zipCode', 'postalCode', 'city', 'country',
      'employeeNumber', 'startDate', 'entryDate', 'exitDate', 'probationEndDate',
      'iban', 'bankName', 'bic', 'civilStatus', 'religion',
      'ahvNumber', 'healthInsurance', 'isCrossBorderCommuter', 'taxId', 'taxClass',
      'socialSecurityNumber', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation',
      'department', 'position', 'salaryEncrypted',
      'weeklyHours', 'contractHours', 'hourlyRate', 'canton', 'exemptFromTracking', 'vacationDays'
    ];
    
    const employeeData: any = {};
    const userData: any = {};
    
    // Split data into user and employee fields
    for (const key in updateData) {
      if (employeeFields.includes(key)) {
        employeeData[key] = updateData[key];
      } else {
        userData[key] = updateData[key];
      }
    }
    
    // Passwort hashen falls vorhanden
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    
    // Datum-Strings in DateTime konvertieren (Employee data)
    if (employeeData.dateOfBirth) {
      employeeData.dateOfBirth = new Date(employeeData.dateOfBirth);
    }
    if (employeeData.entryDate) {
      employeeData.entryDate = new Date(employeeData.entryDate);
    }
    if (employeeData.startDate) {
      employeeData.startDate = new Date(employeeData.startDate);
    }
    if (employeeData.exitDate) {
      employeeData.exitDate = new Date(employeeData.exitDate);
    }
    if (employeeData.probationEndDate) {
      employeeData.probationEndDate = new Date(employeeData.probationEndDate);
    }

    // Update user data
    const user = await prisma.user.update({
      where: { id },
      data: userData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    // Always sync firstName, lastName, email to employee profile
    const existingEmployee = await prisma.employee.findUnique({
      where: { userId: id }
    });

    // Prepare employee data with synced firstName, lastName, email
    const employeeUpdateData: any = {};
    
    // Always sync basic fields if they changed
    if (userData.firstName) employeeUpdateData.firstName = userData.firstName;
    if (userData.lastName) employeeUpdateData.lastName = userData.lastName;
    if (userData.email) employeeUpdateData.email = userData.email;
    
    // Add all employee-specific fields
    Object.assign(employeeUpdateData, employeeData);

    if (existingEmployee) {
      // Update existing employee profile (only if there's data to update)
      if (Object.keys(employeeUpdateData).length > 0) {
        await prisma.employee.update({
          where: { userId: id },
          data: employeeUpdateData
        });
      }
    } else {
      // Create employee profile if it doesn't exist
      await prisma.employee.create({
        data: {
          userId: id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          ...employeeData
        }
      });
    }

    // Fetch complete user with employee profile
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        employeeProfile: true
      }
    });

    // Trigger user.updated action
    try {
      await actionService.triggerAction('user.updated', {
        entityType: 'USER',
        entityId: user.id,
        userId: req.user!.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        updatedAt: new Date().toISOString()
      });
    } catch (actionError) {
      console.error('[Action] Failed to trigger user.updated:', actionError);
    }

    res.json(updatedUser);
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

export const getSubordinates = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const subordinates = await prisma.user.findMany({
      where: { supervisorId: id, isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
    res.json(subordinates);
  } catch (error) {
    console.error('Get subordinates error:', error);
    res.status(500).json({ error: 'Failed to get subordinates' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });

    await prisma.user.delete({ where: { id } });

    // Trigger user.deleted action
    try {
      if (user) {
        await actionService.triggerAction('user.deleted', {
          entityType: 'USER',
          entityId: id,
          userId: req.user!.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          deletedAt: new Date().toISOString()
        });
      }
    } catch (actionError) {
      console.error('[Action] Failed to trigger user.deleted:', actionError);
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
