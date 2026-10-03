import { NextRequest, NextResponse } from "next/server";
import { IdentityService } from "@/server/services/identity.service";
import { BuildingService } from "@/server/services/building.service";
import { enforceAuth } from "@/server/helpers/nextAuth";
import { IdentityVerificationMethod } from "@/lib/types";

const VALID_METHODS: IdentityVerificationMethod[] = [
  "sandbox_aadhaar_otp",
  "digilocker_sandbox",
  "manual_authority_check",
  "authorized_civil_id",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const verification = await IdentityService.getVerification(id);

    return NextResponse.json({
      success: true,
      data: verification,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Failed to retrieve identity verification.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = enforceAuth(req, ["admin", "owner", "engineer"]);
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

    if (!body.ownerName || !body.ownerName.trim()) {
      return NextResponse.json(
        { success: false, error: "Legal owner name is required." },
        { status: 400 }
      );
    }

    const method = body.verificationMethod as IdentityVerificationMethod;
    if (!method || !VALID_METHODS.includes(method)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid verification method. Allowed: ${VALID_METHODS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const maskedId = body.maskedId?.trim() || "";
    if (!maskedId) {
      return NextResponse.json(
        { success: false, error: "Masked document identifier or last 4 digits required." },
        { status: 400 }
      );
    }

    const result = await IdentityService.initiateVerification(
      {
        buildingId: id,
        ownerUserId: session.userId,
        ownerName: body.ownerName,
        verificationMethod: method,
        maskedId,
        consentReference: body.consentReference || `CONSENT_${Date.now()}`,
      },
      session.userId,
      session.name
    );

    return NextResponse.json(
      {
        success: true,
        message: "Identity verification initiated via Showcase Sandbox Gateway.",
        data: result,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Failed to initiate identity verification.",
      },
      { status: 400 }
    );
  }
}
