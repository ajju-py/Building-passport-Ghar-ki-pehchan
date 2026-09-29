import { NextRequest, NextResponse } from "next/server";
import { MaintenanceService } from "@/server/services/maintenance.service";
import { enforceAuth } from "@/server/helpers/nextAuth";
import { maintenanceCreateSchema } from "@/server/middlewares/validation.middleware";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const maintenance = await MaintenanceService.getMaintenance(id);
    return NextResponse.json({
      success: true,
      data: maintenance,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to retrieve maintenance records." },
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
    const body = await req.json();
    const validated = maintenanceCreateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on maintenance data.",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const record = await MaintenanceService.createMaintenance(id, validated.data);
    return NextResponse.json(
      {
        success: true,
        message: "Maintenance record added successfully.",
        data: record,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to record maintenance." },
      { status: 400 }
    );
  }
}
