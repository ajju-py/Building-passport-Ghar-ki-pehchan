import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/server/services/audit.service";
import { enforceAuth } from "@/server/helpers/nextAuth";

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
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const logs = await AuditService.getLogsForEntity("building", id, limit);

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Failed to retrieve audit trail.",
      },
      { status: 500 }
    );
  }
}
