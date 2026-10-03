import { NextRequest, NextResponse } from "next/server";
import { DrawingService } from "@/server/services/drawing.service";
import { BuildingService } from "@/server/services/building.service";
import { storageService } from "@/server/services/storage.service";
import { enforceAuth } from "@/server/helpers/nextAuth";
import { DrawingType } from "@/lib/types";
import { env } from "@/server/config/env";

const VALID_DRAWING_TYPES: DrawingType[] = [
  "architectural",
  "structural",
  "electrical",
  "plumbing",
  "fire_safety",
  "site_plan",
  "as_built",
  "other",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get("type") as DrawingType | null;

    const drawings = await DrawingService.getDrawings(
      id,
      typeParam && VALID_DRAWING_TYPES.includes(typeParam) ? typeParam : undefined
    );

    return NextResponse.json({
      success: true,
      data: drawings,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to retrieve drawings." },
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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No drawing or blueprint file attached." },
        { status: 400 }
      );
    }

    const maxSizeBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the limit of ${env.MAX_FILE_SIZE_MB}MB.`,
        },
        { status: 400 }
      );
    }

    const typeRaw = (formData.get("drawingType") as string) || "architectural";
    if (!VALID_DRAWING_TYPES.includes(typeRaw as DrawingType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid drawing type '${typeRaw}'. Allowed: ${VALID_DRAWING_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }
    const drawingType = typeRaw as DrawingType;

    const title = (formData.get("title") as string) || file.name;
    const scale = (formData.get("scale") as string) || undefined;
    const sheetNumber = (formData.get("sheetNumber") as string) || undefined;
    const notes = (formData.get("notes") as string) || undefined;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Save to persistent storage provider
    const stored = await storageService.save(
      fileBuffer,
      file.name,
      file.type || "application/octet-stream"
    );

    const drawing = await DrawingService.createDrawing(
      id,
      {
        drawingType,
        title,
        storageReference: stored.storageRef,
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        scale,
        sheetNumber,
        notes,
      },
      session.userId
    );

    return NextResponse.json(
      {
        success: true,
        message: `Drawing ${drawing.revisionCode} (${drawing.drawingType}) registered successfully.`,
        data: drawing,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Drawing upload failed." },
      { status: 400 }
    );
  }
}
