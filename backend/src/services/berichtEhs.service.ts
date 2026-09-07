import { prisma } from '../lib/prisma';
import { ReportWithRelations } from './bericht.service';

/**
 * EHS-Auswertung aus den Feststellungen der Rundgangsberichte.
 *
 * Jede Feststellung traegt eine Klassifizierung, und diese elf Stufen sind
 * bereits eine Sicherheitspyramide — von der Beobachtung an der Basis bis zum
 * toedlichen Unfall an der Spitze. Sie sind die Datenquelle der Auswertung;
 * die Incident-Tabelle gehoert zum Incident-Modul und spielt hier nicht mit.
 */

/** Stufen von der Spitze abwaerts. Reihenfolge = Schwere. */
export const KLASSIFIZIERUNGEN = [
  { key: 'SIF', label: 'SIF / Fatality', color: '#7f1d1d' },
  { key: 'LTI', label: 'LTI (Lost Time Injury)', color: '#b91c1c' },
  { key: 'RWC', label: 'RWC (Restricted Work Case)', color: '#dc2626' },
  { key: 'MTC', label: 'MTC / Recordable Incident', color: '#ea580c' },
  { key: 'FAC', label: 'FAC (First Aid Case)', color: '#f59e0b' },
  { key: 'PSIF', label: 'pSIF (Potential Serious Injury/Fatality)', color: '#eab308' },
  { key: 'NEAR_MISS', label: 'Near Miss (Beinaheunfall)', color: '#a3a635' },
  { key: 'GOOD_CATCH', label: 'Good Catch', color: '#65a30d' },
  { key: 'UNSAFE_ACT', label: 'Unsafe Act (unsichere Handlung)', color: '#16a34a' },
  { key: 'UNSAFE_CONDITION', label: 'Unsafe Condition (unsicherer Zustand)', color: '#0d9488' },
  { key: 'SAFE_BEHAVIOR', label: 'Safe Behavior / Positive Beobachtung', color: '#0e7490' },
] as const;

export type KlassifizierungKey = (typeof KLASSIFIZIERUNGEN)[number]['key'];

/** Kennzahlen zaehlen nach OSHA: Recordable = MTC + RWC + LTI + Todesfall. */
const RECORDABLE_KEYS: KlassifizierungKey[] = ['MTC', 'RWC', 'LTI', 'SIF'];

/**
 * Die im Wochenbericht-Tool erfassten Werte tragen ein Emoji vorweg
 * ("⚠️ Unsafe Act (unsichere Handlung)"), die in cflux angelegten nicht.
 * Ohne Normalisierung zaehlten dieselben Klassifizierungen doppelt.
 */
const normalize = (value: string): string =>
  value
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLowerCase();

const LOOKUP = new Map<string, KlassifizierungKey>(
  KLASSIFIZIERUNGEN.map((level) => [normalize(level.label), level.key])
);

/** Ordnet einen erfassten Text einer Stufe zu; null, wenn er zu keiner passt. */
export const klassifizierungKey = (value: string | null | undefined): KlassifizierungKey | null => {
  if (!value) return null;

  const normalized = normalize(value);
  const direct = LOOKUP.get(normalized);
  if (direct) return direct;

  // Freitext oder abgewandelte Schreibweise: die laengste passende Stufe
  // gewinnt, damit "LTI" nicht faelschlich auf "pSIF" trifft.
  let best: { key: KlassifizierungKey; length: number } | null = null;
  for (const [label, key] of LOOKUP) {
    if (normalized.includes(label) && (!best || label.length > best.length)) {
      best = { key, length: label.length };
    }
  }

  return best?.key ?? null;
};

export interface PyramidLevel {
  key: KlassifizierungKey;
  label: string;
  color: string;
  count: number;
}

export interface FindingPyramid {
  levels: PyramidLevel[];
  total: number;
  /** Feststellungen, deren Klassifizierung leer ist oder zu keiner Stufe passt. */
  unclassified: number;
}

/** Pyramide aus den Feststellungen der Berichte, die im Dokument stehen. */
export const buildPyramid = (reports: { findings: { klassifizierung: string | null }[] }[]): FindingPyramid => {
  const counts = new Map<KlassifizierungKey, number>(
    KLASSIFIZIERUNGEN.map((level) => [level.key, 0])
  );
  let unclassified = 0;
  let total = 0;

  for (const report of reports) {
    for (const finding of report.findings) {
      total += 1;
      const key = klassifizierungKey(finding.klassifizierung);
      if (key) {
        counts.set(key, (counts.get(key) || 0) + 1);
      } else {
        unclassified += 1;
      }
    }
  }

  return {
    levels: KLASSIFIZIERUNGEN.map((level) => ({ ...level, count: counts.get(level.key) || 0 })),
    total,
    unclassified,
  };
};

export interface KlassifizierungMatrix {
  rows: { key: KlassifizierungKey | 'UNCLASSIFIED'; label: string; counts: number[]; total: number }[];
  monthTotals: number[];
  grandTotal: number;
}

/**
 * Jahresuebersicht: Klassifizierung gegen Monat, ueber alle Berichte des
 * Projekts. Der Monat kommt vom Datum des Rundgangs, nicht vom Erfassungstag.
 */
export const getKlassifizierungMatrix = async (
  year: number,
  projectId: string | null,
  allowedProjectIds?: string[] | null
): Promise<KlassifizierungMatrix> => {
  const findings = await prisma.reportFinding.findMany({
    where: {
      report: {
        date: { gte: new Date(Date.UTC(year, 0, 1)), lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)) },
        ...(projectId
          ? { projectId }
          : allowedProjectIds
          ? { projectId: { in: allowedProjectIds } }
          : {}),
      },
    },
    select: { klassifizierung: true, report: { select: { date: true } } },
  });

  const counts = new Map<string, number[]>([
    ...KLASSIFIZIERUNGEN.map((level) => [level.key, new Array(12).fill(0)] as [string, number[]]),
    ['UNCLASSIFIED', new Array(12).fill(0)],
  ]);

  for (const finding of findings) {
    const key = klassifizierungKey(finding.klassifizierung) ?? 'UNCLASSIFIED';
    counts.get(key)![new Date(finding.report.date).getUTCMonth()] += 1;
  }

  const rows = [
    ...KLASSIFIZIERUNGEN.map((level) => ({ key: level.key as KlassifizierungKey, label: level.label })),
    { key: 'UNCLASSIFIED' as const, label: 'Ohne Klassifizierung' },
  ]
    .map((row) => {
      const values = counts.get(row.key)!;
      return { ...row, counts: values, total: values.reduce((sum, value) => sum + value, 0) };
    })
    // Eine Zeile "Ohne Klassifizierung" voller Nullen ist nur Rauschen.
    .filter((row) => row.key !== 'UNCLASSIFIED' || row.total > 0);

  const monthTotals = Array.from({ length: 12 }, (_, index) =>
    rows.reduce((sum, row) => sum + row.counts[index], 0)
  );

  return {
    rows,
    monthTotals,
    grandTotal: monthTotals.reduce((sum, value) => sum + value, 0),
  };
};

export interface ReportEhsSection {
  year: number;
  month: number;
  projectName: string | null;
  /** Beschreibt, welche Berichte in die Pyramide eingeflossen sind. */
  pyramidScope: string;
  pyramid: FindingPyramid;
  matrix: KlassifizierungMatrix;
  monthlyData: {
    workingDays: number;
    workersPerDay: number;
    hoursPerDay: number;
    totalHours: number;
    highlights: string | null;
    achievements: string | null;
    hotTopics: string | null;
    safetyAward: string | null;
  } | null;
  kpis: {
    ltifr: number;
    trir: number;
    ltis: number;
    recordables: number;
    totalHours: number;
    /** Feststellungen des gewaehlten Monats — Bezugsgroesse der Kennzahlen. */
    monthFindings: number;
  };
}

/** Feststellungen eines Monats — Bezugsgroesse fuer LTIFR und TRIR. */
const monthFindingCounts = async (year: number, month: number, projectId: string | null) => {
  const findings = await prisma.reportFinding.findMany({
    where: {
      report: {
        date: {
          gte: new Date(Date.UTC(year, month - 1, 1)),
          lte: new Date(Date.UTC(year, month, 0, 23, 59, 59)),
        },
        ...(projectId ? { projectId } : {}),
      },
    },
    select: { klassifizierung: true },
  });

  let ltis = 0;
  let recordables = 0;

  for (const finding of findings) {
    const key = klassifizierungKey(finding.klassifizierung);
    if (key === 'LTI' || key === 'SIF') ltis += 1;
    if (key && RECORDABLE_KEYS.includes(key)) recordables += 1;
  }

  return { ltis, recordables, total: findings.length };
};

export const getReportEhsSection = async ({
  reports,
  year,
  month,
  projectId,
  pyramidScope,
  allowedProjectIds,
}: {
  reports: ReportWithRelations[];
  year: number;
  month: number;
  projectId: string | null;
  pyramidScope: string;
  allowedProjectIds?: string[] | null;
}): Promise<ReportEhsSection> => {
  const [matrix, monthCounts, monthly, project] = await Promise.all([
    getKlassifizierungMatrix(year, projectId, allowedProjectIds),
    monthFindingCounts(year, month, projectId),
    prisma.eHSMonthlyData.findFirst({ where: { year, month, projectId } }),
    projectId
      ? prisma.project.findUnique({ where: { id: projectId }, select: { name: true } })
      : Promise.resolve(null),
  ]);

  const totalHours = monthly?.totalHours || 0;

  return {
    year,
    month,
    projectName: project?.name ?? null,
    pyramidScope,
    pyramid: buildPyramid(reports),
    matrix,
    monthlyData: monthly
      ? {
          workingDays: monthly.workingDays,
          workersPerDay: monthly.workersPerDay,
          hoursPerDay: monthly.hoursPerDay,
          totalHours: monthly.totalHours,
          highlights: monthly.highlights,
          achievements: monthly.achievements,
          hotTopics: monthly.hotTopics,
          safetyAward: monthly.safetyAward,
        }
      : null,
    kpis: {
      ltifr: totalHours > 0 ? (monthCounts.ltis / totalHours) * 1000000 : 0,
      trir: totalHours > 0 ? (monthCounts.recordables / totalHours) * 200000 : 0,
      ltis: monthCounts.ltis,
      recordables: monthCounts.recordables,
      totalHours,
      monthFindings: monthCounts.total,
    },
  };
};
