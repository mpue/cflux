import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Document Node Types...');

  // Intranet Types
  await prisma.documentNodeTypeRegistry.upsert({
    where: { typeKey: 'intranet_page' },
    update: {},
    create: {
      typeKey: 'intranet_page',
      displayName: 'Intranet-Seite',
      icon: '📄',
      module: 'intranet',
      isActive: true,
    },
  });

  await prisma.documentNodeTypeRegistry.upsert({
    where: { typeKey: 'intranet_link' },
    update: {},
    create: {
      typeKey: 'intranet_link',
      displayName: 'Externer Link',
      icon: '🔗',
      module: 'intranet',
      isActive: true,
    },
  });

  await prisma.documentNodeTypeRegistry.upsert({
    where: { typeKey: 'intranet_folder' },
    update: {},
    create: {
      typeKey: 'intranet_folder',
      displayName: 'Ordner',
      icon: '📁',
      module: 'intranet',
      isActive: true,
    },
  });

  // Wiki Types (for future use)
  await prisma.documentNodeTypeRegistry.upsert({
    where: { typeKey: 'wiki_article' },
    update: {},
    create: {
      typeKey: 'wiki_article',
      displayName: 'Wiki-Artikel',
      icon: '📖',
      module: 'wiki',
      isActive: false,
    },
  });

  await prisma.documentNodeTypeRegistry.upsert({
    where: { typeKey: 'wiki_category' },
    update: {},
    create: {
      typeKey: 'wiki_category',
      displayName: 'Wiki-Kategorie',
      icon: '📚',
      module: 'wiki',
      isActive: false,
    },
  });

  // Process Documentation Types (for future use)
  await prisma.documentNodeTypeRegistry.upsert({
    where: { typeKey: 'process_doc' },
    update: {},
    create: {
      typeKey: 'process_doc',
      displayName: 'Prozessdokumentation',
      icon: '📋',
      module: 'process',
      isActive: false,
    },
  });

  console.log('✅ Document Node Types seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding document types:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
