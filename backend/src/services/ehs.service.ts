import { Incident } from '@prisma/client';
import { prisma } from '../lib/prisma';

/**
 * Aufbereitung der EHS-Kennzahlen fuer das EHS-Dashboard (Pyramide, LTIFR/TRIR)
 * aus den Incident-Daten.
 *
 * Die Auswertung im Rundgangsbericht speist sich dagegen aus den
 * Klassifizierungen der Feststellungen — siehe berichtEhs.service.ts.
 */

/** Reihenfolge = Reihenfolge in Pyramide und Jahresmatrix (oben = schwerste). */
export const EHS_CATEGORIES = [
  'FATALITY',
  'LTI',
  'RECORDABLE',
  'FIRST_AID',
  'NEAR_MISS',
  'UNSAFE_BEHAVIOR',
  'UNSAFE_CONDITION',
  'PROPERTY_DAMAGE',
  'ENVIRONMENT',
  'SAFETY_OBSERVATION',
] as const;

export type EHSCategoryKey = (typeof EHS_CATEGORIES)[number];

export const EHS_CATEGORY_LABELS: Record<EHSCategoryKey, string> = {
  FATALITY: 'Tödlicher Unfall',
  LTI: 'LTI (Lost Time Injury)',
  RECORDABLE: 'Meldepflichtiger Unfall',
  FIRST_AID: 'Erste Hilfe',
  NEAR_MISS: 'Beinahe-Unfall',
  UNSAFE_BEHAVIOR: 'Unsicheres Verhalten',
  UNSAFE_CONDITION: 'Unsicherer Zustand',
  PROPERTY_DAMAGE: 'Sachschaden',
  ENVIRONMENT: 'Umweltvorfall',
  SAFETY_OBSERVATION: 'Sicherheitsbeobachtung',
};

export const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export interface EHSDashboardFilter {
  year: number;
  month: number;
  /** `null` = alle Projekte (so wie "Alle Projekte" im Dashboard). */
  projectId?: string | null;
  /**
   * Projekte, die der Aufrufer sehen darf. `null`/undefined = keine
   * Einschraenkung (Admin). Greift nur, wenn kein einzelnes Projekt gewaehlt
   * ist — sonst wuerde "Alle Projekte" fremde Vorfaelle in den Bericht ziehen.
   */
  allowedProjectIds?: string[] | null;
}

/** Projekt-Einschraenkung fuer Incident-Abfragen. */
const projectScope = (projectId: string | null, allowedProjectIds?: string[] | null) => {
  if (projectId) return { projectId };
  if (allowedProjectIds) return { projectId: { in: allowedProjectIds } };
  return {};
};

export type EHSDashboardData = Awaited<ReturnType<typeof getEHSDashboardData>>;

/** Massgebliches Datum eines Vorfalls — Erfassungsdatum als Rueckfallebene. */
const incidentDateOf = (incident: { incidentDate: Date | null; reportedAt: Date }): Date =>
  incident.incidentDate ?? incident.reportedAt;

const countByCategory = (incidents: Incident[], category: EHSCategoryKey): number =>
  incidents.filter((incident) => incident.ehsCategory === category).length;

export const getEHSDashboardData = async ({
  year,
  month,
  projectId,
  allowedProjectIds,
}: EHSDashboardFilter) => {
  const pid = projectId || null;

  const monthlyData = await prisma.eHSMonthlyData.findFirst({
    where: { year, month, projectId: pid },
    include: { project: true },
  });

  // Den Auswertungsbereich am angefragten Projekt festmachen, nicht an den
  // Monatsdaten: fehlen die fuer den Monat, stuende sonst "Alle Projekte" im
  // Bericht, obwohl auf ein Projekt eingeschraenkt wurde.
  const project = pid
    ? monthlyData?.project ??
      (await prisma.project.findUnique({ where: { id: pid }, select: { id: true, name: true } }))
    : null;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const incidents = await prisma.incident.findMany({
    where: {
      isEHSRelevant: true,
      OR: [
        { incidentDate: { gte: startDate, lte: endDate } },
        { incidentDate: null, reportedAt: { gte: startDate, lte: endDate } },
      ],
      ...projectScope(pid, allowedProjectIds),
    },
    include: {
      reportedBy: { select: { id: true, firstName: true, lastName: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      project: true,
    },
    orderBy: { incidentDate: 'desc' },
  });

  const pyramid = {
    fatalities: countByCategory(incidents, 'FATALITY'),
    ltis: countByCategory(incidents, 'LTI'),
    recordables: countByCategory(incidents, 'RECORDABLE'),
    firstAids: countByCategory(incidents, 'FIRST_AID'),
    nearMisses: countByCategory(incidents, 'NEAR_MISS'),
    unsafeBehaviors: countByCategory(incidents, 'UNSAFE_BEHAVIOR'),
    unsafeConditions: countByCategory(incidents, 'UNSAFE_CONDITION'),
    propertyDamages: countByCategory(incidents, 'PROPERTY_DAMAGE'),
    environmentIncidents: countByCategory(incidents, 'ENVIRONMENT'),
    safetyObservations: countByCategory(incidents, 'SAFETY_OBSERVATION'),
  };

  const totalHours = monthlyData?.totalHours || 0;
  const ltifr = totalHours > 0 ? (pyramid.ltis / totalHours) * 1000000 : 0;
  const trir = totalHours > 0 ? (pyramid.recordables / totalHours) * 200000 : 0;

  const ytdData = await prisma.eHSMonthlyData.findMany({
    where: { year, month: { lte: month }, projectId: pid },
    orderBy: { month: 'asc' },
  });

  const ytdTotalHours = ytdData.reduce((sum, d) => sum + d.totalHours, 0);
  const ytdLTIs = ytdData.reduce((sum, d) => sum + d.ltis, 0);
  const ytdRecordables = ytdData.reduce((sum, d) => sum + d.recordables, 0);

  return {
    year,
    month,
    project,
    monthlyData,
    incidents,
    pyramid,
    kpis: {
      ltifr,
      trir,
      ytdLTIFR: ytdTotalHours > 0 ? (ytdLTIs / ytdTotalHours) * 1000000 : 0,
      ytdTRIR: ytdTotalHours > 0 ? (ytdRecordables / ytdTotalHours) * 200000 : 0,
      totalHours,
      ytdTotalHours,
    },
    ytdData,
  };
};
