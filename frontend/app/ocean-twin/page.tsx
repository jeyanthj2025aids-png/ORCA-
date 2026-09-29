'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import OceanTwin3D from '@/components/OceanTwin3D';
import { fetchPFZ, fetchOceanConditions } from '@/lib/api';
import { PFZResult, MarineCondition } from '@/types/orca';
import { Globe, Layers, Navigation, Activity, Compass, Wind, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export default function OceanTwinPage() {
  const [pfzList, setPfzList] = useState<PFZResult[]>([]);
  const [conditions, setConditions] = useState<MarineCondition | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [pfz, cond] = await Promise.all([
          fetchPFZ(9.2876, 79.3129),
          fetchOceanConditions(9.2876, 79.3129),
        ]);
        setPfzList(pfz);
        setConditions(cond);
      } catch (e) {
        console.error('Error loading ocean twin data', e);
      }
    }
    load();
  }, []);

  return (
    <div className="flex h-screen bg-[#F7FAFD] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header />

        <main className="flex-1 p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-[#0A1628] flex items-center space-x-2">
                <Globe className="w-4 h-4 text-[#1A7FC1]" />
                <span>3D Digital Ocean Twin: Palk Strait & Gulf of Mannar Shelf</span>
              </h2>
              <p className="text-xs text-[#536B88] mt-0.5">
                Bathymetric terrain modeling, dynamic ocean current vectors, thermal SST dissipation, and fish school dynamics.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-sky-100 text-sky-800 font-semibold border border-sky-300">
                Resolution: 360m Grid
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                INCOIS / ISRO Schema
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-300">
                SIMULATED DATA
              </span>
            </div>
          </div>

          {/* 3D Ocean Twin Container */}
          <OceanTwin3D pfzData={pfzList} />

          {/* Telemetry Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg border border-[#D0DFF0] shadow-sm flex items-center space-x-3">
              <Activity className="w-6 h-6 text-[#1A7FC1]" />
              <div>
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Bathymetric Depth</div>
                <div className="font-extrabold text-[#0A1628] text-sm">-12.0m to -35.0m</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-[#D0DFF0] shadow-sm flex items-center space-x-3">
              <Wind className="w-6 h-6 text-emerald-600" />
              <div>
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Surface Drift Velocity</div>
                <div className="font-extrabold text-[#0A1628] text-sm">0.45 m/s (SE Flow)</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-[#D0DFF0] shadow-sm flex items-center space-x-3">
              <Compass className="w-6 h-6 text-amber-500" />
              <div>
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">IMBL Buffer Distance</div>
                <div className="font-extrabold text-[#0A1628] text-sm">6.8 NM East</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-[#D0DFF0] shadow-sm flex items-center space-x-3">
              <Navigation className="w-6 h-6 text-purple-600" />
              <div>
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Active PFZ Beacons</div>
                <div className="font-extrabold text-[#0A1628] text-sm">{pfzList.length || 3} Zones Active</div>
              </div>
            </div>
          </div>

          {/* Deep-Dive Agent Interlinks */}
          <div className="bg-white p-4 rounded-lg border border-[#D0DFF0] shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[#0A1628] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>Multi-Agent Spatial Ocean Reasoner</span>
              </div>
              <p className="text-[11px] text-[#536B88]">
                Cross-correlate volumetric current velocity, bathymetric upwelling, and chlorophyll plumes with the Gemini Copilot.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/copilot?query=Analyze%20upwelling%20and%20hydrodynamic%20currents%20for%20the%20active%20PFZ%20zones%20in%20Palk%20Strait"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A1628] hover:bg-[#1A7FC1] text-white rounded text-xs font-semibold transition"
              >
                <span>Analyze Zone in Copilot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/routes"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D0DFF0] hover:bg-slate-50 text-[#0A1628] rounded text-xs font-semibold transition"
              >
                <span>Calculate Safe Transit Corridor</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
