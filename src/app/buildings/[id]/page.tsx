"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  FileCheck2,
  AlertTriangle,
  Wrench,
  FileText,
  Camera,
  QrCode,
  Shield,
  Download,
  Copy,
  ExternalLink,
  Plus,
  AlertCircle,
  MapPin,
  Calendar,
  Layers,
  HardHat,
  Printer,
  ChevronLeft,
  Activity,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  BuildingRecord,
  InspectionRecord,
  DefectRecord,
  DefectStatus,
  MaintenanceRecord,
  DocumentRecord,
  DocumentType,
  DefectSeverity,
} from "@/lib/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BuildingHealthSection from "@/components/health/BuildingHealthSection";

export default function BuildingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [building, setBuilding] = useState<BuildingRecord | null>(null);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [defects, setDefects] = useState<DefectRecord[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "health" | "inspections" | "defects" | "maintenance" | "documents" | "photos" | "qr" | "report"
  >("overview");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Modal / Form States
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    observations: "",
    remarks: "",
  });

  const [showDefectModal, setShowDefectModal] = useState(false);
  const [defectForm, setDefectForm] = useState({
    category: "Structural Surface",
    location: "",
    severity: "Medium" as DefectSeverity,
    details: "",
  });

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    repairType: "Structural Waterproofing",
    repairDate: new Date().toISOString().split("T")[0],
    description: "",
    cost: 50000,
    contractor: "",
    warrantyDetails: "12 Months Service Warranty",
  });

  const [showDocModal, setShowDocModal] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState<DocumentType>("blueprint");
  const [docPrivate, setDocPrivate] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const b = await api.buildings.getById(id);
        if (ignore) return;
        setBuilding(b);

        const [insps, defs, maints, docs] = await Promise.all([
          api.inspections.list(b.id).catch(() => []),
          api.defects.list(b.id).catch(() => []),
          api.maintenance.list(b.id).catch(() => []),
          api.documents.list(b.id).catch(() => []),
        ]);

        if (!ignore) {
          setInspections(insps);
          setDefects(defs);
          setMaintenance(maints);
          setDocuments(docs);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError((err as Error).message || "Failed to load building passport.");
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
  }, [id]);

  const copyPublicUrl = () => {
    if (!building) return;
    const url = `${window.location.origin}/public/building/${building.passportId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Handlers for adding items
  const handleAddInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!building) return;
    setSubmitting(true);
    try {
      const created = await api.inspections.create(building.id, inspectionForm);
      setInspections((prev) => [created, ...prev]);
      setShowInspectionModal(false);
      setInspectionForm({
        date: new Date().toISOString().split("T")[0],
        observations: "",
        remarks: "",
      });
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to save inspection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDefect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!building) return;
    setSubmitting(true);
    try {
      const created = await api.defects.create(building.id, defectForm);
      setDefects((prev) => [created, ...prev]);
      setShowDefectModal(false);
      setDefectForm({
        category: "Structural Surface",
        location: "",
        severity: "Medium",
        details: "",
      });
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to save defect.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDefectStatus = async (defectId: string, newStatus: DefectStatus) => {
    try {
      const updated = await api.defects.update(defectId, { status: newStatus });
      setDefects((prev) => prev.map((d) => (d.id === defectId || d.defectId === defectId ? updated : d)));
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to update defect.");
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!building) return;
    setSubmitting(true);
    try {
      const created = await api.maintenance.create(building.id, maintenanceForm);
      setMaintenance((prev) => [created, ...prev]);
      setShowMaintenanceModal(false);
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to record maintenance.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!building || !docFile) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", docFile);
      fd.append("title", docTitle || docFile.name);
      fd.append("documentType", docType);
      fd.append("isPrivate", docPrivate ? "true" : "false");

      const created = await api.documents.upload(building.id, fd);
      setDocuments((prev) => [created, ...prev]);
      setShowDocModal(false);
      setDocFile(null);
      setDocTitle("");
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to upload document.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-12 text-xs font-mono text-slate-500">
          Loading civil building passport dossier...
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !building) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto flex flex-col items-center justify-center p-8 text-center pt-32">
          <AlertCircle className="w-12 h-12 text-rose-600 mb-3" />
          <h1 className="text-xl font-bold text-slate-900">Building Passport Not Found</h1>
          <p className="text-xs text-slate-600 mt-1">{error || "The requested civil record does not exist."}</p>
          <Link
            href="/buildings"
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded text-xs uppercase font-semibold"
          >
            Back to Registry
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const totalCost = maintenance.reduce((sum, m) => sum + (m.cost || 0), 0);
  const openDefectsCount = defects.filter((d) => d.status === "Open" || d.status === "In Review").length;

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Navigation Breadcrumb */}
        <div className="mb-4 flex items-center space-x-2 text-xs font-mono text-slate-500">
          <Link href="/buildings" className="hover:text-slate-900 flex items-center">
            <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
            Registry
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">{building.passportId}</span>
        </div>

        {/* Passport Identity Header Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 border border-slate-700 shadow-xs">
                <Building2 className="w-8 h-8 text-slate-100" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                    {building.passportId}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded ${
                      building.condition === "Good" || building.condition === "Excellent"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                        : building.condition === "Fair"
                        ? "bg-amber-50 text-amber-800 border border-amber-200/60"
                        : "bg-rose-50 text-rose-800 border border-rose-200/60"
                    }`}
                  >
                    Condition: {building.condition}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-medium">
                    {building.maintenanceStatus}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("health")}
                    className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Activity className="w-3 h-3 text-indigo-600" />
                    <span>Health Assessment</span>
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1.5">
                  {building.name}
                </h1>
                <p className="text-xs text-slate-600 mt-0.5 flex items-center flex-wrap gap-x-3 gap-y-1">
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {building.location.address}, {building.location.city}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Built {building.constructionDate}
                  </span>
                  <span className="font-mono font-medium text-slate-700">
                    {building.floors} Floors • {building.units} Units • {building.totalArea}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 shrink-0 self-start">
              <Link
                href={`/public/building/${building.passportId}`}
                target="_blank"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-md border border-slate-200 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-800" />
                <span>Public QR</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>

              <button
                type="button"
                onClick={copyPublicUrl}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-2 rounded-md border border-slate-300 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>{copied ? "Copied!" : "Share Link"}</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center space-x-1 overflow-x-auto text-xs font-medium">
            {[
              { id: "overview", label: "Civil Specs & Overview", icon: Layers },
              { id: "health", label: "Health Assessment", icon: Activity },
              { id: "inspections", label: `Inspections (${inspections.length})`, icon: FileCheck2 },
              { id: "defects", label: `Defects (${openDefectsCount} Open)`, icon: AlertTriangle },
              { id: "maintenance", label: "Maintenance Ledger", icon: Wrench },
              { id: "documents", label: `Blueprints & Permits (${documents.length})`, icon: FileText },
              { id: "photos", label: `Photographs (${building.photographs.length})`, icon: Camera },
              { id: "qr", label: "Digital QR Passport", icon: QrCode },
              { id: "report", label: "Consolidated Dossier", icon: Printer },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-md transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-slate-900 text-white font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENT AREAS */}
        <div className="mt-6">
          {/* TAB 1: OVERVIEW & CIVIL SPECS */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Technical Specifications */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-slate-700" />
                    Structural & Civil Parameters
                  </h2>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50/70 rounded border border-slate-200/80">
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Structural Frame System</p>
                      <p className="font-semibold text-slate-900 mt-1">{building.structuralInfo.frameType}</p>
                    </div>
                    <div className="p-3 bg-slate-50/70 rounded border border-slate-200/80">
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Sub-Structure Foundation</p>
                      <p className="font-semibold text-slate-900 mt-1">{building.structuralInfo.foundation}</p>
                    </div>
                    <div className="p-3 bg-slate-50/70 rounded border border-slate-200/80">
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Seismic Zone Classification</p>
                      <p className="font-semibold text-slate-900 mt-1 font-mono">
                        {building.structuralInfo.seismicZone || "Standard Seismic Zone"}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50/70 rounded border border-slate-200/80">
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Fire Resistance Rating</p>
                      <p className="font-semibold text-slate-900 mt-1">{building.structuralInfo.fireRating}</p>
                    </div>
                    <div className="sm:col-span-2 p-3 bg-slate-50/70 rounded border border-slate-200/80">
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Exterior Cladding / Facade</p>
                      <p className="font-semibold text-slate-900 mt-1">{building.structuralInfo.exteriorCladding}</p>
                    </div>
                  </div>
                </div>

                {/* Building Narrative Description */}
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100">
                    Asset Usage & Civil Description
                  </h2>
                  <p className="mt-3 text-xs text-slate-700 leading-relaxed">
                    {building.description || "Official civil infrastructure record registered with digital passport telemetry."}
                  </p>
                </div>
              </div>

              {/* Stakeholders (Builder & Protected Owner) */}
              <div className="space-y-6">
                {/* Builder Card */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs text-xs">
                  <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-100">
                    <HardHat className="w-4 h-4 text-slate-700" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Lead Contractor & Builder
                    </h2>
                  </div>
                  <div className="space-y-2 text-slate-700">
                    <div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Firm / Entity</p>
                      <p className="font-semibold text-slate-900">{building.builder.companyName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Engineer in Charge</p>
                      <p className="font-medium text-slate-800">{building.builder.builderName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Contact / RERA</p>
                      <p className="font-mono text-slate-700">{building.builder.contact || "Registered CPWD"}</p>
                    </div>
                  </div>
                </div>

                {/* Owner Card (Confidential) */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs text-xs">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-slate-700" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Property Ownership
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                      Protected Record
                    </span>
                  </div>
                  <div className="space-y-2 text-slate-700">
                    <div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Registered Holder</p>
                      <p className="font-semibold text-slate-900">{building.owner?.name || "Private Ownership"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Official Phone</p>
                      <p className="font-mono text-slate-700">{building.owner?.contact || "Confidential"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Email Contact</p>
                      <p className="font-mono text-slate-700">{building.owner?.email || "Confidential"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INSPECTIONS */}
          {activeTab === "inspections" && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Civil & Structural Audits</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official inspection reports certified by licensed structural auditors.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(true)}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-md shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log New Inspection</span>
                </button>
              </div>

              {inspections.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No structural audits logged for this building yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {inspections.map((insp) => (
                    <div
                      key={insp.id}
                      className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 text-xs text-slate-700"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200/60">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900">{insp.inspectionId}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-semibold text-slate-800">{insp.inspectorName}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500">Date: {insp.date}</span>
                      </div>
                      <div className="space-y-2 mt-2">
                        <div>
                          <p className="font-semibold text-slate-800">Observations:</p>
                          <p className="text-slate-600 mt-0.5 leading-relaxed">{insp.observations}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">Engineering Remarks & Recommendations:</p>
                          <p className="text-slate-600 mt-0.5 leading-relaxed">{insp.remarks}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEFECTS */}
          {activeTab === "defects" && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Structural & Facade Defect Registry</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Categorized defects, locations, severity ratings, and remediation status tracking.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDefectModal(true)}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-md shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log New Defect</span>
                </button>
              </div>

              {defects.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  Zero active defects registered. Building condition is optimal.
                </div>
              ) : (
                <div className="space-y-3">
                  {defects.map((def) => (
                    <div
                      key={def.id}
                      className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900">{def.defectId}</span>
                          <span
                            className={`font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                              def.severity === "Critical"
                                ? "bg-rose-100 text-rose-800"
                                : def.severity === "High"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            Severity: {def.severity}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">•</span>
                          <span className="font-medium text-slate-700">{def.category}</span>
                        </div>
                        <p className="text-slate-800 font-medium">{def.details}</p>
                        <p className="text-[11px] text-slate-500 font-mono">Location: {def.location}</p>
                      </div>

                      {/* Status / Remediation Toggle */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <span
                          className={`font-mono text-[11px] font-semibold uppercase px-2.5 py-1 rounded border ${
                            def.status === "Remediated" || def.status === "Closed"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {def.status}
                        </span>

                        {def.status !== "Closed" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateDefectStatus(
                                def.id,
                                def.status === "Open" ? "In Review" : "Remediated"
                              )
                            }
                            className="px-2.5 py-1 text-[11px] uppercase font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
                          >
                            Mark {def.status === "Open" ? "In Review" : "Remediated"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MAINTENANCE LEDGER */}
          {activeTab === "maintenance" && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Maintenance & Repair Ledger</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track completed repairs, contractor guarantees, and cumulative expenditure.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-[10px] font-mono uppercase text-slate-500">Cumulative Outlay</p>
                    <p className="text-sm font-bold font-mono text-slate-900">
                      ₹{totalCost.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMaintenanceModal(true)}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-md shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Maintenance</span>
                  </button>
                </div>
              </div>

              {maintenance.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No maintenance records logged yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Work Description</th>
                        <th className="py-2.5 px-3">Contractor</th>
                        <th className="py-2.5 px-3">Cost (INR)</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {maintenance.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3 font-mono text-slate-900 whitespace-nowrap">{m.repairDate}</td>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-slate-900">{m.repairType}</p>
                            <p className="text-slate-500 text-[11px]">{m.description}</p>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-800">{m.contractor}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹{m.cost.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BLUEPRINTS & DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Architectural Blueprints & Permits</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Centralized civil documentation with role-based confidentiality rules.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDocModal(true)}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-md shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No documents or blueprints uploaded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-[10px] uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                            {doc.documentType}
                          </span>
                          {doc.isPrivate && (
                            <span className="font-mono text-[10px] uppercase bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                              Private / Confidential
                            </span>
                          )}
                        </div>
                        <h2 className="text-xs font-bold text-slate-900">{doc.title}</h2>
                        <p className="text-[11px] font-mono text-slate-500 mt-1 truncate">
                          {doc.originalFilename} ({(doc.fileSize / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </span>
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 font-semibold text-slate-900 hover:underline uppercase text-[11px] tracking-wider"
                          >
                            <Download className="w-3.5 h-3.5 mr-0.5" />
                            <span>Download / View</span>
                          </a>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-400">Indexed Record</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PHOTOGRAPHS */}
          {activeTab === "photos" && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Building Photographs & Telemetry</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Visual photographic registry across lifecycle stages.
                  </p>
                </div>
              </div>

              {building.photographs.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No photographic records on file.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {building.photographs.map((photo, i) => (
                    <div
                      key={i}
                      className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shadow-2xs group"
                    >
                      <div className="aspect-video relative overflow-hidden bg-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={photo.caption || "Building photograph"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3 text-xs">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase mb-1">
                          <span>{photo.category}</span>
                          <span>{new Date(photo.uploadedAt).toLocaleDateString()}</span>
                        </div>
                        <p className="font-medium text-slate-800 line-clamp-2">{photo.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: DIGITAL QR PASSPORT */}
          {activeTab === "qr" && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-2xs max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center justify-center p-3 rounded-xl bg-slate-900 text-white mb-4">
                <QrCode className="w-8 h-8 text-slate-100" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Official Civil Identity QR Code
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Scan this code to instantly access the verified public passport profile for this building asset.
              </p>

              {building.qrCodeDataUrl ? (
                <div className="mt-6 flex flex-col items-center">
                  <div className="p-4 bg-white border-2 border-slate-900 rounded-xl shadow-sm inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={building.qrCodeDataUrl}
                      alt={`QR Code for ${building.passportId}`}
                      className="w-56 h-56 mx-auto"
                    />
                  </div>

                  <div className="mt-4 font-mono text-sm font-bold text-slate-900 bg-slate-100 border border-slate-200 px-3 py-1 rounded">
                    Passport ID: {building.passportId}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href={building.qrCodeDataUrl}
                      download={`${building.passportId}_QR.png`}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-md shadow-xs transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download QR (PNG)</span>
                    </a>

                    <Link
                      href={`/public/building/${building.passportId}`}
                      target="_blank"
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-md border border-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Public Verification Page</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-500">
                  Generating high-resolution QR telemetry...
                </div>
              )}
            </div>
          )}

          {/* TAB 8: CONSOLIDATED REPORT / DOSSIER */}
          {activeTab === "report" && (
            <div className="bg-white border border-slate-300 rounded-lg p-8 shadow-sm print:border-none print:shadow-none max-w-4xl mx-auto">
              <div className="flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-900">
                <div>
                  <span className="text-[10px] font-mono uppercase bg-slate-900 text-white px-2 py-0.5 rounded font-bold">
                    Official Civil Registry Document
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
                    Building Passport Structural Dossier
                  </h2>
                  <p className="text-xs font-mono text-slate-500">
                    Document Ref: BP-REP-{building.passportId}-{new Date().getFullYear()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-md shadow-xs print:hidden"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Dossier</span>
                </button>
              </div>

              {/* Summary Stats Table */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded text-xs text-center mb-6">
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Total Audits</p>
                  <p className="text-lg font-bold font-mono text-slate-900">{inspections.length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Open Defects</p>
                  <p className="text-lg font-bold font-mono text-slate-900">{openDefectsCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Civil Outlay</p>
                  <p className="text-lg font-bold font-mono text-slate-900">₹{totalCost.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Blueprints</p>
                  <p className="text-lg font-bold font-mono text-slate-900">{documents.length}</p>
                </div>
              </div>

              <div className="space-y-6 text-xs text-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 uppercase font-mono border-b border-slate-200 pb-1 mb-2">
                    1. Identity & Structural Classification
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <p><strong>Building Name:</strong> {building.name}</p>
                    <p><strong>Passport ID:</strong> {building.passportId}</p>
                    <p><strong>Classification:</strong> {building.type}</p>
                    <p><strong>Built:</strong> {building.constructionDate}</p>
                    <p><strong>Address:</strong> {building.location.address}, {building.location.city}</p>
                    <p><strong>Area:</strong> {building.totalArea} ({building.floors} Floors, {building.units} Units)</p>
                    <p><strong>Frame System:</strong> {building.structuralInfo.frameType}</p>
                    <p><strong>Foundation:</strong> {building.structuralInfo.foundation}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 uppercase font-mono border-b border-slate-200 pb-1 mb-2">
                    2. Certified Inspection Log
                  </h3>
                  {inspections.map((insp) => (
                    <div key={insp.id} className="mb-2 pb-2 border-b border-slate-100 text-[11px]">
                      <p><strong>{insp.inspectionId} ({insp.date})</strong> — Inspector: {insp.inspectorName}</p>
                      <p className="text-slate-600 mt-0.5">{insp.observations}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 uppercase font-mono border-b border-slate-200 pb-1 mb-2">
                    3. Defect & Remediation Schedule
                  </h3>
                  {defects.map((def) => (
                    <div key={def.id} className="mb-2 text-[11px] flex justify-between">
                      <span><strong>{def.defectId}</strong> [{def.severity}]: {def.details}</span>
                      <span className="font-mono font-semibold uppercase">{def.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: CIVIL HEALTH ASSESSMENT */}
          {activeTab === "health" && (
            <BuildingHealthSection building={building} />
          )}
        </div>
      </main>

      {/* MODAL: LOG INSPECTION */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900 mb-1">Record Structural Inspection</h2>
            <p className="text-slate-500 mb-4 text-[11px]">
              Certified audit entry by licensed civil engineering auditor.
            </p>

            <form onSubmit={handleAddInspection} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Inspection Date</label>
                <input
                  type="date"
                  required
                  value={inspectionForm.date}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Observations & Measurements</label>
                <textarea
                  required
                  rows={3}
                  value={inspectionForm.observations}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, observations: e.target.value })}
                  placeholder="Record ultrasonic deflection, column visual status, crack widths..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Engineering Remarks</label>
                <textarea
                  required
                  rows={3}
                  value={inspectionForm.remarks}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, remarks: e.target.value })}
                  placeholder="Remedial actions recommended or compliance statement..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className="px-3 py-2 border border-slate-300 text-slate-700 rounded font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 text-white rounded font-semibold uppercase tracking-wider disabled:opacity-50"
                >
                  {submitting ? "Recording..." : "Save Audit Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG DEFECT */}
      {showDefectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900 mb-1">Log Structural Defect</h2>
            <p className="text-slate-500 mb-4 text-[11px]">
              Identify and categorize structural, water seepage, or facade anomalies.
            </p>

            <form onSubmit={handleAddDefect} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={defectForm.category}
                    onChange={(e) => setDefectForm({ ...defectForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                  >
                    <option value="Structural Surface">Structural Surface</option>
                    <option value="Waterproofing">Waterproofing & Seepage</option>
                    <option value="Facade Anchorage">Facade Anchorage</option>
                    <option value="Foundation Settlement">Foundation Settlement</option>
                    <option value="Corrosion / Rebar">Corrosion / Rebar Spalling</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Severity</label>
                  <select
                    value={defectForm.severity}
                    onChange={(e) => setDefectForm({ ...defectForm, severity: e.target.value as DefectSeverity })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                  >
                    <option value="Low">Low (Superficial)</option>
                    <option value="Medium">Medium (Maintenance)</option>
                    <option value="High">High (Prompt Attention)</option>
                    <option value="Critical">Critical (Immediate Hazard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Grid Location / Zone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basement B1, Column C-04 or Terrace East Coping"
                  value={defectForm.location}
                  onChange={(e) => setDefectForm({ ...defectForm, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Defect Description</label>
                <textarea
                  required
                  rows={3}
                  value={defectForm.details}
                  onChange={(e) => setDefectForm({ ...defectForm, details: e.target.value })}
                  placeholder="Describe crack length, seepage trace, surface spalling..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDefectModal(false)}
                  className="px-3 py-2 border border-slate-300 text-slate-700 rounded font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 text-white rounded font-semibold uppercase tracking-wider disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Log Defect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG MAINTENANCE */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900 mb-1">Record Civil Maintenance / Repair</h2>
            <p className="text-slate-500 mb-4 text-[11px]">
              Document completed repair work, contractor accountability, and expense.
            </p>

            <form onSubmit={handleAddMaintenance} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Repair Classification</label>
                  <input
                    type="text"
                    required
                    value={maintenanceForm.repairType}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, repairType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Completion Date</label>
                  <input
                    type="date"
                    required
                    value={maintenanceForm.repairDate}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, repairDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Cost (INR)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={maintenanceForm.cost}
                    onChange={(e) =>
                      setMaintenanceForm({ ...maintenanceForm, cost: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Contractor / Firm</label>
                  <input
                    type="text"
                    required
                    value={maintenanceForm.contractor}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, contractor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Repair Description</label>
                <textarea
                  required
                  rows={3}
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  placeholder="Specific scope of repair, chemical specifications, membrane layer..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="px-3 py-2 border border-slate-300 text-slate-700 rounded font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 text-white rounded font-semibold uppercase tracking-wider disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Record Repair"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD DOCUMENT */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900 mb-1">Upload Civil Document / Blueprint</h2>
            <p className="text-slate-500 mb-4 text-[11px]">
              Index architectural CAD drawings, structural calculations, or municipal NOCs.
            </p>

            <form onSubmit={handleUploadDocument} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Floor Plan Rev 3 (PDF)"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Classification Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono"
                >
                  <option value="blueprint">Architectural Floor Plan / Blueprint</option>
                  <option value="structural">Structural Calculation Dossier</option>
                  <option value="permit">Municipal Permit / Occupancy Certificate</option>
                  <option value="report">Geotechnical / Soil Investigation Report</option>
                  <option value="other">Other Official Record</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Attach File</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="docPrivate"
                  checked={docPrivate}
                  onChange={(e) => setDocPrivate(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="docPrivate" className="font-semibold text-slate-700">
                  Mark as Confidential (Restricted from Public QR Scanners)
                </label>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-3 py-2 border border-slate-300 text-slate-700 rounded font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !docFile}
                  className="px-4 py-2 bg-slate-900 text-white rounded font-semibold uppercase tracking-wider disabled:opacity-50"
                >
                  {submitting ? "Uploading..." : "Upload & Index"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
