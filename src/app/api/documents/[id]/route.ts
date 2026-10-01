import { NextRequest, NextResponse } from "next/server";
import { DocumentService } from "@/server/services/document.service";
import { BuildingService } from "@/server/services/building.service";
import { getSessionFromRequest } from "@/server/helpers/nextAuth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await DocumentService.getDocumentById(id);

    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Document record not found." },
        { status: 404 }
      );
    }

    if (doc.isPrivate) {
      const session = getSessionFromRequest(req);

      if (!session) {
        return NextResponse.json(
          { success: false, error: "Unauthorized. This document is confidential." },
          { status: 401 }
        );
      }

      if (session.role !== "admin" && session.role !== "engineer") {
        const access = await BuildingService.checkBuildingModificationAccess(
          doc.buildingId,
          session
        );
        if (!access.allowed) {
          return NextResponse.json(
            { success: false, error: "Forbidden. This document is confidential." },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: doc,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to retrieve document." },
      { status: 500 }
    );
  }
}

