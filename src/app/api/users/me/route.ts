import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { UserService } from "@/server/services/user.service";
import { userProfileUpdateSchema } from "@/server/middlewares/validation.middleware";

function getAuthenticatedSession(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  try {
    const token = authHeader.substring(7);
    return AuthService.verifyToken(token);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const profile = await UserService.getProfile(session.userId);
  if (!profile) {
    return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: profile,
  });
}

export async function PATCH(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = userProfileUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed.",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = await UserService.updateProfile(session.userId, {
      name: validated.data.name,
      mobile: validated.data.mobile === null ? undefined : validated.data.mobile,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Failed to update profile.",
      },
      { status: 400 }
    );
  }
}

