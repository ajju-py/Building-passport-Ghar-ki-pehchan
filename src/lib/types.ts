export type UserRole = "admin" | "engineer" | "owner" | "public";

export type AccountStatus = "pending_verification" | "active" | "suspended" | "disabled";

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  accountStatus?: AccountStatus;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile?: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerifiedAt?: string | null;
  mobileVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OtpPurpose = "EMAIL_VERIFICATION" | "MOBILE_VERIFICATION" | "PASSWORD_RESET";

export interface OtpVerificationRecord {
  id: string;
  userId: string;
  purpose: OtpPurpose;
  destination: string;
  expiresAt: string;
  consumedAt?: string | null;
  attemptCount: number;
  createdAt: string;
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

// ==============================================================================
// STAGE 3: AI HEALTH PREDICTION & RISK ASSESSMENT DOMAIN TYPES
// ==============================================================================

export type RiskLevel = "Low" | "Moderate" | "Elevated" | "High" | "Critical";

export interface CategoryScores {
  structural: number;
  defectBurden: number;
  maintenance: number;
  safety: number;
  lifecycle: number;
  documentation: number;
}

export interface ContributingFactor {
  category: string;
  factor: string;
  impact: number;
}

export interface HealthAssessmentRecord {
  id: string;
  buildingId: string;
  assessmentDate: string;
  overallScore: number;
  riskLevel: RiskLevel;
  categoryScores: CategoryScores;
  contributingFactors: ContributingFactor[];
  recommendations: string[];
  dataCompletenessScore: number;
  modelVersion: string;
  engineType: string;
  summaryExplanation: string;
  assessedBy?: string | null;
  createdAt: string;
}

// ==============================================================================
// STAGE 3: PHASE 17 CIVIL ENGINEERING FEATURE EXTRACTION TYPES
// ==============================================================================

export interface BuildingLifecycleFeatures {
  constructionDate: string;
  buildingAgeYears: number | null;
  buildingType: string;
  usage: string;
  floors: number;
  units: number;
  totalArea: string;
  totalAreaSqMeters: number | null;
  frameType: string;
  foundation: string;
  fireRating: string;
  seismicZone: string | null;
  exteriorCladding: string;
  declaredCondition: string;
  declaredMaintenanceStatus: string;
}

export interface InspectionFeatures {
  totalInspections: number;
  mostRecentInspectionDate: string | null;
  daysSinceLastInspection: number | null;
  totalDefectsRecordedFromInspections: number;
  hasObservations: boolean;
  hasRemarks: boolean;
  hasCertifiedInspector: boolean;
}

export interface DefectFeatures {
  totalDefects: number;
  openCount: number;
  inReviewCount: number;
  remediatedCount: number;
  closedCount: number;
  unresolvedCount: number;
  lowSeverityCount: number;
  mediumSeverityCount: number;
  highSeverityCount: number;
  criticalSeverityCount: number;
  unresolvedCriticalCount: number;
  unresolvedHighCount: number;
  defectClosureRate: number | null;
  categoryDistribution: Record<string, number>;
}

export interface MaintenanceFeatures {
  totalMaintenanceRecords: number;
  completedCount: number;
  scheduledCount: number;
  inProgressCount: number;
  deferredCount: number;
  totalCost: number;
  mostRecentMaintenanceDate: string | null;
  daysSinceLastMaintenance: number | null;
  hasPendingOrFutureRequirements: boolean;
  hasWarrantyCoverage: boolean;
}

export interface DocumentationFeatures {
  totalDocuments: number;
  blueprintCount: number;
  structuralCount: number;
  permitCount: number;
  reportCount: number;
  otherCount: number;
  privateDocumentCount: number;
  publicDocumentCount: number;
  hasBlueprint: boolean;
  hasStructural: boolean;
  hasPermit: boolean;
  hasReport: boolean;
  mostRecentDocumentDate: string | null;
}

export interface PhotographFeatures {
  totalPhotographs: number;
  mainPhotographCount: number;
  additionalPhotographCount: number;
  constructionPhotographCount: number;
  hasMainPhotograph: boolean;
  hasConstructionPhotographs: boolean;
}

export interface DataQualityFeatures {
  dataCompletenessScore: number;
  evaluatedCheckpointsCount: number;
  satisfiedCheckpointsCount: number;
  missingCheckpoints: string[];
}

export interface CivilHealthFeatures {
  buildingId: string;
  passportId: string;
  extractedAt: string;
  referenceDate: string;
  lifecycle: BuildingLifecycleFeatures;
  inspections: InspectionFeatures;
  defects: DefectFeatures;
  maintenance: MaintenanceFeatures;
  documentation: DocumentationFeatures;
  photographs: PhotographFeatures;
  dataQuality: DataQualityFeatures;
}

// ==============================================================================
// STAGE 3: PHASE 18 DETERMINISTIC RISK ENGINE TYPES
// ==============================================================================

export interface HealthAssessmentCalculation {
  buildingId: string;
  passportId: string;
  overallScore: number;
  riskLevel: RiskLevel;
  categoryScores: CategoryScores;
  contributingFactors: ContributingFactor[];
  recommendations: string[];
  dataCompletenessScore: number;
  modelVersion: string;
  engineType: string;
  summaryExplanation: string;
}

