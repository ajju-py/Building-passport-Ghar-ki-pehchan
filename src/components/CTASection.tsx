"use client";

import { ArrowRight, Building2, ShieldCheck } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-grid-pattern bg-white border-b border-slate-200/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="arch-card p-8 sm:p-12 md:p-16 rounded-2xl bg-white text-center relative overflow-hidden shadow-sm border border-slate-300">
          {/* Subtle architectural background tag */}
          <div className="absolute top-4 left-6 text-[10px] font-mono text-slate-500 select-none hidden sm:block" aria-hidden="true">
            + SPEC_STAGE: STAGE_1_PUBLIC
          </div>
          <div className="absolute top-4 right-6 text-[10px] font-mono text-slate-500 select-none hidden sm:block" aria-hidden="true">
            REF: ISO_19650_STANDARD
          </div>

          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-6 shadow-2xs">
            <Building2 className="w-6 h-6 text-slate-100" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight max-w-2xl mx-auto leading-tight">
            Every building has a history.
            <span className="block text-slate-600 font-normal mt-1">Give it a digital identity.</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl mx-auto font-normal">
            Eliminate document fragmentation and establish permanent structural transparency across every phase of your building&apos;s lifecycle.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#sample-record"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-8 py-4 rounded-md border border-slate-900 transition-all shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              <span>Explore Building Passport</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center space-x-6 text-xs text-slate-600 font-mono">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Zero-bloat civil data architecture</span>
            </span>
            <span className="hidden sm:inline text-slate-300" aria-hidden="true">•</span>
            <span className="hidden sm:inline">Stage 1 Public Specification</span>
          </div>
        </div>

      </div>
    </section>
  );
}
