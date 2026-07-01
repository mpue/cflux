import { Request, Response } from 'express';
import * as onboardingService from '../services/onboarding.service';
import { DocumentStatus, OnboardingTaskStatus, ProbationReviewType, ProbationReviewStatus, ProbationDecision } from '@prisma/client';

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

// ==================== PUBLIC JOBS (no auth) ====================

export async function getPublicJobs(req: Request, res: Response) {
  try {
    const jobs = await onboardingService.getOnboardingJobs({ isActive: true });
    res.json(jobs);
  } catch (error: any) {
    console.error('Error fetching public jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs', details: error.message });
  }
}

export async function getPublicJobById(req: Request, res: Response) {
  try {
    const { jobId } = req.params;
    const job = await onboardingService.getOnboardingJobById(jobId);
    if (!job || !job.isActive) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error: any) {
    console.error('Error fetching public job:', error);
    res.status(500).json({ error: 'Failed to fetch job', details: error.message });
  }
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

export async function markAsOnboarded(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const employee = await onboardingService.markAsOnboarded(id);
    res.json(employee);
  } catch (error: any) {
    console.error('Error marking employee as onboarded:', error);
    res.status(500).json({ error: 'Failed to mark as onboarded', details: error.message });
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

// ==================== ONBOARDING WIZARD ====================

export async function startOnboarding(req: Request, res: Response) {
  try {
    const result = await onboardingService.startOnboarding({
      employeeId: req.body.employeeId,
      newEmployee: req.body.newEmployee,
      tutorEmployeeId: req.body.tutorEmployeeId,
      responsibleEmployeeIds: req.body.responsibleEmployeeIds,
      templateIds: req.body.templateIds,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      targetEndDate: req.body.targetEndDate ? new Date(req.body.targetEndDate) : undefined,
      notes: req.body.notes,
    });
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error starting onboarding:', error);
    res.status(400).json({ error: 'Failed to start onboarding', details: error.message });
  }
}

// ==================== PROBEZEIT-/FEEDBACKGESPRÄCHE ====================

export async function getEmployeeProbationReviews(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const reviews = await onboardingService.getEmployeeProbationReviews(id);
    res.json(reviews);
  } catch (error: any) {
    console.error('Error fetching probation reviews:', error);
    res.status(500).json({ error: 'Failed to fetch probation reviews', details: error.message });
  }
}

export async function generateProbationReviews(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const employee = await onboardingService.getEmployeeById(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const startDate = req.body.startDate
      ? new Date(req.body.startDate)
      : employee.startDate;
    if (!startDate) {
      return res.status(400).json({ error: 'Kein Eintrittsdatum vorhanden – Gespräche können nicht geplant werden' });
    }
    const reviews = await onboardingService.generateProbationReviews(id, new Date(startDate));
    res.status(201).json(reviews);
  } catch (error: any) {
    console.error('Error generating probation reviews:', error);
    res.status(500).json({ error: 'Failed to generate probation reviews', details: error.message });
  }
}

export async function createProbationReview(req: Request, res: Response) {
  try {
    const review = await onboardingService.createProbationReview({
      employeeId: req.body.employeeId,
      type: req.body.type as ProbationReviewType | undefined,
      scheduledDate: new Date(req.body.scheduledDate),
    });
    res.status(201).json(review);
  } catch (error: any) {
    console.error('Error creating probation review:', error);
    res.status(500).json({ error: 'Failed to create probation review', details: error.message });
  }
}

export async function updateProbationReview(req: Request, res: Response) {
  try {
    const { reviewId } = req.params;
    const userId = (req as any).user?.id;
    const b = req.body;

    const review = await onboardingService.updateProbationReview(reviewId, {
      status: b.status as ProbationReviewStatus | undefined,
      scheduledDate: b.scheduledDate ? new Date(b.scheduledDate) : undefined,
      conductedDate: b.conductedDate === undefined ? undefined : (b.conductedDate ? new Date(b.conductedDate) : null),
      // Fällt kein Durchführender mit, wird der eingeloggte Nutzer eingetragen,
      // sobald das Gespräch als durchgeführt markiert wird.
      conductedById:
        b.conductedById !== undefined
          ? b.conductedById
          : b.status === ProbationReviewStatus.COMPLETED
          ? userId
          : undefined,
      hrPresent: b.hrPresent,
      ratingPerformance: normalizeOptionalNumber(b.ratingPerformance),
      ratingIntegration: normalizeOptionalNumber(b.ratingIntegration),
      ratingCollaboration: normalizeOptionalNumber(b.ratingCollaboration),
      ratingGoals: normalizeOptionalNumber(b.ratingGoals),
      strengths: b.strengths,
      developmentAreas: b.developmentAreas,
      employeeFeedback: b.employeeFeedback,
      agreements: b.agreements,
      decision: b.decision as ProbationDecision | undefined,
    });
    res.json(review);
  } catch (error: any) {
    console.error('Error updating probation review:', error);
    res.status(500).json({ error: 'Failed to update probation review', details: error.message });
  }
}

export async function deleteProbationReview(req: Request, res: Response) {
  try {
    const { reviewId } = req.params;
    await onboardingService.deleteProbationReview(reviewId);
    res.json({ message: 'Probation review deleted' });
  } catch (error: any) {
    console.error('Error deleting probation review:', error);
    res.status(500).json({ error: 'Failed to delete probation review', details: error.message });
  }
}
