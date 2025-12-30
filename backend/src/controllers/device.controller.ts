import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Get all devices
export const getAllDevices = async (req: Request, res: Response) => {
  try {
    const devices = await prisma.device.findMany({
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
      orderBy: {
        name: 'asc'
      }
    });

    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Geräte' });
  }
};

// Get device by ID
export const getDeviceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const device = await prisma.device.findUnique({
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
        assignments: {
          include: {
            assignedUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            assignedAt: 'desc'
          }
        }
      }
    });

    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }

    res.json(device);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Geräts' });
  }
};

// Get devices by user
export const getDevicesByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const devices = await prisma.device.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        assignments: {
          where: {
            returnedAt: null
          },
          orderBy: {
            assignedAt: 'desc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(devices);
  } catch (error) {
    console.error('Error fetching user devices:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Benutzergeräte' });
  }
};

// Create device
export const createDevice = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      serialNumber,
      manufacturer,
      model,
      category,
      purchaseDate,
      warrantyUntil,
      notes,
      userId
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Gerätename ist erforderlich' });
    }

    // Check if serial number already exists
    if (serialNumber) {
      const existing = await prisma.device.findUnique({
        where: { serialNumber }
      });

      if (existing) {
        return res.status(400).json({ error: 'Seriennummer existiert bereits' });
      }
    }

    const device = await prisma.device.create({
      data: {
        name,
        serialNumber: serialNumber || null,
        manufacturer: manufacturer || null,
        model: model || null,
        category: category || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyUntil: warrantyUntil ? new Date(warrantyUntil) : null,
        notes: notes || null,
        userId: userId || null
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

    // Create assignment if user is assigned
    if (userId) {
      await prisma.deviceAssignment.create({
        data: {
          deviceId: device.id,
          userId,
          notes: 'Initiale Zuweisung'
        }
      });
    }

    res.status(201).json(device);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Geräts' });
  }
};

// Update device
export const updateDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      serialNumber,
      manufacturer,
      model,
      category,
      purchaseDate,
      warrantyUntil,
      notes,
      isActive,
      userId
    } = req.body;

    const existingDevice = await prisma.device.findUnique({
      where: { id }
    });

    if (!existingDevice) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }

    // Check if serial number is already used by another device
    if (serialNumber && serialNumber !== existingDevice.serialNumber) {
      const existing = await prisma.device.findUnique({
        where: { serialNumber }
      });

      if (existing && existing.id !== id) {
        return res.status(400).json({ error: 'Seriennummer wird bereits verwendet' });
      }
    }

    // Handle user assignment change
    if (userId !== undefined && userId !== existingDevice.userId) {
      // Close old assignment if exists
      if (existingDevice.userId) {
        await prisma.deviceAssignment.updateMany({
          where: {
            deviceId: id,
            returnedAt: null
          },
          data: {
            returnedAt: new Date()
          }
        });
      }

      // Create new assignment if new user is assigned
      if (userId) {
        await prisma.deviceAssignment.create({
          data: {
            deviceId: id,
            userId,
            notes: 'Gerät neu zugewiesen'
          }
        });
      }
    }

    const device = await prisma.device.update({
      where: { id },
      data: {
        name: name || existingDevice.name,
        serialNumber: serialNumber !== undefined ? serialNumber : existingDevice.serialNumber,
        manufacturer: manufacturer !== undefined ? manufacturer : existingDevice.manufacturer,
        model: model !== undefined ? model : existingDevice.model,
        category: category !== undefined ? category : existingDevice.category,
        purchaseDate: purchaseDate !== undefined ? (purchaseDate ? new Date(purchaseDate) : null) : existingDevice.purchaseDate,
        warrantyUntil: warrantyUntil !== undefined ? (warrantyUntil ? new Date(warrantyUntil) : null) : existingDevice.warrantyUntil,
        notes: notes !== undefined ? notes : existingDevice.notes,
        isActive: isActive !== undefined ? isActive : existingDevice.isActive,
        userId: userId !== undefined ? userId : existingDevice.userId
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

    res.json(device);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Geräts' });
  }
};

// Delete device
export const deleteDevice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const device = await prisma.device.findUnique({
      where: { id }
    });

    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }

    // Delete device and cascade delete assignments
    await prisma.device.delete({
      where: { id }
    });

    res.json({ message: 'Gerät erfolgreich gelöscht' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Geräts' });
  }
};

// Assign device to user
export const assignDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Benutzer-ID ist erforderlich' });
    }

    const device = await prisma.device.findUnique({
      where: { id }
    });

    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }

    // Close any open assignments
    await prisma.deviceAssignment.updateMany({
      where: {
        deviceId: id,
        returnedAt: null
      },
      data: {
        returnedAt: new Date()
      }
    });

    // Create new assignment
    const assignment = await prisma.deviceAssignment.create({
      data: {
        deviceId: id,
        userId,
        notes: notes || null
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        device: true
      }
    });

    // Update device's current user
    await prisma.device.update({
      where: { id },
      data: { userId }
    });

    res.json(assignment);
  } catch (error) {
    console.error('Error assigning device:', error);
    res.status(500).json({ error: 'Fehler beim Zuweisen des Geräts' });
  }
};

// Return device (unassign)
export const returnDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const device = await prisma.device.findUnique({
      where: { id }
    });

    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }

    // Close open assignments
    const updated = await prisma.deviceAssignment.updateMany({
      where: {
        deviceId: id,
        returnedAt: null
      },
      data: {
        returnedAt: new Date(),
        notes: notes || null
      }
    });

    // Update device to remove current user
    await prisma.device.update({
      where: { id },
      data: { userId: null }
    });

    res.json({ message: 'Gerät erfolgreich zurückgegeben', updatedCount: updated.count });
  } catch (error) {
    console.error('Error returning device:', error);
    res.status(500).json({ error: 'Fehler beim Zurückgeben des Geräts' });
  }
};
