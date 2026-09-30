import { NextRequest, NextResponse } from "next/server";
import { DefectService } from "@/server/services/defect.service";
import { BuildingService } from "@/server/services/building.service";
import { enforceAuth } from "@/server/helpers/nextAuth";
import { defectUpdateSchema } from "@/server/middlewares/validation.middleware";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ defectId: string }> }
) {
  try {
    const { defectId } = await params;
    const defect = await DefectService.getDefectById(defectId);
    if (!defect) {
      return NextResponse.json(
        { success: false, error: "Defect record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: defect,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to retrieve defect." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ defectId: string }> }
) {
  const { session, errorResponse } = enforceAuth(req, ["admin", "engineer", "owner"]);
  if (!session) {
    return NextResponse.json(
      { success: false, error: errorResponse?.message || "Unauthorized" },
      { status: errorResponse?.status || 401 }
    );
  }

  try {
    const { defectId } = await params;
    const existing = await DefectService.getDefectById(defectId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Defect record not found." },
        { status: 404 }
      );
    }

    const access = await BuildingService.checkBuildingModificationAccess(existing.buildingId, session);
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: access.message },
        { status: access.status }
      );
    }

    const body = await req.json();
    const validated = defectUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on defect update.",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = await DefectService.updateDefect(defectId, validated.data);
    return NextResponse.json({
      success: true,
      message: "Defect updated successfully.",
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to update defect." },
      { status: 400 }
    );
  }
}
