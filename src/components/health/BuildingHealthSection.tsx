"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wrench,
  Layers,
  Flame,
  Archive,
  History,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { BuildingRecord, HealthAssessmentRecord, RiskLevel } from "@/lib/types";

interface BuildingHealthSectionProps {
  building: BuildingRecord;
}

/**
 * Canonical civil risk threshold definitions matching backend bp-rules-v1.0 engine:
 * Low:       85.00 – 100.00
 * Moderate:  70.00 – 84.99
 * Elevated:  55.00 – 69.99
 * High:      40.00 – 54.99
 * Critical:  0.00 – 39.99
 */
export const RISK_LEVEL_METADATA: Record<
  RiskLevel,
  {
    range: string;
    description: string;
    bg: string;
    text: string;
    border: string;
    bar: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  Low: {
    range: "85.00 – 100.00",
    description: "Optimal structural integrity with proactive maintenance compliance",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    bar: "bg-emerald-600",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: ShieldCheck,
  },
  Moderate: {
    range: "70.00 – 84.99",
    description: "Standard operational lifecycle with minor routine maintenance needs",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    bar: "bg-blue-600",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
    icon: Shield,
  },
  Elevated: {
    range: "55.00 – 69.99",
    description: "Noticeable defect burden, deferred repairs, or documentation gaps",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    bar: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    icon: AlertTriangle,
  },
  High: {
    range: "40.00 – 54.99",
    description: "Substantial unresolved defects or significant civil compliance deficiency",
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-200",
    bar: "bg-orange-500",
    badge: "bg-orange-100 text-orange-800 border-orange-300",
    icon: AlertCircle,
  },
  Critical: {
    range: "0.00 – 39.99",
    description: "Compounding critical defects requiring urgent licensed civil intervention",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    bar: "bg-rose-600",
    badge: "bg-rose-100 text-rose-800 border-rose-300",
    icon: ShieldAlert,
  },
};

/**
 * Maps any 0-100 category score to its canonical risk threshold presentation.
 */
export function getScoreThresholdPresentation(score: number): { text: string; bar: string } {
  if (score >= 85.0) return { text: "text-emerald-700", bar: "bg-emerald-500" };
  if (score >= 70.0) return { text: "text-blue-700", bar: "bg-blue-500" };
  if (score >= 55.0) return { text: "text-amber-700", bar: "bg-amber-500" };
  if (score >= 40.0) return { text: "text-orange-700", bar: "bg-orange-500" };
  return { text: "text-rose-700", bar: "bg-rose-500" };
}

export default function BuildingHealthSection({ building }: BuildingHealthSectionProps) {
  const { user } = useAuth();

  const [latestAssessment, setLatestAssessment] = useState<HealthAssessmentRecord | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<HealthAssessmentRecord | null>(null);
  const [history, setHistory] = useState<HealthAssessmentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Authorization check for UX (backend strictly enforces this)
  const isAuthorizedToGenerate =
    Boolean(user) &&
    (user?.role === "admin" ||
      user?.role === "engineer" ||
      (user?.role === "owner" && building.createdBy && building.createdBy === user?.userId));

  const isOwnerUnauthorized =
    user?.role === "owner" && (!building.createdBy || building.createdBy !== user?.userId);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        // 1. Fetch latest assessment
        let latest: HealthAssessmentRecord | null = null;
        try {
          latest = await api.healthAssessments.getLatest(building.id);
        } catch (err: unknown) {
          const msg = (err as Error).message || "";
          // 404 means no assessment generated yet; any other error is an issue
          if (!msg.includes("404") && !msg.toLowerCase().includes("not found")) {
            throw err;
          }
        }

        if (ignore) return;
        setLatestAssessment(latest);
        setSelectedAssessment(latest);

        // 2. Fetch history if user is authenticated
        if (user && user.role !== "public") {
          try {
            const list = await api.healthAssessments.list(building.id);
            if (!ignore) setHistory(list);
          } catch {
            if (!ignore) setHistory(latest ? [latest] : []);
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError((err as Error).message || "Failed to load health assessment records.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [building.id, user]);

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const created = await api.healthAssessments.generate(building.id);
      setLatestAssessment(created);
      setSelectedAssessment(created);
      setHistory((prev) => [created, ...prev.filter((h) => h.id !== created.id)]);
      setSuccessMsg("New deterministic health assessment computed and archived successfully.");
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to calculate health assessment.");
    } finally {
      setGenerating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. LOADING STATE
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 shadow-2xs text-center">
        <Activity className="w-8 h-8 text-slate-400 animate-pulse mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">Loading Health Assessment Dossier...</h3>
        <p className="text-xs text-slate-500 font-mono mt-1">Retrieving civil telemetry and risk indices</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. UNAUTHENTICATED OR PUBLIC ACCESS NOTICE
  // ─────────────────────────────────────────────────────────────
  if (!user || user.role === "public") {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-2xs text-center max-w-2xl mx-auto">
        <Shield className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Restricted Engineering Assessment</h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Detailed multi-parameter building health assessments, structural evaluations, and defect burdens
          are accessible only to verified municipal authorities, accredited civil auditors, and authorized building stakeholders.
        </p>
        <p className="text-[11px] font-mono text-slate-500 mt-4 bg-slate-50 p-2.5 rounded border border-slate-200/60 inline-block">
          Public QR and Citizen verification remain active under the public registry.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. UNAUTHORIZED OWNER NOTICE
  // ─────────────────────────────────────────────────────────────
  if (isOwnerUnauthorized && error?.includes("Forbidden")) {
    return (
      <div className="bg-white border border-amber-200 rounded-lg p-8 shadow-2xs text-center max-w-2xl mx-auto">
        <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Asset Ownership Boundary</h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Your account is registered as an Owner, but you are not designated as the registered owner of
          this specific asset ({building.passportId}). Internal civil risk dossiers are restricted to the primary owner or municipal engineers.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 4. EMPTY STATE (NO ASSESSMENT GENERATED YET)
  // ─────────────────────────────────────────────────────────────
  if (!selectedAssessment && !latestAssessment) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-2xs text-center max-w-3xl mx-auto">
        <Activity className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Health Assessment Not Yet Generated</h3>
        <p className="text-xs text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
          The deterministic health assessment synthesizes recorded civil evidence across structural frame specifications,
          field inspections, active defect burdens, maintenance ledger history, and compliance archives.
        </p>
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200/80 rounded-md text-[11px] text-slate-600 font-mono inline-block">
          Notice: The absence of an automated assessment does not imply that the asset is defective or structurally impaired.
        </div>

        {isAuthorizedToGenerate && (
          <div className="mt-6">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center px-4 py-2.5 bg-slate-900 text-white rounded-md text-xs font-semibold tracking-wide uppercase hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Extracting Features & Computing Score...
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 mr-2 text-emerald-400" />
                  Generate Initial Health Assessment
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  const assessment = selectedAssessment || latestAssessment!;
  const isViewingHistorical = latestAssessment && assessment.id !== latestAssessment.id;
  const riskMeta = RISK_LEVEL_METADATA[assessment.riskLevel];
  const RiskIcon = riskMeta.icon;

  const categoryLabels = [
    { key: "structural", label: "Structural Condition", weight: "25%", icon: Layers, val: assessment.categoryScores.structural },
    { key: "defectBurden", label: "Defect Burden", weight: "25%", icon: AlertTriangle, val: assessment.categoryScores.defectBurden },
    { key: "maintenance", label: "Maintenance Ledger", weight: "20%", icon: Wrench, val: assessment.categoryScores.maintenance },
    { key: "safety", label: "Fire & Life Safety", weight: "10%", icon: Flame, val: assessment.categoryScores.safety },
    { key: "lifecycle", label: "Lifecycle Aging", weight: "10%", icon: Clock, val: assessment.categoryScores.lifecycle },
    { key: "documentation", label: "Evidence & Records", weight: "10%", icon: Archive, val: assessment.categoryScores.documentation },
  ];

  return (
    <div className="space-y-6">
      {/* Historical View Banner */}
      {isViewingHistorical && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-amber-900">
            <History className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              <strong>Viewing Historical Assessment Record:</strong> Generated on{" "}
              {new Date(assessment.assessmentDate).toLocaleDateString()} (ID: {assessment.id.slice(0, 16)}...)
            </span>
          </div>
          <button
            onClick={() => setSelectedAssessment(latestAssessment)}
            className="px-2.5 py-1 bg-white border border-amber-300 rounded text-[11px] font-semibold text-amber-900 hover:bg-amber-100 transition-colors shrink-0"
          >
            View Latest Assessment
          </button>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg p-3 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-lg p-3 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          HEALTH ASSESSMENT HEADER CARD
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-semibold text-slate-700">
                Deterministic Civil Engine: {assessment.modelVersion}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Type: {assessment.engineType}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-2 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-slate-700" />
              Civil Health & Risk Assessment
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Deterministic multi-criteria evaluation computed from verified registry telemetry.
            </p>
          </div>

          {/* Action Button: Generate New Assessment */}
          {isAuthorizedToGenerate && (
            <div className="shrink-0">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold uppercase tracking-wide hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-2 text-slate-300" />
                    Run New Assessment
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Master Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* 1. Master Score */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-lg">
            <span className="text-[10px] font-mono uppercase text-slate-500">Health Assessment Score</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                {assessment.overallScore.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-slate-500">/ 100</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Deterministic index based on recorded condition
            </p>
          </div>

          {/* 2. Risk Tier */}
          <div className={`p-4 ${riskMeta.bg} border ${riskMeta.border} rounded-lg`}>
            <span className="text-[10px] font-mono uppercase text-slate-600">Calculated Risk Tier</span>
            <div className="flex items-center space-x-2 mt-1">
              <RiskIcon className={`w-5 h-5 ${riskMeta.text}`} />
              <span className={`text-2xl font-bold ${riskMeta.text}`}>
                {assessment.riskLevel}
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-600 mt-1">
              Threshold: {riskMeta.range}
            </p>
          </div>

          {/* 3. Data Completeness */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-lg">
            <span className="text-[10px] font-mono uppercase text-slate-500">Evidence Completeness</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                {Math.round(assessment.dataCompletenessScore)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              12 certified checkpoint validation
            </p>
          </div>

          {/* 4. Timestamp & Provenance */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-lg">
            <span className="text-[10px] font-mono uppercase text-slate-500">Assessment Timestamp</span>
            <div className="text-sm font-semibold text-slate-900 mt-1">
              {new Date(assessment.assessmentDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-1 truncate">
              Audit ID: {assessment.id.slice(0, 14)}...
            </p>
          </div>
        </div>

        {/* Engine Disclaimer Alert */}
        <div className="mt-6 p-3.5 bg-blue-50/60 border border-blue-200/70 rounded-md flex items-start space-x-3 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Civil Engineering Audit Notice:</strong> This deterministic assessment provides objective decision support
            derived from recorded building parameters and registered lifecycle evidence. It does not replace physical structural
            inspection or statutory certification by an accredited civil/structural engineer.
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CATEGORY BREAKDOWN SECTION
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center">
          <Layers className="w-4 h-4 mr-2 text-slate-700" />
          Multi-Parameter Category Breakdown (0 - 100)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {categoryLabels.map((cat) => {
            const Icon = cat.icon;
            const score = Math.round(cat.val);
            const styling = getScoreThresholdPresentation(score);

            return (
              <div key={cat.key} className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-md">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center space-x-2 font-medium text-slate-800">
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{cat.label}</span>
                    <span className="text-[10px] font-mono text-slate-400">({cat.weight})</span>
                  </div>
                  <span className={`font-mono font-bold text-xs ${styling.text}`}>{score} / 100</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${styling.bar} transition-all duration-300`}
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CONTRIBUTING FACTORS & RECOMMENDATIONS GRID
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contributing Factors */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center">
            <Info className="w-4 h-4 mr-2 text-slate-700" />
            Civil Contributing Factors
          </h3>

          <div className="mt-4 space-y-2">
            {assessment.contributingFactors.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No specific anomaly or enhancement factors recorded.</p>
            ) : (
              assessment.contributingFactors.map((factor, idx) => {
                const isPositive = factor.impact >= 0;
                return (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      {isPositive ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                      <span className="text-slate-800">{factor.factor}</span>
                    </div>
                    <span
                      className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        isPositive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {isPositive ? `+${factor.impact}` : `${factor.impact}`} pts
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Actionable Engineering Recommendations */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-slate-700" />
            Recommended Civil Actions
          </h3>

          <div className="mt-4 space-y-2.5">
            {assessment.recommendations.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No outstanding remediation recommendations on file.</p>
            ) : (
              assessment.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50/70 border border-slate-200/80 rounded flex items-start space-x-2.5 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-800 leading-relaxed">{rec}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DETERMINISTIC SUMMARY EXPLANATION
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center">
          <FileText className="w-4 h-4 mr-2 text-slate-700" />
          Automated Assessment Synthesis
        </h3>
        <p className="mt-3 text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-md border border-slate-200/80 font-mono">
          {assessment.summaryExplanation}
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CANONICAL RISK THRESHOLD REFERENCE MATRIX
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
          <span className="flex items-center">
            <Shield className="w-4 h-4 mr-2 text-slate-700" />
            Civil Risk Threshold Matrix (bp-rules-v1.0)
          </span>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            Statutory Scale
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 text-xs font-mono">
          {(["Low", "Moderate", "Elevated", "High", "Critical"] as RiskLevel[]).map((level) => {
            const meta = RISK_LEVEL_METADATA[level];
            const Icon = meta.icon;
            const isCurrent = assessment.riskLevel === level;

            return (
              <div
                key={level}
                className={`p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? `${meta.bg} ${meta.border} ring-2 ring-slate-900/10 shadow-xs font-semibold`
                    : "bg-slate-50/50 border-slate-200/70 opacity-80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Icon className={`w-3.5 h-3.5 ${meta.text}`} />
                    <span className={`text-xs font-bold ${meta.text}`}>{level}</span>
                  </div>
                  {isCurrent && (
                    <span className="text-[9px] uppercase px-1 py-0.2 bg-slate-900 text-white rounded font-sans">
                      Active
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900">{meta.range}</div>
                <p className="mt-1 text-[10px] text-slate-500 font-sans leading-tight">
                  {meta.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          HISTORICAL ASSESSMENTS SECTION
          ───────────────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span className="flex items-center">
              <History className="w-4 h-4 mr-2 text-slate-700" />
              Historical Audit Trail ({history.length})
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-normal uppercase">
              Immutable Records
            </span>
          </h3>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Audit ID</th>
                  <th className="py-2.5 px-3">Health Score</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">Completeness</th>
                  <th className="py-2.5 px-3">Engine</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {history.map((hist) => {
                  const isSelected = hist.id === assessment.id;
                  const isLatest = latestAssessment && hist.id === latestAssessment.id;
                  const tierMeta = RISK_LEVEL_METADATA[hist.riskLevel];

                  return (
                    <tr
                      key={hist.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? "bg-slate-50/90 font-semibold" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-900">
                        {new Date(hist.assessmentDate).toLocaleDateString()}
                        {isLatest && (
                          <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-slate-900 text-white rounded font-sans uppercase font-bold">
                            Latest
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{hist.id.slice(0, 16)}...</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{hist.overallScore.toFixed(1)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tierMeta.bg} ${tierMeta.text} border ${tierMeta.border}`}>
                          {hist.riskLevel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{Math.round(hist.dataCompletenessScore)}%</td>
                      <td className="py-2.5 px-3 text-slate-500 text-[10px]">{hist.modelVersion}</td>
                      <td className="py-2.5 px-3 text-right">
                        {isSelected ? (
                          <span className="text-[10px] font-sans font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            Active Dossier
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedAssessment(hist)}
                            className="text-[10px] font-sans font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            Inspect This Run
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
