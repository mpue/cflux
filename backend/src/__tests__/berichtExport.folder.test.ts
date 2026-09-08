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
    kontrolle: '',
    photoId: null,
  })),
});

const folder = { id: 'f1', name: 'KW 35', project };

/** EHS-Abschnitt, wie ihn ein Bericht ohne Feststellungen erzeugt. */
const ehsSection = (overrides: any = {}): any => ({
  year: 2026,
  month: 8,
  projectName: 'Novartis WSJ',
  pyramidScope: 'KW 35',
  pyramid: {
    levels: [
      { key: 'SIF', label: 'SIF / Fatality', color: '#7f1d1d', count: 0 },
      { key: 'GOOD_CATCH', label: 'Good Catch', color: '#65a30d', count: 16 },
      { key: 'SAFE_BEHAVIOR', label: 'Safe Behavior / Positive Beobachtung', color: '#0e7490', count: 28 },
    ],
    total: 44,
    unclassified: 0,
  },
  matrix: { rows: [], monthTotals: new Array(12).fill(0), grandTotal: 0 },
  monthlyData: null,
  ...overrides,
});

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
    expect(renderFolderHtml(folder, reports, ehsSection())).toContain('class="ehs-section"');
  });

  it('beschriftet die Pyramide mit dem Ordner und der Zahl der Feststellungen', () => {
    const html = renderFolderHtml(folder, reports, ehsSection());

    expect(html).toContain('Sicherheitspyramide — KW 35 (44 Feststellungen)');
    expect(html).toContain('Safe Behavior / Positive Beobachtung');
    expect(html).toContain('Feststellungen nach Klassifizierung und Monat');
  });

  it('führt keine Arbeitsdaten- und Kennzahlentabelle mehr mit', () => {
    const html = renderFolderHtml(folder, reports, ehsSection());

    expect(html).not.toContain('Arbeitsdaten');
    expect(html).not.toContain('LTIFR');
    expect(html).not.toContain('class="ehs-kpis"');
  });

  it('zeigt gepflegte Anmerkungen zum Monat', () => {
    const html = renderFolderHtml(
      folder,
      reports,
      ehsSection({
        monthlyData: {
          highlights: 'Null LTI seit 120 Tagen',
          achievements: null,
          hotTopics: null,
          safetyAward: 'Team Rohbau',
        },
      })
    );

    expect(html).toContain('Anmerkungen zum Monat');
    expect(html).toContain('Null LTI seit 120 Tagen');
    expect(html).toContain('Team Rohbau');
  });

  it('weist auf Feststellungen ohne zuordenbare Klassifizierung hin', () => {
    const ehs = ehsSection();
    ehs.pyramid.unclassified = 3;

    expect(renderFolderHtml(folder, reports, ehs)).toContain(
      '3 Feststellung(en) ohne zuordenbare Klassifizierung'
    );
  });

  it('zeigt statt der Pyramide einen Hinweis, wenn nichts erfasst ist', () => {
    const ehs = ehsSection();
    ehs.pyramid.total = 0;
    ehs.pyramid.levels = ehs.pyramid.levels.map((level: any) => ({ ...level, count: 0 }));

    const html = renderFolderHtml(folder, reports, ehs);

    expect(html).toContain('Hier ist keine Feststellung erfasst.');
    expect(html).not.toContain('<svg class="ehs-pyramid-svg"');
  });
});
