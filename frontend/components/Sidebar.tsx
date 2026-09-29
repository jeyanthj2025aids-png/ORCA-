'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass, MessageSquareCode, Globe2, Anchor, ShieldAlert,
  Route, FileText, Database, Activity, Radio
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: Compass },
  { href: '/copilot', label: 'Conversational Copilot', icon: MessageSquareCode, badge: 'Agentic AI' },
  { href: '/ocean-twin', label: '3D Ocean Twin', icon: Globe2 },
  { href: '/fisheries', label: 'Fishing Intelligence', icon: Anchor },
  { href: '/safety', label: 'Marine Safety', icon: ShieldAlert },
  { href: '/routes', label: 'Route Optimization', icon: Route },
  { href: '/reports', label: 'Marine Reports', icon: FileText },
  { href: '/data', label: 'Data Sources & ISRO', icon: Database },
  { href: '/system', label: 'System Status', icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0A1628] text-white flex flex-col justify-between border-r border-[#1B2F4E] h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-[#1B2F4E]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-gradient-to-br from-[#1A7FC1] to-[#0E9E8A] flex items-center justify-center font-bold text-lg text-white shadow-md">
              O
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-wider text-white">ORCA</span>
                <span className="text-[10px] bg-[#1A7FC1]/30 text-[#60A5FA] px-1.5 py-0.5 rounded border border-[#1A7FC1]/50 font-mono">
                  SIH26176
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">ISRO / NRSC • Dept of Space</p>
            </div>
          </div>
          <div className="mt-2.5 text-[10px] text-gray-400 leading-tight">
            Marine EcOsystem Reasoning with Collaborative Agents
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1A7FC1] text-white font-semibold shadow-sm'
                    : 'text-gray-300 hover:bg-[#12243F] hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] bg-[#0E9E8A] text-white px-1.5 py-0.2 rounded font-mono">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Operational Indicators Footer */}
      <div className="p-3.5 border-t border-[#1B2F4E] bg-[#081220] text-[11px] space-y-2">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Subsystem Health</div>
        <div className="flex items-center justify-between text-gray-300">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Gemini 2.5 Flash</span>
          </span>
          <span className="text-emerald-400 text-[10px]">Active</span>
        </div>
        <div className="flex items-center justify-between text-gray-300">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>Agent Orchestrator</span>
          </span>
          <span className="text-blue-300 text-[10px]">12 Agents</span>
        </div>
        <div className="flex items-center justify-between text-gray-300">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Data Ingestion</span>
          </span>
          <span className="text-amber-300 text-[10px] font-mono px-1 bg-amber-950/60 rounded border border-amber-800/60">
            DEMO MODE
          </span>
        </div>
      </div>
    </aside>
  );
}
