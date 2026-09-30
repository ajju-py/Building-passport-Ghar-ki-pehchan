import { NextRequest, NextResponse } from "next/server";
import { DocumentService } from "@/server/services/document.service";
import { BuildingService } from "@/server/services/building.service";
import { enforceAuth, getSessionFromRequest } from "@/server/helpers/nextAuth";
import { DocumentType } from "@/lib/types";
import { env } from "@/server/config/env";

const VALID_DOC_TYPES: DocumentType[] = [
  "blueprint",
  "structural",
  "permit",
  "report",
  "other",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSessionFromRequest(req);
    const docs = await DocumentService.getDocuments(
      id,
      session ? { role: session.role, userId: session.userId } : undefined
    );
    return NextResponse.json({
      success: true,
      data: docs,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to retrieve documents." },
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

    // Owner IDOR and building existence verification
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
        { success: false, error: "No file attached to upload." },
        { status: 400 }
      );
    }

    // File size check (MAX_FILE_SIZE_MB)
    const maxSizeBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the maximum limit of ${env.MAX_FILE_SIZE_MB}MB.`,
        },
        { status: 400 }
      );
    }

    // Allowed MIME types and extensions
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "application/dwg",
      "application/dxf",
      "application/octet-stream",
    ];
    const allowedExts = /\.(pdf|jpe?g|png|webp|svg|dwg|dxf)$/i;
    if (!allowedMimes.includes(file.type) && !allowedExts.test(file.name)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "File type not supported for civil documentation. Allowed: PDF, JPG, PNG, WEBP, SVG, CAD (DWG/DXF).",
        },
        { status: 400 }
      );
    }

    const docTypeRaw = (formData.get("documentType") as string) || "blueprint";
    if (!VALID_DOC_TYPES.includes(docTypeRaw as DocumentType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid document type '${docTypeRaw}'. Allowed: ${VALID_DOC_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }
    const documentType = docTypeRaw as DocumentType;

    const title = (formData.get("title") as string) || file.name;
    const isPrivate = formData.get("isPrivate") === "true";

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const doc = await DocumentService.uploadDocument({
      buildingId: id,
      fileBuffer,
      originalFilename: file.name,
      mimeType: file.type || "application/octet-stream",
      title,
      documentType,
      isPrivate,
      uploadedBy: session.userId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Document uploaded and indexed successfully.",
        data: doc,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Document upload failed." },
      { status: 400 }
    );
  }
}

