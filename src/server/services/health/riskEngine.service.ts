import {
  CivilHealthFeatures,
  CategoryScores,
  ContributingFactor,
  RiskLevel,
  HealthAssessmentCalculation,
} from "@/lib/types";

export const MODEL_VERSION = "bp-rules-v1.0" as const;
export const ENGINE_TYPE = "rule_based_deterministic" as const;

/**
 * Category Weights for Master Health Score Calculation.
 * Grounded in civil infrastructure multi-criteria decision analysis (MCDA).
 * Note: These weights represent a project baseline, not a certified statutory standard.
 */
export const CATEGORY_WEIGHTS = {
  structural: 0.25,
  defectBurden: 0.25,
  maintenance: 0.20,
  safety: 0.10,
  lifecycle: 0.10,
  documentation: 0.10,
} as const;

// Self-verifying weight validation: weights must sum to exactly 1.00
const weightSum = Object.values(CATEGORY_WEIGHTS).reduce((sum, w) => sum + w, 0);
if (Math.abs(weightSum - 1.0) > 1e-6) {
  throw new Error(`[RiskEngine Config Error] Category weights must sum to 1.00, got ${weightSum}`);
}

/**
 * Helper to clamp values strictly to [min, max] range and round to precision.
 */
function clamp(val: number, min = 0.0, max = 100.0): number {
  if (isNaN(val)) return min;
  return Math.min(max, Math.max(min, val));
}

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

/**
 * 1. STRUCTURAL CONDITION SCORE (0 - 100)
 * Evaluates structural frame, foundation design, seismic vulnerability,
 * active structural defects, and physical inspection recency.
 */
export function calculateStructuralScore(
  features: CivilHealthFeatures,
  factors: ContributingFactor[]
): number {
  let score = 100.0;
  const lf = features.lifecycle;
  const def = features.defects;
  const insp = features.inspections;

  // Frame & foundation evidence
  if (!lf.frameType || lf.frameType.trim().length === 0 || lf.frameType.toLowerCase() === "unknown") {
    score -= 15.0;
    factors.push({ category: "structural", factor: "Unspecified structural frame type", impact: -15 });
  } else {
    factors.push({ category: "structural", factor: `Documented frame: ${lf.frameType}`, impact: 5 });
  }

  if (!lf.foundation || lf.foundation.trim().length === 0 || lf.foundation.toLowerCase() === "unknown") {
    score -= 15.0;
    factors.push({ category: "structural", factor: "Unspecified foundation specification", impact: -15 });
  }

  // Seismic risk factor in high seismic zones
  const isHighSeismic = Boolean(
    lf.seismicZone &&
    (lf.seismicZone.includes("IV") || lf.seismicZone.includes("V") || lf.seismicZone.includes("4") || lf.seismicZone.includes("5"))
  );
  if (isHighSeismic) {
    const hasDuctileDetailing = /shear|dual|moment|composite|ductile/i.test(lf.frameType || "");
    if (!hasDuctileDetailing) {
      score -= 10.0;
      factors.push({ category: "structural", factor: "High seismic zone without explicit ductile frame detailing", impact: -10 });
    }
  }

  // Active structural defect burden
  const structuralDefectCount = Object.entries(def.categoryDistribution)
    .filter(([cat]) => /structural|foundation|column|beam|slab|crack/i.test(cat))
    .reduce((sum, [, count]) => sum + count, 0);

  if (def.unresolvedCriticalCount > 0) {
    const deduction = def.unresolvedCriticalCount * 25.0;
    score -= deduction;
    factors.push({ category: "structural", factor: `${def.unresolvedCriticalCount} unresolved critical structural defect(s)`, impact: -deduction });
  } else if (def.unresolvedHighCount > 0) {
    const deduction = def.unresolvedHighCount * 12.0;
    score -= deduction;
    factors.push({ category: "structural", factor: `${def.unresolvedHighCount} unresolved high-severity defect(s)`, impact: -deduction });
  } else if (structuralDefectCount > 0 && def.unresolvedCount > 0) {
    score -= 5.0;
    factors.push({ category: "structural", factor: "Active low/medium structural defect(s) pending remediation", impact: -5 });
  }

  // Inspection recency for structural oversight
  if (insp.totalInspections === 0) {
    score -= 15.0;
    factors.push({ category: "structural", factor: "No certified structural inspection recorded on file", impact: -15 });
  } else if (insp.daysSinceLastInspection !== null && insp.daysSinceLastInspection > 730) {
    score -= 10.0;
    factors.push({ category: "structural", factor: "Last structural inspection exceeded 2 years ago", impact: -10 });
  }

  return round2(clamp(score));
}

/**
 * 2. DEFECT BURDEN SCORE (0 - 100)
 * Evaluates active defect load penalized monotonically by severity,
 * with credits for verified defect remediation velocity.
 */
export function calculateDefectBurdenScore(
  features: CivilHealthFeatures,
  factors: ContributingFactor[]
): number {
  let score = 100.0;
  const def = features.defects;

  if (def.totalDefects === 0) {
    factors.push({ category: "defect_burden", factor: "Zero defects on record across building lifecycle", impact: 10 });
    return 100.0;
  }

  // Monotonic deductions for unresolved defect burdens
  const criticalDeduction = def.unresolvedCriticalCount * 25.0;
  const highDeduction = def.unresolvedHighCount * 12.0;
  const mediumDeduction = (def.openCount + def.inReviewCount - def.unresolvedCriticalCount - def.unresolvedHighCount) > 0
    ? Math.min(25.0, (def.openCount + def.inReviewCount - def.unresolvedCriticalCount - def.unresolvedHighCount) * 5.0)
    : 0.0;

  const totalDeduction = criticalDeduction + highDeduction + mediumDeduction;
  score -= totalDeduction;

  if (def.unresolvedCriticalCount > 0) {
    factors.push({ category: "defect_burden", factor: `Critical defect deduction (-25 per item)`, impact: -criticalDeduction });
  }
  if (def.unresolvedHighCount > 0) {
    factors.push({ category: "defect_burden", factor: `High-severity defect deduction (-12 per item)`, impact: -highDeduction });
  }

  // Remediation closure rewards
  if (def.defectClosureRate !== null && def.defectClosureRate >= 0.8 && def.unresolvedCount === 0) {
    factors.push({ category: "defect_burden", factor: `100% defect remediation completed (${def.remediatedCount + def.closedCount} items closed)`, impact: 10 });
  } else if (def.defectClosureRate !== null && def.defectClosureRate >= 0.5 && def.unresolvedCount > 0) {
    score += 5.0;
    factors.push({ category: "defect_burden", factor: `Active remediation progress (${Math.round(def.defectClosureRate * 100)}% resolved)`, impact: 5 });
  }

  // Unresolved defect ceiling: if any defect is active, score cannot be 100
  if (def.unresolvedCount > 0) {
    score = Math.min(95.0, score);
  }

  return round2(clamp(score));
}

/**
 * 3. MAINTENANCE SCORE (0 - 100)
 * Evaluates preventive and corrective maintenance frequency,
 * execution of capital repairs, and penalties for deferred maintenance.
 */
export function calculateMaintenanceScore(
  features: CivilHealthFeatures,
  factors: ContributingFactor[]
): number {
  const maint = features.maintenance;

  if (maint.totalMaintenanceRecords === 0) {
    factors.push({ category: "maintenance", factor: "No maintenance history on record (evidence baseline)", impact: -20 });
    return 60.0; // Neutral baseline reflecting lack of maintenance records
  }

  let score = 80.0;

  // Completed interventions
  if (maint.completedCount > 0) {
    score += 10.0;
    factors.push({ category: "maintenance", factor: `${maint.completedCount} completed maintenance repair(s) verified`, impact: 10 });
  }

  // Maintenance recency
  if (maint.daysSinceLastMaintenance !== null && maint.daysSinceLastMaintenance <= 365) {
    score += 10.0;
    factors.push({ category: "maintenance", factor: "Active maintenance intervention within the past year", impact: 10 });
  } else if (maint.daysSinceLastMaintenance !== null && maint.daysSinceLastMaintenance > 730) {
    score -= 10.0;
    factors.push({ category: "maintenance", factor: "Last recorded maintenance intervention exceeded 2 years", impact: -10 });
  }

  // Deferred maintenance penalties
  if (maint.deferredCount > 0) {
    const penalty = maint.deferredCount * 15.0;
    score -= penalty;
    factors.push({ category: "maintenance", factor: `${maint.deferredCount} deferred maintenance item(s) pending execution`, impact: -penalty });
  }

  // Warranty coverage credit
  if (maint.hasWarrantyCoverage) {
    score += 5.0;
    factors.push({ category: "maintenance", factor: "Active contractor warranty coverage on historical repairs", impact: 5 });
  }

  return round2(clamp(score));
}

/**
 * 4. FIRE & LIFE SAFETY SCORE (0 - 100)
 * Evaluates verified fire rating barriers and hazards.
 */
export function calculateSafetyScore(
  features: CivilHealthFeatures,
  factors: ContributingFactor[]
): number {
  let score = 80.0;
  const lf = features.lifecycle;
  const def = features.defects;

  // Fire rating barriers
  if (lf.fireRating && /2\s*hour|3\s*hour|4\s*hour|rated/i.test(lf.fireRating)) {
    score += 20.0;
    factors.push({ category: "safety", factor: `Documented fire barrier rating: ${lf.fireRating}`, impact: 20 });
  } else if (!lf.fireRating || lf.fireRating.trim().length === 0 || lf.fireRating.toLowerCase() === "unknown") {
    score -= 10.0;
    factors.push({ category: "safety", factor: "Unspecified fire barrier rating (evidence limitation)", impact: -10 });
  }

  // Safety hazards from defect records
  const safetyDefects = Object.entries(def.categoryDistribution)
    .filter(([cat]) => /fire|safety|electrical|gas|emergency|alarm/i.test(cat))
    .reduce((sum, [, count]) => sum + count, 0);

  if (safetyDefects > 0 && def.unresolvedCount > 0) {
    score -= 15.0;
    factors.push({ category: "safety", factor: "Active defect(s) affecting fire/life-safety services", impact: -15 });
  }

  return round2(clamp(score));
}

/**
 * 5. LIFECYCLE DEGRADATION SCORE (0 - 100)
 * Contextual engineering material aging curve based on structural typology design life.
 * Age alone never causes structural failure classification.
 */
export function calculateLifecycleScore(
  features: CivilHealthFeatures,
  factors: ContributingFactor[]
): number {
  const age = features.lifecycle.buildingAgeYears;

  if (age === null || age === undefined) {
    factors.push({ category: "lifecycle", factor: "Unrecorded construction date (baseline lifecycle estimate)", impact: 0 });
    return 70.0;
  }

  let score: number;
  if (age <= 5.0) {
    score = 100.0;
    factors.push({ category: "lifecycle", factor: `Early lifecycle phase (Age: ${age} years)`, impact: 10 });
  } else if (age <= 15.0) {
    score = 100.0 - (age - 5.0) * 1.5;
    factors.push({ category: "lifecycle", factor: `Normal operational lifecycle (Age: ${age} years)`, impact: 5 });
  } else if (age <= 30.0) {
    score = 85.0 - (age - 15.0) * 1.0;
    factors.push({ category: "lifecycle", factor: `Mature building lifecycle (Age: ${age} years)`, impact: -5 });
  } else {
    // Clamped floor at 40.0: Age alone never causes critical failure rating
    const reduction = Math.min(30.0, (age - 30.0) * 0.75);
    score = Math.max(40.0, 70.0 - reduction);
    factors.push({ category: "lifecycle", factor: `Extended service lifecycle (Age: ${age} years)`, impact: -15 });
  }

  return round2(clamp(score));
}

/**
 * 6. DOCUMENTATION & EVIDENCE QUALITY SCORE (0 - 100)
 * Measures availability of verified engineering archives.
 * Missing documentation indicates missing evidence, not physical defect.
 */
export function calculateDocumentationScore(
  features: CivilHealthFeatures,
  factors: ContributingFactor[]
): number {
  let score = 0.0;
  const doc = features.documentation;
  const insp = features.inspections;

  if (doc.hasBlueprint) {
    score += 25.0;
    factors.push({ category: "documentation", factor: "Architectural blueprints on record", impact: 10 });
  }
  if (doc.hasStructural) {
    score += 35.0;
    factors.push({ category: "documentation", factor: "Structural engineering drawings/calculations archived", impact: 15 });
  } else {
    factors.push({ category: "documentation", factor: "Missing structural engineering calculations or drawings", impact: -15 });
  }
  if (doc.hasPermit) {
    score += 25.0;
    factors.push({ category: "documentation", factor: "Municipal occupancy / building permits verified", impact: 10 });
  }
  if (doc.hasReport || insp.totalInspections > 0) {
    score += 15.0;
    factors.push({ category: "documentation", factor: "Formal inspection audit report on file", impact: 5 });
  }

  return round2(clamp(score));
}

/**
 * Maps Overall Score to Deterministic Civil Risk Level.
 * Bounded, continuous, non-overlapping thresholds.
 */
export function determineRiskLevel(overallScore: number): RiskLevel {
  if (overallScore >= 85.0) return "Low";
  if (overallScore >= 70.0) return "Moderate";
  if (overallScore >= 55.0) return "Elevated";
  if (overallScore >= 40.0) return "High";
  return "Critical";
}

/**
 * Generates Actionable, Non-Diagnostic Civil Engineering Recommendations.
 */
export function generateRecommendations(features: CivilHealthFeatures, overallScore: number): string[] {
  const recs: string[] = [];
  const def = features.defects;
  const maint = features.maintenance;
  const insp = features.inspections;
  const doc = features.documentation;

  if (def.unresolvedCriticalCount > 0) {
    recs.push("Immediate priority review of unresolved critical defects by a certified structural engineer.");
  }
  if (def.unresolvedHighCount > 0) {
    recs.push("Address open high-severity defect items with qualified contractor remediation.");
  }
  if (maint.deferredCount > 0) {
    recs.push("Review and schedule deferred maintenance items to prevent compounding building deterioration.");
  }
  if (insp.totalInspections === 0 || (insp.daysSinceLastInspection !== null && insp.daysSinceLastInspection > 365)) {
    recs.push("Schedule an annual physical civil condition inspection by an accredited civil inspector.");
  }
  if (!doc.hasStructural) {
    recs.push("Archive verified structural engineering design calculations in the digital passport.");
  }
  if (!doc.hasPermit) {
    recs.push("Upload municipal occupancy and building permits to complete compliance evidence.");
  }

  if (recs.length === 0) {
    if (overallScore >= 85.0) {
      recs.push("Maintain current routine inspection schedule and preventive maintenance protocols.");
    } else {
      recs.push("Continue periodic monitoring and preserve updated maintenance ledger records.");
    }
  }

  return recs;
}

/**
 * Generates Structured, Non-LLM Summary Explanation.
 */
export function generateSummaryExplanation(
  overallScore: number,
  riskLevel: RiskLevel,
  dataCompleteness: number,
  factors: ContributingFactor[]
): string {
  // Pick top 2 most significant negative and top 1 positive factors
  const negFactors = factors
    .filter((f) => f.impact < 0)
    .sort((a, b) => a.impact - b.impact)
    .slice(0, 2)
    .map((f) => f.factor);

  const posFactors = factors
    .filter((f) => f.impact > 0)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 1)
    .map((f) => f.factor);

  const highlightList = [...negFactors, ...posFactors];
  const highlightStr = highlightList.length > 0 ? ` Influenced by: ${highlightList.join("; ")}.` : "";

  return (
    `Assessment synthesized using ${MODEL_VERSION} deterministic civil engine. ` +
    `Overall building health score is ${overallScore}/100 representing ${riskLevel} risk tier.${highlightStr} ` +
    `Evidence completeness is ${dataCompleteness}%. ` +
    `Notice: This automated assessment provides algorithmic decision support and does not replace a certified civil engineer's physical inspection.`
  );
}

/**
 * PURE FUNCTION: Calculates deterministic civil health assessment from features.
 * Operates with ZERO database calls, ZERO network calls, and ZERO randomness.
 */
export function calculateHealthAssessment(features: CivilHealthFeatures): HealthAssessmentCalculation {
  const factors: ContributingFactor[] = [];

  // 1. Calculate category scores (0 - 100 each)
  const structural = calculateStructuralScore(features, factors);
  const defectBurden = calculateDefectBurdenScore(features, factors);
  const maintenance = calculateMaintenanceScore(features, factors);
  const safety = calculateSafetyScore(features, factors);
  const lifecycle = calculateLifecycleScore(features, factors);
  const documentation = calculateDocumentationScore(features, factors);

  const categoryScores: CategoryScores = {
    structural,
    defectBurden,
    maintenance,
    safety,
    lifecycle,
    documentation,
  };

  // 2. Weighted overall score calculation
  const rawScore =
    structural * CATEGORY_WEIGHTS.structural +
    defectBurden * CATEGORY_WEIGHTS.defectBurden +
    maintenance * CATEGORY_WEIGHTS.maintenance +
    safety * CATEGORY_WEIGHTS.safety +
    lifecycle * CATEGORY_WEIGHTS.lifecycle +
    documentation * CATEGORY_WEIGHTS.documentation;

  const overallScore = round2(clamp(rawScore));

  // 3. Determine risk level
  const riskLevel = determineRiskLevel(overallScore);

  // 4. Data completeness from features (never independently recalculated)
  const dataCompletenessScore = features.dataQuality.dataCompletenessScore;

  // 5. Recommendations
  const recommendations = generateRecommendations(features, overallScore);

  // 6. Summary explanation
  const summaryExplanation = generateSummaryExplanation(
    overallScore,
    riskLevel,
    dataCompletenessScore,
    factors
  );

  return {
    buildingId: features.buildingId,
    passportId: features.passportId,
    overallScore,
    riskLevel,
    categoryScores,
    contributingFactors: factors,
    recommendations,
    dataCompletenessScore,
    modelVersion: MODEL_VERSION,
    engineType: ENGINE_TYPE,
    summaryExplanation,
  };
}

