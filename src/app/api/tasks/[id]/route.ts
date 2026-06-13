import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { type NextRequest } from "next/server";

// PATCH update a task (toggle complete, edit details)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    // Verify task belongs to user, or user is DIRECTOR
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    if (payload.role !== "DIRECTOR" && existingTask.assigneeId !== payload.userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const task = await prisma.task.update({
      where: { id },
      data: body,
      include: {
        category: true,
        site: true,
      },
    });

    return Response.json({ task });
  } catch (error) {
    console.error("Update task error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    if (payload.role !== "DIRECTOR" && existingTask.assigneeId !== payload.userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.task.delete({ where: { id } });

    return Response.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Delete task error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
