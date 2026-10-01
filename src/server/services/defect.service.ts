import { DefectRecord, DefectSeverity, DefectStatus } from "@/lib/types";
import { query, getPostgresClient } from "../db/postgres";
import { DefectDbRow, mapDefectRow } from "../db/mappers";

export class DefectService {
  /**
   * Generates a unique, standardized Defect ID:
   * DEF-YYYY-### (e.g. DEF-2026-104)
   */
  public static async generateUniqueDefectId(): Promise<string> {
    const year = new Date().getFullYear();
    let isUnique = false;
    let candidate = "";
    let attempts = 0;

    while (!isUnique && attempts < 20) {
      attempts++;
      const randomNum = Math.floor(100 + Math.random() * 900);
      candidate = `DEF-${year}-${randomNum}`;

      const res = await query<{ count: number }>(
        "SELECT count(*)::int as count FROM defects WHERE defect_id = $1;",
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
   * Resolves an inspection ID or inspection_id string to primary key ID.
   * Validates that the referenced inspection exists and belongs to the given building.
   */
  private static async resolveInspectionId(
    idOrInspectionId?: string | null,
    buildingId?: string
  ): Promise<string | null> {
    if (!idOrInspectionId) return null;
    const res = await query<{ id: string; building_id: string }>(
      "SELECT id, building_id FROM inspections WHERE id = $1 OR inspection_id = $2 LIMIT 1;",
      [idOrInspectionId, idOrInspectionId.toUpperCase()]
    );
    if (res.rows.length === 0) {
      throw new Error(`Referenced inspection '${idOrInspectionId}' does not exist.`);
    }
    if (buildingId && res.rows[0].building_id !== buildingId) {
      throw new Error(`Referenced inspection does not belong to building '${buildingId}'.`);
    }
    return res.rows[0].id;
  }

  /**
   * Synchronizes defects_count in the inspections table for a given inspection ID.
   */
  private static async syncInspectionDefectCount(
    client: { query: (sql: string, params?: unknown[]) => Promise<unknown> },
    inspectionId: string | null
  ): Promise<void> {
    if (!inspectionId) return;
    await client.query(
      `UPDATE inspections
       SET defects_count = (SELECT count(*)::int FROM defects WHERE inspection_id = $1),
           updated_at = NOW()
       WHERE id = $1;`,
      [inspectionId]
    );
  }

  /**
   * Creates a new defect record in PostgreSQL and updates inspection defects_count
   */
  public static async createDefect(
    buildingIdOrPassport: string,
    data: {
      inspectionId?: string | null;
      category: string;
      location: string;
      severity: DefectSeverity;
      status?: DefectStatus;
      details: string;
      imageRef?: string | null;
    }
  ): Promise<DefectRecord> {
    const buildingId = await this.resolveBuildingId(buildingIdOrPassport);
    const inspectionId = await this.resolveInspectionId(data.inspectionId, buildingId);
    const defectId = await this.generateUniqueDefectId();
    const id = `def_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const client = await getPostgresClient();

    try {
      await client.query("BEGIN;");

      const insertSql = `
        INSERT INTO defects (
          id, defect_id, building_id, inspection_id, category,
          location, severity, status, details, image_ref, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *;
      `;

      const res = await client.query<DefectDbRow>(insertSql, [
        id,
        defectId,
        buildingId,
        inspectionId,
        data.category,
        data.location,
        data.severity,
        data.status || "Open",
        data.details,
        data.imageRef || null,
      ]);

      if (inspectionId) {
        await this.syncInspectionDefectCount(client, inspectionId);
      }

      await client.query("COMMIT;");
      return mapDefectRow(res.rows[0]);
    } catch (err: unknown) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves all defects for a building from PostgreSQL, ordered by created_at descending
   */
  public static async getDefects(buildingIdOrPassport: string): Promise<DefectRecord[]> {
    const res = await query<DefectDbRow>(
      `SELECT d.* FROM defects d
       JOIN buildings b ON d.building_id = b.id
       WHERE b.id = $1 OR b.passport_id = $2
       ORDER BY d.created_at DESC;`,
      [buildingIdOrPassport, buildingIdOrPassport.toUpperCase()]
    );

    return res.rows.map(mapDefectRow);
  }

  /**
   * Retrieves single defect by ID or defectId
   */
  public static async getDefectById(idOrDefectId: string): Promise<DefectRecord | null> {
    const res = await query<DefectDbRow>(
      "SELECT * FROM defects WHERE id = $1 OR defect_id = $2 LIMIT 1;",
      [idOrDefectId, idOrDefectId.toUpperCase()]
    );

    if (res.rows.length === 0) {
      return null;
    }

    return mapDefectRow(res.rows[0]);
  }

  /**
   * Updates an existing defect and synchronizes inspection defects_count
   */
  public static async updateDefect(
    idOrDefectId: string,
    updates: Partial<DefectRecord>
  ): Promise<DefectRecord | null> {
    const existing = await this.getDefectById(idOrDefectId);
    if (!existing) {
      return null;
    }

    const client = await getPostgresClient();

    try {
      await client.query("BEGIN;");

      const setClauses: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (updates.category !== undefined) {
        setClauses.push(`category = $${idx++}`);
        values.push(updates.category);
      }
      if (updates.location !== undefined) {
        setClauses.push(`location = $${idx++}`);
        values.push(updates.location);
      }
      if (updates.severity !== undefined) {
        setClauses.push(`severity = $${idx++}`);
        values.push(updates.severity);
      }
      if (updates.status !== undefined) {
        setClauses.push(`status = $${idx++}`);
        values.push(updates.status);
      }
      if (updates.details !== undefined) {
        setClauses.push(`details = $${idx++}`);
        values.push(updates.details);
      }
      if (updates.imageRef !== undefined) {
        setClauses.push(`image_ref = $${idx++}`);
        values.push(updates.imageRef || null);
      }

      let newInspectionId = existing.inspectionId || null;
      if (updates.inspectionId !== undefined) {
        newInspectionId = await this.resolveInspectionId(updates.inspectionId, existing.buildingId);
        setClauses.push(`inspection_id = $${idx++}`);
        values.push(newInspectionId);
      }

      setClauses.push("updated_at = NOW()");

      values.push(existing.id);
      const updateSql = `
        UPDATE defects
        SET ${setClauses.join(", ")}
        WHERE id = $${idx}
        RETURNING *;
      `;

      const res = await client.query<DefectDbRow>(updateSql, values);

      // Sync old inspection if changed
      if (existing.inspectionId && existing.inspectionId !== newInspectionId) {
        await this.syncInspectionDefectCount(client, existing.inspectionId);
      }
      // Sync new inspection
      if (newInspectionId) {
        await this.syncInspectionDefectCount(client, newInspectionId);
      }

      await client.query("COMMIT;");
      return mapDefectRow(res.rows[0]);
    } catch (err: unknown) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  }
}
