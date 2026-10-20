
import { ObjectId } from "mongodb";
import { getDB } from "@/lib/mongodb";
import { verifyJWT } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/utils";
import corsHeaders from "@/lib/cors";

async function findCourse(courseId) {
  if (!ObjectId.isValid(courseId)) return null;

  const db = await getDB();

  return db.collection("courses").findOne({
    _id: new ObjectId(courseId),
  });
}

function formatCourse(course) {
  return {
    ...course,
    _id: course._id.toString(),
    id: course._id.toString(),
  };
}

// GET - View course details
export async function GET(request, { params }) {
  try {
    const { course_id } = await params;
    const course = await findCourse(course_id);

    if (!course) {
      return errorResponse("Course not found", 404);
    }

    return successResponse(formatCourse(course), 200);
  } catch (error) {
    console.error("Get course error:", error);
    return errorResponse("Failed to get course", 500);
  }
}

// PUT - Teacher updates own course
export async function PUT(request, { params }) {
  try {
    const user = verifyJWT(request);

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (user.role !== "teacher") {
      return errorResponse("Only teachers can edit courses", 403);
    }

    const { course_id } = await params;
    const course = await findCourse(course_id);

    if (!course) {
      return errorResponse("Course not found", 404);
    }

    if (course.teacherId !== user.id) {
      return errorResponse(
        "You can only edit your own courses",
        403
      );
    }

    const body = await request.json();
    const updates = {};

    if (body.title !== undefined) {
      updates.title = String(body.title).trim();

      if (!updates.title) {
        return errorResponse("Title is required", 400);
      }
    }

    if (body.description !== undefined) {
      updates.description = String(body.description).trim();

      if (!updates.description) {
        return errorResponse("Description is required", 400);
      }
    }

    if (body.capacity !== undefined) {
      updates.capacity = Number(body.capacity);

      if (
        !Number.isInteger(updates.capacity) ||
        updates.capacity < 1
      ) {
        return errorResponse("Invalid capacity", 400);
      }

      if (
        updates.capacity <
        (course.enrolledStudents || []).length
      ) {
        return errorResponse(
          "Capacity cannot be below enrollment count",
          400
        );
      }
    }

    updates.updatedAt = new Date();

    const db = await getDB();

    await db.collection("courses").updateOne(
      {
        _id: course._id,
        teacherId: user.id,
      },
      {
        $set: updates,
      }
    );

    const updated = await findCourse(course_id);

    return successResponse(
      {
        message: "Course updated successfully",
        course: formatCourse(updated),
      },
      200
    );
  } catch (error) {
    console.error("Update course error:", error);
    return errorResponse("Failed to update course", 500);
  }
}

// DELETE - Teacher deletes own course
export async function DELETE(request, { params }) {
  try {
    const user = verifyJWT(request);

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (user.role !== "teacher") {
      return errorResponse("Only teachers can delete courses", 403);
    }

    const { course_id } = await params;
    const course = await findCourse(course_id);

    if (!course) {
      return errorResponse("Course not found", 404);
    }

    if (course.teacherId !== user.id) {
      return errorResponse(
        "You can only delete your own courses",
        403
      );
    }

    const db = await getDB();

    await db.collection("courses").deleteOne({
      _id: course._id,
      teacherId: user.id,
    });

    return successResponse(
      { message: "Course deleted successfully" },
      200
    );
  } catch (error) {
    console.error("Delete course error:", error);
    return errorResponse("Failed to delete course", 500);
  }
}

// PATCH - Student enrollment and withdrawal
export async function PATCH(request, { params }) {
  try {
    const user = verifyJWT(request);

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (user.role !== "student") {
      return errorResponse(
        "Only students can enroll in courses",
        403
      );
    }

    const { course_id } = await params;
    const course = await findCourse(course_id);

    if (!course) {
      return errorResponse("Course not found", 404);
    }

    const body = await request.json();
    const action = body.action;
    const studentId = user.id;

    if (!["enroll", "withdraw"].includes(action)) {
      return errorResponse(
        "Action must be enroll or withdraw",
        400
      );
    }

    const db = await getDB();
    const courses = db.collection("courses");

    if (action === "enroll") {
      const result = await courses.updateOne(
        {
          _id: course._id,
          enrolledStudents: { $ne: studentId },
          $expr: {
            $lt: [
              {
                $size: {
                  $ifNull: ["$enrolledStudents", []],
                },
              },
              "$capacity",
            ],
          },
        },
        {
          $addToSet: {
            enrolledStudents: studentId,
          },
          $set: {
            updatedAt: new Date(),
          },
        }
      );

      if (!result.modifiedCount) {
        const latest = await findCourse(course_id);

        if (
          (latest.enrolledStudents || []).includes(studentId)
        ) {
          return errorResponse(
            "Already enrolled in this course",
            409
          );
        }

        return errorResponse("Course is full", 409);
      }

      return successResponse(
        { message: "Enrollment successful" },
        200
      );
    }

    const result = await courses.updateOne(
      {
        _id: course._id,
        enrolledStudents: studentId,
      },
      {
        $pull: {
          enrolledStudents: studentId,
        },
        $set: {
          updatedAt: new Date(),
        },
      }
    );

    if (!result.modifiedCount) {
      return errorResponse(
        "You are not enrolled in this course",
        409
      );
    }

    return successResponse(
      { message: "Withdrawal successful" },
      200
    );
  } catch (error) {
    console.error("Enrollment error:", error);
    return errorResponse(
      "Failed to process enrollment",
      500
    );
  }
}

// CORS - Required for browser requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
