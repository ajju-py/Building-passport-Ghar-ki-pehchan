import { Response, NextFunction } from "express";
import { UserRole } from "@/lib/types";
import { AuthenticatedRequest } from "./auth.middleware";

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Unauthorized. Authentication required before role verification.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden. Role '${req.user.role}' does not possess required privileges (${allowedRoles.join(", ")}).`,
      });
      return;
    }

    next();
  };
}
