import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  role: z.enum(["owner", "public"]).optional(),
  mobile: z.string().min(7).max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(128),
});

export const verifyOtpSchema = z.object({
  destination: z.string().min(3, "Destination identifier is required"),
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
  purpose: z.enum(["EMAIL_VERIFICATION", "MOBILE_VERIFICATION"]),
});

export const requestOtpSchema = z.object({
  destination: z.string().min(3, "Destination identifier is required"),
  purpose: z.enum(["EMAIL_VERIFICATION", "MOBILE_VERIFICATION", "PASSWORD_RESET"]),
});

export const userProfileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  mobile: z.string().min(7).max(20).nullable().optional(),
});

export const adminUserCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  role: z.enum(["admin", "engineer", "owner", "public"]),
  mobile: z.string().min(7).max(20).optional(),
});

export const adminUserStatusSchema = z.object({
  status: z.enum(["pending_verification", "active", "suspended", "disabled"]),
});

export const adminUserRoleSchema = z.object({
  role: z.enum(["admin", "engineer", "owner", "public"]),
});

export const buildingCreateSchema = z.object({
  name: z.string().min(2, "Building name is required").max(150),
  type: z.string().min(2, "Building type is required"),
  constructionDate: z.string().min(4, "Construction date is required"),
  location: z.object({
    address: z.string().min(3, "Address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  }),
  totalArea: z.string().min(2, "Total built-up area is required"),
  floors: z.number().int().min(1, "At least 1 floor is required"),
  units: z.number().int().min(1, "At least 1 unit is required"),
  usage: z.string().min(2, "Usage classification is required"),
  description: z.string().optional(),
  structuralInfo: z
    .object({
      frameType: z.string().optional(),
      foundation: z.string().optional(),
      fireRating: z.string().optional(),
      exteriorCladding: z.string().optional(),
      seismicZone: z.string().optional(),
    })
    .optional(),
  builder: z
    .object({
      companyName: z.string().optional(),
      builderName: z.string().optional(),
      contact: z.string().optional(),
      details: z.string().optional(),
    })
    .optional(),
  owner: z
    .object({
      name: z.string().optional(),
      contact: z.string().optional(),
      email: z.string().optional(),
      additionalInfo: z.string().optional(),
    })
    .optional(),
  condition: z.string().optional(),
  maintenanceStatus: z.string().optional(),
});

export const inspectionCreateSchema = z.object({
  date: z.string().min(4, "Date is required"),
  observations: z.string().min(5, "Inspection observations are required"),
  remarks: z.string().min(5, "Engineering remarks are required"),
});

export const defectCreateSchema = z.object({
  inspectionId: z.string().nullable().optional(),
  category: z.string().min(2, "Defect category is required"),
  location: z.string().min(2, "Defect location is required"),
  severity: z.enum(["Low", "Medium", "High", "Critical"]),
  status: z.enum(["Open", "In Review", "Remediated", "Closed"]).optional(),
  details: z.string().min(5, "Defect description is required"),
  imageRef: z.string().nullable().optional(),
});

export const defectUpdateSchema = z.object({
  inspectionId: z.string().nullable().optional(),
  category: z.string().min(2, "Defect category must be at least 2 characters").optional(),
  location: z.string().min(2, "Defect location must be at least 2 characters").optional(),
  severity: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  status: z.enum(["Open", "In Review", "Remediated", "Closed"]).optional(),
  details: z.string().min(5, "Defect description must be at least 5 characters").optional(),
  imageRef: z.string().nullable().optional(),
});

export const maintenanceCreateSchema = z.object({
  repairType: z.string().min(2, "Repair type is required"),
  repairDate: z.string().min(4, "Repair date is required"),
  description: z.string().min(5, "Repair description is required"),
  cost: z.number().finite("Cost must be a finite number").min(0, "Cost must be a positive number"),
  status: z.enum(["Scheduled", "In Progress", "Completed", "Deferred"]).optional(),
  contractor: z.string().min(2, "Contractor/service provider is required"),
  warrantyDetails: z.string().nullable().optional(),
  expectedRepairs: z.string().nullable().optional(),
  futureRequirements: z.string().nullable().optional(),
});

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of err.issues) {
          const path = issue.path.join(".");
          if (!fieldErrors[path]) fieldErrors[path] = [];
          fieldErrors[path].push(issue.message);
        }
        res.status(400).json({
          success: false,
          error: "Validation failed on submitted data.",
          details: fieldErrors,
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: "Malformed request payload.",
      });
    }
  };
}
