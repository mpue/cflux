import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAllDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const { search, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const departments = await prisma.department.findMany({
      where,
      include: {
        employees: {
          where: { isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            employeeNumber: true,
          },
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(departments);
  } catch (error) {
    console.error('Get all departments error:', error);
    res.status(500).json({ error: 'Failed to get departments' });
  }
};

export const getDepartmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          where: { isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            employeeNumber: true,
          },
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        },
      },
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(department);
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Failed to get department' });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, managerId, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const department = await prisma.department.create({
      data: {
        name,
        description: description || null,
        managerId: managerId || null,
        isActive: isActive ?? true,
      },
      include: {
        employees: {
          where: { isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            employeeNumber: true,
          },
        },
      },
    });

    res.status(201).json(department);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ein Department mit diesem Namen existiert bereits' });
    }
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, managerId, isActive } = req.body;

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(managerId !== undefined && { managerId: managerId || null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        employees: {
          where: { isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
            employeeNumber: true,
          },
        },
      },
    });

    res.json(department);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ein Department mit diesem Namen existiert bereits' });
    }
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Remove department reference from all employees first
    await prisma.employee.updateMany({
      where: { departmentId: id },
      data: { departmentId: null },
    });

    await prisma.department.delete({ where: { id } });

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};

export const addEmployeeToDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    // Verify department exists
    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: { departmentId: id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        position: true,
        employeeNumber: true,
      },
    });

    res.json(employee);
  } catch (error) {
    console.error('Add employee to department error:', error);
    res.status(500).json({ error: 'Failed to add employee to department' });
  }
};

export const removeEmployeeFromDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id, employeeId } = req.params;

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee || employee.departmentId !== id) {
      return res.status(404).json({ error: 'Employee not found in this department' });
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: { departmentId: null },
    });

    res.json({ message: 'Employee removed from department' });
  } catch (error) {
    console.error('Remove employee from department error:', error);
    res.status(500).json({ error: 'Failed to remove employee from department' });
  }
};

export const getAvailableEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Employees not assigned to this department (or unassigned)
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        OR: [
          { departmentId: null },
          { departmentId: { not: id } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        position: true,
        employeeNumber: true,
        departmentId: true,
        departmentRef: {
          select: { name: true },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    res.json(employees);
  } catch (error) {
    console.error('Get available employees error:', error);
    res.status(500).json({ error: 'Failed to get available employees' });
  }
};
