import {
  BuildingRuleInput,
  ConstructionRule,
  RuleResult,
} from "./types";

/**
 * Calculates building age in fractional years from a construction date string.
 * Deterministic with given referenceDate.
 */
function getBuildingAgeYears(
  constructionDate: string | null | undefined,
  refDate: Date
): number | null {
  if (!constructionDate) return null;
  const d = new Date(constructionDate);
  if (isNaN(d.getTime())) return null;
  const diffMs = refDate.getTime() - d.getTime();
  if (diffMs < 0) return 0.0;
  return Math.round((diffMs / (1000 * 60 * 60 * 24 * 365.25)) * 100) / 100;
}

/**
 * Calculates elapsed days between two dates deterministically.
 */
function getElapsedDays(
  targetDate: Date | string | null | undefined,
  refDate: Date
): number | null {
  if (!targetDate) return null;
  const d = targetDate instanceof Date ? targetDate : new Date(targetDate);
  if (isNaN(d.getTime())) return null;
  const diffMs = refDate.getTime() - d.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Normalizes reference date input.
 */
function resolveReferenceDate(ref?: string | Date): Date {
  if (!ref) return new Date("2026-10-02T00:00:00.000Z");
  if (ref instanceof Date) return ref;
  const d = new Date(ref);
  return isNaN(d.getTime()) ? new Date("2026-10-02T00:00:00.000Z") : d;
}

// =============================================================================
// STRUCTURAL CATEGORY RULES
// =============================================================================

export const ruleStructuralFrame: ConstructionRule = {
  id: "STR-001",
  name: "Structural Framing System Definition",
  category: "STRUCTURAL",
  severity: "high",
  description:
    "Verifies that a structural framing system (e.g. RCC Moment Frame, Shear Wall, Steel Composite) is specified in the civil registry.",
  evaluate: (input: BuildingRuleInput): RuleResult => {
    const frame = input.building?.structuralInfo?.frameType?.trim();
    if (!frame || /^(unknown|unspecified|n\/a|none)$/i.test(frame)) {
      return {
        ruleId: "STR-001",
        ruleName: "Structural Framing System Definition",
        category: "STRUCTURAL",
        severity: "high",
        status: "FAIL",
        message: "Structural framing system is undefined or marked as unknown in building specifications.",
        correctiveAction:
          "Specify the verified primary load-bearing system (e.g., RCC Special Moment Resisting Frame, Shear Wall System, Steel Composite).",
      };
    }
    return {
      ruleId: "STR-001",
      ruleName: "Structural Framing System Definition",
      category: "STRUCTURAL",
      severity: "high",
      status: "PASS",
      message: `Verified structural framing system: ${frame}.`,
      evidence: `Frame system: ${frame}`,
    };
  },
};

export const ruleSubstructureFoundation: ConstructionRule = {
  id: "STR-002",
  name: "Sub-Structure Foundation Specification",
  category: "STRUCTURAL",
  severity: "high",
  description:
    "Verifies that a recognized sub-structure foundation type (e.g. Raft, Friction Piles, Isolated Footings) is documented.",
  evaluate: (input: BuildingRuleInput): RuleResult => {
    const foundation = input.building?.structuralInfo?.foundation?.trim();
    if (!foundation || /^(unknown|unspecified|n\/a|none)$/i.test(foundation)) {
      return {
        ruleId: "STR-002",
        ruleName: "Sub-Structure Foundation Specification",
        category: "STRUCTURAL",
        severity: "high",
        status: "FAIL",
        message: "Sub-structure foundation system is not specified in the asset record.",
        correctiveAction:
          "Document the structural foundation system (e.g., Deep Cast-in-situ Friction Piles, Mat Slab, Isolated Footings).",
      };
    }
    return {
      ruleId: "STR-002",
      ruleName: "Sub-Structure Foundation Specification",
      category: "STRUCTURAL",
      severity: "high",
      status: "PASS",
      message: `Substructure foundation documented: ${foundation}.`,
      evidence: `Foundation: ${foundation}`,
    };
  },
};

export const ruleConcreteGrade: ConstructionRule = {
  id: "STR-003",
  name: "Concrete Compressive Strength Grade Specification",
  category: "STRUCTURAL",
  severity: "medium",
  description:
    "Verifies declaration of characteristic concrete compressive strength grade (e.g., M25, M30, M40, M50). Missing data is flagged as NOT_ASSESSED.",
  evaluate: (input: BuildingRuleInput): RuleResult => {
    const textPool = [
      input.building?.structuralInfo?.frameType || "",
      input.building?.structuralInfo?.foundation || "",
      input.building?.description || "",
      ...input.documents.map((d) => d.title),
    ].join(" ");

    const match = textPool.match(/\b(M-?[1-9][0-9])\b/i);
    if (!match) {
      return {
        ruleId: "STR-003",
        ruleName: "Concrete Compressive Strength Grade Specification",
        category: "STRUCTURAL",
        severity: "medium",
        status: "NOT_ASSESSED",
        message: "Concrete compressive strength grade is not documented in digital registry.",
        correctiveAction:
          "Upload structural design specification or laboratory core/cube compressive test report stating concrete grade (e.g., M25, M30, M40).",
      };
    }

    const grade = match[1].toUpperCase().replace("-", "");
    return {
      ruleId: "STR-003",
      ruleName: "Concrete Compressive Strength Grade Specification",
      category: "STRUCTURAL",
      severity: "medium",
      status: "PASS",
      message: `Specified concrete characteristic strength grade identified: ${grade}.`,
      evidence: `Concrete grade: ${grade}`,
    };
  },
};

export const ruleSeismicZoneCompatibility: ConstructionRule = {
  id: "STR-004",
  name: "Seismic Zone Engineering Compatibility",
  category: "STRUCTURAL",
  severity: "critical",
  description:
    "Checks seismic hazard zone classification and verifies ductile lateral framing or calculation dossiers for high-risk zones.",
  evaluate: (input: BuildingRuleInput): RuleResult => {
    const zone = input.building?.structuralInfo?.seismicZone?.trim();
    if (!zone || /^(unknown|unspecified|n\/a)$/i.test(zone)) {
      return {
        ruleId: "STR-004",
        ruleName: "Seismic Zone Engineering Compatibility",
        category: "STRUCTURAL",
        severity: "critical",
        status: "NOT_ASSESSED",
        message: "Seismic hazard zone classification is not recorded for this asset.",
        correctiveAction: "Record the regional seismic hazard zone classification (e.g., Zone II, Zone III, Zone IV, Zone V).",
      };
    }

    const isHighHazard = /zone\s*(iv|v|4|5)\b/i.test(zone);
    if (!isHighHazard) {
      return {
        ruleId: "STR-004",
        ruleName: "Seismic Zone Engineering Compatibility",
        category: "STRUCTURAL",
        severity: "critical",
        status: "PASS",
        message: `Seismic hazard classification recorded: ${zone} (moderate/low hazard envelope).`,
        evidence: `Seismic zone: ${zone}`,
      };
    }

    // For Zone IV/V, check for ductile / shear core framing or seismic calculation documentation
    const frame = (input.building?.structuralInfo?.frameType || "").toLowerCase();
    const hasDuctileOrShear =
      frame.includes("shear") ||
      frame.includes("moment") ||
      frame.includes("ductile") ||
      frame.includes("damper") ||
      frame.includes("composite");

    const hasSeismicDoc = input.documents.some((d) =>
      /seismic|structural|calculation|dossier/i.test(d.title)
    );

    if (hasDuctileOrShear || hasSeismicDoc) {
      return {
        ruleId: "STR-004",
        ruleName: "Seismic Zone Engineering Compatibility",
        category: "STRUCTURAL",
        severity: "critical",
        status: "PASS",
        message: `High seismic risk zone (${zone}) accommodated with lateral load resistance framing or verified engineering dossier.`,
        evidence: `Seismic zone: ${zone}, Framing: ${input.building.structuralInfo.frameType}`,
      };
    }

    return {
      ruleId: "STR-004",
      ruleName: "Seismic Zone Engineering Compatibility",
      category: "STRUCTURAL",
      severity: "critical",
      status: "WARNING",
      message: `Asset is located in high seismic risk zone (${zone}) without documented ductile framing or uploaded seismic calculation dossier.`,
      evidence: `Seismic zone: ${zone}`,
      correctiveAction:
        "Commission licensed structural engineering review and upload seismic lateral load analysis dossier.",
    };
  },
};

export const ruleStructuralDefects: ConstructionRule = {
  id: "STR-005",
  name: "Structural Defect Integrity & Absence of Critical Burden",
  category: "STRUCTURAL",
  severity: "critical",
  description:
    "Evaluates unresolved structural defects in the registry. Flags critical defects as FAIL and high severity defects as WARNING.",
  evaluate: (input: BuildingRuleInput): RuleResult => {
    const unresolved = input.defects.filter(
      (d) => d.status === "Open" || d.status === "In Review"
    );

    const structuralUnresolved = unresolved.filter(
      (d) =>
        /structural/i.test(d.category || "") ||
        /column|beam|slab|foundation|shear|joint|load/i.test(d.location || "")
    );

    const criticalDefects = structuralUnresolved.filter((d) => d.severity === "Critical");
    if (criticalDefects.length > 0) {
      const top = criticalDefects[0];
      return {
        ruleId: "STR-005",
        ruleName: "Structural Defect Integrity & Absence of Critical Burden",
        category: "STRUCTURAL",
        severity: "critical",
        status: "FAIL",
        message: `Critical unresolved structural defect detected: ${top.details} at ${top.location}.`,
        evidence: `Defect ID: ${top.defectId || top.id}, Severity: Critical, Status: ${top.status}`,
        correctiveAction:
          "Immediate licensed structural engineer intervention, structural shoring, and remedial works required.",
      };
    }

    const highDefects = structuralUnresolved.filter((d) => d.severity === "High");
    if (highDefects.length > 0) {
      const top = highDefects[0];
      return {
        ruleId: "STR-005",
        ruleName: "Structural Defect Integrity & Absence of Critical Burden",
        category: "STRUCTURAL",
        severity: "critical",
        status: "WARNING",
        message: `High severity unresolved structural defect detected: ${top.details} at ${top.location}.`,
        evidence: `Defect ID: ${top.defectId || top.id}, Severity: High, Status: ${top.status}`,
        correctiveAction:
          "Schedule priority engineering review and execute structural repairs.",
      };
    }

    return {
      ruleId: "STR-005",
      ruleName: "Structural Defect Integrity & Absence of Critical Burden",
      category: "STRUCTURAL",
      severity: "critical",
      status: "PASS",
      message: "No unresolved high or critical structural defects recorded in registry.",
      evidence: `Total defects: ${input.defects.length}, Unresolved structural: 0`,
    };
  },
};

// =============================================================================
// SAFETY CATEGORY RULES
// =============================================================================

export const ruleFireResistanceRating: ConstructionRule = {
  id: "SAF-001",
  name: "Passive Fire Resistance Rating Specification",
  category: "SAFETY",
  severity: "high",
  description:
    "Verifies documented compartmentation fire resistance rating. Flags unrated multi-story structures.",
  evaluate: (input: BuildingRuleInput): RuleResult => {
    const rating = input.building?.structuralInfo?.fireRating?.trim();
    const floors = Number(input.building?.floors) || 0;
    const isHighRise = floors >= 5;

    if (!rating || /^(unrated|unknown|unspecified|none|n\/a)$/i.test(rating)) {
      if (isHighRise) {
        return {
          ruleId: "SAF-001",
          ruleName: "Passive Fire Resistance Rating Specification",
          category: "SAFETY",
          severity: "high",
          status: "FAIL",
          message: `Multi-story structure (${floors} floors) lacks declared passive fire resistance rating.`,
          correctiveAction:
            "Conduct fire compartmentation assessment and document fire resistance rating (e.g. 2-Hour or 3-Hour Fire Rated Barriers).",
        };
      }
      return {
        ruleId: "SAF-001",
        ruleName: "Passive Fire Resistance Rating Specification",
        category: "SAFETY",
        severity: "high",
        status: "WARNING",
        message: "Passive fire resistance rating is not declared in building parameters.",
        correctiveAction: "Specify fire barrier ratings for structural partitions and floor slabs.",
      };
    }

    return {
      ruleId: "SAF-001",
      ruleName: "Passive Fire Resistance Rating Specification",
      category: "SAFETY",
      severity: "high",
      status: "PASS",
      message: `Passive fire resistance rating documented: ${rating}.`,
      evidence: `Fire rating: ${rating}`,
    };
  },
};

export const ruleFireSafetyCertificate: ConstructionRule = {
  id: "SAF-002",
  name: "Fire Safety & Life Safety NOC / Clearance Documentation",
  category: "SAFETY",
  severity: "high",
  description:
    "Verifies presence of statutory fire safety clearance, NOC, or occupancy certificate. Missing certificate is NOT treated as PASS.",
  evaluate: (input: BuildingRuleInput): RuleResult => {
    const fireDoc = input.documents.find(
      (d) =>
        d.documentType === "permit" ||
        /fire|noc|life\s*safety|occupancy/i.test(d.title) ||
        /fire|noc|occupancy/i.test(d.originalFilename)
    );

    if (fireDoc) {
      return {
        ruleId: "SAF-002",
        ruleName: "Fire Safety & Life Safety NOC / Clearance Documentation",
        category: "SAFETY",
        severity: "high",
        status: "PASS",
        message: `Fire safety / occupancy documentation verified: "${fireDoc.title}".`,
        evidence: `Document: ${fireDoc.title} (${fireDoc.documentId || fireDoc.id})`,
      };
    }

    const floors = Number(input.building?.floors) || 0;
    const isCommercialOrHighRise =
      floors >= 5 || /commercial|institutional/i.test(input.building?.type || "");

    if (isCommercialOrHighRise) {
      return {
        ruleId: "SAF-002",
        ruleName: "Fire Safety & Life Safety NOC / Clearance Documentation",
        category: "SAFETY",
        severity: "high",
        status: "WARNING",
        message:
          "Fire Safety No-Objection Certificate (NOC) or Occupancy Permit not filed for multi-story/commercial asset.",
        correctiveAction:
          "Upload valid municipal Fire Department No-Objection Certificate (NOC) or statutory Occupancy Certificate.",
      };
    }

    return {
      ruleId: "SAF-002",
      ruleName: "Fire Safety & Life Safety NOC / Clearance Documentation",
      category: "SAFETY",
      severity: "high",
      status: "NOT_ASSESSED",
      message: "Fire safety statutory certificate has not been filed in digital document repository.",
      correctiveAction:
        "Upload local authority fire safety compliance certificate or sanction document.",
    };
  },
};

// =============================================================================
// DOCUMENTATION CATEGORY RULES
// =============================================================================

export const ruleArchitecturalMasterPlans: ConstructionRule = {
  id: "DOC-001",
  name: "Approved Architectural Master Blueprint Documentation",
  category: "DOCUMENTATION",
  severity: "medium",
  description:
    "Checks if sanctioned architectural master plans or blueprints are recorded in the repository.",
  evaluate: (input: BuildingRuleInput): RuleResult => {
    const planDoc = input.documents.find(
      (d) =>
        d.documentType === "blueprint" ||
        /blueprint|architectural|master\s*plan|floor\s*plan/i.test(d.title) ||
        /plan|drawings/i.test(d.originalFilename)
    );

    if (planDoc) {
      return {
        ruleId: "DOC-001",
        ruleName: "Approved Architectural Master Blueprint Documentation",
        category: "DOCUMENTATION",
        severity: "medium",
        status: "PASS",
        message: `Approved architectural drawings on file: "${planDoc.title}".`,
        evidence: `Document: ${planDoc.title}`,
      };
    }

    return {
      ruleId: "DOC-001",
      ruleName: "Approved Architectural Master Blueprint Documentation",
      category: "DOCUMENTATION",
      severity: "medium",
      status: "WARNING",
      message: "Sanctioned architectural master plans or blueprints have not been uploaded.",
      correctiveAction:
        "Upload municipal-approved architectural master drawings in PDF or CAD format.",
    };
  },
};

export const ruleStructuralCalculationDossier: ConstructionRule = {
  id: "DOC-002",
  name: "Structural Engineering Calculation Dossier",
  category: "DOCUMENTATION",
  severity: "medium",
  description:
    "Checks for certified structural design calculation dossier or as-built structural drawings.",
  evaluate: (input: BuildingRuleInput): RuleResult => {
    const structDoc = input.documents.find(
      (d) =>
        d.documentType === "structural" ||
        /structural|calculation|seismic|dossier/i.test(d.title) ||
        /structural/i.test(d.originalFilename)
    );

    if (structDoc) {
      return {
        ruleId: "DOC-002",
        ruleName: "Structural Engineering Calculation Dossier",
        category: "DOCUMENTATION",
        severity: "medium",
        status: "PASS",
        message: `Structural engineering documentation verified: "${structDoc.title}".`,
        evidence: `Document: ${structDoc.title}`,
      };
    }

    return {
      ruleId: "DOC-002",
      ruleName: "Structural Engineering Calculation Dossier",
      category: "DOCUMENTATION",
      severity: "medium",
      status: "WARNING",
      message: "Certified structural calculation dossier or as-built reinforcement drawings not uploaded.",
      correctiveAction:
        "Upload structural engineer's calculation report, design notes, and as-built rebar details.",
    };
  },
};

export const ruleGeotechnicalInvestigation: ConstructionRule = {
  id: "DOC-003",
  name: "Geotechnical & Soil Bearing Capacity Investigation",
  category: "DOCUMENTATION",
  severity: "low",
  description:
    "Verifies availability of sub-soil investigation report or bearing capacity data. Missing data is NOT_ASSESSED.",
  evaluate: (input: BuildingRuleInput): RuleResult => {
    const geoDoc = input.documents.find(
      (d) =>
        /geotechnical|soil|borehole|strata|bearing\s*capacity/i.test(d.title) ||
        /soil|geotech/i.test(d.originalFilename)
    );

    const descMentionsGeo = /geotechnical|soil\s*strata|borehole|bearing\s*capacity/i.test(
      input.building?.description || ""
    );

    if (geoDoc || descMentionsGeo) {
      return {
        ruleId: "DOC-003",
        ruleName: "Geotechnical & Soil Bearing Capacity Investigation",
        category: "DOCUMENTATION",
        severity: "low",
        status: "PASS",
        message: geoDoc
          ? `Geotechnical soil investigation report on file: "${geoDoc.title}".`
          : "Subsoil bearing capacity parameters documented in asset description.",
        evidence: geoDoc ? `Document: ${geoDoc.title}` : "Recorded in civil description",
      };
    }

    return {
      ruleId: "DOC-003",
      ruleName: "Geotechnical & Soil Bearing Capacity Investigation",
      category: "DOCUMENTATION",
      severity: "low",
      status: "NOT_ASSESSED",
      message: "Geotechnical borehole investigation report is not filed in digital repository.",
      correctiveAction:
        "Upload sub-soil investigation report detailing standard penetration tests (SPT) and safe bearing capacity.",
    };
  },
};

// =============================================================================
// MAINTENANCE CATEGORY RULES
// =============================================================================

export const ruleStructuralAuditCadence: ConstructionRule = {
  id: "MNT-001",
  name: "Periodic Structural Inspection Cadence",
  category: "MAINTENANCE",
  severity: "high",
  description:
    "Evaluates structural audit frequency. Assets older than 5 years require an inspection within the last 24 months (730 days).",
  evaluate: (input: BuildingRuleInput): RuleResult => {
    const refDate = resolveReferenceDate(input.referenceDate);
    const age = getBuildingAgeYears(input.building?.constructionDate, refDate);

    if (age === null) {
      return {
        ruleId: "MNT-001",
        ruleName: "Periodic Structural Inspection Cadence",
        category: "MAINTENANCE",
        severity: "high",
        status: "NOT_ASSESSED",
        message: "Construction year/date is missing or invalid; inspection cadence cannot be determined.",
        correctiveAction: "Record valid construction completion year/date.",
      };
    }

    if (input.inspections.length === 0) {
      if (age > 5) {
        return {
          ruleId: "MNT-001",
          ruleName: "Periodic Structural Inspection Cadence",
          category: "MAINTENANCE",
          severity: "high",
          status: "WARNING",
          message: `Asset age is ${age.toFixed(1)} years with zero formal inspection audits recorded.`,
          correctiveAction: "Commission comprehensive baseline structural health audit.",
        };
      }
      return {
        ruleId: "MNT-001",
        ruleName: "Periodic Structural Inspection Cadence",
        category: "MAINTENANCE",
        severity: "high",
        status: "PASS",
        message: `Asset is within initial 5-year post-construction window (${age.toFixed(1)} years old).`,
        evidence: `Building age: ${age.toFixed(1)} years`,
      };
    }

    // Inspect most recent inspection date
    const sorted = [...input.inspections].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latest = sorted[0];
    const elapsedDays = getElapsedDays(latest.date, refDate);

    if (elapsedDays !== null && elapsedDays > 730) {
      const elapsedMonths = Math.floor(elapsedDays / 30);
      return {
        ruleId: "MNT-001",
        ruleName: "Periodic Structural Inspection Cadence",
        category: "MAINTENANCE",
        severity: "high",
        status: "WARNING",
        message: `Last recorded structural audit was ${elapsedMonths} months ago (exceeds 24-month audit cadence).`,
        evidence: `Last inspection: ${latest.date} (${elapsedDays} days ago)`,
        correctiveAction: "Schedule mandatory biennial structural inspection audit.",
      };
    }

    return {
      ruleId: "MNT-001",
      ruleName: "Periodic Structural Inspection Cadence",
      category: "MAINTENANCE",
      severity: "high",
      status: "PASS",
      message: `Inspection audit is current (${elapsedDays !== null ? Math.floor(elapsedDays / 30) : 0} months since last audit).`,
      evidence: `Last inspection: ${latest.date}`,
    };
  },
};

export const ruleMaintenanceServiceContinuity: ConstructionRule = {
  id: "MNT-002",
  name: "Maintenance Service Continuity & Operational Work Orders",
  category: "MAINTENANCE",
  severity: "medium",
  description:
    "Verifies maintenance continuity and checks that declared maintenance status is not overdue.",
  evaluate: (input: BuildingRuleInput): RuleResult => {
    const status = input.building?.maintenanceStatus || "Unknown";
    const isOverdue = /due|overdue|deferred/i.test(status);

    if (isOverdue) {
      return {
        ruleId: "MNT-002",
        ruleName: "Maintenance Service Continuity & Operational Work Orders",
        category: "MAINTENANCE",
        severity: "medium",
        status: "WARNING",
        message: `Declared maintenance status is "${status}". Operational maintenance works are overdue.`,
        evidence: `Maintenance status: ${status}`,
        correctiveAction:
          "Execute overdue maintenance work orders and update digital maintenance log.",
      };
    }

    if (input.maintenance.length > 0) {
      return {
        ruleId: "MNT-002",
        ruleName: "Maintenance Service Continuity & Operational Work Orders",
        category: "MAINTENANCE",
        severity: "medium",
        status: "PASS",
        message: `Maintenance service continuity confirmed with ${input.maintenance.length} documented service orders.`,
        evidence: `Total maintenance records: ${input.maintenance.length}, Status: ${status}`,
      };
    }

    const refDate = resolveReferenceDate(input.referenceDate);
    const age = getBuildingAgeYears(input.building?.constructionDate, refDate);

    if (age !== null && age > 3) {
      return {
        ruleId: "MNT-002",
        ruleName: "Maintenance Service Continuity & Operational Work Orders",
        category: "MAINTENANCE",
        severity: "medium",
        status: "WARNING",
        message: `Asset is ${age.toFixed(1)} years old with no service maintenance records logged.`,
        correctiveAction: "Record routine civil and MEP maintenance logs.",
      };
    }

    return {
      ruleId: "MNT-002",
      ruleName: "Maintenance Service Continuity & Operational Work Orders",
      category: "MAINTENANCE",
      severity: "medium",
      status: "NOT_ASSESSED",
      message: "No routine maintenance records logged yet for newly constructed asset.",
      correctiveAction: "Establish periodic preventative maintenance schedule.",
    };
  },
};

// =============================================================================
// LIFECYCLE CATEGORY RULES
// =============================================================================

export const ruleAssetAgingCondition: ConstructionRule = {
  id: "LIF-001",
  name: "Construction Age & Structural Condition Alignment",
  category: "LIFECYCLE",
  severity: "high",
  description:
    "Evaluates declared building condition against asset operational age. Identifies critical deterioration or aged unmonitored structures.",
  evaluate: (input: BuildingRuleInput): RuleResult => {
    const refDate = resolveReferenceDate(input.referenceDate);
    const age = getBuildingAgeYears(input.building?.constructionDate, refDate);
    const condition = input.building?.condition || "Unknown";

    if (age === null) {
      return {
        ruleId: "LIF-001",
        ruleName: "Construction Age & Structural Condition Alignment",
        category: "LIFECYCLE",
        severity: "high",
        status: "NOT_ASSESSED",
        message: "Construction year/date is missing or invalid.",
        correctiveAction: "Declare valid construction year.",
      };
    }

    if (/critical|poor/i.test(condition)) {
      return {
        ruleId: "LIF-001",
        ruleName: "Construction Age & Structural Condition Alignment",
        category: "LIFECYCLE",
        severity: "high",
        status: "FAIL",
        message: `Asset declared condition is "${condition}" at age ${age.toFixed(1)} years. Comprehensive structural appraisal required.`,
        evidence: `Condition: ${condition}, Age: ${age.toFixed(1)} years`,
        correctiveAction:
          "Commission emergency civil structural appraisal and implement structural reinforcement.",
      };
    }

    if (age > 30 && /fair/i.test(condition)) {
      return {
        ruleId: "LIF-001",
        ruleName: "Construction Age & Structural Condition Alignment",
        category: "LIFECYCLE",
        severity: "high",
        status: "WARNING",
        message: `Asset operational age is ${age.toFixed(1)} years with "Fair" condition rating. Heightened degradation risk.`,
        evidence: `Age: ${age.toFixed(1)} years, Condition: ${condition}`,
        correctiveAction:
          "Conduct non-destructive testing (UPV, carbonation, rebound hammer) and establish life extension maintenance program.",
      };
    }

    return {
      ruleId: "LIF-001",
      ruleName: "Construction Age & Structural Condition Alignment",
      category: "LIFECYCLE",
      severity: "high",
      status: "PASS",
      message: `Asset condition "${condition}" aligns with operational lifecycle age (${age.toFixed(1)} years).`,
      evidence: `Age: ${age.toFixed(1)} years, Condition: ${condition}`,
    };
  },
};

export const ruleBuildingEnvelopeDurability: ConstructionRule = {
  id: "LIF-002",
  name: "Building Envelope & Facade Weatherproofing Durability",
  category: "LIFECYCLE",
  severity: "medium",
  description:
    "Verifies facade/cladding specification and evaluates active water seepage or facade anchorage defects.",
  evaluate: (input: BuildingRuleInput): RuleResult => {
    const cladding = input.building?.structuralInfo?.exteriorCladding?.trim();
    if (!cladding || /^(unknown|unspecified|none|n\/a)$/i.test(cladding)) {
      return {
        ruleId: "LIF-002",
        ruleName: "Building Envelope & Facade Weatherproofing Durability",
        category: "LIFECYCLE",
        severity: "medium",
        status: "NOT_ASSESSED",
        message: "Exterior cladding / envelope specification is not recorded.",
        correctiveAction:
          "Document exterior envelope material (e.g. Unitized Curtain Wall, Ventilated Rainscreen, Elastomeric Render).",
      };
    }

    const activeEnvelopeDefect = input.defects.find(
      (d) =>
        (d.status === "Open" || d.status === "In Review") &&
        (/waterproofing|seepage|facade|cladding|envelope/i.test(d.category || "") ||
          /terrace|parapet|facade|bracket|curtain/i.test(d.location || "")) &&
        (d.severity === "High" || d.severity === "Critical")
    );

    if (activeEnvelopeDefect) {
      return {
        ruleId: "LIF-002",
        ruleName: "Building Envelope & Facade Weatherproofing Durability",
        category: "LIFECYCLE",
        severity: "medium",
        status: "WARNING",
        message: `Active envelope defect observed: ${activeEnvelopeDefect.details} (${activeEnvelopeDefect.location}).`,
        evidence: `Defect ID: ${activeEnvelopeDefect.defectId || activeEnvelopeDefect.id}, Severity: ${activeEnvelopeDefect.severity}`,
        correctiveAction:
          "Execute weatherproofing remediation and fastener integrity restoration.",
      };
    }

    return {
      ruleId: "LIF-002",
      ruleName: "Building Envelope & Facade Weatherproofing Durability",
      category: "LIFECYCLE",
      severity: "medium",
      status: "PASS",
      message: `Building envelope specified (${cladding}) with zero active high/critical envelope defects.`,
      evidence: `Cladding: ${cladding}`,
    };
  },
};

// =============================================================================
// OCCUPANCY CATEGORY RULES
// =============================================================================

export const ruleSpatialCapacityConsistency: ConstructionRule = {
  id: "OCC-001",
  name: "Spatial Capacity & Geometric Parameter Consistency",
  category: "OCCUPANCY",
  severity: "medium",
  description:
    "Verifies internal consistency between floors, units, total built-up area, and asset usage.",
  evaluate: (input: BuildingRuleInput): RuleResult => {
    const floors = Number(input.building?.floors) || 0;
    const units = Number(input.building?.units) || 0;
    const area = input.building?.totalArea?.trim() || "";
    const usage = input.building?.usage?.trim() || "";

    if (floors <= 0 || units <= 0 || !area) {
      return {
        ruleId: "OCC-001",
        ruleName: "Spatial Capacity & Geometric Parameter Consistency",
        category: "OCCUPANCY",
        severity: "medium",
        status: "FAIL",
        message: "Invalid spatial geometry: floors, units, or total built-up area are non-positive or undefined.",
        evidence: `Floors: ${floors}, Units: ${units}, Total Area: "${area}"`,
        correctiveAction:
          "Verify and record positive numeric values for total floors, units, and total built-up area.",
      };
    }

    return {
      ruleId: "OCC-001",
      ruleName: "Spatial Capacity & Geometric Parameter Consistency",
      category: "OCCUPANCY",
      severity: "medium",
      status: "PASS",
      message: `Spatial capacity verified: ${floors} floors, ${units} units, ${area} area (${usage}).`,
      evidence: `Floors: ${floors}, Units: ${units}, Total Area: ${area}, Usage: ${usage}`,
    };
  },
};

/**
 * Standard collection of all active rules for version 1.0.
 */
export const ALL_RULES: readonly ConstructionRule[] = Object.freeze([
  ruleStructuralFrame,
  ruleSubstructureFoundation,
  ruleConcreteGrade,
  ruleSeismicZoneCompatibility,
  ruleStructuralDefects,
  ruleFireResistanceRating,
  ruleFireSafetyCertificate,
  ruleArchitecturalMasterPlans,
  ruleStructuralCalculationDossier,
  ruleGeotechnicalInvestigation,
  ruleStructuralAuditCadence,
  ruleMaintenanceServiceContinuity,
  ruleAssetAgingCondition,
  ruleBuildingEnvelopeDurability,
  ruleSpatialCapacityConsistency,
]);
