import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { changePasswordSchema } from "@/server/middlewares/validation.middleware";
import { checkNextAuthRateLimit } from "@/server/middlewares/rateLimiter";

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkNextAuthRateLimit(req, "change-password");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const token = authHeader.substring(7);
  let user;
  try {
    user = AuthService.verifyToken(token);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid or expired session token." }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ success: false, error: "Invalid or expired session token." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = changePasswordSchema.safeParse(body);
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

    const result = await AuthService.changePassword(user.userId, validated.data);
    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Password change failed.",
      },
      { status: 400 }
    );
  }
}
