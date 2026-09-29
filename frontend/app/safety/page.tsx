'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MarineMap from '@/components/MarineMap';
import { fetchHazards, fetchBoundaries, fetchOceanConditions } from '@/lib/api';
import { HazardItem, BoundaryItem, MarineCondition } from '@/types/orca';
import { ShieldAlert, AlertTriangle, ShieldCheck, Compass, ArrowRight, Waves, Wind } from 'lucide-react';

export default function SafetyPage() {
  const [hazards, setHazards] = useState<HazardItem[]>([]);
  const [boundaries, setBoundaries] = useState<BoundaryItem[]>([]);
  const [conditions, setConditions] = useState<MarineCondition | null>(null);

  useEffect(() => {
    async function load() {
      const [h, b, c] = await Promise.all([
        fetchHazards(),
        fetchBoundaries(),
        fetchOceanConditions(9.2876, 79.3129)
      ]);
      setHazards(h);
      setBoundaries(b);
      setConditions(c);
    }
    load();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F7FAFD]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0A1628] flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span>Marine Safety, Geofencing & Operational Hazards</span>
              </h2>
              <p className="text-xs text-[#536B88] mt-0.5">
                Proactive hazard monitoring: High swell alerts, IMBL territorial boundary proximity, and Gulf of Mannar Marine Protected Areas.
              </p>
            </div>
            <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2.5 py-1 rounded border border-amber-300">
              Joint Maritime Safety Advisory
            </span>
          </div>

          {/* Risk Level Banner */}
          <div className="p-5 rounded-lg bg-white border border-[#D0DFF0] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-black text-amber-700 text-lg">
                !
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  CURRENT COMPOSITE MARINE RISK
                </div>
                <div className="text-xl font-extrabold text-[#0A1628] flex items-center space-x-2">
                  <span className="text-amber-600">MODERATE (Score: 0.45)</span>
                  <span className="text-xs text-gray-400 font-normal font-sans">
                    • Artisanal craft exercise caution; mechanized vessels permissible
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/copilot?demo=fishing_safety"
              className="bg-[#1A7FC1] hover:bg-[#1569a0] text-white px-4 py-2 rounded text-xs font-semibold flex items-center space-x-1.5 shadow transition shrink-0"
            >
              <span>Audit Safety in Copilot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Hazards & Boundaries Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Hazard Advisories */}
            <div className="bg-white rounded-lg border border-[#D0DFF0] p-4 shadow-sm space-y-3">
              <div className="font-bold text-xs text-[#0A1628] flex items-center space-x-1.5 pb-2 border-b border-[#E2ECF8]">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Active Coastal & Navigational Hazards</span>
              </div>

              {hazards.map((h) => (
                <div key={h.id} className="p-3 bg-amber-50/70 rounded border border-amber-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-950">
                    <span>{h.title}</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                      {h.severity}
                    </span>
                  </div>
                  <p className="text-gray-700">{h.description}</p>
                  <div className="text-[10px] text-gray-500 pt-1">
                    Affected Radius: {h.affected_radius_km} km • Validity: Active advisory
                  </div>
                </div>
              ))}
            </div>

            {/* Geofences & Boundaries */}
            <div className="bg-white rounded-lg border border-[#D0DFF0] p-4 shadow-sm space-y-3">
              <div className="font-bold text-xs text-[#0A1628] flex items-center space-x-1.5 pb-2 border-b border-[#E2ECF8]">
                <Compass className="w-4 h-4 text-red-600" />
                <span>Maritime Boundaries & Protected Waters</span>
              </div>

              {boundaries.map((b) => (
                <div key={b.id} className="p-3 bg-slate-50 rounded border border-[#E2ECF8] text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-[#0A1628]">
                    <span>{b.name}</span>
                    <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-mono font-bold">
                      {b.type}
                    </span>
                  </div>
                  <p className="text-gray-600">{b.description}</p>
                  <div className="text-[10px] text-red-600 font-semibold pt-1">
                    Warning Standoff: 3.0 to 5.0 NM strict buffer required.
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Situation Map */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#0A1628]">Geofence & Hazard Situation Map</div>
            <MarineMap hazards={hazards} boundaries={boundaries} />
          </div>
        </main>
      </div>
    </div>
  );
}
