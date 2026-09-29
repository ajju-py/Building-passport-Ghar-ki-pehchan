import { NextRequest } from "next/server";
import { AuthService } from "../services/auth.service";
import { UserRole, UserSession } from "@/lib/types";

export function getSessionFromRequest(req: NextRequest): UserSession | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  return AuthService.verifyToken(token);
}

export function enforceAuth(req: NextRequest, allowedRoles?: UserRole[]): {
  session: UserSession | null;
  errorResponse?: { status: number; message: string };
} {
  const session = getSessionFromRequest(req);
  if (!session) {
    return {
      session: null,
      errorResponse: { status: 401, message: "Authentication required." },
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    return {
      session: null,
      errorResponse: {
        status: 403,
        message: `Forbidden. Role '${session.role}' is not authorized.`,
      },
    };
  }

  return { session };
}
