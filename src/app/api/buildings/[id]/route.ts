import { NextRequest, NextResponse } from "next/server";
import { BuildingService } from "@/server/services/building.service";
import { enforceAuth } from "@/server/helpers/nextAuth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const building = await BuildingService.getBuildingById(id);
    if (!building) {
      return NextResponse.json(
        { success: false, error: "Building not found." },
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
        error: (err as Error).message || "Failed to retrieve building.",
      },
      { status: 500 }
    );
  }
}

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
    const updated = await BuildingService.updateBuilding(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Building not found to update." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "Building record updated successfully.",
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Failed to update building.",
      },
      { status: 400 }
    );
  }
}
