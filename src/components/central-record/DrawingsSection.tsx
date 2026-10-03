"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Upload,
  AlertCircle,
  FileText,
  Download,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  DrawingRecord,
  DrawingType,
  DrawingApprovalStatus,
  BuildingRecord,
} from "@/lib/types";

interface DrawingsSectionProps {
  building: BuildingRecord;
}

const DRAWING_TYPE_LABELS: Record<DrawingType, string> = {
  architectural: "Architectural Plans",
  structural: "Structural Engineering",
  electrical: "Electrical & Power",
  plumbing: "Plumbing & Sanitation",
  fire_safety: "Fire Safety & Evacuation",
  site_plan: "Site Layout & Survey",
  as_built: "As-Built Blueprints",
  other: "Other Engineering CAD",
};

const STATUS_CONFIG: Record<
  DrawingApprovalStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  APPROVED: {
    label: "APPROVED",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  UNDER_REVIEW: {
    label: "UNDER REVIEW",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
  },
  SUBMITTED: {
    label: "SUBMITTED",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  SUPERSEDED: {
    label: "SUPERSEDED",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
  },
  REJECTED: {
    label: "REJECTED",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  DRAFT: {
    label: "DRAFT",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  },
};

export const DrawingsSection: React.FC<DrawingsSectionProps> = ({ building }) => {
  const { user } = useAuth();
  const [drawings, setDrawings] = useState<DrawingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<DrawingType | "ALL">("ALL");

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState<DrawingType>("architectural");
  const [uploadScale, setUploadScale] = useState("1:100");
  const [uploadSheetNumber, setUploadSheetNumber] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const canModify =
    user?.role === "admin" ||
    user?.role === "engineer" ||
    (user?.role === "owner" && building.createdBy === user?.userId);

  const canApprove = user?.role === "admin" || user?.role === "engineer";

  const reloadDrawings = useCallback(async () => {
    try {
      const data = await api.drawings.list(
        building.id,
        selectedType === "ALL" ? undefined : selectedType
      );
      setDrawings(data);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load engineering drawings.");
    }
  }, [building.id, selectedType]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await api.drawings.list(
          building.id,
          selectedType === "ALL" ? undefined : selectedType
        );
        if (!ignore) {
          setDrawings(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError((err as Error).message || "Failed to load engineering drawings.");
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [building.id, selectedType]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select a blueprint or CAD file.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle || uploadFile.name);
      formData.append("drawingType", uploadType);
      if (uploadScale) formData.append("scale", uploadScale);
      if (uploadSheetNumber) formData.append("sheetNumber", uploadSheetNumber);
      if (uploadNotes) formData.append("notes", uploadNotes);

      await api.drawings.upload(building.id, formData);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle("");
      setUploadSheetNumber("");
      setUploadNotes("");
      reloadDrawings();
    } catch (err: unknown) {
      setUploadError((err as Error).message || "Drawing registration failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (
    drawingId: string,
    newStatus: DrawingApprovalStatus
  ) => {
    try {
      await api.drawings.updateStatus(drawingId, newStatus);
      reloadDrawings();
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to update status.");
    }
  };

  const filteredDrawings = drawings;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase bg-slate-900 text-white px-2 py-0.5 rounded font-semibold tracking-wider">
              BIM / CAD Ledger
            </span>
            <span className="text-xs font-mono text-slate-500">
              Revision Control &amp; Approvals
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Drawings &amp; Blueprints Central Architecture
          </h2>
          <p className="text-xs text-slate-500">
            Official engineering drawings with automated revision codes (V1 &rarr; R0, V2 &rarr; R1), version increments, and statutory approval controls.
          </p>
        </div>

        {canModify && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-md border border-slate-900 shadow-xs transition-colors shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Revision</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 text-xs">
        <button
          onClick={() => setSelectedType("ALL")}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
            selectedType === "ALL"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Drawings ({drawings.length})
        </button>
        {(Object.keys(DRAWING_TYPE_LABELS) as DrawingType[]).map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
              selectedType === t
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {DRAWING_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-500">
          Loading drawings and engineering revisions...
        </div>
      ) : filteredDrawings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200 p-6">
          <Layers className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-900">No Engineering Drawings Registered</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Upload architectural plans, structural layout CADs, or as-built blueprints to maintain a verifiable civil ledger.
          </p>
          {canModify && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase text-white bg-slate-900 px-3.5 py-2 rounded-md"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Drawing</span>
            </button>
          )}
        </div>
      ) : (
        /* Drawings Table */
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-mono uppercase text-slate-600 text-[11px]">
                <tr>
                  <th className="px-4 py-3">Drawing / Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Revision</th>
                  <th className="px-4 py-3">Sheet &amp; Scale</th>
                  <th className="px-4 py-3">Approval Status</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredDrawings.map((d) => {
                  const statusMeta = STATUS_CONFIG[d.approvalStatus] || STATUS_CONFIG.SUBMITTED;
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                            <FileText className="w-4 h-4 text-slate-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{d.title}</p>
                            <p className="text-[11px] font-mono text-slate-500">
                              {d.originalFilename} ({(d.fileSize / 1024).toFixed(0)} KB)
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-700">
                          {DRAWING_TYPE_LABELS[d.drawingType] || d.drawingType}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5 font-mono">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold text-[11px]">
                            {d.revisionCode}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            (v{d.version})
                          </span>
                          {d.isLatestApproved && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Active Standard
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        <div>Sheet: {d.sheetNumber || "A-01"}</div>
                        <div className="text-slate-400">Scale: {d.scale || "NTS"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        {new Date(d.uploadedAt).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {d.url && (
                            <a
                              href={d.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                              title="Download Drawing File"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}

                          {canApprove && (
                            <select
                              value={d.approvalStatus}
                              onChange={(e) =>
                                handleStatusChange(
                                  d.id,
                                  e.target.value as DrawingApprovalStatus
                                )
                              }
                              className="text-[11px] font-mono bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                            >
                              <option value="SUBMITTED">SUBMITTED</option>
                              <option value="UNDER_REVIEW">UNDER REVIEW</option>
                              <option value="APPROVED">APPROVE</option>
                              <option value="REJECTED">REJECT</option>
                              <option value="SUPERSEDED">SUPERSEDE</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Revision Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-slate-900" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Register Engineering Drawing Revision
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 mt-4 text-xs">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded">
                  {uploadError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Blueprint / CAD File * (PDF, DWG, DXF, PNG, SVG)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.svg"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full border border-slate-300 rounded p-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Drawing Category *
                  </label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as DrawingType)}
                    className="w-full border border-slate-300 rounded p-2 text-slate-800 bg-white"
                  >
                    {(Object.keys(DRAWING_TYPE_LABELS) as DrawingType[]).map((t) => (
                      <option key={t} value={t}>
                        {DRAWING_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Drawing Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ground Floor Structural Grid"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sheet Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. S-101 or A-02"
                    value={uploadSheetNumber}
                    onChange={(e) => setUploadSheetNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Drawing Scale
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1:100, 1:50, NTS"
                    value={uploadScale}
                    onChange={(e) => setUploadScale(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Revision Notes / Engineering Comments
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Shear wall reinforcement details updated per NBC 2016."
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 font-semibold uppercase tracking-wider text-[11px] disabled:opacity-50"
                >
                  {uploading ? "Registering..." : "Submit Revision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingsSection;
