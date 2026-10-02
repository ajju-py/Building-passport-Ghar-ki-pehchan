import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { checkNextAuthRateLimit } from "@/server/middlewares/rateLimiter";
import { z } from "zod";

const verifyEmailSchema = z.union([
  z.object({
    token: z.string().min(10, "Verification token is required"),
  }),
  z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
  }),
]);

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
          details: validated.error.flatten(),
        },
        { status: 400 }
      );
    }

    if ("token" in validated.data) {
      const result = await AuthService.verifyEmailToken(validated.data.token);
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.message,
            reason: result.reason,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
      });
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

export async function GET(req: NextRequest) {
  const rateLimitResponse = checkNextAuthRateLimit(req, "otp");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: "Verification token is required.",
        reason: "MISSING_TOKEN",
      },
      { status: 400 }
    );
  }

  try {
    const result = await AuthService.verifyEmailToken(token);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          reason: result.reason,
        },
        { status: 400 }
      );
    }

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
