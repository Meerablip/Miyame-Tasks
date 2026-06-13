import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { type NextRequest } from "next/server";

// GET all sites
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

    const sites = await prisma.site.findMany({
      orderBy: { name: "asc" },
      include: {
        creator: { select: { id: true, fullName: true } },
      },
    });

    return Response.json({ sites });
  } catch (error) {
    console.error("Get sites error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create a new site (Director only per design spec 2, point 7)
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

    // Only directors can create sites
    if (payload.role !== "DIRECTOR") {
      return Response.json(
        { error: "Only directors can create sites." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return Response.json(
        { error: "Site name is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.site.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return Response.json(
        { error: "Site already exists." },
        { status: 409 }
      );
    }

    const site = await prisma.site.create({
      data: {
        name: name.trim(),
        creatorId: payload.userId,
      },
    });

    return Response.json({ site }, { status: 201 });
  } catch (error) {
    console.error("Create site error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
