"use client";

import { AlertCircle, CheckCircle, FileX, Database, History, Share2, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";

export default function WhyPassport() {
  const problems = [
    {
      title: "Fragmented Physical Documents",
      desc: "Architectural drawings and permits scattered across paper binders, forgotten USB drives, and legacy offices.",
      icon: FileX,
    },
    {
      title: "Broken Handover Between Owners",
      desc: "Critical structural histories and warranty records disappear whenever property ownership or management shifts.",
      icon: Share2,
    },
    {
      title: "Un-tracked Maintenance History",
      desc: "Previous repair details, material grades, and contractor specs are unrecorded, leading to repeated, costly errors.",
      icon: History,
    },
    {
      title: "Delayed Defect Remediation",
      desc: "Water leakage, concrete spalling, or structural cracks are discovered late without historic progression records.",
      icon: ShieldAlert,
    },
  ];

  const solutions = [
    {
      title: "Single Centralized Identity",
      desc: "Every detail linked to one immutable Building Passport ID, accessible instantly via secure digital identity.",
      icon: Database,
    },
    {
      title: "Seamless Transfer of Ownership",
      desc: "Complete digital handover ensures new owners, auditors, and civil engineers inherit 100% verified historical context.",
      icon: RefreshCw,
    },
    {
      title: "Immutable Maintenance Log",
      desc: "Every repair, invoice, inspector note, and material spec is permanently logged in a chronological civil audit trail.",
      icon: CheckCircle,
    },
    {
      title: "Predictive Health & Risk Insights",
      desc: "Proactive tracking enables early detection of structural risks, saving money and preserving building longevity.",
      icon: Sparkles,
    },
  ];

  return (
    <section id="why-passport" className="py-20 md:py-28 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-md mb-4 shadow-2xs">
            <span>02 // INDUSTRY CHALLENGE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Why Building Passport?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Civil engineering assets lose up to 40% of their structural documentation during transfer. Building Passport solves document decay with continuous digital identity.
          </p>
        </div>

        {/* Problem → Solution Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* PROBLEM SIDE */}
          <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6 border-b border-slate-200 pb-4">
              <div className="w-8 h-8 rounded bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                  The Problem: Fragmented Systems
                </h3>
                <p className="text-xs text-slate-500 font-mono">TRADITIONAL CIVIL MANAGEMENT</p>
              </div>
            </div>

            <div className="space-y-4">
              {problems.map((prob, i) => {
                const Icon = prob.icon;
                return (
                  <div key={i} className="bg-white p-4 rounded-lg border border-slate-200/80 flex items-start space-x-3.5 shadow-2xs">
                    <div className="w-7 h-7 rounded bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{prob.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{prob.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SOLUTION SIDE */}
          <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 border border-slate-800 shadow-md">
            <div className="flex items-center space-x-3 mb-6 border-b border-slate-800 pb-4">
              <div className="w-8 h-8 rounded bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                  The Solution: Building Passport
                </h3>
                <p className="text-xs text-slate-400 font-mono">DIGITAL LIFECYCLE ARCHITECTURE</p>
              </div>
            </div>

            <div className="space-y-4">
              {solutions.map((sol, i) => {
                const Icon = sol.icon;
                return (
                  <div key={i} className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 flex items-start space-x-3.5">
                    <div className="w-7 h-7 rounded bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">{sol.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{sol.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
