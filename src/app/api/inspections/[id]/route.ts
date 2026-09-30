import { NextRequest, NextResponse } from "next/server";
import { InspectionService } from "@/server/services/inspection.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inspection = await InspectionService.getInspectionById(id);
    if (!inspection) {
      return NextResponse.json(
        { success: false, error: "Inspection record not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: inspection,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to retrieve inspection." },
      { status: 500 }
    );
  }
}
