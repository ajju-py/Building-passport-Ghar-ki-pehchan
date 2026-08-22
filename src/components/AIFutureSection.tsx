"use client";

import { Sparkles, Brain, Cpu, AlertTriangle, ShieldCheck, Activity, Droplets, ShieldAlert, ArrowUpRight, Lock } from "lucide-react";

export default function AIFutureSection() {
  const analysisParameters = [
    "Building Photographs & Thermal Scans",
    "Construction Date & Material Aging",
    "Historical Defect Logs & Crack Depth",
    "Maintenance Frequency & Repair Records",
    "Structural Material Specs & Concrete Grade",
    "Environmental Exposure & Soil Conditions",
  ];

  return (
    <section id="ai-future" className="py-20 md:py-28 bg-slate-900 text-white relative overflow-hidden border-b border-slate-800">
      {/* Blueprint grid effect on dark background */}
      <div className="absolute inset-0 bg-blueprint opacity-60 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-emerald-400 bg-slate-800/90 border border-slate-700 px-3.5 py-1.5 rounded-full mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>STAGE 3 ROADMAP // INTELLIGENT DECISION SUPPORT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            The Building Passport That Gets Smarter Over Time.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Future iterations will introduce an AI health prediction engine—synthesizing decadal inspection data into proactive structural risk intelligence.
          </p>
        </div>

        {/* AI Preview Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Data Analysis Pipeline Explanation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                    MULTI-PARAMETER AI ENGINE
                  </h3>
                  <p className="text-xs text-slate-400">Future automated risk engine</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                By cross-referencing material degradation curves against geotagged defects and repair logs, the system calculates predictive health scores and flags hidden structural risks before they compound.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 px-1">
                EVALUATED PARAMETERS (FUTURE RELEASE):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analysisParameters.map((param, idx) => (
                  <div key={idx} className="bg-slate-950/70 p-2.5 rounded border border-slate-800/80 flex items-center space-x-2 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                    <span>{param}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer notice mandatory in prompt.txt */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex items-start space-x-3">
              <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-normal">
                <strong className="text-slate-200">Civil Engineering Note:</strong> AI prediction acts strictly as an assisted decision-support tool for facility managers and property owners—it does not replace certified structural engineering physical audits.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive AI Output Card Mockup */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  AI HEALTH PREDICTION OUTPUT // DEMO MOCKUP
                </span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                PROTOTYPE SPEC
              </span>
            </div>

            {/* Master Score Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                  PREDICTED OVERALL CONDITION
                </span>
                <h4 className="text-xl font-bold text-white mt-0.5">
                  Building Health Score
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Based on 8-year repair history & 2026 inspection notes
                </p>
              </div>
              <div className="text-center bg-slate-950 px-6 py-3 rounded-lg border border-slate-800">
                <div className="text-3xl font-mono font-bold text-emerald-400">82 <span className="text-sm font-normal text-slate-500">/ 100</span></div>
                <div className="text-[10px] font-mono uppercase text-emerald-400 font-semibold mt-0.5">LOW STRUCTURAL RISK</div>
              </div>
            </div>

            {/* Category Scores Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-xs">
              <div className="bg-slate-900/90 p-3 rounded border border-slate-800">
                <div className="flex justify-between text-slate-300 font-mono mb-1">
                  <span>Structural Condition</span>
                  <span className="text-emerald-400 font-bold">88 / 100</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-[88%]"></div>
                </div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded border border-slate-800">
                <div className="flex justify-between text-slate-300 font-mono mb-1">
                  <span>Maintenance Condition</span>
                  <span className="text-emerald-400 font-bold">85 / 100</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-[85%]"></div>
                </div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded border border-slate-800">
                <div className="flex justify-between text-slate-300 font-mono mb-1">
                  <span>Water Damage Risk</span>
                  <span className="text-amber-400 font-bold">Moderate (34%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 w-[34%]"></div>
                </div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded border border-slate-800">
                <div className="flex justify-between text-slate-300 font-mono mb-1">
                  <span>Corrosion Risk</span>
                  <span className="text-emerald-400 font-bold">Low (12%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-[12%]"></div>
                </div>
              </div>
            </div>

            {/* Recommendation Callout required by prompt.txt */}
            <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-400 mb-1">
                <Activity className="w-4 h-4" />
                <span>AI RECOMMENDATION ACTION</span>
              </div>
              <blockquote className="text-xs text-slate-200 italic font-mono">
                &ldquo;Recommended inspection: Roof waterproofing and affected structural areas prior to Q4 monsoon season.&rdquo;
              </blockquote>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
