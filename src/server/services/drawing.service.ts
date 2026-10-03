import crypto from "node:crypto";
import { query } from "../db/postgres";
import { DrawingRecord, DrawingType, DrawingApprovalStatus } from "@/lib/types";
import { DrawingDbRow, mapDrawingRow } from "../db/mappers";
import { AuditService } from "./audit.service";

export interface CreateDrawingInput {
  drawingType: DrawingType;
  title: string;
  storageReference: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  scale?: string;
  sheetNumber?: string;
  notes?: string;
}

export class DrawingService {
  /**
   * Retrieves all drawings for a building, optionally filtered by drawing type.
   */
  public static async getDrawings(
    buildingId: string,
    drawingType?: DrawingType
  ): Promise<DrawingRecord[]> {
    let sql = `SELECT * FROM drawings WHERE building_id = $1`;
    const params: unknown[] = [buildingId];

    if (drawingType) {
      sql += ` AND drawing_type = $2`;
      params.push(drawingType);
    }

    sql += ` ORDER BY drawing_type ASC, version DESC, uploaded_at DESC;`;

    const res = await query<DrawingDbRow>(sql, params);
    return res.rows.map(mapDrawingRow);
  }

  /**
   * Retrieves a single drawing by ID.
   */
  public static async getDrawingById(id: string): Promise<DrawingRecord | null> {
    const res = await query<DrawingDbRow>(
      `SELECT * FROM drawings WHERE id = $1 LIMIT 1;`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return mapDrawingRow(res.rows[0]);
  }

  /**
   * Creates a new drawing revision for a building.
   * Automatically calculates the next version and revision code (e.g. V1 -> R0, V2 -> R1).
   */
  public static async createDrawing(
    buildingId: string,
    input: CreateDrawingInput,
    uploadedBy?: string
  ): Promise<DrawingRecord> {
    // 1. Calculate next version for this drawing type in the building
    const verRes = await query<{ max_ver: number | null }>(
      `SELECT MAX(version) AS max_ver FROM drawings 
       WHERE building_id = $1 AND drawing_type = $2;`,
      [buildingId, input.drawingType]
    );

    const currentMax = verRes.rows[0]?.max_ver ? Number(verRes.rows[0].max_ver) : 0;
    const nextVersion = currentMax + 1;
    const revisionCode = `R${nextVersion - 1}`;
    const id = `drw_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const res = await query<DrawingDbRow>(
      `INSERT INTO drawings (
        id, building_id, drawing_type, title, version, revision_code,
        is_latest_approved, approval_status, storage_reference,
        original_filename, file_size, mime_type, scale, sheet_number,
        uploaded_by, uploaded_at, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), $16)
      RETURNING *;`,
      [
        id,
        buildingId,
        input.drawingType,
        input.title.trim(),
        nextVersion,
        revisionCode,
        false, // not approved yet
        "SUBMITTED",
        input.storageReference,
        input.originalFilename,
        input.fileSize,
        input.mimeType,
        input.scale?.trim() || null,
        input.sheetNumber?.trim() || null,
        uploadedBy || null,
        input.notes?.trim() || null,
      ]
    );

    const record = mapDrawingRow(res.rows[0]);

    // Audit log
    await AuditService.logAction({
      actorId: uploadedBy,
      action: "DRAWING_UPLOADED",
      entity: "building",
      entityId: buildingId,
      metadata: {
        drawingId: record.id,
        drawingType: record.drawingType,
        version: record.version,
        revisionCode: record.revisionCode,
        title: record.title,
      },
    });

    return record;
  }

  /**
   * Updates approval status of a drawing.
   * If APPROVED, sets is_latest_approved = true and clears is_latest_approved on older drawings of this type.
   */
  public static async setApprovalStatus(
    drawingId: string,
    status: DrawingApprovalStatus,
    approvedBy: string,
    approverName?: string
  ): Promise<DrawingRecord> {
    const drawing = await this.getDrawingById(drawingId);
    if (!drawing) {
      throw new Error(`Drawing ${drawingId} not found.`);
    }

    if (status === "APPROVED") {
      // Clear previous approved flag
      await query(
        `UPDATE drawings 
         SET is_latest_approved = FALSE 
         WHERE building_id = $1 AND drawing_type = $2;`,
        [drawing.buildingId, drawing.drawingType]
      );
    }

    const isLatest = status === "APPROVED";
    const res = await query<DrawingDbRow>(
      `UPDATE drawings 
       SET approval_status = $1, 
           is_latest_approved = $2, 
           approved_by = $3, 
           approved_at = CASE WHEN $1 = 'APPROVED' THEN NOW() ELSE approved_at END
       WHERE id = $4
       RETURNING *;`,
      [status, isLatest, approvedBy, drawingId]
    );

    const updated = mapDrawingRow(res.rows[0]);

    // Audit log
    await AuditService.logAction({
      actorId: approvedBy,
      actorName: approverName,
      action: `DRAWING_${status}`,
      entity: "building",
      entityId: drawing.buildingId,
      metadata: {
        drawingId: updated.id,
        status,
        version: updated.version,
        revisionCode: updated.revisionCode,
      },
    });

    return updated;
  }
}
