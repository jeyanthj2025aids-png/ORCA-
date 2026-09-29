'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MarineMap from '@/components/MarineMap';
import { calculateRoute, fetchPFZ, fetchBoundaries } from '@/lib/api';
import { RouteResult, PFZResult, BoundaryItem } from '@/types/orca';
import { Route, Navigation, Compass, ShieldCheck, ArrowRight, Clock, Gauge } from 'lucide-react';

export default function RoutesPage() {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [pfzList, setPfzList] = useState<PFZResult[]>([]);
  const [boundaries, setBoundaries] = useState<BoundaryItem[]>([]);
  const [originName, setOriginName] = useState('Rameswaram Fishing Harbor');
  const [destName, setDestName] = useState('Rameswaram East Outer Bank');
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    async function init() {
      const [pfz, bound] = await Promise.all([
        fetchPFZ(9.2876, 79.3129),
        fetchBoundaries()
      ]);
      setPfzList(pfz);
      setBoundaries(bound);
      handleCalculateRoute(9.2876, 79.3129, 9.3250, 79.4680);
    }
    init();
  }, []);

  const handleCalculateRoute = async (oLat = 9.2876, oLon = 79.3129, dLat = 9.3250, dLon = 79.4680) => {
    try {
      setCalculating(true);
      const res = await calculateRoute(oLat, oLon, dLat, dLon, originName, destName);
      setRoute(res);
    } catch (e) {
      console.error('Route error:', e);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F7FAFD]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0A1628] flex items-center space-x-2">
                <Route className="w-5 h-5 text-[#1A7FC1]" />
                <span>Deterministic Navigational Route Optimization</span>
              </h2>
              <p className="text-xs text-[#536B88] mt-0.5">
                Algorithms calculate optimal corridors steering clear of shallow reefs, swell surges, and the IMBL buffer zone.
              </p>
            </div>
            <span className="text-xs bg-sky-100 text-sky-800 font-semibold px-2.5 py-1 rounded border border-sky-300">
              Deterministic Navigation Engine
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Route Summary & Waypoints Table */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-lg border border-[#D0DFF0] p-4 shadow-sm space-y-4">
                <div className="font-bold text-xs text-[#0A1628] pb-2 border-b border-[#E2ECF8]">
                  Route Corridor Parameters
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase">Departure Harbor</label>
                    <select
                      value={originName}
                      onChange={(e) => setOriginName(e.target.value)}
                      className="w-full mt-1 bg-[#F7FAFD] border border-[#D0DFF0] rounded p-2 text-xs font-semibold text-[#0A1628]"
                    >
                      <option value="Rameswaram Fishing Harbor">Rameswaram Fishing Harbor (9.288°N, 79.313°E)</option>
                      <option value="Mandapam Marine Station">Mandapam Marine Station (9.278°N, 79.125°E)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase">Destination Fishing Zone</label>
                    <select
                      value={destName}
                      onChange={(e) => setDestName(e.target.value)}
                      className="w-full mt-1 bg-[#F7FAFD] border border-[#D0DFF0] rounded p-2 text-xs font-semibold text-[#0A1628]"
                    >
                      {pfzList.map((p) => (
                        <option key={p.zone_id} value={p.name}>
                          {p.name} ({p.distance_km} km)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleCalculateRoute()}
                    disabled={calculating}
                    className="w-full bg-[#1A7FC1] hover:bg-[#1569a0] text-white py-2 rounded text-xs font-semibold transition shadow"
                  >
                    {calculating ? 'Recomputing Corridors...' : 'Calculate Safe Corridor'}
                  </button>
                </div>

                {/* Route Metrics */}
                {route && (
                  <div className="pt-3 border-t border-[#E2ECF8] space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#F0F5FA]">
                      <span className="text-gray-500 flex items-center space-x-1">
                        <Compass className="w-3.5 h-3.5 text-gray-400" />
                        <span>Total Sea Distance:</span>
                      </span>
                      <span className="font-extrabold text-[#0A1628] font-mono">{route.distance_nm} NM</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#F0F5FA]">
                      <span className="text-gray-500 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Estimated Transit:</span>
                      </span>
                      <span className="font-extrabold text-[#0A1628] font-mono">~{route.estimated_hours} Hours</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#F0F5FA]">
                      <span className="text-gray-500 flex items-center space-x-1">
                        <Gauge className="w-3.5 h-3.5 text-gray-400" />
                        <span>Fuel Efficiency Index:</span>
                      </span>
                      <span className="font-extrabold text-emerald-700 font-mono">
                        {Math.round(route.fuel_efficiency_index * 100)}%
                      </span>
                    </div>

                    {route.hazards_avoided.length > 0 && (
                      <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-[11px] text-emerald-900">
                        <div className="font-bold flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Hazards Avoided:</span>
                        </div>
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                          {route.hazards_avoided.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Waypoints Breakdown */}
              {route && (
                <div className="bg-white rounded-lg border border-[#D0DFF0] p-4 shadow-sm space-y-2">
                  <div className="font-bold text-xs text-[#0A1628]">Navigational Waypoint Corridor</div>
                  <div className="space-y-2 text-xs">
                    {route.waypoints.map((wp, i) => (
                      <div key={i} className="p-2 bg-[#F7FAFD] rounded border border-[#E2ECF8] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#0A1628]">{wp.name || `Waypoint ${i + 1}`}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{wp.lat.toFixed(4)}°N, {wp.lon.toFixed(4)}°E</div>
                        </div>
                        <div className="text-[10px] text-sky-800 font-mono font-bold">
                          +{wp.leg_distance_nm} NM
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/copilot?query=${encodeURIComponent(
                      `Explain why safe route ${route.route_id} was selected from ${originName} to ${destName}, including avoided hazards and fuel efficiency.`
                    )}`}
                    className="w-full mt-2 bg-[#F0F5FA] hover:bg-[#E2ECF8] border border-[#D0DFF0] text-[#1A7FC1] py-2 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                  >
                    <span>Explain Route in Copilot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Situation Map Showing Route Corridor */}
            <div className="lg:col-span-2 space-y-2">
              <div className="text-xs font-bold text-[#0A1628]">Route Corridor Visualizer</div>
              <MarineMap
                pfzData={pfzList}
                boundaries={boundaries}
                centerLat={9.2876}
                centerLon={79.3129}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
