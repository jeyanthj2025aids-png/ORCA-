'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, Globe, ShieldAlert, Sparkles, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentLocation?: string;
  onLocationChange?: (loc: string) => void;
  selectedLanguage?: string;
  onLanguageChange?: (lang: string) => void;
}

export const LOCATIONS = [
  { name: 'Rameswaram Harbor', lat: 9.2876, lon: 79.3129 },
  { name: 'Mandapam Marine Station', lat: 9.2780, lon: 79.1250 },
  { name: 'Palk Bay North', lat: 9.5500, lon: 79.3500 },
  { name: 'Gulf of Mannar Biosphere', lat: 9.1500, lon: 79.2000 },
  { name: 'Nagapattinam Deep Shelf', lat: 10.7656, lon: 79.8424 },
  { name: 'Chennai Marina Anchorage', lat: 13.0827, lon: 80.2707 },
];

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
];

export default function Header({
  currentLocation = 'Rameswaram Harbor',
  onLocationChange,
  selectedLanguage = 'en',
  onLanguageChange
}: HeaderProps) {
  const router = useRouter();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const runPresetDemo = (scenario: string) => {
    router.push(`/copilot?demo=${encodeURIComponent(scenario)}`);
  };

  return (
    <header className="bg-white border-b border-[#D0DFF0] px-5 py-2.5 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Left: Platform Title & Location */}
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-sm font-bold text-[#0A1628] leading-none flex items-center space-x-2">
            <span>ORCA Marine Operations Center</span>
            <span className="text-[10px] bg-sky-100 text-sky-800 font-medium px-1.5 py-0.5 rounded border border-sky-300">
              National Remote Sensing Centre (NRSC)
            </span>
          </h1>
          <p className="text-[11px] text-[#536B88] mt-0.5">
            Collaborative Multi-Agent Marine Intelligence & Earth Observation
          </p>
        </div>

        <div className="h-6 w-[1px] bg-[#D0DFF0]"></div>

        {/* Location Dropdown */}
        <div className="flex items-center space-x-1.5 bg-[#F0F5FA] px-2.5 py-1 rounded border border-[#D0DFF0] text-xs">
          <MapPin className="w-3.5 h-3.5 text-[#1A7FC1]" />
          <select
            value={currentLocation}
            onChange={(e) => onLocationChange?.(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[#0A1628] outline-none cursor-pointer"
          >
            {LOCATIONS.map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.name} ({loc.lat}°N, {loc.lon}°E)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center: Quick One-Click SIH Scenarios */}
      <div className="hidden lg:flex items-center space-x-1.5 text-xs">
        <span className="text-[11px] text-[#536B88] font-medium mr-1 flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-[#1A7FC1]" />
          <span>One-Click Demos:</span>
        </span>
        <button
          onClick={() => runPresetDemo('fishing_safety')}
          className="px-2 py-0.5 rounded bg-sky-50 text-[#1A7FC1] hover:bg-sky-100 border border-sky-200 text-[11px] font-medium transition"
        >
          Fishing Safety
        </button>
        <button
          onClick={() => runPresetDemo('find_pfz')}
          className="px-2 py-0.5 rounded bg-emerald-50 text-[#0E9E8A] hover:bg-emerald-100 border border-emerald-200 text-[11px] font-medium transition"
        >
          Nearest PFZ
        </button>
        <button
          onClick={() => runPresetDemo('research')}
          className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-[11px] font-medium transition"
        >
          Palk Bay Trend
        </button>
        <button
          onClick={() => runPresetDemo('tamil')}
          className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-[11px] font-medium transition"
        >
          தமிழ் Demo
        </button>
      </div>

      {/* Right: Clock, Language, Status */}
      <div className="flex items-center space-x-3 text-xs">
        {/* UTC Clock */}
        <div className="flex items-center space-x-1 text-[#536B88] text-[11px] font-mono bg-[#F7FAFD] px-2 py-1 rounded border border-[#E2ECF8]">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{timeStr || 'Synchronizing...'}</span>
        </div>

        {/* Language Selector */}
        <div className="flex items-center space-x-1 bg-[#F0F5FA] px-2 py-1 rounded border border-[#D0DFF0]">
          <Globe className="w-3.5 h-3.5 text-[#536B88]" />
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange?.(e.target.value)}
            className="bg-transparent text-xs font-medium text-[#0A1628] outline-none cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Simulation Badge */}
        <div className="flex items-center space-x-1 px-2 py-0.5 bg-amber-50 border border-amber-300 text-amber-800 rounded font-semibold text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
          <span>SIMULATED DEMO DATA</span>
        </div>
      </div>
    </header>
  );
}
