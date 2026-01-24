import { Request, Response } from 'express';
import * as applicantService from '../services/applicant.service';
import { ApplicantStatus, InterviewType, OnboardingDocumentType } from '@prisma/client';

// ==================== APPLICANTS ====================

export async function registerApplicant(req: Request, res: Response) {
  try {
    const applicant = await applicantService.registerApplicant(req.body);
    res.status(201).json(applicant);
  } catch (error: any) {
    console.error('Error registering applicant:', error);
    res.status(500).json({ error: 'Failed to register applicant', details: error.message });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const applicant = await applicantService.verifyApplicantEmail(token);
    res.json({ message: 'Email erfolgreich verifiziert', applicant });
  } catch (error: any) {
    console.error('Error verifying email:', error);
    res.status(400).json({ error: 'Email verification failed', details: error.message });
  }
}

export async function getAllApplicants(req: Request, res: Response) {
  try {
    const { status, position } = req.query;
    const filters: any = {};
    if (status) filters.status = status as ApplicantStatus;
    if (position) filters.position = position as string;

    const applicants = await applicantService.getAllApplicants(filters);
    res.json(applicants);
  } catch (error: any) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ error: 'Failed to fetch applicants', details: error.message });
  }
}

export async function getApplicantById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const applicant = await applicantService.getApplicantById(id);

    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    res.json(applicant);
  } catch (error: any) {
    console.error('Error fetching applicant:', error);
    res.status(500).json({ error: 'Failed to fetch applicant', details: error.message });
  }
}

export async function updateApplicantStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const applicant = await applicantService.updateApplicantStatus(id, status);
    res.json(applicant);
  } catch (error: any) {
    console.error('Error updating applicant status:', error);
    res.status(500).json({ error: 'Failed to update status', details: error.message });
  }
}

// ==================== DOCUMENTS ====================

export async function uploadDocument(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { applicantId, documentType } = req.body;

    const document = await applicantService.uploadApplicantDocument({
      applicantId,
      documentType,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    res.status(201).json(document);
  } catch (error: any) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document', details: error.message });
  }
}

export async function getApplicantDocuments(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const documents = await applicantService.getApplicantDocuments(id);
    res.json(documents);
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents', details: error.message });
  }
}

export async function deleteDocument(req: Request, res: Response) {
  try {
    const { documentId } = req.params;
    await applicantService.deleteApplicantDocument(documentId);
    res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document', details: error.message });
  }
}

export async function checkRequiredDocuments(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await applicantService.checkRequiredDocuments(id);
    res.json(result);
  } catch (error: any) {
    console.error('Error checking documents:', error);
    res.status(500).json({ error: 'Failed to check documents', details: error.message });
  }
}

// ==================== INTERVIEWS ====================

export async function scheduleInterview(req: Request, res: Response) {
  try {
    const interview = await applicantService.scheduleInterview({
      ...req.body,
      scheduledAt: new Date(req.body.scheduledAt),
    });
    res.status(201).json(interview);
  } catch (error: any) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ error: 'Failed to schedule interview', details: error.message });
  }
}

export async function getApplicantInterviews(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const interviews = await applicantService.getApplicantInterviews(id);
    res.json(interviews);
  } catch (error: any) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ error: 'Failed to fetch interviews', details: error.message });
  }
}

export async function updateInterview(req: Request, res: Response) {
  try {
    const { interviewId } = req.params;
    const interview = await applicantService.updateInterview(interviewId, req.body);
    res.json(interview);
  } catch (error: any) {
    console.error('Error updating interview:', error);
    res.status(500).json({ error: 'Failed to update interview', details: error.message });
  }
}

// ==================== NOTES ====================

export async function addNote(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const note = await applicantService.addApplicantNote({
      applicantId: id,
      authorId: userId,
      content: req.body.content,
      isInternal: req.body.isInternal,
    });

    res.status(201).json(note);
  } catch (error: any) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note', details: error.message });
  }
}

export async function getApplicantNotes(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const includeInternal = req.query.includeInternal === 'true';
    const notes = await applicantService.getApplicantNotes(id, includeInternal);
    res.json(notes);
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes', details: error.message });
  }
}

export async function deleteNote(req: Request, res: Response) {
  try {
    const { noteId } = req.params;
    await applicantService.deleteApplicantNote(noteId);
    res.json({ message: 'Note deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note', details: error.message });
  }
}
