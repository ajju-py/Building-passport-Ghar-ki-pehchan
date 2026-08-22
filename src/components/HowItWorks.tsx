"use client";

import { useState } from "react";
import { Building, QrCode, Layers, ShieldCheck, Wrench, Activity, LayoutDashboard, ChevronRight, Check } from "lucide-react";

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: "01",
      title: "Register Building",
      tag: "INITIALIZATION",
      desc: "Input fundamental building metadata including physical address, construction date, usage category, and gross built-up area.",
      icon: Building,
      details: ["Geolocation coordinates", "Primary classification", "Owner/developer identification"],
    },
    {
      num: "02",
      title: "Create Building Passport",
      tag: "IDENTITY GEN",
      desc: "System generates a unique, immutable Building Passport ID (e.g. BP-2026-00125) and associated scannable QR token.",
      icon: QrCode,
      details: ["Unique civil hash identity", "Physical scannable QR plate spec", "Encrypted document vault token"],
    },
    {
      num: "03",
      title: "Add Building Information",
      tag: "SPECIFICATION",
      desc: "Upload architectural floor plans, structural engineering calculations, material specifications, and safety certificates.",
      icon: Layers,
      details: ["CAD/BIM drawing attachment", "Concrete grade & foundation type", "MEP & utility schematics"],
    },
    {
      num: "04",
      title: "Inspection & Defect Recording",
      tag: "AUDIT LOGS",
      desc: "Civil engineers and certified inspectors log structural observations, defect photos, severity tags, and remediation notes.",
      icon: ShieldCheck,
      details: ["High-res photo upload with geotags", "Severity classification scale", "Inspector signature timestamp"],
    },
    {
      num: "05",
      title: "Maintenance Management",
      tag: "LIFECYCLE OPS",
      desc: "Track completed structural repairs, scheduled maintenance contracts, contractor contacts, and expenditure history.",
      icon: Wrench,
      details: ["Completed repair receipts", "Scheduled waterproofing checks", "Contractor warranty terms"],
    },
    {
      num: "06",
      title: "Health Assessment",
      tag: "DIAGNOSTICS",
      desc: "System compiles historical audits, material aging curves, and inspection logs into an integrated structural health assessment.",
      icon: Activity,
      details: ["Overall health index score", "Corrosion & water damage risk", "Priority repair timeline"],
    },
    {
      num: "07",
      title: "Dashboard & Reports",
      tag: "EXECUTIVE DATA",
      desc: "Generate comprehensive civil compliance reports, export PDF passports, and view real-time building condition dashboards.",
      icon: LayoutDashboard,
      details: ["1-Click official PDF export", "Asset valuation metrics", "Stakeholder access permissions"],
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-md mb-4 shadow-2xs">
            <span>03 // OPERATIONAL WORKFLOW</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            How Building Passport Works
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            A standardized 7-phase civil workflow that transforms raw construction documents into a living digital passport.
          </p>
        </div>

        {/* Horizontal Desktop Step Bar / Vertical Mobile Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Step Selector */}
          <div className="lg:col-span-5 space-y-2">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              return (
                <button
                  key={step.num}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-1 rounded ${
                        isActive ? "bg-slate-800 text-emerald-400" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {step.num}
                    </span>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider block leading-snug">
                        {step.title}
                      </span>
                      <span className={`text-[10px] font-mono ${isActive ? "text-slate-400" : "text-slate-500"}`}>
                        {step.tag}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Active Step Showcase */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  {(() => {
                    const ActiveIcon = steps[activeStep].icon;
                    return <ActiveIcon className="w-5 h-5 text-emerald-400" />;
                  })()}
                </div>
                <div>
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
                    PHASE {steps[activeStep].num} OF 07
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {steps[activeStep].title}
                  </h3>
                </div>
              </div>
              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded border border-slate-200">
                {steps[activeStep].tag}
              </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {steps[activeStep].desc}
            </p>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/80 mb-6">
              <h4 className="text-xs font-mono font-semibold uppercase text-slate-700 mb-3 tracking-wider">
                CORE INPUTS & DELIVERABLES:
              </h4>
              <ul className="space-y-2">
                {steps[activeStep].details.map((item, i) => (
                  <li key={i} className="flex items-center space-x-2 text-xs text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                disabled={activeStep === 0}
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                className="text-xs font-mono uppercase font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none px-3 py-1.5 rounded border border-slate-200"
              >
                ← PREV STEP
              </button>
              <span className="text-xs font-mono text-slate-400">
                {activeStep + 1} / 7
              </span>
              <button
                disabled={activeStep === steps.length - 1}
                onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                className="text-xs font-mono uppercase font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none px-4 py-1.5 rounded"
              >
                NEXT STEP →
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
