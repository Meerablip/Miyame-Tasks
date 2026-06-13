import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { type NextRequest } from "next/server";

// POST — add a comment to a task
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

    const { taskId, content } = await request.json();

    if (!taskId || !content?.trim()) {
      return Response.json(
        { error: "taskId and content are required." },
        { status: 400 }
      );
    }

    // Verify task exists
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        taskId,
        authorId: payload.userId,
      },
      include: {
        author: { select: { id: true, fullName: true, role: true } },
      },
    });

    // Create notification for the task assignee (if commenter is not the assignee)
    if (task.assigneeId !== payload.userId) {
      await prisma.notification.create({
        data: {
          content: `${payload.fullName} commented on your task "${task.name}"`,
          userId: task.assigneeId,
        },
      });
    }

    return Response.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
