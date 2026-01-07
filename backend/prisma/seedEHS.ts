import { PrismaClient, EHSCategory, EHSSeverity, IncidentStatus, IncidentPriority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏥 Starting EHS test data seeding...');

  // Get first user and project
  const users = await prisma.user.findMany({ take: 5 });
  const projects = await prisma.project.findMany({ take: 3 });

  if (users.length === 0) {
    console.error('❌ No users found. Please run main seed first.');
    return;
  }

  const user = users[0];
  const project = projects.length > 0 ? projects[0] : null;

  // EHS Categories with weights (more observations, fewer fatalities)
  const categories: Array<{ category: EHSCategory; weight: number; severity: EHSSeverity }> = [
    { category: 'SAFETY_OBSERVATION', weight: 30, severity: 'LOW' },
    { category: 'UNSAFE_CONDITION', weight: 25, severity: 'LOW' },
    { category: 'UNSAFE_BEHAVIOR', weight: 20, severity: 'MEDIUM' },
    { category: 'NEAR_MISS', weight: 10, severity: 'MEDIUM' },
    { category: 'FIRST_AID', weight: 8, severity: 'MEDIUM' },
    { category: 'RECORDABLE', weight: 4, severity: 'HIGH' },
    { category: 'PROPERTY_DAMAGE', weight: 2, severity: 'MEDIUM' },
    { category: 'LTI', weight: 1, severity: 'HIGH' },
    { category: 'ENVIRONMENT', weight: 0.5, severity: 'HIGH' },
    { category: 'FATALITY', weight: 0.1, severity: 'CRITICAL' },
  ];

  // Incident titles and descriptions by category
  const incidents: Record<EHSCategory, Array<{ title: string; description: string }>> = {
    SAFETY_OBSERVATION: [
      { title: 'Fehlende PSA beobachtet', description: 'Mitarbeiter ohne Schutzhelm auf Baustelle gesehen.' },
      { title: 'Unordnung im Lager', description: 'Materialien blockieren Notausgang.' },
      { title: 'Rutschige Oberfläche', description: 'Verschüttetes Öl noch nicht gereinigt.' },
      { title: 'Defekte Beleuchtung', description: 'Lampe im Lagerbereich flackert.' },
    ],
    UNSAFE_CONDITION: [
      { title: 'Beschädigtes Geländer', description: 'Geländer an Treppe wackelt und ist nicht sicher.' },
      { title: 'Freiliegende Kabel', description: 'Stromkabel ohne Abdeckung im Durchgangsbereich.' },
      { title: 'Undichte Stelle', description: 'Wasser tropft von der Decke auf Arbeitsbereich.' },
      { title: 'Defekte Maschine', description: 'Notaus-Button funktioniert nicht.' },
    ],
    UNSAFE_BEHAVIOR: [
      { title: 'Arbeiten ohne Sicherung', description: 'Mitarbeiter arbeitet in Höhe ohne Absturzsicherung.' },
      { title: 'Ignorieren von Warnzeichen', description: 'Person betritt Sperrbereich trotz Hinweis.' },
      { title: 'Übermüdung am Arbeitsplatz', description: 'Mitarbeiter schläft während Schicht ein.' },
      { title: 'Fehlende Schutzausrüstung', description: 'Schweißarbeiten ohne Schutzbrille.' },
    ],
    NEAR_MISS: [
      { title: 'Beinahe-Sturz', description: 'Mitarbeiter stolpert über Kabel, kann sich aber fangen.' },
      { title: 'Herabfallender Gegenstand', description: 'Werkzeug fällt aus 3m Höhe, verfehlt Person knapp.' },
      { title: 'Fast-Kollision', description: 'Stapler und Fußgänger vermeiden Zusammenstoß knapp.' },
      { title: 'Chemikalienaustritt verhindert', description: 'Behälter kippt fast um, wird rechtzeitig gesichert.' },
    ],
    FIRST_AID: [
      { title: 'Schnittverletzung', description: 'Kleine Schnittwunde an Hand, mit Pflaster versorgt.' },
      { title: 'Verstauchung', description: 'Knöchel verstaucht beim Umknicken.' },
      { title: 'Kopfschmerzen', description: 'Mitarbeiter klagt über starke Kopfschmerzen.' },
      { title: 'Leichte Verbrennung', description: 'Finger an heißer Oberfläche verbrannt.' },
    ],
    RECORDABLE: [
      { title: 'Tiefe Schnittwunde', description: 'Schnittverletzung erfordert ärztliche Versorgung und Nähen.' },
      { title: 'Prellung nach Sturz', description: 'Sturz von Leiter, starke Prellungen an Rippen.' },
      { title: 'Verbrennungen 2. Grades', description: 'Kontakt mit heißem Dampf, Blasenbildung.' },
      { title: 'Gehörverletzung', description: 'Lärmtrauma durch lauten Knall ohne Gehörschutz.' },
    ],
    LTI: [
      { title: 'Beinbruch', description: 'Unterschenkelbruch nach Sturz, 6 Wochen Arbeitsunfähigkeit.' },
      { title: 'Rückenverletzung', description: 'Bandscheibenvorfall beim Heben, längere Ausfallzeit.' },
      { title: 'Handverletzung', description: 'Quetschung der Hand in Maschine, Operation erforderlich.' },
    ],
    PROPERTY_DAMAGE: [
      { title: 'Gabelstapler-Kollision', description: 'Stapler beschädigt Regalsystem, 15.000 CHF Schaden.' },
      { title: 'Wasserschaden', description: 'Rohrbruch überschwemmt Lager, Materialien beschädigt.' },
      { title: 'Fahrzeugschaden', description: 'Firmenwagen bei Rangiervorgang beschädigt.' },
    ],
    ENVIRONMENT: [
      { title: 'Ölverschmutzung', description: '20 Liter Öl ausgelaufen auf Boden und Kanalisation.' },
      { title: 'Chemikalienfreisetzung', description: 'Lösungsmittel ausgetreten, Bodenverunreinigung.' },
    ],
    FATALITY: [
      { title: 'Tödlicher Arbeitsunfall', description: 'Schwerer Unfall mit Todesfolge.' },
    ],
  };

  const locations = ['Produktionshalle A', 'Lager 2', 'Bürogebäude', 'Außenbereich', 'Werkstatt'];
  
  let createdCount = 0;

  // Generate incidents for last 12 months
  const now = new Date();
  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - monthOffset);
    
    // Determine number of incidents for this month based on weights
    const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
    
    for (const catInfo of categories) {
      const count = Math.floor((catInfo.weight / totalWeight) * 50); // ~50 incidents per month
      const incidentList = incidents[catInfo.category];
      
      for (let i = 0; i < count; i++) {
        const randomIncident = incidentList[Math.floor(Math.random() * incidentList.length)];
        const incidentDate = new Date(date);
        incidentDate.setDate(Math.floor(Math.random() * 28) + 1);
        
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const assignedUser = Math.random() > 0.3 ? users[Math.floor(Math.random() * users.length)] : null;
        
        const status: IncidentStatus = 
          Math.random() > 0.7 ? 'CLOSED' :
          Math.random() > 0.5 ? 'IN_PROGRESS' :
          Math.random() > 0.3 ? 'RESOLVED' : 'OPEN';
        
        const workersOnDay = Math.floor(Math.random() * 50) + 10;
        const hoursWorkedDay = Math.floor(Math.random() * 3) + 7; // 7-10 hours
        
        await prisma.incident.create({
          data: {
            title: `${randomIncident.title} (${incidentDate.toLocaleDateString('de-DE')})`,
            description: randomIncident.description,
            priority: catInfo.severity === 'CRITICAL' ? 'CRITICAL' : 
                     catInfo.severity === 'HIGH' ? 'HIGH' :
                     catInfo.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW',
            status,
            reportedById: randomUser.id,
            assignedToId: assignedUser?.id,
            projectId: project?.id,
            category: catInfo.category,
            
            // EHS specific fields
            isEHSRelevant: true,
            ehsCategory: catInfo.category,
            ehsSeverity: catInfo.severity,
            incidentDate,
            location: locations[Math.floor(Math.random() * locations.length)],
            workersOnDay,
            hoursWorkedDay,
            
            // LTI specific fields
            lostWorkDays: catInfo.category === 'LTI' ? Math.floor(Math.random() * 30) + 14 : 
                         catInfo.category === 'RECORDABLE' ? Math.floor(Math.random() * 7) + 1 : null,
            medicalTreatment: ['RECORDABLE', 'LTI', 'FATALITY'].includes(catInfo.category),
            hospitalRequired: ['LTI', 'FATALITY'].includes(catInfo.category),
            
            // Actions
            correctiveActions: status === 'CLOSED' || status === 'RESOLVED' 
              ? 'Sofortmaßnahmen durchgeführt, Mitarbeiter geschult.'
              : null,
            preventiveActions: status === 'CLOSED' || status === 'RESOLVED'
              ? 'Sicherheitsverfahren aktualisiert, zusätzliche Beschilderung angebracht.'
              : null,
            
            reportedAt: incidentDate,
            resolvedAt: status === 'RESOLVED' || status === 'CLOSED' 
              ? new Date(incidentDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
              : null,
            closedAt: status === 'CLOSED'
              ? new Date(incidentDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000)
              : null,
          },
        });
        
        createdCount++;
      }
    }
    
    console.log(`✅ Created incidents for ${date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })}`);
  }

  console.log(`\n🎉 Successfully created ${createdCount} EHS incidents!`);
  
  // Summary by category
  console.log('\n📊 Incidents by category:');
  for (const catInfo of categories) {
    const count = await prisma.incident.count({
      where: { ehsCategory: catInfo.category },
    });
    console.log(`   ${catInfo.category}: ${count}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding EHS data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
