import { NextRequest, NextResponse } from "next/server";
import { OtpService } from "@/server/services/otp.service";
import { AuthService } from "@/server/services/auth.service";
import { requestOtpSchema } from "@/server/middlewares/validation.middleware";
import { checkNextAuthRateLimit } from "@/server/middlewares/rateLimiter";

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkNextAuthRateLimit(req, "otp");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();
    const validated = requestOtpSchema.safeParse(body);
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

    const { destination, purpose } = validated.data;
    const destNorm = destination.trim().toLowerCase();

    // Check if account exists for destination
    const user = await AuthService.findByEmail(destNorm);

    if (user) {
      const result = await OtpService.createAndSendOtp({
        userId: user.userId,
        destination: destNorm,
        purpose,
      });

      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          destination: result.destination,
          expiresAt: result.expiresAt,
        },
      });
    }

    // Enumeration defense: identical response even if user not found
    return NextResponse.json({
      success: true,
      message: "If an account matches that destination, verification instructions have been dispatched.",
      data: {
        destination: OtpService.maskDestination(destNorm),
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Failed to process verification request.",
      },
      { status: 400 }
    );
  }
}

