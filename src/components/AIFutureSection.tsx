"use client";

import { Sparkles, Brain, Cpu, Activity, ShieldAlert } from "lucide-react";

export default function AIFutureSection() {
  const analysisParameters = [
    "Building photographs & visual defect scans",
    "Construction age & historical degradation curves",
    "Defect records & crack progression monitoring",
    "Maintenance history & repair frequency",
    "Structural information & material specifications",
    "Inspection data & certified engineering notes",
  ];

  const riskCategories = [
    { name: "Structural Condition", value: "88 / 100", percentage: "88%", color: "bg-emerald-400", text: "text-emerald-400" },
    { name: "Maintenance Condition", value: "85 / 100", percentage: "85%", color: "bg-emerald-400", text: "text-emerald-400" },
    { name: "Water Damage Risk", value: "Moderate (34%)", percentage: "34%", color: "bg-amber-400", text: "text-amber-400" },
    { name: "Corrosion Risk", value: "Low (12%)", percentage: "12%", color: "bg-emerald-400", text: "text-emerald-400" },
    { name: "Repair Priority", value: "Normal (P3)", percentage: "25%", color: "bg-blue-400", text: "text-blue-400" },
    { name: "Overall Risk", value: "Low", percentage: "18%", color: "bg-emerald-400", text: "text-emerald-400" },
  ];

  return (
    <section id="ai-future" className="py-20 md:py-28 bg-slate-900 text-white relative overflow-hidden border-b border-slate-800">
      {/* Blueprint grid effect on dark background */}
      <div className="absolute inset-0 bg-blueprint opacity-60 pointer-events-none" aria-hidden="true"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-emerald-400 bg-slate-800/90 border border-slate-700 px-3.5 py-1.5 rounded-full mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 motion-safe:animate-spin" aria-hidden="true" />
            <span>INTELLIGENT CIVIL ANALYTICS // PREDICTIVE HEALTH ROADMAP</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            The Building Passport That Gets Smarter Over Time.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Future versions can analyze building photographs, construction age, defects, maintenance history, structural information, and inspection data to provide intelligent civil health insights.
          </p>
        </div>

        {/* AI Preview Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Data Analysis Pipeline Explanation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800 shrink-0">
                  <Brain className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                    Multi-Parameter Predictive Engine
                  </h3>
                  <p className="text-xs text-slate-400">Future capability / conceptual preview</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                By synthesizing material aging curves, historical inspection observations, and repair frequency, future models will generate automated risk indicators to guide proactive civil interventions.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 px-1">
                EVALUATED PARAMETERS (FUTURE CAPABILITY):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analysisParameters.map((param) => (
                  <div key={param} className="bg-slate-950/70 p-2.5 rounded border border-slate-800/80 flex items-center space-x-2 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden="true"></span>
                    <span>{param}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Engineering Disclaimer Notice required by specification */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex items-start space-x-3">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-[11px] text-slate-300 leading-normal">
                <strong className="text-white">Engineering Disclaimer:</strong> AI-assisted decision support is not a replacement for professional structural engineering inspection or certification.
              </p>
            </div>
          </div>

          {/* Right Column: Conceptual Output Card Mockup */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  AI Health Assessment // Conceptual Preview
                </span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                Future capability / conceptual preview
              </span>
            </div>

            {/* Master Score Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                  CONCEPTUAL CONDITION PREVIEW
                </span>
                <h4 className="text-xl font-bold text-white mt-0.5">
                  Building Health Score: 82/100
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Synthesized from 8-year repair history &amp; June 2026 inspection notes
                </p>
              </div>
              <div className="text-center bg-slate-950 px-6 py-3 rounded-lg border border-slate-800 shrink-0">
                <div className="text-3xl font-mono font-bold text-emerald-400">82 <span className="text-sm font-normal text-slate-500">/ 100</span></div>
                <div className="text-[10px] font-mono uppercase text-emerald-400 font-semibold mt-0.5">GOOD CONDITION</div>
              </div>
            </div>

            {/* Category Scores Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-xs">
              {riskCategories.map((cat) => (
                <div key={cat.name} className="bg-slate-900/90 p-3 rounded border border-slate-800">
                  <div className="flex justify-between text-slate-300 font-mono mb-1">
                    <span>{cat.name}</span>
                    <span className={`${cat.text} font-bold`}>{cat.value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden" aria-hidden="true">
                    <div className={`h-full ${cat.color}`} style={{ width: cat.percentage }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendation Callout required by specification */}
            <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-400 mb-1">
                <Activity className="w-4 h-4" aria-hidden="true" />
                <span>AI RECOMMENDATION ACTION</span>
              </div>
              <blockquote className="text-xs text-slate-200 italic font-mono">
                &ldquo;Recommended inspection: Roof waterproofing and affected structural areas.&rdquo;
              </blockquote>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
