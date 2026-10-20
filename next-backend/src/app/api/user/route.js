
import bcrypt from "bcrypt";
import { getDB } from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/utils";
import corsHeaders from "@/lib/cors";

export async function POST(request) {
  try {
    const { username, email, password, role } = await request.json();

    if (!username || !email || !password || !role) {
      return errorResponse("All fields are required", 400);
    }

    if (!["teacher", "student"].includes(role.toLowerCase())) {
      return errorResponse("Role must be teacher or student", 400);
    }

    if (password.length < 6) {
      return errorResponse(
        "Password must contain at least 6 characters",
        400
      );
    }

    const db = await getDB();
    const users = db.collection("users");

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await users.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return errorResponse("Email already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role.toLowerCase(),
      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    return successResponse(
      {
        message: "User registered successfully",
        user: {
          id: result.insertedId.toString(),
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        },
      },
      201
    );
  } catch (error) {
    console.error("User registration error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function GET() {
  try {
    const db = await getDB();

    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();

    return successResponse(
      users.map((user) => ({
        ...user,
        _id: user._id.toString(),
      })),
      200
    );
  } catch (error) {
    console.error("Get users error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
