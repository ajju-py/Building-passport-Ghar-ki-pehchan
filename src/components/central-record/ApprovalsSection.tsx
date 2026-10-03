"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  CheckCircle2,
  Plus,
  Trash2,
  Building,
  ShieldCheck,
  Flame,
  AlertCircle,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  RegulatoryApprovalRecord,
  ApprovalType,
  ApprovalStatus,
  BuildingRecord,
} from "@/lib/types";

interface ApprovalsSectionProps {
  building: BuildingRecord;
}

const APPROVAL_TYPE_LABELS: Record<ApprovalType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  building_permission: { label: "Building Sanction Permit", icon: Building },
  fire_noc: { label: "Fire & Life Safety NOC", icon: Flame },
  completion_certificate: { label: "Completion Certificate", icon: FileCheck2 },
  occupancy_certificate: { label: "Occupancy Certificate (OC)", icon: ShieldCheck },
  structural_stability: { label: "Structural Stability Certificate", icon: CheckCircle2 },
  environmental_clearance: { label: "Environmental Clearance", icon: CheckCircle2 },
  heritage_noc: { label: "Heritage Conservation NOC", icon: Building },
  airport_authority_noc: { label: "Height & Airport Authority NOC", icon: Building },
  other: { label: "Other Statutory Clearances", icon: FileCheck2 },
};

const STATUS_CONFIG: Record<
  ApprovalStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  ACTIVE: {
    label: "ACTIVE / VALID",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
  PENDING_RENEWAL: {
    label: "PENDING RENEWAL",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  EXPIRED: {
    label: "EXPIRED",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
  },
  REVOKED: {
    label: "REVOKED",
    bg: "bg-red-50",
    text: "text-red-900",
    border: "border-red-300",
  },
  PROVISIONAL: {
    label: "PROVISIONAL",
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-200",
  },
};

export const ApprovalsSection: React.FC<ApprovalsSectionProps> = ({ building }) => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<RegulatoryApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [approvalType, setApprovalType] = useState<ApprovalType>("building_permission");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [approvalNumber, setApprovalNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState("");
  const [status, setStatus] = useState<ApprovalStatus>("ACTIVE");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canModify =
    user?.role === "admin" ||
    user?.role === "engineer" ||
    (user?.role === "owner" && building.createdBy === user?.userId);

  const canDelete = user?.role === "admin" || user?.role === "engineer";

  const refreshApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.approvals.list(building.id);
      setApprovals(data);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load statutory approvals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        setError(null);
        const data = await api.approvals.list(building.id);
        if (!ignore) {
          setApprovals(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError((err as Error).message || "Failed to load statutory approvals.");
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [building.id]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      await api.approvals.create(building.id, {
        approvalType,
        issuingAuthority: issuingAuthority.trim(),
        approvalNumber: approvalNumber.trim(),
        issueDate,
        validUntil: validUntil || undefined,
        status,
        remarks: remarks.trim() || undefined,
      });

      setShowAddModal(false);
      setIssuingAuthority("");
      setApprovalNumber("");
      setValidUntil("");
      setRemarks("");
      refreshApprovals();
    } catch (err: unknown) {
      setFormError((err as Error).message || "Failed to register approval.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Are you sure you want to delete approval record #${number}?`)) return;
    try {
      await api.approvals.delete(id);
      refreshApprovals();
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to delete approval.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase bg-emerald-800 text-white px-2 py-0.5 rounded font-semibold tracking-wider">
              Statutory Clearances
            </span>
            <span className="text-xs font-mono text-slate-500">
              Permissions &amp; NOC Ledger
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Permissions, NOCs &amp; Statutory Approvals
          </h2>
          <p className="text-xs text-slate-500">
            Official municipal permissions, Fire Safety NOCs, Occupancy Certificates, and environmental clearances governing this asset.
          </p>
        </div>

        {canModify && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-md border border-slate-900 shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Statutory Clearance</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-500">
          Loading regulatory approvals and certificates...
        </div>
      ) : approvals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200 p-6">
          <FileCheck2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-900">No Regulatory Approvals Logged</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Record municipal building permits, fire department NOCs, and completion certificates to maintain statutory transparency.
          </p>
          {canModify && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase text-white bg-slate-900 px-3.5 py-2 rounded-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record First Approval</span>
            </button>
          )}
        </div>
      ) : (
        /* Approvals Grid Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {approvals.map((appr) => {
            const typeMeta = APPROVAL_TYPE_LABELS[appr.approvalType] || APPROVAL_TYPE_LABELS.other;
            const statusMeta = STATUS_CONFIG[appr.status] || STATUS_CONFIG.ACTIVE;
            const IconComponent = typeMeta.icon;

            return (
              <div
                key={appr.id}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-slate-800">
                        <IconComponent className="w-5 h-5 text-slate-800" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {typeMeta.label}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Authority: <strong className="text-slate-700">{appr.issuingAuthority}</strong>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded p-3 border border-slate-100 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">APPROVAL NO:</span>
                      <span className="font-bold text-slate-900">{appr.approvalNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ISSUE DATE:</span>
                      <span className="text-slate-800">{appr.issueDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">VALIDITY:</span>
                      <span className={appr.validUntil ? "text-slate-800" : "text-emerald-700 font-semibold"}>
                        {appr.validUntil ? appr.validUntil : "Perpetual / Permanent"}
                      </span>
                    </div>
                  </div>

                  {appr.remarks && (
                    <p className="text-xs text-slate-600 mt-3 italic border-l-2 border-slate-200 pl-2">
                      &ldquo;{appr.remarks}&rdquo;
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Logged {new Date(appr.createdAt).toLocaleDateString()}</span>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(appr.id, appr.approvalNumber)}
                      className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Approval Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-slate-900" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Record Statutory Permission / NOC
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Approval / Certificate Type *
                </label>
                <select
                  value={approvalType}
                  onChange={(e) => setApprovalType(e.target.value as ApprovalType)}
                  className="w-full border border-slate-300 rounded p-2 text-slate-800 bg-white"
                >
                  {(Object.keys(APPROVAL_TYPE_LABELS) as ApprovalType[]).map((t) => (
                    <option key={t} value={t}>
                      {APPROVAL_TYPE_LABELS[t].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Issuing Authority *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Municipal Corporation, Fire Dept"
                    value={issuingAuthority}
                    onChange={(e) => setIssuingAuthority(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Approval / NOC Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NOC-2024-FIRE-0982"
                    value={approvalNumber}
                    onChange={(e) => setApprovalNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Valid Until (Leave blank if perpetual)
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Compliance Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ApprovalStatus)}
                  className="w-full border border-slate-300 rounded p-2 text-slate-800 bg-white"
                >
                  <option value="ACTIVE">ACTIVE / VALID</option>
                  <option value="PENDING_RENEWAL">PENDING RENEWAL</option>
                  <option value="PROVISIONAL">PROVISIONAL</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="REVOKED">REVOKED</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Conditions / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Subject to annual fire hydrant inspection and pressure tests."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 font-semibold uppercase tracking-wider text-[11px] disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Record Clearance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsSection;
