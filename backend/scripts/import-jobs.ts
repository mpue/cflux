import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Import der aktuellen Stellenbeschreibungen (AQUIST Schweiz GmbH) als
 * OnboardingJob-Datensätze (Tabelle onboarding_jobs / Karriere-Modul).
 *
 * Quelle: Die PDF-Stellenbeschreibungen aus dem Ordner /jobs. Die Inhalte
 * wurden strukturiert extrahiert und in HTML (TipTap-Format) überführt:
 *   - description       -> Kurzbeschreibung
 *   - responsibilities  -> Hauptverantwortlichkeiten
 *   - requirements      -> Anforderungen & Qualifikationen, Sprachen,
 *                          Arbeitserfahrung, Kompetenzen & Verhalten,
 *                          Verantwortung, Fähigkeiten & persönliche Kompetenzen
 *
 * Der Import ist idempotent: bereits vorhandene Jobs werden anhand eines
 * normalisierten Titels erkannt und aktualisiert (kein Duplikat).
 */

interface JobData {
  ref: string;
  title: string;
  department: string;
  location: string;
  description: string;
  responsibilities: string;
  requirements: string;
  sortOrder: number;
}

// Titel für den Abgleich normalisieren: Kleinschreibung, Gender-Suffixe
// (/-in, / -in, -in) und Mehrfach-Leerzeichen entfernen.
function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/\s*\/\s*-?in\b/g, '') // "/-in", "/ -in"
    .replace(/-in\b/g, '')          // "...-in"
    .replace(/[^a-zäöüß0-9]+/g, ' ')
    .trim();
}

async function main() {
  const dataPath = path.join(__dirname, 'jobs-data.json');
  const jobs: JobData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const existing = await prisma.onboardingJob.findMany();
  const byNorm = new Map<string, (typeof existing)[number]>();
  for (const job of existing) {
    byNorm.set(normalizeTitle(job.title), job);
  }

  let created = 0;
  let updated = 0;

  for (const job of jobs) {
    const data = {
      title: job.title,
      department: job.department,
      location: job.location,
      description: job.description,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      salaryCurrency: 'CHF',
      isActive: true,
      sortOrder: job.sortOrder,
    };

    const match = byNorm.get(normalizeTitle(job.title));
    if (match) {
      await prisma.onboardingJob.update({ where: { id: match.id }, data });
      updated++;
      console.log(`↻ Aktualisiert: ${job.title} (${job.ref})`);
    } else {
      await prisma.onboardingJob.create({ data });
      created++;
      console.log(`＋ Erstellt:     ${job.title} (${job.ref})`);
    }
  }

  const total = await prisma.onboardingJob.count();
  console.log(
    `\nFertig. ${created} erstellt, ${updated} aktualisiert. ` +
      `Gesamt in onboarding_jobs: ${total}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
