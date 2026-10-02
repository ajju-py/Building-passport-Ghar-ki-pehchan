import { ConstructionRule, RuleCategory } from "./types";
import { ALL_RULES } from "./rules";

export const RULE_SET_VERSION = "construction-rules-v1.0";

export class RuleRegistry {
  private rules: Map<string, ConstructionRule> = new Map();

  constructor(initialRules: readonly ConstructionRule[] = ALL_RULES) {
    for (const rule of initialRules) {
      this.register(rule);
    }
  }

  public register(rule: ConstructionRule): void {
    if (!rule.id || !rule.name || !rule.category || typeof rule.evaluate !== "function") {
      throw new Error(`Invalid rule definition: ${JSON.stringify(rule)}`);
    }
    this.rules.set(rule.id, rule);
  }

  public getRule(id: string): ConstructionRule | undefined {
    return this.rules.get(id);
  }

  public getAllRules(): ConstructionRule[] {
    return Array.from(this.rules.values());
  }

  public getRulesByCategory(category: RuleCategory): ConstructionRule[] {
    return this.getAllRules().filter((r) => r.category === category);
  }

  public getRuleCount(): number {
    return this.rules.size;
  }
}

// Singleton default registry
export const defaultRegistry = new RuleRegistry();
