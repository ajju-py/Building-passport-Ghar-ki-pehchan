import { NextRequest, NextResponse } from "next/server";
import { DrawingService } from "@/server/services/drawing.service";
import { enforceAuth } from "@/server/helpers/nextAuth";
import { DrawingApprovalStatus } from "@/lib/types";

const VALID_STATUSES: DrawingApprovalStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "SUPERSEDED",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = enforceAuth(req, ["admin", "engineer"]);
  if (!session) {
    return NextResponse.json(
      { success: false, error: errorResponse?.message || "Unauthorized" },
      { status: errorResponse?.status || 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const status = body.status as DrawingApprovalStatus;
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status '${status}'. Allowed: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const updated = await DrawingService.setApprovalStatus(
      id,
      status,
      session.userId,
      session.name
    );

    return NextResponse.json({
      success: true,
      message: `Drawing status changed to ${status}.`,
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Failed to update drawing status.",
      },
      { status: 400 }
    );
  }
}
