import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';


export const getAllTools = async (req: Request, res: Response) => {
  try {
    const tools = await prisma.tool.findMany({
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(tools);
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Werkzeuge' });
  }
};

export const getToolById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tool = await prisma.tool.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        assignments: {
          include: {
            assignedUser: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          },
          orderBy: { assignedAt: 'desc' }
        }
      }
    });
    if (!tool) {
      return res.status(404).json({ error: 'Werkzeug nicht gefunden' });
    }
    res.json(tool);
  } catch (error) {
    console.error('Error fetching tool:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Werkzeugs' });
  }
};

export const getToolsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const tools = await prisma.tool.findMany({
      where: { assignedToId: userId, isActive: true },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(tools);
  } catch (error) {
    console.error('Error fetching user tools:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Werkzeuge' });
  }
};

export const createTool = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, inventoryNumber, manufacturer, model, category,
      location, purchaseDate, lastInspection, nextInspection,
      condition, notes, assignedToId
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Werkzeugname ist erforderlich' });
    }

    if (inventoryNumber) {
      const existing = await prisma.tool.findUnique({ where: { inventoryNumber } });
      if (existing) {
        return res.status(400).json({ error: 'Inventarnummer existiert bereits' });
      }
    }

    const tool = await prisma.tool.create({
      data: {
        name,
        inventoryNumber: inventoryNumber || null,
        manufacturer: manufacturer || null,
        model: model || null,
        category: category || null,
        location: location || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        lastInspection: lastInspection ? new Date(lastInspection) : null,
        nextInspection: nextInspection ? new Date(nextInspection) : null,
        condition: condition || 'gut',
        notes: notes || null,
        assignedToId: assignedToId || null
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (assignedToId) {
      await prisma.toolAssignment.create({
        data: { toolId: tool.id, userId: assignedToId, notes: 'Initiale Zuweisung' }
      });
    }

    res.status(201).json(tool);
  } catch (error) {
    console.error('Error creating tool:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Werkzeugs' });
  }
};

export const updateTool = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name, inventoryNumber, manufacturer, model, category,
      location, purchaseDate, lastInspection, nextInspection,
      condition, notes, isActive, assignedToId
    } = req.body;

    const existingTool = await prisma.tool.findUnique({ where: { id } });
    if (!existingTool) {
      return res.status(404).json({ error: 'Werkzeug nicht gefunden' });
    }

    if (inventoryNumber && inventoryNumber !== existingTool.inventoryNumber) {
      const existing = await prisma.tool.findUnique({ where: { inventoryNumber } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ error: 'Inventarnummer wird bereits verwendet' });
      }
    }

    // Handle assignment changes
    if (assignedToId !== undefined && assignedToId !== existingTool.assignedToId) {
      if (existingTool.assignedToId) {
        await prisma.toolAssignment.updateMany({
          where: { toolId: id, returnedAt: null },
          data: { returnedAt: new Date() }
        });
      }
      if (assignedToId) {
        await prisma.toolAssignment.create({
          data: { toolId: id, userId: assignedToId, notes: 'Werkzeug neu zugewiesen' }
        });
      }
    }

    const tool = await prisma.tool.update({
      where: { id },
      data: {
        name: name || existingTool.name,
        inventoryNumber: inventoryNumber !== undefined ? inventoryNumber : existingTool.inventoryNumber,
        manufacturer: manufacturer !== undefined ? manufacturer : existingTool.manufacturer,
        model: model !== undefined ? model : existingTool.model,
        category: category !== undefined ? category : existingTool.category,
        location: location !== undefined ? location : existingTool.location,
        purchaseDate: purchaseDate !== undefined ? (purchaseDate ? new Date(purchaseDate) : null) : existingTool.purchaseDate,
        lastInspection: lastInspection !== undefined ? (lastInspection ? new Date(lastInspection) : null) : existingTool.lastInspection,
        nextInspection: nextInspection !== undefined ? (nextInspection ? new Date(nextInspection) : null) : existingTool.nextInspection,
        condition: condition !== undefined ? condition : existingTool.condition,
        notes: notes !== undefined ? notes : existingTool.notes,
        isActive: isActive !== undefined ? isActive : existingTool.isActive,
        assignedToId: assignedToId !== undefined ? assignedToId : existingTool.assignedToId
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    res.json(tool);
  } catch (error) {
    console.error('Error updating tool:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Werkzeugs' });
  }
};

export const deleteTool = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tool = await prisma.tool.findUnique({ where: { id } });
    if (!tool) {
      return res.status(404).json({ error: 'Werkzeug nicht gefunden' });
    }
    await prisma.tool.delete({ where: { id } });
    res.json({ message: 'Werkzeug erfolgreich gelöscht' });
  } catch (error) {
    console.error('Error deleting tool:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Werkzeugs' });
  }
};

export const assignTool = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Benutzer-ID ist erforderlich' });
    }

    const tool = await prisma.tool.findUnique({ where: { id } });
    if (!tool) {
      return res.status(404).json({ error: 'Werkzeug nicht gefunden' });
    }

    // Close any open assignments
    await prisma.toolAssignment.updateMany({
      where: { toolId: id, returnedAt: null },
      data: { returnedAt: new Date() }
    });

    // Create new assignment
    const assignment = await prisma.toolAssignment.create({
      data: { toolId: id, userId, notes: notes || null },
      include: {
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    // Update tool's current assignment
    await prisma.tool.update({
      where: { id },
      data: { assignedToId: userId }
    });

    res.json(assignment);
  } catch (error) {
    console.error('Error assigning tool:', error);
    res.status(500).json({ error: 'Fehler beim Zuweisen des Werkzeugs' });
  }
};

export const returnTool = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const tool = await prisma.tool.findUnique({ where: { id } });
    if (!tool) {
      return res.status(404).json({ error: 'Werkzeug nicht gefunden' });
    }

    // Close open assignments
    await prisma.toolAssignment.updateMany({
      where: { toolId: id, returnedAt: null },
      data: { returnedAt: new Date(), notes: notes || undefined }
    });

    // Clear assignment
    await prisma.tool.update({
      where: { id },
      data: { assignedToId: null }
    });

    res.json({ message: 'Werkzeug erfolgreich zurückgegeben' });
  } catch (error) {
    console.error('Error returning tool:', error);
    res.status(500).json({ error: 'Fehler beim Zurückgeben des Werkzeugs' });
  }
};
