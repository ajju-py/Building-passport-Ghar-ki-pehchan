"use client";

import { UserCheck, Building2, ShieldCheck, FileText, Wrench, AlertTriangle, Activity, MapPin, Ruler, Layers } from "lucide-react";

export default function WhatIsPassport() {
  const comparisonItems = [
    {
      human: "Individual Identity & Full Name",
      building: "Building Passport ID, Name & Location",
      icon: MapPin,
    },
    {
      human: "Date & Place of Birth",
      building: "Construction Year & Engineering Specs",
      icon: Building2,
    },
    {
      human: "Travel & Visa History",
      building: "Owner, Occupancy & Renovation History",
      icon: Layers,
    },
    {
      human: "Medical & Health Records",
      building: "Structural Health, Defects & Inspections",
      icon: Activity,
    },
    {
      human: "Official Government Stamps",
      building: "Certificates, Permits & Architectural Drawings",
      icon: FileText,
    },
  ];

  const dataScopeModules = [
    { label: "Building Identity", desc: "Passport ID, location, building name & primary classification", icon: Building2 },
    { label: "Construction Details", desc: "Builder identity, structural materials, foundation & year", icon: Ruler },
    { label: "Architectural Plans", desc: "Structural drawings, floor plans, MEP layouts & CAD files", icon: Layers },
    { label: "Document Registry", desc: "Occupancy permits, safety compliance & environmental certifications", icon: FileText },
    { label: "Inspection Records", desc: "Periodic civil audit logs, official inspector notes & findings", icon: ShieldCheck },
    { label: "Defect Tracking", desc: "Active structural/cosmetic defect logs with severity flags", icon: AlertTriangle },
    { label: "Repairs & Maintenance", desc: "Historic maintenance logs, contractor details & repair costs", icon: Wrench },
    { label: "Health Assessment", desc: "Integrated condition score & future risk decision support", icon: Activity },
  ];

  return (
    <section id="what-is" className="py-20 md:py-28 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-md mb-4 shadow-2xs">
            <span>01 // CORE CONCEPT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            What is Building Passport?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Just like a human passport stores the verified identity, background, and travel history of a person, <span className="font-semibold text-slate-900">Building Passport</span> creates a single digital record of identity, structural information, and complete lifecycle history for a building.
          </p>
        </div>

        {/* Human vs Building Passport Comparison Visual */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 mb-16 shadow-xs">
          <div className="border-b border-slate-200 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 font-mono">
                CONCEPT ANALOGY // HUMAN PASSPORT VS. BUILDING PASSPORT
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Translating personal identity standards to civil infrastructure</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200 self-start sm:self-auto">
              PARALLEL MATRIX
            </span>
          </div>

          <div className="grid grid-cols-1 divide-y divide-slate-100">
            {comparisonItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-slate-50/70 px-3 rounded-lg transition-colors">
                  {/* Icon & Label */}
                  <div className="md:col-span-4 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wide">
                      PARAM 0{idx + 1}
                    </span>
                  </div>

                  {/* Human Passport */}
                  <div className="md:col-span-4 flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200/60">
                    <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                    <span><strong className="font-semibold text-slate-800">Human:</strong> {item.human}</span>
                  </div>

                  {/* Building Passport */}
                  <div className="md:col-span-4 flex items-center space-x-2 text-xs text-slate-900 bg-slate-900 text-white p-2.5 rounded border border-slate-800">
                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong className="font-semibold text-emerald-300">Building:</strong> {item.building}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Scope Modules Grid */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Comprehensive Civil Record Coverage
              </h3>
              <p className="text-xs text-slate-500 mt-1">The single source of truth for structural & operational intelligence</p>
            </div>
            <span className="text-xs font-mono text-slate-500 border border-slate-200 px-3 py-1 rounded bg-white hidden sm:block">
              8 CORE REPOSITORIES
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dataScopeModules.map((module, i) => {
              const Icon = module.icon;
              return (
                <div
                  key={i}
                  className="arch-card p-5 rounded-lg flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-md bg-slate-100 text-slate-900 flex items-center justify-center mb-4 border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                      MODULE 0{i + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">
                      {module.label}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {module.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span>STATUS</span>
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px] font-medium">READY</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
