import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Intranet module data...');

  // Finde den Admin-Benutzer
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!admin) {
    console.error('❌ No admin user found. Please run the main seed first.');
    process.exit(1);
  }

  // Erstelle Root-Ordner
  const welcomeFolder = await prisma.documentNode.create({
    data: {
      title: 'Willkommen',
      type: 'FOLDER',
      content: '',
      order: 0,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  const policiesFolder = await prisma.documentNode.create({
    data: {
      title: 'Richtlinien & Prozesse',
      type: 'FOLDER',
      content: '',
      order: 1,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  const resourcesFolder = await prisma.documentNode.create({
    data: {
      title: 'Ressourcen',
      type: 'FOLDER',
      content: '',
      order: 2,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  const teamFolder = await prisma.documentNode.create({
    data: {
      title: 'Team & Organisation',
      type: 'FOLDER',
      content: '',
      order: 3,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  console.log('✅ Created root folders');

  // Erstelle Willkommens-Dokument
  const welcomeDoc = await prisma.documentNode.create({
    data: {
      title: 'Herzlich Willkommen im Intranet',
      type: 'DOCUMENT',
      content: `# Herzlich Willkommen im Intranet!

Liebe Kolleginnen und Kollegen,

willkommen im CFlux Intranet – Ihrer zentralen Anlaufstelle für alle wichtigen Informationen, Dokumente und Ressourcen unseres Unternehmens.

## Was finden Sie hier?

**Richtlinien & Prozesse**
Hier finden Sie alle wichtigen Unternehmensrichtlinien, Arbeitsanweisungen und Prozessbeschreibungen.

**Ressourcen**
Vorlagen, Formulare, IT-Dokumentationen und weitere nützliche Ressourcen für Ihre tägliche Arbeit.

**Team & Organisation**
Informationen zu unserem Team, Organigrammen und Kontaktdaten.

## Neue Dokumente erstellen

Mit dem Button "Neues Dokument" können Sie selbst Dokumente erstellen und bearbeiten. Alle Änderungen werden automatisch versioniert.

## Benötigen Sie Hilfe?

Bei Fragen zum Intranet wenden Sie sich bitte an die IT-Abteilung.

Viel Erfolg bei der Arbeit!
Ihr CFlux Team`,
      order: 0,
      parentId: welcomeFolder.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  // Erstelle erste Version
  await prisma.documentVersion.create({
    data: {
      documentNodeId: welcomeDoc.id,
      content: welcomeDoc.content,
      version: 1,
      createdById: admin.id,
    },
  });

  console.log('✅ Created welcome document');

  // Erstelle Richtlinien-Dokumente
  const hrPolicy = await prisma.documentNode.create({
    data: {
      title: 'Personalrichtlinien',
      type: 'DOCUMENT',
      content: `# Personalrichtlinien

## Arbeitszeiten

Die regulären Arbeitszeiten sind Montag bis Freitag von 08:00 bis 17:00 Uhr mit einer Mittagspause von mindestens 30 Minuten.

## Urlaubsregelung

- Mitarbeiter haben Anspruch auf 25 Tage Urlaub pro Jahr
- Urlaubsanträge müssen mindestens 2 Wochen im Voraus eingereicht werden
- Die Genehmigung erfolgt durch den direkten Vorgesetzten

## Homeoffice

- Homeoffice ist nach Absprache mit dem Vorgesetzten möglich
- Mindestens 2 Tage pro Woche sollten im Büro verbracht werden
- Die volle Erreichbarkeit muss gewährleistet sein

## Krankheit

Bei Krankheit ist der Vorgesetzte unverzüglich zu informieren. Ab dem 3. Tag ist ein ärztliches Attest erforderlich.`,
      order: 0,
      parentId: policiesFolder.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.documentVersion.create({
    data: {
      documentNodeId: hrPolicy.id,
      content: hrPolicy.content,
      version: 1,
      createdById: admin.id,
    },
  });

  const itPolicy = await prisma.documentNode.create({
    data: {
      title: 'IT-Nutzungsrichtlinien',
      type: 'DOCUMENT',
      content: `# IT-Nutzungsrichtlinien

## Allgemeine Regeln

- Firmeneigene IT-Geräte dürfen nur für geschäftliche Zwecke verwendet werden
- Passwörter müssen mindestens 12 Zeichen lang sein und regelmäßig geändert werden
- Verdächtige E-Mails sind der IT-Abteilung zu melden

## Software-Installation

Software darf nur nach Genehmigung durch die IT-Abteilung installiert werden.

## Datensicherheit

- Vertrauliche Daten dürfen nur verschlüsselt übertragen werden
- USB-Sticks und externe Festplatten müssen vor Verwendung überprüft werden
- Bildschirme sind beim Verlassen des Arbeitsplatzes zu sperren

## BYOD (Bring Your Own Device)

Private Geräte dürfen nur nach Registrierung bei der IT verwendet werden.`,
      order: 1,
      parentId: policiesFolder.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.documentVersion.create({
    data: {
      documentNodeId: itPolicy.id,
      content: itPolicy.content,
      version: 1,
      createdById: admin.id,
    },
  });

  console.log('✅ Created policy documents');

  // Erstelle Ressourcen-Dokumente
  const templatesFolder = await prisma.documentNode.create({
    data: {
      title: 'Vorlagen',
      type: 'FOLDER',
      content: '',
      order: 0,
      parentId: resourcesFolder.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  const expenseReport = await prisma.documentNode.create({
    data: {
      title: 'Reisekostenabrechnung - Anleitung',
      type: 'DOCUMENT',
      content: `# Reisekostenabrechnung

## Schritt-für-Schritt Anleitung

1. **Reise im System erfassen**
   - Gehen Sie zu "Reisekosten" im Menü
   - Klicken Sie auf "Neue Reise"
   - Geben Sie Datum, Zweck und Ziel ein

2. **Belege hochladen**
   - Fotografieren oder scannen Sie alle Belege
   - Laden Sie diese im System hoch
   - Ordnen Sie jeden Beleg der entsprechenden Ausgabe zu

3. **Abrechnung einreichen**
   - Überprüfen Sie alle Angaben
   - Reichen Sie die Abrechnung zur Genehmigung ein
   - Sie erhalten eine Benachrichtigung bei Genehmigung

## Erstattungsfähige Kosten

- Fahrtkosten (Auto: 0.70 CHF/km, ÖV: Effektive Kosten)
- Verpflegung (gemäß Spesensätzen)
- Übernachtung (nach Absprache)

## Fristen

Abrechnungen müssen innerhalb von 30 Tagen nach Reiseende eingereicht werden.`,
      order: 0,
      parentId: templatesFolder.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.documentVersion.create({
    data: {
      documentNodeId: expenseReport.id,
      content: expenseReport.content,
      version: 1,
      createdById: admin.id,
    },
  });

  console.log('✅ Created resource documents');

  // Erstelle Team-Dokumente
  const orgChart = await prisma.documentNode.create({
    data: {
      title: 'Organigramm',
      type: 'DOCUMENT',
      content: `# Unternehmensstruktur

## Geschäftsleitung

**Max Mustermann** - CEO
- Email: max.mustermann@cflux.ch
- Tel: +41 44 123 45 67

## Abteilungen

### Entwicklung
- **Teamleiter:** Thomas Müller
- 5 Mitarbeiter
- Zuständig für Software-Entwicklung und -Wartung

### Vertrieb
- **Teamleiterin:** Anna Schmidt
- 3 Mitarbeiter
- Kundenakquise und Betreuung

### Support
- **Teamleiter:** Michael Wagner
- 4 Mitarbeiter
- Technischer Kundensupport

### Administration
- **Teamleiterin:** Julia Weber
- 2 Mitarbeiter
- HR, Buchhaltung, allgemeine Verwaltung`,
      order: 0,
      parentId: teamFolder.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.documentVersion.create({
    data: {
      documentNodeId: orgChart.id,
      content: orgChart.content,
      version: 1,
      createdById: admin.id,
    },
  });

  const contacts = await prisma.documentNode.create({
    data: {
      title: 'Wichtige Kontakte',
      type: 'DOCUMENT',
      content: `# Wichtige Kontakte

## Notfallkontakte

**Geschäftsführung**
- Max Mustermann: +41 79 123 45 67

**IT-Support**
- Helpdesk: +41 44 123 45 68
- Email: support@cflux.ch
- Verfügbarkeit: Mo-Fr 08:00-18:00

**HR / Personalwesen**
- Julia Weber: +41 44 123 45 69
- Email: hr@cflux.ch

## Externe Kontakte

**Gebäudeverwaltung**
- Tel: +41 44 987 65 43

**Facility Management**
- Tel: +41 44 987 65 44

**Reinigungsdienst**
- Tel: +41 44 987 65 45

## Im Notfall

**Feuerwehr:** 118
**Polizei:** 117
**Sanitätsnotruf:** 144`,
      order: 1,
      parentId: teamFolder.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.documentVersion.create({
    data: {
      documentNodeId: contacts.id,
      content: contacts.content,
      version: 1,
      createdById: admin.id,
    },
  });

  console.log('✅ Created team documents');

  console.log('✅ Intranet seeding completed!');
  console.log('\nCreated structure:');
  console.log('📁 Willkommen');
  console.log('  📄 Herzlich Willkommen im Intranet');
  console.log('📁 Richtlinien & Prozesse');
  console.log('  📄 Personalrichtlinien');
  console.log('  📄 IT-Nutzungsrichtlinien');
  console.log('📁 Ressourcen');
  console.log('  📁 Vorlagen');
  console.log('    📄 Reisekostenabrechnung - Anleitung');
  console.log('📁 Team & Organisation');
  console.log('  📄 Organigramm');
  console.log('  📄 Wichtige Kontakte');
}

main()
  .catch((e) => {
    console.error('❌ Error during intranet seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
