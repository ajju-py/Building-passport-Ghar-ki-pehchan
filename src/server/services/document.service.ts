import { DocumentRecord, DocumentType, UserRole } from "@/lib/types";
import { connectDb, isDbConnected } from "../db";
import { DocumentModel } from "../models/Document";
import { storageService } from "./storage.service";
import { memoryDocuments } from "./building.service";

export class DocumentService {
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
    const documentId = `DOC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    // Store physical file
    const stored = await storageService.save(
      params.fileBuffer,
      params.originalFilename,
      params.mimeType
    );

    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        const created = await DocumentModel.create({
          documentId,
          buildingId: params.buildingId,
          documentType: params.documentType,
          title: params.title,
          originalFilename: params.originalFilename,
          storageReference: stored.storageRef,
          fileSize: stored.size,
          mimeType: stored.mimeType,
          uploadDate: new Date(),
          uploadedBy: params.uploadedBy,
          isPrivate: !!params.isPrivate,
        });

        const rec: DocumentRecord = {
          id: created._id.toString(),
          documentId: created.documentId,
          buildingId: created.buildingId.toString(),
          documentType: created.documentType,
          title: created.title,
          originalFilename: created.originalFilename,
          storageReference: created.storageReference,
          fileSize: created.fileSize,
          mimeType: created.mimeType,
          uploadDate: created.uploadDate.toISOString(),
          uploadedBy: created.uploadedBy?.toString(),
          isPrivate: created.isPrivate,
          url: stored.url,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
        memoryDocuments.unshift(rec);
        return rec;
      }
    } catch {
      // Memory fallback
    }

    const rec: DocumentRecord = {
      id: `doc_${Date.now()}`,
      documentId,
      buildingId: params.buildingId,
      documentType: params.documentType,
      title: params.title,
      originalFilename: params.originalFilename,
      storageReference: stored.storageRef,
      fileSize: stored.size,
      mimeType: stored.mimeType,
      uploadDate: new Date().toISOString(),
      uploadedBy: params.uploadedBy,
      isPrivate: !!params.isPrivate,
      url: stored.url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryDocuments.unshift(rec);
    return rec;
  }

  public static async getDocuments(
    buildingId: string,
    userRole?: UserRole
  ): Promise<DocumentRecord[]> {
    let docs: DocumentRecord[] = [];

    try {
      if (isDbConnected() || (await connectDb().catch(() => null))) {
        const found = await DocumentModel.find({ buildingId }).sort({ createdAt: -1 });
        if (found.length > 0) {
          docs = found.map((d) => ({
            id: d._id.toString(),
            documentId: d.documentId,
            buildingId: d.buildingId.toString(),
            documentType: d.documentType,
            title: d.title,
            originalFilename: d.originalFilename,
            storageReference: d.storageReference,
            fileSize: d.fileSize,
            mimeType: d.mimeType,
            uploadDate: d.uploadDate.toISOString(),
            uploadedBy: d.uploadedBy?.toString(),
            isPrivate: d.isPrivate,
            url: storageService.getUrl(d.storageReference),
            createdAt: d.createdAt.toISOString(),
            updatedAt: d.updatedAt.toISOString(),
          }));
        }
      }
    } catch {
      // Memory fallback
    }

    if (docs.length === 0) {
      docs = memoryDocuments
        .filter((d) => d.buildingId === buildingId)
        .map((d) => ({
          ...d,
          url: storageService.getUrl(d.storageReference),
        }));
    }

    // Role-based privacy filter
    if (userRole === "admin" || userRole === "engineer" || userRole === "owner") {
      return docs;
    }

    // Public only sees non-private documents
    return docs.filter((d) => !d.isPrivate);
  }
}
