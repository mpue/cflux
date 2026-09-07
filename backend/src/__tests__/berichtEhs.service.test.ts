jest.mock('../lib/prisma', () => ({
  prisma: { reportFinding: { findMany: jest.fn() } },
}));

import { prisma } from '../lib/prisma';
import {
  klassifizierungKey,
  buildPyramid,
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
