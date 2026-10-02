"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Layers,
  Flame,
  FileText,
  Wrench,
  Clock,
  Home,
  AlertCircle,
  Filter,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  BuildingRecord,
  BuildingComplianceEvaluation,
  RuleCategory,
  RuleStatus,
} from "@/lib/types";

interface BuildingComplianceSectionProps {
  building: BuildingRecord;
}

const CATEGORY_CONFIG: Record<
  RuleCategory,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  STRUCTURAL: { label: "Structural", icon: Layers },
  SAFETY: { label: "Fire & Safety", icon: Flame },
  DOCUMENTATION: { label: "Documentation", icon: FileText },
  MAINTENANCE: { label: "Maintenance", icon: Wrench },
  LIFECYCLE: { label: "Lifecycle", icon: Clock },
  OCCUPANCY: { label: "Occupancy", icon: Home },
};

const STATUS_CONFIG: Record<
  RuleStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
  }
> = {
  PASS: {
    label: "PASS",
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  WARNING: {
    label: "WARNING",
    icon: AlertTriangle,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-300",
  },
  FAIL: {
    label: "FAIL",
    icon: XCircle,
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-300",
  },
  NOT_ASSESSED: {
    label: "NOT ASSESSED",
    icon: HelpCircle,
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    badgeBg: "bg-slate-100 text-slate-700 border-slate-300",
  },
};

export default function BuildingComplianceSection({
  building,
}: BuildingComplianceSectionProps) {
  const { user } = useAuth();
  const [evaluation, setEvaluation] = useState<BuildingComplianceEvaluation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await api.buildings.getConstructionRules(building.id);
      setEvaluation(data);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load construction compliance evaluation.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [building.id]);

  useEffect(() => {
    let ignore = false;

    async function fetchRules() {
      try {
        const data = await api.buildings.getConstructionRules(building.id);
        if (!ignore) {
          setEvaluation(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError((err as Error).message || "Failed to load construction compliance evaluation.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchRules();

    return () => {
      ignore = true;
    };
  }, [building.id, user]);

  const filteredRules = useMemo(() => {
    if (!evaluation) return [];
    return evaluation.results.filter((rule) => {
      const matchesCategory =
        selectedCategory === "ALL" || rule.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "ALL" || rule.status === selectedStatus;
      return matchesCategory && matchesStatus;
    });
  }, [evaluation, selectedCategory, selectedStatus]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-2xs">
        <div className="flex items-center space-x-3 text-slate-500 text-xs font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
          <span>Evaluating deterministic construction compliance rules...</span>
        </div>
        <div className="mt-6 space-y-4">
          <div className="h-24 bg-slate-100 rounded animate-pulse" />
          <div className="h-40 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
        <div className="flex items-start space-x-3 text-rose-800 bg-rose-50 border border-rose-200 rounded p-4 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-bold">Evaluation Inaccessible</p>
            <p className="mt-1 text-slate-700">{error}</p>
            <button
              onClick={() => loadData(true)}
              className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded text-[11px] font-semibold uppercase tracking-wider hover:bg-slate-800 transition-colors"
            >
              Retry Evaluation
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return null;
  }

  const { summary } = evaluation;

  return (
    <div className="space-y-6">
      {/* SECTION HEADER CARD */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Construction Rules & Compliance Engine
                </h2>
                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                  {summary.ruleSetVersion}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic rule evaluation for verified civil parameters and statutory data completeness.
              </p>
            </div>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="self-start md:self-auto inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-md border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Re-evaluating..." : "Re-evaluate Rules"}</span>
          </button>
        </div>

        {/* SUMMARY METRICS GRID */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Score Card */}
          <div className="col-span-2 sm:col-span-1 p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
              Compliance Score
            </span>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {summary.complianceScore.toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-400">assessed</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, summary.complianceScore))}%` }}
              />
            </div>
          </div>

          {/* PASS Counter */}
          <div
            onClick={() => setSelectedStatus(selectedStatus === "PASS" ? "ALL" : "PASS")}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              selectedStatus === "PASS"
                ? "bg-emerald-100 border-emerald-400 shadow-2xs"
                : "bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-50"
            }`}
          >
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
                PASS
              </span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <p className="mt-2 text-2xl font-bold font-mono text-emerald-900">
              {summary.passCount}
            </p>
            <p className="text-[10px] text-emerald-700/80 mt-0.5">Compliant rules</p>
          </div>

          {/* WARNING Counter */}
          <div
            onClick={() => setSelectedStatus(selectedStatus === "WARNING" ? "ALL" : "WARNING")}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              selectedStatus === "WARNING"
                ? "bg-amber-100 border-amber-400 shadow-2xs"
                : "bg-amber-50/60 border-amber-200/80 hover:bg-amber-50"
            }`}
          >
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
                WARNING
              </span>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <p className="mt-2 text-2xl font-bold font-mono text-amber-900">
              {summary.warningCount}
            </p>
            <p className="text-[10px] text-amber-700/80 mt-0.5">Attention needed</p>
          </div>

          {/* FAIL Counter */}
          <div
            onClick={() => setSelectedStatus(selectedStatus === "FAIL" ? "ALL" : "FAIL")}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              selectedStatus === "FAIL"
                ? "bg-rose-100 border-rose-400 shadow-2xs"
                : "bg-rose-50/60 border-rose-200/80 hover:bg-rose-50"
            }`}
          >
            <div className="flex items-center justify-between text-rose-800">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
                FAIL
              </span>
              <XCircle className="w-3.5 h-3.5" />
            </div>
            <p className="mt-2 text-2xl font-bold font-mono text-rose-900">
              {summary.failCount}
            </p>
            <p className="text-[10px] text-rose-700/80 mt-0.5">Non-compliant</p>
          </div>

          {/* NOT ASSESSED Counter */}
          <div
            onClick={() =>
              setSelectedStatus(selectedStatus === "NOT_ASSESSED" ? "ALL" : "NOT_ASSESSED")
            }
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              selectedStatus === "NOT_ASSESSED"
                ? "bg-slate-200 border-slate-400 shadow-2xs"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
                NOT ASSESSED
              </span>
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
            <p className="mt-2 text-2xl font-bold font-mono text-slate-800">
              {summary.notAssessedCount}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Missing data</p>
          </div>
        </div>
      </div>

      {/* REQUIRED ACTIONS BANNER (If any warnings/failures/not_assessed) */}
      {summary.requiredActions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5 text-amber-600" />
              Actionable Civil Remediation & Data Requirements ({summary.requiredActions.length})
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Priority Actions Required
            </span>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {summary.requiredActions.map((action, idx) => (
              <div key={idx} className="py-2.5 first:pt-0 last:pb-0 text-xs flex items-start space-x-3">
                <span
                  className={`shrink-0 text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                    action.status === "FAIL"
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : action.status === "WARNING"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  }`}
                >
                  {action.status}
                </span>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900">{action.ruleId}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-medium text-slate-800">{action.ruleName}</span>
                  </div>
                  <p className="mt-1 text-slate-900 font-semibold">{action.action}</p>
                  <p className="mt-0.5 text-slate-500 text-[11px]">{action.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER CONTROLS & RULES LIST */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Evaluated Construction Rules ({filteredRules.length} of {evaluation.results.length})
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Categories
            </button>
            {(Object.keys(CATEGORY_CONFIG) as RuleCategory[]).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                    isSelected
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIVE FILTER STATUS INDICATOR */}
        {(selectedCategory !== "ALL" || selectedStatus !== "ALL") && (
          <div className="mt-3 flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
            <span>Filtering by:</span>
            {selectedCategory !== "ALL" && (
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                Category: {selectedCategory}
              </span>
            )}
            {selectedStatus !== "ALL" && (
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                Status: {selectedStatus}
              </span>
            )}
            <button
              onClick={() => {
                setSelectedCategory("ALL");
                setSelectedStatus("ALL");
              }}
              className="text-indigo-600 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* RULES CARDS LIST */}
        <div className="mt-4 space-y-3">
          {filteredRules.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              No construction rules match the selected filter criteria.
            </div>
          ) : (
            filteredRules.map((rule) => {
              const statusCfg = STATUS_CONFIG[rule.status];
              const StatusIcon = statusCfg.icon;
              const catCfg = CATEGORY_CONFIG[rule.category] || {
                label: rule.category,
                icon: Layers,
              };

              return (
                <div
                  key={rule.ruleId}
                  className={`border rounded-lg p-4 transition-all ${statusCfg.bg} ${statusCfg.border}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex items-start space-x-3">
                      <StatusIcon
                        className={`w-4 h-4 shrink-0 mt-0.5 ${statusCfg.text}`}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {rule.ruleId}
                          </span>
                          <span className="text-slate-300">•</span>
                          <h4 className="text-xs font-bold text-slate-900">
                            {rule.ruleName}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500 bg-white/80 border border-slate-200 px-2 py-0.2 rounded">
                            {catCfg.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">
                            Severity: {rule.severity}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-800 leading-relaxed font-medium">
                          {rule.message}
                        </p>

                        {rule.evidence && (
                          <p className="mt-1 text-[11px] font-mono text-slate-600 bg-white/60 px-2 py-1 rounded border border-slate-200/60 inline-block">
                            Evidence: {rule.evidence}
                          </p>
                        )}

                        {rule.correctiveAction && (
                          <div className="mt-2.5 p-2.5 bg-white rounded border border-slate-200 text-xs">
                            <p className="text-[10px] font-mono uppercase font-bold text-slate-500">
                              {rule.status === "NOT_ASSESSED"
                                ? "Required Information"
                                : "Required Action"}
                            </p>
                            <p className="mt-0.5 text-slate-800 font-medium">
                              {rule.correctiveAction}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`self-start text-[10px] font-mono uppercase px-2.5 py-1 rounded border font-bold shrink-0 ${statusCfg.badgeBg}`}
                    >
                      {rule.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* STATUTORY DISCLAIMER FOOTER */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs flex items-start space-x-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <p className="font-semibold text-slate-700">Official Civil Compliance Notice</p>
          <p className="mt-0.5">{summary.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
