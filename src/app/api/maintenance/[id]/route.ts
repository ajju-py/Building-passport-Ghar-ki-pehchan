import { NextRequest, NextResponse } from "next/server";
import { MaintenanceService } from "@/server/services/maintenance.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await MaintenanceService.getMaintenanceById(id);
    if (!record) {
      return NextResponse.json(
        { success: false, error: "Maintenance record not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to retrieve maintenance record." },
      { status: 500 }
    );
  }
}
