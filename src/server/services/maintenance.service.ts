import { MaintenanceRecord, MaintenanceStatus } from "@/lib/types";
import { connectDb, isDbConnected } from "../db";
import { MaintenanceModel } from "../models/Maintenance";
import { memoryMaintenance } from "./building.service";

export class MaintenanceService {
  public static async createMaintenance(
    buildingId: string,
    data: {
      repairType: string;
      repairDate: string;
      description: string;
      cost: number;
      status?: MaintenanceStatus;
      contractor: string;
      warrantyDetails?: string;
      expectedRepairs?: string;
      futureRequirements?: string;
    }
  ): Promise<MaintenanceRecord> {
    const maintenanceId = `MNT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        const created = await MaintenanceModel.create({
          maintenanceId,
          buildingId,
          repairType: data.repairType,
          repairDate: data.repairDate,
          description: data.description,
          cost: data.cost,
          status: data.status || "Completed",
          contractor: data.contractor,
          warrantyDetails: data.warrantyDetails || "",
          expectedRepairs: data.expectedRepairs || "",
          futureRequirements: data.futureRequirements || "",
        });

        const rec: MaintenanceRecord = {
          id: created._id.toString(),
          maintenanceId: created.maintenanceId,
          buildingId: created.buildingId.toString(),
          repairType: created.repairType,
          repairDate: created.repairDate,
          description: created.description,
          cost: created.cost,
          status: created.status,
          contractor: created.contractor,
          warrantyDetails: created.warrantyDetails,
          expectedRepairs: created.expectedRepairs,
          futureRequirements: created.futureRequirements,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
        memoryMaintenance.unshift(rec);
        return rec;
      }
    } catch {
      // Memory fallback
    }

    const rec: MaintenanceRecord = {
      id: `maint_${Date.now()}`,
      maintenanceId,
      buildingId,
      repairType: data.repairType,
      repairDate: data.repairDate,
      description: data.description,
      cost: data.cost,
      status: data.status || "Completed",
      contractor: data.contractor,
      warrantyDetails: data.warrantyDetails,
      expectedRepairs: data.expectedRepairs,
      futureRequirements: data.futureRequirements,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryMaintenance.unshift(rec);
    return rec;
  }

  public static async getMaintenance(buildingId: string): Promise<MaintenanceRecord[]> {
    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        const docs = await MaintenanceModel.find({ buildingId }).sort({ repairDate: -1 });
        if (docs.length > 0) {
          return docs.map((d) => ({
            id: d._id.toString(),
            maintenanceId: d.maintenanceId,
            buildingId: d.buildingId.toString(),
            repairType: d.repairType,
            repairDate: d.repairDate,
            description: d.description,
            cost: d.cost,
            status: d.status,
            contractor: d.contractor,
            warrantyDetails: d.warrantyDetails,
            expectedRepairs: d.expectedRepairs,
            futureRequirements: d.futureRequirements,
            createdAt: d.createdAt.toISOString(),
            updatedAt: d.updatedAt.toISOString(),
          }));
        }
      }
    } catch {
      // Memory fallback
    }

    return memoryMaintenance.filter((m) => m.buildingId === buildingId);
  }
}
