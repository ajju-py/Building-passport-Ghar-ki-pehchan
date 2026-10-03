"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowRight, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BuildingPassportLogo } from "@/components/brand/BuildingPassportLogo";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isVerified = searchParams.get("verified") === "true";
  const { login, quickLogin, isLoading, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSwitch = async (role: "admin" | "engineer" | "owner") => {
    setError(null);
    setSubmitting(true);
    try {
      await quickLogin(role);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to switch role session.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <BuildingPassportLogo size={54} showText={false} priority={true} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Building Passport Portal
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-mono uppercase tracking-wider">
          Authorized Civil Identity Management Access
        </p>
      </div>

      {/* Already logged in notice */}
      {user && (
        <div className="mb-6 p-4 rounded-md bg-emerald-50/80 border border-emerald-200/80 flex items-start space-x-3 text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold">Active Session Detected</p>
            <p className="mt-0.5">Logged in as {user.name} ({user.role.toUpperCase()})</p>
            <Link
              href="/dashboard"
              className="mt-2 inline-flex items-center font-bold text-emerald-800 hover:underline"
            >
              Continue to Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 sm:p-8">
        {isVerified && (
          <div className="mb-5 p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start space-x-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Email verified successfully! You can now sign in with your credentials.</span>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Official Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="engineer@buildingpassport.org"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900 placeholder:text-slate-400 font-mono text-xs transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Access Key / Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-slate-500 hover:text-slate-900 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900 placeholder:text-slate-400 font-mono text-xs transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || isLoading}
            className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xs"
          >
            {submitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-slate-300" />
                <span>Authorize Session</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Switcher */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider flex items-center">
              <Shield className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Quick Demo Access
            </span>
            <span className="text-[10px] text-slate-400 font-mono">1-Click Login</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSwitch("admin")}
              className="px-2.5 py-2 text-center rounded border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-800 transition-colors"
            >
              <p className="font-semibold text-slate-900">Admin</p>
              <p className="text-[10px] text-slate-500">Municipal</p>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSwitch("engineer")}
              className="px-2.5 py-2 text-center rounded border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-800 transition-colors"
            >
              <p className="font-semibold text-slate-900">Engineer</p>
              <p className="text-[10px] text-slate-500">Auditor</p>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSwitch("owner")}
              className="px-2.5 py-2 text-center rounded border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-800 transition-colors"
            >
              <p className="font-semibold text-slate-900">Owner</p>
              <p className="text-[10px] text-slate-500">Facility</p>
            </button>
          </div>
        </div>

        {/* Register Link */}
        <div className="mt-6 text-center text-xs text-slate-600">
          Don&apos;t have an engineering account?{" "}
          <Link href="/register" className="font-semibold text-slate-900 hover:underline">
            Register New Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <Suspense
          fallback={
            <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-8 text-center text-xs font-mono text-slate-500">
              Loading authentication portal...
            </div>
          }
        >
          <LoginFormContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

