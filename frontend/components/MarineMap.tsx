'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Eye, EyeOff, Navigation, AlertTriangle, Fish, Shield } from 'lucide-react';
import { PFZResult, HazardItem, BoundaryItem } from '@/types/orca';

interface MarineMapProps {
  centerLat?: number;
  centerLon?: number;
  pfzData?: PFZResult[];
  hazards?: HazardItem[];
  boundaries?: BoundaryItem[];
  routeCoordinates?: number[][];
  onSelectZone?: (zoneName: string) => void;
}

export default function MarineMap({
  centerLat = 9.2876,
  centerLon = 79.3129,
  pfzData = [],
  hazards = [],
  boundaries = [],
  routeCoordinates = [],
  onSelectZone
}: MarineMapProps) {
  const router = useRouter();

  // Layer visibility toggles
  const [showSST, setShowSST] = useState(true);
  const [showChlorophyll, setShowChlorophyll] = useState(true);
  const [showPFZ, setShowPFZ] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showVessels, setShowVessels] = useState(true);
  const [showRoute, setShowRoute] = useState(true);

  // Selected item modal/popup
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // Geo bounds for Palk Bay / Gulf of Mannar viewport (Lon: 78.8 to 80.2, Lat: 8.8 to 10.2)
  const minLon = 78.8, maxLon = 80.2;
  const minLat = 8.8, maxLat = 10.2;

  // Convert (lat, lon) to SVG viewBox percentages (width 800, height 500)
  const toSvgX = (lon: number) => ((lon - minLon) / (maxLon - minLon)) * 800;
  const toSvgY = (lat: number) => (1 - (lat - minLat) / (maxLat - minLat)) * 500;

  // Simulated vessels
  const vessels = [
    { id: 'VES-TN-01', name: 'Tamil Meen-4', lat: 9.301, lon: 79.335, vesselType: 'Mechanized Trawler (34ft)', speed: 8.2 },
    { id: 'VES-TN-02', name: 'Kadal Kural', lat: 9.265, lon: 79.240, vesselType: 'Gillnetter (28ft)', speed: 6.4 },
    { id: 'VES-TN-03', name: 'Alai Magal', lat: 9.420, lon: 79.390, vesselType: 'Longliner (42ft)', speed: 9.1 },
  ];

  const handleOpenInCopilot = (promptText: string) => {
    router.push(`/copilot?query=${encodeURIComponent(promptText)}`);
  };

  return (
    <div className="relative w-full h-[520px] bg-[#0A1A30] rounded border border-[#D0DFF0] overflow-hidden shadow-sm select-none">
      {/* Top Map Toolbar & Layer Controls */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm border border-[#D0DFF0] rounded shadow-md px-3 py-2 text-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-1.5 font-bold text-[#0A1628] pr-2 border-r border-[#D0DFF0]">
          <Layers className="w-3.5 h-3.5 text-[#1A7FC1]" />
          <span>GIS Layers</span>
        </div>

        <label className="flex items-center space-x-1.5 cursor-pointer text-[#0A1628] hover:text-[#1A7FC1]">
          <input type="checkbox" checked={showSST} onChange={(e) => setShowSST(e.target.checked)} className="rounded text-[#1A7FC1]" />
          <span>SST Thermal</span>
        </label>

        <label className="flex items-center space-x-1.5 cursor-pointer text-[#0A1628] hover:text-[#0E9E8A]">
          <input type="checkbox" checked={showChlorophyll} onChange={(e) => setShowChlorophyll(e.target.checked)} className="rounded text-[#0E9E8A]" />
          <span>Chlorophyll-a</span>
        </label>

        <label className="flex items-center space-x-1.5 cursor-pointer text-[#0A1628] hover:text-emerald-700">
          <input type="checkbox" checked={showPFZ} onChange={(e) => setShowPFZ(e.target.checked)} className="rounded text-emerald-600" />
          <span className="font-semibold text-emerald-700">PFZ Hotspots</span>
        </label>

        <label className="flex items-center space-x-1.5 cursor-pointer text-[#0A1628] hover:text-amber-700">
          <input type="checkbox" checked={showHazards} onChange={(e) => setShowHazards(e.target.checked)} className="rounded text-amber-500" />
          <span>Hazards</span>
        </label>

        <label className="flex items-center space-x-1.5 cursor-pointer text-[#0A1628] hover:text-red-700">
          <input type="checkbox" checked={showBoundaries} onChange={(e) => setShowBoundaries(e.target.checked)} className="rounded text-red-500" />
          <span>IMBL Border</span>
        </label>

        <label className="flex items-center space-x-1.5 cursor-pointer text-[#0A1628] hover:text-blue-700">
          <input type="checkbox" checked={showVessels} onChange={(e) => setShowVessels(e.target.checked)} className="rounded text-blue-500" />
          <span>AIS Vessels</span>
        </label>

        <label className="flex items-center space-x-1.5 cursor-pointer text-[#0A1628] hover:text-sky-700">
          <input type="checkbox" checked={showRoute} onChange={(e) => setShowRoute(e.target.checked)} className="rounded text-sky-500" />
          <span>Safe Route</span>
        </label>
      </div>

      {/* Dynamic Viewport SVG */}
      <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="none">
        <defs>
          {/* Bathymetry & Water Gradients */}
          <radialGradient id="waterDeep" cx="70%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#0B2347" />
            <stop offset="60%" stopColor="#091A36" />
            <stop offset="100%" stopColor="#061224" />
          </radialGradient>

          {/* SST Contour Gradient */}
          <linearGradient id="sstContour" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.30" />
            <stop offset="50%" stopColor="#EAB308" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.10" />
          </linearGradient>

          {/* Chlorophyll Front Gradient */}
          <radialGradient id="chloroGrad" cx="45%" cy="35%" r="40%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
            <stop offset="70%" stopColor="#059669" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
          </radialGradient>

          {/* Hazard Pulsing pattern */}
          <pattern id="hazardPattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#EF4444" strokeWidth="2" strokeOpacity="0.4" />
          </pattern>
        </defs>

        {/* Ocean Background */}
        <rect width="800" height="500" fill="url(#waterDeep)" />

        {/* Bathymetric depth contours */}
        <path d="M 0,200 Q 200,240 400,210 T 800,260 L 800,500 L 0,500 Z" fill="#07152B" opacity="0.6" />
        <path d="M 0,320 Q 300,380 600,340 T 800,390 L 800,500 L 0,500 Z" fill="#050E1D" opacity="0.8" />

        {/* Coastlines - Tamil Nadu (West) and Sri Lanka (East) */}
        {/* Tamil Nadu Coastline & Rameswaram Island Spur */}
        <path
          d="M 0,0 L 160,0 Q 150,120 180,220 L 290,260 L 320,270 L 290,285 L 210,290 Q 170,360 140,500 L 0,500 Z"
          fill="#1E334D"
          stroke="#38547A"
          strokeWidth="1.5"
        />
        {/* Sri Lanka Coastline (North-West) */}
        <path
          d="M 580,240 Q 640,200 700,210 L 800,230 L 800,500 L 520,500 Q 560,340 580,240 Z"
          fill="#1A2D45"
          stroke="#38547A"
          strokeWidth="1.5"
        />

        {/* SST Thermal Gradient Layer */}
        {showSST && (
          <ellipse cx="420" cy="270" rx="260" ry="180" fill="url(#sstContour)" />
        )}

        {/* Chlorophyll-a Front Layer */}
        {showChlorophyll && (
          <ellipse cx="340" cy="210" rx="140" ry="90" fill="url(#chloroGrad)" />
        )}

        {/* IMBL (International Maritime Boundary Line) */}
        {showBoundaries && (
          <g>
            <polyline
              points="450,40 430,120 400,210 390,280 370,350 330,420 300,480"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2.5"
              strokeDasharray="6,4"
            />
            <text x="415" y="115" fill="#FCA5A5" fontSize="10" fontWeight="bold" transform="rotate(-75 415,115)">
              IMBL (INDIA - SRI LANKA BORDER)
            </text>
            {/* 3 NM Safety Buffer Zone */}
            <polyline
              points="425,40 405,120 375,210 365,280 345,350 305,420 275,480"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.2"
              strokeDasharray="3,3"
              opacity="0.75"
            />
          </g>
        )}

        {/* Active Hazard Zones */}
        {showHazards && (
          <g>
            <polygon
              points="280,230 360,240 340,300 270,280"
              fill="url(#hazardPattern)"
              stroke="#EF4444"
              strokeWidth="1.5"
              className="cursor-pointer hover:opacity-90"
              onClick={() => setSelectedEntity({
                type: 'hazard',
                title: 'Pamban-Mandapam Swell Surge',
                severity: 'MODERATE',
                description: 'Hazardous high wave swell > 2.0m during tidal change.'
              })}
            />
            <circle cx="315" cy="265" r="4" fill="#EF4444" className="animate-ping" />
          </g>
        )}

        {/* Marine Protected Area: Gulf of Mannar Coral Biosphere */}
        {showBoundaries && (
          <polygon
            points="180,310 260,300 280,370 190,390"
            fill="#059669"
            fillOpacity="0.18"
            stroke="#10B981"
            strokeWidth="1.2"
            strokeDasharray="4,2"
            className="cursor-pointer"
            onClick={() => setSelectedEntity({
              type: 'mpa',
              title: 'Gulf of Mannar Marine Biosphere Reserve Core Zone',
              description: 'Strictly protected coral and seagrass reef bank. Commercial bottom trawling prohibited.'
            })}
          />
        )}

        {/* Deterministic Safe Route Corridor */}
        {showRoute && (
          <g>
            <path
              d="M 305,275 Q 330,250 360,225 T 410,215"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2.5"
              strokeDasharray="5,3"
            />
            {/* Origin & Destination Waypoints */}
            <circle cx="305" cy="275" r="5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx="410" cy="215" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
          </g>
        )}

        {/* PFZ Hotspot Markers */}
        {showPFZ && (
          <g>
            {pfzData.map((pfz, idx) => {
              const x = toSvgX(pfz.lon);
              const y = toSvgY(pfz.lat);
              return (
                <g
                  key={pfz.zone_id || idx}
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={() => {
                    setSelectedEntity({ type: 'pfz', ...pfz });
                    onSelectZone?.(pfz.name);
                  }}
                >
                  <circle cx={x} cy={y} r="18" fill="#10B981" fillOpacity="0.25" className="animate-pulse" />
                  <circle cx={x} cy={y} r="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                  <text x={x + 10} y={y + 4} fill="#FFFFFF" fontSize="10" fontWeight="bold">
                    {pfz.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Simulated Fishing Vessels */}
        {showVessels && (
          <g>
            {vessels.map((v) => {
              const x = toSvgX(v.lon);
              const y = toSvgY(v.lat);
              return (
                <g
                  key={v.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedEntity({ type: 'vessel', ...v })}
                >
                  <polygon
                    points={`${x},${y - 6} ${x - 4},${y + 4} ${x + 4},${y + 4}`}
                    fill="#60A5FA"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                  />
                  <text x={x + 6} y={y - 4} fill="#93C5FD" fontSize="9">
                    {v.name} ({v.speed} kts)
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Geographic labels */}
        <text x="70" y="270" fill="#E2ECF8" fontSize="12" fontWeight="bold">TAMIL NADU</text>
        <text x="210" y="260" fill="#93C5FD" fontSize="11" fontWeight="bold">Rameswaram</text>
        <text x="280" y="160" fill="#38BDF8" fontSize="13" fontWeight="bold" opacity="0.7">PALK BAY</text>
        <text x="220" y="420" fill="#38BDF8" fontSize="13" fontWeight="bold" opacity="0.7">GULF OF MANNAR</text>
        <text x="640" y="320" fill="#E2ECF8" fontSize="12" fontWeight="bold">SRI LANKA</text>
      </svg>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 bg-[#0A1628]/90 backdrop-blur-sm border border-[#1B2F4E] rounded px-3 py-1.5 text-[11px] text-gray-300 flex items-center space-x-4">
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>PFZ Zone</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 bg-red-500 rounded"></span>
          <span>IMBL Border</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 bg-amber-500 rounded"></span>
          <span>Hazard Alert</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 bg-blue-400 rounded-full"></span>
          <span>AIS Vessel</span>
        </span>
        <span className="text-gray-400 font-mono">Center: {centerLat}°N, {centerLon}°E</span>
      </div>

      {/* Selected Entity Context Modal */}
      {selectedEntity && (
        <div className="absolute top-16 right-4 z-20 w-80 bg-white rounded border border-[#D0DFF0] shadow-xl p-4 text-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2ECF8]">
            <span className="font-bold text-[#0A1628] flex items-center space-x-1.5">
              {selectedEntity.type === 'pfz' && <Fish className="w-4 h-4 text-emerald-600" />}
              {selectedEntity.type === 'hazard' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
              {selectedEntity.type === 'mpa' && <Shield className="w-4 h-4 text-teal-600" />}
              {selectedEntity.type === 'vessel' && <Navigation className="w-4 h-4 text-blue-600" />}
              <span>{selectedEntity.title || selectedEntity.name}</span>
            </span>
            <button
              onClick={() => setSelectedEntity(null)}
              className="text-gray-400 hover:text-gray-600 font-bold"
            >
              ✕
            </button>
          </div>

          <div className="py-2.5 space-y-1.5 text-gray-600">
            {selectedEntity.type === 'pfz' && (
              <>
                <div><span className="font-semibold text-gray-800">Distance:</span> {selectedEntity.distance_km} km</div>
                <div><span className="font-semibold text-gray-800">SST:</span> {selectedEntity.sst_celsius}°C</div>
                <div><span className="font-semibold text-gray-800">Chlorophyll:</span> {selectedEntity.chlorophyll_mg_m3} mg/m³</div>
                <div><span className="font-semibold text-gray-800">Confidence:</span> {Math.round(selectedEntity.confidence * 100)}%</div>
                <div><span className="font-semibold text-gray-800">Target Species:</span> {selectedEntity.target_species?.join(', ')}</div>
                <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded text-[11px] mt-1">
                  {selectedEntity.recommendation}
                </div>
              </>
            )}

            {selectedEntity.type === 'hazard' && (
              <>
                <div><span className="font-semibold text-gray-800">Severity:</span> <span className="text-amber-700 font-bold">{selectedEntity.severity}</span></div>
                <div>{selectedEntity.description}</div>
              </>
            )}

            {selectedEntity.type === 'mpa' && (
              <div>{selectedEntity.description}</div>
            )}

            {selectedEntity.type === 'vessel' && (
              <>
                <div><span className="font-semibold text-gray-800">Type:</span> {selectedEntity.vesselType}</div>
                <div><span className="font-semibold text-gray-800">Speed:</span> {selectedEntity.speed} knots</div>
                <div><span className="font-semibold text-gray-800">Position:</span> {selectedEntity.lat}°N, {selectedEntity.lon}°E</div>
              </>
            )}
          </div>

          <div className="pt-2 border-t border-[#E2ECF8] flex justify-end">
            <button
              onClick={() => handleOpenInCopilot(
                selectedEntity.type === 'pfz'
                  ? `Analyze Potential Fishing Zone: ${selectedEntity.name} (SST ${selectedEntity.sst_celsius}°C, Chlorophyll ${selectedEntity.chlorophyll_mg_m3} mg/m³)`
                  : `Explain ocean hazard: ${selectedEntity.title || selectedEntity.name}`
              )}
              className="bg-[#1A7FC1] hover:bg-[#1569a0] text-white px-3 py-1 rounded font-medium text-xs flex items-center space-x-1"
            >
              <span>Analyze in Copilot</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
