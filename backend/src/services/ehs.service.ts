import { Incident } from '@prisma/client';
import { prisma } from '../lib/prisma';

/**
 * Aufbereitung der EHS-Kennzahlen (Pyramide, LTIFR/TRIR, Jahresmatrix).
 *
 * Wird sowohl vom EHS-Dashboard-Endpunkt als auch vom Wochenbericht-Export
 * benutzt — die Auswertung haengt als eigener Abschnitt hinten am Bericht.
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
    project: monthlyData?.project ?? null,
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

export interface EHSYearMatrix {
  /** Pro Kategorie zwoelf Monatswerte (Index 0 = Januar). */
  rows: { category: EHSCategoryKey; label: string; counts: number[]; total: number }[];
  monthTotals: number[];
  grandTotal: number;
}

/**
 * Jahresuebersicht "Vorfaelle nach Kategorie und Monat" — im Dashboard wird
 * dieselbe Matrix im Frontend aus /api/incidents gebaut.
 */
export const getEHSYearMatrix = async (
  year: number,
  projectId?: string | null,
  allowedProjectIds?: string[] | null
): Promise<EHSYearMatrix> => {
  const pid = projectId || null;
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const incidents = await prisma.incident.findMany({
    where: {
      ehsCategory: { not: null },
      OR: [
        { incidentDate: { gte: startDate, lte: endDate } },
        { incidentDate: null, reportedAt: { gte: startDate, lte: endDate } },
      ],
      ...projectScope(pid, allowedProjectIds),
    },
    select: { ehsCategory: true, incidentDate: true, reportedAt: true },
  });

  const counts = new Map<string, number[]>(
    EHS_CATEGORIES.map((category) => [category, new Array(12).fill(0)])
  );

  for (const incident of incidents) {
    const row = counts.get(incident.ehsCategory as string);
    if (!row) continue;
    row[incidentDateOf(incident).getMonth()] += 1;
  }

  const rows = EHS_CATEGORIES.map((category) => {
    const values = counts.get(category)!;
    return {
      category,
      label: EHS_CATEGORY_LABELS[category],
      counts: values,
      total: values.reduce((sum, value) => sum + value, 0),
    };
  });

  const monthTotals = Array.from({ length: 12 }, (_, index) =>
    rows.reduce((sum, row) => sum + row.counts[index], 0)
  );

  return {
    rows,
    monthTotals,
    grandTotal: monthTotals.reduce((sum, value) => sum + value, 0),
  };
};

/** Vollstaendiger Datensatz fuer den EHS-Abschnitt im Wochenbericht. */
export const getEHSReportSection = async (filter: EHSDashboardFilter) => {
  const [dashboard, matrix] = await Promise.all([
    getEHSDashboardData(filter),
    getEHSYearMatrix(filter.year, filter.projectId, filter.allowedProjectIds),
  ]);

  return { ...dashboard, matrix };
};

export type EHSReportSection = Awaited<ReturnType<typeof getEHSReportSection>>;
