import { prisma } from "@/lib/prisma";
import { verifyPassword, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    // identifier can be email or full name (Design spec point 5)
    if (!identifier || !password) {
      return Response.json(
        { error: "Email/Full Name and password are required." },
        { status: 400 }
      );
    }

    const trimmedIdentifier = identifier.trim();

    // Try to find user by email first, then by full name
    let user = await prisma.user.findUnique({
      where: { email: trimmedIdentifier.toLowerCase() },
    });

    if (!user) {
      // Try finding by full name (case-insensitive)
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
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return Response.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      fullName: user.fullName,
    });

    return Response.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
