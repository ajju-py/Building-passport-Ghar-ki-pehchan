"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, User, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BuildingPassportLogo } from "@/components/brand/BuildingPassportLogo";

interface NavLink {
  name: string;
  href: string;
}

const defaultNavLinks: NavLink[] = [
  { name: "Home", href: "/#overview" },
  { name: "Registry", href: "/buildings" },
  { name: "How It Works", href: "/#how-it-works" },
  { name: "Features", href: "/#features" },
  { name: "Lifecycle", href: "/#lifecycle" },
  { name: "Dashboard", href: "/dashboard" },
];

const publicNavLinks: NavLink[] = [
  { name: "Home", href: "/#overview" },
  { name: "How It Works", href: "/#how-it-works" },
  { name: "Features", href: "/#features" },
  { name: "Lifecycle", href: "/#lifecycle" },
];

interface NavbarProps {
  publicOnly?: boolean;
}

export default function Navbar({ publicOnly = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isPublicView = publicOnly || pathname?.startsWith("/public/");
  const activeNavLinks = isPublicView ? publicNavLinks : defaultNavLinks;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen, closeMenu]);

  return (
    <header
      role="banner"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || pathname !== "/"
          ? "bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center space-x-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-md shrink-0"
            aria-label="Building Passport Home"
          >
            <BuildingPassportLogo size={38} showText={true} subtitle={true} priority={true} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Desktop Navigation"
            className="hidden lg:flex items-center space-x-0.5 xl:space-x-1 border border-slate-200/80 rounded-full px-3 py-1.5 bg-white/85 backdrop-blur-xs shadow-2xs"
          >
            {activeNavLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 xl:px-3 py-1 rounded-full transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action Buttons / User Status */}
          <div className="hidden sm:flex items-center space-x-3 shrink-0">
            {isPublicView ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-3.5 py-2 rounded-md transition-colors"
                >
                  Authorized Sign In
                </Link>
                <Link
                  href="/#sample-record"
                  className="inline-flex items-center justify-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-md border border-slate-800 transition-all shadow-xs"
                >
                  <span>Explore Platform</span>
                </Link>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-150 px-3 py-2 rounded-md border border-slate-200 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="max-w-[130px] truncate">{user.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-white rounded border border-slate-200 text-slate-600">
                    {user.role}
                  </span>
                </Link>
                <Link
                  href="/profile"
                  title="Account Profile & Security"
                  aria-label="Account Profile & Security"
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors border border-transparent hover:border-slate-200"
                >
                  <User className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors border border-transparent hover:border-slate-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-3.5 py-2 rounded-md transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/buildings/new"
                  className="inline-flex items-center justify-center space-x-2 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-md border border-slate-800 transition-all shadow-xs hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                >
                  <span>Register Building</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="block w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="block w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 mt-2 shadow-lg animate-arch-slide"
        >
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-1">
            {activeNavLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={closeMenu}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2.5 rounded-md hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                {link.name}
              </Link>
            ))}

            <div className="pt-3 border-t border-slate-100 space-y-2">
              {isPublicView ? (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex items-center justify-center space-x-2 w-full text-xs font-semibold uppercase tracking-wider text-slate-800 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-md border border-slate-200 transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Authorized Sign In</span>
                </Link>
              ) : user ? (
                <>
                  <div className="px-3 py-2 bg-slate-50 rounded-md border border-slate-200 text-xs">
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{user.email} • {user.role.toUpperCase()}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="flex items-center justify-center space-x-2 w-full text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 py-3 rounded-md transition-colors"
                  >
                    <span>Civil Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/profile"
                    onClick={closeMenu}
                    className="flex items-center justify-center space-x-2 w-full text-xs font-semibold uppercase tracking-wider text-slate-800 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-md border border-slate-200 transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Profile & Security</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeMenu();
                    }}
                    className="w-full text-xs font-semibold uppercase tracking-wider text-slate-700 hover:bg-slate-100 py-2.5 rounded-md border border-slate-200 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="flex items-center justify-center space-x-2 w-full text-xs font-semibold uppercase tracking-wider text-slate-800 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-md transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/buildings/new"
                    onClick={closeMenu}
                    className="flex items-center justify-center space-x-2 w-full text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 py-3 rounded-md transition-colors"
                  >
                    <span>Register Building</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
