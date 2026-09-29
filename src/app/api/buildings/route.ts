import { NextRequest, NextResponse } from "next/server";
import { BuildingService } from "@/server/services/building.service";
import { enforceAuth } from "@/server/helpers/nextAuth";
import { buildingCreateSchema } from "@/server/middlewares/validation.middleware";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;
    const condition = searchParams.get("condition") || undefined;
    const maintenanceStatus = searchParams.get("maintenanceStatus") || undefined;

    const buildings = await BuildingService.getBuildings({
      search,
      type,
      condition,
      maintenanceStatus,
    });

    return NextResponse.json({
      success: true,
      data: buildings,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Failed to retrieve buildings.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = enforceAuth(req, ["admin", "engineer", "owner"]);
  if (!session) {
    return NextResponse.json(
      { success: false, error: errorResponse?.message || "Unauthorized" },
      { status: errorResponse?.status || 401 }
    );
  }

  try {
    const body = await req.json();
    const validated = buildingCreateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on building registration data.",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const building = await BuildingService.createBuilding(
      validated.data as unknown as Partial<import("@/lib/types").BuildingRecord>,
      session.userId
    );
    return NextResponse.json(
      {
        success: true,
        message: "Building Passport created successfully.",
        data: building,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Failed to create building.",
      },
      { status: 400 }
    );
  }
}
