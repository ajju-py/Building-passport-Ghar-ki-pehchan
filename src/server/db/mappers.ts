import {
  BuildingRecord,
  BuildingPhotograph,
  InspectionRecord,
  DefectRecord,
  MaintenanceRecord,
  DocumentRecord,
  DefectSeverity,
  DefectStatus,
  MaintenanceStatus,
  DocumentType,
  UserProfile,
  UserRole,
  AccountStatus,
  HealthAssessmentRecord,
  RiskLevel,
  CategoryScores,
  ContributingFactor,
} from "@/lib/types";

export interface BuildingDbRow {
  id: string;
  passport_id: string;
  name: string;
  type: string;
  construction_date: string;
  location_address: string;
  location_city: string;
  location_state: string | null;
  location_postal_code: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  total_area: string;
  floors: number;
  units: number;
  usage: string;
  description: string | null;
  frame_type: string;
  foundation: string;
  fire_rating: string;
  exterior_cladding: string;
  seismic_zone: string | null;
  builder_company_name: string | null;
  builder_name: string | null;
  builder_contact: string | null;
  builder_details: string | null;
  owner_name: string | null;
  owner_contact: string | null;
  owner_email: string | null;
  owner_additional_info: string | null;
  qr_code_data_url: string | null;
  condition: string;
  maintenance_status: string;
  created_by: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PhotographDbRow {
  id: string;
  building_id: string;
  url: string;
  caption: string | null;
  category: "main" | "additional" | "construction";
  is_private: boolean;
  uploaded_at: Date | string;
}

export interface InspectionDbRow {
  id: string;
  inspection_id: string;
  building_id: string;
  inspector_id: string | null;
  inspector_name: string;
  date: Date | string;
  observations: string;
  remarks: string | null;
  defects_count: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface DefectDbRow {
  id: string;
  defect_id: string;
  building_id: string;
  inspection_id: string | null;
  category: string;
  location: string;
  severity: string;
  status: string;
  details: string;
  image_ref: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface MaintenanceDbRow {
  id: string;
  maintenance_id: string;
  building_id: string;
  repair_type: string;
  repair_date: Date | string;
  description: string;
  cost: string | number;
  status: string;
  contractor: string;
  warranty_details: string | null;
  expected_repairs: string | null;
  future_requirements: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface DocumentDbRow {
  id: string;
  document_id: string;
  building_id: string;
  document_type: string;
  title: string;
  original_filename: string;
  storage_reference: string;
  file_size: string | number;
  mime_type: string;
  upload_date: Date | string;
  uploaded_by: string | null;
  is_private: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

function formatDateOnly(date: Date | string): string {
  if (date instanceof Date) {
    return date.toISOString().split("T")[0];
  }
  const str = String(date);
  return str.includes("T") ? str.split("T")[0] : str;
}

export function mapPhotographRow(row: PhotographDbRow): BuildingPhotograph {
  return {
    url: row.url,
    caption: row.caption || "",
    category: row.category,
    isPrivate: Boolean(row.is_private),
    uploadedAt: row.uploaded_at instanceof Date ? row.uploaded_at.toISOString() : new Date(row.uploaded_at).toISOString(),
  };
}

export function mapBuildingRow(
  row: BuildingDbRow,
  photographs: BuildingPhotograph[] = []
): BuildingRecord {
  const hasCoordinates = row.latitude !== null && row.longitude !== null && row.latitude !== undefined && row.longitude !== undefined;

  return {
    id: row.id,
    passportId: row.passport_id,
    name: row.name,
    type: row.type,
    constructionDate: formatDateOnly(row.construction_date),
    location: {
      address: row.location_address,
      city: row.location_city,
      state: row.location_state || undefined,
      postalCode: row.location_postal_code || undefined,
      coordinates: hasCoordinates
        ? {
            lat: Number(row.latitude),
            lng: Number(row.longitude),
          }
        : undefined,
    },
    totalArea: row.total_area,
    floors: Number(row.floors),
    units: Number(row.units),
    usage: row.usage,
    description: row.description || "",
    structuralInfo: {
      frameType: row.frame_type,
      foundation: row.foundation,
      fireRating: row.fire_rating,
      exteriorCladding: row.exterior_cladding,
      seismicZone: row.seismic_zone || undefined,
    },
    builder: {
      companyName: row.builder_company_name || "",
      builderName: row.builder_name || "",
      contact: row.builder_contact || "",
      details: row.builder_details || "",
    },
    owner:
      row.owner_name || row.owner_contact || row.owner_email || row.owner_additional_info
        ? {
            name: row.owner_name || "",
            contact: row.owner_contact || "",
            email: row.owner_email || undefined,
            additionalInfo: row.owner_additional_info || undefined,
          }
        : undefined,
    qrCodeDataUrl: row.qr_code_data_url || "",
    photographs,
    condition: row.condition || "Good",
    maintenanceStatus: row.maintenance_status || "Up to Date",
    createdBy: row.created_by || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString(),
  };
}

export function mapInspectionRow(row: InspectionDbRow): InspectionRecord {
  return {
    id: row.id,
    inspectionId: row.inspection_id,
    buildingId: row.building_id,
    inspectorId: row.inspector_id || "",
    inspectorName: row.inspector_name,
    date: formatDateOnly(row.date),
    observations: row.observations,
    remarks: row.remarks || "",
    defectsCount: Number(row.defects_count) || 0,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString(),
  };
}

export function mapDefectRow(row: DefectDbRow): DefectRecord {
  return {
    id: row.id,
    defectId: row.defect_id,
    buildingId: row.building_id,
    inspectionId: row.inspection_id || undefined,
    category: row.category,
    location: row.location,
    severity: row.severity as DefectSeverity,
    status: row.status as DefectStatus,
    details: row.details,
    imageRef: row.image_ref || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString(),
  };
}

export function mapMaintenanceRow(row: MaintenanceDbRow): MaintenanceRecord {
  return {
    id: row.id,
    maintenanceId: row.maintenance_id,
    buildingId: row.building_id,
    repairType: row.repair_type,
    repairDate: formatDateOnly(row.repair_date),
    description: row.description,
    cost: Number(row.cost),
    status: row.status as MaintenanceStatus,
    contractor: row.contractor,
    warrantyDetails: row.warranty_details || undefined,
    expectedRepairs: row.expected_repairs || undefined,
    futureRequirements: row.future_requirements || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString(),
  };
}

export function mapDocumentRow(row: DocumentDbRow): DocumentRecord {
  return {
    id: row.id,
    documentId: row.document_id,
    buildingId: row.building_id,
    documentType: row.document_type as DocumentType,
    title: row.title,
    originalFilename: row.original_filename,
    storageReference: row.storage_reference,
    fileSize: Number(row.file_size),
    mimeType: row.mime_type,
    uploadDate: row.upload_date instanceof Date ? row.upload_date.toISOString() : new Date(row.upload_date).toISOString(),
    uploadedBy: row.uploaded_by || undefined,
    isPrivate: Boolean(row.is_private),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString(),
  };
}

export interface UserDbRow {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  mobile: string | null;
  account_status: string;
  email_verified_at: Date | string | null;
  mobile_verified_at: Date | string | null;
  failed_login_attempts: number;
  locked_until: Date | string | null;
  last_login_at: Date | string | null;
  password_changed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export function mapUserProfileRow(row: UserDbRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    mobile: row.mobile || undefined,
    role: row.role as UserRole,
    accountStatus: (row.account_status || "active") as AccountStatus,
    emailVerifiedAt: row.email_verified_at ? (row.email_verified_at instanceof Date ? row.email_verified_at.toISOString() : new Date(row.email_verified_at).toISOString()) : null,
    mobileVerifiedAt: row.mobile_verified_at ? (row.mobile_verified_at instanceof Date ? row.mobile_verified_at.toISOString() : new Date(row.mobile_verified_at).toISOString()) : null,
    lastLoginAt: row.last_login_at ? (row.last_login_at instanceof Date ? row.last_login_at.toISOString() : new Date(row.last_login_at).toISOString()) : null,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString(),
  };
}

export interface HealthAssessmentDbRow {
  id: string;
  building_id: string;
  assessment_date: Date | string;
  overall_score: string | number;
  risk_level: string;
  category_scores: CategoryScores | string;
  contributing_factors: ContributingFactor[] | string;
  recommendations: string[] | string;
  data_completeness_score: string | number;
  model_version: string;
  engine_type: string;
  summary_explanation: string;
  assessed_by: string | null;
  created_at: Date | string;
}

export function mapHealthAssessmentRow(row: HealthAssessmentDbRow): HealthAssessmentRecord {
  return {
    id: row.id,
    buildingId: row.building_id,
    assessmentDate: row.assessment_date instanceof Date ? row.assessment_date.toISOString() : new Date(row.assessment_date).toISOString(),
    overallScore: Number(row.overall_score),
    riskLevel: row.risk_level as RiskLevel,
    categoryScores: typeof row.category_scores === "string" ? JSON.parse(row.category_scores) : row.category_scores,
    contributingFactors: typeof row.contributing_factors === "string" ? JSON.parse(row.contributing_factors) : (row.contributing_factors || []),
    recommendations: typeof row.recommendations === "string" ? JSON.parse(row.recommendations) : (row.recommendations || []),
    dataCompletenessScore: Number(row.data_completeness_score),
    modelVersion: row.model_version,
    engineType: row.engine_type,
    summaryExplanation: row.summary_explanation,
    assessedBy: row.assessed_by || null,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
  };
}
