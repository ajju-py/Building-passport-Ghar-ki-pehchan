import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { checkNextAuthRateLimit } from "@/server/middlewares/rateLimiter";
import { z } from "zod";

const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkNextAuthRateLimit(req, "otp");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();
    const validated = resendVerificationSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email address format.",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await AuthService.resendVerification(validated.data.email);
    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Unable to process resend request.",
      },
      { status: 400 }
    );
  }
}
