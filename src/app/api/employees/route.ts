import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { type NextRequest } from "next/server";

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

    // Usually we might check if user is DIRECTOR here, but fetching employees might be useful for all.
    // For now, let's just return all employees.
    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ employees });
  } catch (error) {
    console.error("Fetch employees error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
