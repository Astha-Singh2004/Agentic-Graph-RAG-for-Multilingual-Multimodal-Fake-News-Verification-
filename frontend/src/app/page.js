'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Network, Layers, Sparkles, ArrowRight, CheckCircle2, AlertTriangle, Cpu, Globe } from 'lucide-react';
import ClaimInput from '@/components/ClaimInput';
import VerdictBadge from '@/components/VerdictBadge';
import { useVerification } from '@/context/VerificationContext';

export default function HomePage() {
  const { activeVerdict } = useVerification();

  return (
    <div className="space-y-12">
      
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Agentic Graph RAG Fact-Verification System</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
          Cross-Lingual Multimodal <br />
          <span className="text-gradient">Fake News Verification</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Combats digital misinformation across Indic regional languages, code-mixed dialects,
          and out-of-context media through <strong>Dijkstra Knowledge Graph Traversals</strong>,
          <strong>BGE-M3 Dense Retrieval</strong>, and <strong>XLM-RoBERTa NLI Cross-Encoders</strong>.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <span className="px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
            📚 100K Benchmark Articles
          </span>
          <span className="px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
            🔍 300K Evidence Candidates
          </span>
          <span className="px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
            🕸️ 29 Neo4j Graph Entities
          </span>
          <span className="px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
            🌐 10 Indic Regional Languages
          </span>
        </div>
      </section>

      {/* Main Verification Input Section */}
      <section className="max-w-3xl mx-auto">
        <ClaimInput />
      </section>

      {/* Live Verdict Preview (if verified on homepage) */}
      {activeVerdict && (
        <section className="max-w-3xl mx-auto space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
              Latest Verification Result
            </h3>
            <Link
              href="/verify"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              Open Full Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <VerdictBadge
            verdict={activeVerdict.final_verdict}
            confidence={activeVerdict.confidence}
            confidencePercentage={activeVerdict.confidence_percentage}
          />
        </section>
      )}

      {/* Architecture Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
            <Network className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Agentic Graph RAG</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Uses Dijkstra shortest path and BFS neighborhood traversals over Neo4j knowledge graphs
            to uncover multi-hop relational dependencies that standard vector search misses.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 relative overflow-hidden group hover:border-purple-500/40 transition">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Cross-Lingual AI Core</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            FastText language detection and IndicTrans2 script normalization seamlessly process
            Hindi, Marathi, Bengali, Tamil, Punjabi, Gujarati, Telugu, and English claims.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 relative overflow-hidden group hover:border-pink-500/40 transition">
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-110 transition-transform">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Multimodal CLIP & OCR</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            EasyOCR extracts textual assertions inside flyers and banners while CLIP evaluates
            image-text semantic alignment to detect out-of-context visual manipulations.
          </p>
        </div>
      </section>
    </div>
  );
}
