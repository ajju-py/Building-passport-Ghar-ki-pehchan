import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { checkNextAuthRateLimit } from "@/server/middlewares/rateLimiter";
import { z } from "zod";

const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkNextAuthRateLimit(req, "otp");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();
    const validated = verifyEmailSchema.safeParse(body);
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
      destinationOrUserId: validated.data.email,
      otp: validated.data.otp,
      purpose: "EMAIL_VERIFICATION",
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Email verification failed.",
      },
      { status: 400 }
    );
  }
}

