export type UserRole = "admin" | "engineer" | "owner" | "public";

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface BuildingIdentity {
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
}

export interface StructuralInfo {
  frameType: string;
  foundation: string;
  fireRating: string;
  exteriorCladding: string;
  seismicZone?: string;
}

export interface BuilderInfo {
  companyName: string;
  builderName: string;
  contact: string;
  details: string;
}

export interface OwnerInfo {
  name: string;
  contact: string;
  email?: string;
  additionalInfo?: string;
}

export interface BuildingPhotograph {
  url: string;
  caption: string;
  category: "main" | "additional" | "construction";
  isPrivate: boolean;
  uploadedAt: string;
}

export interface BuildingRecord {
  id: string;
  passportId: string;
  name: string;
  type: string;
  constructionDate: string;
  location: BuildingIdentity["location"];
  totalArea: string;
  floors: number;
  units: number;
  usage: string;
  description: string;
  structuralInfo: StructuralInfo;
  builder: BuilderInfo;
  owner?: OwnerInfo; // Protected from public view
  qrCodeDataUrl: string;
  photographs: BuildingPhotograph[];
  condition: string;
  maintenanceStatus: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type DefectSeverity = "Low" | "Medium" | "High" | "Critical";
export type DefectStatus = "Open" | "In Review" | "Remediated" | "Closed";

export interface DefectRecord {
  id: string;
  defectId: string;
  buildingId: string;
  inspectionId?: string | null;
  category: string;
  location: string;
  severity: DefectSeverity;
  status: DefectStatus;
  details: string;
  imageRef?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionRecord {
  id: string;
  inspectionId: string;
  buildingId: string;
  inspectorId: string;
  inspectorName: string;
  date: string;
  observations: string;
  remarks: string;
  defectsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceStatus = "Scheduled" | "In Progress" | "Completed" | "Deferred";

export interface MaintenanceRecord {
  id: string;
  maintenanceId: string;
  buildingId: string;
  repairType: string;
  repairDate: string;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  contractor: string;
  warrantyDetails?: string;
  expectedRepairs?: string;
  futureRequirements?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = "blueprint" | "structural" | "permit" | "report" | "other";

export interface DocumentRecord {
  id: string;
  documentId: string;
  buildingId: string;
  documentType: DocumentType;
  title: string;
  originalFilename: string;
  storageReference: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  uploadedBy?: string;
  isPrivate: boolean;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuildingReport {
  generatedAt: string;
  generatedBy: {
    userId: string;
    name: string;
    role: UserRole;
  };
  building: BuildingRecord;
  inspections: InspectionRecord[];
  defects: DefectRecord[];
  maintenance: MaintenanceRecord[];
  documents: Array<Omit<DocumentRecord, "storageReference">>;
  summary: {
    totalInspections: number;
    openDefects: number;
    criticalDefects: number;
    totalMaintenanceCost: number;
    documentsCount: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}
