import { NextRequest, NextResponse } from "next/server";
import { BuildingService } from "@/server/services/building.service";
import { enforceAuth, getSessionFromRequest } from "@/server/helpers/nextAuth";

export async function GET(
  req: NextRequest,
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

    const session = getSessionFromRequest(req);
    const canSeePrivate =
      session?.role === "admin" ||
      session?.role === "engineer" ||
      (session?.role === "owner" && building.createdBy && building.createdBy === session.userId);

    const safeBuilding = {
      ...building,
      photographs: canSeePrivate
        ? building.photographs
        : building.photographs.filter((p) => !p.isPrivate),
    };

    return NextResponse.json({
      success: true,
      data: safeBuilding,
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
    const access = await BuildingService.checkBuildingModificationAccess(id, session);
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: access.message },
        { status: access.status }
      );
    }

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
