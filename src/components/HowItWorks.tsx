"use client";

import { useState } from "react";
import {
  Building,
  QrCode,
  Layers,
  ShieldCheck,
  Wrench,
  Activity,
  LayoutDashboard,
  ChevronRight,
  Check,
} from "lucide-react";

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: "01",
      title: "Register Building",
      tag: "INITIALIZATION",
      desc: "Add basic building details including physical address, geolocation coordinates, construction year, usage classification, and gross built-up area.",
      icon: Building,
      details: [
        "Geolocation coordinates & cadastral reference",
        "Primary usage classification (residential/commercial)",
        "Owner, builder & developer entity identification",
      ],
    },
    {
      num: "02",
      title: "Create Building Passport",
      tag: "IDENTITY GEN",
      desc: "Generate a unique, immutable Building Passport ID (e.g., BP-2026-00125) and associated scannable QR token linking physical and digital domains.",
      icon: QrCode,
      details: [
        "Unique cryptographic civil record identifier",
        "Physical scannable QR entrance plate specification",
        "Zero-bloat public-record access token",
      ],
    },
    {
      num: "03",
      title: "Add Building Information",
      tag: "SPECIFICATION",
      desc: "Add structural, material, architectural plan, and document information. Upload BIM models, floor plans, and safety certifications.",
      icon: Layers,
      details: [
        "CAD/BIM blueprints & structural drawings",
        "Foundation engineering & concrete grade specs",
        "MEP, fire safety, and utility schematics",
      ],
    },
    {
      num: "04",
      title: "Inspection & Defect Recording",
      tag: "AUDIT LOGS",
      desc: "Record periodic inspections, structural defects, and engineer observations with geotagged photography and standardized severity classifications.",
      icon: ShieldCheck,
      details: [
        "Geotagged high-resolution defect documentation",
        "Standardized severity rating & crack monitoring",
        "Certified inspector signature and timestamp",
      ],
    },
    {
      num: "05",
      title: "Maintenance Management",
      tag: "LIFECYCLE OPS",
      desc: "Track completed repairs, scheduled maintenance contracts, contractor warranties, and historical civil maintenance expenditures.",
      icon: Wrench,
      details: [
        "Chronological repair invoices & receipts",
        "Preventive waterproofing and facade upkeep",
        "Contractor warranty terms & verification",
      ],
    },
    {
      num: "06",
      title: "Health Assessment",
      tag: "DIAGNOSTICS",
      desc: "Evaluate building condition, material aging curves, and risk factors into an integrated structural condition profile.",
      icon: Activity,
      details: [
        "Consolidated condition & health assessment",
        "Corrosion, moisture, and water penetration risk",
        "Prioritized remedial action recommendations",
      ],
    },
    {
      num: "07",
      title: "Dashboard & Reports",
      tag: "EXECUTIVE DATA",
      desc: "View building information, history, insights, and compliance reports with one-click civil documentation exports.",
      icon: LayoutDashboard,
      details: [
        "One-click official civil passport documentation",
        "Historical maintenance & audit timeline views",
        "Stakeholder access for buyers, auditors & engineers",
      ],
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
            A standardized seven-stage civil workflow that transforms raw construction documents and maintenance logs into an active, verifiable digital passport.
          </p>
        </div>

        {/* 7-Step Interactive Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Interactive Step Selector */}
          <div
            role="tablist"
            aria-label="Workflow Steps"
            className="lg:col-span-5 space-y-2"
          >
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              return (
                <button
                  key={step.num}
                  role="tab"
                  id={`step-tab-${step.num}`}
                  aria-selected={isActive}
                  aria-controls={`step-panel-${step.num}`}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-1 rounded flex items-center space-x-1.5 ${
                        isActive ? "bg-slate-800 text-emerald-400" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{step.num}</span>
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
                  <ChevronRight className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} aria-hidden="true" />
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Active Step Showcase */}
          <div
            role="tabpanel"
            id={`step-panel-${steps[activeStep].num}`}
            aria-labelledby={`step-tab-${steps[activeStep].num}`}
            className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs relative flex flex-col justify-between min-h-[440px]"
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                    {(() => {
                      const ActiveIcon = steps[activeStep].icon;
                      return <ActiveIcon className="w-5 h-5 text-emerald-400" aria-hidden="true" />;
                    })()}
                  </div>
                  <div>
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
                      STAGE {steps[activeStep].num} OF 07
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
                  CORE CAPABILITIES &amp; DELIVERABLES:
                </h4>
                <ul className="space-y-2">
                  {steps[activeStep].details.map((item) => (
                    <li key={item} className="flex items-center space-x-2 text-xs text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={activeStep === 0}
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                className="text-xs font-mono uppercase font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none px-3 py-1.5 rounded border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                ← PREV STEP
              </button>
              <span className="text-xs font-mono text-slate-500">
                {activeStep + 1} / 7
              </span>
              <button
                type="button"
                disabled={activeStep === steps.length - 1}
                onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                className="text-xs font-mono uppercase font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none px-4 py-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
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
