import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { UserService } from "@/server/services/user.service";
import { adminUserCreateSchema } from "@/server/middlewares/validation.middleware";

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

export async function GET(req: NextRequest) {
  const admin = getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: "Forbidden. Admin access required." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const role = searchParams.get("role") || undefined;
  const status = searchParams.get("status") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  try {
    const result = await UserService.listUsers({ search, role, status, page, limit });
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message || "Failed to list users." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = adminUserCreateSchema.safeParse(body);
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

    const created = await UserService.adminCreateUser(validated.data);
    return NextResponse.json(
      {
        success: true,
        message: "User created successfully.",
        data: created,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Failed to create user.",
      },
      { status: 400 }
    );
  }
}
