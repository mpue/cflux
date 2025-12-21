import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAllCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { search, isActive } = req.query;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { contactPerson: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    const customers = await prisma.customer.findMany({
      where,
      include: {
        projects: {
          where: { isActive: true },
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(customers);
  } catch (error) {
    console.error('Get all customers error:', error);
    res.status(500).json({ error: 'Failed to get customers' });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            assignments: {
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
            }
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to get customer' });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      zipCode,
      city,
      country,
      taxId,
      notes,
      isActive
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        contactPerson,
        email,
        phone,
        address,
        zipCode,
        city,
        country,
        taxId,
        notes,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      zipCode,
      city,
      country,
      taxId,
      notes,
      isActive
    } = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        contactPerson,
        email,
        phone,
        address,
        zipCode,
        city,
        country,
        taxId,
        notes,
        isActive
      }
    });

    res.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if customer has projects
    const customerWithProjects = await prisma.customer.findUnique({
      where: { id },
      include: {
        projects: true
      }
    });

    if (!customerWithProjects) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (customerWithProjects.projects.length > 0) {
      // Soft delete - set isActive to false
      const customer = await prisma.customer.update({
        where: { id },
        data: { isActive: false }
      });
      return res.json({ message: 'Customer deactivated', customer });
    }

    // Hard delete if no projects
    await prisma.customer.delete({
      where: { id }
    });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};
