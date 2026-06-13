import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { type NextRequest } from "next/server";

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
    if (!payload || payload.role !== "DIRECTOR") {
      return Response.json({ error: "Forbidden. Only Directors can remove employees." }, { status: 403 });
    }

    const { id: empId } = await params;

    // Remove employee by deleting the user
    // Note: in a real production system we might deactivate them, but for MVP we delete.
    // Also, prisma schema cascade deletes tasks etc, depending on relation.
    // Since we don't have Cascade set up explicitly on assigneeId, we might need to delete their tasks first
    // Or just set their tasks' assigneeId to null. Let's delete them.
    await prisma.task.deleteMany({ where: { assigneeId: empId } });
    await prisma.user.delete({ where: { id: empId } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete employee error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
