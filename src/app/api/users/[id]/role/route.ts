import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { UserService } from "@/server/services/user.service";
import { adminUserRoleSchema } from "@/server/middlewares/validation.middleware";

function getAdminSession(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  try {
    const token = authHeader.substring(7);
    const session = AuthService.verifyToken(token);
    return session && session.role === "admin" ? session : null;
  } catch {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: "Forbidden. Admin access required." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const validated = adminUserRoleSchema.safeParse(body);
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

    const updated = await UserService.updateUserRole(id, validated.data.role);
    return NextResponse.json({
      success: true,
      message: `User role updated to '${validated.data.role}'.`,
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Failed to update role.",
      },
      { status: 400 }
    );
  }
}
