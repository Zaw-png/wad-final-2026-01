
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import { getDB } from "@/lib/mongodb";
import { verifyJWT } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/utils";
import corsHeaders from "@/lib/cors";

function checkAccess(request, userId) {
  const user = verifyJWT(request);

  if (!user) {
    return { error: errorResponse("Unauthorized", 401) };
  }

  if (user.id !== userId) {
    return {
      error: errorResponse("You can only access your own account", 403),
    };
  }

  if (!ObjectId.isValid(userId)) {
    return { error: errorResponse("Invalid user ID", 400) };
  }

  return { user };
}

// GET - View own profile
export async function GET(request, { params }) {
  try {
    const { user_id } = await params;
    const access = checkAccess(request, user_id);

    if (access.error) return access.error;

    const db = await getDB();

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(user_id) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse(
      {
        ...user,
        _id: user._id.toString(),
        id: user._id.toString(),
      },
      200
    );
  } catch (error) {
    console.error("Get user error:", error);
    return errorResponse("Failed to get user", 500);
  }
}

// PUT - Update own profile
export async function PUT(request, { params }) {
  try {
    const { user_id } = await params;
    const access = checkAccess(request, user_id);

    if (access.error) return access.error;

    const body = await request.json();
    const updates = {};

    if (body.username !== undefined) {
      const username = String(body.username).trim();

      if (!username) {
        return errorResponse("Username cannot be empty", 400);
      }

      updates.username = username;
    }

    if (body.password !== undefined) {
      if (
        typeof body.password !== "string" ||
        body.password.length < 6
      ) {
        return errorResponse(
          "Password must contain at least 6 characters",
          400
        );
      }

      updates.password = await bcrypt.hash(body.password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse("No valid fields to update", 400);
    }

    updates.updatedAt = new Date();

    const db = await getDB();

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(user_id) },
      { $set: updates }
    );

    if (!result.matchedCount) {
      return errorResponse("User not found", 404);
    }

    const updatedUser = await db.collection("users").findOne(
      { _id: new ObjectId(user_id) },
      { projection: { password: 0 } }
    );

    return successResponse(
      {
        message: "Profile updated successfully",
        user: {
          ...updatedUser,
          _id: updatedUser._id.toString(),
          id: updatedUser._id.toString(),
        },
      },
      200
    );
  } catch (error) {
    console.error("Update user error:", error);
    return errorResponse("Failed to update user", 500);
  }
}

// DELETE - Delete own account
export async function DELETE(request, { params }) {
  try {
    const { user_id } = await params;
    const access = checkAccess(request, user_id);

    if (access.error) return access.error;

    const db = await getDB();

    const result = await db.collection("users").deleteOne({
      _id: new ObjectId(user_id),
    });

    if (!result.deletedCount) {
      return errorResponse("User not found", 404);
    }

    // Remove deleted student from course enrollments
    await db.collection("courses").updateMany(
      {},
      {
        $pull: {
          enrolledStudents: user_id,
        },
      }
    );

    return successResponse(
      { message: "Account deleted successfully" },
      200
    );
  } catch (error) {
    console.error("Delete user error:", error);
    return errorResponse("Failed to delete user", 500);
  }
}

// CORS preflight for browser requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

