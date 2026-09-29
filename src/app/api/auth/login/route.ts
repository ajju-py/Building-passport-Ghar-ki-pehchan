import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { loginSchema } from "@/server/middlewares/validation.middleware";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password format.",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await AuthService.login(validated.data);
    return NextResponse.json({
      success: true,
      message: "Logged in successfully.",
      data: result,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Invalid credentials.",
      },
      { status: 401 }
    );
  }
}
