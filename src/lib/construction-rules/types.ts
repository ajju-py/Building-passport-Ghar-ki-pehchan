import {
  BuildingRecord,
  InspectionRecord,
  DefectRecord,
  MaintenanceRecord,
  DocumentRecord,
  BuildingPhotograph,
} from "@/lib/types";

export type RuleCategory =
  | "STRUCTURAL"
  | "SAFETY"
  | "DOCUMENTATION"
  | "MAINTENANCE"
  | "LIFECYCLE"
  | "OCCUPANCY";

export type RuleStatus = "PASS" | "WARNING" | "FAIL" | "NOT_ASSESSED";

export type RuleSeverity = "critical" | "high" | "medium" | "low";

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: RuleSeverity;
  status: RuleStatus;
  message: string;
  evidence?: string;
  correctiveAction?: string;
}

export interface BuildingRuleInput {
  building: BuildingRecord;
  inspections: InspectionRecord[];
  defects: DefectRecord[];
  maintenance: MaintenanceRecord[];
  documents: DocumentRecord[];
  photographs: BuildingPhotograph[];
  referenceDate?: string | Date;
}

export interface ConstructionRule {
  id: string;
  name: string;
  category: RuleCategory;
  description: string;
  severity: RuleSeverity;
  evaluate: (input: BuildingRuleInput) => RuleResult;
}

export interface CategorySummary {
  total: number;
  pass: number;
  warning: number;
  fail: number;
  notAssessed: number;
}

export interface RequiredAction {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: RuleSeverity;
  status: "WARNING" | "FAIL" | "NOT_ASSESSED";
  action: string;
  reason: string;
}

export interface ComplianceSummary {
  totalRules: number;
  passCount: number;
  warningCount: number;
  failCount: number;
  notAssessedCount: number;
  complianceScore: number;
  categoryBreakdown: Record<RuleCategory, CategorySummary>;
  requiredActions: RequiredAction[];
  ruleSetVersion: string;
  evaluatedAt: string;
  disclaimer: string;
}

export interface BuildingComplianceEvaluation {
  buildingId: string;
  passportId: string;
  summary: ComplianceSummary;
  results: RuleResult[];
}
