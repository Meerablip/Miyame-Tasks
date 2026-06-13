import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, dob, password, role, securityQuestion, securityAnswer } = body;

    // Validate required fields
    if (!fullName || !email || !dob || !password || !role || !securityQuestion || !securityAnswer) {
      return Response.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return Response.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Check director limit (max 4)
    if (role === "DIRECTOR") {
      const directorCount = await prisma.user.count({
        where: { role: "DIRECTOR" },
      });

      if (directorCount >= 4) {
        return Response.json(
          { error: "Maximum number of directors (4) has been reached." },
          { status: 403 }
        );
      }
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Hash the security answer (case-insensitive comparison later)
    const hashedSecurityAnswer = await hashPassword(securityAnswer.toLowerCase().trim());

    // Create the user
    const user = await prisma.user.create({
      data: {
        fullName,
        email: email.toLowerCase().trim(),
        dob: new Date(dob),
        passwordHash,
        role,
        securityQuestion,
        securityAnswer: hashedSecurityAnswer,
      },
    });

    // Generate JWT token (stays logged in for 30 days as per spec)
    const token = generateToken({
      userId: user.id,
      role: user.role,
      fullName: user.fullName,
    });

    return Response.json(
      {
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          securityQuestion: user.securityQuestion,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sign-up error:", error);
    return Response.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
