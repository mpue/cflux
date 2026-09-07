import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { ReportStatus } from '@prisma/client';
import { AuthRequest } from '../types/auth';
import { prisma } from '../lib/prisma';
import { berichtService, PHOTOS_DIR, ReportWithRelations } from '../services/bericht.service';
import { getAccessibleProjectIds, hasProjectAccess } from '../middleware/projectAccess';
import { renderReportHtml, renderReportPdf, exportFilename } from '../services/berichtExport.service';
import { getEHSReportSection, EHSReportSection } from '../services/ehs.service';
import {
  importWochenberichtArchive,
  ImportFormatError,
} from '../services/berichtImport.service';

/**
 * Laedt einen Bericht und stellt sicher, dass der Benutzer dem zugehoerigen
 * Projekt zugeordnet ist. Antwortet selbst mit 404/403 und liefert dann null.
 */
const loadAccessibleReport = async (
  req: AuthRequest,
  res: Response
): Promise<ReportWithRelations | null> => {
  const report = await berichtService.getReportById(req.params.id);

  if (!report) {
    res.status(404).json({ error: 'Bericht nicht gefunden' });
    return null;
  }

  if (!(await hasProjectAccess(req.user!, report.projectId))) {
    res.status(403).json({
      error: 'Access denied',
      message: 'Sie sind diesem Projekt nicht zugeordnet',
    });
    return null;
  }

  return report;
};

/** Projekte, für die der Benutzer Berichte sehen bzw. anlegen darf. */
export const getMyReportProjects = async (req: AuthRequest, res: Response) => {
  try {
    const allowed = await getAccessibleProjectIds(req.user!);

    const projects = await prisma.project.findMany({
      where: {
        isActive: true,
        ...(allowed === null ? {} : { id: { in: allowed } }),
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(projects);
  } catch (error) {
    console.error('Get report projects error:', error);
    res.status(500).json({ error: 'Projekte konnten nicht geladen werden' });
  }
};

export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const allowedProjectIds = await getAccessibleProjectIds(req.user!);
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;

    const reports = await berichtService.listReports({ allowedProjectIds, projectId });

    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Berichte konnten nicht geladen werden' });
  }
};

export const getReportById = async (req: AuthRequest, res: Response) => {
  try {
    const report = await loadAccessibleReport(req, res);
    if (!report) return;

    res.json(report);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Bericht konnte nicht geladen werden' });
  }
};

export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, weekday, date, titel, ordner, referent, rundgangDurchgefuehrt, weitereTeilnehmer } =
      req.body;

    if (!projectId || !weekday || !date) {
      return res.status(400).json({ error: 'projectId, weekday und date sind erforderlich' });
    }

    // Projektzugriff wird bereits per requireProjectAccess('body') geprueft.
    const report = await berichtService.createReport({
      projectId,
      weekday,
      date,
      titel,
      ordner,
      referent,
      rundgangDurchgefuehrt,
      weitereTeilnehmer,
      createdById: req.user!.id,
    });

    res.status(201).json(report);
  } catch (error: any) {
    console.error('Create report error:', error);
    res.status(500).json({ error: error?.message || 'Bericht konnte nicht angelegt werden' });
  }
};

export const updateReport = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await loadAccessibleReport(req, res);
    if (!existing) return;

    const {
      weekday,
      date,
      titel,
      ordner,
      referent,
      rundgangDurchgefuehrt,
      weitereTeilnehmer,
      status,
      areas,
      findings,
    } = req.body;

    if (status !== undefined && !Object.values(ReportStatus).includes(status)) {
      return res.status(400).json({ error: 'Ungültiger Status' });
    }

    const report = await berichtService.updateReport(existing.id, {
      weekday,
      date,
      titel,
      ordner,
      referent,
      rundgangDurchgefuehrt,
      weitereTeilnehmer,
      status,
      areas,
      findings,
    });

    res.json(report);
  } catch (error: any) {
    console.error('Update report error:', error);
    res.status(500).json({ error: error?.message || 'Bericht konnte nicht gespeichert werden' });
  }
};

export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const report = await loadAccessibleReport(req, res);
    if (!report) return;

    await berichtService.deleteReport(report.id);

    res.json({ message: 'Bericht gelöscht' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Bericht konnte nicht gelöscht werden' });
  }
};

export const uploadPhotos = async (req: AuthRequest, res: Response) => {
  try {
    const report = await loadAccessibleReport(req, res);
    if (!report) return;

    const files = (req.files as Express.Multer.File[]) || [];

    if (files.length === 0) {
      return res.status(400).json({ error: 'Keine Bilddateien hochgeladen' });
    }

    const photos = await berichtService.addPhotos(report.id, files, req.user!.id);

    res.status(201).json(photos);
  } catch (error) {
    console.error('Upload report photos error:', error);
    res.status(500).json({ error: 'Fotos konnten nicht hochgeladen werden' });
  }
};

export const getPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const report = await loadAccessibleReport(req, res);
    if (!report) return;

    const photo = report.photos.find((p) => p.id === req.params.photoId);

    if (!photo) {
      return res.status(404).json({ error: 'Foto nicht gefunden' });
    }

    const filePath = path.join(PHOTOS_DIR, report.id, photo.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Datei nicht gefunden' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Get report photo error:', error);
    res.status(500).json({ error: 'Foto konnte nicht geladen werden' });
  }
};

export const deletePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const report = await loadAccessibleReport(req, res);
    if (!report) return;

    const photo = await berichtService.deletePhoto(report.id, req.params.photoId);

    if (!photo) {
      return res.status(404).json({ error: 'Foto nicht gefunden' });
    }

    res.json({ message: 'Foto gelöscht' });
  } catch (error) {
    console.error('Delete report photo error:', error);
    res.status(500).json({ error: 'Foto konnte nicht gelöscht werden' });
  }
};


/**
 * Optionaler EHS-Anhang am Ende des Berichts. Jahr/Monat/Projekt werden beim
 * Export frei gewaehlt (`?ehsYear=&ehsMonth=&ehsProjectId=`); fehlt ehsMonth,
 * bleibt der Bericht wie bisher ohne Auswertung.
 */
const loadEhsSection = async (
  req: AuthRequest,
  report: ReportWithRelations
): Promise<EHSReportSection | null> => {
  const { ehs, ehsYear, ehsMonth, ehsProjectId } = req.query;

  if (ehs === 'false' || ehs === '0') return null;
  if (!ehsYear && !ehsMonth && !ehs) return null;

  const reportDate = new Date(report.date);
  const year = ehsYear ? parseInt(ehsYear as string, 10) : reportDate.getFullYear();
  const month = ehsMonth ? parseInt(ehsMonth as string, 10) : reportDate.getMonth() + 1;

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  // 'all' = keine Projekteinschraenkung; sonst nur Projekte, die der Benutzer sehen darf.
  let projectId: string | null = null;
  if (ehsProjectId && ehsProjectId !== 'all') {
    if (!(await hasProjectAccess(req.user!, ehsProjectId as string))) {
      return null;
    }
    projectId = ehsProjectId as string;
  }

  return getEHSReportSection({
    year,
    month,
    projectId,
    allowedProjectIds: await getAccessibleProjectIds(req.user!),
  });
};


/**
 * Import eines Datenexports aus dem eigenstaendigen Wochenbericht-Tool.
 * Das Archiv kommt als Multipart-Feld `archive`, das Zielprojekt im Body.
 */
export const importArchive = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Es wurde keine Archivdatei hochgeladen' });
    }

    const result = await importWochenberichtArchive(req.file.path, {
      projectId: req.body.projectId,
      createdById: req.user!.id,
      // Standard: doppelte Berichte auslassen, damit ein zweiter Lauf
      // desselben Archivs nichts verdoppelt.
      skipDuplicates: req.body.skipDuplicates !== 'false',
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof ImportFormatError) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Import report archive error:', error);
    res.status(500).json({
      error: `Import fehlgeschlagen: ${error?.message || 'unbekannter Fehler'}`,
    });
  } finally {
    // Die hochgeladene Datei ist mehrere hundert MB gross — nach dem Import
    // hat sie im Upload-Ordner nichts mehr verloren.
    if (req.file?.path) {
      fs.promises.unlink(req.file.path).catch(() => undefined);
    }
  }
};

export const exportHtml = async (req: AuthRequest, res: Response) => {
  try {
    const report = await loadAccessibleReport(req, res);
    if (!report) return;

    const ehs = await loadEhsSection(req, report);
    const html = renderReportHtml(report, ehs);

    res.setHeader('Content-Disposition', `attachment; filename="${exportFilename(report, 'html')}"`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Export report HTML error:', error);
    res.status(500).json({ error: 'HTML-Export fehlgeschlagen' });
  }
};

export const exportPdf = async (req: AuthRequest, res: Response) => {
  try {
    const report = await loadAccessibleReport(req, res);
    if (!report) return;

    const ehs = await loadEhsSection(req, report);
    const pdf = await renderReportPdf(report, ehs);

    res.setHeader('Content-Disposition', `attachment; filename="${exportFilename(report, 'pdf')}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdf.length);
    res.end(pdf);
  } catch (error: any) {
    console.error('Export report PDF error:', error);
    res.status(500).json({
      error: 'PDF-Erzeugung fehlgeschlagen',
      details: error?.message,
    });
  }
};
