import { DocumentRecord, DocumentType, UserRole } from "@/lib/types";
import { query } from "../db/postgres";
import { storageService } from "./storage.service";
import { DocumentDbRow, mapDocumentRow } from "../db/mappers";

export class DocumentService {
  /**
   * Generates a unique, standardized Document ID:
   * DOC-YYYY-### (e.g. DOC-2026-801)
   */
  public static async generateUniqueDocumentId(): Promise<string> {
    const year = new Date().getFullYear();
    let isUnique = false;
    let candidate = "";
    let attempts = 0;

    while (!isUnique && attempts < 20) {
      attempts++;
      const randomNum = Math.floor(100 + Math.random() * 900);
      candidate = `DOC-${year}-${randomNum}`;

      const res = await query<{ count: number }>(
        "SELECT count(*)::int as count FROM documents WHERE document_id = $1;",
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
   * Uploads and saves physical file binary to storage and persists document metadata in PostgreSQL.
   */
  public static async uploadDocument(params: {
    buildingId: string;
    fileBuffer: Buffer;
    originalFilename: string;
    mimeType: string;
    title: string;
    documentType: DocumentType;
    isPrivate?: boolean;
    uploadedBy?: string;
  }): Promise<DocumentRecord> {
    const validTypes: DocumentType[] = ["blueprint", "structural", "permit", "report", "other"];
    if (!validTypes.includes(params.documentType)) {
      throw new Error(`Invalid document type '${params.documentType}'. Allowed: ${validTypes.join(", ")}`);
    }

    const buildingId = await this.resolveBuildingId(params.buildingId);
    const documentId = await this.generateUniqueDocumentId();
    const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Store physical file binary onto filesystem (never store binary blob in PostgreSQL)
    const stored = await storageService.save(
      params.fileBuffer,
      params.originalFilename,
      params.mimeType
    );

    try {
      const res = await query<DocumentDbRow>(
        `INSERT INTO documents (
           id, document_id, building_id, document_type, title,
           original_filename, storage_reference, file_size, mime_type,
           upload_date, uploaded_by, is_private, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, NOW(), NOW())
         RETURNING *;`,
        [
          id,
          documentId,
          buildingId,
          params.documentType,
          params.title,
          params.originalFilename,
          stored.storageRef,
          stored.size,
          stored.mimeType,
          params.uploadedBy || null,
          Boolean(params.isPrivate),
        ]
      );

      const docRecord = mapDocumentRow(res.rows[0]);
      docRecord.url = stored.url;
      return docRecord;
    } catch (dbErr) {
      // Clean up orphaned file on filesystem if DB insertion fails
      await storageService.delete(stored.storageRef);
      throw dbErr;
    }
  }

  /**
   * Retrieves all document records for a building from PostgreSQL with role-based filtering
   */
  public static async getDocuments(
    buildingIdOrPassport: string,
    currentUserOrRole?: { role?: UserRole; userId?: string } | UserRole
  ): Promise<DocumentRecord[]> {
    const userRole = typeof currentUserOrRole === "string" ? currentUserOrRole : currentUserOrRole?.role;
    const userId = typeof currentUserOrRole === "object" ? currentUserOrRole?.userId : undefined;

    const res = await query<DocumentDbRow>(
      `SELECT d.* FROM documents d
       JOIN buildings b ON d.building_id = b.id
       WHERE b.id = $1 OR b.passport_id = $2
       ORDER BY d.upload_date DESC, d.created_at DESC;`,
      [buildingIdOrPassport, buildingIdOrPassport.toUpperCase()]
    );

    const docs = res.rows.map((row) => {
      const rec = mapDocumentRow(row);
      rec.url = storageService.getUrl(rec.storageReference);
      return rec;
    });

    // Admin and Engineer see all documents registry-wide
    if (userRole === "admin" || userRole === "engineer") {
      return docs;
    }

    // Owner only sees private documents if they created the building
    if (userRole === "owner" && userId) {
      const bldRes = await query<{ created_by: string | null }>(
        "SELECT created_by FROM buildings WHERE id = $1 OR passport_id = $2 LIMIT 1;",
        [buildingIdOrPassport, buildingIdOrPassport.toUpperCase()]
      );
      if (bldRes.rows.length > 0 && bldRes.rows[0].created_by === userId) {
        return docs;
      }
    }

    // Public / unauthenticated / other owners only see non-private documents
    return docs.filter((d) => !d.isPrivate);
  }

  /**
   * Retrieves single document by ID or documentId
   */
  public static async getDocumentById(idOrDocumentId: string): Promise<DocumentRecord | null> {
    const res = await query<DocumentDbRow>(
      "SELECT * FROM documents WHERE id = $1 OR document_id = $2 LIMIT 1;",
      [idOrDocumentId, idOrDocumentId.toUpperCase()]
    );

    if (res.rows.length === 0) {
      return null;
    }

    const rec = mapDocumentRow(res.rows[0]);
    rec.url = storageService.getUrl(rec.storageReference);
    return rec;
  }
}
