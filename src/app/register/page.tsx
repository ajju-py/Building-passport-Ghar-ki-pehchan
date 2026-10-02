"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, UserPlus, AlertCircle, ShieldCheck, RefreshCw, Mail, ExternalLink, ArrowLeft } from "lucide-react";
import { UserRole } from "@/lib/types";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  // Step state: 1 = Details, 2 = Check Your Email
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");

  // Cooldown for resending verification link
  const [cooldown, setCooldown] = useState(30);
  const canResend = cooldown <= 0;

  // UI States
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Countdown timer for resend link
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, cooldown]);

  // Step 1: Submit Registration Details
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);

    try {
      await api.auth.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        mobile: mobile.trim() || undefined,
      });

      // Clear sensitive password fields from memory
      setPassword("");
      setConfirmPassword("");
      setCooldown(30);
      setStep(2);
    } catch (err: unknown) {
      setError((err as Error).message || "Registration failed. Please check submitted information.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Resend Verification Email Link
  const handleResendLink = async () => {
    if (!canResend || submitting) return;
    setError(null);
    setResendSuccess(null);
    setSubmitting(true);

    try {
      const res = await api.auth.resendVerification({
        email: email.trim().toLowerCase(),
      });
      setResendSuccess(res.message || "A new verification link has been sent to your email.");
      setCooldown(30);
    } catch (err: unknown) {
      setError((err as Error).message || "Could not resend verification email. Please wait and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-900 text-white shadow-xs mb-3 border border-slate-700">
              {step === 1 ? (
                <Building2 className="w-6 h-6 text-slate-100" />
              ) : (
                <Mail className="w-6 h-6 text-slate-100" />
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {step === 1 ? "Register Civil Stakeholder" : "Check Your Email"}
            </h1>
            <p className="mt-1 text-xs text-slate-500 font-mono uppercase tracking-wider">
              {step === 1
                ? "Create Building Passport Management Credentials"
                : "One-Time Account Activation Link Dispatched"}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 sm:p-8">
            {/* Step Progress Indicators */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 text-xs">
              <div
                className={`flex items-center space-x-1.5 ${
                  step === 1 ? "font-bold text-slate-900" : "text-slate-400"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 1
                      ? "bg-slate-900 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  1
                </span>
                <span>Account Details</span>
              </div>
              <div className="flex-1 mx-3 h-px bg-slate-200" />
              <div
                className={`flex items-center space-x-1.5 ${
                  step === 2 ? "font-bold text-slate-900" : "text-slate-400"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 2
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  2
                </span>
                <span>Email Verification</span>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {resendSuccess && (
              <div className="mb-5 p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start space-x-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{resendSuccess}</span>
              </div>
            )}

            {/* STEP 1: Registration Form */}
            {step === 1 && (
              <form
                onSubmit={handleRegisterSubmit}
                autoComplete="off"
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name & Title
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Er. Suresh Kumar"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900 placeholder:text-slate-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="suresh.kumar@infrastructure.org"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900 placeholder:text-slate-400 font-mono text-xs transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    autoComplete="off"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900 placeholder:text-slate-400 font-mono text-xs transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900 placeholder:text-slate-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900 placeholder:text-slate-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Classification
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900 transition-colors"
                  >
                    <option value="owner">Asset Owner / Property Manager</option>
                    <option value="public">Public Citizen / Civic Observer</option>
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Municipal Engineers and Administrators are provisioned via administrative governance.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{submitting ? "Creating Account..." : "Create Account"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Check Your Email Screen */}
            {step === 2 && (
              <div className="space-y-5 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sky-50 text-sky-700 border border-sky-200 mx-auto">
                  <Mail className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Verification Link Dispatched
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    We sent a secure one-time activation link to:
                  </p>
                  <div className="mt-2.5 inline-block px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono font-bold text-slate-900 break-all">
                    {email}
                  </div>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    Click the link in the email to activate your Building Passport account. The link expires in <span className="font-semibold text-slate-700">30 minutes</span>.
                  </p>
                </div>

                <div className="pt-2 space-y-2.5">
                  <a
                    href="mailto:"
                    className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-xs transition-colors"
                  >
                    <span>Open Email Client</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={handleResendLink}
                    disabled={!canResend || submitting}
                    className="w-full inline-flex items-center justify-center space-x-2 py-2 px-4 border border-slate-300 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${submitting ? "animate-spin" : ""}`} />
                    <span>{canResend ? "Resend Verification Email" : `Resend in ${cooldown}s`}</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError(null);
                      setResendSuccess(null);
                    }}
                    className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    <span>Edit registration details</span>
                  </button>

                  <Link
                    href="/login"
                    className="font-semibold text-slate-900 hover:underline transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600">
                  Already hold municipal credentials?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-slate-900 hover:underline transition-colors"
                  >
                    Sign In to Console
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
