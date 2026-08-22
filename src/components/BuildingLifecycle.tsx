"use client";

import { Compass, HardHat, Key, Search, Wrench, Hammer, ShieldCheck, ArrowRight } from "lucide-react";

export default function BuildingLifecycle() {
  const stages = [
    {
      phase: "01",
      name: "Design",
      tag: "ARCHITECTURAL",
      desc: "Initial BIM models, structural blueprints, material specs & zoning approvals recorded.",
      icon: Compass,
      status: "COMPLETED",
    },
    {
      phase: "02",
      name: "Construction",
      tag: "CIVIL ENGINEERING",
      desc: "Foundation concrete pours, steel reinforcement tests & builder sign-offs logged.",
      icon: HardHat,
      status: "COMPLETED",
    },
    {
      phase: "03",
      name: "Occupancy",
      tag: "HANDOVER",
      desc: "Occupancy certificate (OC) issued, initial owner records & warranty terms digitized.",
      icon: Key,
      status: "ACTIVE",
    },
    {
      phase: "04",
      name: "Inspection",
      tag: "AUDIT LOGS",
      desc: "Periodic structural audits, facade checks, crack monitoring & safety certifications.",
      icon: Search,
      status: "RECURRING",
    },
    {
      phase: "05",
      name: "Maintenance",
      tag: "OPERATIONS",
      desc: "HVAC servicing, elevator overhauls, roof waterproofing & preventive repairs.",
      icon: Wrench,
      status: "CONTINUOUS",
    },
    {
      phase: "06",
      name: "Renovation",
      tag: "ADAPTIVE REUSE",
      desc: "Interior fit-outs, structural retrofitting, solar installations & extension plans.",
      icon: Hammer,
      status: "ON-DEMAND",
    },
    {
      phase: "07",
      name: "Current Condition",
      tag: "REAL-TIME AUDIT",
      desc: "Live verified health index, active defect registry & future risk projections.",
      icon: ShieldCheck,
      status: "VERIFIED",
    },
  ];

  return (
    <section id="lifecycle" className="py-20 md:py-28 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-md mb-4 shadow-2xs">
            <span>04 // DECADAL CONTINUITY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            The Building Passport Lifecycle
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Building Passport accompanies a structure across decades of ownership, expanding organically with every inspection, renovation, and repair.
          </p>
        </div>

        {/* Timeline Visualization */}
        <div className="relative">
          {/* Horizontal Desktop Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 relative z-10">
            {stages.map((st, i) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.phase}
                  className="arch-card p-4 rounded-lg flex flex-col justify-between hover:border-slate-400 transition-all bg-white"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        P{st.phase}
                      </span>
                      <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        {st.status}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-emerald-400" />
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      {st.name}
                    </h3>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-2">
                      {st.tag}
                    </span>

                    <p className="text-[11px] text-slate-600 leading-normal">
                      {st.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>PASSPORT</span>
                    <span className="text-slate-700 font-semibold">+ LOGGED</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Supporting Narrative Footer */}
        <div className="mt-12 bg-slate-50 border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
            <p className="text-xs text-slate-700 font-medium">
              <strong className="text-slate-900">Zero Information Loss:</strong> Even after 50 years and 10 ownership changes, the building&apos;s complete structural lineage remains intact.
            </p>
          </div>
          <a
            href="#sample-record"
            className="text-xs font-mono font-semibold uppercase text-slate-900 hover:text-emerald-700 flex items-center space-x-1 shrink-0"
          >
            <span>VIEW EXAMPLE PASSPORT</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </section>
  );
}
