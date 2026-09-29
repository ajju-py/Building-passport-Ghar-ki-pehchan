"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Plus,
  QrCode,
  MapPin,
  Layers,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { BuildingRecord } from "@/lib/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function BuildingsRegistryPage() {
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");

  useEffect(() => {
    let ignore = false;
    async function loadBuildings() {
      try {
        const data = await api.buildings.list({
          search: search || undefined,
          type: typeFilter !== "all" ? typeFilter : undefined,
          condition: conditionFilter !== "all" ? conditionFilter : undefined,
        });
        if (!ignore) {
          setBuildings(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError((err as Error).message || "Failed to load building registry.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadBuildings();
    return () => {
      ignore = true;
    };
  }, [search, typeFilter, conditionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold tracking-wider">
                Registry Index
              </span>
              <span className="text-xs font-mono text-slate-500">
                Verifiable Public & Internal Records
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Civil Building Registry
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Search, inspect, and manage building identities across jurisdictions.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <Link
              href="/buildings/new"
              className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-md border border-slate-800 shadow-xs hover:shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register Building</span>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Building Name, Passport ID (e.g. BP-2026), or City..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800 uppercase font-mono font-medium"
              >
                <option value="all">All Classifications</option>
                <option value="Commercial">Commercial</option>
                <option value="Residential">Residential</option>
                <option value="Institutional">Institutional</option>
              </select>
            </div>

            <div className="sm:col-span-3 flex space-x-2">
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800 uppercase font-mono font-medium"
              >
                <option value="all">All Conditions</option>
                <option value="Good">Good / Excellent</option>
                <option value="Fair">Fair Condition</option>
                <option value="Poor">Attention Required</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold uppercase tracking-wider shrink-0 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Buildings Grid */}
        <div className="mt-6">
          {loading ? (
            <div className="p-16 text-center text-xs font-mono text-slate-400">
              Querying building passport registry...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          ) : buildings.length === 0 ? (
            <div className="p-16 text-center bg-white border border-slate-200 rounded-lg">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">No Matching Buildings Found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search criteria or register a new building asset.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buildings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-lg shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5">
                    {/* Top bar */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {b.passportId}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded ${
                          b.condition === "Good" || b.condition === "Excellent"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                            : b.condition === "Fair"
                            ? "bg-amber-50 text-amber-800 border border-amber-200/60"
                            : "bg-rose-50 text-rose-800 border border-rose-200/60"
                        }`}
                      >
                        {b.condition}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-1">
                      <Link href={`/buildings/${b.id}`}>{b.name}</Link>
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 uppercase">
                      {b.type} • Built {b.constructionDate.split("-")[0]}
                    </p>

                    {/* Quick Specs */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                        <span className="truncate">{b.location.address}, {b.location.city}</span>
                      </div>
                      <div className="flex items-center text-[11px]">
                        <Layers className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                        <span>{b.floors} Floors • {b.units} Units • {b.totalArea}</span>
                      </div>
                      <div className="flex items-center text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                        <span className="truncate">{b.structuralInfo.frameType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                    <Link
                      href={`/public/building/${b.passportId}`}
                      target="_blank"
                      className="inline-flex items-center space-x-1 text-slate-600 hover:text-slate-900 font-mono text-[11px]"
                    >
                      <QrCode className="w-3.5 h-3.5 text-slate-700" />
                      <span>Public QR</span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                    </Link>

                    <Link
                      href={`/buildings/${b.id}`}
                      className="font-semibold text-slate-900 hover:text-slate-700 inline-flex items-center uppercase text-[11px] tracking-wider"
                    >
                      <span>Full Passport</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
