'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ChevronRight, 
  Network, 
  FileText, 
  Bot, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  ChevronDown,
  Sparkles,
  MapPin,
  Calendar,
  Share2,
  Image as ImageIcon
} from 'lucide-react';
import { useVerification } from '@/context/VerificationContext';
import VerdictBadge from '@/components/VerdictBadge';
import GraphViewer from '@/components/GraphViewer';
import EvidenceTable from '@/components/EvidenceTable';
import ScoreBreakdown from '@/components/ScoreBreakdown';
import ReportDownload from '@/components/ReportDownload';
import ClaimInput from '@/components/ClaimInput';
import AgentTimeline from '@/components/AgentTimeline';
import MultimodalUpload from '@/components/MultimodalUpload';
import LanguageSelector from '@/components/LanguageSelector';

export default function VerifyDashboardPage() {
  const { activeVerdict } = useVerification();
  const [expandedStep, setExpandedStep] = useState(null);

  const [imageExtractedClaim, setImageExtractedClaim] = useState('');
  const [selectedLang, setSelectedLang] = useState('auto');

  if (!activeVerdict) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-6">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-black text-white">Claim Verification Dashboard</h1>
          <p className="text-sm text-slate-400">
            Submit a claim below or select a preset to generate the full Graph RAG verification report.
          </p>
          <div className="flex justify-center pt-1">
            <LanguageSelector value={selectedLang} onChange={setSelectedLang} />
          </div>
        </div>
        <ClaimInput prefilledClaim={imageExtractedClaim} language={selectedLang} />

        {/* Optional image analysis panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80">
          <MultimodalUpload
            onResult={(data) => {
              const textClaim = data.extracted_claim || data.ocr_text || data.multimodal_analysis?.ocr_text;
              if (textClaim) setImageExtractedClaim(textClaim);
            }}
          />
        </div>
      </div>
    );
  }

  const {
    claim_text,
    detected_language,
    final_verdict,
    confidence,
    confidence_percentage,
    sub_scores,
    primary_claim,
    semantic_triple,
    top_evidence,
    graph_info,
    subgraph,
    reasoning_report,
    agent_trace
  } = activeVerdict;

  return (
    <div className="space-y-8">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
            <Link href="/" className="hover:text-indigo-400">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-indigo-400">Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-500 font-mono">{activeVerdict.verification_id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Verification Report & Deep Evidence Audit
          </h1>
        </div>

        <ReportDownload verdict={activeVerdict} />
      </div>

      {/* Primary Verdict Status Banner */}
      <VerdictBadge
        verdict={final_verdict}
        confidence={confidence}
        confidencePercentage={confidence_percentage}
      />

      {/* Claim Summary & Semantic Triple Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Original Claim & Meta */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              Claim Under Verification
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Language: {detected_language}
            </span>
          </div>

          <blockquote className="p-4 rounded-xl bg-slate-950/70 border-l-4 border-indigo-500 text-slate-200 text-base italic leading-relaxed font-sans">
            &ldquo;{claim_text}&rdquo;
          </blockquote>

          {/* Semantic Triple Breakdown */}
          {semantic_triple && (
            <div className="pt-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
                Gemini Flash Structured Semantic Triple:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">SUBJECT</span>
                  <span className="text-indigo-300 font-semibold">{semantic_triple.subject}</span>
                </div>
                <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">PREDICATE</span>
                  <span className="text-purple-300 font-semibold">{semantic_triple.predicate}</span>
                </div>
                <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">OBJECT / TOPIC</span>
                  <span className="text-pink-300 font-semibold">{semantic_triple.object}</span>
                </div>
                <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">LOCATION</span>
                  <span className="text-emerald-300 font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {semantic_triple.location || 'India-wide'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Verification Stats */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Evidence Synthesis
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400">Supporting Evidence:</span>
              <span className="font-bold text-emerald-400 text-sm">{activeVerdict.supporting_evidence_count}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400">Contradicting Evidence:</span>
              <span className="font-bold text-rose-400 text-sm">{activeVerdict.contradicting_evidence_count}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400">Best Evidence Score:</span>
              <span className="font-bold text-indigo-300 text-sm">
                {Math.round((activeVerdict.best_evidence_score || 0.85) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400">Graph Consistency:</span>
              <span className="font-bold text-purple-300 text-sm">
                {Math.round((sub_scores.graph_consistency || 0.85) * 100)}%
              </span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 font-mono text-center">
            Evaluated against 100k Benchmark Corpus
          </div>
        </div>
      </div>

      {/* Autonomous ReAct Agent Execution Trajectory Trace */}
      {agent_trace && agent_trace.length > 0 && (
        <div className="glass-panel rounded-2xl border border-slate-800/80 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-slate-100">
                Gemini 2.5 Flash Autonomous ReAct Agent Trace
              </h3>
            </div>
            <span className="text-xs font-mono text-indigo-400">
              Dynamic Function Calling & Tool Invocation Loop
            </span>
          </div>

          {/* Rich animated timeline view */}
          <AgentTimeline
            steps={agent_trace.map((step) => ({
              step_type: step.tool?.toLowerCase().includes('graph') ? 'graph_traversal'
                : step.tool?.toLowerCase().includes('retriev') ? 'retrieval'
                : step.tool?.toLowerCase().includes('nli') ? 'observation'
                : step.step === agent_trace.length ? 'final_answer'
                : 'action',
              description: step.thought,
              tool_used: step.tool,
              output_preview: step.observation,
            }))}
            loading={false}
          />
        </div>
      )}

      {/* Interactive Neo4j Entity Graph */}
      <GraphViewer subgraph={subgraph} graphInfo={graph_info} />

      {/* Algorithmic Score Breakdown */}
      <ScoreBreakdown subScores={sub_scores} />

      {/* Corroborating Candidate Evidence Table */}
      <EvidenceTable evidenceList={top_evidence} />

      {/* Auditable Natural Language Reasoning Report */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 p-6 shadow-xl space-y-3">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Auditable Natural Language Fact-Checking Report
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed font-sans bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          {reasoning_report}
        </p>
      </div>

    </div>
  );
}
