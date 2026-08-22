"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Menu, X, ArrowRight, Building2 } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Overview", href: "#overview" },
    { name: "What It Is", href: "#what-is" },
    { name: "Why Passport", href: "#why-passport" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Lifecycle", href: "#lifecycle" },
    { name: "Sample Record", href: "#sample-record" },
    { name: "Capabilities", href: "#features" },
    { name: "AI Vision", href: "#ai-future" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-3.5"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#overview" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-md bg-slate-900 flex items-center justify-center text-white border border-slate-700 shadow-xs transition-transform group-hover:scale-105">
              <Building2 className="w-5 h-5 text-slate-100" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-slate-900 tracking-tight text-lg leading-none">
                  BUILDING PASSPORT
                </span>
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                  v1.0
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono tracking-wider uppercase mt-0.5">
                CIVIL DIGITAL IDENTITY
              </span>
            </div>
          </a>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center space-x-1 border border-slate-200/60 rounded-full px-4 py-1.5 bg-white/70 backdrop-blur-xs shadow-2xs">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1 rounded-full transition-colors hover:bg-slate-100/70"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Primary Action Button */}
          <div className="hidden sm:flex items-center space-x-3">
            <a
              href="#sample-record"
              className="inline-flex items-center justify-center space-x-2 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-md border border-slate-800 transition-all shadow-xs hover:shadow-sm"
            >
              <span>Explore Building Passport</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 mt-2 shadow-lg animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-100">
              <a
                href="#sample-record"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center space-x-2 w-full text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 py-3 rounded-md transition-colors"
              >
                <span>Explore Building Passport</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
