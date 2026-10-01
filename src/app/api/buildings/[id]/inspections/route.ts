import { NextRequest, NextResponse } from "next/server";
import { InspectionService } from "@/server/services/inspection.service";
import { enforceAuth } from "@/server/helpers/nextAuth";
import { inspectionCreateSchema } from "@/server/middlewares/validation.middleware";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inspections = await InspectionService.getInspections(id);
    return NextResponse.json({
      success: true,
      data: inspections,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to retrieve inspections." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = enforceAuth(req, ["admin", "engineer"]);
  if (!session) {
    return NextResponse.json(
      { success: false, error: errorResponse?.message || "Unauthorized" },
      { status: errorResponse?.status || 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const validated = inspectionCreateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed on inspection data.",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const inspection = await InspectionService.createInspection(id, {
      inspectorId: session.userId,
      inspectorName: session.name,
      date: validated.data.date,
      observations: validated.data.observations,
      remarks: validated.data.remarks,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Inspection logged successfully.",
        data: inspection,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to record inspection." },
      { status: 400 }
    );
  }
}
