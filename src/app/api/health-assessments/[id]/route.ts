import { NextRequest, NextResponse } from "next/server";
import { enforceAuth } from "@/server/helpers/nextAuth";
import { AssessmentService } from "@/server/services/health/assessment.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = enforceAuth(req, ["admin", "engineer", "owner"]);
  if (!session) {
    return NextResponse.json(
      { success: false, error: errorResponse?.message || "Unauthorized" },
      { status: errorResponse?.status || 401 }
    );
  }

  try {
    const { id } = await params;
    const assessment = await AssessmentService.getAssessmentById(id);
    if (!assessment) {
      return NextResponse.json(
        {
          success: false,
          error: `Health assessment '${id}' not found.`,
        },
        { status: 404 }
      );
    }

    // Server-side authorization check on associated building
    const access = await AssessmentService.checkBuildingHealthAccess(
      assessment.buildingId,
      session
    );
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: access.message },
        { status: access.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: assessment,
    });
  } catch (err: unknown) {
    const message = (err as Error).message || "Failed to retrieve health assessment.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
