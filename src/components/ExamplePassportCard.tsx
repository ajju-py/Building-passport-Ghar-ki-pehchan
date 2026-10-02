"use client";

import { useState, useEffect, useCallback } from "react";
import { QrCode, ShieldCheck, MapPin, FileText, X } from "lucide-react";

export default function ExamplePassportCard() {
  const [activeTab, setActiveTab] = useState<"overview" | "specs" | "maintenance" | "documents">("overview");
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const closeQrModal = useCallback(() => {
    setQrModalOpen(false);
  }, []);

  // Close QR modal on Escape key
  useEffect(() => {
    if (!qrModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeQrModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [qrModalOpen, closeQrModal]);

  const passportData = {
    id: "BP-2026-00125",
    name: "Green Heights",
    type: "Commercial & Residential Mixed-Use",
    constructionYear: "2018",
    floors: "8",
    builtUpArea: "42,500 sq.ft",
    condition: "Good",
    lastInspection: "June 2026",
    maintenanceStatus: "Up to Date",
    location: "425 Skyline Avenue, Sector 4, Civil District",
    builder: "Apex Civil Constructions & Structural Engineering Ltd.",
    owner: "Green Heights Owners Association",
    structuralType: "Reinforced Cement Concrete (RCC) Frame",
    foundation: "Deep Pile Foundation (M40 Grade Concrete)",
    healthScore: "92 / 100",
  };

  const repairs = [
    { date: "June 14, 2026", type: "Routine Inspection", desc: "Full structural audit & facade integrity check completed", status: "Passed", cost: "$1,200" },
    { date: "March 02, 2026", type: "Waterproofing Maintenance", desc: "Terrace elastomeric membrane recoating (1,200 sq.ft)", status: "Completed", cost: "$4,500" },
    { date: "Nov 18, 2025", type: "Elevator Service", desc: "Bi-annual traction motor overhaul & cable testing", status: "Completed", cost: "$2,800" },
  ];

  const documents = [
    { name: "Structural Engineering Certificate", format: "PDF", size: "3.4 MB", date: "2018-05-10" },
    { name: "Approved Floor & Elevation Blueprint", format: "DWG / PDF", size: "18.2 MB", date: "2017-11-22" },
    { name: "Fire Safety & Occupancy Certificate (OC)", format: "PDF", size: "1.8 MB", date: "2018-06-01" },
    { name: "June 2026 Comprehensive Civil Audit Report", format: "PDF", size: "5.1 MB", date: "2026-06-15" },
  ];

  return (
    <section id="sample-record" className="py-20 md:py-28 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-md mb-4 shadow-2xs">
            <span>05 // INTERACTIVE DEMONSTRATION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Example Building Passport
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Inspect a live demonstration mockup of an active Building Passport record.
          </p>
        </div>

        {/* Master Passport Card Shell */}
        <div className="max-w-4xl mx-auto bg-white border border-slate-300 rounded-xl shadow-md overflow-hidden">
          
          {/* Card Header (Passport Header) */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 relative border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              {/* Brand & ID */}
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 mb-1">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span className="uppercase tracking-widest font-bold">DIGITAL CIVIL IDENTITY RECORD</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {passportData.name}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-1 flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>{passportData.location}</span>
                </p>
              </div>

              {/* ID Badge & QR trigger */}
              <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-center gap-2 bg-slate-850 p-3 rounded-lg border border-slate-700/80">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">PASSPORT ID</span>
                  <span className="text-base font-mono font-bold text-emerald-400 tracking-wider">
                    {passportData.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setQrModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 text-[11px] font-mono bg-emerald-950 text-emerald-300 hover:bg-emerald-900 px-2.5 py-1 rounded border border-emerald-700/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  aria-label="Scan or preview QR token modal"
                >
                  <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>SCAN QR TOKEN</span>
                </button>
              </div>

            </div>

            {/* Quick Metrics Bar required by specification */}
            <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">CONSTRUCTION</span>
                <span className="font-semibold text-slate-100 font-mono text-sm">{passportData.constructionYear}</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">FLOORS</span>
                <span className="font-semibold text-slate-100 font-mono text-sm">{passportData.floors}</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">BUILT-UP AREA</span>
                <span className="font-semibold text-slate-100 font-mono text-sm">{passportData.builtUpArea}</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">CONDITION</span>
                <span className="font-semibold text-emerald-400 font-mono text-sm">{passportData.condition}</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">LAST INSPECTION</span>
                <span className="font-semibold text-slate-100 font-mono text-sm">{passportData.lastInspection}</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">MAINTENANCE</span>
                <span className="font-semibold text-emerald-400 font-mono text-sm">{passportData.maintenanceStatus}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div
            role="tablist"
            aria-label="Passport Sections"
            className="bg-slate-100 border-b border-slate-200 px-6 flex space-x-1 overflow-x-auto"
          >
            {[
              { id: "overview", label: "01. Passport Summary" },
              { id: "specs", label: "02. Civil Specifications" },
              { id: "maintenance", label: "03. Repair & Maintenance Log" },
              { id: "documents", label: "04. Blueprints & Documents" },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-3 text-xs font-mono font-bold uppercase border-b-2 transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                  activeTab === tab.id
                    ? "border-slate-900 text-slate-900 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Area */}
          <div className="p-6 sm:p-8">
            {activeTab === "overview" && (
              <div
                role="tabpanel"
                id="panel-overview"
                aria-labelledby="tab-overview"
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-500 mb-3">BUILDER &amp; OWNER ENTITIES</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Builder:</span>
                        <span className="font-semibold text-slate-900 text-right">{passportData.builder}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Owner Entity:</span>
                        <span className="font-semibold text-slate-900 text-right">{passportData.owner}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Building Use:</span>
                        <span className="font-semibold text-slate-900 text-right">{passportData.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-500 mb-3">CIVIL HEALTH SUMMARY</h4>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-600">Calculated Structural Health</span>
                      <span className="text-lg font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {passportData.healthScore}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Building demonstrates zero active critical defects. Routine facade sealant recoating scheduled for upcoming maintenance cycle.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900 text-white p-4 rounded-lg gap-3">
                  <div className="flex items-center space-x-3">
                    <QrCode className="w-6 h-6 text-emerald-400 shrink-0" aria-hidden="true" />
                    <div>
                      <div className="text-xs font-bold font-mono">SCANNABLE CIVIL PASSPORT TAG ATTACHED</div>
                      <div className="text-[11px] text-slate-300">Physical QR plate mounted at main structural entrance</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQrModalOpen(true)}
                    className="text-xs font-mono uppercase bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded transition-colors self-end sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    PREVIEW PLATE
                  </button>
                </div>
              </div>
            )}

            {activeTab === "specs" && (
              <div
                role="tabpanel"
                id="panel-specs"
                aria-labelledby="tab-specs"
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">STRUCTURAL FRAME</span>
                    <span className="font-bold text-slate-900 text-sm block mt-1">{passportData.structuralType}</span>
                    <span className="text-slate-500 text-[11px] mt-1 block">Designed to withstand Seismic Zone IV parameters</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">FOUNDATION SPECIFICATION</span>
                    <span className="font-bold text-slate-900 text-sm block mt-1">{passportData.foundation}</span>
                    <span className="text-slate-500 text-[11px] mt-1 block">Depth: 18.5 meters below ground level</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">EXTERIOR CLADDING</span>
                    <span className="font-bold text-slate-900 text-sm block mt-1">Double Glazed Curtain Wall &amp; Terracotta</span>
                    <span className="text-slate-500 text-[11px] mt-1 block">Thermal transmittance U-value: 1.4 W/m²K</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">FIRE RATING</span>
                    <span className="font-bold text-slate-900 text-sm block mt-1">2-Hour Structural Fire Resistance</span>
                    <span className="text-slate-500 text-[11px] mt-1 block">Intumescent coated structural steel joints</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "maintenance" && (
              <div
                role="tabpanel"
                id="panel-maintenance"
                aria-labelledby="tab-maintenance"
                className="space-y-3"
              >
                <h4 className="text-xs font-mono font-bold uppercase text-slate-500 mb-2">CHRONOLOGICAL AUDIT TRAIL</h4>
                {repairs.map((item) => (
                  <div key={item.date} className="bg-slate-50 p-3.5 rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{item.type}</span>
                        <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">{item.date}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{item.desc}</p>
                    </div>
                    <div className="flex items-center space-x-3 text-right">
                      <span className="font-mono text-slate-500 font-semibold">{item.cost}</span>
                      <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "documents" && (
              <div
                role="tabpanel"
                id="panel-documents"
                aria-labelledby="tab-documents"
                className="space-y-3"
              >
                <h4 className="text-xs font-mono font-bold uppercase text-slate-500 mb-2">VERIFIED ATTACHED ARCHIVE</h4>
                {documents.map((doc) => (
                  <div key={doc.name} className="bg-slate-50 p-3 rounded border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
                      <div>
                        <div className="font-bold text-slate-900">{doc.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{doc.format} • {doc.size} • Uploaded {doc.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-1 rounded">VERIFIED RECORD</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-[11px] font-mono text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <span>DEMONSTRATION RECORD // INTERACTIVE PREVIEW</span>
            <span className="text-slate-700">SAMPLE CIVIL PASSPORT IDENTIFIER</span>
          </div>

        </div>

      </div>

      {/* QR Code Modal Mockup */}
      {qrModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
          onClick={closeQrModal}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-300 rounded-xl max-w-sm w-full p-6 text-center shadow-xl relative animate-in zoom-in-95 duration-150"
          >
            <button
              type="button"
              onClick={closeQrModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 id="qr-modal-title" className="text-base font-bold text-slate-900 uppercase font-mono mb-1">
              Physical Passport Tag
            </h3>
            <p className="text-xs text-slate-500 mb-4">Mountable QR identity plate for building entrance</p>
            
            {/* Visual QR Code box */}
            <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 inline-block mb-4">
              <div className="w-36 h-36 bg-white p-2 rounded flex flex-col items-center justify-center relative">
                <QrCode className="w-32 h-32 text-slate-900" aria-label="QR Code demonstration representing BP-2026-00125" />
              </div>
              <div className="mt-3 text-[11px] font-mono font-bold text-emerald-400">
                BP-2026-00125
              </div>
            </div>

            <div className="text-[11px] text-slate-600 bg-slate-100 p-2.5 rounded border border-slate-200 font-mono mb-4 text-left">
              <div>BUILDING: Green Heights</div>
              <div>LOCATION: 425 Skyline Avenue, Sector 4</div>
              <div>CLASSIFICATION: Demonstration Record</div>
            </div>

            <button
              type="button"
              onClick={closeQrModal}
              className="w-full text-xs font-mono font-bold uppercase bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              CLOSE PREVIEW
            </button>
          </div>
        </div>
      )}

    </section>
  );
}

