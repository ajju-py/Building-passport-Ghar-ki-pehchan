"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, UserPlus, AlertCircle, ShieldCheck, CheckCircle2, RefreshCw, ArrowRight } from "lucide-react";
import { UserRole } from "@/lib/types";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  const router = useRouter();

  // Step state: 1 = Details, 2 = Email OTP, 3 = Verified Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");

  // OTP Fields
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(30);
  const canResend = cooldown <= 0;

  // UI States
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Resend countdown timer
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

      setSuccessMsg(`A 6-digit verification code has been dispatched to ${email}.`);
      setStep(2);
      setCooldown(30);
    } catch (err: unknown) {
      setError((err as Error).message || "Registration failed. Please check submitted information.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Submit OTP Verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setSubmitting(true);

    try {
      await api.auth.verifyEmail({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      setStep(3);
    } catch (err: unknown) {
      setError((err as Error).message || "Verification failed. The code may be incorrect or expired.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Resend OTP Code
  const handleResendOtp = async () => {
    if (!canResend || submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      await api.auth.requestOtp({
        destination: email.trim().toLowerCase(),
        purpose: "EMAIL_VERIFICATION",
      });
      setSuccessMsg("A new verification code has been sent.");
      setCooldown(30);
    } catch (err: unknown) {
      setError((err as Error).message || "Could not resend verification code. Please wait and try again.");
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
              <Building2 className="w-6 h-6 text-slate-100" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {step === 1 && "Register Civil Stakeholder"}
              {step === 2 && "Verify Email Address"}
              {step === 3 && "Account Verified"}
            </h1>
            <p className="mt-1 text-xs text-slate-500 font-mono uppercase tracking-wider">
              {step === 1 && "Create Building Passport Management Credentials"}
              {step === 2 && "Enter 6-Digit Verification Code"}
              {step === 3 && "Your Account Is Ready For Use"}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 sm:p-8">
            {/* Step Progress Indicators */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 text-xs">
              <div className={`flex items-center space-x-1.5 ${step === 1 ? "font-bold text-slate-900" : "text-slate-400"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>1</span>
                <span>Details</span>
              </div>
              <div className="w-8 h-px bg-slate-200" />
              <div className={`flex items-center space-x-1.5 ${step === 2 ? "font-bold text-slate-900" : "text-slate-400"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>2</span>
                <span>Verify OTP</span>
              </div>
              <div className="w-8 h-px bg-slate-200" />
              <div className={`flex items-center space-x-1.5 ${step === 3 ? "font-bold text-slate-900" : "text-slate-400"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>3</span>
                <span>Complete</span>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && step === 2 && !error && (
              <div className="mb-5 p-3.5 rounded-md bg-sky-50 border border-sky-200 text-sky-800 flex items-start space-x-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* STEP 1: Registration Form */}
            {step === 1 && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name & Title
                  </label>
                  <input
                    type="text"
                    required
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
                    Municipal Engineers and Administrators must be provisioned through official administrative governance.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{submitting ? "Creating Account..." : "Continue to Verification"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Email OTP Verification */}
            {step === 2 && (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="text-center py-2">
                  <p className="text-xs text-slate-600 mb-1">
                    Enter the one-time code sent to:
                  </p>
                  <p className="text-sm font-semibold text-slate-900 font-mono">
                    {email}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 text-center">
                    6-Digit Security Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="123456"
                    className="w-full px-3.5 py-3 text-center text-2xl font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900 placeholder:text-slate-300 transition-colors"
                  />
                  <p className="mt-1 text-center text-[11px] text-slate-500">
                    Code expires in 10 minutes. 3 attempts allowed.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting || otp.trim().length !== 6}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{submitting ? "Verifying..." : "Verify & Activate Account"}</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-500 hover:text-slate-800 underline transition-colors"
                  >
                    Edit email address
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend || submitting}
                    className="flex items-center space-x-1 text-slate-900 hover:text-slate-700 disabled:text-slate-400 font-semibold transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{canResend ? "Resend Code" : `Resend in ${cooldown}s`}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Complete / Success */}
            {step === 3 && (
              <div className="text-center py-6 space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Email Verified Successfully</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Your identity has been authenticated. Your account status has transitioned to <strong>Active</strong>. You can now access Building Passport registry workflows.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
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
