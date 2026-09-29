import { NextRequest, NextResponse } from "next/server";
import { BuildingService } from "@/server/services/building.service";
import { enforceAuth } from "@/server/helpers/nextAuth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = enforceAuth(req);
  if (!session) {
    return NextResponse.json(
      { success: false, error: errorResponse?.message || "Unauthorized" },
      { status: errorResponse?.status || 401 }
    );
  }

  try {
    const { id } = await params;
    const report = await BuildingService.generateReport(id, session);
    if (!report) {
      return NextResponse.json(
        { success: false, error: "Building not found to generate report." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to generate report." },
      { status: 500 }
    );
  }
}
