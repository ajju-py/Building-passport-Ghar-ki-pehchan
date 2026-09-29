import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBuildingPhotograph {
  url: string;
  caption: string;
  category: "main" | "additional" | "construction";
  isPrivate: boolean;
  uploadedAt: Date;
}

export interface IBuilding extends Document {
  passportId: string;
  name: string;
  type: string;
  constructionDate: string;
  location: {
    address: string;
    city: string;
    state?: string;
    postalCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  totalArea: string;
  floors: number;
  units: number;
  usage: string;
  description: string;
  structuralInfo: {
    frameType: string;
    foundation: string;
    fireRating: string;
    exteriorCladding: string;
    seismicZone?: string;
  };
  builder: {
    companyName: string;
    builderName: string;
    contact: string;
    details: string;
  };
  owner: {
    name: string;
    contact: string;
    email?: string;
    additionalInfo?: string;
  };
  qrCodeDataUrl: string;
  photographs: IBuildingPhotograph[];
  condition: string;
  maintenanceStatus: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BuildingPhotographSchema = new Schema<IBuildingPhotograph>(
  {
    url: { type: String, required: true },
    caption: { type: String, default: "" },
    category: {
      type: String,
      enum: ["main", "additional", "construction"],
      default: "additional",
    },
    isPrivate: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const BuildingSchema = new Schema<IBuilding>(
  {
    passportId: {
      type: String,
      required: [true, "Building Passport ID is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Building name is required"],
      trim: true,
      maxlength: [150, "Name cannot exceed 150 characters"],
    },
    type: {
      type: String,
      required: [true, "Building type is required"],
      trim: true,
    },
    constructionDate: {
      type: String,
      required: [true, "Construction year/date is required"],
    },
    location: {
      address: { type: String, required: [true, "Address is required"] },
      city: { type: String, required: [true, "City is required"] },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    totalArea: {
      type: String,
      required: [true, "Total built-up area is required"],
    },
    floors: {
      type: Number,
      required: [true, "Number of floors is required"],
      min: [1, "Must have at least 1 floor"],
    },
    units: {
      type: Number,
      required: [true, "Number of units is required"],
      min: [1, "Must have at least 1 unit"],
    },
    usage: {
      type: String,
      required: [true, "Building usage classification is required"],
    },
    description: {
      type: String,
      default: "",
    },
    structuralInfo: {
      frameType: { type: String, default: "Reinforced Cement Concrete (RCC)" },
      foundation: { type: String, default: "Deep Pile Foundation" },
      fireRating: { type: String, default: "2-Hour Resistance" },
      exteriorCladding: { type: String, default: "Standard Facade" },
      seismicZone: { type: String, default: "Zone IV" },
    },
    builder: {
      companyName: { type: String, default: "Unspecified" },
      builderName: { type: String, default: "Unspecified" },
      contact: { type: String, default: "" },
      details: { type: String, default: "" },
    },
    owner: {
      name: { type: String, default: "Property Ownership Registry" },
      contact: { type: String, default: "" },
      email: { type: String, default: "" },
      additionalInfo: { type: String, default: "" },
    },
    qrCodeDataUrl: {
      type: String,
      default: "",
    },
    photographs: {
      type: [BuildingPhotographSchema],
      default: [],
    },
    condition: {
      type: String,
      default: "Good",
    },
    maintenanceStatus: {
      type: String,
      default: "Up to Date",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const BuildingModel = mongoose.models.Building || mongoose.model<IBuilding>("Building", BuildingSchema);
