"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BuildingPassportLogo } from "@/components/brand/BuildingPassportLogo";

type VerificationState =
  | "verifying"
  | "success"
  | "expired"
  | "already_used"
  | "missing_token"
  | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [state, setState] = useState<VerificationState>(() => {
    if (errorParam) {
      if (/already\s*verified|already\s*used|already\s*been\s*used/i.test(errorParam)) return "already_used";
      if (/expired/i.test(errorParam)) return "expired";
      return "error";
    }
    return !token || !token.trim() ? "missing_token" : "verifying";
  });
  const [errorMessage, setErrorMessage] = useState<string>(errorParam || "");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (errorParam || !token || !token.trim()) {
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        await api.auth.verifyEmailToken(token!.trim());
        if (isMounted) {
          setState("success");
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = (err as Error).message || "Verification failed";
        setErrorMessage(msg);

        if (/already\s*verified|already\s*been\s*used|already\s*used/i.test(msg)) {
          setState("already_used");
        } else if (/expired/i.test(msg)) {
          setState("expired");
        } else {
          setState("error");
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, errorParam]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendError(null);
    setResendMessage(null);

    if (!resendEmail || !resendEmail.trim()) {
      setResendError("Please enter your registered email address.");
      return;
    }

    setResendLoading(true);
    try {
      const res = await api.auth.resendVerification({ email: resendEmail.trim() });
      setResendMessage(res.message || "A new verification email has been dispatched.");
    } catch (err: unknown) {
      setResendError((err as Error).message || "Unable to resend verification email.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <BuildingPassportLogo size={54} showText={false} priority={true} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Email Verification
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-mono uppercase tracking-wider">
          Civil Identity Registry Account Activation
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 sm:p-8">
        {/* STATE: VERIFYING */}
        {state === "verifying" && (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-900 mb-4 animate-spin">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Validating Verification Token...
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Verifying cryptographic record with PostgreSQL civil registry.
            </p>
          </div>
        )}

        {/* STATE: SUCCESS */}
        {state === "success" && (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mb-4 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Email Verified Successfully!
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Your Building Passport account is now fully activated. You have official access to manage and view civil digital building records.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-md text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs"
            >
              <span>Proceed to Login</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}

        {/* STATE: ALREADY USED */}
        {state === "already_used" && (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 text-amber-600 mb-4 border border-amber-200">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-2">
              {errorMessage && /already\s*verified/i.test(errorMessage)
                ? "Email Already Verified"
                : "Verification Link Already Used"}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {errorMessage && /already\s*verified/i.test(errorMessage)
                ? "Your email address has already been verified and your account is active. You may sign in directly with your credentials."
                : "This verification token has already been consumed. If your account is active, you may sign in directly with your password."}
            </p>
            <div className="space-y-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-md text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs"
              >
                <span>Sign In to Your Account</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        )}

        {/* STATE: EXPIRED */}
        {state === "expired" && (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 text-amber-600 mb-4 border border-amber-200">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-2">
              Verification Link Expired
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              For your security, verification links expire after a set duration. Request a fresh verification link below.
            </p>

            <form onSubmit={handleResend} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="engineer@buildingpassport.org"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-slate-900"
                />
              </div>

              {resendError && (
                <p className="text-[11px] text-rose-600 font-medium">{resendError}</p>
              )}
              {resendMessage && (
                <p className="text-[11px] text-emerald-600 font-medium">{resendMessage}</p>
              )}

              <button
                type="submit"
                disabled={resendLoading}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xs"
              >
                {resendLoading ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-1 text-slate-300" />
                    <span>Resend Verification Email</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STATE: MISSING TOKEN */}
        {state === "missing_token" && (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 text-slate-700 mb-4 border border-slate-200">
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-2">
              Missing Verification Token
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Please click the link directly from the verification email sent to you, or enter your email below to receive a new verification link.
            </p>

            <form onSubmit={handleResend} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="engineer@buildingpassport.org"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-slate-900"
                />
              </div>

              {resendError && (
                <p className="text-[11px] text-rose-600 font-medium">{resendError}</p>
              )}
              {resendMessage && (
                <p className="text-[11px] text-emerald-600 font-medium">{resendMessage}</p>
              )}

              <button
                type="submit"
                disabled={resendLoading}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xs"
              >
                {resendLoading ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-1 text-slate-300" />
                    <span>Send Verification Email</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STATE: ERROR / INVALID */}
        {state === "error" && (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 text-rose-600 mb-4 border border-rose-200">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-2">
              {errorMessage && /invalid/i.test(errorMessage)
                ? "Invalid Verification Link"
                : "Verification Failed"}
            </h2>
            <p className="text-xs text-rose-700 mb-4 font-medium">
              {errorMessage || "The verification link is invalid or malformed."}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Enter your email address to request a fresh verification link:
            </p>

            <form onSubmit={handleResend} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="engineer@buildingpassport.org"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-slate-900"
                />
              </div>

              {resendError && (
                <p className="text-[11px] text-rose-600 font-medium">{resendError}</p>
              )}
              {resendMessage && (
                <p className="text-[11px] text-emerald-600 font-medium">{resendMessage}</p>
              )}

              <button
                type="submit"
                disabled={resendLoading}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xs"
              >
                {resendLoading ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-1 text-slate-300" />
                    <span>Request New Verification Email</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Back to Login link */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline"
          >
            &larr; Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <Suspense
          fallback={
            <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-8 text-center text-xs font-mono text-slate-500">
              Loading verification interface...
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
