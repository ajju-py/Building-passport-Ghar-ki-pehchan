import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { forgotPasswordSchema } from "@/server/middlewares/validation.middleware";
import { checkNextAuthRateLimit } from "@/server/middlewares/rateLimiter";

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkNextAuthRateLimit(req, "forgot-password");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();
    const validated = forgotPasswordSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format.",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await AuthService.forgotPassword(validated.data.email);
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
        error: (err as Error).message || "Request failed.",
      },
      { status: 400 }
    );
  }
}

