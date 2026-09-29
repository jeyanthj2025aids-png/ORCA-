'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { createReport, fetchOceanConditions, fetchWeather } from '@/lib/api';
import { MarineCondition } from '@/types/orca';
import { FileText, Printer, Download, CheckCircle2, ShieldCheck, Clock, Share2 } from 'lucide-react';

export default function ReportsPage() {
  const [report, setReport] = useState<any | null>(null);
  const [conditions, setConditions] = useState<MarineCondition | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      const cond = await fetchOceanConditions(9.2876, 79.3129);
      setConditions(cond);
      handleGenerateReport(cond);
    }
    load();
  }, []);

  const handleGenerateReport = async (cond?: MarineCondition | null) => {
    try {
      setGenerating(true);
      const data = await createReport({
        title: 'ORCA Marine Intelligence Assessment Report (Rameswaram Operations)',
        location: 'Rameswaram Coastal Waters & Palk Strait',
        parameters: {
          sst_celsius: cond?.sst_celsius || 29.2,
          wave_height_m: cond?.wave_height_m || 1.95,
          wind_speed_knots: cond?.wind_speed_knots || 19.5,
          sea_state: cond?.sea_state || 'Moderate Swell'
        },
        risk_level: 'MODERATE',
        recommendations: [
          'Artisanal non-motorized craft should avoid deep outer shelf channels during morning swell peak.',
          'Mechanized vessels >32ft permissible with active VHF radio monitoring (Ch 16).',
          'Maintain 3.0 NM safety standoff westward of India-Sri Lanka IMBL.'
        ],
        evidence: [
          { dataset: 'Oceansat-3 / OCM-3 Chlorophyll-a', source: 'NRSC / ISRO Schema', value: '1.28 mg/m³', type: 'DEMO_DATA' },
          { dataset: 'INSAT-3DR Sea Surface Temperature', source: 'MOSDAC / ISRO Schema', value: '29.2°C', type: 'DEMO_DATA' },
          { dataset: 'INCOIS Ocean State Forecast', source: 'INCOIS MoES', value: '1.95m wave height', type: 'DEMO_DATA' }
        ]
      });
      setReport(data);
    } catch (e) {
      console.error('Report error', e);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
                <FileText className="w-5 h-5 text-[#1A7FC1]" />
                <span>Marine Intelligence & Decision-Support Reports</span>
              </h2>
              <p className="text-xs text-[#536B88] mt-0.5">
                Official operational report synthesizing satellite Earth Observation, ocean dynamics, risk calculations, and evidence citations.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="bg-white hover:bg-[#F0F5FA] border border-[#D0DFF0] text-[#0A1628] px-3.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5 text-gray-600" />
                <span>Print / Save PDF</span>
              </button>
              <button
                onClick={() => handleGenerateReport(conditions)}
                disabled={generating}
                className="bg-[#1A7FC1] hover:bg-[#1569a0] text-white px-3.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 shadow transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Regenerate Report</span>
              </button>
            </div>
          </div>

          {/* Printable Report Document Card */}
          {report && (
            <div className="bg-white rounded-lg border border-[#D0DFF0] p-8 shadow-md max-w-4xl mx-auto space-y-6 print:shadow-none print:border-none">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-[#0A1628] pb-4">
                <div>
                  <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                    Department of Space • ISRO / NRSC • SIH26176
                  </div>
                  <h1 className="text-xl font-black text-[#0A1628] mt-1">
                    ORCA MARINE ADVISORY ASSESSMENT REPORT
                  </h1>
                  <p className="text-xs text-gray-600">
                    Marine EcOsystem Reasoning with Collaborative Agents
                  </p>
                </div>
                <div className="text-right text-xs">
                  <div className="font-mono font-bold text-sky-800">{report.report_id}</div>
                  <div className="text-gray-500 text-[11px] mt-0.5">{report.created_at?.slice(0, 16)} UTC</div>
                  <div className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-semibold mt-1 inline-block">
                    DEMO DATA REPORT
                  </div>
                </div>
              </div>

              {/* Assessment Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-[#0A1628] uppercase tracking-wider">
                  1. Executive Assessment Summary
                </h3>
                <div className="p-4 rounded bg-[#F7FAFD] border border-[#E2ECF8] text-xs leading-relaxed text-gray-800">
                  Environmental and meteorological indicators evaluated across Rameswaram Harbor, Palk Bay, and Gulf of Mannar
                  indicate a <strong>MODERATE RISK (Composite Score 0.45)</strong> condition for maritime activity during the current operational window.
                  Sustained surface winds (19.5 kts) in channel mouths and wave swell heights (1.95m) require precautionary measures.
                </div>
              </div>

              {/* Key Environmental Parameters Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-[#0A1628] uppercase tracking-wider">
                  2. Observational Marine Parameters
                </h3>
                <table className="w-full text-xs border border-[#E2ECF8] rounded">
                  <thead className="bg-[#F0F5FA] text-[#0A1628] font-bold">
                    <tr>
                      <th className="p-2.5 text-left border-b border-[#E2ECF8]">Parameter</th>
                      <th className="p-2.5 text-left border-b border-[#E2ECF8]">Observed Value</th>
                      <th className="p-2.5 text-left border-b border-[#E2ECF8]">Source Sensor / Model</th>
                      <th className="p-2.5 text-left border-b border-[#E2ECF8]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2ECF8] text-gray-700">
                    <tr>
                      <td className="p-2.5 font-medium">Sea Surface Temperature</td>
                      <td className="p-2.5 font-mono font-bold text-orange-600">29.2°C</td>
                      <td className="p-2.5">INSAT-3DR SSTM Thermal</td>
                      <td className="p-2.5 text-emerald-600 font-semibold">Normal Range</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Significant Wave Height</td>
                      <td className="p-2.5 font-mono font-bold text-sky-700">1.95 m</td>
                      <td className="p-2.5">INCOIS Ocean State Forecast</td>
                      <td className="p-2.5 text-amber-600 font-semibold">Channel Chop Alert</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Surface Wind Velocity</td>
                      <td className="p-2.5 font-mono font-bold text-blue-700">19.5 kts (Gusts: 24 kts)</td>
                      <td className="p-2.5">IMD Marine Weather Bulletin</td>
                      <td className="p-2.5 text-amber-600 font-semibold">Elevated</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Chlorophyll-a Bloom</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-600">1.28 mg/m³</td>
                      <td className="p-2.5">Oceansat-3 OCM-3 Optical</td>
                      <td className="p-2.5 text-emerald-600 font-semibold">High Productivity</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Actionable Recommendations */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-[#0A1628] uppercase tracking-wider">
                  3. Operational Navigational Directives
                </h3>
                <div className="space-y-1.5 text-xs text-gray-800">
                  {report.recommendations?.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Registry */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-[#0A1628] uppercase tracking-wider">
                  4. Evidence Trail & Audit Citation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  {report.evidence?.map((ev: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded bg-[#F7FAFD] border border-[#E2ECF8]">
                      <div className="font-bold text-[#0A1628]">{ev.dataset}</div>
                      <div className="text-[10px] text-gray-500">{ev.source}</div>
                      <div className="mt-1 font-mono font-bold text-sky-800">{ev.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regulatory Disclaimer */}
              <div className="pt-4 border-t border-[#E2ECF8] text-[10px] text-gray-500 leading-relaxed italic">
                DISCLAIMER: This document is generated by ORCA under Smart India Hackathon problem statement SIH26176.
                Simulated provider models represent demonstration data schemas. Official maritime advisories issued by INCOIS, IMD,
                and local Fisheries Officers must be confirmed before voyage commencement.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
