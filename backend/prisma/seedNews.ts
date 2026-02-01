import { PrismaClient, NewsPriority } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNews() {
  console.log('🗞️  Seeding News Sources and Items...');

  try {
    // 1. Interne Firmen-News Quelle
    const internalSource = await prisma.newsSource.create({
      data: {
        name: 'Firmen News',
        type: 'INTERNAL',
        isActive: true,
        displayOnDashboard: true,
        priority: 100,
        icon: 'fas fa-building',
        color: '#3b82f6',
      },
    });

    // 2. HR News Quelle
    const hrSource = await prisma.newsSource.create({
      data: {
        name: 'HR Updates',
        type: 'MANUAL',
        isActive: true,
        displayOnDashboard: true,
        priority: 80,
        icon: 'fas fa-users',
        color: '#10b981',
      },
    });

    // 3. Tech News (RSS Beispiel)
    const techSource = await prisma.newsSource.create({
      data: {
        name: 'Tech News',
        type: 'RSS',
        url: 'https://news.ycombinator.com/rss',
        refreshInterval: 7200, // 2 Stunden
        isActive: true,
        displayOnDashboard: true,
        priority: 50,
        icon: 'fas fa-laptop-code',
        color: '#6366f1',
      },
    });

    console.log('✅ News Sources created');

    // Beispiel News Items erstellen
    const newsItems = [
      {
        sourceId: internalSource.id,
        title: 'Willkommen im neuen CFlux System!',
        content: `<p>Wir freuen uns, das neue CFlux Time Tracking System vorzustellen! Mit zahlreichen neuen Features und Verbesserungen wird die Zeiterfassung noch einfacher und übersichtlicher.</p>
<p><strong>Neue Features:</strong></p>
<ul>
<li>News-Widget auf dem Dashboard</li>
<li>Verbesserte Projektplanung</li>
<li>Erweiterte Reporting-Funktionen</li>
<li>Dark Mode Support</li>
</ul>
<p>Bei Fragen steht euch das IT-Team jederzeit zur Verfügung!</p>`,
        excerpt: 'Das neue CFlux System ist jetzt verfügbar mit vielen neuen Features!',
        priority: NewsPriority.HIGH,
        isPinned: true,
        isActive: true,
        author: 'IT Team',
        tags: ['Update', 'System', 'Features'],
      },
      {
        sourceId: hrSource.id,
        title: 'Neue Mitarbeiter - Herzlich Willkommen!',
        content: `<p>Wir begrüßen drei neue Mitarbeiter in unserem Team:</p>
<ul>
<li><strong>Anna Schmidt</strong> - Marketing Manager</li>
<li><strong>Thomas Müller</strong> - Software Developer</li>
<li><strong>Sarah Weber</strong> - HR Specialist</li>
</ul>
<p>Wir wünschen allen einen erfolgreichen Start und freuen uns auf die Zusammenarbeit!</p>`,
        excerpt: 'Drei neue Kollegen starten diese Woche bei uns.',
        priority: NewsPriority.NORMAL,
        isPinned: false,
        isActive: true,
        author: 'HR Abteilung',
        tags: ['Onboarding', 'Team', 'Willkommen'],
      },
      {
        sourceId: hrSource.id,
        title: 'Urlaubsplanung 2026 - Jetzt eintragen!',
        content: `<p>Die Urlaubsplanung für 2026 ist jetzt geöffnet!</p>
<p>Bitte tragt eure geplanten Urlaubstage bis Ende Februar in das System ein. Frühzeitige Planung hilft uns, eine optimale Teambesetzung sicherzustellen.</p>
<p><strong>Wichtige Hinweise:</strong></p>
<ul>
<li>Resturlaub aus 2025 bis 31. März 2026 nehmen</li>
<li>Brückentage frühzeitig anfragen</li>
<li>Sommerurlaub am besten im ersten Quartal planen</li>
</ul>`,
        excerpt: 'Urlaubsplanung für 2026 ist geöffnet - bis Ende Februar eintragen!',
        priority: NewsPriority.HIGH,
        isPinned: true,
        isActive: true,
        author: 'HR Team',
        tags: ['Urlaub', 'Planung', 'Deadline'],
        expiresAt: new Date('2026-03-01'),
      },
      {
        sourceId: internalSource.id,
        title: 'Betriebsausflug im Frühling',
        content: `<p>Save the Date! 🎉</p>
<p>Unser diesjähriger Betriebsausflug findet am <strong>15. Mai 2026</strong> statt.</p>
<p>Wir fahren gemeinsam in die Berge und verbringen einen Tag mit Wandern, Teambuilding-Aktivitäten und einem gemütlichen Grillabend.</p>
<p>Weitere Details folgen in den nächsten Wochen. Bitte den Termin schon mal vormerken!</p>`,
        excerpt: 'Betriebsausflug am 15. Mai 2026 - jetzt vormerken!',
        priority: NewsPriority.NORMAL,
        isPinned: false,
        isActive: true,
        author: 'Management',
        tags: ['Event', 'Team', 'Freizeit'],
        expiresAt: new Date('2026-05-16'),
      },
      {
        sourceId: internalSource.id,
        title: 'Neue Pausenraum-Ausstattung',
        content: `<p>Unser Pausenraum wurde komplett neu ausgestattet!</p>
<p><strong>Neue Ausstattung:</strong></p>
<ul>
<li>Kaffeevollautomat mit verschiedenen Kaffeespezialitäten</li>
<li>Gemütliche Sitzmöbel</li>
<li>PlayStation 5 mit großem TV</li>
<li>Tischkicker</li>
<li>Obst- und Snack-Bar</li>
</ul>
<p>Der Pausenraum steht allen Mitarbeitern zur Verfügung. Bitte haltet ihn sauber und behandelt die Geräte pfleglich.</p>`,
        excerpt: 'Neuer Pausenraum mit Kaffeevollautomat, PlayStation 5 und mehr!',
        priority: NewsPriority.NORMAL,
        isPinned: false,
        isActive: true,
        author: 'Facility Management',
        tags: ['Ausstattung', 'Pausenraum', 'Benefits'],
      },
      {
        sourceId: hrSource.id,
        title: 'Weiterbildungsbudget 2026',
        content: `<p>Auch dieses Jahr steht jedem Mitarbeiter ein Weiterbildungsbudget zur Verfügung!</p>
<p><strong>Details:</strong></p>
<ul>
<li>€ 1.500 pro Mitarbeiter und Jahr</li>
<li>Für Kurse, Zertifizierungen, Konferenzen, etc.</li>
<li>Antrag über das HR-Portal stellen</li>
<li>Genehmigung erfolgt in der Regel innerhalb von 5 Werktagen</li>
</ul>
<p>Nutzt diese Chance zur persönlichen und beruflichen Weiterentwicklung!</p>`,
        excerpt: 'Weiterbildungsbudget 2026: € 1.500 pro Mitarbeiter verfügbar',
        priority: NewsPriority.HIGH,
        isPinned: false,
        isActive: true,
        author: 'HR Abteilung',
        tags: ['Weiterbildung', 'Budget', 'Benefits'],
      },
      {
        sourceId: internalSource.id,
        title: 'Systemwartung am Wochenende',
        content: `<p><strong>Wichtiger Hinweis:</strong></p>
<p>Am Samstag, 8. Februar 2026, von 22:00 bis 02:00 Uhr findet eine planmäßige Systemwartung statt.</p>
<p>In diesem Zeitraum sind folgende Systeme nicht verfügbar:</p>
<ul>
<li>CFlux Zeiterfassung</li>
<li>E-Mail-Server</li>
<li>Dateiserver</li>
<li>Intranet</li>
</ul>
<p>Wir bitten um Verständnis für die Unannehmlichkeiten.</p>`,
        excerpt: 'Systemwartung am 8. Februar, 22:00-02:00 Uhr',
        priority: NewsPriority.URGENT,
        isPinned: true,
        isActive: true,
        author: 'IT Team',
        tags: ['Wartung', 'Downtime', 'IT'],
        expiresAt: new Date('2026-02-09'),
      },
    ];

    for (const itemData of newsItems) {
      await prisma.newsItem.create({
        data: itemData,
      });
    }

    console.log(`✅ Created ${newsItems.length} news items`);

    console.log('\n✅ News seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding news:', error);
    throw error;
  }
}

async function main() {
  console.log('Starting news seed...\n');

  try {
    await seedNews();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
