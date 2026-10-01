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
    const access = await AssessmentService.checkBuildingHealthAccess(id, session);
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: access.message },
        { status: access.status }
      );
    }

    const latest = await AssessmentService.getLatestAssessmentByBuilding(access.buildingId!);
    if (!latest) {
      return NextResponse.json(
        {
          success: false,
          error: `No health assessments found for building '${id}'.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: latest,
    });
  } catch (err: unknown) {
    const message = (err as Error).message || "Failed to retrieve latest health assessment.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
