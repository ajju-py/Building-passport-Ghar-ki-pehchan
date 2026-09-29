import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { UserSession } from "@/lib/types";

export interface AuthenticatedRequest extends Request {
  user?: UserSession;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Authentication required. Please provide a valid Bearer token.",
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  const session = AuthService.verifyToken(token);

  if (!session) {
    res.status(401).json({
      success: false,
      error: "Session expired or invalid credentials. Please log in again.",
    });
    return;
  }

  req.user = session;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const session = AuthService.verifyToken(token);
    if (session) {
      req.user = session;
    }
  }
  next();
}
