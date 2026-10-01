import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { verifyOtpSchema } from "@/server/middlewares/validation.middleware";
import { checkNextAuthRateLimit } from "@/server/middlewares/rateLimiter";

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkNextAuthRateLimit(req, "otp");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();
    const validated = verifyOtpSchema.safeParse(body);
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

    const result = await AuthService.verifyOtp({
      destinationOrUserId: validated.data.destination,
      otp: validated.data.otp,
      purpose: validated.data.purpose,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Verification failed.",
      },
      { status: 400 }
    );
  }
}

