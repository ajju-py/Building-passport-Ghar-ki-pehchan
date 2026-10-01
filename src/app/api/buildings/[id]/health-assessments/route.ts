import { NextRequest, NextResponse } from "next/server";
import { enforceAuth } from "@/server/helpers/nextAuth";
import { AssessmentService } from "@/server/services/health/assessment.service";

export async function POST(
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

    // Calculation is server-authoritative; client cannot override engine scores/provenance
    const assessment = await AssessmentService.calculateAndPersistAssessment(
      access.buildingId!,
      {
        assessedBy: session.userId,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Health assessment generated and persisted successfully.",
        data: assessment,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = (err as Error).message || "Failed to generate health assessment.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

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

    const assessments = await AssessmentService.getAssessmentsByBuilding(access.buildingId!);

    return NextResponse.json({
      success: true,
      data: assessments,
    });
  } catch (err: unknown) {
    const message = (err as Error).message || "Failed to retrieve health assessments.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
