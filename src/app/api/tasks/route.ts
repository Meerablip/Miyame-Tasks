import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { type NextRequest } from "next/server";

// GET tasks for the current user for a given date
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

    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    const category = searchParams.get("category");
    const site = searchParams.get("site");

    // Build filter
    const where: Record<string, unknown> = {};

    // If Employee, restrict to their own tasks.
    // If Director, allow filtering by assigneeId, otherwise show all.
    if (payload.role === "EMPLOYEE") {
      where.assigneeId = payload.userId;
    } else if (payload.role === "DIRECTOR") {
      const assigneeId = searchParams.get("assigneeId");
      if (assigneeId) {
        where.assigneeId = assigneeId;
      }
    }

    if (dateStr) {
      const start = new Date(dateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateStr);
      end.setHours(23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    }

    if (category) {
      where.categoryId = category;
    }

    if (site) {
      where.siteId = site;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        category: true,
        site: true,
        assigner: {
          select: { id: true, fullName: true, role: true },
        },
        comments: {
          include: {
            author: { select: { id: true, fullName: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [
        { priority: "desc" },
        { isCompleted: "asc" },
        { orderIndex: "asc" },
        { createdAt: "asc" },
      ],
    });

    return Response.json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create a new task
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
    const { name, description, date, alarm, priority, categoryId, siteId } = body;

    if (!name || !categoryId || !siteId || !date) {
      return Response.json(
        { error: "Name, category, site, and date are required." },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        name,
        description: description || null,
        date: new Date(date),
        alarm: alarm ? new Date(alarm) : null,
        priority: priority || false,
        categoryId,
        siteId,
        assigneeId: payload.role === "DIRECTOR" && body.assigneeId ? body.assigneeId : payload.userId,
        assignerId: payload.role === "DIRECTOR" ? payload.userId : null,
      },
      include: {
        category: true,
        site: true,
      },
    });

    return Response.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
