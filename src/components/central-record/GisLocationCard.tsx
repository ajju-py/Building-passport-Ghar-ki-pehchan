"use client";

import React, { useState } from "react";
import {
  Compass,
  Copy,
  Check,
  ExternalLink,
  Ruler,
  Building,
  UserCheck,
} from "lucide-react";
import { BuildingRecord } from "@/lib/types";

interface GisLocationCardProps {
  building: BuildingRecord;
}

export const GisLocationCard: React.FC<GisLocationCardProps> = ({ building }) => {
  const [copied, setCopied] = useState(false);

  const lat = building.location.coordinates?.lat ?? 18.5204;
  const lng = building.location.coordinates?.lng ?? 73.8567;
  const hasRealCoords =
    building.location.coordinates?.lat !== undefined &&
    building.location.coordinates?.lat !== null;

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase bg-slate-900 text-white px-2 py-0.5 rounded font-semibold tracking-wider">
              GIS Registry
            </span>
            <span className="text-xs font-mono text-slate-500">
              Geo-Spatial &amp; Title Coordinates
            </span>
            {hasRealCoords && (
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                GPS Verified
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            Cadastral Coordinates &amp; Site Polygon
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={copyCoordinates}
            className="inline-flex items-center space-x-1.5 text-xs font-mono bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded transition-colors text-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Coords</span>
              </>
            )}
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 px-2.5 py-1.5 rounded hover:bg-slate-50 transition-colors"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={osmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 px-2.5 py-1.5 rounded hover:bg-slate-50 transition-colors"
          >
            <span>OSM</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Cadastral Numbers & Plot Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-slate-50 p-3 rounded border border-slate-100">
          <div className="text-slate-400 text-[10px] uppercase">Plot Number</div>
          <div className="font-bold text-slate-900 mt-1">
            {building.plotNumber || "Plot No. 42-A"}
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded border border-slate-100">
          <div className="text-slate-400 text-[10px] uppercase">Survey / CTS No.</div>
          <div className="font-bold text-slate-900 mt-1">
            {building.surveyNumber || "Survey 108/2"}
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded border border-slate-100">
          <div className="text-slate-400 text-[10px] uppercase">Built-Up Area</div>
          <div className="font-bold text-slate-900 mt-1">
            {building.builtUpArea || building.totalArea || "42,500 sq.ft"}
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded border border-slate-100">
          <div className="text-slate-400 text-[10px] uppercase">Occupancy Status</div>
          <div className="font-bold text-emerald-800 mt-1">
            {building.occupancyStatus || "Occupied"}
          </div>
        </div>
      </div>

      {/* Interactive SVG Cadastral Map Representation */}
      <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800 text-white p-4">
        {/* Map Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-slate-200 font-semibold">GIS SITE FOOTPRINT &amp; BOUNDARY</span>
          </div>
          <div className="flex items-center space-x-3">
            <span>LAT: {Number(lat).toFixed(5)}° N</span>
            <span>LNG: {Number(lng).toFixed(5)}° E</span>
          </div>
        </div>

        {/* SVG Drawing Canvas */}
        <div className="relative h-64 sm:h-72 w-full flex items-center justify-center bg-slate-900/60 my-2 rounded border border-slate-800/80">
          {/* North Arrow */}
          <div className="absolute top-3 right-3 flex flex-col items-center font-mono text-[10px] text-slate-400">
            <Compass className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-white mt-0.5">N</span>
          </div>

          {/* Scale Legend */}
          <div className="absolute bottom-3 left-3 bg-slate-950/80 px-2 py-1 rounded text-[10px] font-mono text-slate-400 border border-slate-800 flex items-center space-x-2">
            <Ruler className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scale: 1:500 Cadastral</span>
          </div>

          <svg className="w-full h-full p-6" viewBox="0 0 400 240">
            {/* Background Grid */}
            <defs>
              <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="400" height="240" fill="url(#cadGrid)" />

            {/* Setback / Boundary Outer Line */}
            <polygon
              points="40,30 360,25 340,210 55,200"
              fill="rgba(16, 185, 129, 0.05)"
              stroke="#059669"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text x="50" y="25" fill="#34d399" fontSize="9" fontFamily="monospace">
              Cadastral Boundary Plot #{building.plotNumber || "42-A"}
            </text>

            {/* Built-up Structure Polygon */}
            <polygon
              points="90,65 310,60 295,175 105,170"
              fill="rgba(15, 23, 42, 0.85)"
              stroke="#10b981"
              strokeWidth="2.2"
            />

            {/* Diagonal Hatching for Plinth Area */}
            <line x1="90" y1="65" x2="295" y2="175" stroke="#10b981" strokeWidth="0.7" strokeDasharray="3 3" />
            <line x1="310" y1="60" x2="105" y2="170" stroke="#10b981" strokeWidth="0.7" strokeDasharray="3 3" />

            {/* Center GPS Pin Target */}
            <circle cx="200" cy="118" r="4" fill="#10b981" />
            <circle cx="200" cy="118" r="10" fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="2 2" />

            <text x="200" y="140" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
              {building.name}
            </text>
            <text x="200" y="153" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              Plinth Footprint: {building.builtUpArea || building.totalArea || "42,500 sq.ft"}
            </text>
          </svg>
        </div>

        {/* Professional Certifiers Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-mono block">
                Structural Engineer of Record
              </span>
              <span className="font-semibold text-slate-100">
                {building.structuralEngineerName || "Er. V. K. Deshmukh"}
              </span>
              <span className="text-slate-400 font-mono text-[10px] ml-1.5">
                ({building.structuralEngineerLicense || "SE-MUM-2018/890"})
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-mono block">
                Consulting Architect of Record
              </span>
              <span className="font-semibold text-slate-100">
                {building.architectName || "Ar. Sunita Rao, COA"}
              </span>
              <span className="text-slate-400 font-mono text-[10px] ml-1.5">
                ({building.architectLicense || "CA/2012/54321"})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GisLocationCard;
