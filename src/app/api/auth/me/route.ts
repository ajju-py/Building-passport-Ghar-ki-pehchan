import { NextRequest, NextResponse } from "next/server";
import { enforceAuth } from "@/server/helpers/nextAuth";

export async function GET(req: NextRequest) {
  const { session, errorResponse } = enforceAuth(req);
  if (!session) {
    return NextResponse.json(
      { success: false, error: errorResponse?.message || "Unauthorized" },
      { status: errorResponse?.status || 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: session,
  });
}
