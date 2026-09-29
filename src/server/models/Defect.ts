import mongoose, { Schema, Document, Types } from "mongoose";
import { DefectSeverity, DefectStatus } from "@/lib/types";

export interface IDefect extends Document {
  defectId: string;
  buildingId: Types.ObjectId;
  inspectionId?: Types.ObjectId;
  category: string;
  location: string;
  severity: DefectSeverity;
  status: DefectStatus;
  details: string;
  imageRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DefectSchema = new Schema<IDefect>(
  {
    defectId: {
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
    inspectionId: {
      type: Schema.Types.ObjectId,
      ref: "Inspection",
      index: true,
    },
    category: {
      type: String,
      required: [true, "Defect category is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Defect location is required"],
      trim: true,
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Open", "In Review", "Remediated", "Closed"],
      default: "Open",
    },
    details: {
      type: String,
      required: [true, "Observation details are required"],
      trim: true,
    },
    imageRef: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const DefectModel = mongoose.models.Defect || mongoose.model<IDefect>("Defect", DefectSchema);
