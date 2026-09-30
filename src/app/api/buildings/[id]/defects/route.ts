import { NextRequest, NextResponse } from "next/server";
import { DefectService } from "@/server/services/defect.service";
import { BuildingService } from "@/server/services/building.service";
import { enforceAuth } from "@/server/helpers/nextAuth";
import { defectCreateSchema } from "@/server/middlewares/validation.middleware";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const defects = await DefectService.getDefects(id);
    return NextResponse.json({
      success: true,
      data: defects,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to retrieve defects." },
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
    const validated = defectCreateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on defect data.",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const defect = await DefectService.createDefect(id, validated.data);
    return NextResponse.json(
      {
        success: true,
        message: "Defect logged successfully.",
        data: defect,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to record defect." },
      { status: 400 }
    );
  }
}
