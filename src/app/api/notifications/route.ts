import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { type NextRequest } from "next/server";

// GET — fetch notifications for the current user
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

    const notifications = await prisma.notification.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: payload.userId, isRead: false },
    });

    return Response.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — mark notifications as read
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

    const body = await request.json();
    const { notificationIds } = body;

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: { id: { in: notificationIds }, userId: payload.userId },
        data: { isRead: true },
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: payload.userId, isRead: false },
        data: { isRead: true },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Mark notifications error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
