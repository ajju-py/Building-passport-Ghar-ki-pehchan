"use client";

import { Building2, ArrowUp } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-950 text-slate-400 py-12 md:py-16 border-t border-slate-800 text-xs font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800">
          
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white border border-slate-700">
                <Building2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              </div>
              <span className="font-semibold text-white tracking-wider text-base">
                Building Passport
              </span>
            </div>
            <p className="text-slate-400 text-xs font-sans leading-relaxed max-w-sm">
              Digital identity and lifecycle management platform for civil structures, architectural drawings, inspection records, and predictive building health.
            </p>
            <div className="inline-flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-900 px-3 py-1 rounded border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 motion-safe:animate-pulse" aria-hidden="true"></span>
              <span>STAGE 1 // PUBLIC PRODUCT HOMEPAGE</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase text-white tracking-wider">
              PLATFORM NAVIGATION
            </h4>
            <ul className="space-y-2 text-xs font-sans">
              <li><a href="#overview" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded">01. Overview</a></li>
              <li><a href="#what-is" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded">02. What is Building Passport?</a></li>
              <li><a href="#why-passport" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded">03. Why Building Passport?</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded">04. How It Works</a></li>
              <li><a href="#lifecycle" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded">05. Building Lifecycle</a></li>
              <li><a href="#sample-record" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded">06. Example Building Passport</a></li>
              <li><a href="#features" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded">07. Key Features</a></li>
              <li><a href="#ai-future" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded">08. Future AI Health Assessment</a></li>
            </ul>
          </div>

          {/* Technology & Architecture Spec */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase text-white tracking-wider">
              CIVIL STACK SPECIFICATION
            </h4>
            <div className="bg-slate-900 p-3.5 rounded border border-slate-800 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">FRONTEND:</span>
                <span className="text-slate-200">Next.js 16 / React 19 / TypeScript</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">STYLING:</span>
                <span className="text-slate-200">Tailwind CSS v3 Architectural</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">STAGE 2 ARCHITECTURE:</span>
                <span className="text-slate-200">Node.js / Express.js Backend</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">STAGE 2 DATABASE:</span>
                <span className="text-slate-200">PostgreSQL 17 Primary Engine</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">STANDARDS:</span>
                <span className="text-emerald-400 font-bold">ISO 19650 ALIGNED</span>
              </div>
            </div>
          </div>

        </div>

        {/* Copyright & Back to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} Building Passport. All rights reserved. Real Civil-Tech Product Platform.
          </div>
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="inline-flex items-center space-x-1 text-slate-300 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded border border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

      </div>
    </footer>
  );
}
