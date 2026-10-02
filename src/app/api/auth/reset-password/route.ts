import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { resetPasswordSchema } from "@/server/middlewares/validation.middleware";
import { checkNextAuthRateLimit } from "@/server/middlewares/rateLimiter";

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkNextAuthRateLimit(req, "reset-password");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();
    const validated = resetPasswordSchema.safeParse(body);
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

    const result = await AuthService.resetPassword(validated.data);
    return NextResponse.json({
      success: true,
      data: {
        message: result.message,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Password reset failed.",
      },
      { status: 400 }
    );
  }
}

