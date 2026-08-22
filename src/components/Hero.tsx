"use client";

import { ArrowRight, FileCheck2, ShieldCheck, QrCode, HardHat, Compass, Layers, CheckCircle2, ChevronRight } from "lucide-react";

export default function Hero() {
  return (
    <section id="overview" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-grid-pattern border-b border-slate-200/80">
      {/* Decorative architectural crosshairs */}
      <div className="absolute top-24 left-8 text-slate-300 font-mono text-[10px] select-none pointer-events-none hidden md:block">
        + SYS_COORD: 40.7128° N, 74.0060° W
      </div>
      <div className="absolute top-24 right-8 text-slate-300 font-mono text-[10px] select-none pointer-events-none hidden md:block">
        REF_STD: ISO 19650 / BIM-DIGITAL-ID
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          {/* Civil Tech Badge */}
          <div className="inline-flex items-center space-x-2 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-mono text-slate-700 mb-6 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold uppercase tracking-wider text-[11px]">CIVIL INFRASTRUCTURE SPECIFICATION</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">STAGE 1 DEPLOYMENT</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.12] mb-6">
            Building Passport
            <span className="block text-2xl sm:text-3xl lg:text-4xl font-normal text-slate-600 mt-2 tracking-normal">
              A Digital Identity for Every Building.
            </span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal mb-8 max-w-2xl mx-auto">
            Consolidating structural specifications, maintenance history, floor plans, defect records, and condition assessments into a single, verifiable digital civil record.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href="#sample-record"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-6 py-3.5 rounded-md border border-slate-900 transition-all shadow-sm hover:shadow"
            >
              <span>Explore Building Passport</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </a>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 px-6 py-3.5 rounded-md border border-slate-300 transition-all shadow-2xs"
            >
              <Compass className="w-4 h-4 text-slate-500" />
              <span>See How It Works</span>
            </a>
          </div>
        </div>

        {/* Visual Relationship Diagram: Building → Digital Passport → Building Information */}
        <div className="relative mt-12 lg:mt-16 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 md:p-10 shadow-xs">
          {/* Blueprint style header line */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900"></div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-700">
                SYSTEM ARCHITECTURE PREVIEW // IDENTIFICATION FLOW
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
              DOC-VER: BP-ARCH-2026.01
            </div>
          </div>

          {/* 3-Column Visual Flow */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Step 1: Physical Building */}
            <div className="md:col-span-3 bg-slate-50/80 border border-slate-200/90 rounded-lg p-5 flex flex-col items-center text-center relative group hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-3 shadow-2xs">
                <HardHat className="w-6 h-6 text-slate-200" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold mb-1">
                NODE 01
              </span>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Physical Building</h3>
              <p className="text-xs text-slate-500">Commercial / Residential structure & materials</p>
              <div className="mt-4 pt-3 border-t border-slate-200/70 w-full text-left flex justify-between text-[11px] font-mono text-slate-500">
                <span>STRUCT_TYPE</span>
                <span className="text-slate-800 font-medium">RCC / STEEL</span>
              </div>
            </div>

            {/* Transition Arrow 1 */}
            <div className="md:col-span-1 flex items-center justify-center py-2 md:py-0">
              <div className="hidden md:flex flex-col items-center text-slate-400">
                <div className="w-8 h-px bg-slate-300"></div>
                <ChevronRight className="w-5 h-5 -mt-2 text-slate-400" />
              </div>
              <div className="md:hidden text-slate-400 font-mono text-xs">↓ DIGITIZING</div>
            </div>

            {/* Step 2: Digital Passport Core */}
            <div className="md:col-span-4 bg-slate-900 text-white rounded-xl p-6 shadow-md relative border border-slate-800 group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    DIGITAL PASSPORT
                  </span>
                </div>
                <div className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                  VERIFIED RECORD
                </div>
              </div>

              <div className="space-y-2 mb-4 bg-slate-950/60 p-3 rounded border border-slate-800 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">PASSPORT_ID:</span>
                  <span className="text-emerald-400 font-bold">BP-2026-00125</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">QR_TOKEN:</span>
                  <span className="text-slate-200">ACTIVE_VALIDATED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">HEALTH_STATE:</span>
                  <span className="text-emerald-400">OPTIMAL (94%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-3">
                <span className="flex items-center space-x-1">
                  <QrCode className="w-3.5 h-3.5 text-slate-400" />
                  <span>Instant Scannable Identity</span>
                </span>
                <span className="text-slate-300 font-medium">LIFECYCLE READY</span>
              </div>
            </div>

            {/* Transition Arrow 2 */}
            <div className="md:col-span-1 flex items-center justify-center py-2 md:py-0">
              <div className="hidden md:flex flex-col items-center text-slate-400">
                <div className="w-8 h-px bg-slate-300"></div>
                <ChevronRight className="w-5 h-5 -mt-2 text-slate-400" />
              </div>
              <div className="md:hidden text-slate-400 font-mono text-xs">↓ UNIFIES</div>
            </div>

            {/* Step 3: Unified Building Information */}
            <div className="md:col-span-3 bg-slate-50/80 border border-slate-200/90 rounded-lg p-5 flex flex-col items-center text-center relative group hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-3 shadow-2xs">
                <Layers className="w-6 h-6 text-slate-200" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold mb-1">
                NODE 03
              </span>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Civil Data Repository</h3>
              <p className="text-xs text-slate-500">Plans, repairs, owner logs & future AI diagnostics</p>
              <div className="mt-4 pt-3 border-t border-slate-200/70 w-full text-left flex justify-between text-[11px] font-mono text-slate-500">
                <span>RECORDS</span>
                <span className="text-slate-800 font-medium">100% AUDITABLE</span>
              </div>
            </div>

          </div>

          {/* Blueprint Footer Stats */}
          <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="border-r border-slate-200 last:border-r-0 px-2">
              <div className="text-xl font-bold text-slate-900 font-mono">100%</div>
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Centralized Record</div>
            </div>
            <div className="border-r border-slate-200 last:border-r-0 px-2">
              <div className="text-xl font-bold text-slate-900 font-mono">0.4 sec</div>
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">QR Identity Fetch</div>
            </div>
            <div className="border-r border-slate-200 last:border-r-0 px-2">
              <div className="text-xl font-bold text-slate-900 font-mono">ISO 19650</div>
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">BIM & Civil Std</div>
            </div>
            <div className="px-2">
              <div className="text-xl font-bold text-slate-900 font-mono">Stage 1</div>
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Deploy Ready</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
