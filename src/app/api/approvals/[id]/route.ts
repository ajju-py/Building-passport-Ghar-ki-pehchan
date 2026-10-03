import { NextRequest, NextResponse } from "next/server";
import { ApprovalService } from "@/server/services/approval.service";
import { enforceAuth } from "@/server/helpers/nextAuth";

export async function PUT(
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
    const body = await req.json();

    const updated = await ApprovalService.updateApproval(
      id,
      body,
      session.userId,
      session.name
    );

    return NextResponse.json({
      success: true,
      message: "Approval record updated successfully.",
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Failed to update approval.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
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
    await ApprovalService.deleteApproval(id, session.userId, session.name);

    return NextResponse.json({
      success: true,
      message: "Approval record deleted successfully.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Failed to delete approval.",
      },
      { status: 400 }
    );
  }
}
