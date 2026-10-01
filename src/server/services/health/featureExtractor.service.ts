import { query } from "@/server/db/postgres";
import {
  BuildingDbRow,
  InspectionDbRow,
  DefectDbRow,
  MaintenanceDbRow,
  DocumentDbRow,
  PhotographDbRow,
} from "@/server/db/mappers";
import {
  CivilHealthFeatures,
  BuildingLifecycleFeatures,
  InspectionFeatures,
  DefectFeatures,
  MaintenanceFeatures,
  DocumentationFeatures,
  PhotographFeatures,
  DataQualityFeatures,
} from "@/lib/types";

/**
 * Deterministically parses an area string (e.g., "125,000 sq ft", "4500 sq m")
 * into approximate square meters. Returns null if unparseable.
 */
export function parseAreaToSqMeters(totalArea: string | null | undefined): number | null {
  if (!totalArea || typeof totalArea !== "string") return null;
  const cleaned = totalArea.trim().toLowerCase();
  const numericMatch = cleaned.replace(/,/g, "").match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!numericMatch) return null;

  const rawNumber = parseFloat(numericMatch[1]);
  if (isNaN(rawNumber) || rawNumber <= 0) return null;

  // Conversion factors to square meters
  if (cleaned.includes("sq ft") || cleaned.includes("sqft") || cleaned.includes("sq.ft") || cleaned.includes("feet")) {
    return Math.round(rawNumber * 0.092903 * 100) / 100;
  }
  if (cleaned.includes("sq m") || cleaned.includes("sqm") || cleaned.includes("sq.m") || cleaned.includes("meter")) {
    return Math.round(rawNumber * 100) / 100;
  }
  // Default raw numeric assuming square meters if unit unspecified
  return Math.round(rawNumber * 100) / 100;
}

/**
 * Calculates elapsed calendar days between two dates.
 * Returns null if either date is invalid.
 */
export function calculateElapsedDays(targetDate: Date | string | null | undefined, refDate: Date): number | null {
  if (!targetDate) return null;
  const d = targetDate instanceof Date ? targetDate : new Date(targetDate);
  if (isNaN(d.getTime())) return null;
  const diffMs = refDate.getTime() - d.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Calculates building age in fractional years from a construction date string.
 * Returns null if the date is invalid or in the future.
 */
export function calculateBuildingAgeYears(constructionDate: string | null | undefined, refDate: Date): number | null {
  if (!constructionDate) return null;
  const d = new Date(constructionDate);
  if (isNaN(d.getTime())) return null;
  const diffMs = refDate.getTime() - d.getTime();
  if (diffMs < 0) return 0.0;
  const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.round(years * 100) / 100;
}

/**
 * Extracts Building Lifecycle Features from a Building database record.
 */
export function extractLifecycleFeatures(
  building: BuildingDbRow,
  referenceDate: Date
): BuildingLifecycleFeatures {
  return {
    constructionDate: building.construction_date || "",
    buildingAgeYears: calculateBuildingAgeYears(building.construction_date, referenceDate),
    buildingType: building.type || "",
    usage: building.usage || "",
    floors: Number(building.floors) || 0,
    units: Number(building.units) || 0,
    totalArea: building.total_area || "",
    totalAreaSqMeters: parseAreaToSqMeters(building.total_area),
    frameType: building.frame_type || "",
    foundation: building.foundation || "",
    fireRating: building.fire_rating || "",
    seismicZone: building.seismic_zone || null,
    exteriorCladding: building.exterior_cladding || "",
    declaredCondition: building.condition || "Unknown",
    declaredMaintenanceStatus: building.maintenance_status || "Unknown",
  };
}

/**
 * Extracts Inspection Features from historical inspection database records.
 */
export function extractInspectionFeatures(
  inspections: InspectionDbRow[],
  referenceDate: Date
): InspectionFeatures {
  const totalInspections = inspections.length;
  if (totalInspections === 0) {
    return {
      totalInspections: 0,
      mostRecentInspectionDate: null,
      daysSinceLastInspection: null,
      totalDefectsRecordedFromInspections: 0,
      hasObservations: false,
      hasRemarks: false,
      hasCertifiedInspector: false,
    };
  }

  // Find most recent inspection by date
  const sorted = [...inspections].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return db - da;
  });
  const latest = sorted[0];

  const mostRecentInspectionDate = latest.date instanceof Date
    ? latest.date.toISOString().split("T")[0]
    : String(latest.date).split("T")[0];

  const daysSinceLastInspection = calculateElapsedDays(latest.date, referenceDate);
  const totalDefectsRecorded = inspections.reduce((sum, insp) => sum + (Number(insp.defects_count) || 0), 0);

  const hasObservations = inspections.some((insp) => Boolean(insp.observations && insp.observations.trim().length > 0));
  const hasRemarks = inspections.some((insp) => Boolean(insp.remarks && insp.remarks.trim().length > 0));
  const hasCertifiedInspector = inspections.some((insp) => Boolean(insp.inspector_name && insp.inspector_name.trim().length > 0));

  return {
    totalInspections,
    mostRecentInspectionDate,
    daysSinceLastInspection,
    totalDefectsRecordedFromInspections: totalDefectsRecorded,
    hasObservations,
    hasRemarks,
    hasCertifiedInspector,
  };
}

/**
 * Extracts Defect Features from historical defect records.
 */
export function extractDefectFeatures(defects: DefectDbRow[]): DefectFeatures {
  const totalDefects = defects.length;

  let openCount = 0;
  let inReviewCount = 0;
  let remediatedCount = 0;
  let closedCount = 0;

  let lowSeverityCount = 0;
  let mediumSeverityCount = 0;
  let highSeverityCount = 0;
  let criticalSeverityCount = 0;

  let unresolvedCriticalCount = 0;
  let unresolvedHighCount = 0;

  const categoryDistribution: Record<string, number> = {};

  for (const d of defects) {
    const status = d.status;
    const severity = d.severity;
    const cat = d.category || "Uncategorized";

    // Track category distribution
    categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;

    // Track status
    if (status === "Open") openCount++;
    else if (status === "In Review") inReviewCount++;
    else if (status === "Remediated") remediatedCount++;
    else if (status === "Closed") closedCount++;

    // Track severity
    if (severity === "Low") lowSeverityCount++;
    else if (severity === "Medium") mediumSeverityCount++;
    else if (severity === "High") highSeverityCount++;
    else if (severity === "Critical") criticalSeverityCount++;

    // Track unresolved high/critical burdens
    const isUnresolved = status === "Open" || status === "In Review";
    if (isUnresolved && severity === "Critical") unresolvedCriticalCount++;
    if (isUnresolved && severity === "High") unresolvedHighCount++;
  }

  const unresolvedCount = openCount + inReviewCount;
  const closedOrRemediated = remediatedCount + closedCount;
  const defectClosureRate = totalDefects > 0
    ? Math.round((closedOrRemediated / totalDefects) * 10000) / 10000
    : null;

  return {
    totalDefects,
    openCount,
    inReviewCount,
    remediatedCount,
    closedCount,
    unresolvedCount,
    lowSeverityCount,
    mediumSeverityCount,
    highSeverityCount,
    criticalSeverityCount,
    unresolvedCriticalCount,
    unresolvedHighCount,
    defectClosureRate,
    categoryDistribution,
  };
}

/**
 * Extracts Maintenance Features from historical maintenance records.
 */
export function extractMaintenanceFeatures(
  maintenance: MaintenanceDbRow[],
  referenceDate: Date
): MaintenanceFeatures {
  const totalMaintenanceRecords = maintenance.length;
  if (totalMaintenanceRecords === 0) {
    return {
      totalMaintenanceRecords: 0,
      completedCount: 0,
      scheduledCount: 0,
      inProgressCount: 0,
      deferredCount: 0,
      totalCost: 0,
      mostRecentMaintenanceDate: null,
      daysSinceLastMaintenance: null,
      hasPendingOrFutureRequirements: false,
      hasWarrantyCoverage: false,
    };
  }

  let completedCount = 0;
  let scheduledCount = 0;
  let inProgressCount = 0;
  let deferredCount = 0;
  let totalCost = 0;
  let hasPendingOrFutureRequirements = false;
  let hasWarrantyCoverage = false;

  for (const m of maintenance) {
    if (m.status === "Completed") completedCount++;
    else if (m.status === "Scheduled") scheduledCount++;
    else if (m.status === "In Progress") inProgressCount++;
    else if (m.status === "Deferred") deferredCount++;

    totalCost += Number(m.cost) || 0;

    if ((m.expected_repairs && m.expected_repairs.trim()) || (m.future_requirements && m.future_requirements.trim())) {
      hasPendingOrFutureRequirements = true;
    }
    if (m.warranty_details && m.warranty_details.trim().length > 0) {
      hasWarrantyCoverage = true;
    }
  }

  // Sort maintenance to find most recent repair_date
  const sorted = [...maintenance].sort((a, b) => {
    const da = new Date(a.repair_date).getTime();
    const db = new Date(b.repair_date).getTime();
    return db - da;
  });
  const latest = sorted[0];

  const mostRecentMaintenanceDate = latest.repair_date instanceof Date
    ? latest.repair_date.toISOString().split("T")[0]
    : String(latest.repair_date).split("T")[0];

  const daysSinceLastMaintenance = calculateElapsedDays(latest.repair_date, referenceDate);

  return {
    totalMaintenanceRecords,
    completedCount,
    scheduledCount,
    inProgressCount,
    deferredCount,
    totalCost: Math.round(totalCost * 100) / 100,
    mostRecentMaintenanceDate,
    daysSinceLastMaintenance,
    hasPendingOrFutureRequirements,
    hasWarrantyCoverage,
  };
}

/**
 * Extracts Documentation Features from document storage records.
 */
export function extractDocumentationFeatures(documents: DocumentDbRow[]): DocumentationFeatures {
  const totalDocuments = documents.length;

  let blueprintCount = 0;
  let structuralCount = 0;
  let permitCount = 0;
  let reportCount = 0;
  let otherCount = 0;
  let privateDocumentCount = 0;
  let publicDocumentCount = 0;

  for (const doc of documents) {
    const type = doc.document_type;
    if (type === "blueprint") blueprintCount++;
    else if (type === "structural") structuralCount++;
    else if (type === "permit") permitCount++;
    else if (type === "report") reportCount++;
    else otherCount++;

    if (doc.is_private) privateDocumentCount++;
    else publicDocumentCount++;
  }

  let mostRecentDocumentDate: string | null = null;
  if (totalDocuments > 0) {
    const sorted = [...documents].sort((a, b) => {
      const da = new Date(a.upload_date).getTime();
      const db = new Date(b.upload_date).getTime();
      return db - da;
    });
    const latest = sorted[0];
    mostRecentDocumentDate = latest.upload_date instanceof Date
      ? latest.upload_date.toISOString()
      : new Date(latest.upload_date).toISOString();
  }

  return {
    totalDocuments,
    blueprintCount,
    structuralCount,
    permitCount,
    reportCount,
    otherCount,
    privateDocumentCount,
    publicDocumentCount,
    hasBlueprint: blueprintCount > 0,
    hasStructural: structuralCount > 0,
    hasPermit: permitCount > 0,
    hasReport: reportCount > 0,
    mostRecentDocumentDate,
  };
}

/**
 * Extracts Photograph Features from media records.
 */
export function extractPhotographFeatures(photographs: PhotographDbRow[]): PhotographFeatures {
  const totalPhotographs = photographs.length;
  let mainPhotographCount = 0;
  let additionalPhotographCount = 0;
  let constructionPhotographCount = 0;

  for (const p of photographs) {
    if (p.category === "main") mainPhotographCount++;
    else if (p.category === "construction") constructionPhotographCount++;
    else additionalPhotographCount++;
  }

  return {
    totalPhotographs,
    mainPhotographCount,
    additionalPhotographCount,
    constructionPhotographCount,
    hasMainPhotograph: mainPhotographCount > 0,
    hasConstructionPhotographs: constructionPhotographCount > 0,
  };
}

/**
 * Evaluates Civil Engineering Data Completeness across 12 explicit checkpoints.
 * Total points available = 100.
 */
export function calculateDataQualityFeatures(
  lifecycle: BuildingLifecycleFeatures,
  inspections: InspectionFeatures,
  maintenance: MaintenanceFeatures,
  docs: DocumentationFeatures
): DataQualityFeatures {
  const checkpoints: { name: string; weight: number; satisfied: boolean }[] = [
    { name: "construction_date", weight: 8, satisfied: Boolean(lifecycle.constructionDate && lifecycle.buildingAgeYears !== null) },
    { name: "building_type", weight: 7, satisfied: Boolean(lifecycle.buildingType && lifecycle.buildingType.trim().length > 0) },
    { name: "usage", weight: 7, satisfied: Boolean(lifecycle.usage && lifecycle.usage.trim().length > 0) },
    { name: "frame_type", weight: 8, satisfied: Boolean(lifecycle.frameType && lifecycle.frameType.trim().length > 0) },
    { name: "foundation", weight: 8, satisfied: Boolean(lifecycle.foundation && lifecycle.foundation.trim().length > 0) },
    { name: "fire_rating", weight: 7, satisfied: Boolean(lifecycle.fireRating && lifecycle.fireRating.trim().length > 0) },
    { name: "seismic_zone", weight: 6, satisfied: Boolean(lifecycle.seismicZone && lifecycle.seismicZone.trim().length > 0) },
    { name: "total_area_and_floors", weight: 7, satisfied: Boolean(lifecycle.totalArea && lifecycle.floors > 0) },
    { name: "inspection_history", weight: 12, satisfied: inspections.totalInspections > 0 },
    { name: "maintenance_history", weight: 10, satisfied: maintenance.totalMaintenanceRecords > 0 },
    { name: "structural_documents", weight: 10, satisfied: docs.hasStructural || docs.hasBlueprint },
    { name: "permit_documents", weight: 10, satisfied: docs.hasPermit },
  ];

  let score = 0;
  let satisfiedCount = 0;
  const missingCheckpoints: string[] = [];

  for (const cp of checkpoints) {
    if (cp.satisfied) {
      score += cp.weight;
      satisfiedCount++;
    } else {
      missingCheckpoints.push(cp.name);
    }
  }

  return {
    dataCompletenessScore: Math.round(score * 100) / 100,
    evaluatedCheckpointsCount: checkpoints.length,
    satisfiedCheckpointsCount: satisfiedCount,
    missingCheckpoints,
  };
}

/**
 * Main feature extraction service function.
 * Queries PostgreSQL directly using parameterized queries, extracts all civil engineering
 * features, and returns a strongly-typed CivilHealthFeatures object.
 * Returns null if the building does not exist.
 */
export async function extractCivilHealthFeatures(
  buildingIdOrPassportId: string,
  referenceDateInput?: Date
): Promise<CivilHealthFeatures | null> {
  // Deterministic reference date (caller-provided or fixed epoch for determinism)
  const referenceDate = referenceDateInput || new Date();

  // 1. Fetch building by internal id OR passport_id
  const bldRes = await query<BuildingDbRow>(
    "SELECT * FROM buildings WHERE id = $1 OR passport_id = $1 LIMIT 1;",
    [buildingIdOrPassportId]
  );

  if (bldRes.rows.length === 0) {
    return null;
  }
  const building = bldRes.rows[0];

  // 2. Fetch all related entities sequentially using parameterized queries
  const inspRes = await query<InspectionDbRow>(
    "SELECT * FROM inspections WHERE building_id = $1 ORDER BY date DESC;",
    [building.id]
  );
  const defRes = await query<DefectDbRow>(
    "SELECT * FROM defects WHERE building_id = $1 ORDER BY created_at DESC;",
    [building.id]
  );
  const maintRes = await query<MaintenanceDbRow>(
    "SELECT * FROM maintenance WHERE building_id = $1 ORDER BY repair_date DESC;",
    [building.id]
  );
  const docRes = await query<DocumentDbRow>(
    "SELECT * FROM documents WHERE building_id = $1 ORDER BY upload_date DESC;",
    [building.id]
  );
  const photoRes = await query<PhotographDbRow>(
    "SELECT * FROM building_photographs WHERE building_id = $1 ORDER BY uploaded_at DESC;",
    [building.id]
  );

  // 3. Extract sub-features deterministically
  const lifecycle = extractLifecycleFeatures(building, referenceDate);
  const inspections = extractInspectionFeatures(inspRes.rows, referenceDate);
  const defects = extractDefectFeatures(defRes.rows);
  const maintenance = extractMaintenanceFeatures(maintRes.rows, referenceDate);
  const documentation = extractDocumentationFeatures(docRes.rows);
  const photographs = extractPhotographFeatures(photoRes.rows);
  const dataQuality = calculateDataQualityFeatures(lifecycle, inspections, maintenance, documentation);

  return {
    buildingId: building.id,
    passportId: building.passport_id,
    extractedAt: referenceDate.toISOString(),
    referenceDate: referenceDate.toISOString().split("T")[0],
    lifecycle,
    inspections,
    defects,
    maintenance,
    documentation,
    photographs,
    dataQuality,
  };
}
