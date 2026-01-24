import { Request, Response } from 'express';
import * as equipmentTrainingService from '../services/equipment-training.service';
import { EquipmentCondition, TrainingStatus } from '@prisma/client';

// ==================== EQUIPMENT ====================

export async function getAllEquipment(req: Request, res: Response) {
  try {
    const { category, isActive } = req.query;
    const filters: any = {};
    if (category) filters.category = category as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const equipment = await equipmentTrainingService.getAllEquipment(filters);
    res.json(equipment);
  } catch (error: any) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment', details: error.message });
  }
}

export async function getEquipmentById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const equipment = await equipmentTrainingService.getEquipmentById(id);

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json(equipment);
  } catch (error: any) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment', details: error.message });
  }
}

export async function createEquipment(req: Request, res: Response) {
  try {
    const equipment = await equipmentTrainingService.createEquipment(req.body);
    res.status(201).json(equipment);
  } catch (error: any) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ error: 'Failed to create equipment', details: error.message });
  }
}

export async function updateEquipment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const equipment = await equipmentTrainingService.updateEquipment(id, req.body);
    res.json(equipment);
  } catch (error: any) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Failed to update equipment', details: error.message });
  }
}

// ==================== EQUIPMENT ASSIGNMENTS ====================

export async function assignEquipment(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const assignment = await equipmentTrainingService.assignEquipment({
      ...req.body,
      assignedById: userId,
    });
    res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Error assigning equipment:', error);
    res.status(500).json({ error: 'Failed to assign equipment', details: error.message });
  }
}

export async function getEmployeeEquipment(req: Request, res: Response) {
  try {
    const { employeeId } = req.params;
    const equipment = await equipmentTrainingService.getEmployeeEquipment(employeeId);
    res.json(equipment);
  } catch (error: any) {
    console.error('Error fetching employee equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment', details: error.message });
  }
}

export async function returnEquipment(req: Request, res: Response) {
  try {
    const { assignmentId } = req.params;
    const assignment = await equipmentTrainingService.returnEquipment(assignmentId, req.body);
    res.json(assignment);
  } catch (error: any) {
    console.error('Error returning equipment:', error);
    res.status(500).json({ error: 'Failed to return equipment', details: error.message });
  }
}

export async function generateHandoverProtocol(req: Request, res: Response) {
  try {
    const { assignmentId } = req.params;
    const filePath = await equipmentTrainingService.generateHandoverProtocol(assignmentId);
    res.json({ filePath, message: 'Handover protocol generated successfully' });
  } catch (error: any) {
    console.error('Error generating handover protocol:', error);
    res.status(500).json({ error: 'Failed to generate protocol', details: error.message });
  }
}

// ==================== TRAINING CATALOG ====================

export async function getAllTrainingCatalog(req: Request, res: Response) {
  try {
    const { type, isActive, isRecurring } = req.query;
    const filters: any = {};
    if (type) filters.type = type as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (isRecurring !== undefined) filters.isRecurring = isRecurring === 'true';

    const catalog = await equipmentTrainingService.getAllTrainingCatalog(filters);
    res.json(catalog);
  } catch (error: any) {
    console.error('Error fetching training catalog:', error);
    res.status(500).json({ error: 'Failed to fetch catalog', details: error.message });
  }
}

export async function getTrainingCatalogById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const catalog = await equipmentTrainingService.getTrainingCatalogById(id);

    if (!catalog) {
      return res.status(404).json({ error: 'Training catalog not found' });
    }

    res.json(catalog);
  } catch (error: any) {
    console.error('Error fetching training catalog:', error);
    res.status(500).json({ error: 'Failed to fetch catalog', details: error.message });
  }
}

export async function createTrainingCatalog(req: Request, res: Response) {
  try {
    const catalog = await equipmentTrainingService.createTrainingCatalog(req.body);
    res.status(201).json(catalog);
  } catch (error: any) {
    console.error('Error creating training catalog:', error);
    res.status(500).json({ error: 'Failed to create catalog', details: error.message });
  }
}

export async function updateTrainingCatalog(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const catalog = await equipmentTrainingService.updateTrainingCatalog(id, req.body);
    res.json(catalog);
  } catch (error: any) {
    console.error('Error updating training catalog:', error);
    res.status(500).json({ error: 'Failed to update catalog', details: error.message });
  }
}

// ==================== TRAINING SESSIONS ====================

export async function createTrainingSession(req: Request, res: Response) {
  try {
    const session = await equipmentTrainingService.createTrainingSession({
      ...req.body,
      scheduledAt: new Date(req.body.scheduledAt),
    });
    res.status(201).json(session);
  } catch (error: any) {
    console.error('Error creating training session:', error);
    res.status(500).json({ error: 'Failed to create session', details: error.message });
  }
}

export async function getAllTrainingSessions(req: Request, res: Response) {
  try {
    const { catalogId, trainerId, status, fromDate, toDate } = req.query;
    const filters: any = {};
    if (catalogId) filters.catalogId = catalogId as string;
    if (trainerId) filters.trainerId = trainerId as string;
    if (status) filters.status = status as TrainingStatus;
    if (fromDate) filters.fromDate = new Date(fromDate as string);
    if (toDate) filters.toDate = new Date(toDate as string);

    const sessions = await equipmentTrainingService.getAllTrainingSessions(filters);
    res.json(sessions);
  } catch (error: any) {
    console.error('Error fetching training sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions', details: error.message });
  }
}

export async function getTrainingSessionById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const session = await equipmentTrainingService.getTrainingSessionById(id);

    if (!session) {
      return res.status(404).json({ error: 'Training session not found' });
    }

    res.json(session);
  } catch (error: any) {
    console.error('Error fetching training session:', error);
    res.status(500).json({ error: 'Failed to fetch session', details: error.message });
  }
}

export async function updateTrainingSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const session = await equipmentTrainingService.updateTrainingSession(id, req.body);
    res.json(session);
  } catch (error: any) {
    console.error('Error updating training session:', error);
    res.status(500).json({ error: 'Failed to update session', details: error.message });
  }
}

// ==================== TRAINING COMPLETIONS ====================

export async function assignEmployeeToTraining(req: Request, res: Response) {
  try {
    const completion = await equipmentTrainingService.assignEmployeeToTraining(req.body);
    res.status(201).json(completion);
  } catch (error: any) {
    console.error('Error assigning employee to training:', error);
    res.status(500).json({ error: 'Failed to assign training', details: error.message });
  }
}

export async function markTrainingCompleted(req: Request, res: Response) {
  try {
    const { completionId } = req.params;
    const completion = await equipmentTrainingService.markTrainingCompleted(completionId, req.body);
    res.json(completion);
  } catch (error: any) {
    console.error('Error marking training completed:', error);
    res.status(500).json({ error: 'Failed to mark completed', details: error.message });
  }
}

export async function getEmployeeTrainings(req: Request, res: Response) {
  try {
    const { employeeId } = req.params;
    const trainings = await equipmentTrainingService.getEmployeeTrainings(employeeId);
    res.json(trainings);
  } catch (error: any) {
    console.error('Error fetching employee trainings:', error);
    res.status(500).json({ error: 'Failed to fetch trainings', details: error.message });
  }
}
