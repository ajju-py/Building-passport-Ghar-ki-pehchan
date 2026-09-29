"use client";

import {
  ShieldCheck,
  Database,
  FileText,
  AlertTriangle,
  History,
  QrCode,
  Activity,
  Sparkles,
} from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      title: "Digital Building Identity",
      desc: "A unique digital identity for every building. Assigns an immutable, cryptographically verifiable civil record ID.",
      icon: ShieldCheck,
      stage: "Stage 1 Platform",
      future: false,
    },
    {
      title: "Complete Building Information",
      desc: "Keep important building information together. Consolidate structural materials, foundation specs, and entity registries.",
      icon: Database,
      stage: "Stage 2 Ready",
      future: false,
    },
    {
      title: "Plans & Documents",
      desc: "Store plans, reports and certificates. Securely catalog CAD/BIM blueprints, fire permits, and occupancy records.",
      icon: FileText,
      stage: "Stage 2 Ready",
      future: false,
    },
    {
      title: "Inspection & Defect Tracking",
      desc: "Record inspections and building issues. Civil engineers log observations, defect photos, and monitor crack progression.",
      icon: AlertTriangle,
      stage: "Stage 2 Ready",
      future: false,
    },
    {
      title: "Maintenance History",
      desc: "Track repairs and maintenance over time. Permanent chronological ledger of contractor repairs and scheduled servicing.",
      icon: History,
      stage: "Stage 2 Ready",
      future: false,
    },
    {
      title: "QR-Based Access",
      desc: "Quickly access a building passport. On-site scannable entrance plates provide authorized civil verification in seconds.",
      icon: QrCode,
      stage: "Stage 1 Spec",
      future: false,
    },
    {
      title: "Building Health Assessment",
      desc: "Understand current building condition. Synthesize audit logs and maintenance freshness into an objective health score.",
      icon: Activity,
      stage: "Stage 2 Ready",
      future: false,
    },
    {
      title: "AI-Assisted Risk Prediction",
      desc: "Future intelligent building-health analysis. Evaluates material degradation curves, thermal scans, and defect patterns.",
      icon: Sparkles,
      stage: "Coming in a future stage",
      future: true,
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-md mb-4 shadow-2xs">
            <span>06 // SYSTEM CAPABILITIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Key Features
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Eight core capabilities engineered for civil documentation integrity, structural longevity, and lifecycle transparency.
          </p>
        </div>

        {/* 8 Concise Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className={`arch-card p-6 rounded-xl flex flex-col justify-between relative transition-all ${
                  feat.future ? "bg-slate-900 text-white border-slate-800" : "bg-white text-slate-900"
                }`}
              >
                <div>
                  {/* Top Row: Icon + Stage Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                        feat.future
                          ? "bg-slate-800 text-emerald-400 border-slate-700"
                          : "bg-slate-100 text-slate-900 border-slate-200"
                      }`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        feat.future
                          ? "bg-emerald-950 text-emerald-300 border-emerald-700/80"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {feat.stage}
                    </span>
                  </div>

                  <h3 className={`text-base font-bold mb-2 ${feat.future ? "text-white" : "text-slate-900"}`}>
                    {feat.title}
                  </h3>

                  <p className={`text-xs leading-relaxed ${feat.future ? "text-slate-300" : "text-slate-600"}`}>
                    {feat.desc}
                  </p>
                </div>

                <div
                  className={`mt-6 pt-3 border-t text-[11px] font-mono flex items-center justify-between ${
                    feat.future ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-400"
                  }`}
                >
                  <span>FEATURE 0{idx + 1}</span>
                  {feat.future ? (
                    <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                      <span>FUTURE CAPABILITY</span>
                    </span>
                  ) : (
                    <span className="text-slate-700 font-medium">CORE SPEC</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

