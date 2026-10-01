import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import { env } from "../config/env";
import { isDbConnected } from "../db";
import { checkPostgresHealth } from "../db/postgres";
import { AuthService } from "../services/auth.service";
import { BuildingService } from "../services/building.service";
import { InspectionService } from "../services/inspection.service";
import { DefectService } from "../services/defect.service";
import { MaintenanceService } from "../services/maintenance.service";
import { DocumentService } from "../services/document.service";
import { storageService } from "../services/storage.service";
import { requireAuth, optionalAuth, AuthenticatedRequest } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { UserService } from "../services/user.service";
import { OtpService } from "../services/otp.service";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyOtpSchema,
  requestOtpSchema,
  userProfileUpdateSchema,
  adminUserCreateSchema,
  adminUserStatusSchema,
  adminUserRoleSchema,
  buildingCreateSchema,
  inspectionCreateSchema,
  defectCreateSchema,
  defectUpdateSchema,
  maintenanceCreateSchema,
  validateBody,
} from "../middlewares/validation.middleware";
import { ApiResponse, UserRole, AccountStatus } from "@/lib/types";
import { createAuthRateLimiter } from "../middlewares/rateLimiter";


// Setup multer memory storage for streaming directly into storageService
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "application/dwg",
      "application/dxf",
      "application/octet-stream",
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(pdf|jpe?g|png|webp|svg|dwg|dxf)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported for civil documentation. Allowed: PDF, JPG, PNG, WEBP, SVG, CAD (DWG/DXF)."));
    }
  },
});

export const app = express();

// Global Middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files for uploaded documents & photographs
app.use("/uploads", express.static(env.UPLOAD_DIR));

// -----------------------------------------------------------
// SYSTEM & HEALTH CHECK
// -----------------------------------------------------------
app.get("/api/health", async (_req: Request, res: Response) => {
  const dbConnected = isDbConnected();
  const pgHealth = await checkPostgresHealth();

  res.json({
    status: pgHealth.connected ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: {
      provider: "postgresql",
      connected: pgHealth.connected,
      mode: pgHealth.connected ? "live-postgresql" : "disconnected",
      postgres: {
        connected: pgHealth.connected,
        endpoint: pgHealth.endpoint,
        database: pgHealth.database,
        latencyMs: pgHealth.latencyMs,
        version: pgHealth.version,
      },
      mongodb: {
        connected: dbConnected,
      },
      notice: pgHealth.connected
        ? "Connected to PostgreSQL 17 primary database."
        : `PostgreSQL connection issue: ${pgHealth.error}`,
    },
    version: "2.0.0-stage2",
  });
});

// -----------------------------------------------------------
// AUTHENTICATION ROUTES
// -----------------------------------------------------------
app.post(
  "/api/auth/register",
  createAuthRateLimiter("register"),
  validateBody(registerSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await AuthService.register(req.body);
      const response: ApiResponse<typeof result> = {
        success: true,
        message: "User registered successfully.",
        data: result,
      };
      res.status(201).json(response);
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        error: (err as Error).message || "Registration failed.",
      });
    }
  }
);

app.post(
  "/api/auth/login",
  createAuthRateLimiter("login"),
  validateBody(loginSchema),
  async (req: Request, res: Response) => {
  try {
    const result = await AuthService.login(req.body);
    const response: ApiResponse<typeof result> = {
      success: true,
      message: "Logged in successfully.",
      data: result,
    };
    res.json(response);
  } catch (err: unknown) {
    res.status(401).json({
      success: false,
      error: (err as Error).message || "Invalid credentials.",
    });
  }
});

app.post("/api/auth/logout", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Logged out successfully.",
  });
});

app.get("/api/auth/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: req.user,
  });
});

app.post(
  "/api/auth/request-otp",
  createAuthRateLimiter("otp"),
  validateBody(requestOtpSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { destination, purpose } = req.body;
      const destNorm = destination.trim().toLowerCase();
      let userId = req.user?.userId;

      if (!userId) {
        const userRes = await AuthService.findById(destNorm);
        if (userRes) {
          userId = userRes.userId;
        }
      }

      if (userId) {
        const result = await OtpService.createAndSendOtp({
          userId,
          destination: destNorm,
          purpose,
        });
        res.json({
          success: true,
          message: result.message,
          data: {
            destination: result.destination,
            expiresAt: result.expiresAt,
          },
        });
        return;
      }

      // Enumeration defense
      res.json({
        success: true,
        message: "If an account matches that destination, verification instructions have been dispatched.",
        data: {
          destination: OtpService.maskDestination(destNorm),
        },
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        error: (err as Error).message || "Failed to process verification request.",
      });
    }
  }
);

app.post(
  "/api/auth/verify-otp",
  createAuthRateLimiter("otp"),
  validateBody(verifyOtpSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await AuthService.verifyOtp({
        destinationOrUserId: req.body.destination,
        otp: req.body.otp,
        purpose: req.body.purpose,
      });
      res.json({
        success: true,
        message: result.message,
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        error: (err as Error).message || "Verification failed.",
      });
    }
  }
);

app.post(
  "/api/auth/verify-email",
  createAuthRateLimiter("otp"),
  async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        res.status(400).json({
          success: false,
          error: "Email and OTP are required.",
        });
        return;
      }
      const result = await AuthService.verifyOtp({
        destinationOrUserId: email,
        otp: String(otp),
        purpose: "EMAIL_VERIFICATION",
      });
      res.json({
        success: true,
        message: result.message,
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        error: (err as Error).message || "Email verification failed.",
      });
    }
  }
);

app.post(
  "/api/auth/forgot-password",
  createAuthRateLimiter("forgot-password"),
  validateBody(forgotPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        error: (err as Error).message || "Request failed.",
      });
    }
  }
);

app.post(
  "/api/auth/reset-password",
  createAuthRateLimiter("reset-password"),
  validateBody(resetPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await AuthService.resetPassword(req.body);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        error: (err as Error).message || "Password reset failed.",
      });
    }
  }
);

app.post(
  "/api/auth/change-password",
  requireAuth,
  createAuthRateLimiter("change-password"),
  validateBody(changePasswordSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await AuthService.changePassword(req.user!.userId, req.body);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        error: (err as Error).message || "Password change failed.",
      });
    }
  }
);

// -----------------------------------------------------------
// USER MANAGEMENT & PROFILE ROUTES
// -----------------------------------------------------------
app.get("/api/users/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await UserService.getProfile(req.user!.userId);
    if (!profile) {
      res.status(404).json({ success: false, error: "User profile not found." });
      return;
    }
    res.json({ success: true, data: profile });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

app.patch(
  "/api/users/me",
  requireAuth,
  validateBody(userProfileUpdateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updated = await UserService.updateProfile(req.user!.userId, req.body);
      res.json({
        success: true,
        message: "Profile updated successfully.",
        data: updated,
      });
    } catch (err: unknown) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }
);

app.get(
  "/api/users",
  requireAuth,
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const search = req.query.search ? String(req.query.search) : undefined;
      const role = req.query.role ? (String(req.query.role) as UserRole) : undefined;
      const status = req.query.status ? (String(req.query.status) as AccountStatus) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;
      const page = Math.floor(offset / limit) + 1;

      const result = await UserService.listUsers({ search, role, status, page, limit });
      res.json({ success: true, data: result });
    } catch (err: unknown) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }
);

app.get(
  "/api/users/:id",
  requireAuth,
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const user = await UserService.getProfile(String(req.params.id));
      if (!user) {
        res.status(404).json({ success: false, error: `User with ID '${req.params.id}' not found.` });
        return;
      }
      res.json({ success: true, data: user });
    } catch (err: unknown) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }
);

app.post(
  "/api/users",
  requireAuth,
  requireRole("admin"),
  validateBody(adminUserCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const created = await UserService.adminCreateUser(req.body);
      res.status(201).json({
        success: true,
        message: "User created successfully by administrator.",
        data: created,
      });
    } catch (err: unknown) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }
);

app.patch(
  "/api/users/:id/status",
  requireAuth,
  requireRole("admin"),
  validateBody(adminUserStatusSchema),
  async (req: Request, res: Response) => {
    try {
      const updated = await UserService.updateUserStatus(String(req.params.id), req.body.status);
      res.json({
        success: true,
        message: `User account status updated to '${req.body.status}'.`,
        data: updated,
      });
    } catch (err: unknown) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }
);

app.patch(
  "/api/users/:id/role",
  requireAuth,
  requireRole("admin"),
  validateBody(adminUserRoleSchema),
  async (req: Request, res: Response) => {
    try {
      const updated = await UserService.updateUserRole(String(req.params.id), req.body.role);
      res.json({
        success: true,
        message: `User role updated to '${req.body.role}'.`,
        data: updated,
      });
    } catch (err: unknown) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }
);

// -----------------------------------------------------------
// PUBLIC QR ACCESS ROUTES (NO AUTH REQUIRED, SANITIZED DATA ONLY)
// -----------------------------------------------------------
app.get("/api/public/building/:passportId", async (req: Request, res: Response) => {
  try {
    const passportId = String(req.params.passportId);
    const building = await BuildingService.getPublicPassport(passportId);
    if (!building) {
      res.status(404).json({
        success: false,
        error: `Building Passport ID '${passportId}' not found in registry.`,
      });
      return;
    }
    res.json({
      success: true,
      data: building,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: (err as Error).message || "Error resolving public building passport.",
    });
  }
});

// -----------------------------------------------------------
// BUILDINGS MANAGEMENT ROUTES
// -----------------------------------------------------------
app.get("/api/buildings", async (req: Request, res: Response) => {
  try {
    const { search, type, condition, maintenanceStatus } = req.query as Record<string, string>;
    const buildings = await BuildingService.getBuildings({
      search,
      type,
      condition,
      maintenanceStatus,
    });
    res.json({
      success: true,
      data: buildings,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: (err as Error).message || "Failed to retrieve buildings.",
    });
  }
});

app.post(
  "/api/buildings",
  requireAuth,
  requireRole("admin", "engineer", "owner"),
  validateBody(buildingCreateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const created = await BuildingService.createBuilding(req.body, req.user?.userId);
      res.status(201).json({
        success: true,
        message: "Building Passport created successfully.",
        data: created,
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        error: (err as Error).message || "Failed to create building passport.",
      });
    }
  }
);

app.get("/api/buildings/:id", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const building = await BuildingService.getBuildingById(String(req.params.id));
    if (!building) {
      res.status(404).json({
        success: false,
        error: "Building not found.",
      });
      return;
    }

    const canSeePrivate =
      req.user?.role === "admin" ||
      req.user?.role === "engineer" ||
      (req.user?.role === "owner" && building.createdBy && building.createdBy === req.user.userId);

    const safeBuilding = {
      ...building,
      photographs: canSeePrivate
        ? building.photographs
        : building.photographs.filter((p) => !p.isPrivate),
    };

    res.json({
      success: true,
      data: safeBuilding,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: (err as Error).message || "Failed to retrieve building.",
    });
  }
});

app.put(
  "/api/buildings/:id",
  requireAuth,
  requireRole("admin", "engineer", "owner"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const access = await BuildingService.checkBuildingModificationAccess(
        String(req.params.id),
        req.user!
      );
      if (!access.allowed) {
        res.status(access.status).json({
          success: false,
          error: access.message,
        });
        return;
      }

      const updated = await BuildingService.updateBuilding(String(req.params.id), req.body);
      if (!updated) {
        res.status(404).json({
          success: false,
          error: "Building not found to update.",
        });
        return;
      }
      res.json({
        success: true,
        message: "Building record updated successfully.",
        data: updated,
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        error: (err as Error).message || "Failed to update building.",
      });
    }
  }
);

app.get("/api/buildings/:id/report", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await BuildingService.generateReport(String(req.params.id), req.user!);
    if (!report) {
      res.status(404).json({
        success: false,
        error: "Building report could not be generated.",
      });
      return;
    }
    res.json({
      success: true,
      data: report,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: (err as Error).message || "Failed to compile building report.",
    });
  }
});

// -----------------------------------------------------------
// INSPECTION ROUTES
// -----------------------------------------------------------
app.get("/api/buildings/:id/inspections", async (req: Request, res: Response) => {
  try {
    const inspections = await InspectionService.getInspections(String(req.params.id));
    res.json({
      success: true,
      data: inspections,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: (err as Error).message || "Failed to retrieve inspections.",
    });
  }
});

app.post(
  "/api/buildings/:id/inspections",
  requireAuth,
  requireRole("admin", "engineer"),
  validateBody(inspectionCreateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const inspection = await InspectionService.createInspection(String(req.params.id), {
        inspectorId: req.user!.userId,
        inspectorName: req.user!.name,
        date: req.body.date,
        observations: req.body.observations,
        remarks: req.body.remarks,
      });
      res.status(201).json({
        success: true,
        message: "Inspection logged successfully.",
        data: inspection,
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        error: (err as Error).message || "Failed to record inspection.",
      });
    }
  }
);

app.get("/api/inspections/:id", async (req: Request, res: Response) => {
  try {
    const inspection = await InspectionService.getInspectionById(String(req.params.id));
    if (!inspection) {
      res.status(404).json({
        success: false,
        error: "Inspection record not found.",
      });
      return;
    }
    res.json({
      success: true,
      data: inspection,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: (err as Error).message || "Failed to retrieve inspection.",
    });
  }
});

// -----------------------------------------------------------
// DEFECT ROUTES
// -----------------------------------------------------------
app.get("/api/buildings/:id/defects", async (req: Request, res: Response) => {
  try {
    const defects = await DefectService.getDefects(String(req.params.id));
    res.json({
      success: true,
      data: defects,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: (err as Error).message || "Failed to retrieve defects.",
    });
  }
});

app.post(
  "/api/buildings/:id/defects",
  requireAuth,
  requireRole("admin", "engineer", "owner"),
  validateBody(defectCreateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const access = await BuildingService.checkBuildingModificationAccess(
        String(req.params.id),
        req.user!
      );
      if (!access.allowed) {
        res.status(access.status).json({
          success: false,
          error: access.message,
        });
        return;
      }

      const defect = await DefectService.createDefect(String(req.params.id), req.body);
      res.status(201).json({
        success: true,
        message: "Defect logged successfully.",
        data: defect,
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        error: (err as Error).message || "Failed to record defect.",
      });
    }
  }
);

app.get("/api/defects/:defectId", async (req: Request, res: Response) => {
  try {
    const defect = await DefectService.getDefectById(String(req.params.defectId));
    if (!defect) {
      res.status(404).json({
        success: false,
        error: "Defect record not found.",
      });
      return;
    }
    res.json({
      success: true,
      data: defect,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: (err as Error).message || "Failed to retrieve defect.",
    });
  }
});

app.patch(
  "/api/defects/:defectId",
  requireAuth,
  requireRole("admin", "engineer", "owner"),
  validateBody(defectUpdateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const existing = await DefectService.getDefectById(String(req.params.defectId));
      if (!existing) {
        res.status(404).json({
          success: false,
          error: "Defect record not found.",
        });
        return;
      }

      const access = await BuildingService.checkBuildingModificationAccess(
        existing.buildingId,
        req.user!
      );
      if (!access.allowed) {
        res.status(access.status).json({
          success: false,
          error: access.message,
        });
        return;
      }

      const updated = await DefectService.updateDefect(String(req.params.defectId), req.body);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        error: (err as Error).message || "Failed to update defect.",
      });
    }
  }
);

// -----------------------------------------------------------
// MAINTENANCE ROUTES
// -----------------------------------------------------------
app.get("/api/buildings/:id/maintenance", async (req: Request, res: Response) => {
  try {
    const maintenance = await MaintenanceService.getMaintenance(String(req.params.id));
    res.json({
      success: true,
      data: maintenance,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: (err as Error).message || "Failed to retrieve maintenance records.",
    });
  }
});

app.post(
  "/api/buildings/:id/maintenance",
  requireAuth,
  requireRole("admin", "engineer", "owner"),
  validateBody(maintenanceCreateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const access = await BuildingService.checkBuildingModificationAccess(
        String(req.params.id),
        req.user!
      );
      if (!access.allowed) {
        res.status(access.status).json({
          success: false,
          error: access.message,
        });
        return;
      }

      const record = await MaintenanceService.createMaintenance(String(req.params.id), req.body);
      res.status(201).json({
        success: true,
        message: "Maintenance record added successfully.",
        data: record,
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        error: (err as Error).message || "Failed to record maintenance.",
      });
    }
  }
);

app.get("/api/maintenance/:id", async (req: Request, res: Response) => {
  try {
    const record = await MaintenanceService.getMaintenanceById(String(req.params.id));
    if (!record) {
      res.status(404).json({
        success: false,
        error: "Maintenance record not found.",
      });
      return;
    }
    res.json({
      success: true,
      data: record,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: (err as Error).message || "Failed to retrieve maintenance record.",
    });
  }
});

// -----------------------------------------------------------
// DOCUMENTS & BLUEPRINTS UPLOAD ROUTES
// -----------------------------------------------------------
app.get("/api/buildings/:id/documents", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const docs = await DocumentService.getDocuments(String(req.params.id), req.user);
    res.json({
      success: true,
      data: docs,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: (err as Error).message || "Failed to retrieve documents.",
    });
  }
});

app.post(
  "/api/buildings/:id/documents",
  requireAuth,
  requireRole("admin", "engineer", "owner"),
  upload.single("file"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const access = await BuildingService.checkBuildingModificationAccess(
        String(req.params.id),
        req.user!
      );
      if (!access.allowed) {
        res.status(access.status).json({
          success: false,
          error: access.message,
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No file uploaded. Please attach a blueprint, permit, or CAD file.",
        });
        return;
      }

      const { title, documentType, isPrivate } = req.body;
      const validTypes = ["blueprint", "structural", "permit", "report", "other"];
      if (documentType !== undefined && documentType !== null && !validTypes.includes(documentType)) {
        res.status(400).json({
          success: false,
          error: `Invalid document type '${documentType}'. Allowed: ${validTypes.join(", ")}`,
        });
        return;
      }

      const doc = await DocumentService.uploadDocument({
        buildingId: String(req.params.id),
        fileBuffer: req.file.buffer,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
        title: title || req.file.originalname,
        documentType: documentType || "blueprint",
        isPrivate: isPrivate === "true" || isPrivate === true,
        uploadedBy: req.user?.userId,
      });

      res.status(201).json({
        success: true,
        message: "Civil document uploaded and indexed successfully.",
        data: doc,
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        error: (err as Error).message || "File upload failed.",
      });
    }
  }
);

app.get("/api/documents/:id", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await DocumentService.getDocumentById(String(req.params.id));
    if (!doc) {
      res.status(404).json({
        success: false,
        error: "Document record not found.",
      });
      return;
    }

    if (doc.isPrivate && req.user?.role !== "admin" && req.user?.role !== "engineer") {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized. This document is confidential.",
        });
        return;
      }
      const access = await BuildingService.checkBuildingModificationAccess(doc.buildingId, req.user);
      if (!access.allowed) {
        res.status(403).json({
          success: false,
          error: "Forbidden. This document is confidential.",
        });
        return;
      }
    }

    res.json({
      success: true,
      data: doc,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: (err as Error).message || "Failed to retrieve document.",
    });
  }
});

// -----------------------------------------------------------
// PHOTOGRAPHS ROUTES
// -----------------------------------------------------------
app.get("/api/buildings/:id/photographs", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const photos = await BuildingService.getPhotographs(String(req.params.id), req.user);
    if (!photos) {
      res.status(404).json({
        success: false,
        error: "Building not found.",
      });
      return;
    }
    res.json({
      success: true,
      data: photos,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: (err as Error).message || "Failed to retrieve photographs.",
    });
  }
});

app.post(
  "/api/buildings/:id/photographs",
  requireAuth,
  requireRole("admin", "engineer", "owner"),
  upload.single("photo"),
  async (req: AuthenticatedRequest, res: Response) => {
    let savedStorageRef: string | null = null;
    try {
      const access = await BuildingService.checkBuildingModificationAccess(
        String(req.params.id),
        req.user!
      );
      if (!access.allowed) {
        res.status(access.status).json({
          success: false,
          error: access.message,
        });
        return;
      }

      const { caption, category, isPrivate } = req.body || {};
      const validCategories = ["main", "additional", "construction"];
      const categoryToUse = category || "additional";
      if (!validCategories.includes(categoryToUse)) {
        res.status(400).json({
          success: false,
          error: `Invalid photograph category '${categoryToUse}'. Allowed: ${validCategories.join(", ")}`,
        });
        return;
      }

      let photoUrl = "";
      let defaultCaption = "";

      if (req.file) {
        const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
        const allowedExts = /\.(jpe?g|png|webp|svg)$/i;
        if (!allowedMimes.includes(req.file.mimetype) && !allowedExts.test(req.file.originalname)) {
          res.status(400).json({
            success: false,
            error: "Invalid image file type. Allowed: JPG, PNG, WEBP, SVG.",
          });
          return;
        }

        const stored = await storageService.save(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        savedStorageRef = stored.storageRef;
        photoUrl = stored.url;
        defaultCaption = req.file.originalname;
      } else if (req.body?.url) {
        photoUrl = req.body.url;
        defaultCaption = req.body.caption || "Building Photograph";
      } else {
        res.status(400).json({
          success: false,
          error: "No photo attached or URL provided.",
        });
        return;
      }

      const photoItem = {
        url: photoUrl,
        caption: caption || defaultCaption,
        category: categoryToUse as "main" | "additional" | "construction",
        isPrivate: isPrivate === "true" || isPrivate === true,
        uploadedAt: new Date().toISOString(),
      };

      const building = await BuildingService.getBuildingById(String(req.params.id));
      if (!building) {
        if (savedStorageRef) {
          await storageService.delete(savedStorageRef);
        }
        res.status(404).json({
          success: false,
          error: "Building not found.",
        });
        return;
      }

      const updatedPhotos = [...building.photographs, photoItem];
      const updated = await BuildingService.updateBuilding(String(req.params.id), {
        photographs: updatedPhotos,
      });

      res.status(201).json({
        success: true,
        message: "Building photograph registered successfully.",
        data: updated?.photographs,
      });
    } catch (err: unknown) {
      if (savedStorageRef) {
        await storageService.delete(savedStorageRef);
      }
      res.status(400).json({
        success: false,
        error: (err as Error).message || "Photograph upload failed.",
      });
    }
  }
);

// Global Error Handler
app.use((err: Error & { status?: number; code?: string }, _req: Request, res: Response, next: NextFunction) => {
  console.error("[Express Server Error]", err);
  if (res.headersSent) {
    return next(err);
  }
  let status = err.status || 500;
  if (err.name === "MulterError" || err.code === "LIMIT_FILE_SIZE") {
    status = 413;
  }
  // Multer fileFilter throws plain Error with identifiable message
  if (
    err.message?.includes("File type not supported") ||
    err.message?.includes("Allowed:") ||
    err.message?.includes("file size") ||
    err.message?.includes("not supported")
  ) {
    status = 400;
  }
  res.status(status).json({
    success: false,
    error: err.message || "Internal server error occurred.",
  });
});
