import { NextRequest, NextResponse } from "next/server";
import { ApprovalService } from "@/server/services/approval.service";
import { BuildingService } from "@/server/services/building.service";
import { enforceAuth } from "@/server/helpers/nextAuth";
import { ApprovalType, ApprovalStatus } from "@/lib/types";

const VALID_APPROVAL_TYPES: ApprovalType[] = [
  "building_permission",
  "fire_noc",
  "completion_certificate",
  "occupancy_certificate",
  "structural_stability",
  "environmental_clearance",
  "heritage_noc",
  "airport_authority_noc",
  "other",
];

const VALID_STATUSES: ApprovalStatus[] = [
  "ACTIVE",
  "EXPIRED",
  "PENDING_RENEWAL",
  "REVOKED",
  "PROVISIONAL",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get("type") as ApprovalType | null;

    const approvals = await ApprovalService.getApprovals(
      id,
      typeParam && VALID_APPROVAL_TYPES.includes(typeParam) ? typeParam : undefined
    );

    return NextResponse.json({
      success: true,
      data: approvals,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to retrieve approvals." },
      { status: 500 }
    );
  }
}

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

    const access = await BuildingService.checkBuildingModificationAccess(id, session);
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: access.message },
        { status: access.status }
      );
    }

    const body = await req.json();

    if (!body.approvalType || !VALID_APPROVAL_TYPES.includes(body.approvalType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid approval type. Allowed: ${VALID_APPROVAL_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!body.issuingAuthority || !body.issuingAuthority.trim()) {
      return NextResponse.json(
        { success: false, error: "Issuing authority is required." },
        { status: 400 }
      );
    }

    if (!body.approvalNumber || !body.approvalNumber.trim()) {
      return NextResponse.json(
        { success: false, error: "Approval / Certificate number is required." },
        { status: 400 }
      );
    }

    if (!body.issueDate) {
      return NextResponse.json(
        { success: false, error: "Issue date is required." },
        { status: 400 }
      );
    }

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const approval = await ApprovalService.createApproval(
      id,
      {
        approvalType: body.approvalType,
        issuingAuthority: body.issuingAuthority,
        approvalNumber: body.approvalNumber,
        issueDate: body.issueDate,
        validUntil: body.validUntil,
        status: body.status,
        remarks: body.remarks,
      },
      session.userId,
      session.name
    );

    return NextResponse.json(
      {
        success: true,
        message: `${approval.approvalType} record added successfully.`,
        data: approval,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Failed to record regulatory approval.",
      },
      { status: 400 }
    );
  }
}
