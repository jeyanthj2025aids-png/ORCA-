'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { sendChatMessage } from '@/lib/api';
import { FinalMarineResponse, EvidenceItem } from '@/types/orca';
import {
  Send, Bot, User, Sparkles, ShieldCheck, AlertTriangle,
  Layers, Clock, CheckCircle2, ChevronRight, FileText, Globe
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'orca';
  text: string;
  timestamp: string;
  response?: FinalMarineResponse;
  isLoading?: boolean;
}

function CopilotContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProgressStep, setCurrentProgressStep] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Preset Demonstrations
  const PRESET_DEMOS = [
    {
      id: 'fishing_safety',
      label: 'Fishing Safety Demo',
      query: 'Is it safe to go fishing tomorrow morning from my current location?'
    },
    {
      id: 'find_pfz',
      label: 'Find Nearest PFZ',
      query: 'Where is the nearest Potential Fishing Zone today and what is the optimal route?'
    },
    {
      id: 'research',
      label: 'Marine Research Analysis',
      query: 'Why has fish productivity declined in Palk Bay over the past two years?'
    },
    {
      id: 'tamil',
      label: 'Tamil Marine Safety (தமிழ்)',
      query: 'நாளை காலை இங்கிருந்து மீன்பிடிக்க கடலுக்கு செல்லலாமா?'
    }
  ];

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, currentProgressStep]);

  // Handle URL query or demo parameters
  useEffect(() => {
    const demoParam = searchParams.get('demo');
    const queryParam = searchParams.get('query');

    if (demoParam) {
      const matched = PRESET_DEMOS.find((d) => d.id === demoParam);
      if (matched) {
        handleExecuteQuery(matched.query);
      }
    } else if (queryParam) {
      handleExecuteQuery(queryParam);
    } else if (messages.length === 0) {
      // Welcome message
      setMessages([
        {
          id: 'welcome',
          sender: 'orca',
          text: (
            'Welcome to the ORCA Marine Intelligence Copilot (SIH26176 / ISRO-NRSC).\n\n' +
            'I orchestrate 12 specialized marine agents across satellite Earth Observation, ocean dynamics, meteorology, ' +
            'and maritime boundaries. You can ask queries regarding fishing safety, nearest PFZ hotspots, hazard warnings, ' +
            'or multi-year oceanographic trends in English, Tamil, Hindi, and regional languages.'
          ),
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  }, [searchParams]);

  const handleExecuteQuery = async (queryText: string) => {
    if (!queryText.trim() || isProcessing) return;

    const userMsgId = `user-${Date.now()}`;
    const orcaMsgId = `orca-${Date.now()}`;

    // Append user message
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: queryText,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      setCurrentProgressStep('Understanding query intent & language...');
      await new Promise((r) => setTimeout(r, 400));
      setCurrentProgressStep('Planning collaborative agent execution graph...');
      await new Promise((r) => setTimeout(r, 400));
      setCurrentProgressStep('Consulting Weather, Ocean, Tide, and EO Agents in parallel...');
      
      const response = await sendChatMessage(queryText, 'default-session', selectedLanguage);
      
      setCurrentProgressStep('Synthesizing evidence and risk recommendations...');
      await new Promise((r) => setTimeout(r, 300));

      setMessages((prev) => [
        ...prev,
        {
          id: orcaMsgId,
          sender: 'orca',
          text: response.answer,
          timestamp: new Date().toLocaleTimeString(),
          response: response
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: orcaMsgId,
          sender: 'orca',
          text: `Error communicating with ORCA Orchestrator: ${err.message || 'Unknown error'}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsProcessing(false);
      setCurrentProgressStep(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#F7FAFD] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} />

        {/* Preset Action Bar */}
        <div className="bg-white border-b border-[#D0DFF0] px-6 py-2 flex items-center justify-between text-xs shrink-0 shadow-sm">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-[#1A7FC1]" />
            <span className="font-bold text-[#0A1628]">Official SIH Evaluation Scenarios:</span>
          </div>
          <div className="flex items-center space-x-2">
            {PRESET_DEMOS.map((d) => (
              <button
                key={d.id}
                onClick={() => handleExecuteQuery(d.query)}
                disabled={isProcessing}
                className="px-2.5 py-1 rounded bg-[#F0F5FA] hover:bg-[#E2ECF8] border border-[#D0DFF0] text-[#0A1628] font-medium text-[11px] transition disabled:opacity-50"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Message Header */}
              <div className="flex items-center space-x-1.5 text-[11px] text-gray-500 mb-1 px-1">
                {msg.sender === 'user' ? (
                  <>
                    <span className="font-semibold text-gray-700">Maritime Operator</span>
                    <User className="w-3 h-3 text-gray-500" />
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5 text-[#1A7FC1]" />
                    <span className="font-bold text-[#0A1628]">ORCA Multi-Agent Copilot</span>
                    <span className="text-[9px] bg-sky-100 text-sky-800 px-1 py-0.2 rounded font-mono">
                      Gemini 2.5 Flash
                    </span>
                  </>
                )}
                <span>• {msg.timestamp}</span>
              </div>

              {/* Message Body */}
              <div
                className={`max-w-3xl rounded-lg p-4 text-xs leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-[#0A1628] text-white rounded-tr-none'
                    : 'bg-white border border-[#D0DFF0] text-[#0A1628] rounded-tl-none'
                }`}
              >
                {/* Text Content */}
                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                {/* If response metadata exists, show structured operational summary */}
                {msg.response && (
                  <div className="mt-4 pt-3 border-t border-[#E2ECF8] space-y-3">
                    {/* Execution Summary Accordion */}
                    <div className="bg-[#F7FAFD] rounded border border-[#E2ECF8] p-3 text-[11px]">
                      <div className="font-bold text-[#0A1628] flex items-center justify-between pb-1 border-b border-[#E2ECF8]">
                        <span className="flex items-center space-x-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#1A7FC1]" />
                          <span>Collaborative Agent Pipeline Summary</span>
                        </span>
                        <span className="text-emerald-700 font-semibold font-mono">
                          Confidence: {Math.round((msg.response.risk?.confidence || 0.88) * 100)}%
                        </span>
                      </div>

                      {/* Agent Timeline Pills */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.response.agent_timeline?.map((agent, i) => (
                          <div
                            key={i}
                            className="bg-white border border-[#D0DFF0] px-2 py-0.5 rounded text-[10px] flex items-center space-x-1 text-[#0A1628]"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="font-medium">{agent.agent_name}</span>
                            <span className="text-gray-400 font-mono">({agent.execution_time_ms}ms)</span>
                          </div>
                        ))}
                      </div>

                      {/* Risk Badge & Factors */}
                      {msg.response.risk && (
                        <div className="mt-2.5 p-2 rounded bg-white border border-[#D0DFF0] flex items-start space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded font-extrabold text-[10px] text-white ${
                              msg.response.risk.level === 'CRITICAL'
                                ? 'bg-red-600'
                                : msg.response.risk.level === 'HIGH'
                                ? 'bg-orange-500'
                                : msg.response.risk.level === 'MODERATE'
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                          >
                            RISK: {msg.response.risk.level} ({msg.response.risk.score})
                          </span>
                          <span className="text-gray-600 leading-tight">
                            {msg.response.risk.recommendation}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Verifiable Evidence Items */}
                    {msg.response.evidence && msg.response.evidence.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="font-bold text-[11px] text-[#0A1628] flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Supporting Verifiable Evidence ({msg.response.evidence.length} sources):</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {msg.response.evidence.map((ev, idx) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedEvidence(ev)}
                              className="p-2 bg-white rounded border border-[#E2ECF8] hover:border-[#1A7FC1] cursor-pointer text-[10px] transition"
                            >
                              <div className="font-semibold text-[#0A1628] truncate">{ev.dataset}</div>
                              <div className="text-gray-500">{ev.source}</div>
                              <div className="mt-1 flex items-center justify-between text-gray-700">
                                <span className="font-bold text-sky-800">{ev.parameter}: {ev.value}</span>
                                <span className="text-[9px] bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-mono">
                                  {ev.observation_type}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Operational Disclaimer */}
                    <div className="text-[10px] text-gray-500 italic bg-amber-50/70 p-2 rounded border border-amber-200/60">
                      ⚠ {msg.response.limitations?.[0] || 'SIMULATED DEMO DATA: Check official port bulletins.'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Real-time Agent Progress Indicator */}
          {isProcessing && (
            <div className="flex flex-col items-start max-w-xl">
              <div className="flex items-center space-x-1.5 text-[11px] text-gray-500 mb-1 px-1">
                <Bot className="w-3.5 h-3.5 text-[#1A7FC1]" />
                <span className="font-bold text-[#0A1628]">ORCA Multi-Agent Pipeline</span>
              </div>
              <div className="bg-white border border-[#D0DFF0] rounded-lg p-3.5 text-xs text-[#0A1628] shadow-sm flex items-center space-x-3 w-full animate-pulse">
                <div className="w-5 h-5 border-2 border-[#1A7FC1] border-t-transparent rounded-full animate-spin"></div>
                <div className="space-y-0.5">
                  <div className="font-bold text-sky-900">{currentProgressStep || 'Processing...'}</div>
                  <div className="text-[10px] text-gray-500">
                    Executing parallel satellite, weather, and oceanographic agent verification...
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-white border-t border-[#D0DFF0] p-4 shrink-0 shadow-lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteQuery(inputQuery);
            }}
            className="flex items-center space-x-3 max-w-4xl mx-auto"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask ORCA in English or தமிழ் (e.g., 'Is it safe to go fishing tomorrow morning from Rameswaram?')..."
              disabled={isProcessing}
              className="flex-1 bg-[#F7FAFD] border border-[#D0DFF0] rounded px-4 py-2.5 text-xs text-[#0A1628] placeholder-gray-400 focus:outline-none focus:border-[#1A7FC1] focus:ring-1 focus:ring-[#1A7FC1]"
            />
            <button
              type="submit"
              disabled={isProcessing || !inputQuery.trim()}
              className="bg-[#1A7FC1] hover:bg-[#1569a0] disabled:bg-gray-300 text-white px-5 py-2.5 rounded font-semibold text-xs flex items-center space-x-1.5 transition shadow"
            >
              <span>Transmit</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="text-center text-[10px] text-gray-400 mt-2">
            ISRO-NRSC Marine Intelligence Architecture • Powered by Google GenAI (Gemini 2.5 Flash)
          </div>
        </div>
      </div>

      {/* Evidence Inspector Side Drawer */}
      {selectedEvidence && (
        <div className="w-80 bg-white border-l border-[#D0DFF0] p-4 text-xs h-full overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2ECF8]">
            <span className="font-bold text-[#0A1628] flex items-center space-x-1">
              <FileText className="w-4 h-4 text-[#1A7FC1]" />
              <span>Evidence Record</span>
            </span>
            <button onClick={() => setSelectedEvidence(null)} className="text-gray-400 hover:text-gray-600 font-bold">
              ✕
            </button>
          </div>
          <div className="mt-4 space-y-3 text-gray-700">
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Dataset</div>
              <div className="font-bold text-gray-900 mt-0.5">{selectedEvidence.dataset}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Source Provider</div>
              <div className="text-gray-800 mt-0.5">{selectedEvidence.source}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Observation Type</div>
              <span className="inline-block mt-0.5 text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-mono font-bold">
                {selectedEvidence.observation_type}
              </span>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Parameter & Value</div>
              <div className="font-mono text-sm font-extrabold text-[#0A1628] mt-0.5">
                {selectedEvidence.parameter}: {selectedEvidence.value}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Location / Timestamp</div>
              <div className="text-gray-600 mt-0.5">{selectedEvidence.location}</div>
              <div className="text-gray-500 text-[10px]">{selectedEvidence.timestamp}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Statistical Confidence</div>
              <div className="font-mono text-emerald-700 font-bold mt-0.5">
                {Math.round(selectedEvidence.confidence * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CopilotPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading ORCA Marine Copilot...</div>}>
      <CopilotContent />
    </Suspense>
  );
}
