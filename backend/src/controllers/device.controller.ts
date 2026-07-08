import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';


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
        },
        software: {
          orderBy: { name: 'asc' }
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

export const exportDevices = async (req: AuthRequest, res: Response) => {
  try {
    const devices = await prisma.device.findMany({
      orderBy: { name: 'asc' },
      select: {
        name: true,
        serialNumber: true,
        manufacturer: true,
        model: true,
        category: true,
        purchaseDate: true,
        warrantyUntil: true,
        notes: true,
        isActive: true
      }
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=devices-export.json');
    res.json(devices);
  } catch (error) {
    console.error('Export devices error:', error);
    res.status(500).json({ error: 'Failed to export devices' });
  }
};

export const importDevices = async (req: AuthRequest, res: Response) => {
  try {
    const devices = req.body;

    if (!Array.isArray(devices)) {
      return res.status(400).json({ error: 'Invalid data format. Expected an array of devices.' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const device of devices) {
      try {
        if (!device.name) {
          results.failed++;
          results.errors.push(`Device without name skipped`);
          continue;
        }

        // Neues Gerät erstellen (keine Duplikatsprüfung)
        await prisma.device.create({
          data: {
            name: device.name,
            serialNumber: device.serialNumber || null,
            manufacturer: device.manufacturer,
            model: device.model,
            category: device.category,
            purchaseDate: device.purchaseDate ? new Date(device.purchaseDate) : null,
            warrantyUntil: device.warrantyUntil ? new Date(device.warrantyUntil) : null,
            notes: device.notes,
            isActive: device.isActive !== undefined ? device.isActive : true
          }
        });
        
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to import ${device.name}: ${error.message}`);
      }
    }

    res.json({
      message: 'Import completed',
      results
    });
  } catch (error) {
    console.error('Import devices error:', error);
    res.status(500).json({ error: 'Failed to import devices' });
  }
};

// ─────────────────────────────────────────────────────────
// Software / Lizenzen pro Gerät (Assetkatalog)
// ─────────────────────────────────────────────────────────

// Get all software/licenses for a device
export const getDeviceSoftware = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const device = await prisma.device.findUnique({ where: { id } });
    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }

    const software = await prisma.deviceSoftware.findMany({
      where: { deviceId: id },
      orderBy: { name: 'asc' }
    });

    res.json(software);
  } catch (error) {
    console.error('Error fetching device software:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Software/Lizenzen' });
  }
};

// Add a software/license entry to a device
export const createDeviceSoftware = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      vendor,
      version,
      licenseKey,
      licenseType,
      seats,
      purchaseDate,
      expiryDate,
      cost,
      notes
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name ist erforderlich' });
    }

    const device = await prisma.device.findUnique({ where: { id } });
    if (!device) {
      return res.status(404).json({ error: 'Gerät nicht gefunden' });
    }

    const entry = await prisma.deviceSoftware.create({
      data: {
        deviceId: id,
        name,
        type: type || null,
        vendor: vendor || null,
        version: version || null,
        licenseKey: licenseKey || null,
        licenseType: licenseType || null,
        seats: seats !== undefined && seats !== null && seats !== '' ? Number(seats) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        cost: cost !== undefined && cost !== null && cost !== '' ? Number(cost) : null,
        notes: notes || null
      }
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating device software:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Eintrags' });
  }
};

// Update a software/license entry
export const updateDeviceSoftware = async (req: AuthRequest, res: Response) => {
  try {
    const { id, softwareId } = req.params;
    const {
      name,
      type,
      vendor,
      version,
      licenseKey,
      licenseType,
      seats,
      purchaseDate,
      expiryDate,
      cost,
      notes
    } = req.body;

    const existing = await prisma.deviceSoftware.findFirst({
      where: { id: softwareId, deviceId: id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    }

    const entry = await prisma.deviceSoftware.update({
      where: { id: softwareId },
      data: {
        name: name !== undefined ? name : existing.name,
        type: type !== undefined ? (type || null) : existing.type,
        vendor: vendor !== undefined ? (vendor || null) : existing.vendor,
        version: version !== undefined ? (version || null) : existing.version,
        licenseKey: licenseKey !== undefined ? (licenseKey || null) : existing.licenseKey,
        licenseType: licenseType !== undefined ? (licenseType || null) : existing.licenseType,
        seats: seats !== undefined ? (seats !== null && seats !== '' ? Number(seats) : null) : existing.seats,
        purchaseDate: purchaseDate !== undefined ? (purchaseDate ? new Date(purchaseDate) : null) : existing.purchaseDate,
        expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : existing.expiryDate,
        cost: cost !== undefined ? (cost !== null && cost !== '' ? Number(cost) : null) : existing.cost,
        notes: notes !== undefined ? (notes || null) : existing.notes
      }
    });

    res.json(entry);
  } catch (error) {
    console.error('Error updating device software:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Eintrags' });
  }
};

// Delete a software/license entry
export const deleteDeviceSoftware = async (req: AuthRequest, res: Response) => {
  try {
    const { id, softwareId } = req.params;

    const existing = await prisma.deviceSoftware.findFirst({
      where: { id: softwareId, deviceId: id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    }

    await prisma.deviceSoftware.delete({ where: { id: softwareId } });

    res.json({ message: 'Eintrag erfolgreich gelöscht' });
  } catch (error) {
    console.error('Error deleting device software:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Eintrags' });
  }
};
