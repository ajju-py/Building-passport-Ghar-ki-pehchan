"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  AlertCircle,
  Shield,
  Layers,
  HardHat,
  User,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NewBuildingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial Blank Form State
  const INITIAL_BLANK_FORM = {
    name: "",
    type: "Commercial High-Rise",
    constructionDate: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    totalArea: "",
    floors: 1,
    units: 1,
    usage: "",
    description: "",
    frameType: "",
    foundation: "",
    fireRating: "",
    exteriorCladding: "",
    seismicZone: "Zone IV (High Damage Risk)",
    builderCompany: "",
    builderName: "",
    builderContact: "",
    builderDetails: "",
    ownerName: "",
    ownerContact: "",
    ownerEmail: "",
    ownerAdditionalInfo: "",
    condition: "Good",
    maintenanceStatus: "Up to Date",
  };

  const SAMPLE_DEMO_DATA = {
    name: "Skyline Signature Commercial Towers",
    type: "Commercial High-Rise",
    constructionDate: "2023-01-15",
    address: "Plot 14, Commercial Sector 22, Ring Road",
    city: "New Delhi",
    state: "Delhi",
    postalCode: "110001",
    totalArea: "120,000 sq.ft",
    floors: 10,
    units: 45,
    usage: "Commercial Offices & Retail",
    description: "Grade-A commercial high-rise facility registered under Civil Digital Identity program.",
    frameType: "Reinforced Concrete Moment Resisting Frame (RCC)",
    foundation: "Cast-in-situ Friction Piles with Mat Cap",
    fireRating: "2-Hour Resistance",
    exteriorCladding: "Low-E Double Glazed Curtain Wall & Aluminum Composite",
    seismicZone: "Zone IV (High Damage Risk)",
    builderCompany: "National Infrastructure & Civil Ltd.",
    builderName: "Er. Ramesh Chandra",
    builderContact: "+91 11 2890 4000",
    builderDetails: "Certified Class-A CPWD Contractor",
    ownerName: "Metropolitan Property Trust",
    ownerContact: "+91 98100 12345",
    ownerEmail: "assets@metrotrust.in",
    ownerAdditionalInfo: "Asset registered under Municipal Real Estate Act",
    condition: "Good",
    maintenanceStatus: "Up to Date",
  };

  // Form State
  const [formData, setFormData] = useState(INITIAL_BLANK_FORM);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "floors" || name === "units" ? parseInt(value, 10) || 1 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        constructionDate: formData.constructionDate,
        location: {
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
        },
        totalArea: formData.totalArea.trim(),
        floors: formData.floors,
        units: formData.units,
        usage: formData.usage.trim(),
        description: formData.description.trim(),
        structuralInfo: {
          frameType: formData.frameType,
          foundation: formData.foundation,
          fireRating: formData.fireRating,
          exteriorCladding: formData.exteriorCladding,
          seismicZone: formData.seismicZone,
        },
        builder: {
          companyName: formData.builderCompany.trim(),
          builderName: formData.builderName.trim(),
          contact: formData.builderContact.trim(),
          details: formData.builderDetails.trim(),
        },
        owner: {
          name: formData.ownerName.trim(),
          contact: formData.ownerContact.trim(),
          email: formData.ownerEmail.trim(),
          additionalInfo: formData.ownerAdditionalInfo.trim(),
        },
        condition: formData.condition,
        maintenanceStatus: formData.maintenanceStatus,
      };

      const created = await api.buildings.create(payload);
      router.push(`/buildings/${created.id}`);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to register building passport. Please review all fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header */}
        <div className="pb-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono uppercase bg-slate-900 text-white px-2 py-0.5 rounded font-semibold tracking-wider">
                  Registration Dossier
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Civil Identity Generation
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
                Register New Building Passport
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Fill in architectural specifications, structural parameters, and ownership records to generate an official digital passport and QR code.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setFormData(SAMPLE_DEMO_DATA)}
                className="px-3 py-1.5 text-xs font-mono font-medium rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs cursor-pointer"
              >
                Load Sample Demo Details
              </button>
              <button
                type="button"
                onClick={() => setFormData(INITIAL_BLANK_FORM)}
                className="px-3 py-1.5 text-xs font-mono font-medium rounded border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Clear Form
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
          {/* SECTION 1: IDENTITY & LOCATION */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
            <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-slate-800" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                1. Building Identity & Location
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Building Name *
                </label>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Skyline Signature Towers"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Classification / Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono font-medium"
                >
                  <option value="Commercial High-Rise">Commercial High-Rise</option>
                  <option value="Residential Multi-Family">Residential Multi-Family</option>
                  <option value="Institutional / Public">Institutional / Public</option>
                  <option value="Mixed-Use Commercial">Mixed-Use Commercial</option>
                  <option value="Industrial Logistics">Industrial Logistics</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Construction Completion Date *
                </label>
                <input
                  type="date"
                  required
                  name="constructionDate"
                  value={formData.constructionDate}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Plot 14, Commercial Sector 22, Ring Road"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. New Delhi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  State / Postal Code
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="PIN Code"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: ARCHITECTURAL & STRUCTURAL INFORMATION */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
            <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-slate-100">
              <Layers className="w-5 h-5 text-slate-800" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                2. Architectural & Civil Engineering Specifications
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Total Built-up Area *
                </label>
                <input
                  type="text"
                  required
                  name="totalArea"
                  value={formData.totalArea}
                  onChange={handleChange}
                  placeholder="e.g. 185,000 sq.ft"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Number of Floors *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  name="floors"
                  value={formData.floors}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Number of Units *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  name="units"
                  value={formData.units}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Structural Frame System
                </label>
                <input
                  type="text"
                  name="frameType"
                  value={formData.frameType}
                  onChange={handleChange}
                  placeholder="e.g. Reinforced Concrete Moment Resisting Frame (RCC)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Sub-Structure Foundation System
                </label>
                <input
                  type="text"
                  name="foundation"
                  value={formData.foundation}
                  onChange={handleChange}
                  placeholder="e.g. Cast-in-situ Friction Piles with Mat Cap"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Seismic Classification
                </label>
                <select
                  name="seismicZone"
                  value={formData.seismicZone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono"
                >
                  <option value="Zone II (Low Damage Risk)">Zone II (Low)</option>
                  <option value="Zone III (Moderate Damage Risk)">Zone III (Moderate)</option>
                  <option value="Zone IV (High Damage Risk)">Zone IV (High)</option>
                  <option value="Zone V (Very High Damage Risk)">Zone V (Very High)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Exterior Cladding / Envelope
                </label>
                <input
                  type="text"
                  name="exteriorCladding"
                  value={formData.exteriorCladding}
                  onChange={handleChange}
                  placeholder="e.g. Low-E Double Glazed Curtain Wall & Aluminum Composite"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Fire Resistance Rating
                </label>
                <input
                  type="text"
                  name="fireRating"
                  value={formData.fireRating}
                  onChange={handleChange}
                  placeholder="e.g. 2-Hour Resistance"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: BUILDER & OWNER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Builder Info */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
              <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-slate-100">
                <HardHat className="w-5 h-5 text-slate-800" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  3. Builder & Contractor
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Contractor / Company Name
                  </label>
                  <input
                    type="text"
                    name="builderCompany"
                    value={formData.builderCompany}
                    onChange={handleChange}
                    placeholder="e.g. National Infrastructure & Civil Ltd."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Lead Engineer / Builder Name
                  </label>
                  <input
                    type="text"
                    name="builderName"
                    value={formData.builderName}
                    onChange={handleChange}
                    placeholder="e.g. Er. Ramesh Chandra"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Contact / RERA Reference
                  </label>
                  <input
                    type="text"
                    name="builderContact"
                    value={formData.builderContact}
                    onChange={handleChange}
                    placeholder="e.g. +91 11 2890 4000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Owner Info */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-slate-800" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    4. Owner Information
                  </h2>
                </div>
                <span className="text-[10px] font-mono uppercase bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded flex items-center">
                  <Shield className="w-2.5 h-2.5 mr-1" />
                  Protected
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Owner Name / Association
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="e.g. Metropolitan Property Trust"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone (Hidden on Public QR)
                  </label>
                  <input
                    type="text"
                    name="ownerContact"
                    value={formData.ownerContact}
                    onChange={handleChange}
                    placeholder="e.g. +91 98100 12345"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Official Email (Confidential)
                  </label>
                  <input
                    type="email"
                    name="ownerEmail"
                    value={formData.ownerEmail}
                    onChange={handleChange}
                    placeholder="e.g. assets@metrotrust.in"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-between">
            <Link
              href="/buildings"
              className="text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900"
            >
              &larr; Cancel Registration
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 py-3 px-6 rounded-md text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xs hover:shadow-sm"
            >
              {loading ? (
                <span>Generating Digital Passport & QR...</span>
              ) : (
                <>
                  <span>Create Passport & Generate QR</span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
