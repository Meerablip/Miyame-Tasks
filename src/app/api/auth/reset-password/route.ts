import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, securityAnswer, newPassword } = body;

    if (!identifier || !securityAnswer || !newPassword) {
      return Response.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const trimmedIdentifier = identifier.trim();

    // Find user by email or full name
    let user = await prisma.user.findUnique({
      where: { email: trimmedIdentifier.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          fullName: {
            equals: trimmedIdentifier,
            mode: "insensitive",
          },
        },
      });
    }

    if (!user) {
      return Response.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Verify security answer
    const isAnswerValid = await verifyPassword(
      securityAnswer.toLowerCase().trim(),
      user.securityAnswer
    );

    if (!isAnswerValid) {
      return Response.json(
        { error: "Security answer is incorrect." },
        { status: 401 }
      );
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return Response.json({
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return Response.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch the security question for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("identifier");

    if (!identifier) {
      return Response.json(
        { error: "Email or Full Name is required." },
        { status: 400 }
      );
    }

    const trimmedIdentifier = identifier.trim();

    let user = await prisma.user.findUnique({
      where: { email: trimmedIdentifier.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          fullName: {
            equals: trimmedIdentifier,
            mode: "insensitive",
          },
        },
      });
    }

    if (!user) {
      return Response.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    return Response.json({
      securityQuestion: user.securityQuestion,
    });
  } catch (error) {
    console.error("Get security question error:", error);
    return Response.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
