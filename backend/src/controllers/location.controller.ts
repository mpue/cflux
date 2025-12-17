import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getAllLocations = async (req: AuthRequest, res: Response) => {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    });

    res.json(locations);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to get locations' });
  }
};

export const getActiveLocations = async (req: AuthRequest, res: Response) => {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json(locations);
  } catch (error) {
    console.error('Get active locations error:', error);
    res.status(500).json({ error: 'Failed to get active locations' });
  }
};

export const getLocationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: { timeEntries: true }
        }
      }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(location);
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ error: 'Failed to get location' });
  }
};

export const createLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Location name is required' });
    }

    const location = await prisma.location.create({
      data: {
        name,
        address,
        description
      }
    });

    res.status(201).json(location);
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
};

export const updateLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, description, isActive } = req.body;

    const location = await prisma.location.update({
      where: { id },
      data: {
        name,
        address,
        description,
        isActive
      }
    });

    res.json(location);
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

export const deleteLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if location is used in time entries
    const timeEntryCount = await prisma.timeEntry.count({
      where: { locationId: id }
    });

    if (timeEntryCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete location with associated time entries',
        timeEntryCount 
      });
    }

    await prisma.location.delete({ where: { id } });

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
};
