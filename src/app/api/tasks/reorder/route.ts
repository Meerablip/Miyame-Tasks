import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
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

    const { tasks } = await request.json();
    if (!Array.isArray(tasks)) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    // tasks should be an array of { id: string, orderIndex: number }
    // We run them in a transaction to ensure atomic update
    await prisma.$transaction(
      tasks.map((t) =>
        prisma.task.update({
          where: { id: t.id },
          data: { orderIndex: t.orderIndex },
        })
      )
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("Task reorder error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
