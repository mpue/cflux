import fs from 'fs';
import path from 'path';
import { Prisma, ReportStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

/**
 * Berichte (Toolbox-Rundgang / Tagesprotokoll).
 *
 * Fachlich uebernommen aus dem eigenstaendigen Wochenbericht-Tool, hier aber
 * an ein Projekt gebunden. Die Zugriffspruefung passiert in den Routen
 * (requireModuleAccess + requireProjectAccess bzw. getAccessibleProjectIds).
 */

export const PHOTOS_DIR = path.join(__dirname, '../../uploads/report-photos');

if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

/** Standard-Bereiche, die beim Anlegen eines Berichts vorbelegt werden. */
export const BEREICHE_TEMPLATE = [
  'Arbeiten in der Höhe',
  'Heben von Lasten / Kran',
  'Arbeitssicherheit allgemein',
  'PPE / PSA',
  'Ordnung und Sauberkeit',
  'Absturzstellen',
  'Alarmierung / Notfall',
  'Elektrosicherheit',
  'Lärmbelästigung',
  'Altlasten',
  'Grundwasser',
  'Brandschutz',
  'Verkehrswege / Fussgänger',
  'Schneid-/Baggerarbeiten (pSIF-Fokus)',
];

const reportInclude = {
  project: {
    select: {
      id: true,
      name: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
    },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true },
  },
  areas: { orderBy: { sortOrder: 'asc' } },
  findings: { orderBy: { position: 'asc' } },
  photos: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.ReportInclude;

const toDate = (value: unknown): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
};

export interface ReportFilter {
  /** `null` = keine Einschraenkung (Admin) */
  allowedProjectIds: string[] | null;
  projectId?: string;
}

export const berichtService = {
  /** Listenansicht: nur Kopfdaten, gefiltert auf die erlaubten Projekte. */
  listReports: async (filter: ReportFilter) => {
    const where: Prisma.ReportWhereInput = {};

    if (filter.allowedProjectIds !== null) {
      where.projectId = { in: filter.allowedProjectIds };
    }

    if (filter.projectId) {
      // Kombiniert mit der Einschraenkung oben: ein nicht erlaubtes Projekt
      // liefert schlicht eine leere Liste.
      where.AND = [{ projectId: filter.projectId }];
    }

    return prisma.report.findMany({
      where,
      select: {
        id: true,
        projectId: true,
        weekday: true,
        date: true,
        referent: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { findings: true, photos: true } },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  },

  getReportById: async (id: string) => {
    return prisma.report.findUnique({
      where: { id },
      include: reportInclude,
    });
  },

  createReport: async (data: {
    projectId: string;
    weekday: string;
    date: string | Date;
    referent?: string | null;
    rundgangDurchgefuehrt?: string | null;
    weitereTeilnehmer?: string | null;
    createdById?: string | null;
  }) => {
    const date = toDate(data.date);

    if (!date) {
      throw new Error('Ungültiges Datum');
    }

    return prisma.report.create({
      data: {
        projectId: data.projectId,
        weekday: data.weekday,
        date,
        referent: data.referent ?? null,
        rundgangDurchgefuehrt: data.rundgangDurchgefuehrt ?? null,
        weitereTeilnehmer: data.weitereTeilnehmer ?? null,
        createdById: data.createdById ?? null,
        areas: {
          create: BEREICHE_TEMPLATE.map((name, index) => ({ name, sortOrder: index })),
        },
      },
      include: reportInclude,
    });
  },

  /**
   * Aktualisiert Kopfdaten und – falls mitgeschickt – Bereiche und
   * Feststellungen. Bereiche/Feststellungen werden bewusst komplett ersetzt:
   * die Oberflaeche schickt beim Autosave immer den gesamten Stand.
   */
  updateReport: async (
    id: string,
    patch: {
      weekday?: string;
      date?: string | Date;
      referent?: string | null;
      rundgangDurchgefuehrt?: string | null;
      weitereTeilnehmer?: string | null;
      status?: ReportStatus;
      areas?: Array<{ name: string; status?: string | null }>;
      findings?: Array<Record<string, unknown>>;
    }
  ) => {
    const data: Prisma.ReportUpdateInput = {};

    if (patch.weekday !== undefined) data.weekday = patch.weekday;
    if (patch.date !== undefined) {
      const date = toDate(patch.date);
      if (!date) throw new Error('Ungültiges Datum');
      data.date = date;
    }
    if (patch.referent !== undefined) data.referent = patch.referent || null;
    if (patch.rundgangDurchgefuehrt !== undefined) {
      data.rundgangDurchgefuehrt = patch.rundgangDurchgefuehrt || null;
    }
    if (patch.weitereTeilnehmer !== undefined) {
      data.weitereTeilnehmer = patch.weitereTeilnehmer || null;
    }
    if (patch.status !== undefined) data.status = patch.status;

    return prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.report.update({ where: { id }, data });
      }

      if (patch.areas) {
        await tx.reportArea.deleteMany({ where: { reportId: id } });
        await tx.reportArea.createMany({
          data: patch.areas.map((area, index) => ({
            reportId: id,
            name: area.name,
            status: area.status || '',
            sortOrder: index,
          })),
        });
      }

      if (patch.findings) {
        await tx.reportFinding.deleteMany({ where: { reportId: id } });

        for (const [index, finding] of patch.findings.entries()) {
          await tx.reportFinding.create({
            data: {
              reportId: id,
              position: index,
              feststellung: (finding.feststellung as string) || null,
              bereich: (finding.bereich as string) || null,
              klassifizierung: (finding.klassifizierung as string) || null,
              ampel: (finding.ampel as string) || null,
              stopp: (finding.stopp as string) || null,
              massnahme: (finding.massnahme as string) || null,
              verantwortlich: (finding.verantwortlich as string) || null,
              termin: toDate(finding.termin),
              status: (finding.status as string) || null,
              erledigtAm: toDate(finding.erledigtAm),
              enablon: (finding.enablon as string) || null,
              photoId: (finding.photoId as string) || null,
            },
          });
        }
      }

      // updatedAt auch dann anfassen, wenn nur Unterobjekte geaendert wurden
      await tx.report.update({ where: { id }, data: { updatedAt: new Date() } });

      return tx.report.findUnique({ where: { id }, include: reportInclude });
    });
  },

  deleteReport: async (id: string) => {
    const report = await prisma.report.findUnique({ where: { id } });

    if (!report) {
      return null;
    }

    await prisma.report.delete({ where: { id } });

    const dir = path.join(PHOTOS_DIR, id);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }

    return report;
  },

  addPhotos: async (
    reportId: string,
    files: Express.Multer.File[],
    uploadedById: string | null
  ) => {
    const created = [];

    for (const file of files) {
      created.push(
        await prisma.reportPhoto.create({
          data: {
            reportId,
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            uploadedById,
          },
        })
      );
    }

    return created;
  },

  getPhotoById: async (photoId: string) => {
    return prisma.reportPhoto.findUnique({ where: { id: photoId } });
  },

  deletePhoto: async (reportId: string, photoId: string) => {
    const photo = await prisma.reportPhoto.findFirst({
      where: { id: photoId, reportId },
    });

    if (!photo) {
      return null;
    }

    // Verweise aus Feststellungen loesen (onDelete: SetNull deckt das ab,
    // wir machen es explizit, damit die Reihenfolge klar ist)
    await prisma.reportFinding.updateMany({
      where: { photoId },
      data: { photoId: null },
    });

    await prisma.reportPhoto.delete({ where: { id: photoId } });

    const filePath = path.join(PHOTOS_DIR, reportId, photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return photo;
  },
};

export type ReportWithRelations = NonNullable<
  Awaited<ReturnType<typeof berichtService.getReportById>>
>;
