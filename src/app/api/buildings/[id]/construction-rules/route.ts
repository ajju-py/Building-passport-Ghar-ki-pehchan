import { NextRequest, NextResponse } from "next/server";
import { enforceAuth } from "@/server/helpers/nextAuth";
import { ComplianceService } from "@/server/services/compliance.service";

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
    const access = await ComplianceService.checkBuildingComplianceAccess(id, session);
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: access.message },
        { status: access.status }
      );
    }

    const evaluation = await ComplianceService.evaluateBuildingCompliance(access.buildingId!);

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (err: unknown) {
    const message =
      (err as Error).message || "Failed to evaluate construction compliance rules.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
