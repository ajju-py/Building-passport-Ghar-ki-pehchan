import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import { env } from "../config/env";
import { isDbConnected } from "../db";
import { AuthService } from "../services/auth.service";
import { BuildingService } from "../services/building.service";
import { InspectionService } from "../services/inspection.service";
import { DefectService } from "../services/defect.service";
import { MaintenanceService } from "../services/maintenance.service";
import { DocumentService } from "../services/document.service";
import { storageService } from "../services/storage.service";
import { requireAuth, optionalAuth, AuthenticatedRequest } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import {
  registerSchema,
  loginSchema,
  buildingCreateSchema,
  inspectionCreateSchema,
  defectCreateSchema,
  maintenanceCreateSchema,
  validateBody,
} from "../middlewares/validation.middleware";
import { ApiResponse } from "@/lib/types";

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
app.get("/api/health", (_req: Request, res: Response) => {
  const dbConnected = isDbConnected();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: {
      provider: "mongodb",
      connected: dbConnected,
      mode: dbConnected ? "live-mongodb" : "memory-fallback-active",
      notice: dbConnected
        ? "Connected to MongoDB instance"
        : "Live MongoDB not reached. Operating in high-fidelity civil in-memory repository.",
    },
    version: "2.0.0-stage2",
  });
});

// -----------------------------------------------------------
// AUTHENTICATION ROUTES
// -----------------------------------------------------------
app.post("/api/auth/register", validateBody(registerSchema), async (req: Request, res: Response) => {
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
});

app.post("/api/auth/login", validateBody(loginSchema), async (req: Request, res: Response) => {
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

app.get("/api/auth/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: req.user,
  });
});

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

app.get("/api/buildings/:id", async (req: Request, res: Response) => {
  try {
    const building = await BuildingService.getBuildingById(String(req.params.id));
    if (!building) {
      res.status(404).json({
        success: false,
        error: "Building not found.",
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

app.patch("/api/defects/:defectId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await DefectService.updateDefect(String(req.params.defectId), req.body);
    if (!updated) {
      res.status(404).json({
        success: false,
        error: "Defect record not found.",
      });
      return;
    }
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
});

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

// -----------------------------------------------------------
// DOCUMENTS & BLUEPRINTS UPLOAD ROUTES
// -----------------------------------------------------------
app.get("/api/buildings/:id/documents", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const docs = await DocumentService.getDocuments(String(req.params.id), req.user?.role);
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
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No file uploaded. Please attach a blueprint, permit, or CAD file.",
        });
        return;
      }

      const { title, documentType, isPrivate } = req.body;
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

// -----------------------------------------------------------
// PHOTOGRAPHS UPLOAD ROUTE
// -----------------------------------------------------------
app.post(
  "/api/buildings/:id/photographs",
  requireAuth,
  requireRole("admin", "engineer", "owner"),
  upload.single("photo"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No photo attached.",
        });
        return;
      }

      const stored = await storageService.save(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      const { caption, category, isPrivate } = req.body;
      const photoItem = {
        url: stored.url,
        caption: caption || req.file.originalname,
        category: category || "additional",
        isPrivate: isPrivate === "true" || isPrivate === true,
        uploadedAt: new Date().toISOString(),
      };

      const building = await BuildingService.getBuildingById(String(req.params.id));
      if (!building) {
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
      res.status(400).json({
        success: false,
        error: (err as Error).message || "Photograph upload failed.",
      });
    }
  }
);

// Global Error Handler
app.use((err: Error & { status?: number }, _req: Request, res: Response, next: NextFunction) => {
  console.error("[Express Server Error]", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error occurred.",
  });
});
