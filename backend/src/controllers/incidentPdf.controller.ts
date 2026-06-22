import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { IncidentPriority, IncidentStatus } from '@prisma/client';
import { checkModulePermission } from '../services/module.service';
import { incidentService } from '../services/incident.service';
import {
  generateIncidentPdfBuffer,
  generateIncidentsSummaryPdfBuffer,
} from '../services/incidentPdf.service';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Bearbeitung',
  RESOLVED: 'Gelöst',
  CLOSED: 'Geschlossen',
};
const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  CRITICAL: 'Kritisch',
};

/**
 * Erzeugt einen hochwertigen Vorfallbericht (PDF) für die Geschäftsleitung.
 */
export const generateIncidentPdf = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const hasReadPermission = await checkModulePermission(userId, 'incidents', 'READ');
    if (!hasReadPermission) {
      res.status(403).json({ error: 'No permission to read incidents' });
      return;
    }

    const { id } = req.params;

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        project: { select: { id: true, name: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        attachments: {
          orderBy: { createdAt: 'asc' },
          include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    const settings = await prisma.systemSettings.findFirst();
    const buffer = await generateIncidentPdfBuffer(incident, settings);

    const safeNumber = (incident.incidentNumber || incident.id).toString().replace(/[^\w.-]/g, '_');
    const filename = `Vorfallbericht_${safeNumber}.pdf`;
    const disposition = req.query.download === 'true' ? 'attachment' : 'inline';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('Error generating incident PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate incident PDF' });
    }
  }
};

/**
 * Erzeugt einen Gesamtbericht (Management-Übersicht über alle Vorfälle)
 * unter Berücksichtigung der gleichen Filter wie der CSV-Export/die Liste.
 */
export const generateIncidentsSummaryPdf = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const hasReadPermission = await checkModulePermission(userId, 'incidents', 'READ');
    if (!hasReadPermission) {
      res.status(403).json({ error: 'No permission to read incidents' });
      return;
    }

    const { status, priority, assignedToId, year, projectId } = req.query;

    const incidents = await incidentService.getAllIncidents(
      status as IncidentStatus,
      priority as IncidentPriority,
      assignedToId as string,
      year ? parseInt(year as string) : undefined,
      projectId as string
    );

    // Menschenlesbares Filter-Label für den Berichtskopf
    const parts: string[] = [];
    if (year) parts.push(`Jahr ${year}`);
    if (status) parts.push(`Status: ${STATUS_LABELS[status as string] || status}`);
    if (priority) parts.push(`Priorität: ${PRIORITY_LABELS[priority as string] || priority}`);
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId as string },
        select: { name: true },
      });
      if (project) parts.push(`Projekt: ${project.name}`);
    }
    const filterLabel = parts.length > 0 ? parts.join(' · ') : 'Alle Vorfälle';

    const settings = await prisma.systemSettings.findFirst();
    const buffer = await generateIncidentsSummaryPdfBuffer(incidents, settings, { filterLabel });

    const filename = `Vorfallbericht_Gesamtuebersicht_${new Date().toISOString().slice(0, 10)}.pdf`;
    const disposition = req.query.download === 'true' ? 'attachment' : 'inline';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('Error generating incidents summary PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate incidents summary PDF' });
    }
  }
};
