import { NextRequest, NextResponse } from "next/server";
import { DefectService } from "@/server/services/defect.service";
import { enforceAuth } from "@/server/helpers/nextAuth";

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
    const body = await req.json();
    const updated = await DefectService.updateDefect(defectId, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Defect record not found." },
        { status: 404 }
      );
    }

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
