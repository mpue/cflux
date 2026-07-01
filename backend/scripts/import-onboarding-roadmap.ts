import { PrismaClient, ChecklistType, ChecklistItemType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Import der Excel-Vorlage "CL Roadmap Onboarding - Aquist Schweiz GmbH"
 * als Checklisten-Template (Typ ONBOARDING) in cflux.
 *
 * Quelle: CL Roadmap Onboarding_CH-439114_AA.xlsm
 * Die Aufgaben sind nach den 5 Phasen der Roadmap gruppiert. Die Phase
 * wird über die Aufgabennummer (N°) im Titel und über die Reihenfolge
 * abgebildet. "Wer" (HR / IT / Vorgesetzter) wird auf assignedRole gemappt.
 */

const TEMPLATE_NAME = 'Onboarding Roadmap – Aquist Schweiz GmbH';

interface RoadmapItem {
  no?: string;        // N° aus der Excel (z.B. "1.01")
  task: string;       // Aufgabe -> title
  detail?: string;    // Detail -> description
  who?: string;       // Wer -> assignedRole
  day?: number;       // Tag (Phase 3/4) -> dueDayOffset
}

interface Phase {
  title: string;
  items: RoadmapItem[];
}

const phases: Phase[] = [
  {
    title: 'Vor Beginn',
    items: [
      { no: '1.01', task: 'Einarbeitungsplan', who: 'HR', detail: 'Einen detaillierten Einarbeitungsplan mit Einsatzort, Zeitrahmen, Zielen, Zuständigkeiten, Verantwortlichkeiten, Ausbildungen, Ansprechperson (Vorgesetzter / Pate) und Kontaktdaten bereitstellen.' },
      { no: '1.02', task: 'Arbeitsplatz', who: 'Vorgesetzter', detail: 'Sicherstellen, dass der Arbeitsplatz des neuen Mitarbeitenden eingerichtet ist, einschliesslich Computer, Telefon, E-Mail-Zugang und anderen notwendigen Arbeitsmitteln.' },
      { no: '1.02', task: 'Arbeitsplatz (IT)', who: 'IT', detail: 'Sicherstellen, dass der Arbeitsplatz des neuen Mitarbeitenden eingerichtet ist, einschliesslich Computer, Telefon, E-Mail-Zugang und anderen notwendigen Arbeitsmitteln.' },
      { no: '1.03', task: 'Zugangsdaten und Berechtigungen', who: 'IT', detail: 'Erstellen und Bereitstellen aller notwendigen Zugangsdaten, Passwörter und Berechtigungen für IT-Systeme und Räumlichkeiten.' },
      { no: '1.04', task: 'Willkommenspaket', who: 'HR', detail: 'Zusammenstellen eines Willkommenspakets mit wichtigen Informationen über das Unternehmen, die Unternehmenskultur, die Teamstruktur und andere relevante Unterlagen.' },
      { no: '1.05', task: 'Termin Einführungsgespräch', who: 'Vorgesetzter', detail: 'Festlegen des Termins Einführungsgespräch am ersten Arbeitstag. Diesen Termin im Einarbeitungsplan eintragen und an HR kommunizieren. Dies ist der erste Termin des neuen Mitarbeitenden und ist früh anzusetzen (Begrüssung).' },
      { no: '1.06', task: 'Arbeitsvertrag und Unterlagen', who: 'HR', detail: 'Sicherstellen, dass der Arbeitsvertrag und alle relevanten Unterlagen unterschrieben und archiviert sind:\n\n- Arbeitsvertrag\n- Personalstammblatt\n- Kopie Personalausweis\n- AHV Versicherungsnachweis\n- Passfoto\n- Ansässigkeitsbescheinigung (Grenzgänger DE)\n- Kinderzulagen (Familienbuch, Geburtsurkunde Kinder, Scheidungsurteil, Unterhaltsvereinbarung usw.)\n- Diplome und Zertifikate\n- Lebenslauf\n- Arbeitszeugnisse' },
      { no: '1.07', task: 'Schulungen und Trainings', who: 'Vorgesetzter', detail: 'Geplante Schulungen und Trainings organisieren, die für den neuen Mitarbeitenden relevant sind (siehe Trainingsmatrix/Detailplan).\n\nDie Trainingstermine sind Teil des Einarbeitungsplans (interne Ausbildungen vorgängig fixieren). Extern benötigte Ausbildungen sind durch den Vorgesetzten innerhalb des ersten Jahres umzusetzen; Durchführungsdaten und Informationen rechtzeitig kommunizieren.' },
      { no: '1.08', task: 'Mitarbeitende informieren', who: 'Vorgesetzter', detail: 'Das Team und relevante Abteilungen über den neuen Mitarbeitenden informieren und einen Paten zuweisen.' },
      { no: '1.09', task: 'Arbeitskleidung und Schutzausrüstung', who: 'HR', detail: 'Arbeitskleidung und Sicherheitsausrüstung bereitstellen.' },
      { no: '1.10', task: 'Behördliche Anmeldungen Wallis', who: 'HR', detail: 'AHV Versicherungsausweis beantragen.\n\nGrenzgängerbewilligung einholen:\n- Erstmalige Erteilung (Bewilligung L, B oder G): Formular «Antrag Einzelperson um Aufenthaltsbewilligung», Kopie gültiger Reisepass/Identitätskarte, Kopie Arbeitsvertrag\n- Gesuch für Grenzgänger (Bewilligung G): Wohnsitzbestätigung der zuständigen ausländischen Behörden, Kopie Mietvertrag, Kopie Krankenkassenkarte\n\nAnmeldung 90-Tage-Regelung.\nBefreiung von der Schweizer Krankenkasse.\nAnmeldung Helvetia Pensionskasse: durch Mahrer Treuhand AG.\nAnmeldung Quellensteuer Kanton Wallis: durch Mahrer Treuhand AG.' },
      { no: '1.10', task: 'Behördliche Anmeldungen Aargau', who: 'HR', detail: 'AHV Versicherungsausweis beantragen.\nGrenzgängerbewilligung einholen.\nAnmeldung 90-Tage-Regelung.\nBefreiung von der Schweizer Krankenkasse.\nAnmeldung Helvetia Pensionskasse: durch Mahrer Treuhand AG.\nAnmeldung Quellensteuer Kanton Aargau: durch Mahrer Treuhand AG.' },
    ],
  },
  {
    title: 'Eine Woche vor Start',
    items: [
      { no: '2.01', task: 'Standard Willkommensmail', who: 'HR', detail: 'Standard Willkommensmail an den neuen Mitarbeitenden versenden. Inhalte sind Begrüssung, Vorfreude signalisieren, Arbeitsplan, Standort (Wegbeschreibung / ÖV / Auto), Startdatum, Uhrzeit, Kontaktdaten.' },
    ],
  },
  {
    title: 'Start Aquist GmbH Standort',
    items: [
      { no: '3.01', task: 'Begrüssung durch die Standortleitung / den Vorgesetzten', who: 'Vorgesetzter', day: 1, detail: 'Einführungsgespräch\nVorstellung Unternehmen\nÜbergabe Willkommenspaket' },
      { no: '3.02', task: 'Übergabe IT- und Telefonie-Equipment, Systeme durch IT', who: 'IT', day: 1, detail: 'Hilfe bei Inbetriebnahme\nVorstellung Betriebs- und Ablagesysteme\nEintragen der ID Handy, Rechner usw.\nBestätigung Erhalt durch Mitarbeitenden\nIT- / Telefonie-Policy' },
      { no: '3.03', task: 'Übergabe Arbeitskleidung und Schutzausrüstung', who: 'HR', day: 1, detail: 'Übergabe der Arbeitskleidung und Schutzausrüstung. Grössen und Vollständigkeit prüfen, Erhalt bestätigen. Bestellformular Arbeitsbekleidung und Schutzausrüstung im Dossier des Mitarbeitenden ablegen.' },
      { no: '3.04', task: 'Einführung und Instruktion Munixo', who: 'HR', day: 1, detail: 'Kontrolle Login, aufzeigen der Möglichkeiten und Aufgaben (Ferienanträge / Stempelungen und Korrekturen / Help Line usw.) Munixo mit dazugehörigen Unterlagen. Die Instruktion ist zu dokumentieren.' },
      { no: '3.05', task: 'Einführung und Instruktion E-Learning', who: 'IT', day: 1, detail: 'Funktion / Möglichkeiten / Aufgaben' },
      { no: '3.06', task: 'Ausbildung (Teil 1) EHS Handbuch', who: 'Vorgesetzter', day: 2, detail: 'Unternehmenswerte & Unternehmenskultur\nGoldene Regeln\nInhalte EHS Handbuch' },
      { no: '3.07', task: 'Ausbildung (Teil 2) EHS Handbuch im Selbststudium', who: 'Vorgesetzter', day: 2, detail: 'Quiz und Lernerfolgsprüfung E-Learning' },
      { no: '3.08', task: 'Ziele & Zielerreichung', who: 'Vorgesetzter', day: 2, detail: 'Bekanntgabe Jahresziele\nUnternehmensziele\nPersönliche Ziele (Einführungsplan)' },
      { no: '3.09', task: 'Stellenbeschreibung', who: 'Vorgesetzter', day: 2, detail: 'Vorstellen der passenden Stellenbeschreibung und Bekanntgabe der Erwartungen.' },
      { no: '3.10', task: 'Besprechung Einführungs- und Ausbildungsplan', who: 'Vorgesetzter', day: 2, detail: 'Detaillierte Besprechung des vorbereiteten Einführungsplans und des Ausbildungsplans.' },
      { no: '3.11', task: 'Q&A-Session für offene Fragen und erste Eindrücke', who: 'Vorgesetzter', day: 2, detail: 'Am Ende der ersten zwei Tage werden offene Fragen geklärt und der erste Eindruck des neuen Mitarbeitenden gewonnen. Konstruktive Verbesserungsvorschläge zum Onboarding sind der Geschäftsleitung anzuzeigen, damit diese den Prozess analysieren und optimieren kann.' },
      { no: '3.12', task: 'Übergabe Andere (Wohnung, Fahrzeug usw.)', who: 'Vorgesetzter', day: 2, detail: 'Jede Übergabe ist schriftlich festzuhalten. Equipment und Eigentum der Aquist GmbH (klar identifizierbar / Fahrzeugnummer / Mietvertrag / Handynummer usw.) wird erst nach schriftlicher Bestätigung ausgehändigt.\n\nAuto: Verhaltensregeln und Erwartungen der Aquist GmbH vermitteln. Kopie / Überprüfen Führerschein.\nHandy: Telefonie-Policy und Verhaltensregeln vermitteln.\nWohnung: Erwartungen kommunizieren, Hausordnung bekanntgeben. Bestandesaufnahme und Ist-Zustand dokumentieren.' },
      { no: '3.13', task: 'Übergabe an Team Lead oder Pate/-in', who: 'Vorgesetzter', day: 2, detail: 'Der Team Lead oder der Pate holt am Ende der ersten zwei Tage den neuen Mitarbeitenden zur Begrüssung und Besprechung des weiteren Vorgehens ab.' },
    ],
  },
  {
    title: 'Projekt Kunde',
    items: [
      { no: '4.01', task: 'Vorstellung Projekt und Team', who: 'Vorgesetzter', day: 3, detail: 'Vorstellung Projekt- und Team.' },
      { no: '4.02', task: 'Integration neuer Mitarbeitender', who: 'Vorgesetzter', day: 3, detail: 'Integrieren des neuen Mitarbeitenden in den täglichen Ablauf:\n- Interne Meetings\n- Bau-/Projektsitzung\n- Mittagessen\n- Sicherheitsrundgänge\n- Sicherheitsmeetings usw.' },
      { no: '4.03', task: 'Sicherheitsunterweisungen und projektspezifische Instruktionen / Ausbildungen', who: 'Vorgesetzter', day: 3, detail: 'Sicherheitsunterweisungen und andere relevante projektspezifische Instruktionen / Ausbildungen.' },
      { no: '4.04', task: 'Organisation projektspezifisches Equipment (Laptop usw.)', who: 'Vorgesetzter', day: 3, detail: 'Organisation projektspezifisches Equipment wie Laptop usw.' },
    ],
  },
  {
    title: 'Weiteres Vorgehen',
    items: [
      { no: '5.01', task: 'Aufgaben Projekt', who: 'Vorgesetzter', detail: 'Bekanntgabe der Aufgabenplanung sowie der projektspezifischen Zuständigkeiten und Verantwortlichkeiten (Pflichtenheft).' },
      { no: '5.02', task: 'Aus- und Weiterbildung', who: 'Vorgesetzter', detail: 'Der Ausbildungsplan und die Timeline sind einzuhalten. Interne und externe Trainings werden durch die Standortleitung in Absprache mit dem Team Lead bekanntgegeben und frühzeitig an den Mitarbeitenden kommuniziert. Interne Trainings sind in der wöchentlichen Planung durch den Team Lead zu berücksichtigen.' },
      { no: '5.03', task: 'Probezeitgespräch (1.5 Monate)', who: 'Vorgesetzter', detail: 'Wichtiger Meilenstein zur Bewertung des Fortschritts. Themen:\n- Ziele und Erwartungen\n- Arbeitsleistung\n- Einarbeitung und Integration\n- Stärken und Schwächen\n- Zufriedenheit und Motivation\n- Rückmeldung des Mitarbeitenden\n- Zusammenarbeit und Kommunikation' },
      { no: '5.04', task: 'Probezeitgespräch (3 Monate)', who: 'Vorgesetzter', detail: 'Wichtiger Meilenstein zur Bewertung des Fortschritts. Themen:\n- Ziele und Erwartungen\n- Arbeitsleistung\n- Einarbeitung und Integration\n- Stärken und Schwächen\n- Zufriedenheit und Motivation\n- Rückmeldung des Mitarbeitenden\n- Zusammenarbeit und Kommunikation\n- Entscheidung über die Weiterbeschäftigung und ggf. Anpassung des Arbeitsvertrags' },
    ],
  },
];

async function main() {
  // Admin als Ersteller verwenden
  const creator =
    (await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } })) ||
    (await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } }));

  if (!creator) {
    throw new Error('Kein Benutzer gefunden, dem das Template zugeordnet werden kann.');
  }

  // Bereits vorhandenes Template mit gleichem Namen entfernen (idempotent)
  const existing = await prisma.checklistTemplate.findFirst({ where: { name: TEMPLATE_NAME } });
  if (existing) {
    await prisma.checklistTemplate.delete({ where: { id: existing.id } });
    console.log(`Vorhandenes Template "${TEMPLATE_NAME}" gelöscht (${existing.id}).`);
  }

  const template = await prisma.checklistTemplate.create({
    data: {
      name: TEMPLATE_NAME,
      description:
        'Onboarding-Roadmap für neue Mitarbeitende (importiert aus der Excel-Vorlage "CL Roadmap Onboarding"). Gegliedert in die Phasen: Vor Beginn, Eine Woche vor Start, Start am Standort, Projekt Kunde und Weiteres Vorgehen.',
      type: ChecklistType.ONBOARDING,
      category: 'HR',
      responsibleRole: 'HR',
      createdById: creator.id,
    },
  });

  let order = 0;
  let count = 0;
  for (const phase of phases) {
    for (const item of phase.items) {
      const titleParts: string[] = [];
      if (item.no) titleParts.push(item.no);
      titleParts.push(item.task);
      const title = `[${phase.title}] ${titleParts.join(' ')}`;

      await prisma.checklistItem.create({
        data: {
          templateId: template.id,
          title,
          description: item.detail,
          order: order++,
          itemType: ChecklistItemType.CHECKBOX,
          required: true,
          assignedRole: item.who,
          dueDayOffset: item.day ?? undefined,
        },
      });
      count++;
    }
  }

  console.log(`Template "${TEMPLATE_NAME}" angelegt (${template.id}) mit ${count} Aufgaben in ${phases.length} Phasen.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
