import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const categories = [
    { name: 'Plumbing' },
    { name: 'Electrical' },
    { name: 'Cleaning' },
    { name: 'Carpentry' },
    { name: 'Painting' },
    { name: 'Gardening' },
    { name: 'IT Support' },
    { name: 'Tutoring' },
    { name: 'Appliance Repair' },
    { name: 'Laundry' },
  ];

  for (const category of categories) {
    await prisma.serviceCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    console.log(`Upserted category: ${category.name}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
