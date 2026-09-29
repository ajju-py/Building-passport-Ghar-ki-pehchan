import { BuildingRecord, BuildingReport, UserSession } from "@/lib/types";
import { connectDb, isDbConnected } from "../db";
import { BuildingModel } from "../models/Building";
import { QrService } from "./qr.service";
import {
  initialSeedBuildings,
  initialSeedInspections,
  initialSeedDefects,
  initialSeedMaintenance,
  initialSeedDocuments,
} from "../data/seedData";

// In-memory collections initialized with seed data
const memoryBuildings: BuildingRecord[] = [...initialSeedBuildings];
const memoryInspections = [...initialSeedInspections];
const memoryDefects = [...initialSeedDefects];
const memoryMaintenance = [...initialSeedMaintenance];
const memoryDocuments = [...initialSeedDocuments];

// Initialize QR codes for seed buildings asynchronously
(async () => {
  for (const b of memoryBuildings) {
    if (!b.qrCodeDataUrl) {
      try {
        b.qrCodeDataUrl = await QrService.generatePassportQr(b.passportId);
      } catch {
        // Fallback
      }
    }
  }
})();

export class BuildingService {
  /**
   * Generates a unique, standardized Building Passport ID in the civil registry format:
   * BP-YYYY-XXXXX (e.g., BP-2026-48201)
   */
  public static async generateUniquePassportId(): Promise<string> {
    const year = new Date().getFullYear();
    let isUnique = false;
    let candidate = "";
    let attempts = 0;

    while (!isUnique && attempts < 20) {
      attempts++;
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      candidate = `BP-${year}-${randomNum}`;

      // Check DB
      let existsInDb = false;
      try {
        if (isDbConnected() || (await connectDb().catch(() => null))) {
          const found = await BuildingModel.findOne({ passportId: candidate });
          if (found) existsInDb = true;
        }
      } catch {
        // Ignore
      }

      const existsInMem = memoryBuildings.some((b) => b.passportId === candidate);
      if (!existsInDb && !existsInMem) {
        isUnique = true;
      }
    }

    return candidate;
  }

  /**
   * Maps a Mongoose document or plain object to a clean BuildingRecord
   */
  private static mapToRecord(doc: Record<string, unknown>): BuildingRecord {
    const docAny = doc as unknown as BuildingRecord & { _id?: { toString(): string } };
    return {
      id: docAny._id ? docAny._id.toString() : docAny.id,
      passportId: docAny.passportId,
      name: docAny.name,
      type: docAny.type,
      constructionDate: docAny.constructionDate,
      location: docAny.location || { address: "", city: "" },
      totalArea: docAny.totalArea,
      floors: docAny.floors,
      units: docAny.units,
      usage: docAny.usage,
      description: docAny.description || "",
      structuralInfo: docAny.structuralInfo || {
        frameType: "RCC",
        foundation: "Piles",
        fireRating: "2-Hour",
        exteriorCladding: "Standard",
      },
      builder: docAny.builder || {
        companyName: "Unspecified",
        builderName: "Unspecified",
        contact: "",
        details: "",
      },
      owner: docAny.owner,
      qrCodeDataUrl: docAny.qrCodeDataUrl || "",
      photographs: docAny.photographs || [],
      condition: docAny.condition || "Good",
      maintenanceStatus: docAny.maintenanceStatus || "Up to Date",
      createdBy: docAny.createdBy?.toString(),
      createdAt: docAny.createdAt ? new Date(String(docAny.createdAt)).toISOString() : new Date().toISOString(),
      updatedAt: docAny.updatedAt ? new Date(String(docAny.updatedAt)).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Creates a new Building Passport record
   */
  public static async createBuilding(
    data: Partial<BuildingRecord>,
    userId?: string
  ): Promise<BuildingRecord> {
    const passportId = data.passportId?.trim().toUpperCase() || (await this.generateUniquePassportId());
    const qrCodeDataUrl = await QrService.generatePassportQr(passportId);

    const newBuildingData: Partial<BuildingRecord> = {
      ...data,
      passportId,
      qrCodeDataUrl,
      condition: data.condition || "Good",
      maintenanceStatus: data.maintenanceStatus || "Up to Date",
      photographs: data.photographs || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Try MongoDB
    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        const created = await BuildingModel.create({
          ...newBuildingData,
          createdBy: userId,
        });
        const record = this.mapToRecord(created.toObject ? created.toObject() : created);
        // Also keep memory sync
        memoryBuildings.unshift(record);
        return record;
      }
    } catch (err) {
      console.warn("[BuildingService] MongoDB create failed, storing in memory:", (err as Error).message);
    }

    // In-memory fallback
    const memRecord: BuildingRecord = {
      id: `bld_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      passportId,
      name: data.name || "Untitled Civil Structure",
      type: data.type || "Commercial",
      constructionDate: data.constructionDate || new Date().toISOString().split("T")[0],
      location: data.location || { address: "Registry Location", city: "Capital" },
      totalArea: data.totalArea || "50,000 sq.ft",
      floors: data.floors || 1,
      units: data.units || 1,
      usage: data.usage || "General",
      description: data.description || "",
      structuralInfo: data.structuralInfo || {
        frameType: "RCC",
        foundation: "Standard",
        fireRating: "2-Hour",
        exteriorCladding: "Plastered",
      },
      builder: data.builder || {
        companyName: "Civil Contractor",
        builderName: "Engineer in Charge",
        contact: "",
        details: "",
      },
      owner: data.owner || {
        name: "Property Holder",
        contact: "",
      },
      qrCodeDataUrl,
      photographs: data.photographs || [],
      condition: data.condition || "Good",
      maintenanceStatus: data.maintenanceStatus || "Up to Date",
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryBuildings.unshift(memRecord);
    return memRecord;
  }

  /**
   * Retrieves buildings with search, category filtering, and condition filtering
   */
  public static async getBuildings(filters?: {
    search?: string;
    type?: string;
    condition?: string;
    maintenanceStatus?: string;
  }): Promise<BuildingRecord[]> {
    let results: BuildingRecord[] = [];

    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        const query: Record<string, unknown> = {};
        if (filters?.type && filters.type !== "all") {
          query.type = new RegExp(filters.type, "i");
        }
        if (filters?.condition && filters.condition !== "all") {
          query.condition = filters.condition;
        }
        if (filters?.maintenanceStatus && filters.maintenanceStatus !== "all") {
          query.maintenanceStatus = filters.maintenanceStatus;
        }
        if (filters?.search) {
          const s = filters.search.trim();
          query.$or = [
            { name: new RegExp(s, "i") },
            { passportId: new RegExp(s, "i") },
            { "location.address": new RegExp(s, "i") },
            { "location.city": new RegExp(s, "i") },
          ];
        }

        const docs = await BuildingModel.find(query).sort({ createdAt: -1 });
        if (docs.length > 0) {
          results = docs.map((d) => this.mapToRecord(d.toObject ? d.toObject() : d));
        }
      }
    } catch {
      // Memory fallback
    }

    if (results.length === 0) {
      results = [...memoryBuildings];
      if (filters?.type && filters.type !== "all") {
        results = results.filter((b) => b.type.toLowerCase().includes(filters.type!.toLowerCase()));
      }
      if (filters?.condition && filters.condition !== "all") {
        results = results.filter((b) => b.condition.toLowerCase() === filters.condition!.toLowerCase());
      }
      if (filters?.maintenanceStatus && filters.maintenanceStatus !== "all") {
        results = results.filter(
          (b) => b.maintenanceStatus.toLowerCase() === filters.maintenanceStatus!.toLowerCase()
        );
      }
      if (filters?.search) {
        const s = filters.search.toLowerCase().trim();
        results = results.filter(
          (b) =>
            b.name.toLowerCase().includes(s) ||
            b.passportId.toLowerCase().includes(s) ||
            b.location.address.toLowerCase().includes(s) ||
            b.location.city.toLowerCase().includes(s)
        );
      }
    }

    // Ensure all results have QR code
    for (const b of results) {
      if (!b.qrCodeDataUrl) {
        try {
          b.qrCodeDataUrl = await QrService.generatePassportQr(b.passportId);
        } catch {
          // Ignore
        }
      }
    }

    return results;
  }

  /**
   * Retrieves single building by Mongo ID or Passport ID
   */
  public static async getBuildingById(idOrPassportId: string): Promise<BuildingRecord | null> {
    const term = idOrPassportId.trim();

    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        let doc: Record<string, unknown> | null = null;
        if (term.startsWith("BP-")) {
          const found = await BuildingModel.findOne({ passportId: term.toUpperCase() });
          if (found) doc = found.toObject ? found.toObject() : found;
        } else {
          const foundById = await BuildingModel.findById(term).catch(() => null);
          if (foundById) {
            doc = foundById.toObject ? foundById.toObject() : foundById;
          } else {
            const foundByPassport = await BuildingModel.findOne({ passportId: term.toUpperCase() });
            if (foundByPassport) doc = foundByPassport.toObject ? foundByPassport.toObject() : foundByPassport;
          }
        }
        if (doc) {
          const rec = this.mapToRecord(doc);
          if (!rec.qrCodeDataUrl) {
            rec.qrCodeDataUrl = await QrService.generatePassportQr(rec.passportId);
          }
          return rec;
        }
      }
    } catch {
      // Memory fallback
    }

    const mem = memoryBuildings.find(
      (b) => b.id === term || b.passportId.toUpperCase() === term.toUpperCase()
    );
    if (mem) {
      if (!mem.qrCodeDataUrl) {
        mem.qrCodeDataUrl = await QrService.generatePassportQr(mem.passportId);
      }
      return mem;
    }

    return null;
  }

  /**
   * Updates an existing building record
   */
  public static async updateBuilding(
    idOrPassportId: string,
    updates: Partial<BuildingRecord>
  ): Promise<BuildingRecord | null> {
    const term = idOrPassportId.trim();

    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        const query = term.startsWith("BP-") ? { passportId: term.toUpperCase() } : { _id: term };
        const updated = await BuildingModel.findOneAndUpdate(query, updates, { new: true });
        if (updated) {
          const rec = this.mapToRecord(updated.toObject ? updated.toObject() : updated);
          // Update memory
          const idx = memoryBuildings.findIndex((b) => b.id === rec.id || b.passportId === rec.passportId);
          if (idx !== -1) memoryBuildings[idx] = rec;
          return rec;
        }
      }
    } catch {
      // Memory fallback
    }

    const idx = memoryBuildings.findIndex(
      (b) => b.id === term || b.passportId.toUpperCase() === term.toUpperCase()
    );
    if (idx !== -1) {
      memoryBuildings[idx] = {
        ...memoryBuildings[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return memoryBuildings[idx];
    }

    return null;
  }

  /**
   * Retrieves public sanitized record for QR code scans.
   * STRICT SECURITY: Omits owner contact, private email, internal documents, and private photos.
   */
  public static async getPublicPassport(passportId: string): Promise<Partial<BuildingRecord> | null> {
    const building = await this.getBuildingById(passportId);
    if (!building) return null;

    // Sanitize: strip private details
    return {
      id: building.id,
      passportId: building.passportId,
      name: building.name,
      type: building.type,
      constructionDate: building.constructionDate,
      location: {
        address: building.location.address,
        city: building.location.city,
        state: building.location.state,
        postalCode: building.location.postalCode,
      },
      totalArea: building.totalArea,
      floors: building.floors,
      units: building.units,
      usage: building.usage,
      description: building.description,
      structuralInfo: building.structuralInfo,
      builder: {
        companyName: building.builder.companyName,
        builderName: building.builder.builderName,
        contact: "[Civil Verification Office Registered]",
        details: building.builder.details,
      },
      // Owner is masked for public privacy
      owner: {
        name: building.owner?.name || "Registered Title Holder",
        contact: "[Confidential Civil Record - Authorized Access Only]",
        email: "[Protected]",
      },
      qrCodeDataUrl: building.qrCodeDataUrl,
      photographs: building.photographs.filter((p) => !p.isPrivate),
      condition: building.condition,
      maintenanceStatus: building.maintenanceStatus,
      createdAt: building.createdAt,
      updatedAt: building.updatedAt,
    };
  }

  /**
   * Assembles a consolidated Building Passport Engineering Dossier/Report
   */
  public static async generateReport(
    idOrPassportId: string,
    currentUser: UserSession
  ): Promise<BuildingReport | null> {
    const building = await this.getBuildingById(idOrPassportId);
    if (!building) return null;

    // Fetch inspections
    const inspections = memoryInspections.filter(
      (i) => i.buildingId === building.id || i.buildingId === building.passportId
    );

    // Fetch defects
    const defects = memoryDefects.filter(
      (d) => d.buildingId === building.id || d.buildingId === building.passportId
    );

    // Fetch maintenance
    const maintenance = memoryMaintenance.filter(
      (m) => m.buildingId === building.id || m.buildingId === building.passportId
    );

    // Fetch documents accessible to this role
    const docs = memoryDocuments
      .filter((d) => d.buildingId === building.id || d.buildingId === building.passportId)
      .filter((d) => !d.isPrivate || currentUser.role === "admin" || currentUser.role === "engineer")
      .map((doc) => {
        const copy = { ...doc };
        delete (copy as { storageReference?: string }).storageReference;
        return copy;
      });

    const totalMaintenanceCost = maintenance.reduce((sum, item) => sum + (item.cost || 0), 0);
    const openDefects = defects.filter((d) => d.status === "Open" || d.status === "In Review").length;
    const criticalDefects = defects.filter((d) => d.severity === "Critical").length;

    return {
      generatedAt: new Date().toISOString(),
      generatedBy: {
        userId: currentUser.userId,
        name: currentUser.name,
        role: currentUser.role,
      },
      building,
      inspections,
      defects,
      maintenance,
      documents: docs,
      summary: {
        totalInspections: inspections.length,
        openDefects,
        criticalDefects,
        totalMaintenanceCost,
        documentsCount: docs.length,
      },
    };
  }
}

// Export memory store accessors for sibling services
export {
  memoryBuildings,
  memoryInspections,
  memoryDefects,
  memoryMaintenance,
  memoryDocuments,
};
