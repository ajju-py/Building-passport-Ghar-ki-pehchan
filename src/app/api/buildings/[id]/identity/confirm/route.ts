import { NextRequest, NextResponse } from "next/server";
import { IdentityService } from "@/server/services/identity.service";
import { BuildingService } from "@/server/services/building.service";
import { enforceAuth } from "@/server/helpers/nextAuth";

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
    const { verificationId, otp } = body;

    if (!verificationId) {
      return NextResponse.json(
        { success: false, error: "Verification ID is required." },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== "string" || !otp.trim()) {
      return NextResponse.json(
        { success: false, error: "OTP code is required." },
        { status: 400 }
      );
    }

    const result = await IdentityService.confirmVerification(
      verificationId,
      otp.trim(),
      session.userId,
      session.name
    );

    return NextResponse.json({
      success: true,
      message:
        result.status === "VERIFIED"
          ? "Owner identity successfully authenticated and verified."
          : "Verification failed. Incorrect OTP entered in sandbox.",
      data: result,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Verification confirmation failed.",
      },
      { status: 400 }
    );
  }
}
