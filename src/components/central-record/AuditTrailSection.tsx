"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Shield,
  Clock,
  User,
  AlertCircle,
  FileText,
  CheckCircle2,
  Upload,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { AuditLogRecord, BuildingRecord } from "@/lib/types";

interface AuditTrailSectionProps {
  building: BuildingRecord;
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  DRAWING_UPLOADED: Upload,
  DRAWING_STATUS_CHANGED: CheckCircle2,
  REGULATORY_APPROVAL_RECORDED: FileText,
  REGULATORY_APPROVAL_UPDATED: RefreshCw,
  REGULATORY_APPROVAL_DELETED: AlertCircle,
  IDENTITY_VERIFICATION_INITIATED: Shield,
  IDENTITY_VERIFIED: CheckCircle2,
  IDENTITY_VERIFICATION_FAILED: AlertCircle,
  BUILDING_CREATED: BuildingRecordBadgeIcon,
  BUILDING_UPDATED: RefreshCw,
};

function BuildingRecordBadgeIcon(props: { className?: string }) {
  return <History {...props} />;
}

export const AuditTrailSection: React.FC<AuditTrailSectionProps> = ({ building }) => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.auditLogs.listForBuilding(building.id, 50);
      setLogs(data);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load audit history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        setError(null);
        const data = await api.auditLogs.listForBuilding(building.id, 50);
        if (!ignore) {
          setLogs(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError((err as Error).message || "Failed to load audit history.");
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [building.id]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase bg-slate-900 text-white px-2 py-0.5 rounded font-semibold tracking-wider">
              Immutable Ledger
            </span>
            <span className="text-xs font-mono text-slate-500">
              Civil Audit Trail
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Activity &amp; Modification Audit Trail
          </h2>
          <p className="text-xs text-slate-500">
            Chronological cryptographic log of all administrative actions, blueprint revisions, NOC updates, and inspection records.
          </p>
        </div>

        <button
          onClick={refresh}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded px-3 py-1.5 hover:bg-slate-50 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Trail</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-500">
          Compiling cryptographic audit entries...
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200 p-6">
          <History className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-900">Initial State Logged</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            New revisions, statutory submissions, and lifecycle modifications will be appended to this immutable trail.
          </p>
        </div>
      ) : (
        /* Timeline View */
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {logs.map((log) => {
              const IconComp = ACTION_ICONS[log.action] || History;
              const dateObj = new Date(log.createdAt);

              return (
                <div key={log.id} className="relative group">
                  <div className="absolute -left-[27px] top-1 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center ring-4 ring-white shadow-2xs">
                    <IconComp className="w-3 h-3 text-slate-100" />
                  </div>

                  <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {log.action.replace(/_/g, " ")}
                        </span>
                        {log.actorRole && (
                          <span className="text-[10px] font-mono uppercase bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                            {log.actorRole}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Actor: <strong>{log.actorName || log.actorId || "System Ledger"}</strong>
                      </span>
                    </div>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                        {Object.entries(log.metadata).map(([key, val]) => (
                          <span key={key}>
                            <span className="text-slate-400">{key}:</span>{" "}
                            <span className="text-slate-700 font-medium">
                              {typeof val === "object" ? JSON.stringify(val) : String(val)}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrailSection;
