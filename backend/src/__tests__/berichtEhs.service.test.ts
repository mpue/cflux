jest.mock('../lib/prisma', () => ({
  prisma: {
    reportFinding: { findMany: jest.fn() },
    report: { findMany: jest.fn() },
    project: { findUnique: jest.fn() },
  },
}));

import { prisma } from '../lib/prisma';
import {
  ampelKey,
  klassifizierungKey,
  buildPyramid,
  getBerichtDashboard,
  getKlassifizierungMatrix,
  KLASSIFIZIERUNGEN,
} from '../services/berichtEhs.service';

const finding = (klassifizierung: string | null) => ({ klassifizierung });

describe('klassifizierungKey', () => {
  it('erkennt die Schreibweise aus cflux', () => {
    expect(klassifizierungKey('Unsafe Act (unsichere Handlung)')).toBe('UNSAFE_ACT');
    expect(klassifizierungKey('Safe Behavior / Positive Beobachtung')).toBe('SAFE_BEHAVIOR');
  });

  it('erkennt dieselbe Stufe trotz Emoji aus dem Wochenbericht-Tool', () => {
    // Importierte Feststellungen tragen das Emoji mit; ohne Normalisierung
    // zaehlten sie als eigene Stufe.
    expect(klassifizierungKey('⚠️ Unsafe Act (unsichere Handlung)')).toBe('UNSAFE_ACT');
    expect(klassifizierungKey('🏥 MTC / Recordable Incident')).toBe('MTC');
    expect(klassifizierungKey('✅ Safe Behavior / Positive Beobachtung')).toBe('SAFE_BEHAVIOR');
  });

  it('unterscheidet LTI von pSIF', () => {
    expect(klassifizierungKey('📋 LTI (Lost Time Injury)')).toBe('LTI');
    expect(klassifizierungKey('🔺 pSIF (Potential Serious Injury/Fatality)')).toBe('PSIF');
  });

  it('liefert null für Leeres und Unbekanntes', () => {
    expect(klassifizierungKey('')).toBeNull();
    expect(klassifizierungKey(null)).toBeNull();
    expect(klassifizierungKey('irgendwas anderes')).toBeNull();
  });
});

describe('buildPyramid', () => {
  it('zählt die Feststellungen der übergebenen Berichte auf die Stufen', () => {
    const pyramid = buildPyramid([
      {
        findings: [
          finding('✅ Safe Behavior / Positive Beobachtung'),
          finding('✅ Safe Behavior / Positive Beobachtung'),
          finding('🧤 Good Catch'),
        ],
      },
      { findings: [finding('⚠️ Unsafe Condition (unsicherer Zustand)')] },
    ]);

    const byKey = Object.fromEntries(pyramid.levels.map((level) => [level.key, level.count]));

    expect(byKey.SAFE_BEHAVIOR).toBe(2);
    expect(byKey.GOOD_CATCH).toBe(1);
    expect(byKey.UNSAFE_CONDITION).toBe(1);
    expect(byKey.SIF).toBe(0);
    expect(pyramid.total).toBe(4);
    expect(pyramid.unclassified).toBe(0);
  });

  it('führt die elf Stufen von der schwersten zur leichtesten', () => {
    const pyramid = buildPyramid([]);

    expect(pyramid.levels).toHaveLength(11);
    expect(pyramid.levels[0].label).toBe('SIF / Fatality');
    expect(pyramid.levels[10].label).toBe('Safe Behavior / Positive Beobachtung');
    expect(pyramid.levels).toHaveLength(KLASSIFIZIERUNGEN.length);
  });

  it('zählt Feststellungen ohne zuordenbare Klassifizierung getrennt', () => {
    const pyramid = buildPyramid([{ findings: [finding(''), finding('Blabla'), finding('Good Catch')] }]);

    expect(pyramid.total).toBe(3);
    expect(pyramid.unclassified).toBe(2);
  });
});

describe('getKlassifizierungMatrix', () => {
  it('verteilt die Feststellungen über die Monate des Rundgangsdatums', async () => {
    (prisma.reportFinding.findMany as jest.Mock).mockResolvedValue([
      { klassifizierung: '🧤 Good Catch', report: { date: new Date('2026-08-25') } },
      { klassifizierung: 'Good Catch', report: { date: new Date('2026-08-27') } },
      { klassifizierung: '⚠️ Unsafe Act (unsichere Handlung)', report: { date: new Date('2026-09-02') } },
    ]);

    const matrix = await getKlassifizierungMatrix(2026, 'p1');

    const goodCatch = matrix.rows.find((row) => row.key === 'GOOD_CATCH')!;
    expect(goodCatch.counts[7]).toBe(2); // August
    expect(goodCatch.total).toBe(2);

    const unsafeAct = matrix.rows.find((row) => row.key === 'UNSAFE_ACT')!;
    expect(unsafeAct.counts[8]).toBe(1); // September

    expect(matrix.monthTotals[7]).toBe(2);
    expect(matrix.grandTotal).toBe(3);
  });

  it('lässt die Zeile „Ohne Klassifizierung" weg, solange sie leer ist', async () => {
    (prisma.reportFinding.findMany as jest.Mock).mockResolvedValue([
      { klassifizierung: 'Good Catch', report: { date: new Date('2026-08-25') } },
    ]);

    const matrix = await getKlassifizierungMatrix(2026, 'p1');
    expect(matrix.rows.some((row) => row.key === 'UNCLASSIFIED')).toBe(false);
  });

  it('zeigt sie, sobald es unzuordenbare Feststellungen gibt', async () => {
    (prisma.reportFinding.findMany as jest.Mock).mockResolvedValue([
      { klassifizierung: 'Blabla', report: { date: new Date('2026-08-25') } },
    ]);

    const matrix = await getKlassifizierungMatrix(2026, 'p1');
    const row = matrix.rows.find((r) => r.key === 'UNCLASSIFIED');
    expect(row?.total).toBe(1);
  });
});

describe('ampelKey', () => {
  it('erkennt die Stufen unabhängig von Schreibweise und Umlaut', () => {
    expect(ampelKey('Rot')).toBe('rot');
    expect(ampelKey('gelb')).toBe('gelb');
    expect(ampelKey('Grün')).toBe('gruen');
    // Aus dem Wochenbericht-Tool kommt die umlautlose Fassung.
    expect(ampelKey('Gruen')).toBe('gruen');
  });

  it('liefert null für Leeres und Unbekanntes', () => {
    expect(ampelKey('')).toBeNull();
    expect(ampelKey(null)).toBeNull();
    expect(ampelKey('blau')).toBeNull();
  });
});

describe('getBerichtDashboard', () => {
  const report = (
    date: string,
    folder: { id: string; name: string } | null,
    findings: { klassifizierung?: string | null; ampel?: string | null; status?: string | null }[],
    photos = 0
  ) => ({
    id: `r-${date}`,
    date: new Date(date),
    folder,
    findings: findings.map((f) => ({
      klassifizierung: f.klassifizierung ?? null,
      ampel: f.ampel ?? null,
      status: f.status ?? null,
    })),
    _count: { photos },
  });

  const kw35 = { id: 'f1', name: 'KW 35' };

  beforeEach(() => {
    (prisma.reportFinding.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ name: 'Novartis WSJ' });
    (prisma.report.findMany as jest.Mock).mockResolvedValue([
      report('2026-08-26', kw35, [
        { klassifizierung: 'Unsafe Condition (unsicherer Zustand)', ampel: 'Rot', status: 'Offen' },
        { klassifizierung: 'Good Catch', ampel: 'Gruen', status: 'Erledigt' },
      ], 3),
      report('2026-08-27', kw35, [{ ampel: 'Gelb', status: 'In Bearbeitung' }], 1),
      report('2026-09-02', null, [{ ampel: 'Rot', status: 'Offen' }], 0),
    ]);
  });

  it('zählt Kennzahlen über alle Berichte des Jahres', async () => {
    const dashboard = await getBerichtDashboard({ year: 2026, projectId: 'p1' });

    expect(dashboard.kennzahlen).toEqual({
      reports: 3,
      findings: 4,
      photos: 4,
      offeneMassnahmen: 3,
      ampel: { rot: 2, gelb: 1, gruen: 1 },
    });
    expect(dashboard.projectName).toBe('Novartis WSJ');
  });

  it('gruppiert die Tagesblätter nach Wochenbericht-Ordner', async () => {
    const dashboard = await getBerichtDashboard({ year: 2026, projectId: 'p1' });

    expect(dashboard.folders).toHaveLength(2);
    expect(dashboard.folders[0]).toMatchObject({
      id: 'f1',
      name: 'KW 35',
      from: '2026-08-26',
      to: '2026-08-27',
      reports: 2,
      findings: 3,
      ampel: { rot: 1, gelb: 1, gruen: 1 },
    });
    // Tagesblätter ohne Ordner bekommen einen eigenen Sammeleintrag.
    expect(dashboard.folders[1]).toMatchObject({ id: null, name: 'Ohne Ordner', reports: 1 });
  });

  it('verteilt die Ampelstufen auf die Monate des Rundgangs', async () => {
    const dashboard = await getBerichtDashboard({ year: 2026, projectId: 'p1' });

    // August = Index 7, September = Index 8.
    expect(dashboard.ampelByMonth.rot[7]).toBe(1);
    expect(dashboard.ampelByMonth.gelb[7]).toBe(1);
    expect(dashboard.ampelByMonth.gruen[7]).toBe(1);
    expect(dashboard.ampelByMonth.rot[8]).toBe(1);
  });

  it('baut die Pyramide aus denselben Feststellungen wie der Export', async () => {
    const dashboard = await getBerichtDashboard({ year: 2026, projectId: 'p1' });
    const byKey = Object.fromEntries(dashboard.pyramid.levels.map((l) => [l.key, l.count]));

    expect(byKey.UNSAFE_CONDITION).toBe(1);
    expect(byKey.GOOD_CATCH).toBe(1);
    expect(dashboard.pyramid.total).toBe(4);
    // Die zwei Feststellungen ohne Klassifizierung fallen hier heraus.
    expect(dashboard.pyramid.unclassified).toBe(2);
  });
});
