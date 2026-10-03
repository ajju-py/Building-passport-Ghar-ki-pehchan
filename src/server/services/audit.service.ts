import crypto from "node:crypto";
import { query } from "../db/postgres";
import { AuditLogRecord } from "@/lib/types";
import { AuditLogDbRow, mapAuditLogRow } from "../db/mappers";

export class AuditService {
  /**
   * Records an audit log event in PostgreSQL.
   */
  public static async logAction(params: {
    actorId?: string;
    actorName?: string;
    actorRole?: string;
    action: string;
    entity: string;
    entityId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<AuditLogRecord> {
    const id = `audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const metadataJson = JSON.stringify(params.metadata || {});

    const res = await query<AuditLogDbRow>(
      `INSERT INTO audit_logs (
        id, actor_id, actor_name, actor_role, action, entity, entity_id, metadata, ip_address, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, NOW())
      RETURNING *;`,
      [
        id,
        params.actorId || null,
        params.actorName || null,
        params.actorRole || null,
        params.action,
        params.entity,
        params.entityId,
        metadataJson,
        params.ipAddress || null,
      ]
    );

    return mapAuditLogRow(res.rows[0]);
  }

  /**
   * Retrieves audit logs for a specific entity (e.g. building, inspection, etc.).
   */
  public static async getLogsForEntity(
    entity: string,
    entityId: string,
    limit: number = 50
  ): Promise<AuditLogRecord[]> {
    const res = await query<AuditLogDbRow>(
      `SELECT * FROM audit_logs 
       WHERE entity = $1 AND entity_id = $2 
       ORDER BY created_at DESC 
       LIMIT $3;`,
      [entity, entityId, limit]
    );
    return res.rows.map(mapAuditLogRow);
  }

  /**
   * Retrieves the most recent system-wide audit logs for admin review.
   */
  public static async getRecentLogs(limit: number = 100): Promise<AuditLogRecord[]> {
    const res = await query<AuditLogDbRow>(
      `SELECT * FROM audit_logs 
       ORDER BY created_at DESC 
       LIMIT $1;`,
      [limit]
    );
    return res.rows.map(mapAuditLogRow);
  }
}
