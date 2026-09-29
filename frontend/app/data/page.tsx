'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Database, Satellite, CloudRain, Waves, Anchor, Shield, Search, ExternalLink } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DataPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const PROVIDERS = [
    {
      name: 'ISRO / NRSC Earth Observation (Oceansat-3 / EOS-06)',
      type: 'EODataProvider',
      status: 'Reserved Integration Point (MockEOProvider Active)',
      liveStatus: 'DEMO DATA',
      products: ['OCM-3 Level-3 Chlorophyll-a', 'SSTM Thermal Sea Surface Temp', 'Turbidity Index'],
      resolution: '360m Optical / 1000m Thermal'
    },
    {
      name: 'INSAT-3DR Meteorological Satellite',
      type: 'EODataProvider',
      status: 'Mock Schema Active',
      liveStatus: 'DEMO DATA',
      products: ['Thermal Infrared SSTM', 'Cloud Motion Vectors', 'Cyclonic Intensity'],
      resolution: '1 km'
    },
    {
      name: 'INCOIS Ocean State Forecast (OSF)',
      type: 'OceanProvider',
      status: 'Mock Schema Active',
      liveStatus: 'DEMO DATA',
      products: ['Significant Wave Height', 'Sea State Categorization', 'Current Velocity'],
      resolution: 'Regional Shelf'
    },
    {
      name: 'India Meteorological Department (IMD)',
      type: 'WeatherProvider',
      status: 'Mock Schema Active',
      liveStatus: 'DEMO DATA',
      products: ['Coastal Wind Velocity', 'Sustained Gusts', 'Cyclone & Squall Bulletins'],
      resolution: 'Station / Grid'
    },
    {
      name: 'Survey of India Tidal Observatories',
      type: 'TideProvider',
      status: 'Mock Harmonic Schema Active',
      liveStatus: 'DEMO DATA',
      products: ['Pamban & Rameswaram Gauge Heights', 'Harmonic Tide Prediction', 'Channel Clearance'],
      resolution: 'Tidal Station'
    },
    {
      name: 'Survey of India / Territorial Maritime Boundary Registry',
      type: 'BoundaryProvider',
      status: 'GeoJSON Boundaries Loaded',
      liveStatus: 'DEMO DATA',
      products: ['India - Sri Lanka IMBL Polyline', 'Gulf of Mannar Biosphere Reserve Core MPA'],
      resolution: 'Geodesic Coordinates'
    }
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const res = await fetch(`${API_BASE_URL}/api/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Vector search error', err);
    } finally {
      setSearching(false);
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
                <Database className="w-5 h-5 text-[#1A7FC1]" />
                <span>Marine Data Providers & ISRO Ingestion Architecture</span>
              </h2>
              <p className="text-xs text-[#536B88] mt-0.5">
                Provider interfaces designed for seamless hot-swapping between simulated demonstration data and live agency ingestion feeds.
              </p>
            </div>
            <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2.5 py-1 rounded border border-amber-300">
              Provider Mode: DEMO / SIMULATION
            </span>
          </div>

          {/* Provider Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROVIDERS.map((p, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-[#D0DFF0] p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between pb-2 border-b border-[#E2ECF8]">
                  <div>
                    <h3 className="font-bold text-xs text-[#0A1628] leading-tight">{p.name}</h3>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">{p.type}</div>
                  </div>
                  <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
                    {p.liveStatus}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Interface Status:</span>
                    <div className="text-gray-700 font-medium">{p.status}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Provided Products:</span>
                    <ul className="list-disc pl-4 text-gray-600 text-[11px] mt-0.5">
                      {p.products.map((prod, i) => (
                        <li key={i}>{prod}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Resolution:</span>
                    <div className="font-mono text-gray-800 text-[11px]">{p.resolution}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Semantic Knowledge Layer Vector Search */}
          <div className="bg-white rounded-lg border border-[#D0DFF0] p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-sm text-[#0A1628] flex items-center space-x-1.5">
                <Search className="w-4 h-4 text-[#1A7FC1]" />
                <span>Unified Marine Knowledge Layer: Semantic Literature Search</span>
              </h3>
              <p className="text-xs text-[#536B88] mt-0.5">
                Query embedded scientific reanalyses, historical ecosystem papers, and marine safety protocols.
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search marine reanalyses (e.g. 'Palk Bay productivity decline' or 'Thermal fronts')..."
                className="flex-1 bg-[#F7FAFD] border border-[#D0DFF0] rounded p-2 text-xs text-[#0A1628]"
              />
              <button
                type="submit"
                disabled={searching}
                className="bg-[#1A7FC1] hover:bg-[#1569a0] text-white px-4 py-2 rounded text-xs font-semibold"
              >
                {searching ? 'Querying...' : 'Semantic Search'}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-3 pt-2">
                {searchResults.map((doc: any) => (
                  <div key={doc.id} className="p-3 bg-[#F7FAFD] rounded border border-[#E2ECF8] text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-[#0A1628]">
                      <span>{doc.title}</span>
                      <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-mono">
                        {doc.category}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{doc.content}</p>
                    <div className="flex gap-1.5 pt-1">
                      {doc.tags?.map((t: string, i: number) => (
                        <span key={i} className="text-[9px] bg-white border border-[#D0DFF0] text-gray-600 px-1.5 py-0.2 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
