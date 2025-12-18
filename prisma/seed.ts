import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs'; // Import bcryptjs

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Seed Service Categories
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

  // Seed Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      role: ['admin'], // Assign the 'admin' role
      isApproved: true,
    },
  });
  console.log(`Upserted admin user: ${adminUser.email}`);

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

