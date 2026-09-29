'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { fetchSystemStatus } from '@/lib/api';
import { SystemStatusData } from '@/types/orca';
import { Activity, CheckCircle2, Server, Database, Brain, Map, Shield } from 'lucide-react';

export default function SystemPage() {
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchSystemStatus();
        setStatus(res);
      } catch (err) {
        console.error('System status error', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const AGENTS = [
    { name: 'Intent & Language Agent', role: 'Multilingual NLU, entity recognition, intent categorization' },
    { name: 'Task Planner Agent', role: 'Dynamic task decomposition and concurrency scheduling' },
    { name: 'Satellite EO Agent', role: 'Oceansat-3 OCM-3 & INSAT-3DR SST observation analysis' },
    { name: 'Weather Agent', role: 'IMD marine weather bulletins, wind speed, gusts, cyclone check' },
    { name: 'Ocean Analytics Agent', role: 'Wave swell, ocean current drift, thermal front calculations' },
    { name: 'Tide & Marine Conditions Agent', role: 'Harmonic tidal gauge tables, flood/ebb channel clearance' },
    { name: 'PFZ & Fisheries Agent', role: 'Potential Fishing Zone delineation, thermal fronts, target species' },
    { name: 'Geospatial Reasoning Agent', role: 'Geodesic distances, spatial proximity, corridor intersections' },
    { name: 'Geofencing Agent', role: 'Point-in-polygon checks, IMBL boundary buffer alerts, MPA protection' },
    { name: 'Marine Risk Agent', role: 'Multi-factor composite risk evaluation (LOW to CRITICAL)' },
    { name: 'Hazard & Proactive Alert Agent', role: 'Event triggers for high swells, cyclonic surges, squalls' },
    { name: 'Route Optimization Agent', role: 'Deterministic navigational corridors avoiding hazardous waters' }
  ];

  return (
    <div className="flex min-h-screen bg-[#F7FAFD]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0A1628] flex items-center space-x-2">
                <Activity className="w-5 h-5 text-[#1A7FC1]" />
                <span>ORCA Platform Health & Subsystem Architecture</span>
              </h2>
              <p className="text-xs text-[#536B88] mt-0.5">
                Real-time operational status of backend services, Gemini GenAI models, databases, and agent pipelines.
              </p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded border border-emerald-300">
              System Health: Operational
            </span>
          </div>

          {/* Subsystem Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gemini */}
            <div className="bg-white rounded-lg border border-[#D0DFF0] p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#0A1628] flex items-center space-x-1.5">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span>Google Gemini API</span>
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="text-xs font-semibold text-emerald-600">
                {status?.gemini_api.status || 'Operational'}
              </div>
              <div className="text-[11px] text-gray-500 space-y-0.5">
                <div>Model: <span className="font-mono text-gray-700">{status?.gemini_api.model || 'gemini-2.5-flash'}</span></div>
                <div>Reasoning: <span className="font-mono text-gray-700">{status?.gemini_api.reasoning_model || 'gemini-2.5-pro'}</span></div>
              </div>
            </div>

            {/* Database */}
            <div className="bg-white rounded-lg border border-[#D0DFF0] p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#0A1628] flex items-center space-x-1.5">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>Database Layer</span>
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-xs font-semibold text-emerald-600">
                {status?.database.status || 'Operational'}
              </div>
              <div className="text-[11px] text-gray-500">
                Backend: <span className="font-mono text-gray-700">{status?.database.backend || 'PostGIS Compatible'}</span>
              </div>
            </div>

            {/* Marine Ingestion */}
            <div className="bg-white rounded-lg border border-[#D0DFF0] p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#0A1628] flex items-center space-x-1.5">
                  <Server className="w-4 h-4 text-amber-500" />
                  <span>Marine Data Ingestion</span>
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              </div>
              <div className="text-xs font-semibold text-amber-600">
                {status?.marine_data.status || 'Demo Mode (Simulated Provider Schema)'}
              </div>
              <div className="text-[11px] text-gray-500">
                Sensors: <span className="text-gray-700 font-medium">Oceansat-3, INSAT-3DR, INCOIS</span>
              </div>
            </div>

            {/* Map Engine */}
            <div className="bg-white rounded-lg border border-[#D0DFF0] p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#0A1628] flex items-center space-x-1.5">
                  <Map className="w-4 h-4 text-teal-600" />
                  <span>Geospatial Map Engine</span>
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-xs font-semibold text-emerald-600">
                Operational (SVG / WebGL)
              </div>
              <div className="text-[11px] text-gray-500">
                3D Engine: <span className="text-gray-700 font-medium">Three.js Digital Twin</span>
              </div>
            </div>
          </div>

          {/* 12 Collaborative Agents Architecture */}
          <div className="bg-white rounded-lg border border-[#D0DFF0] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2ECF8]">
              <div>
                <h3 className="font-bold text-sm text-[#0A1628]">
                  Collaborative Multi-Agent Architecture (12 Specialized Agents)
                </h3>
                <p className="text-xs text-[#536B88] mt-0.5">
                  Managed by OrcaOrchestrator with dynamic intent-driven task graph planning and parallel domain execution.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                OrcaOrchestrator v1.0
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {AGENTS.map((agent, i) => (
                <div key={i} className="p-3 rounded bg-[#F7FAFD] border border-[#E2ECF8] text-xs space-y-1">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-[#0A1628]">{agent.name}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 pl-6">{agent.role}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
