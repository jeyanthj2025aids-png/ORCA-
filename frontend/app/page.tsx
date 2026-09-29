'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MarineMap from '@/components/MarineMap';
import {
  fetchOceanConditions, fetchWeather, fetchPFZ, fetchHazards, fetchBoundaries
} from '@/lib/api';
import { MarineCondition, PFZResult, HazardItem, BoundaryItem } from '@/types/orca';
import {
  Thermometer, Waves, Wind, Activity, AlertTriangle, ShieldCheck,
  Fish, Navigation, ArrowUpRight, Sparkles, CheckCircle2, Clock
} from 'lucide-react';

export default function OverviewPage() {
  const [location, setLocation] = useState('Rameswaram Harbor');
  const [conditions, setConditions] = useState<MarineCondition | null>(null);
  const [pfzList, setPfzList] = useState<PFZResult[]>([]);
  const [hazards, setHazards] = useState<HazardItem[]>([]);
  const [boundaries, setBoundaries] = useState<BoundaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cond, pfz, haz, bound] = await Promise.all([
          fetchOceanConditions(9.2876, 79.3129),
          fetchPFZ(9.2876, 79.3129),
          fetchHazards(),
          fetchBoundaries()
        ]);
        setConditions(cond);
        setPfzList(pfz);
        setHazards(haz);
        setBoundaries(bound);
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [location]);

  return (
    <div className="flex min-h-screen bg-[#F7FAFD]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header currentLocation={location} onLocationChange={setLocation} />

        <main className="p-6 space-y-6 overflow-y-auto">
          {/* Top Banner: Welcome & Operational Mode */}
          <div className="bg-gradient-to-r from-[#0A1628] to-[#0D2142] rounded-lg p-5 text-white shadow-md border border-[#1B2F4E] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-[#1A7FC1] px-2 py-0.5 rounded font-mono uppercase font-bold tracking-wider">
                  ISRO / NRSC • SIH26176
                </span>
                <span className="text-xs bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono">
                  DEMO DATA MODE
                </span>
              </div>
              <h2 className="text-xl font-bold mt-2 text-white">
                ORCA Marine Ecosystem Operations Dashboard
              </h2>
              <p className="text-xs text-gray-300 mt-1 max-w-2xl">
                Collaborative multi-agent reasoning over satellite Earth Observation, ocean dynamics, meteorological forecasts, and spatial maritime boundaries.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/copilot?demo=fishing_safety"
                className="bg-[#1A7FC1] hover:bg-[#1569a0] text-white px-3.5 py-2 rounded text-xs font-semibold flex items-center space-x-1.5 shadow transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch Copilot</span>
              </Link>
              <Link
                href="/ocean-twin"
                className="bg-[#12243F] hover:bg-[#1A3358] border border-[#1B2F4E] text-white px-3.5 py-2 rounded text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <span>3D Ocean Twin</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Condition Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* SST */}
            <div className="bg-white p-3.5 rounded border border-[#D0DFF0] shadow-sm hover:border-[#1A7FC1] transition">
              <div className="flex items-center justify-between text-[#536B88] text-xs">
                <span className="font-semibold">Sea Surface Temp</span>
                <Thermometer className="w-4 h-4 text-orange-500" />
              </div>
              <div className="mt-2 text-xl font-extrabold text-[#0A1628]">
                {conditions?.sst_celsius ? `${conditions.sst_celsius}°C` : '29.2°C'}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                INSAT-3DR / SSTM Thermal
              </div>
            </div>

            {/* Wave Height */}
            <div className="bg-white p-3.5 rounded border border-[#D0DFF0] shadow-sm hover:border-[#1A7FC1] transition">
              <div className="flex items-center justify-between text-[#536B88] text-xs">
                <span className="font-semibold">Wave Height (Swell)</span>
                <Waves className="w-4 h-4 text-sky-600" />
              </div>
              <div className="mt-2 text-xl font-extrabold text-[#0A1628]">
                {conditions?.wave_height_m ? `${conditions.wave_height_m} m` : '1.95 m'}
              </div>
              <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                INCOIS OSF Model
              </div>
            </div>

            {/* Wind Speed */}
            <div className="bg-white p-3.5 rounded border border-[#D0DFF0] shadow-sm hover:border-[#1A7FC1] transition">
              <div className="flex items-center justify-between text-[#536B88] text-xs">
                <span className="font-semibold">Surface Wind</span>
                <Wind className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 text-xl font-extrabold text-[#0A1628]">
                {conditions?.wind_speed_knots ? `${conditions.wind_speed_knots} kts` : '19.5 kts'}
              </div>
              <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                SE Direction (135°)
              </div>
            </div>

            {/* Chlorophyll */}
            <div className="bg-white p-3.5 rounded border border-[#D0DFF0] shadow-sm hover:border-[#1A7FC1] transition">
              <div className="flex items-center justify-between text-[#536B88] text-xs">
                <span className="font-semibold">Chlorophyll-a</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-xl font-extrabold text-[#0A1628]">
                {conditions?.chlorophyll_mg_m3 ? `${conditions.chlorophyll_mg_m3} mg/m³` : '1.28 mg/m³'}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                Oceansat-3 / OCM-3
              </div>
            </div>

            {/* Sea State */}
            <div className="bg-white p-3.5 rounded border border-[#D0DFF0] shadow-sm hover:border-[#1A7FC1] transition">
              <div className="flex items-center justify-between text-[#536B88] text-xs">
                <span className="font-semibold">Sea State</span>
                <ShieldCheck className="w-4 h-4 text-teal-600" />
              </div>
              <div className="mt-2 text-base font-bold text-[#0A1628] truncate">
                {conditions?.sea_state || 'Moderate Swell'}
              </div>
              <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                Channels: Rough Chop
              </div>
            </div>

            {/* Active Alerts */}
            <div className="bg-white p-3.5 rounded border border-[#D0DFF0] shadow-sm hover:border-amber-500 transition">
              <div className="flex items-center justify-between text-[#536B88] text-xs">
                <span className="font-semibold">Active Alerts</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-xl font-extrabold text-amber-600">
                {hazards.length || 2} Warnings
              </div>
              <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                High Swell & IMBL Caution
              </div>
            </div>
          </div>

          {/* Interactive Situation Map & Right Operational Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Marine Situation Map */}
            <div className="lg:col-span-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0A1628] flex items-center space-x-2">
                  <span>Marine Situation Map (Palk Bay & Gulf of Mannar)</span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                    Live GIS Overlay
                  </span>
                </h3>
                <span className="text-xs text-[#536B88] flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Cycle: {conditions?.timestamp?.slice(0, 16) || 'Current'}</span>
                </span>
              </div>

              <MarineMap
                pfzData={pfzList}
                hazards={hazards}
                boundaries={boundaries}
                centerLat={9.2876}
                centerLon={79.3129}
              />
            </div>

            {/* Right Operational Summary & PFZ Hotspots */}
            <div className="space-y-4">
              {/* Potential Fishing Zones list */}
              <div className="bg-white rounded border border-[#D0DFF0] p-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2ECF8]">
                  <span className="font-bold text-xs text-[#0A1628] flex items-center space-x-1.5">
                    <Fish className="w-4 h-4 text-emerald-600" />
                    <span>Identified PFZs Today</span>
                  </span>
                  <Link href="/fisheries" className="text-[11px] text-[#1A7FC1] hover:underline font-medium">
                    View all →
                  </Link>
                </div>

                <div className="mt-3 space-y-3">
                  {pfzList.slice(0, 3).map((pfz) => (
                    <div key={pfz.zone_id} className="p-2.5 rounded bg-[#F7FAFD] border border-[#E2ECF8] text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-[#0A1628]">
                        <span>{pfz.name}</span>
                        <span className="text-emerald-700 font-mono text-[11px]">{pfz.distance_km} km</span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        SST: <span className="font-medium text-gray-700">{pfz.sst_celsius}°C</span> • Chlorophyll: <span className="font-medium text-gray-700">{pfz.chlorophyll_mg_m3} mg/m³</span>
                      </div>
                      <div className="text-[10px] text-[#0E9E8A] font-medium truncate">
                        Species: {pfz.target_species?.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Hazard Feed */}
              <div className="bg-white rounded border border-[#D0DFF0] p-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2ECF8]">
                  <span className="font-bold text-xs text-[#0A1628] flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Marine Advisories</span>
                  </span>
                  <Link href="/safety" className="text-[11px] text-[#1A7FC1] hover:underline font-medium">
                    Details →
                  </Link>
                </div>

                <div className="mt-3 space-y-2.5 text-xs">
                  <div className="p-2 rounded bg-amber-50 border border-amber-200">
                    <div className="font-bold text-amber-900">Mandapam Channel Swell</div>
                    <div className="text-[11px] text-amber-800 mt-0.5">
                      Short period swells &gt; 1.9m observed in channel entrance. Exercise caution.
                    </div>
                  </div>
                  <div className="p-2 rounded bg-red-50 border border-red-200">
                    <div className="font-bold text-red-900">IMBL Standoff Reminder</div>
                    <div className="text-[11px] text-red-800 mt-0.5">
                      Maintain strict 3 NM clearance from the India-Sri Lanka boundary.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
