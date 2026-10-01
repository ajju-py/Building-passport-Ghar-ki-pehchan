import { MaintenanceRecord, MaintenanceStatus } from "@/lib/types";
import { query } from "../db/postgres";
import { MaintenanceDbRow, mapMaintenanceRow } from "../db/mappers";

export class MaintenanceService {
  /**
   * Generates a unique, standardized Maintenance ID:
   * MNT-YYYY-### (e.g. MNT-2026-550)
   */
  public static async generateUniqueMaintenanceId(): Promise<string> {
    const year = new Date().getFullYear();
    let isUnique = false;
    let candidate = "";
    let attempts = 0;

    while (!isUnique && attempts < 20) {
      attempts++;
      const randomNum = Math.floor(100 + Math.random() * 900);
      candidate = `MNT-${year}-${randomNum}`;

      const res = await query<{ count: number }>(
        "SELECT count(*)::int as count FROM maintenance WHERE maintenance_id = $1;",
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
   * Creates a new maintenance record in PostgreSQL
   */
  public static async createMaintenance(
    buildingIdOrPassport: string,
    data: {
      repairType: string;
      repairDate: string;
      description: string;
      cost: number;
      status?: MaintenanceStatus;
      contractor: string;
      warrantyDetails?: string | null;
      expectedRepairs?: string | null;
      futureRequirements?: string | null;
    }
  ): Promise<MaintenanceRecord> {
    const buildingId = await this.resolveBuildingId(buildingIdOrPassport);
    const maintenanceId = await this.generateUniqueMaintenanceId();
    const id = `maint_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const res = await query<MaintenanceDbRow>(
      `INSERT INTO maintenance (
         id, maintenance_id, building_id, repair_type, repair_date,
         description, cost, status, contractor, warranty_details,
         expected_repairs, future_requirements, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING *;`,
      [
        id,
        maintenanceId,
        buildingId,
        data.repairType,
        data.repairDate,
        data.description,
        data.cost,
        data.status || "Completed",
        data.contractor,
        data.warrantyDetails || null,
        data.expectedRepairs || null,
        data.futureRequirements || null,
      ]
    );

    return mapMaintenanceRow(res.rows[0]);
  }

  /**
   * Retrieves all maintenance records for a building from PostgreSQL, ordered by repair_date descending
   */
  public static async getMaintenance(buildingIdOrPassport: string): Promise<MaintenanceRecord[]> {
    const res = await query<MaintenanceDbRow>(
      `SELECT m.* FROM maintenance m
       JOIN buildings b ON m.building_id = b.id
       WHERE b.id = $1 OR b.passport_id = $2
       ORDER BY m.repair_date DESC, m.created_at DESC;`,
      [buildingIdOrPassport, buildingIdOrPassport.toUpperCase()]
    );

    return res.rows.map(mapMaintenanceRow);
  }

  /**
   * Retrieves single maintenance record by ID or maintenanceId
   */
  public static async getMaintenanceById(
    idOrMaintenanceId: string
  ): Promise<MaintenanceRecord | null> {
    const res = await query<MaintenanceDbRow>(
      "SELECT * FROM maintenance WHERE id = $1 OR maintenance_id = $2 LIMIT 1;",
      [idOrMaintenanceId, idOrMaintenanceId.toUpperCase()]
    );

    if (res.rows.length === 0) {
      return null;
    }

    return mapMaintenanceRow(res.rows[0]);
  }
}
