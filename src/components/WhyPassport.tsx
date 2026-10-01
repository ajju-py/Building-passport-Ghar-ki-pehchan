"use client";

import {
  AlertCircle,
  CheckCircle,
  FileX,
  Database,
  History,
  Share2,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  FolderLock,
  QrCode,
  Layers,
} from "lucide-react";

export default function WhyPassport() {
  const problems = [
    {
      title: "Scattered Across Formats",
      desc: "Architectural blueprints, structural calculations, and receipts are dispersed across emails, hard drives, and fragmented filing cabinets.",
      icon: FileX,
    },
    {
      title: "Stored in Physical Binders",
      desc: "Paper inspection logs and permits degrade physically over time, risking catastrophic loss in the event of water or fire damage.",
      icon: FolderLock,
    },
    {
      title: "Difficult to Access on Demand",
      desc: "Engineers, emergency crews, and safety inspectors cannot access vital structural specs immediately during critical decisions.",
      icon: ShieldAlert,
    },
    {
      title: "Difficult to Update Continuously",
      desc: "Ad-hoc alterations and structural repairs go undocumented without a standardized, living lifecycle ledger.",
      icon: RefreshCw,
    },
    {
      title: "Difficult to Track Over Decades",
      desc: "Aging curves, recurring structural defects, and repair histories get lost as decades pass without longitudinal analytics.",
      icon: History,
    },
    {
      title: "Disconnected Between Stakeholders",
      desc: "Builders, consecutive owners, facility managers, and civil authorities operate in isolation with zero shared context.",
      icon: Share2,
    },
  ];

  const solutions = [
    {
      title: "Single Centralized Identity",
      desc: "Every record, drawing, and permit is tied directly to one immutable Building Passport ID (e.g., BP-2026-00125).",
      icon: Database,
    },
    {
      title: "Permanent Digital Archive",
      desc: "ISO 19650 compliant digital preservation keeps civil records auditable, intact, and immune to physical deterioration.",
      icon: Layers,
    },
    {
      title: "Instant QR-Based Verification",
      desc: "Physical on-site QR plates allow authorized stakeholders to access critical specifications in seconds from any device.",
      icon: QrCode,
    },
    {
      title: "Continuous Lifecycle Logging",
      desc: "Standardized workflow enables inspectors and contractors to log completed repairs, defects, and observations seamlessly.",
      icon: CheckCircle,
    },
    {
      title: "Decadal Historical Continuity",
      desc: "Chronological audit trail preserves the building's lineage through every renovation, inspection, and maintenance cycle.",
      icon: Sparkles,
    },
    {
      title: "Frictionless Ownership Transfer",
      desc: "Complete digital handover ensures incoming property owners and maintenance teams inherit 100% verified historical knowledge.",
      icon: RefreshCw,
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
            Building documentation is traditionally fragmented, paper-bound, and lost during handovers. Building Passport replaces document decay with continuous, centralized digital identity.
          </p>
        </div>

        {/* Problem → Solution Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          
          {/* PROBLEM SIDE */}
          <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-6 border-b border-slate-200 pb-4">
                <div className="w-8 h-8 rounded bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200 shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-700" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                    The Problem: Traditional Fragmentation
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">SCATTERED, PHYSICAL &amp; DISCONNECTED</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {problems.map((prob) => {
                  const Icon = prob.icon;
                  return (
                    <div key={prob.title} className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200/80 flex items-start space-x-3.5 shadow-2xs">
                      <div className="w-7 h-7 rounded bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
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
          </div>

          {/* SOLUTION SIDE */}
          <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 border border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-6 border-b border-slate-800 pb-4">
                <div className="w-8 h-8 rounded bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800 shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                    The Solution: Building Passport
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">UNIFIED CIVIL DATA PLATFORM</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {solutions.map((sol) => {
                  const Icon = sol.icon;
                  return (
                    <div key={sol.title} className="bg-slate-950/70 p-3.5 sm:p-4 rounded-lg border border-slate-800 flex items-start space-x-3.5">
                      <div className="w-7 h-7 rounded bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
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

      </div>
    </section>
  );
}
