import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { registerSchema } from "@/server/middlewares/validation.middleware";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);
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

    const result = await AuthService.register(validated.data);
    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully.",
        data: result,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || "Registration failed.",
      },
      { status: 400 }
    );
  }
}
