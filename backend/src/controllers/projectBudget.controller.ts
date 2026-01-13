import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Typdefinition für AuthRequest
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// GET /api/project-budgets - Alle Projekt-Budgets abrufen
export const getAllProjectBudgets = async (req: AuthRequest, res: Response) => {
  try {
    const budgets = await prisma.projectBudget.findMany({
      where: { isActive: true },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            customerId: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        costCenter: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          where: { isActive: true },
          include: {
            inventoryItem: {
              include: {
                article: {
                  select: {
                    id: true,
                    name: true,
                    articleNumber: true,
                  },
                },
              },
            },
            costCenter: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(budgets);
  } catch (error) {
    console.error('Fehler beim Abrufen der Projekt-Budgets:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Projekt-Budgets' });
  }
};

// GET /api/project-budgets/:id - Einzelnes Projekt-Budget abrufen
export const getProjectBudgetById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const budget = await prisma.projectBudget.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            customer: true,
          },
        },
        costCenter: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          where: { isActive: true },
          include: {
            inventoryItem: {
              include: {
                article: true,
              },
            },
            costCenter: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!budget) {
      return res.status(404).json({ error: 'Projekt-Budget nicht gefunden' });
    }

    res.json(budget);
  } catch (error) {
    console.error('Fehler beim Abrufen des Projekt-Budgets:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Projekt-Budgets' });
  }
};

// GET /api/project-budgets/project/:projectId - Budget für Projekt abrufen
export const getProjectBudgetByProjectId = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    const budget = await prisma.projectBudget.findUnique({
      where: { projectId },
      include: {
        project: true,
        costCenter: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          where: { isActive: true },
          include: {
            inventoryItem: {
              include: {
                article: true,
              },
            },
            costCenter: true,
          },
        },
      },
    });

    if (!budget) {
      return res.status(404).json({ error: 'Kein Budget für dieses Projekt gefunden' });
    }

    res.json(budget);
  } catch (error) {
    console.error('Fehler beim Abrufen des Projekt-Budgets:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Projekt-Budgets' });
  }
};

// POST /api/project-budgets - Neues Projekt-Budget erstellen
export const createProjectBudget = async (req: AuthRequest, res: Response) => {
  try {
    const {
      projectId,
      costCenterId,
      budgetName,
      totalBudget,
      fiscalYear,
      startDate,
      endDate,
      notes,
    } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // Prüfen ob Projekt existiert
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Projekt nicht gefunden' });
    }

    // Prüfen ob bereits Budget existiert
    const existingBudget = await prisma.projectBudget.findUnique({
      where: { projectId },
    });

    if (existingBudget) {
      return res.status(400).json({ error: 'Für dieses Projekt existiert bereits ein Budget' });
    }

    const budget = await prisma.projectBudget.create({
      data: {
        projectId,
        costCenterId,
        budgetName,
        totalBudget: parseFloat(totalBudget),
        fiscalYear: parseInt(fiscalYear),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        remainingBudget: parseFloat(totalBudget),
        notes,
        createdById: req.user.id,
      },
      include: {
        project: true,
        costCenter: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: true,
      },
    });

    res.status(201).json(budget);
  } catch (error) {
    console.error('Fehler beim Erstellen des Projekt-Budgets:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Projekt-Budgets' });
  }
};

// PUT /api/project-budgets/:id - Projekt-Budget aktualisieren
export const updateProjectBudget = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      costCenterId,
      budgetName,
      totalBudget,
      fiscalYear,
      startDate,
      endDate,
      status,
      notes,
      isActive,
    } = req.body;

    const existingBudget = await prisma.projectBudget.findUnique({
      where: { id },
    });

    if (!existingBudget) {
      return res.status(404).json({ error: 'Projekt-Budget nicht gefunden' });
    }

    const updatedBudget = await prisma.projectBudget.update({
      where: { id },
      data: {
        ...(costCenterId !== undefined && { costCenterId }),
        ...(budgetName && { budgetName }),
        ...(totalBudget !== undefined && { totalBudget: parseFloat(totalBudget) }),
        ...(fiscalYear !== undefined && { fiscalYear: parseInt(fiscalYear) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        project: true,
        costCenter: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          where: { isActive: true },
          include: {
            inventoryItem: {
              include: {
                article: true,
              },
            },
            costCenter: true,
          },
        },
      },
    });

    res.json(updatedBudget);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Projekt-Budgets:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Projekt-Budgets' });
  }
};

// POST /api/project-budgets/:id/recalculate - Budget neu berechnen
export const recalculateBudget = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const budget = await prisma.projectBudget.findUnique({
      where: { id },
      include: {
        items: {
          where: { isActive: true },
        },
      },
    });

    if (!budget) {
      return res.status(404).json({ error: 'Projekt-Budget nicht gefunden' });
    }

    // Summen berechnen
    const plannedCosts = budget.items.reduce((sum, item) => sum + item.plannedCost, 0);
    const actualCosts = budget.items.reduce((sum, item) => sum + item.actualCost, 0);
    const remainingBudget = budget.totalBudget - actualCosts;
    const budgetUtilization = budget.totalBudget > 0 ? (actualCosts / budget.totalBudget) * 100 : 0;

    // Status aktualisieren
    let status = budget.status;
    if (actualCosts > budget.totalBudget) {
      status = 'EXCEEDED';
    } else if (actualCosts > 0) {
      status = 'ACTIVE';
    }

    const updatedBudget = await prisma.projectBudget.update({
      where: { id },
      data: {
        plannedCosts,
        actualCosts,
        remainingBudget,
        budgetUtilization,
        status,
      },
      include: {
        project: true,
        costCenter: true,
        items: {
          where: { isActive: true },
          include: {
            inventoryItem: {
              include: {
                article: true,
              },
            },
          },
        },
      },
    });

    res.json(updatedBudget);
  } catch (error) {
    console.error('Fehler beim Neuberechnen des Budgets:', error);
    res.status(500).json({ error: 'Fehler beim Neuberechnen des Budgets' });
  }
};

// DELETE /api/project-budgets/:id - Projekt-Budget löschen (soft delete)
export const deleteProjectBudget = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const budget = await prisma.projectBudget.findUnique({
      where: { id },
    });

    if (!budget) {
      return res.status(404).json({ error: 'Projekt-Budget nicht gefunden' });
    }

    await prisma.projectBudget.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Projekt-Budget erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Projekt-Budgets:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Projekt-Budgets' });
  }
};

// ============================================
// Budget Items (Positionen)
// ============================================

// POST /api/project-budgets/:id/items - Budget-Position hinzufügen
export const addBudgetItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      category,
      itemName,
      description,
      inventoryItemId,
      costCenterId,
      plannedQuantity,
      unitPrice,
      plannedHours,
      hourlyRate,
      notes,
    } = req.body;

    const budget = await prisma.projectBudget.findUnique({
      where: { id },
    });

    if (!budget) {
      return res.status(404).json({ error: 'Projekt-Budget nicht gefunden' });
    }

    const plannedCost = category === 'LABOR'
      ? (plannedHours || 0) * (hourlyRate || 0)
      : (plannedQuantity || 0) * (unitPrice || 0);

    const item = await prisma.projectBudgetItem.create({
      data: {
        budgetId: id,
        category,
        itemName,
        description,
        inventoryItemId,
        costCenterId,
        plannedQuantity: parseFloat(plannedQuantity || 0),
        unitPrice: parseFloat(unitPrice || 0),
        plannedCost,
        plannedHours: plannedHours ? parseFloat(plannedHours) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        notes,
      },
      include: {
        inventoryItem: {
          include: {
            article: true,
          },
        },
        costCenter: true,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Budget-Position:', error);
    res.status(500).json({ error: 'Fehler beim Hinzufügen der Budget-Position' });
  }
};

// PUT /api/project-budgets/items/:itemId - Budget-Position aktualisieren
export const updateBudgetItem = async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const {
      category,
      itemName,
      description,
      inventoryItemId,
      costCenterId,
      plannedQuantity,
      actualQuantity,
      unitPrice,
      plannedHours,
      actualHours,
      hourlyRate,
      status,
      notes,
      isActive,
    } = req.body;

    const existingItem = await prisma.projectBudgetItem.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return res.status(404).json({ error: 'Budget-Position nicht gefunden' });
    }

    // Kosten berechnen
    let plannedCost = existingItem.plannedCost;
    let actualCost = existingItem.actualCost;

    if (category === 'LABOR') {
      if (plannedHours !== undefined && hourlyRate !== undefined) {
        plannedCost = parseFloat(plannedHours) * parseFloat(hourlyRate);
      }
      if (actualHours !== undefined && hourlyRate !== undefined) {
        actualCost = parseFloat(actualHours) * parseFloat(hourlyRate);
      }
    } else {
      if (plannedQuantity !== undefined && unitPrice !== undefined) {
        plannedCost = parseFloat(plannedQuantity) * parseFloat(unitPrice);
      }
      if (actualQuantity !== undefined && unitPrice !== undefined) {
        actualCost = parseFloat(actualQuantity) * parseFloat(unitPrice);
      }
    }

    const variance = actualCost - plannedCost;
    const variancePercent = plannedCost > 0 ? (variance / plannedCost) * 100 : 0;

    const updatedItem = await prisma.projectBudgetItem.update({
      where: { id: itemId },
      data: {
        ...(category && { category }),
        ...(itemName && { itemName }),
        ...(description !== undefined && { description }),
        ...(inventoryItemId !== undefined && { inventoryItemId }),
        ...(costCenterId !== undefined && { costCenterId }),
        ...(plannedQuantity !== undefined && { plannedQuantity: parseFloat(plannedQuantity) }),
        ...(actualQuantity !== undefined && { actualQuantity: parseFloat(actualQuantity) }),
        ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) }),
        ...(plannedHours !== undefined && { plannedHours: parseFloat(plannedHours) }),
        ...(actualHours !== undefined && { actualHours: parseFloat(actualHours) }),
        ...(hourlyRate !== undefined && { hourlyRate: parseFloat(hourlyRate) }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
        plannedCost,
        actualCost,
        variance,
        variancePercent,
      },
      include: {
        inventoryItem: {
          include: {
            article: true,
          },
        },
        costCenter: true,
      },
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Budget-Position:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Budget-Position' });
  }
};

// DELETE /api/project-budgets/items/:itemId - Budget-Position löschen
export const deleteBudgetItem = async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;

    const item = await prisma.projectBudgetItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Budget-Position nicht gefunden' });
    }

    await prisma.projectBudgetItem.update({
      where: { id: itemId },
      data: { isActive: false },
    });

    res.json({ message: 'Budget-Position erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Budget-Position:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Budget-Position' });
  }
};

// GET /api/project-budgets/:id/time-entries - Zeiteinträge für Budget abrufen
export const getBudgetTimeEntries = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const budget = await prisma.projectBudget.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!budget) {
      return res.status(404).json({ error: 'Projekt-Budget nicht gefunden' });
    }

    // Zeiteinträge des Projekts abrufen
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        projectId: budget.projectId,
        status: 'CLOCKED_OUT',
        clockIn: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        costCenter: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: { clockIn: 'desc' },
    });

    // Stunden berechnen
    const timeEntriesWithHours = timeEntries.map((entry) => {
      const hours = entry.clockOut
        ? (new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) / (1000 * 60 * 60) - (entry.pauseMinutes || 0) / 60
        : 0;
      return {
        ...entry,
        hours: parseFloat(hours.toFixed(2)),
      };
    });

    const totalHours = timeEntriesWithHours.reduce((sum, entry) => sum + entry.hours, 0);

    res.json({
      timeEntries: timeEntriesWithHours,
      totalHours: parseFloat(totalHours.toFixed(2)),
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Zeiteinträge:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Zeiteinträge' });
  }
};
