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
  DrawingRecord,
  DrawingType,
  DrawingApprovalStatus,
  RegulatoryApprovalRecord,
  ApprovalType,
  ApprovalStatus,
  OwnerIdentityVerificationRecord,
  IdentityVerificationMethod,
  IdentityVerificationStatus,
  AuditLogRecord,
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
  plot_number?: string | null;
  survey_number?: string | null;
  built_up_area?: string | null;
  occupancy_status?: string | null;
  construction_status?: string | null;
  registration_date?: Date | string | null;
  structural_engineer_name?: string | null;
  structural_engineer_license?: string | null;
  architect_name?: string | null;
  architect_license?: string | null;
  gis_polygon?: Record<string, unknown> | Array<unknown> | string | null;
  created_by: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PhotographDbRow {
  id: string;
  building_id: string;
  url: string;
  caption: string | null;
  category: "main" | "additional" | "construction" | "exterior" | "interior" | "elevation" | "structural" | "inspection" | "site";
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
    plotNumber: row.plot_number || undefined,
    surveyNumber: row.survey_number || undefined,
    builtUpArea: row.built_up_area || undefined,
    occupancyStatus: row.occupancy_status || "Occupied",
    constructionStatus: row.construction_status || "Completed",
    registrationDate: row.registration_date ? formatDateOnly(row.registration_date) : undefined,
    structuralEngineerName: row.structural_engineer_name || undefined,
    structuralEngineerLicense: row.structural_engineer_license || undefined,
    architectName: row.architect_name || undefined,
    architectLicense: row.architect_license || undefined,
    gisPolygon: typeof row.gis_polygon === "string" ? JSON.parse(row.gis_polygon) : (row.gis_polygon || undefined),
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

// --- Drawings Mapper ---
export interface DrawingDbRow {
  id: string;
  building_id: string;
  drawing_type: string;
  title: string;
  version: number;
  revision_code: string;
  is_latest_approved: boolean;
  approval_status: string;
  approved_by: string | null;
  approved_at: Date | string | null;
  storage_reference: string;
  original_filename: string;
  file_size: number | string;
  mime_type: string;
  scale: string | null;
  sheet_number: string | null;
  uploaded_by: string | null;
  uploaded_at: Date | string;
  notes: string | null;
}

export function mapDrawingRow(row: DrawingDbRow): DrawingRecord {
  return {
    id: row.id,
    buildingId: row.building_id,
    drawingType: row.drawing_type as DrawingType,
    title: row.title,
    version: Number(row.version),
    revisionCode: row.revision_code,
    isLatestApproved: Boolean(row.is_latest_approved),
    approvalStatus: row.approval_status as DrawingApprovalStatus,
    approvedBy: row.approved_by || undefined,
    approvedAt: row.approved_at ? (row.approved_at instanceof Date ? row.approved_at.toISOString() : new Date(row.approved_at).toISOString()) : undefined,
    storageReference: row.storage_reference,
    originalFilename: row.original_filename,
    fileSize: Number(row.file_size),
    mimeType: row.mime_type,
    scale: row.scale || undefined,
    sheetNumber: row.sheet_number || undefined,
    uploadedBy: row.uploaded_by || undefined,
    uploadedAt: row.uploaded_at instanceof Date ? row.uploaded_at.toISOString() : new Date(row.uploaded_at).toISOString(),
    notes: row.notes || undefined,
    url: `/uploads/${row.storage_reference}`,
  };
}

// --- Regulatory Approval Mapper ---
export interface RegulatoryApprovalDbRow {
  id: string;
  building_id: string;
  approval_type: string;
  issuing_authority: string;
  approval_number: string;
  issue_date: Date | string;
  valid_until: Date | string | null;
  status: string;
  document_storage_ref: string | null;
  document_filename: string | null;
  remarks: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export function mapRegulatoryApprovalRow(row: RegulatoryApprovalDbRow): RegulatoryApprovalRecord {
  return {
    id: row.id,
    buildingId: row.building_id,
    approvalType: row.approval_type as ApprovalType,
    issuingAuthority: row.issuing_authority,
    approvalNumber: row.approval_number,
    issueDate: formatDateOnly(row.issue_date),
    validUntil: row.valid_until ? formatDateOnly(row.valid_until) : undefined,
    status: row.status as ApprovalStatus,
    documentStorageRef: row.document_storage_ref || undefined,
    documentFilename: row.document_filename || undefined,
    remarks: row.remarks || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString(),
  };
}

// --- Owner Identity Verification Mapper ---
export interface OwnerIdentityVerificationDbRow {
  id: string;
  building_id: string;
  owner_user_id: string | null;
  owner_name: string;
  verification_method: string;
  status: string;
  document_ref_type: string | null;
  document_masked_id: string | null;
  provider_reference: string | null;
  consent_reference: string | null;
  verified_at: Date | string | null;
  verified_by: string | null;
  remarks: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export function mapOwnerIdentityVerificationRow(row: OwnerIdentityVerificationDbRow): OwnerIdentityVerificationRecord {
  return {
    id: row.id,
    buildingId: row.building_id,
    ownerUserId: row.owner_user_id || undefined,
    ownerName: row.owner_name,
    verificationMethod: row.verification_method as IdentityVerificationMethod,
    status: row.status as IdentityVerificationStatus,
    documentRefType: row.document_ref_type || undefined,
    documentMaskedId: row.document_masked_id || undefined,
    providerReference: row.provider_reference || undefined,
    consentReference: row.consent_reference || undefined,
    verifiedAt: row.verified_at ? (row.verified_at instanceof Date ? row.verified_at.toISOString() : new Date(row.verified_at).toISOString()) : undefined,
    verifiedBy: row.verified_by || undefined,
    remarks: row.remarks || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString(),
  };
}

// --- Audit Log Mapper ---
export interface AuditLogDbRow {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  entity: string;
  entity_id: string;
  metadata: Record<string, unknown> | string;
  ip_address: string | null;
  created_at: Date | string;
}

export function mapAuditLogRow(row: AuditLogDbRow): AuditLogRecord {
  return {
    id: row.id,
    actorId: row.actor_id || undefined,
    actorName: row.actor_name || undefined,
    actorRole: row.actor_role || undefined,
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id,
    metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : (row.metadata || {}),
    ipAddress: row.ip_address || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
  };
}
