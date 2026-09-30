import { InspectionRecord } from "@/lib/types";
import { query } from "../db/postgres";
import { InspectionDbRow, mapInspectionRow } from "../db/mappers";

export class InspectionService {
  /**
   * Generates a unique, standardized Inspection ID:
   * INS-YYYY-### (e.g. INS-2026-401)
   */
  public static async generateUniqueInspectionId(): Promise<string> {
    const year = new Date().getFullYear();
    let isUnique = false;
    let candidate = "";
    let attempts = 0;

    while (!isUnique && attempts < 20) {
      attempts++;
      const randomNum = Math.floor(100 + Math.random() * 900);
      candidate = `INS-${year}-${randomNum}`;

      const res = await query<{ count: number }>(
        "SELECT count(*)::int as count FROM inspections WHERE inspection_id = $1;",
        [candidate]
      );
      if (res.rows[0].count === 0) {
        isUnique = true;
      }
    }

    return candidate;
  }

  /**
   * Resolves a building ID or passport ID to the database primary key ID.
   */
  private static async resolveBuildingId(idOrPassport: string): Promise<string> {
    const res = await query<{ id: string }>(
      "SELECT id FROM buildings WHERE id = $1 OR passport_id = $2 LIMIT 1;",
      [idOrPassport, idOrPassport.toUpperCase()]
    );
    if (res.rows.length === 0) {
      throw new Error(`Referenced building '${idOrPassport}' does not exist.`);
    }
    return res.rows[0].id;
  }

  /**
   * Records a new inspection for a building in PostgreSQL
   */
  public static async createInspection(
    buildingIdOrPassport: string,
    data: {
      inspectorId: string;
      inspectorName: string;
      date: string;
      observations: string;
      remarks: string;
      defectsCount?: number;
    }
  ): Promise<InspectionRecord> {
    const buildingId = await this.resolveBuildingId(buildingIdOrPassport);
    const inspectionId = await this.generateUniqueInspectionId();
    const id = `insp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const res = await query<InspectionDbRow>(
      `INSERT INTO inspections (
         id, inspection_id, building_id, inspector_id, inspector_name,
         date, observations, remarks, defects_count, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *;`,
      [
        id,
        inspectionId,
        buildingId,
        data.inspectorId || null,
        data.inspectorName,
        data.date,
        data.observations,
        data.remarks || null,
        data.defectsCount || 0,
      ]
    );

    return mapInspectionRow(res.rows[0]);
  }

  /**
   * Retrieves all inspections for a building from PostgreSQL, ordered by date descending
   */
  public static async getInspections(buildingIdOrPassport: string): Promise<InspectionRecord[]> {
    const res = await query<InspectionDbRow>(
      `SELECT i.* FROM inspections i
       JOIN buildings b ON i.building_id = b.id
       WHERE b.id = $1 OR b.passport_id = $2
       ORDER BY i.date DESC, i.created_at DESC;`,
      [buildingIdOrPassport, buildingIdOrPassport.toUpperCase()]
    );

    return res.rows.map(mapInspectionRow);
  }

  /**
   * Retrieves single inspection by ID or inspectionId
   */
  public static async getInspectionById(idOrInspectionId: string): Promise<InspectionRecord | null> {
    const res = await query<InspectionDbRow>(
      "SELECT * FROM inspections WHERE id = $1 OR inspection_id = $2 LIMIT 1;",
      [idOrInspectionId, idOrInspectionId.toUpperCase()]
    );

    if (res.rows.length === 0) {
      return null;
    }

    return mapInspectionRow(res.rows[0]);
  }
}
