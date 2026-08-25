import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';
import { actionService } from '../services/action.service';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { emailService } from '../services/email.service';
import { generateOneTimePassword } from '../utils/password';


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
        avatarUrl: true,
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
        avatarUrl: true,
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
        managerId: true,
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

export const importUsers = async (req: AuthRequest, res: Response) => {
  try {
    const importData = req.body;
    
    if (!importData || !importData.users || !Array.isArray(importData.users)) {
      return res.status(400).json({ error: 'Invalid import data format. Expected { users: [...] }' });
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as Array<{ email: string; error: string }>,
      skipped: 0
    };

    for (const userData of importData.users) {
      try {
        // Email is required for identification
        if (!userData.email) {
          results.skipped++;
          continue;
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        // Prepare user data (only safe fields)
        const userUpdateData: any = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role || 'USER',
          isActive: userData.isActive !== undefined ? userData.isActive : true,
          supervisorId: null // Will be set in second pass
        };

        // Handle password - only for new users or if explicitly provided
        if (!existingUser && userData.password) {
          userUpdateData.password = await bcrypt.hash(userData.password, 10);
        } else if (!existingUser) {
          // Generate random password for new users
          userUpdateData.password = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
          userUpdateData.requiresPasswordChange = true;
        }

        // Prepare employee profile data
        const employeeData: any = {};
        const employeeFields = [
          'dateOfBirth', 'placeOfBirth', 'nationality', 'phone', 'mobile',
          'street', 'streetNumber', 'zipCode', 'postalCode', 'city', 'country',
          'employeeNumber', 'startDate', 'entryDate', 'exitDate', 'probationEndDate',
          'iban', 'bankName', 'bic', 'civilStatus', 'religion',
          'ahvNumber', 'healthInsurance', 'isCrossBorderCommuter', 'taxId', 'taxClass',
          'socialSecurityNumber', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation',
          'department', 'position',
          'weeklyHours', 'contractHours', 'hourlyRate', 'canton', 'exemptFromTracking', 'vacationDays'
        ];

        if (userData.employeeProfile) {
          for (const field of employeeFields) {
            if (userData.employeeProfile[field] !== undefined) {
              employeeData[field] = userData.employeeProfile[field];
            }
          }

          // Convert date strings to Date objects
          const dateFields = ['dateOfBirth', 'entryDate', 'startDate', 'exitDate', 'probationEndDate'];
          for (const field of dateFields) {
            if (employeeData[field]) {
              employeeData[field] = new Date(employeeData[field]);
            }
          }
        }

        let userId: string;

        if (existingUser) {
          // Update existing user
          const updatedUser = await prisma.user.update({
            where: { email: userData.email },
            data: userUpdateData
          });
          userId = updatedUser.id;

          // Update or create employee profile
          const existingEmployee = await prisma.employee.findUnique({
            where: { userId }
          });

          if (existingEmployee && Object.keys(employeeData).length > 0) {
            await prisma.employee.update({
              where: { userId },
              data: {
                firstName: userUpdateData.firstName,
                lastName: userUpdateData.lastName,
                email: userData.email,
                ...employeeData
              }
            });
          } else if (!existingEmployee && Object.keys(employeeData).length > 0) {
            await prisma.employee.create({
              data: {
                userId,
                firstName: userUpdateData.firstName,
                lastName: userUpdateData.lastName,
                email: userData.email,
                ...employeeData
              }
            });
          }

          results.updated++;
        } else {
          // Create new user
          const newUser = await prisma.user.create({
            data: userUpdateData
          });
          userId = newUser.id;

          // Create employee profile if data provided
          if (Object.keys(employeeData).length > 0) {
            await prisma.employee.create({
              data: {
                userId,
                firstName: userUpdateData.firstName,
                lastName: userUpdateData.lastName,
                email: userData.email,
                ...employeeData
              }
            });
          }

          results.created++;
        }

        // Handle user group memberships
        if (userData.userGroupMemberships && Array.isArray(userData.userGroupMemberships)) {
          // Remove existing memberships
          await prisma.userGroupMembership.deleteMany({
            where: { userId }
          });

          // Add new memberships
          for (const membership of userData.userGroupMemberships) {
            if (membership.userGroup && membership.userGroup.name) {
              // Find group by name
              const group = await prisma.userGroup.findUnique({
                where: { name: membership.userGroup.name }
              });

              if (group) {
                await prisma.userGroupMembership.create({
                  data: {
                    userId,
                    userGroupId: group.id
                  }
                });
              }
            }
          }
        }

      } catch (userError: any) {
        results.errors.push({
          email: userData.email || 'unknown',
          error: userError.message
        });
      }
    }

    // Second pass: Set supervisor relationships
    for (const userData of importData.users) {
      try {
        if (userData.email && userData.supervisor && userData.supervisor.email) {
          const user = await prisma.user.findUnique({
            where: { email: userData.email }
          });

          const supervisor = await prisma.user.findUnique({
            where: { email: userData.supervisor.email }
          });

          if (user && supervisor) {
            await prisma.user.update({
              where: { id: user.id },
              data: { supervisorId: supervisor.id }
            });
          }
        }
      } catch (error) {
        // Ignore supervisor errors
      }
    }

    res.json({
      success: true,
      message: 'Import completed',
      results
    });

  } catch (error) {
    console.error('Import users error:', error);
    res.status(500).json({ error: 'Failed to import users' });
  }
};

export const exportUsers = async (req: AuthRequest, res: Response) => {
  try {
    // Fetch all users with complete relations
    const users = await prisma.user.findMany({
      include: {
        // Basic relations
        employeeProfile: true,
        userGroup: true,
        userGroupMemberships: {
          include: {
            userGroup: true
          }
        },
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        jobFunction: true,
        
        // Time tracking & absences
        absenceRequests: true,
        overtimeBalances: true,
        complianceViolations: true,
        
        // Projects
        projectAssignments: {
          include: {
            project: true
          }
        },
        
        // Incidents & EHS
        reportedIncidents: true,
        assignedIncidents: true,
        assignedEHSTodos: true,
        createdEHSTodos: true,
        
        // Workflows
        workflowApprovals: {
          include: {
            instance: true,
            step: true,
            approvedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        
        // Payroll & salary
        payrollEntries: true,
        salaryConfiguration: true,
        
        // Devices
        devices: true,
        deviceAssignments: {
          include: {
            device: true
          }
        },
        
        // Travel expenses
        travelExpenses: true,
        approvedTravelExpenses: true,
        
        // Messages
        sentMessages: {
          select: {
            id: true,
            subject: true,
            createdAt: true,
            isRead: true
          },
          take: 100 // Limit to avoid huge exports
        },
        receivedMessages: {
          select: {
            id: true,
            subject: true,
            createdAt: true,
            isRead: true
          },
          take: 100
        },
        
        // Documents & intranet
        createdDocumentNodes: {
          select: {
            id: true,
            title: true,
            createdAt: true
          }
        },
        updatedDocumentNodes: {
          select: {
            id: true,
            title: true,
            updatedAt: true
          }
        },
        
        // Orders
        requestedOrders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true
          }
        },
        approvedOrders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            approvedAt: true
          }
        },
        rejectedOrders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            rejectedAt: true
          }
        },
        receivedDeliveries: {
          select: {
            id: true,
            deliveryNumber: true,
            deliveryDate: true
          }
        },
        
        // Action logs
        actionLogs: {
          select: {
            id: true,
            actionKey: true,
            success: true,
            createdAt: true
          },
          take: 100 // Limit to avoid huge exports
        },
        
        // Cost centers
        managedCostCenters: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        
        // Inventory
        inventoryMovements: {
          select: {
            id: true,
            type: true,
            quantity: true,
            createdAt: true
          }
        },
        
        // Project budgets
        createdProjectBudgets: {
          select: {
            id: true,
            budgetName: true,
            totalBudget: true,
            createdAt: true
          }
        },
        
        // Dashboard layout
        dashboardLayout: true,
        
        // Time models (Zeitmodelle)
        mitarbeiterZeitmodelle: {
          include: {
            zeitmodell: true
          }
        },
        
        // E-Learning
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        createdCourses: {
          select: {
            id: true,
            title: true,
            createdAt: true
          }
        },
        
        // Onboarding
        supervisedEmployees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        applicantNotes: true,
        uploadedEmployeeDocuments: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            uploadedAt: true
          }
        },
        assignedOnboardingTasks: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        completedOnboardingTasks: {
          select: {
            id: true,
            title: true,
            completedAt: true
          }
        },
        trainingSessions: true,
        equipmentAssignments: {
          include: {
            equipment: true
          }
        },
        
        // Checklists
        createdChecklistTemplates: {
          select: {
            id: true,
            name: true,
            createdAt: true
          }
        },
        userChecklists: {
          select: {
            id: true,
            status: true,
            startDate: true
          }
        },
        assignedChecklists: {
          select: {
            id: true,
            status: true,
            startDate: true
          }
        },
        
        // News
        createdNewsSources: {
          select: {
            id: true,
            name: true,
            createdAt: true
          }
        },
        createdNewsItems: {
          select: {
            id: true,
            title: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `users_export_${timestamp}.json`;

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Send JSON with pretty formatting
    res.json({
      exportDate: new Date().toISOString(),
      totalUsers: users.length,
      users: users
    });

  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Kein Bild hochgeladen' });
    }

    // Process image with sharp: resize to 200x200 with cover crop
    const avatarDir = path.join(__dirname, '../../uploads/avatars');
    const processedFilename = `avatar-${id}-${Date.now()}.webp`;
    const processedPath = path.join(avatarDir, processedFilename);

    await sharp(file.path)
      .resize(200, 200, {
        fit: 'cover',
        position: 'centre'
      })
      .webp({ quality: 85 })
      .toFile(processedPath);

    // Remove original uploaded file
    fs.unlinkSync(file.path);

    // Remove old avatar if exists
    const user = await prisma.user.findUnique({ where: { id }, select: { avatarUrl: true } });
    if (user?.avatarUrl) {
      const oldPath = path.join(__dirname, '../../', user.avatarUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update user record
    const avatarUrl = `uploads/avatars/${processedFilename}`;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Avatar upload error:', error);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Fehler beim Hochladen des Avatars' });
  }
};

export const deleteAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id }, select: { avatarUrl: true } });
    if (user?.avatarUrl) {
      const filePath = path.join(__dirname, '../../', user.avatarUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.user.update({
      where: { id },
      data: { avatarUrl: null }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Avatar delete error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Avatars' });
  }
};

/**
 * Setzt das Passwort eines bestehenden Benutzers auf ein neu erzeugtes
 * Einmal-Passwort und stellt es zu.
 *
 * Zustellung per E-Mail — nur so erreicht das Passwort jemanden, der sich noch
 * nicht anmelden kann. Zusaetzlich wird eine interne Systemnachricht angelegt,
 * damit der Vorgang im System nachvollziehbar ist; sie enthaelt bewusst KEIN
 * Passwort, weil sie ohnehin erst nach dem Login lesbar waere.
 */
export const sendOneTimePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const admin = req.user!;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    if (!user.isActive) {
      return res.status(400).json({
        error: 'Benutzer ist deaktiviert — bitte zuerst aktivieren',
      });
    }

    const password = generateOneTimePassword();

    await prisma.user.update({
      where: { id },
      data: {
        password: await bcrypt.hash(password, 10),
        requiresPasswordChange: true,
        // Ein offener Link aus "Passwort vergessen" darf nach der Zuruecksetzung
        // nicht weiter gueltig sein.
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    const issuedBy = `${admin.email}`;

    let emailSent = false;
    let emailError: string | undefined;

    try {
      emailSent = await emailService.sendOneTimePasswordEmail({
        email: user.email,
        firstName: user.firstName,
        tempPassword: password,
        issuedBy,
      });
    } catch (error: any) {
      emailError = error?.message || 'Unbekannter Fehler beim Mailversand';
      console.error('One-time password email failed:', error);
    }

    // Beleg im Postfach — ohne Passwort
    try {
      await prisma.message.create({
        data: {
          senderId: admin.id,
          receiverId: user.id,
          type: 'SYSTEM',
          priority: 'high',
          subject: 'Ihr Passwort wurde zurückgesetzt',
          body:
            `Hallo ${user.firstName},\n\n` +
            'für Ihren Zugang wurde ein neues Einmal-Passwort vergeben. ' +
            'Das bisherige Passwort ist damit ungültig.\n\n' +
            (emailSent
              ? `Das neue Passwort wurde an ${user.email} gesendet.\n\n`
              : 'Das neue Passwort wurde Ihnen von Ihrem Administrator direkt mitgeteilt.\n\n') +
            'Beim nächsten Login müssen Sie dieses Passwort durch ein eigenes ersetzen.\n\n' +
            'Falls Sie diese Zurücksetzung nicht erwartet haben, melden Sie sich bitte ' +
            'umgehend bei Ihrem Administrator.',
        },
      });
    } catch (error) {
      // Der Beleg ist zweitrangig — das Passwort ist bereits gesetzt und
      // versendet, ein Fehler hier darf den Vorgang nicht scheitern lassen.
      console.error('One-time password system message failed:', error);
    }

    console.log(
      `[SECURITY] ${admin.email} hat ein Einmal-Passwort für ${user.email} erzeugt (Mail: ${emailSent ? 'versendet' : 'fehlgeschlagen'})`
    );

    res.json({
      password,
      email: user.email,
      emailSent,
      emailError,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Send one-time password error:', error);
    res.status(500).json({ error: 'Einmal-Passwort konnte nicht erzeugt werden' });
  }
};
