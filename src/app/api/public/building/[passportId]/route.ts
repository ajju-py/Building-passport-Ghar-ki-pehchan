import { NextRequest, NextResponse } from "next/server";
import { BuildingService } from "@/server/services/building.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    const { passportId } = await params;
    const building = await BuildingService.getPublicPassport(passportId);
    if (!building) {
      return NextResponse.json(
        {
          success: false,
          error: `Building Passport ID '${passportId}' not found in registry.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: building,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Failed to resolve public passport.",
      },
      { status: 500 }
    );
  }
}
