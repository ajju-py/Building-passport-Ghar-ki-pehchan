import { BuildingRecord, BuildingReport, UserSession, BuildingPhotograph, UserRole } from "@/lib/types";
import { query, getPostgresClient } from "../db/postgres";
import { QrService } from "./qr.service";
import {
  BuildingDbRow,
  PhotographDbRow,
  InspectionDbRow,
  DefectDbRow,
  MaintenanceDbRow,
  DocumentDbRow,
  mapBuildingRow,
  mapPhotographRow,
  mapInspectionRow,
  mapDefectRow,
  mapMaintenanceRow,
  mapDocumentRow,
} from "../db/mappers";

// Temporary export stubs to maintain compatibility with sibling services during incremental migration
export const memoryBuildings: BuildingRecord[] = [];
export const memoryInspections: unknown[] = [];
export const memoryDefects: unknown[] = [];
export const memoryMaintenance: unknown[] = [];
export const memoryDocuments: unknown[] = [];

export class BuildingService {
  /**
   * Generates a unique, standardized Building Passport ID in the civil registry format:
   * BP-YYYY-XXXXX (e.g., BP-2026-48201)
   * Guaranteed unique via PostgreSQL verification.
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

      const res = await query<{ count: number }>(
        "SELECT count(*)::int as count FROM buildings WHERE passport_id = $1;",
        [candidate]
      );
      if (res.rows[0].count === 0) {
        isUnique = true;
      }
    }

    return candidate;
  }

  /**
   * Fetches photographs for a set of building IDs.
   */
  private static async getPhotographsForBuildings(
    buildingIds: string[]
  ): Promise<Map<string, BuildingPhotograph[]>> {
    const photoMap = new Map<string, BuildingPhotograph[]>();
    if (buildingIds.length === 0) return photoMap;

    const res = await query<PhotographDbRow>(
      `SELECT id, building_id, url, caption, category, is_private, uploaded_at
       FROM building_photographs
       WHERE building_id = ANY($1::text[])
       ORDER BY uploaded_at ASC;`,
      [buildingIds]
    );

    for (const row of res.rows) {
      const bId = row.building_id;
      if (!photoMap.has(bId)) {
        photoMap.set(bId, []);
      }
      photoMap.get(bId)!.push(mapPhotographRow(row));
    }

    return photoMap;
  }

  /**
   * Retrieves photographs for a building by ID or Passport ID, with role-based privacy filtering.
   * Returns null if building does not exist.
   */
  public static async getPhotographs(
    buildingIdOrPassport: string,
    currentUserOrRole?: { role?: UserRole; userId?: string } | UserRole
  ): Promise<BuildingPhotograph[] | null> {
    const building = await this.getBuildingById(buildingIdOrPassport);
    if (!building) return null;

    const userRole = typeof currentUserOrRole === "string" ? currentUserOrRole : currentUserOrRole?.role;
    const userId = typeof currentUserOrRole === "object" ? currentUserOrRole?.userId : undefined;

    const canSeePrivate =
      userRole === "admin" ||
      userRole === "engineer" ||
      (userRole === "owner" && building.createdBy && building.createdBy === userId);

    if (canSeePrivate) {
      return building.photographs;
    }

    return building.photographs.filter((p) => !p.isPrivate);
  }

  /**
   * Creates a new Building Passport record in PostgreSQL
   */
  public static async createBuilding(
    data: Partial<BuildingRecord>,
    userId?: string
  ): Promise<BuildingRecord> {
    const passportId =
      data.passportId?.trim().toUpperCase() || (await this.generateUniquePassportId());
    const qrCodeDataUrl =
      data.qrCodeDataUrl || (await QrService.generatePassportQr(passportId));
    const buildingId =
      data.id || `bld_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const client = await getPostgresClient();

    try {
      await client.query("BEGIN;");

      const insertBuildingSql = `
        INSERT INTO buildings (
          id, passport_id, name, type, construction_date,
          location_address, location_city, location_state, location_postal_code,
          latitude, longitude, total_area, floors, units, usage, description,
          frame_type, foundation, fire_rating, exterior_cladding, seismic_zone,
          builder_company_name, builder_name, builder_contact, builder_details,
          owner_name, owner_contact, owner_email, owner_additional_info,
          qr_code_data_url, condition, maintenance_status,
          plot_number, survey_number, built_up_area, occupancy_status, construction_status,
          registration_date, structural_engineer_name, structural_engineer_license,
          architect_name, architect_license, gis_polygon,
          created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
          $41, $42, $43, $44, NOW(), NOW()
        )
        RETURNING *;
      `;

      const values = [
        buildingId,
        passportId,
        data.name || "Untitled Civil Structure",
        data.type || "Commercial",
        data.constructionDate || new Date().toISOString().split("T")[0],
        data.location?.address || "Registry Location",
        data.location?.city || "Capital",
        data.location?.state || null,
        data.location?.postalCode || null,
        data.location?.coordinates?.lat ?? null,
        data.location?.coordinates?.lng ?? null,
        data.totalArea || "50,000 sq.ft",
        data.floors || 1,
        data.units || 1,
        data.usage || "General",
        data.description || null,
        data.structuralInfo?.frameType || "RCC",
        data.structuralInfo?.foundation || "Standard",
        data.structuralInfo?.fireRating || "2-Hour",
        data.structuralInfo?.exteriorCladding || "Plastered",
        data.structuralInfo?.seismicZone || null,
        data.builder?.companyName || null,
        data.builder?.builderName || null,
        data.builder?.contact || null,
        data.builder?.details || null,
        data.owner?.name || null,
        data.owner?.contact || null,
        data.owner?.email || null,
        data.owner?.additionalInfo || null,
        qrCodeDataUrl,
        data.condition || "Good",
        data.maintenanceStatus || "Up to Date",
        data.plotNumber || null,
        data.surveyNumber || null,
        data.builtUpArea || null,
        data.occupancyStatus || "Occupied",
        data.constructionStatus || "Completed",
        data.registrationDate || null,
        data.structuralEngineerName || null,
        data.structuralEngineerLicense || null,
        data.architectName || null,
        data.architectLicense || null,
        data.gisPolygon ? JSON.stringify(data.gisPolygon) : null,
        userId || null,
      ];

      const bldRes = await client.query<BuildingDbRow>(insertBuildingSql, values);
      const createdRow = bldRes.rows[0];

      // Insert photographs if present
      const photographs: BuildingPhotograph[] = [];
      if (Array.isArray(data.photographs) && data.photographs.length > 0) {
        for (let idx = 0; idx < data.photographs.length; idx++) {
          const p = data.photographs[idx];
          const photoId = `photo_${buildingId}_${idx + 1}`;
          await client.query(
            `INSERT INTO building_photographs (
               id, building_id, url, caption, category, is_private, uploaded_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
            [
              photoId,
              buildingId,
              p.url,
              p.caption || null,
              p.category || "additional",
              Boolean(p.isPrivate),
              p.uploadedAt ? new Date(p.uploadedAt) : new Date(),
            ]
          );
          photographs.push({
            url: p.url,
            caption: p.caption || "",
            category: p.category || "additional",
            isPrivate: Boolean(p.isPrivate),
            uploadedAt: p.uploadedAt ? new Date(p.uploadedAt).toISOString() : new Date().toISOString(),
          });
        }
      }

      await client.query("COMMIT;");
      return mapBuildingRow(createdRow, photographs);
    } catch (err: unknown) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves buildings from PostgreSQL with search and filtering
   */
  public static async getBuildings(filters?: {
    search?: string;
    type?: string;
    condition?: string;
    maintenanceStatus?: string;
  }): Promise<BuildingRecord[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters?.type && filters.type !== "all") {
      conditions.push(`type ILIKE $${paramIndex++}`);
      params.push(`%${filters.type}%`);
    }

    if (filters?.condition && filters.condition !== "all") {
      conditions.push(`condition = $${paramIndex++}`);
      params.push(filters.condition);
    }

    if (filters?.maintenanceStatus && filters.maintenanceStatus !== "all") {
      conditions.push(`maintenance_status = $${paramIndex++}`);
      params.push(filters.maintenanceStatus);
    }

    if (filters?.search && filters.search.trim()) {
      const s = `%${filters.search.trim()}%`;
      conditions.push(
        `(name ILIKE $${paramIndex} OR passport_id ILIKE $${paramIndex} OR location_address ILIKE $${paramIndex} OR location_city ILIKE $${paramIndex})`
      );
      params.push(s);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `SELECT * FROM buildings ${whereClause} ORDER BY created_at DESC;`;

    const res = await query<BuildingDbRow>(sql, params);
    if (res.rows.length === 0) {
      return [];
    }

    const buildingIds = res.rows.map((r) => r.id);
    const photoMap = await this.getPhotographsForBuildings(buildingIds);

    const records: BuildingRecord[] = [];
    for (const row of res.rows) {
      const photos = photoMap.get(row.id) || [];
      const record = mapBuildingRow(row, photos);

      // Lazily regenerate QR code if missing in DB
      if (!record.qrCodeDataUrl) {
        try {
          record.qrCodeDataUrl = await QrService.generatePassportQr(record.passportId);
        } catch {
          // Non-blocking
        }
      }

      records.push(record);
    }

    return records;
  }

  /**
   * Retrieves single building by ID or Passport ID from PostgreSQL
   */
  public static async getBuildingById(idOrPassportId: string): Promise<BuildingRecord | null> {
    const term = idOrPassportId.trim();

    const res = await query<BuildingDbRow>(
      "SELECT * FROM buildings WHERE id = $1 OR passport_id = $2 LIMIT 1;",
      [term, term.toUpperCase()]
    );

    if (res.rows.length === 0) {
      return null;
    }

    const row = res.rows[0];
    const photoMap = await this.getPhotographsForBuildings([row.id]);
    const photos = photoMap.get(row.id) || [];
    const record = mapBuildingRow(row, photos);

    if (!record.qrCodeDataUrl) {
      try {
        record.qrCodeDataUrl = await QrService.generatePassportQr(record.passportId);
      } catch {
        // Non-blocking
      }
    }

    return record;
  }

  /**
   * Verifies whether an authenticated user has permission to modify a building.
   * - Admin and Engineer: Authorized across all records.
   * - Owner: Authorized ONLY for buildings where building.createdBy === user.userId.
   * - Public: Forbidden.
   */
  public static async checkBuildingModificationAccess(
    idOrPassportId: string,
    user: UserSession
  ): Promise<{
    allowed: boolean;
    status: number;
    message: string;
    building?: BuildingRecord;
  }> {
    const building = await this.getBuildingById(idOrPassportId);
    if (!building) {
      return {
        allowed: false,
        status: 404,
        message: "Building not found.",
      };
    }

    if (user.role === "admin" || user.role === "engineer") {
      return { allowed: true, status: 200, message: "Authorized.", building };
    }

    if (user.role === "owner") {
      if (building.createdBy && building.createdBy === user.userId) {
        return { allowed: true, status: 200, message: "Authorized.", building };
      }
      return {
        allowed: false,
        status: 403,
        message: "Forbidden. You do not have permission to modify this building.",
      };
    }

    return {
      allowed: false,
      status: 403,
      message: "Forbidden. Insufficient permissions.",
    };
  }

  /**
   * Updates an existing building record and optionally updates its photographs
   */
  public static async updateBuilding(
    idOrPassportId: string,
    updates: Partial<BuildingRecord>
  ): Promise<BuildingRecord | null> {
    const existing = await this.getBuildingById(idOrPassportId);
    if (!existing) {
      return null;
    }

    const client = await getPostgresClient();

    try {
      await client.query("BEGIN;");

      const setClauses: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (updates.name !== undefined) {
        setClauses.push(`name = $${idx++}`);
        values.push(updates.name);
      }
      if (updates.type !== undefined) {
        setClauses.push(`type = $${idx++}`);
        values.push(updates.type);
      }
      if (updates.constructionDate !== undefined) {
        setClauses.push(`construction_date = $${idx++}`);
        values.push(updates.constructionDate);
      }
      if (updates.totalArea !== undefined) {
        setClauses.push(`total_area = $${idx++}`);
        values.push(updates.totalArea);
      }
      if (updates.floors !== undefined) {
        setClauses.push(`floors = $${idx++}`);
        values.push(updates.floors);
      }
      if (updates.units !== undefined) {
        setClauses.push(`units = $${idx++}`);
        values.push(updates.units);
      }
      if (updates.usage !== undefined) {
        setClauses.push(`usage = $${idx++}`);
        values.push(updates.usage);
      }
      if (updates.description !== undefined) {
        setClauses.push(`description = $${idx++}`);
        values.push(updates.description || null);
      }
      if (updates.condition !== undefined) {
        setClauses.push(`condition = $${idx++}`);
        values.push(updates.condition);
      }
      if (updates.maintenanceStatus !== undefined) {
        setClauses.push(`maintenance_status = $${idx++}`);
        values.push(updates.maintenanceStatus);
      }
      if (updates.qrCodeDataUrl !== undefined) {
        setClauses.push(`qr_code_data_url = $${idx++}`);
        values.push(updates.qrCodeDataUrl || null);
      }

      // Location fields
      if (updates.location) {
        if (updates.location.address !== undefined) {
          setClauses.push(`location_address = $${idx++}`);
          values.push(updates.location.address);
        }
        if (updates.location.city !== undefined) {
          setClauses.push(`location_city = $${idx++}`);
          values.push(updates.location.city);
        }
        if (updates.location.state !== undefined) {
          setClauses.push(`location_state = $${idx++}`);
          values.push(updates.location.state || null);
        }
        if (updates.location.postalCode !== undefined) {
          setClauses.push(`location_postal_code = $${idx++}`);
          values.push(updates.location.postalCode || null);
        }
        if (updates.location.coordinates !== undefined) {
          setClauses.push(`latitude = $${idx++}`);
          values.push(updates.location.coordinates?.lat ?? null);
          setClauses.push(`longitude = $${idx++}`);
          values.push(updates.location.coordinates?.lng ?? null);
        }
      }

      // Structural info fields
      if (updates.structuralInfo) {
        if (updates.structuralInfo.frameType !== undefined) {
          setClauses.push(`frame_type = $${idx++}`);
          values.push(updates.structuralInfo.frameType);
        }
        if (updates.structuralInfo.foundation !== undefined) {
          setClauses.push(`foundation = $${idx++}`);
          values.push(updates.structuralInfo.foundation);
        }
        if (updates.structuralInfo.fireRating !== undefined) {
          setClauses.push(`fire_rating = $${idx++}`);
          values.push(updates.structuralInfo.fireRating);
        }
        if (updates.structuralInfo.exteriorCladding !== undefined) {
          setClauses.push(`exterior_cladding = $${idx++}`);
          values.push(updates.structuralInfo.exteriorCladding);
        }
        if (updates.structuralInfo.seismicZone !== undefined) {
          setClauses.push(`seismic_zone = $${idx++}`);
          values.push(updates.structuralInfo.seismicZone || null);
        }
      }

      // Builder fields
      if (updates.builder) {
        if (updates.builder.companyName !== undefined) {
          setClauses.push(`builder_company_name = $${idx++}`);
          values.push(updates.builder.companyName || null);
        }
        if (updates.builder.builderName !== undefined) {
          setClauses.push(`builder_name = $${idx++}`);
          values.push(updates.builder.builderName || null);
        }
        if (updates.builder.contact !== undefined) {
          setClauses.push(`builder_contact = $${idx++}`);
          values.push(updates.builder.contact || null);
        }
        if (updates.builder.details !== undefined) {
          setClauses.push(`builder_details = $${idx++}`);
          values.push(updates.builder.details || null);
        }
      }

      // Owner fields
      if (updates.owner) {
        if (updates.owner.name !== undefined) {
          setClauses.push(`owner_name = $${idx++}`);
          values.push(updates.owner.name || null);
        }
        if (updates.owner.contact !== undefined) {
          setClauses.push(`owner_contact = $${idx++}`);
          values.push(updates.owner.contact || null);
        }
        if (updates.owner.email !== undefined) {
          setClauses.push(`owner_email = $${idx++}`);
          values.push(updates.owner.email || null);
        }
        if (updates.owner.additionalInfo !== undefined) {
          setClauses.push(`owner_additional_info = $${idx++}`);
          values.push(updates.owner.additionalInfo || null);
        }
      }

      // Extended central record fields
      if (updates.plotNumber !== undefined) {
        setClauses.push(`plot_number = $${idx++}`);
        values.push(updates.plotNumber || null);
      }
      if (updates.surveyNumber !== undefined) {
        setClauses.push(`survey_number = $${idx++}`);
        values.push(updates.surveyNumber || null);
      }
      if (updates.builtUpArea !== undefined) {
        setClauses.push(`built_up_area = $${idx++}`);
        values.push(updates.builtUpArea || null);
      }
      if (updates.occupancyStatus !== undefined) {
        setClauses.push(`occupancy_status = $${idx++}`);
        values.push(updates.occupancyStatus || "Occupied");
      }
      if (updates.constructionStatus !== undefined) {
        setClauses.push(`construction_status = $${idx++}`);
        values.push(updates.constructionStatus || "Completed");
      }
      if (updates.registrationDate !== undefined) {
        setClauses.push(`registration_date = $${idx++}`);
        values.push(updates.registrationDate || null);
      }
      if (updates.structuralEngineerName !== undefined) {
        setClauses.push(`structural_engineer_name = $${idx++}`);
        values.push(updates.structuralEngineerName || null);
      }
      if (updates.structuralEngineerLicense !== undefined) {
        setClauses.push(`structural_engineer_license = $${idx++}`);
        values.push(updates.structuralEngineerLicense || null);
      }
      if (updates.architectName !== undefined) {
        setClauses.push(`architect_name = $${idx++}`);
        values.push(updates.architectName || null);
      }
      if (updates.architectLicense !== undefined) {
        setClauses.push(`architect_license = $${idx++}`);
        values.push(updates.architectLicense || null);
      }
      if (updates.gisPolygon !== undefined) {
        setClauses.push(`gis_polygon = $${idx++}`);
        values.push(updates.gisPolygon ? JSON.stringify(updates.gisPolygon) : null);
      }

      setClauses.push(`updated_at = NOW()`);

      if (setClauses.length > 1) {
        values.push(existing.id);
        const updateSql = `
          UPDATE buildings
          SET ${setClauses.join(", ")}
          WHERE id = $${idx}
          RETURNING *;
        `;
        await client.query(updateSql, values);
      }

      // Handle photograph persistence if provided
      if (Array.isArray(updates.photographs)) {
        await client.query("DELETE FROM building_photographs WHERE building_id = $1;", [
          existing.id,
        ]);
        for (let photoIdx = 0; photoIdx < updates.photographs.length; photoIdx++) {
          const p = updates.photographs[photoIdx];
          const photoId = `photo_${existing.id}_${photoIdx + 1}`;
          await client.query(
            `INSERT INTO building_photographs (
               id, building_id, url, caption, category, is_private, uploaded_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
            [
              photoId,
              existing.id,
              p.url,
              p.caption || null,
              p.category || "additional",
              Boolean(p.isPrivate),
              p.uploadedAt ? new Date(p.uploadedAt) : new Date(),
            ]
          );
        }
      }

      await client.query("COMMIT;");
    } catch (err: unknown) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }

    return this.getBuildingById(existing.id);
  }

  /**
   * Retrieves public sanitized record for QR code scans.
   * STRICT SECURITY:
   * - Resolves strictly by Passport ID (case-insensitive), NEVER by internal DB ID.
   * - Omits owner contact, private email, internal documents, and private photos.
   */
  public static async getPublicPassport(
    passportId: string
  ): Promise<Partial<BuildingRecord> | null> {
    if (!passportId || !passportId.trim()) return null;

    const term = passportId.trim().toUpperCase();
    const res = await query<BuildingDbRow>(
      "SELECT * FROM buildings WHERE passport_id = $1 LIMIT 1;",
      [term]
    );

    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    const photoMap = await this.getPhotographsForBuildings([row.id]);
    const photos = photoMap.get(row.id) || [];
    const building = mapBuildingRow(row, photos);

    if (!building.qrCodeDataUrl) {
      try {
        building.qrCodeDataUrl = await QrService.generatePassportQr(building.passportId);
      } catch {
        // Non-blocking
      }
    }

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
      owner: {
        name: building.owner?.name || "Registered Title Holder",
        contact: "[Confidential Civil Record - Authorized Access Only]",
        email: "[Protected]",
      },
      qrCodeDataUrl: building.qrCodeDataUrl,
      photographs: building.photographs.filter((p) => !p.isPrivate),
      condition: building.condition,
      maintenanceStatus: building.maintenanceStatus,
      plotNumber: building.plotNumber,
      surveyNumber: building.surveyNumber,
      builtUpArea: building.builtUpArea,
      occupancyStatus: building.occupancyStatus,
      constructionStatus: building.constructionStatus,
      registrationDate: building.registrationDate,
      structuralEngineerName: building.structuralEngineerName,
      structuralEngineerLicense: building.structuralEngineerLicense,
      architectName: building.architectName,
      architectLicense: building.architectLicense,
      gisPolygon: building.gisPolygon,
      createdAt: building.createdAt,
      updatedAt: building.updatedAt,
    };
  }

  /**
   * Assembles a consolidated Building Passport Engineering Dossier/Report directly from PostgreSQL.
   * NEVER uses stale in-memory arrays.
   */
  public static async generateReport(
    idOrPassportId: string,
    currentUser: UserSession
  ): Promise<BuildingReport | null> {
    const building = await this.getBuildingById(idOrPassportId);
    if (!building) return null;

    // Fetch inspections from PostgreSQL
    const inspRes = await query<InspectionDbRow>(
      "SELECT * FROM inspections WHERE building_id = $1 ORDER BY date DESC;",
      [building.id]
    );
    const inspections = inspRes.rows.map(mapInspectionRow);

    // Fetch defects from PostgreSQL
    const defRes = await query<DefectDbRow>(
      "SELECT * FROM defects WHERE building_id = $1 ORDER BY created_at DESC;",
      [building.id]
    );
    const defects = defRes.rows.map(mapDefectRow);

    // Fetch maintenance from PostgreSQL
    const maintRes = await query<MaintenanceDbRow>(
      "SELECT * FROM maintenance WHERE building_id = $1 ORDER BY repair_date DESC;",
      [building.id]
    );
    const maintenance = maintRes.rows.map(mapMaintenanceRow);

    // Fetch documents from PostgreSQL
    const docRes = await query<DocumentDbRow>(
      "SELECT * FROM documents WHERE building_id = $1 ORDER BY upload_date DESC;",
      [building.id]
    );
    const allDocs = docRes.rows.map(mapDocumentRow);

    // Filter documents accessible to current role
    const canSeePrivateDocs =
      currentUser.role === "admin" ||
      currentUser.role === "engineer" ||
      (currentUser.role === "owner" && building.createdBy === currentUser.userId);
    const docs = allDocs
      .filter((d) => !d.isPrivate || canSeePrivateDocs)
      .map((doc) => {
        const copy = { ...doc };
        delete (copy as { storageReference?: string }).storageReference;
        return copy;
      });

    const totalMaintenanceCost = maintenance.reduce((sum, item) => sum + (item.cost || 0), 0);
    const openDefects = defects.filter((d) => d.status === "Open" || d.status === "In Review").length;
    const criticalDefects = defects.filter((d) => d.severity === "Critical").length;

    const safeBuilding = {
      ...building,
      photographs: canSeePrivateDocs
        ? building.photographs
        : building.photographs.filter((p) => !p.isPrivate),
    };

    return {
      generatedAt: new Date().toISOString(),
      generatedBy: {
        userId: currentUser.userId,
        name: currentUser.name,
        role: currentUser.role,
      },
      building: safeBuilding,
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
