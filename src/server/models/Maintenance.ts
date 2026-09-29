import mongoose, { Schema, Document, Types } from "mongoose";
import { MaintenanceStatus } from "@/lib/types";

export interface IMaintenance extends Document {
  maintenanceId: string;
  buildingId: Types.ObjectId;
  repairType: string;
  repairDate: Date;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  contractor: string;
  warrantyDetails?: string;
  expectedRepairs?: string;
  futureRequirements?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenance>(
  {
    maintenanceId: {
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
    repairType: {
      type: String,
      required: [true, "Repair type is required"],
      trim: true,
    },
    repairDate: {
      type: Date,
      required: [true, "Repair date is required"],
      default: Date.now,
    },
    description: {
      type: String,
      required: [true, "Repair description is required"],
      trim: true,
    },
    cost: {
      type: Number,
      required: [true, "Repair cost is required"],
      min: [0, "Cost cannot be negative"],
      default: 0,
    },
    status: {
      type: String,
      enum: ["Scheduled", "In Progress", "Completed", "Deferred"],
      default: "Completed",
    },
    contractor: {
      type: String,
      required: [true, "Contractor or service provider is required"],
      trim: true,
    },
    warrantyDetails: {
      type: String,
      default: "",
    },
    expectedRepairs: {
      type: String,
      default: "",
    },
    futureRequirements: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const MaintenanceModel = mongoose.models.Maintenance || mongoose.model<IMaintenance>("Maintenance", MaintenanceSchema);
