import { Request, Response } from 'express';
import * as onboardingService from '../services/onboarding.service';
import { DocumentStatus, OnboardingTaskStatus } from '@prisma/client';

// ==================== EMPLOYEES ====================

export async function hireApplicant(req: Request, res: Response) {
  try {
    const employee = await onboardingService.hireApplicant({
      ...req.body,
      startDate: new Date(req.body.startDate),
      probationEndDate: req.body.probationEndDate ? new Date(req.body.probationEndDate) : undefined,
    });
    res.status(201).json(employee);
  } catch (error: any) {
    console.error('Error hiring applicant:', error);
    res.status(500).json({ error: 'Failed to hire applicant', details: error.message });
  }
}

export async function getAllEmployees(req: Request, res: Response) {
  try {
    const { department, isActive } = req.query;
    const filters: any = {};
    if (department) filters.department = department as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const employees = await onboardingService.getAllEmployees(filters);
    res.json(employees);
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees', details: error.message });
  }
}

export async function getEmployeeById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const employee = await onboardingService.getEmployeeById(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error: any) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee', details: error.message });
  }
}

export async function updateEmployee(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const employee = await onboardingService.updateEmployee(id, req.body);
    res.json(employee);
  } catch (error: any) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee', details: error.message });
  }
}

// ==================== EMPLOYEE DOCUMENTS ====================

export async function uploadEmployeeDocument(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = (req as any).user.id;
    const { employeeId, documentType } = req.body;

    const document = await onboardingService.uploadEmployeeDocument({
      employeeId,
      documentType,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedById: userId,
    });

    res.status(201).json(document);
  } catch (error: any) {
    console.error('Error uploading employee document:', error);
    res.status(500).json({ error: 'Failed to upload document', details: error.message });
  }
}

export async function getEmployeeDocuments(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const documents = await onboardingService.getEmployeeDocuments(id);
    res.json(documents);
  } catch (error: any) {
    console.error('Error fetching employee documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents', details: error.message });
  }
}

export async function updateDocumentStatus(req: Request, res: Response) {
  try {
    const { documentId } = req.params;
    const { status } = req.body;

    const document = await onboardingService.updateDocumentStatus(documentId, status as DocumentStatus);
    res.json(document);
  } catch (error: any) {
    console.error('Error updating document status:', error);
    res.status(500).json({ error: 'Failed to update document status', details: error.message });
  }
}

// ==================== ONBOARDING TASKS ====================

export async function createTask(req: Request, res: Response) {
  try {
    const task = await onboardingService.createOnboardingTask({
      ...req.body,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
    });
    res.status(201).json(task);
  } catch (error: any) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task', details: error.message });
  }
}

export async function getEmployeeTasks(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tasks = await onboardingService.getEmployeeTasks(id);
    res.json(tasks);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
  }
}

export async function updateTaskStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await onboardingService.updateTaskStatus(
      taskId,
      status as OnboardingTaskStatus,
      status === OnboardingTaskStatus.COMPLETED ? userId : undefined
    );
    res.json(task);
  } catch (error: any) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status', details: error.message });
  }
}

export async function assignTask(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const { assignedToId } = req.body;

    const task = await onboardingService.assignTask(taskId, assignedToId);
    res.json(task);
  } catch (error: any) {
    console.error('Error assigning task:', error);
    res.status(500).json({ error: 'Failed to assign task', details: error.message });
  }
}

export async function getOverdueTasks(req: Request, res: Response) {
  try {
    const tasks = await onboardingService.getOverdueTasks();
    res.json(tasks);
  } catch (error: any) {
    console.error('Error fetching overdue tasks:', error);
    res.status(500).json({ error: 'Failed to fetch overdue tasks', details: error.message });
  }
}

// ==================== ONBOARDING PROGRESS ====================

export async function getOnboardingProgress(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const progress = await onboardingService.getOnboardingProgress(id);
    res.json(progress);
  } catch (error: any) {
    console.error('Error fetching onboarding progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress', details: error.message });
  }
}

export async function getOnboardingDashboard(req: Request, res: Response) {
  try {
    const dashboard = await onboardingService.getOnboardingDashboard();
    res.json(dashboard);
  } catch (error: any) {
    console.error('Error fetching onboarding dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard', details: error.message });
  }
}
