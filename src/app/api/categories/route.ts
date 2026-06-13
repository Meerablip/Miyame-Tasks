import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { type NextRequest } from "next/server";

// GET all categories
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = verifyToken(token);
    if (!payload) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        creator: { select: { id: true, fullName: true } },
      },
    });

    return Response.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create a new category (available to all users)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = verifyToken(token);
    if (!payload) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return Response.json(
        { error: "Category name is required." },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return Response.json(
        { error: "Category already exists." },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        creatorId: payload.userId,
      },
    });

    // Create notification for all users about new category
    const allUsers = await prisma.user.findMany({
      where: { id: { not: payload.userId } },
      select: { id: true },
    });

    if (allUsers.length > 0) {
      await prisma.notification.createMany({
        data: allUsers.map((user) => ({
          userId: user.id,
          content: `${payload.fullName} created a new category: ${name.trim()}`,
        })),
      });
    }

    return Response.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
