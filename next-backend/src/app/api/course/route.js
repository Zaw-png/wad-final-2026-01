
import { getDB } from "@/lib/mongodb";
import { verifyJWT } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/utils";
import corsHeaders from "@/lib/cors";

export async function GET() {
  try {
    const db = await getDB();

    const courses = await db
      .collection("courses")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return successResponse(
      courses.map((course) => ({
        ...course,
        _id: course._id.toString(),
        id: course._id.toString(),
      })),
      200
    );
  } catch (error) {
    console.error("Get courses error:", error);
    return errorResponse("Failed to load courses", 500);
  }
}

export async function POST(request) {
  try {
    const user = verifyJWT(request);

    if (!user) {
      return errorResponse("Please log in first", 401);
    }

    if (user.role !== "teacher") {
      return errorResponse("Only teachers can create courses", 403);
    }

    const body = await request.json();

    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const capacity = Number(
      body.capacity ?? body.maxStudents ?? 30
    );

    if (!title || !description) {
      return errorResponse(
        "Title and description are required",
        400
      );
    }

    if (!Number.isInteger(capacity) || capacity < 1) {
      return errorResponse(
        "Capacity must be a positive integer",
        400
      );
    }

    const db = await getDB();

    const course = {
      title,
      description,
      capacity,
      teacherId: user.id,
      teacherName: user.username,
      enrolledStudents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection("courses")
      .insertOne(course);

    return successResponse(
      {
        message: "Course created successfully",
        course: {
          ...course,
          _id: result.insertedId.toString(),
          id: result.insertedId.toString(),
        },
      },
      201
    );
  } catch (error) {
    console.error("Create course error:", error);
    return errorResponse(
      "Failed to create course",
      500
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
