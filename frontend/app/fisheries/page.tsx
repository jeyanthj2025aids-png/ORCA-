'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MarineMap from '@/components/MarineMap';
import { fetchPFZ, fetchBoundaries } from '@/lib/api';
import { PFZResult, BoundaryItem } from '@/types/orca';
import { Fish, Thermometer, Activity, Compass, ArrowRight, ShieldCheck } from 'lucide-react';

export default function FisheriesPage() {
  const [pfzList, setPfzList] = useState<PFZResult[]>([]);
  const [boundaries, setBoundaries] = useState<BoundaryItem[]>([]);
  const [selectedZone, setSelectedZone] = useState<PFZResult | null>(null);

  useEffect(() => {
    async function load() {
      const [pfz, bound] = await Promise.all([
        fetchPFZ(9.2876, 79.3129),
        fetchBoundaries()
      ]);
      setPfzList(pfz);
      setBoundaries(bound);
      if (pfz.length > 0) setSelectedZone(pfz[0]);
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
                <Fish className="w-5 h-5 text-emerald-600" />
                <span>Potential Fishing Zones (PFZ) & Pelagic Advisory</span>
              </h2>
              <p className="text-xs text-[#536B88] mt-0.5">
                Delineated using Oceansat-3 (OCM-3) Chlorophyll-a gradient maps and INSAT-3DR thermal sea surface temperature fronts.
              </p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded border border-emerald-300">
              INCOIS / NRSC Advisory Feed
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: PFZ Cards & GIS Map */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pfzList.map((pfz) => (
                  <div
                    key={pfz.zone_id}
                    onClick={() => setSelectedZone(pfz)}
                    className={`bg-white rounded-lg border p-4 shadow-sm cursor-pointer transition ${
                      selectedZone?.zone_id === pfz.zone_id
                        ? 'border-[#1A7FC1] ring-2 ring-[#1A7FC1]/20'
                        : 'border-[#D0DFF0] hover:border-[#1A7FC1]'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#E2ECF8]">
                      <span className="font-bold text-xs text-[#0A1628]">{pfz.name}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">
                        {Math.round(pfz.confidence * 100)}% Conf
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div>
                        <div className="text-[10px] text-gray-400">Distance</div>
                        <div className="font-bold text-[#0A1628]">{pfz.distance_km} km</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400">Shelf Depth</div>
                        <div className="font-bold text-[#0A1628]">{pfz.depth_m} m</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400">SST Front</div>
                        <div className="font-bold text-orange-600">{pfz.sst_celsius}°C</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400">Chlorophyll</div>
                        <div className="font-bold text-emerald-600">{pfz.chlorophyll_mg_m3} mg/m³</div>
                      </div>
                    </div>

                    <div className="mt-3 text-[11px] text-gray-600">
                      <span className="font-semibold text-gray-800">Target Species:</span>{' '}
                      {pfz.target_species.join(', ')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Map */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#0A1628]">PFZ Geospatial Delineation</div>
                <MarineMap pfzData={pfzList} boundaries={boundaries} />
              </div>
            </div>

            {/* Right Col: Selected PFZ Deep Dive */}
            <div className="space-y-4">
              {selectedZone && (
                <div className="bg-white rounded-lg border border-[#D0DFF0] p-5 shadow-sm space-y-4">
                  <div className="pb-3 border-b border-[#E2ECF8]">
                    <div className="text-[10px] text-[#1A7FC1] font-mono font-bold uppercase tracking-wider">
                      Selected Advisory Zone
                    </div>
                    <h3 className="text-base font-bold text-[#0A1628] mt-1">{selectedZone.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Coordinates: {selectedZone.lat}°N, {selectedZone.lon}°E
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#F0F5FA]">
                      <span className="text-gray-500">Advisory Validity:</span>
                      <span className="font-semibold text-gray-800">{selectedZone.validity}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#F0F5FA]">
                      <span className="text-gray-500">SST Thermal Gradient:</span>
                      <span className="font-semibold text-orange-600">{selectedZone.sst_celsius}°C Isotherm</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#F0F5FA]">
                      <span className="text-gray-500">Chlorophyll-a Bloom:</span>
                      <span className="font-semibold text-emerald-600">{selectedZone.chlorophyll_mg_m3} mg/m³</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#F0F5FA]">
                      <span className="text-gray-500">Distance from Rameswaram:</span>
                      <span className="font-semibold text-gray-800">{selectedZone.distance_km} km</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                    <div className="font-bold flex items-center space-x-1 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Operational Guidance:</span>
                    </div>
                    {selectedZone.recommendation}
                  </div>

                  <Link
                    href={`/copilot?query=${encodeURIComponent(
                      `Analyze Potential Fishing Zone ${selectedZone.name} (Lat: ${selectedZone.lat}, Lon: ${selectedZone.lon}) and calculate safe navigation route.`
                    )}`}
                    className="w-full bg-[#1A7FC1] hover:bg-[#1569a0] text-white py-2.5 rounded font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow"
                  >
                    <span>Analyze Zone in Copilot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
