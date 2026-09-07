import { renderFolderHtml } from '../services/berichtExport.service';

jest.mock('../lib/prisma', () => ({ prisma: {} }));

const project: any = {
  id: 'p1',
  name: 'Novartis WSJ',
  logoUrl: null,
  primaryColor: '#634329',
  secondaryColor: '#EFE0D3',
  accentColor: '#FFF7E0',
};

const report = (day: number, weekday: string, ampeln: string[], titel: string | null = null): any => ({
  id: `r${day}`,
  weekday,
  date: new Date(`2026-08-${day}`),
  titel,
  referent: 'E. Scheer',
  rundgangDurchgefuehrt: 'Ja',
  weitereTeilnehmer: null,
  project,
  folder: { id: 'f1', name: 'KW 35' },
  areas: [],
  photos: [{ id: `p${day}`, filename: 'a.jpg' }],
  findings: ampeln.map((ampel, index) => ({
    id: `f${day}${index}`,
    position: index,
    ampel,
    feststellung: 'x',
    bereich: 'y',
    klassifizierung: '',
    stopp: '',
    massnahme: '',
    verantwortlich: '',
    termin: null,
    status: '',
    erledigtAm: null,
    enablon: '',
    photoId: null,
  })),
});

const folder = { id: 'f1', name: 'KW 35', project };

describe('renderFolderHtml', () => {
  const reports = [
    report(24, 'Mo', ['Grün', 'Gelb']),
    report(25, 'Di', ['Rot', 'Gelb', 'Grün'], 'Sicherheitsrundgang'),
    report(26, 'Mi', ['Grün']),
  ];

  it('zählt Tagesblätter, Feststellungen, Ampeln und Fotos auf dem Deckblatt', () => {
    const html = renderFolderHtml(folder, reports);

    // Reihenfolge im Deckblatt: Tagesblätter, Feststellungen, grün, gelb, rot, Fotos
    const zahlen = [...html.matchAll(/class="kennzahl-zahl[^"]*">(\d+)</g)].map((m) => Number(m[1]));
    expect(zahlen).toEqual([3, 6, 3, 2, 1, 3]);
  });

  it('nennt den Zeitraum vom ersten bis zum letzten Tag', () => {
    expect(renderFolderHtml(folder, reports)).toContain('24.8.2026 – 26.8.2026');
  });

  it('zeigt bei einem einzigen Tag nur ein Datum', () => {
    expect(renderFolderHtml(folder, [reports[0]])).toContain('Gesamt-Wochenbericht · Novartis WSJ · 24.8.2026');
  });

  it('reiht jedes Tagesblatt als eigene Seite ein', () => {
    const html = renderFolderHtml(folder, reports);
    expect(html.match(/class="sheet-page"/g)).toHaveLength(3);
  });

  it('hängt die EHS-Auswertung nur an, wenn sie mitgegeben wird', () => {
    // Auf die Sektion pruefen, nicht auf den Text — der steht auch im CSS-Kommentar.
    expect(renderFolderHtml(folder, reports)).not.toContain('class="ehs-section"');

    const ehs: any = {
      year: 2026,
      month: 8,
      project: { id: 'p1', name: 'Novartis WSJ' },
      monthlyData: null,
      incidents: [],
      pyramid: {
        fatalities: 0, ltis: 0, recordables: 0, firstAids: 0, nearMisses: 0,
        unsafeBehaviors: 0, unsafeConditions: 0, propertyDamages: 0,
        environmentIncidents: 0, safetyObservations: 0,
      },
      kpis: { ltifr: 0, trir: 0, ytdLTIFR: 0, ytdTRIR: 0, totalHours: 0, ytdTotalHours: 0 },
      ytdData: [],
      matrix: { rows: [], monthTotals: new Array(12).fill(0), grandTotal: 0 },
    };

    expect(renderFolderHtml(folder, reports, ehs)).toContain('class="ehs-section"');
  });
});
