import { NextRequest, NextResponse } from "next/server";
import { BuildingService } from "@/server/services/building.service";
import { storageService } from "@/server/services/storage.service";
import { enforceAuth, getSessionFromRequest } from "@/server/helpers/nextAuth";
import { env } from "@/server/config/env";

const VALID_CATEGORIES = ["main", "additional", "construction"] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSessionFromRequest(req);
    const photos = await BuildingService.getPhotographs(
      id,
      session ? { role: session.role, userId: session.userId } : undefined
    );

    if (!photos) {
      return NextResponse.json(
        { success: false, error: "Building not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: photos,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to retrieve photographs." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = enforceAuth(req, ["admin", "engineer", "owner"]);
  if (!session || errorResponse) {
    return NextResponse.json(
      { success: false, error: errorResponse?.message || "Unauthorized" },
      { status: errorResponse?.status || 401 }
    );
  }

  let savedStorageRef: string | null = null;

  try {
    const { id } = await params;
    const access = await BuildingService.checkBuildingModificationAccess(id, session);
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: access.message },
        { status: access.status }
      );
    }
    const building = access.building!;

    const contentType = req.headers.get("content-type") || "";
    let photoUrl = "";
    let caption = "";
    let categoryRaw = "additional";
    let isPrivate = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("photo") as File | null;
      if (file) {
        // File size validation against MAX_FILE_SIZE_MB
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

        // Image MIME and extension validation
        const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
        const allowedExts = /\.(jpe?g|png|webp|svg)$/i;
        if (!allowedMimes.includes(file.type) && !allowedExts.test(file.name)) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid image file type. Allowed: JPG, PNG, WEBP, SVG.",
            },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const stored = await storageService.save(buffer, file.name, file.type || "image/jpeg");
        savedStorageRef = stored.storageRef;
        photoUrl = stored.url;
        caption = file.name;
      }
      if (formData.get("caption")) {
        caption = (formData.get("caption") as string) || "";
      }
      categoryRaw = (formData.get("category") as string) || "additional";
      isPrivate = formData.get("isPrivate") === "true";
    } else {
      const body = await req.json();
      photoUrl = body.url;
      caption = body.caption || "";
      categoryRaw = body.category || "additional";
      isPrivate = !!body.isPrivate;
    }

    if (!photoUrl) {
      return NextResponse.json(
        { success: false, error: "Photo file or URL is required." },
        { status: 400 }
      );
    }

    // Category validation
    if (!VALID_CATEGORIES.includes(categoryRaw as (typeof VALID_CATEGORIES)[number])) {
      if (savedStorageRef) {
        await storageService.delete(savedStorageRef);
      }
      return NextResponse.json(
        {
          success: false,
          error: `Invalid photograph category '${categoryRaw}'. Allowed: ${VALID_CATEGORIES.join(", ")}`,
        },
        { status: 400 }
      );
    }
    const category = categoryRaw as (typeof VALID_CATEGORIES)[number];

    const newPhoto = {
      url: photoUrl,
      caption,
      category,
      isPrivate,
      uploadedAt: new Date().toISOString(),
    };

    try {
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
    } catch (dbErr) {
      if (savedStorageRef) {
        await storageService.delete(savedStorageRef);
      }
      throw dbErr;
    }
  } catch (err: unknown) {
    if (savedStorageRef) {
      await storageService.delete(savedStorageRef);
    }
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Photograph registration failed." },
      { status: 400 }
    );
  }
}
