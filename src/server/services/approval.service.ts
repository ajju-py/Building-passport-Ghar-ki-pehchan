import crypto from "node:crypto";
import { query } from "../db/postgres";
import { RegulatoryApprovalRecord, ApprovalType, ApprovalStatus } from "@/lib/types";
import { RegulatoryApprovalDbRow, mapRegulatoryApprovalRow } from "../db/mappers";
import { AuditService } from "./audit.service";

export interface CreateApprovalInput {
  approvalType: ApprovalType;
  issuingAuthority: string;
  approvalNumber: string;
  issueDate: string;
  validUntil?: string;
  status?: ApprovalStatus;
  documentStorageRef?: string;
  documentFilename?: string;
  remarks?: string;
}

export class ApprovalService {
  /**
   * Retrieves all regulatory approvals/permissions/NOCs for a building.
   */
  public static async getApprovals(
    buildingId: string,
    approvalType?: ApprovalType
  ): Promise<RegulatoryApprovalRecord[]> {
    let sql = `SELECT * FROM regulatory_approvals WHERE building_id = $1`;
    const params: unknown[] = [buildingId];

    if (approvalType) {
      sql += ` AND approval_type = $2`;
      params.push(approvalType);
    }

    sql += ` ORDER BY issue_date DESC, created_at DESC;`;

    const res = await query<RegulatoryApprovalDbRow>(sql, params);
    return res.rows.map(mapRegulatoryApprovalRow);
  }

  /**
   * Retrieves a single regulatory approval by ID.
   */
  public static async getApprovalById(id: string): Promise<RegulatoryApprovalRecord | null> {
    const res = await query<RegulatoryApprovalDbRow>(
      `SELECT * FROM regulatory_approvals WHERE id = $1 LIMIT 1;`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return mapRegulatoryApprovalRow(res.rows[0]);
  }

  /**
   * Records a new regulatory approval (e.g. Fire NOC, Building Permission, Occupancy Certificate).
   */
  public static async createApproval(
    buildingId: string,
    input: CreateApprovalInput,
    actorId?: string,
    actorName?: string
  ): Promise<RegulatoryApprovalRecord> {
    const id = `appr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const status = input.status || "ACTIVE";

    const res = await query<RegulatoryApprovalDbRow>(
      `INSERT INTO regulatory_approvals (
        id, building_id, approval_type, issuing_authority, approval_number,
        issue_date, valid_until, status, document_storage_ref,
        document_filename, remarks, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *;`,
      [
        id,
        buildingId,
        input.approvalType,
        input.issuingAuthority.trim(),
        input.approvalNumber.trim(),
        input.issueDate,
        input.validUntil || null,
        status,
        input.documentStorageRef || null,
        input.documentFilename || null,
        input.remarks?.trim() || null,
      ]
    );

    const record = mapRegulatoryApprovalRow(res.rows[0]);

    // Audit log
    await AuditService.logAction({
      actorId,
      actorName,
      action: "REGULATORY_APPROVAL_RECORDED",
      entity: "building",
      entityId: buildingId,
      metadata: {
        approvalId: record.id,
        approvalType: record.approvalType,
        approvalNumber: record.approvalNumber,
        issuingAuthority: record.issuingAuthority,
      },
    });

    return record;
  }

  /**
   * Updates an existing approval status or details.
   */
  public static async updateApproval(
    id: string,
    updates: Partial<CreateApprovalInput>,
    actorId?: string,
    actorName?: string
  ): Promise<RegulatoryApprovalRecord> {
    const existing = await this.getApprovalById(id);
    if (!existing) {
      throw new Error(`Regulatory approval ${id} not found.`);
    }

    const res = await query<RegulatoryApprovalDbRow>(
      `UPDATE regulatory_approvals
       SET status = COALESCE($1, status),
           valid_until = COALESCE($2, valid_until),
           remarks = COALESCE($3, remarks),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *;`,
      [
        updates.status || null,
        updates.validUntil || null,
        updates.remarks !== undefined ? updates.remarks : null,
        id,
      ]
    );

    const updated = mapRegulatoryApprovalRow(res.rows[0]);

    await AuditService.logAction({
      actorId,
      actorName,
      action: "REGULATORY_APPROVAL_UPDATED",
      entity: "building",
      entityId: existing.buildingId,
      metadata: {
        approvalId: id,
        oldStatus: existing.status,
        newStatus: updated.status,
      },
    });

    return updated;
  }

  /**
   * Deletes a regulatory approval record.
   */
  public static async deleteApproval(
    id: string,
    actorId?: string,
    actorName?: string
  ): Promise<boolean> {
    const existing = await this.getApprovalById(id);
    if (!existing) {
      throw new Error(`Regulatory approval ${id} not found.`);
    }

    await query(`DELETE FROM regulatory_approvals WHERE id = $1;`, [id]);

    await AuditService.logAction({
      actorId,
      actorName,
      action: "REGULATORY_APPROVAL_DELETED",
      entity: "building",
      entityId: existing.buildingId,
      metadata: {
        approvalId: id,
        approvalType: existing.approvalType,
        approvalNumber: existing.approvalNumber,
      },
    });

    return true;
  }
}
