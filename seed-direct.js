const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({});

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
    const existing = await prisma.category.findUnique({ where: { name } });
    if (!existing) {
      await prisma.category.create({ data: { name } });
      console.log(`Created category: ${name}`);
    }
  }
  console.log("Seeding complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
