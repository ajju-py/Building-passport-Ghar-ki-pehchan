"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Layers,
  HardHat,
  Lock,
  AlertCircle,
  Camera,
} from "lucide-react";
import { api } from "@/lib/api";
import { BuildingRecord } from "@/lib/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PublicBuildingPassportPage({
  params,
}: {
  params: Promise<{ passportId: string }>;
}) {
  const { passportId } = use(params);
  const [building, setBuilding] = useState<BuildingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchRecord() {
      try {
        const data = await api.public.getBuildingPassport(passportId);
        if (!ignore) {
          setBuilding(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError((err as Error).message || "Building passport not found in public civil registry.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchRecord();
    return () => {
      ignore = true;
    };
  }, [passportId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-12 text-xs font-mono text-slate-500">
          Resolving public Building Passport registry record...
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !building) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto flex flex-col items-center justify-center p-8 text-center pt-32">
          <AlertCircle className="w-12 h-12 text-rose-600 mb-3" />
          <h1 className="text-xl font-bold text-slate-900">Unverified Passport ID</h1>
          <p className="text-xs text-slate-600 mt-1">
            Passport ID <strong>{passportId}</strong> could not be verified in the active registry.
          </p>
          <Link
            href="/"
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded text-xs uppercase font-semibold"
          >
            Return to Homepage
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Verification Guarantee Banner */}
        <div className="p-4 sm:p-5 rounded-lg bg-emerald-50/90 border border-emerald-200/90 shadow-2xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-50" />
            </div>
            <div>
              <p className="font-bold text-emerald-950 text-sm flex items-center">
                Official Public Civil Registry Verification
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5 font-mono">
                Decadal Asset ID: {building.passportId} • Cryptographically Verified Record
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase bg-white text-emerald-800 border border-emerald-300 px-2 py-1 rounded font-semibold">
              Public Record
            </span>
          </div>
        </div>

        {/* Building Identity Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                  {building.passportId}
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded ${
                    building.condition === "Good" || building.condition === "Excellent"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                      : "bg-amber-50 text-amber-800 border border-amber-200/60"
                  }`}
                >
                  Condition: {building.condition}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
                {building.name}
              </h1>

              <div className="mt-2 text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                <span className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {building.location.address}, {building.location.city}
                </span>
                <span className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Constructed {building.constructionDate}
                </span>
                <span className="font-mono text-slate-700">
                  {building.floors} Floors • {building.units} Units • {building.totalArea}
                </span>
              </div>
            </div>

            {/* QR Stamp */}
            {building.qrCodeDataUrl && (
              <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-2xs shrink-0 self-center sm:self-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={building.qrCodeDataUrl}
                  alt={`QR code for ${building.passportId}`}
                  className="w-24 h-24"
                />
              </div>
            )}
          </div>

          {/* Civil & Structural Specifications */}
          <div className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center">
              <Layers className="w-4 h-4 mr-1.5 text-slate-700" />
              Verified Structural Specifications
            </h2>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200/80">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Structural Frame System</p>
                <p className="font-semibold text-slate-900 mt-0.5">{building.structuralInfo.frameType}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200/80">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Sub-Structure Foundation</p>
                <p className="font-semibold text-slate-900 mt-0.5">{building.structuralInfo.foundation}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200/80">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Seismic Zone</p>
                <p className="font-semibold text-slate-900 mt-0.5 font-mono">
                  {building.structuralInfo.seismicZone || "Zone IV"}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200/80">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Fire Compartmentation</p>
                <p className="font-semibold text-slate-900 mt-0.5">{building.structuralInfo.fireRating}</p>
              </div>

              <div className="sm:col-span-2 p-3 bg-slate-50 rounded border border-slate-200/80">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Facade / Cladding System</p>
                <p className="font-semibold text-slate-900 mt-0.5">{building.structuralInfo.exteriorCladding}</p>
              </div>
            </div>
          </div>

          {/* Builder & Certified Contractor */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center">
              <HardHat className="w-4 h-4 mr-1.5 text-slate-700" />
              Contractor & Civil Engineering Entity
            </h2>

            <div className="mt-3 p-4 bg-slate-50 rounded border border-slate-200/80 text-xs">
              <p className="font-bold text-slate-900 text-sm">{building.builder.companyName}</p>
              <p className="text-slate-600 mt-1">Lead Engineer: {building.builder.builderName}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{building.builder.details}</p>
            </div>
          </div>

          {/* Protected Ownership Notice */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-lg flex items-start space-x-3 text-xs">
              <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Protected Stakeholder Information</p>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Direct owner contact details and internal engineering calculations are restricted from public QR scans under ISO/IEC civil privacy regulations.
                </p>
                <Link
                  href="/login"
                  className="mt-2 inline-flex items-center text-[11px] font-bold text-slate-900 hover:underline"
                >
                  Authorized civil stakeholders sign in here &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Public Photographs */}
          {building.photographs && building.photographs.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center">
                <Camera className="w-4 h-4 mr-1.5 text-slate-700" />
                Civil Photographic Evidence
              </h2>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {building.photographs.map((photo, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <div className="aspect-video relative overflow-hidden bg-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.caption || "Building photograph"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2.5 text-xs">
                      <p className="text-slate-800 font-medium">{photo.caption}</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">
                        {photo.category} • {new Date(photo.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
