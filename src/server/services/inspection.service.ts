import { InspectionRecord } from "@/lib/types";
import { connectDb, isDbConnected } from "../db";
import { InspectionModel } from "../models/Inspection";
import { memoryInspections } from "./building.service";

export class InspectionService {
  public static async createInspection(
    buildingId: string,
    data: {
      inspectorId: string;
      inspectorName: string;
      date: string;
      observations: string;
      remarks: string;
    }
  ): Promise<InspectionRecord> {
    const inspectionId = `INS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        const created = await InspectionModel.create({
          inspectionId,
          buildingId,
          ...data,
        });
        const rec: InspectionRecord = {
          id: created._id.toString(),
          inspectionId: created.inspectionId,
          buildingId: created.buildingId.toString(),
          inspectorId: created.inspectorId.toString(),
          inspectorName: created.inspectorName,
          date: created.date,
          observations: created.observations,
          remarks: created.remarks,
          defectsCount: created.defectsCount || 0,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
        memoryInspections.unshift(rec);
        return rec;
      }
    } catch {
      // Memory fallback
    }

    const rec: InspectionRecord = {
      id: `insp_${Date.now()}`,
      inspectionId,
      buildingId,
      ...data,
      defectsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryInspections.unshift(rec);
    return rec;
  }

  public static async getInspections(buildingId: string): Promise<InspectionRecord[]> {
    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        const docs = await InspectionModel.find({ buildingId }).sort({ date: -1 });
        if (docs.length > 0) {
          return docs.map((d) => ({
            id: d._id.toString(),
            inspectionId: d.inspectionId,
            buildingId: d.buildingId.toString(),
            inspectorId: d.inspectorId.toString(),
            inspectorName: d.inspectorName,
            date: d.date,
            observations: d.observations,
            remarks: d.remarks,
            defectsCount: d.defectsCount,
            createdAt: d.createdAt.toISOString(),
            updatedAt: d.updatedAt.toISOString(),
          }));
        }
      }
    } catch {
      // Memory fallback
    }

    return memoryInspections.filter((i) => i.buildingId === buildingId);
  }
}
