import { prisma } from "@/lib/prisma";

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

export async function POST() {
  try {
    let created = 0;
    for (const name of defaultCategories) {
      const existing = await prisma.category.findUnique({ where: { name } });
      if (!existing) {
        await prisma.category.create({ data: { name } });
        created++;
      }
    }

    return Response.json({
      message: `Seeded ${created} new categories. ${defaultCategories.length - created} already existed.`,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
