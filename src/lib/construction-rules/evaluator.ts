import {
  BuildingComplianceEvaluation,
  BuildingRuleInput,
  CategorySummary,
  ComplianceSummary,
  RequiredAction,
  RuleCategory,
  RuleResult,
} from "./types";
import { defaultRegistry, RuleRegistry, RULE_SET_VERSION } from "./registry";

export const STATUTORY_DISCLAIMER =
  "This assessment is a digital decision-support evaluation and does not replace statutory approval, licensed engineering inspection, or municipal certification.";

export function evaluateBuildingRules(
  input: BuildingRuleInput,
  registry: RuleRegistry = defaultRegistry
): BuildingComplianceEvaluation {
  const rules = registry.getAllRules();
  const results: RuleResult[] = [];

  let passCount = 0;
  let warningCount = 0;
  let failCount = 0;
  let notAssessedCount = 0;

  const categoryBreakdown: Record<RuleCategory, CategorySummary> = {
    STRUCTURAL: { total: 0, pass: 0, warning: 0, fail: 0, notAssessed: 0 },
    SAFETY: { total: 0, pass: 0, warning: 0, fail: 0, notAssessed: 0 },
    DOCUMENTATION: { total: 0, pass: 0, warning: 0, fail: 0, notAssessed: 0 },
    MAINTENANCE: { total: 0, pass: 0, warning: 0, fail: 0, notAssessed: 0 },
    LIFECYCLE: { total: 0, pass: 0, warning: 0, fail: 0, notAssessed: 0 },
    OCCUPANCY: { total: 0, pass: 0, warning: 0, fail: 0, notAssessed: 0 },
  };

  const requiredActions: RequiredAction[] = [];

  for (const rule of rules) {
    const result = rule.evaluate(input);
    results.push(result);

    const cat = categoryBreakdown[rule.category] || {
      total: 0,
      pass: 0,
      warning: 0,
      fail: 0,
      notAssessed: 0,
    };
    cat.total++;

    switch (result.status) {
      case "PASS":
        passCount++;
        cat.pass++;
        break;
      case "WARNING":
        warningCount++;
        cat.warning++;
        if (result.correctiveAction) {
          requiredActions.push({
            ruleId: result.ruleId,
            ruleName: result.ruleName,
            category: result.category,
            severity: result.severity,
            status: "WARNING",
            action: result.correctiveAction,
            reason: result.message,
          });
        }
        break;
      case "FAIL":
        failCount++;
        cat.fail++;
        if (result.correctiveAction) {
          requiredActions.push({
            ruleId: result.ruleId,
            ruleName: result.ruleName,
            category: result.category,
            severity: result.severity,
            status: "FAIL",
            action: result.correctiveAction,
            reason: result.message,
          });
        }
        break;
      case "NOT_ASSESSED":
        notAssessedCount++;
        cat.notAssessed++;
        if (result.correctiveAction) {
          requiredActions.push({
            ruleId: result.ruleId,
            ruleName: result.ruleName,
            category: result.category,
            severity: result.severity,
            status: "NOT_ASSESSED",
            action: result.correctiveAction,
            reason: result.message,
          });
        }
        break;
    }
  }

  // Calculate compliance score based on assessed rules (PASS vs assessed total)
  const assessedCount = passCount + warningCount + failCount;
  const complianceScore =
    assessedCount > 0
      ? Math.round(((passCount + 0.5 * warningCount) / assessedCount) * 10000) / 100
      : 0;

  const evaluatedAt =
    input.referenceDate instanceof Date
      ? input.referenceDate.toISOString()
      : typeof input.referenceDate === "string"
      ? input.referenceDate
      : new Date().toISOString();

  const summary: ComplianceSummary = {
    totalRules: rules.length,
    passCount,
    warningCount,
    failCount,
    notAssessedCount,
    complianceScore,
    categoryBreakdown,
    requiredActions,
    ruleSetVersion: RULE_SET_VERSION,
    evaluatedAt,
    disclaimer: STATUTORY_DISCLAIMER,
  };

  return {
    buildingId: input.building?.id || "",
    passportId: input.building?.passportId || "",
    summary,
    results,
  };
}
