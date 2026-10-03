"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Lock,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  OwnerIdentityVerificationRecord,
  IdentityVerificationMethod,
  BuildingRecord,
} from "@/lib/types";

interface IdentityVerificationSectionProps {
  building: BuildingRecord;
}

const METHOD_LABELS: Record<IdentityVerificationMethod, string> = {
  sandbox_aadhaar_otp: "Aadhaar e-KYC (Sandbox Gateway)",
  digilocker_sandbox: "DigiLocker Property Title Document",
  manual_authority_check: "Authorized Civil Verification Office",
  authorized_civil_id: "Government Registered Civil ID",
};

export const IdentityVerificationSection: React.FC<IdentityVerificationSectionProps> = ({
  building,
}) => {
  const { user } = useAuth();
  const [verification, setVerification] = useState<OwnerIdentityVerificationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initiate Modal State
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [ownerName, setOwnerName] = useState(building.owner?.name || "");
  const [method, setMethod] = useState<IdentityVerificationMethod>("sandbox_aadhaar_otp");
  const [maskedInput, setMaskedInput] = useState("XXXX-XXXX-8983");
  const [initiating, setInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [activeVerificationId, setActiveVerificationId] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState("898312");
  const [otpHint, setOtpHint] = useState("898312");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const canModify =
    user?.role === "admin" ||
    user?.role === "engineer" ||
    (user?.role === "owner" && building.createdBy === user?.userId);

  const refreshVerification = useCallback(async () => {
    try {
      const data = await api.identity.get(building.id);
      setVerification(data);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load owner identity verification.");
    }
  }, [building.id]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await api.identity.get(building.id);
        if (!ignore) {
          setVerification(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError((err as Error).message || "Failed to load owner identity verification.");
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [building.id]);

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setInitiating(true);
    setInitiateError(null);

    try {
      const res = await api.identity.initiate(building.id, {
        ownerName: ownerName.trim(),
        verificationMethod: method,
        maskedId: maskedInput.trim(),
        consentReference: `CONSENT_${Date.now()}_ACV`,
      });

      setShowInitiateModal(false);
      setActiveVerificationId(res.verification.id);
      setOtpHint(res.sandbox.testOtpHint);
      setOtpValue(res.sandbox.testOtpHint);
      setShowOtpModal(true);
      refreshVerification();
    } catch (err: unknown) {
      setInitiateError((err as Error).message || "Failed to initiate verification.");
    } finally {
      setInitiating(false);
    }
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVerificationId) return;

    setVerifyingOtp(true);
    setOtpError(null);

    try {
      const result = await api.identity.verify(
        building.id,
        activeVerificationId,
        otpValue.trim()
      );

      if (result.status === "VERIFIED") {
        setShowOtpModal(false);
        refreshVerification();
      } else {
        setOtpError("Invalid OTP entered. Please use test code '898312'.");
      }
    } catch (err: unknown) {
      setOtpError((err as Error).message || "Verification confirmation failed.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sandbox Notice Banner */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-lg p-4 sm:p-5 shadow-2xs">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-xs text-amber-900 leading-relaxed">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-amber-950 uppercase tracking-wider font-mono text-[11px]">
                Showcase Identity Sandbox Gateway
              </span>
              <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                Simulated Sandbox
              </span>
            </div>
            <p className="mt-1">
              Building Passport integrates with simulated Aadhaar e-KYC and DigiLocker property verification gateways.
              <strong> Zero full government identity numbers are ever collected or stored</strong> — only cryptographic masks (e.g. <code>XXXX-XXXX-1234</code>) and immutable consent tokens are maintained per privacy protocols.
            </p>
          </div>
        </div>
      </div>

      {/* Main Identity Verification Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
        {loading ? (
          <div className="text-center py-10 font-mono text-xs text-slate-500">
            Checking civil identity registry status...
          </div>
        ) : verification && verification.status === "VERIFIED" ? (
          /* VERIFIED STATE */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0 shadow-xs">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-900 text-base">
                      {verification.ownerName}
                    </h3>
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>AUTHENTICATED OWNER</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Legal Title Holder &bull; Verified via {METHOD_LABELS[verification.verificationMethod] || verification.verificationMethod}
                  </p>
                </div>
              </div>

              {canModify && (
                <button
                  onClick={() => setShowInitiateModal(true)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded px-3 py-1.5 hover:bg-slate-50 transition-colors self-start sm:self-auto"
                >
                  Re-verify Identity
                </button>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-slate-50 rounded p-3 border border-slate-100">
                <div className="text-slate-500 text-[11px]">MASKED DOCUMENT ID</div>
                <div className="font-bold text-slate-900 mt-1">
                  {verification.documentMaskedId || "XXXX-XXXX-8983"}
                </div>
              </div>

              <div className="bg-slate-50 rounded p-3 border border-slate-100">
                <div className="text-slate-500 text-[11px]">PROVIDER REFERENCE</div>
                <div className="font-bold text-slate-800 mt-1 truncate" title={verification.providerReference || ""}>
                  {verification.providerReference || "SBX_REF_CIVIL_001"}
                </div>
              </div>

              <div className="bg-slate-50 rounded p-3 border border-slate-100">
                <div className="text-slate-500 text-[11px]">AUTHENTICATION TIMESTAMP</div>
                <div className="font-bold text-slate-800 mt-1">
                  {verification.verifiedAt
                    ? new Date(verification.verifiedAt).toLocaleString()
                    : "Verified"}
                </div>
              </div>
            </div>

            {verification.remarks && (
              <p className="text-xs text-slate-500 italic bg-slate-50/50 p-3 rounded border border-slate-100">
                Registry Notice: {verification.remarks}
              </p>
            )}
          </div>
        ) : (
          /* NOT VERIFIED / PENDING STATE */
          <div className="text-center py-8 max-w-md mx-auto">
            <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 text-base">
              Owner Identity Not Formally Authenticated
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
              Verify title ownership through the showcase sandbox Aadhaar e-KYC or DigiLocker integration to unlock certified civil status.
            </p>

            {canModify ? (
              <button
                onClick={() => setShowInitiateModal(true)}
                className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-5 py-3 rounded-md shadow-xs transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                <span>Initiate Sandbox Identity Verification</span>
              </button>
            ) : (
              <p className="text-xs text-slate-400 font-mono">
                Only the building owner or an authorized administrator can authenticate this record.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Initiate Verification Modal */}
      {showInitiateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-slate-900" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Simulated Owner Identity Verification
                </h3>
              </div>
              <button
                onClick={() => setShowInitiateModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInitiate} className="space-y-4 mt-4 text-xs">
              {initiateError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded">
                  {initiateError}
                </div>
              )}

              <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Showcase Sandbox Notice:</strong> Enter your legal owner name and document mask (or last 4 digits). Do NOT enter real government credentials.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Legal Owner / Title Holder Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Verification Provider / Method *
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as IdentityVerificationMethod)}
                  className="w-full border border-slate-300 rounded p-2 text-slate-800 bg-white"
                >
                  <option value="sandbox_aadhaar_otp">Aadhaar e-KYC (Sandbox Gateway)</option>
                  <option value="digilocker_sandbox">DigiLocker Property Title Document</option>
                  <option value="manual_authority_check">Authorized Civil Office Verification</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Masked Document Number * (e.g. XXXX-XXXX-8983)
                </label>
                <input
                  type="text"
                  required
                  placeholder="XXXX-XXXX-8983"
                  value={maskedInput}
                  onChange={(e) => setMaskedInput(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-slate-800 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowInitiateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={initiating}
                  className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 font-semibold uppercase tracking-wider text-[11px] disabled:opacity-50"
                >
                  {initiating ? "Requesting..." : "Send Sandbox OTP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OTP Confirmation Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Enter Sandbox OTP
                </h3>
              </div>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmOtp} className="space-y-4 mt-4 text-xs">
              {otpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded">
                  {otpError}
                </div>
              )}

              <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                <strong>Simulated Gateway Ready:</strong> Enter the sandbox OTP code. Use default test code: <code className="font-bold text-emerald-800 bg-white px-1 py-0.5 rounded border border-emerald-300">{otpHint}</code>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-slate-900 font-mono text-center text-lg tracking-widest"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-semibold uppercase tracking-wider text-[11px] disabled:opacity-50"
                >
                  {verifyingOtp ? "Verifying..." : "Confirm & Authenticate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdentityVerificationSection;
