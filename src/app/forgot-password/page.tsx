"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, ShieldAlert, AlertCircle, CheckCircle2, ArrowRight, RefreshCw, Lock } from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step 1: Enter Email, Step 2: Enter OTP & New Password, Step 3: Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [cooldown, setCooldown] = useState(30);
  const canResend = cooldown <= 0;

  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Resend countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, cooldown]);

  // Step 1: Submit Email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await api.auth.forgotPassword({ email: email.trim().toLowerCase() });
      setInfoMsg(res.message);
      setStep(2);
      setCooldown(30);
    } catch (err: unknown) {
      setError((err as Error).message || "Request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Submit Reset (OTP + New Password)
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.trim().length !== 6) {
      setError("Please enter the complete 6-digit reset code.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);

    try {
      await api.auth.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });

      setStep(3);
    } catch (err: unknown) {
      setError((err as Error).message || "Password reset failed. The code may be incorrect or expired.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Resend Reset Code
  const handleResendOtp = async () => {
    if (!canResend || submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await api.auth.forgotPassword({ email: email.trim().toLowerCase() });
      setInfoMsg(res.message);
      setCooldown(30);
    } catch (err: unknown) {
      setError((err as Error).message || "Could not resend reset code. Please try again later.");
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
              <KeyRound className="w-6 h-6 text-slate-100" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {step === 1 && "Password Recovery"}
              {step === 2 && "Reset Your Password"}
              {step === 3 && "Password Updated"}
            </h1>
            <p className="mt-1 text-xs text-slate-500 font-mono uppercase tracking-wider">
              {step === 1 && "Request Secure One-Time Reset Code"}
              {step === 2 && "Enter Code and Choose New Password"}
              {step === 3 && "Authentication State Re-established"}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 sm:p-8">
            {error && (
              <div className="mb-5 p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {infoMsg && step === 2 && !error && (
              <div className="mb-5 p-3.5 rounded-md bg-sky-50 border border-sky-200 text-sky-800 flex items-start space-x-2 text-xs">
                <ShieldAlert className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>{infoMsg}</span>
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {step === 1 && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="official.email@organization.org"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900 placeholder:text-slate-400 font-mono text-xs transition-colors"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    If an account matches this address, password reset instructions with a 6-digit code will be dispatched.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{submitting ? "Sending Request..." : "Send Reset Code"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Enter OTP & New Password */}
            {step === 2 && (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="text-center py-1">
                  <p className="text-xs text-slate-600">
                    Resetting password for: <span className="font-semibold text-slate-900 font-mono">{email}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 text-center">
                    6-Digit Reset Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="123456"
                    className="w-full px-3.5 py-2.5 text-center text-xl font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900 placeholder:text-slate-300 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900 placeholder:text-slate-400 transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Minimum 8 characters.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting || otp.trim().length !== 6}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{submitting ? "Resetting Password..." : "Update Password"}</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-500 hover:text-slate-800 underline transition-colors"
                  >
                    Change email
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
                <h3 className="text-lg font-bold text-slate-900">Password Reset Complete</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Your password has been securely updated. Any previous active sessions have been invalidated. Please log in with your new credentials.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Return to Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-900 hover:underline transition-colors"
              >
                &larr; Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
