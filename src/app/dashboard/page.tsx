"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  FileCheck2,
  AlertTriangle,
  Wrench,
  Plus,
  QrCode,
  ArrowUpRight,
  Database,
  ExternalLink,
  Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { BuildingRecord, DefectRecord, MaintenanceRecord } from "@/lib/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface HealthInfo {
  status: string;
  environment: string;
  database?: {
    provider?: string;
    connected: boolean;
    mode: string;
    notice: string;
    postgres?: {
      connected?: boolean;
      endpoint?: string;
      database?: string;
      latencyMs?: number;
      version?: string;
    };
    mongodb?: {
      connected?: boolean;
    };
  };
  version?: string;
}

export default function DashboardPage() {
  const { user, quickLogin } = useAuth();
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalBuildings: 0,
    totalInspections: 0,
    openDefects: 0,
    criticalDefects: 0,
    totalMaintenanceCost: 0,
  });

  useEffect(() => {
    let ignore = false;
    async function loadDashboardData() {
      try {
        const [buildingsData, health] = await Promise.all([
          api.buildings.list().catch(() => []),
          api.getHealth().catch(() => null),
        ]);

        if (ignore) return;
        setBuildings(buildingsData);
        setHealthInfo(health);

        // Aggregate metrics
        let inspCount = 0;
        let defCount = 0;
        let critCount = 0;
        let maintCost = 0;

        for (const b of buildingsData) {
          try {
            const [insps, defs, maints] = await Promise.all([
              api.inspections.list(b.id).catch(() => []),
              api.defects.list(b.id).catch(() => []),
              api.maintenance.list(b.id).catch(() => []),
            ]);
            inspCount += insps.length;
            defCount += defs.filter((d: DefectRecord) => d.status === "Open" || d.status === "In Review").length;
            critCount += defs.filter((d: DefectRecord) => d.severity === "Critical").length;
            maintCost += maints.reduce((sum: number, m: MaintenanceRecord) => sum + (m.cost || 0), 0);
          } catch {
            // Skip individual aggregation failures
          }
        }

        if (!ignore) {
          setStats({
            totalBuildings: buildingsData.length,
            totalInspections: inspCount,
            openDefects: defCount,
            criticalDefects: critCount,
            totalMaintenanceCost: maintCost,
          });
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError((err as Error).message || "Failed to load dashboard data");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();
    return () => {
      ignore = true;
    };
  }, []);

  // Database status determination
  const isPostgresConnected = Boolean(
    healthInfo?.database?.connected &&
      (healthInfo.database.provider === "postgresql" || !healthInfo.database.provider) &&
      (healthInfo.database.mode === "live-postgresql" || !healthInfo.database.mode)
  );

  const rawPgVersion = healthInfo?.database?.postgres?.version?.trim();
  const dynamicEngineLabel = rawPgVersion
    ? rawPgVersion.toLowerCase().startsWith("postgresql")
      ? rawPgVersion
      : `PostgreSQL ${rawPgVersion}`
    : "PostgreSQL";

  const dbStatusTitle = isPostgresConnected
    ? `${dynamicEngineLabel} (Active)`
    : "PostgreSQL (Disconnected)";

  const dbStatusNotice = isPostgresConnected
    ? healthInfo?.database?.notice || "Connected to PostgreSQL primary database."
    : healthInfo?.database?.notice || "PostgreSQL primary database is currently disconnected.";

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Top Header / Context */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase bg-slate-900 text-white px-2 py-0.5 rounded font-semibold tracking-wider">
                Stage 2 Platform
              </span>
              <span className="text-xs font-mono text-slate-500">
                Civil Infrastructure Ledger
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Building Information Management Dashboard
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Verifiable structural identities, digital inspection audits, and lifecycle management.
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
            <Link
              href="/buildings"
              className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 px-3.5 py-2.5 rounded-md border border-slate-300 shadow-2xs transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Browse Registry</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Database Connection Banner (Explicit transparency as required by Section 30) */}
        <div className="mt-6 p-3.5 sm:p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${
                isPostgresConnected
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              }`}
            />
            <div>
              <p className="font-semibold text-slate-900 flex items-center">
                <Database className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                Database Engine:{" "}
                <span className="ml-1 font-mono text-[11px] font-bold">
                  {dbStatusTitle}
                </span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {dbStatusNotice}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {user ? (
              <span className="text-[11px] font-mono bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-700">
                Session: <strong>{user.name}</strong> ({user.role.toUpperCase()})
              </span>
            ) : (
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] text-slate-500 font-mono">Demo Role:</span>
                <button
                  type="button"
                  onClick={() => quickLogin("admin")}
                  className="px-2 py-0.5 text-[10px] uppercase font-mono bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin("engineer")}
                  className="px-2 py-0.5 text-[10px] uppercase font-mono bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
                >
                  Engineer
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin("owner")}
                  className="px-2 py-0.5 text-[10px] uppercase font-mono bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
                >
                  Owner
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Passports */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-500 tracking-wider">
                Total Registered Passports
              </span>
              <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-700">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-bold font-mono text-slate-900">
                {stats.totalBuildings}
              </span>
              <span className="text-xs text-slate-500 font-mono">Assets</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
              <span>All active civil structures</span>
              <Link href="/buildings" className="font-semibold text-slate-900 hover:underline">
                View all &rarr;
              </Link>
            </p>
          </div>

          {/* Inspections */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-500 tracking-wider">
                Audits & Inspections
              </span>
              <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-800 flex items-center justify-center">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-bold font-mono text-slate-900">
                {stats.totalInspections}
              </span>
              <span className="text-xs text-slate-500 font-mono">Reports</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              Engineering inspections on file
            </p>
          </div>

          {/* Open Defects */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-500 tracking-wider">
                Active Defect Log
              </span>
              <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-800 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-bold font-mono text-slate-900">
                {stats.openDefects}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Open ({stats.criticalDefects} Critical)
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              Requiring repair or remediation
            </p>
          </div>

          {/* Maintenance Ledger */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-500 tracking-wider">
                Maintenance Ledger
              </span>
              <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-slate-900">
                ₹{(stats.totalMaintenanceCost).toLocaleString("en-IN")}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              Cumulative completed civil repairs
            </p>
          </div>
        </div>

        {/* Buildings Table Section */}
        <div className="mt-8 bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Registered Civil Building Passports</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official registry with persistent ID, QR telemetry, and lifecycle records.
              </p>
            </div>
            <Link
              href="/buildings"
              className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center"
            >
              View Full Registry Table <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-slate-400">
              Loading civil building passports...
            </div>
          ) : buildings.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">No Building Passports Registered</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Begin by creating a verified digital passport for your first building asset.
              </p>
              <Link
                href="/buildings/new"
                className="mt-4 inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register First Building</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-mono text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Passport ID</th>
                    <th className="py-3 px-4 font-semibold">Building Name</th>
                    <th className="py-3 px-4 font-semibold">Classification</th>
                    <th className="py-3 px-4 font-semibold">Location</th>
                    <th className="py-3 px-4 font-semibold">Condition</th>
                    <th className="py-3 px-4 font-semibold">QR Code</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {buildings.slice(0, 6).map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <Link href={`/buildings/${b.id}`} className="hover:underline text-slate-900">
                          {b.passportId}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <Link href={`/buildings/${b.id}`} className="hover:underline">
                          {b.name}
                        </Link>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {b.floors} Floors • {b.units} Units • {b.totalArea}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {b.type}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {b.location.city}, {b.location.state || "IN"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            b.condition === "Good" || b.condition === "Excellent"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                              : b.condition === "Fair"
                              ? "bg-amber-50 text-amber-800 border border-amber-200/60"
                              : "bg-rose-50 text-rose-800 border border-rose-200/60"
                          }`}
                        >
                          {b.condition}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link
                          href={`/public/building/${b.passportId}`}
                          target="_blank"
                          title="View Public QR Record"
                          className="inline-flex items-center space-x-1 font-mono text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200 hover:border-slate-300"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-700" />
                          <span>Public QR</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/buildings/${b.id}`}
                          className="inline-flex items-center font-semibold text-slate-900 hover:underline uppercase text-[11px] tracking-wider"
                        >
                          Manage &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
