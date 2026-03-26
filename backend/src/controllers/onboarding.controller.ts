import { Request, Response } from 'express';
import * as onboardingService from '../services/onboarding.service';
import { DocumentStatus, OnboardingTaskStatus } from '@prisma/client';

function normalizeOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function normalizeJobPayload(body: any) {
  return {
    title: body.title,
    description: body.description,
    department: body.department,
    employmentType: body.employmentType,
    location: body.location,
    workload: body.workload,
    requirements: body.requirements,
    responsibilities: body.responsibilities,
    benefits: body.benefits,
    salaryMin: normalizeOptionalNumber(body.salaryMin),
    salaryMax: normalizeOptionalNumber(body.salaryMax),
    salaryCurrency: body.salaryCurrency,
    isActive: body.isActive,
    sortOrder: normalizeOptionalNumber(body.sortOrder),
  };
}

// ==================== ONBOARDING JOBS ====================

export async function getOnboardingJobs(req: Request, res: Response) {
  try {
    const { isActive } = req.query;
    const jobs = await onboardingService.getOnboardingJobs({
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    res.json(jobs);
  } catch (error: any) {
    console.error('Error fetching onboarding jobs:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding jobs', details: error.message });
  }
}

export async function getOnboardingJobById(req: Request, res: Response) {
  try {
    const { jobId } = req.params;
    const job = await onboardingService.getOnboardingJobById(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Onboarding job not found' });
    }

    res.json(job);
  } catch (error: any) {
    console.error('Error fetching onboarding job:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding job', details: error.message });
  }
}

export async function createOnboardingJob(req: Request, res: Response) {
  try {
    const job = await onboardingService.createOnboardingJob(normalizeJobPayload(req.body));
    res.status(201).json(job);
  } catch (error: any) {
    console.error('Error creating onboarding job:', error);
    res.status(500).json({ error: 'Failed to create onboarding job', details: error.message });
  }
}

export async function updateOnboardingJob(req: Request, res: Response) {
  try {
    const { jobId } = req.params;
    const job = await onboardingService.updateOnboardingJob(jobId, normalizeJobPayload(req.body));
    res.json(job);
  } catch (error: any) {
    console.error('Error updating onboarding job:', error);
    res.status(500).json({ error: 'Failed to update onboarding job', details: error.message });
  }
}

export async function deleteOnboardingJob(req: Request, res: Response) {
  try {
    const { jobId } = req.params;
    await onboardingService.deleteOnboardingJob(jobId);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting onboarding job:', error);
    res.status(500).json({ error: 'Failed to delete onboarding job', details: error.message });
  }
}

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
