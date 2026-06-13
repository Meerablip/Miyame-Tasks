// Seed script for default categories
// Run with: node prisma/seed.mjs

import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

const defaultCategories = [
  "Finance",
  "Purchase",
  "Delivery",
  "Administration",
  "HR",
  "Operations",
  "Marketing",
  "Maintenance",
];

async function main() {
  console.log("Seeding default categories...");

  for (const name of defaultCategories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Seeded ${defaultCategories.length} default categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
