import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProjectDemoData() {
  console.log('🌱 Seeding Project Demo Data...');

  try {
    // Hole alle aktiven Benutzer
    const users = await prisma.user.findMany({
      where: { isActive: true },
      take: 10,
    });

    if (users.length === 0) {
      console.log('❌ Keine Benutzer gefunden. Bitte zuerst Benutzer anlegen.');
      return;
    }

    console.log(`✓ ${users.length} Benutzer gefunden`);

    // Projekte erstellen
    const projects = [
      {
        name: 'Website Relaunch',
        description: 'Neugestaltung der Unternehmenswebsite mit modernem Design',
        status: 'ACTIVE' as const,
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-04-30'),
        progress: 45,
        defaultHourlyRate: 120.0,
      },
      {
        name: 'ERP System Migration',
        description: 'Migration von altem ERP-System zu neuem Cloud-basierten System',
        status: 'ACTIVE' as const,
        startDate: new Date('2025-12-01'),
        endDate: new Date('2026-06-30'),
        progress: 30,
        defaultHourlyRate: 150.0,
      },
      {
        name: 'Mobile App Entwicklung',
        description: 'Entwicklung einer nativen iOS und Android App',
        status: 'PLANNING' as const,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-09-30'),
        progress: 10,
        defaultHourlyRate: 130.0,
      },
      {
        name: 'Kundenportal',
        description: 'Self-Service Portal für Kunden',
        status: 'ACTIVE' as const,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-05-31'),
        progress: 60,
        defaultHourlyRate: 110.0,
      },
      {
        name: 'Security Audit',
        description: 'Umfassende Sicherheitsüberprüfung aller Systeme',
        status: 'COMPLETED' as const,
        startDate: new Date('2025-11-01'),
        endDate: new Date('2026-01-31'),
        progress: 100,
        defaultHourlyRate: 180.0,
      },
    ];

    const createdProjects = [];
    for (const projectData of projects) {
      const project = await prisma.project.create({
        data: projectData,
      });
      createdProjects.push(project);
      console.log(`✓ Projekt erstellt: ${project.name}`);
    }

    // Benutzer zu Projekten zuordnen
    let assignmentCount = 0;
    for (const project of createdProjects) {
      // Zufällige 3-5 Benutzer pro Projekt
      const numUsers = Math.floor(Math.random() * 3) + 3; // 3-5
      const selectedUsers = users.sort(() => 0.5 - Math.random()).slice(0, numUsers);

      for (const user of selectedUsers) {
        await prisma.projectAssignment.create({
          data: {
            userId: user.id,
            projectId: project.id,
          },
        });
        assignmentCount++;
      }
    }
    console.log(`✓ ${assignmentCount} Projekt-Zuordnungen erstellt`);

    // Zeitbuchungen erstellen für die letzten 30 Tage
    let timeEntryCount = 0;
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const project of createdProjects) {
      // Hole zugeordnete Benutzer
      const assignments = await prisma.projectAssignment.findMany({
        where: { projectId: project.id },
        include: { user: true },
      });

      // Erstelle für jeden Benutzer mehrere Zeitbuchungen
      for (const assignment of assignments) {
        // Prüfe ob User ein Employee-Profil hat
        const employee = await prisma.employee.findFirst({
          where: { userId: assignment.userId },
        });

        if (!employee) {
          console.log(`⚠ Benutzer ${assignment.userId} hat kein Employee-Profil, überspringe`);
          continue;
        }

        const numEntries = Math.floor(Math.random() * 10) + 5; // 5-15 Einträge

        for (let i = 0; i < numEntries; i++) {
          // Zufälliges Datum in den letzten 30 Tagen
          const randomDaysAgo = Math.floor(Math.random() * 30);
          const date = new Date(today);
          date.setDate(date.getDate() - randomDaysAgo);

          // Arbeitstage (Mo-Fr)
          if (date.getDay() === 0 || date.getDay() === 6) continue;

          // Zufällige Arbeitszeit zwischen 2 und 8 Stunden
          const hours = Math.floor(Math.random() * 7) + 2; // 2-8 Stunden
          const startHour = Math.floor(Math.random() * 4) + 8; // 8-11 Uhr

          const clockIn = new Date(date);
          clockIn.setHours(startHour, 0, 0, 0);

          const clockOut = new Date(clockIn);
          clockOut.setHours(clockIn.getHours() + hours, 0, 0, 0);

          const pauseMinutes = hours > 5 ? 60 : 30; // 1h Pause bei > 5h, sonst 30min

          try {
            const timeEntry = await prisma.timeEntry.create({
              data: {
                employeeId: employee.id,
                projectId: project.id,
                clockIn,
                clockOut,
                pauseMinutes,
                description: `Arbeit an ${project.name}`,
                status: 'CLOCKED_OUT',
              },
            });

            // Zeit dem Projekt zuordnen
            const workedHours = (hours * 60 - pauseMinutes) / 60;
            await prisma.projectTimeAllocation.create({
              data: {
                timeEntryId: timeEntry.id,
                projectId: project.id,
                hours: workedHours,
                description: `Projektarbeit`,
              },
            });

            timeEntryCount++;
          } catch (error) {
            // Ignoriere Duplikate (gleicher Employee, gleicher Tag)
          }
        }
      }
    }
    console.log(`✓ ${timeEntryCount} Zeitbuchungen erstellt`);

    console.log('✅ Project Demo Data erfolgreich geseedet!');
    console.log(`
    Zusammenfassung:
    - ${createdProjects.length} Projekte
    - ${assignmentCount} Projekt-Zuordnungen
    - ${timeEntryCount} Zeitbuchungen
    `);

  } catch (error) {
    console.error('❌ Fehler beim Seeden der Projekt-Demo-Daten:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedProjectDemoData();
