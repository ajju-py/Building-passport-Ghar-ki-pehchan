import mongoose, { Schema, Document, Types } from "mongoose";
import { DocumentType } from "@/lib/types";

export interface IDocumentRecord extends Document {
  documentId: string;
  buildingId: Types.ObjectId;
  documentType: DocumentType;
  title: string;
  originalFilename: string;
  storageReference: string;
  fileSize: number;
  mimeType: string;
  uploadDate: Date;
  uploadedBy?: Types.ObjectId;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocumentRecord>(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ["blueprint", "structural", "permit", "report", "other"],
      default: "other",
    },
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    storageReference: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const DocumentModel = mongoose.models.DocumentRecord || mongoose.model<IDocumentRecord>("DocumentRecord", DocumentSchema);
