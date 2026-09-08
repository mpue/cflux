import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { ReportStatus } from '@prisma/client';
import { AuthRequest } from '../types/auth';
import { prisma } from '../lib/prisma';
import {
  berichtService,
  berichtFolderService,
  PHOTOS_DIR,
  ReportWithRelations,
} from '../services/bericht.service';
import { getAccessibleProjectIds, hasProjectAccess } from '../middleware/projectAccess';
import {
  renderReportHtml,
  renderReportPdf,
  renderFolderHtml,
  renderHtmlAsPdf,
  exportFilename,
  folderExportFilename,
} from '../services/berichtExport.service';
import {
  importWochenberichtArchive,
  ImportFormatError,
} from '../services/berichtImport.service';
import {
  archiveFilename,
  streamWochenberichtArchive,
  ArchiveFolder,
} from '../services/berichtArchiveExport.service';
import { ensureThumbnails, deleteThumbnail } from '../services/reportPhotoThumbs.service';
import {
  getBerichtDashboard,
  getReportEhsSection,
  ReportEhsSection,
} from '../services/berichtEhs.service';

/** Beschriftung der Pyramide beim Einzelbericht. */
const reportLabel = (report: ReportWithRelations): string =>
  `${report.weekday}, ${new Date(report.date).toLocaleDateString('de-CH')}`;

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
    const { projectId, weekday, date, titel, folderId, referent, rundgangDurchgefuehrt, weitereTeilnehmer } =
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
      folderId,
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
      folderId,
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
      folderId,
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

    // Gleich beim Hochladen verkleinern, damit der Export spaeter nicht wartet.
    await ensureThumbnails([{ id: report.id, photos }]);

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

    deleteThumbnail(report.id, photo.filename);
    res.json({ message: 'Foto gelöscht' });
  } catch (error) {
    console.error('Delete report photo error:', error);
    res.status(500).json({ error: 'Foto konnte nicht gelöscht werden' });
  }
};


/**
 * Optionaler EHS-Anhang am Ende des Berichts.
 *
 * Die Pyramide zaehlt die Klassifizierungen der Feststellungen, die im
 * Dokument stehen — beim Einzelbericht dessen eigene, beim Gesamt-Wochenbericht
 * die der ganzen Woche. Jahr/Monat/Projekt aus der Anfrage
 * (`?ehsYear=&ehsMonth=&ehsProjectId=`) steuern die Jahresuebersicht und die
 * Kennzahlen; fehlt ehsMonth, bleibt der Bericht ohne Auswertung.
 */
const loadEhsSection = async (
  req: AuthRequest,
  reports: ReportWithRelations[],
  pyramidScope: string
): Promise<ReportEhsSection | null> => {
  const { ehs, ehsYear, ehsMonth, ehsProjectId } = req.query;

  if (ehs === 'false' || ehs === '0') return null;
  if (!ehsYear && !ehsMonth && !ehs) return null;
  if (!reports.length) return null;

  const reportDate = new Date(reports[0].date);
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

  return getReportEhsSection({
    reports,
    year,
    month,
    projectId,
    pyramidScope,
    allowedProjectIds: await getAccessibleProjectIds(req.user!),
  });
};


/**
 * Kennzahlen, Pyramide und Jahresuebersicht der Rundgangsberichte als eigene
 * Auswertung — dieselbe Datenquelle wie der EHS-Anhang im Export, nur ueber
 * ein ganzes Jahr statt ueber ein einzelnes Dokument.
 */
export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const { year, projectId: requestedProjectId } = req.query;

    const parsedYear = year ? parseInt(year as string, 10) : new Date().getFullYear();
    if (!Number.isFinite(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      return res.status(400).json({ error: 'Ungültiges Jahr' });
    }

    // 'all' (oder nichts) = alle Projekte, die der Benutzer sehen darf.
    let projectId: string | null = null;
    if (requestedProjectId && requestedProjectId !== 'all') {
      if (!(await hasProjectAccess(req.user!, requestedProjectId as string))) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Sie sind diesem Projekt nicht zugeordnet',
        });
      }
      projectId = requestedProjectId as string;
    }

    const dashboard = await getBerichtDashboard({
      year: parsedYear,
      projectId,
      allowedProjectIds: await getAccessibleProjectIds(req.user!),
    });

    res.json(dashboard);
  } catch (error) {
    console.error('Get bericht dashboard error:', error);
    res.status(500).json({ error: 'Auswertung konnte nicht geladen werden' });
  }
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


// ============================================================
// Ordner — klammern die Tagesblaetter einer Woche zusammen
// ============================================================

/**
 * Laedt einen Ordner und stellt sicher, dass der Benutzer dem Projekt
 * zugeordnet ist. Antwortet selbst mit 404/403 und liefert dann null.
 */
const loadAccessibleFolder = async (req: AuthRequest, res: Response) => {
  const folder = await berichtFolderService.getById(req.params.id);

  if (!folder) {
    res.status(404).json({ error: 'Ordner nicht gefunden' });
    return null;
  }

  if (!(await hasProjectAccess(req.user!, folder.projectId))) {
    res.status(403).json({
      error: 'Access denied',
      message: 'Sie sind diesem Projekt nicht zugeordnet',
    });
    return null;
  }

  return folder;
};

export const getFolders = async (req: AuthRequest, res: Response) => {
  try {
    const allowed = await getAccessibleProjectIds(req.user!);
    res.json(await berichtFolderService.list(allowed, req.query.projectId as string | undefined));
  } catch (error) {
    console.error('Get report folders error:', error);
    res.status(500).json({ error: 'Ordner konnten nicht geladen werden' });
  }
};

export const createFolder = async (req: AuthRequest, res: Response) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Name ist erforderlich' });
    }

    res.status(201).json(await berichtFolderService.create(req.body.projectId, name));
  } catch (error: any) {
    // Der Unique-Index auf (projectId, name) haelt Doppelungen ab.
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'In diesem Projekt gibt es den Ordner bereits' });
    }
    console.error('Create report folder error:', error);
    res.status(500).json({ error: 'Ordner konnte nicht angelegt werden' });
  }
};

export const renameFolder = async (req: AuthRequest, res: Response) => {
  try {
    const folder = await loadAccessibleFolder(req, res);
    if (!folder) return;

    const name = (req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Name ist erforderlich' });
    }

    res.json(await berichtFolderService.rename(folder.id, name));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'In diesem Projekt gibt es den Ordner bereits' });
    }
    console.error('Rename report folder error:', error);
    res.status(500).json({ error: 'Ordner konnte nicht umbenannt werden' });
  }
};

/** Loeschen laesst die Berichte stehen — sie landen wieder in "Ohne Ordner". */
export const deleteFolder = async (req: AuthRequest, res: Response) => {
  try {
    const folder = await loadAccessibleFolder(req, res);
    if (!folder) return;

    await berichtFolderService.remove(folder.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete report folder error:', error);
    res.status(500).json({ error: 'Ordner konnte nicht gelöscht werden' });
  }
};

/**
 * Gesamt-Wochenbericht: Deckblatt mit Kennzahlen, danach jedes Tagesblatt.
 * `format` ist 'html' oder 'pdf'.
 */
const exportFolder = async (req: AuthRequest, res: Response, format: 'html' | 'pdf') => {
  const folder = await loadAccessibleFolder(req, res);
  if (!folder) return;

  const reports = await berichtFolderService.getReports(folder.id);

  if (!reports.length) {
    return res.status(400).json({ error: 'Der Ordner enthält keine Berichte' });
  }

  // Ohne das waere ein Gesamt-Wochenbericht mit hundert Originalfotos
  // dreistellig viele Megabyte gross.
  await ensureThumbnails(reports);

  const ehs = await loadEhsSection(req, reports, folder.name);
  const html = renderFolderHtml(folder, reports, ehs);
  const filename = folderExportFilename(folder.name, format);

  if (format === 'html') {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }

  const pdf = await renderHtmlAsPdf(html);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', pdf.length);
  res.end(pdf);
};

/**
 * Datenexport im Austauschformat `wochenbericht-export` — dasselbe ZIP, das
 * der Import wieder einliest. Anders als PDF/HTML enthaelt es die
 * Originalfotos und alle Felder, damit ein Bericht verlustfrei in eine andere
 * Instanz wandern kann.
 *
 * Wird gestreamt: bei ueber 200 Originalfotos hielte ein Puffer sonst
 * mehrere hundert Megabyte.
 */
const sendArchive = async (
  res: Response,
  reports: ReportWithRelations[],
  folders: ArchiveFolder[],
  label: string
) => {
  res.setHeader('Content-Disposition', `attachment; filename="${archiveFilename(label)}"`);
  res.setHeader('Content-Type', 'application/zip');

  const { missingPhotos } = await streamWochenberichtArchive(res, reports, folders);

  // Der Header ist zu diesem Zeitpunkt raus, eine Fehlerantwort geht nicht
  // mehr — deshalb nur ins Log, das Archiv selbst bleibt gueltig.
  if (missingPhotos.length) {
    console.warn(
      `Datenexport ${label}: ${missingPhotos.length} Foto(s) fehlen auf der Platte`,
      missingPhotos.slice(0, 10)
    );
  }
};

/** Datenexport eines ganzen Ordners (Wochenbericht). */
export const exportFolderArchive = async (req: AuthRequest, res: Response) => {
  try {
    const folder = await loadAccessibleFolder(req, res);
    if (!folder) return;

    const reports = await berichtFolderService.getReports(folder.id);

    if (!reports.length) {
      return res.status(400).json({ error: 'Der Ordner enthält keine Berichte' });
    }

    await sendArchive(res, reports, [{ id: folder.id, name: folder.name }], folder.name);
  } catch (error: any) {
    console.error('Export folder archive error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Datenexport fehlgeschlagen', details: error?.message });
    } else {
      res.destroy();
    }
  }
};

/** Datenexport eines einzelnen Tagesblatts. */
export const exportArchive = async (req: AuthRequest, res: Response) => {
  try {
    const report = await loadAccessibleReport(req, res);
    if (!report) return;

    // Den Ordner mitgeben, damit die Zuordnung den Import ueberlebt.
    const folders = report.folder ? [{ id: report.folder.id, name: report.folder.name }] : [];

    await sendArchive(res, [report], folders, reportLabel(report));
  } catch (error: any) {
    console.error('Export report archive error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Datenexport fehlgeschlagen', details: error?.message });
    } else {
      res.destroy();
    }
  }
};

export const exportFolderHtml = async (req: AuthRequest, res: Response) => {
  try {
    await exportFolder(req, res, 'html');
  } catch (error) {
    console.error('Export folder HTML error:', error);
    res.status(500).json({ error: 'HTML-Export fehlgeschlagen' });
  }
};

export const exportFolderPdf = async (req: AuthRequest, res: Response) => {
  try {
    await exportFolder(req, res, 'pdf');
  } catch (error: any) {
    console.error('Export folder PDF error:', error);
    res.status(500).json({ error: 'PDF-Erzeugung fehlgeschlagen', details: error?.message });
  }
};

export const exportHtml = async (req: AuthRequest, res: Response) => {
  try {
    const report = await loadAccessibleReport(req, res);
    if (!report) return;

    // Verkleinerungen vorab erzeugen — der Renderer ist synchron.
    await ensureThumbnails([report]);

    const ehs = await loadEhsSection(req, [report], reportLabel(report));
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

    await ensureThumbnails([report]);

    const ehs = await loadEhsSection(req, [report], reportLabel(report));
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
