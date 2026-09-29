import { NextRequest, NextResponse } from "next/server";
import { BuildingService } from "@/server/services/building.service";
import { storageService } from "@/server/services/storage.service";
import { enforceAuth } from "@/server/helpers/nextAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = enforceAuth(req, ["admin", "engineer", "owner"]);
  if (errorResponse) {
    return NextResponse.json(
      { success: false, error: errorResponse.message },
      { status: errorResponse.status }
    );
  }

  try {
    const { id } = await params;
    const building = await BuildingService.getBuildingById(id);
    if (!building) {
      return NextResponse.json(
        { success: false, error: "Building not found." },
        { status: 404 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let photoUrl = "";
    let caption = "";
    let category: "main" | "additional" | "construction" = "additional";
    let isPrivate = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("photo") as File | null;
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const stored = await storageService.save(buffer, file.name, file.type || "image/jpeg");
        photoUrl = stored.url;
      }
      caption = (formData.get("caption") as string) || "";
      category = ((formData.get("category") as string) || "additional") as "main" | "additional" | "construction";
      isPrivate = formData.get("isPrivate") === "true";
    } else {
      const body = await req.json();
      photoUrl = body.url;
      caption = body.caption || "";
      category = body.category || "additional";
      isPrivate = !!body.isPrivate;
    }

    if (!photoUrl) {
      return NextResponse.json(
        { success: false, error: "Photo file or URL is required." },
        { status: 400 }
      );
    }

    const newPhoto = {
      url: photoUrl,
      caption,
      category,
      isPrivate,
      uploadedAt: new Date().toISOString(),
    };

    const updatedPhotos = [...building.photographs, newPhoto];
    const updated = await BuildingService.updateBuilding(id, {
      photographs: updatedPhotos,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Building photograph registered successfully.",
        data: updated?.photographs,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Photograph registration failed." },
      { status: 400 }
    );
  }
}
