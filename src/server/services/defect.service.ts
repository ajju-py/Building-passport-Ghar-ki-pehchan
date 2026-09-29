import { DefectRecord, DefectSeverity, DefectStatus } from "@/lib/types";
import { connectDb, isDbConnected } from "../db";
import { DefectModel } from "../models/Defect";
import { memoryDefects } from "./building.service";

export class DefectService {
  public static async createDefect(
    buildingId: string,
    data: {
      inspectionId?: string;
      category: string;
      location: string;
      severity: DefectSeverity;
      status?: DefectStatus;
      details: string;
      imageRef?: string;
    }
  ): Promise<DefectRecord> {
    const defectId = `DEF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        const created = await DefectModel.create({
          defectId,
          buildingId,
          category: data.category,
          location: data.location,
          severity: data.severity,
          status: data.status || "Open",
          details: data.details,
          imageRef: data.imageRef || "",
          inspectionId: data.inspectionId,
        });

        const rec: DefectRecord = {
          id: created._id.toString(),
          defectId: created.defectId,
          buildingId: created.buildingId.toString(),
          inspectionId: created.inspectionId?.toString(),
          category: created.category,
          location: created.location,
          severity: created.severity,
          status: created.status,
          details: created.details,
          imageRef: created.imageRef,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
        memoryDefects.unshift(rec);
        return rec;
      }
    } catch {
      // Memory fallback
    }

    const rec: DefectRecord = {
      id: `def_${Date.now()}`,
      defectId,
      buildingId,
      inspectionId: data.inspectionId,
      category: data.category,
      location: data.location,
      severity: data.severity,
      status: data.status || "Open",
      details: data.details,
      imageRef: data.imageRef,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryDefects.unshift(rec);
    return rec;
  }

  public static async getDefects(buildingId: string): Promise<DefectRecord[]> {
    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        const docs = await DefectModel.find({ buildingId }).sort({ createdAt: -1 });
        if (docs.length > 0) {
          return docs.map((d) => ({
            id: d._id.toString(),
            defectId: d.defectId,
            buildingId: d.buildingId.toString(),
            inspectionId: d.inspectionId?.toString(),
            category: d.category,
            location: d.location,
            severity: d.severity,
            status: d.status,
            details: d.details,
            imageRef: d.imageRef,
            createdAt: d.createdAt.toISOString(),
            updatedAt: d.updatedAt.toISOString(),
          }));
        }
      }
    } catch {
      // Memory fallback
    }

    return memoryDefects.filter((d) => d.buildingId === buildingId);
  }

  public static async updateDefect(
    defectId: string,
    updates: Partial<DefectRecord>
  ): Promise<DefectRecord | null> {
    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        const updated = await DefectModel.findOneAndUpdate(
          { $or: [{ _id: defectId }, { defectId }] },
          updates,
          { new: true }
        );
        if (updated) {
          const rec: DefectRecord = {
            id: updated._id.toString(),
            defectId: updated.defectId,
            buildingId: updated.buildingId.toString(),
            inspectionId: updated.inspectionId?.toString(),
            category: updated.category,
            location: updated.location,
            severity: updated.severity,
            status: updated.status,
            details: updated.details,
            imageRef: updated.imageRef,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
          };
          const idx = memoryDefects.findIndex((d) => d.id === rec.id || d.defectId === rec.defectId);
          if (idx !== -1) memoryDefects[idx] = rec;
          return rec;
        }
      }
    } catch {
      // Memory fallback
    }

    const idx = memoryDefects.findIndex((d) => d.id === defectId || d.defectId === defectId);
    if (idx !== -1) {
      memoryDefects[idx] = {
        ...memoryDefects[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return memoryDefects[idx];
    }
    return null;
  }
}
