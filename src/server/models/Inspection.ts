import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInspection extends Document {
  inspectionId: string;
  buildingId: Types.ObjectId;
  inspectorId: Types.ObjectId;
  inspectorName: string;
  date: Date;
  observations: string;
  remarks: string;
  defects: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const InspectionSchema = new Schema<IInspection>(
  {
    inspectionId: {
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
    inspectorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inspectorName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    observations: {
      type: String,
      required: [true, "Observations are required"],
      trim: true,
    },
    remarks: {
      type: String,
      default: "",
    },
    defects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Defect",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const InspectionModel = mongoose.models.Inspection || mongoose.model<IInspection>("Inspection", InspectionSchema);
