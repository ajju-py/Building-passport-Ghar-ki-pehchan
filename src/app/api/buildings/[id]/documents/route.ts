import { NextRequest, NextResponse } from "next/server";
import { DocumentService } from "@/server/services/document.service";
import { enforceAuth, getSessionFromRequest } from "@/server/helpers/nextAuth";
import { DocumentType } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSessionFromRequest(req);
    const docs = await DocumentService.getDocuments(id, session?.role);
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
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file attached to upload." },
        { status: 400 }
      );
    }

    const title = (formData.get("title") as string) || file.name;
    const documentType = ((formData.get("documentType") as string) || "blueprint") as DocumentType;
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
