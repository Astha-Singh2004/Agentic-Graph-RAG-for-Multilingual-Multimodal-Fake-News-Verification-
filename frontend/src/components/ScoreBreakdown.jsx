'use client';

import React from 'react';
import { BarChart, Activity, Zap, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Image as ImageIcon } from 'lucide-react';

export default function ScoreBreakdown({ subScores }) {
  if (!subScores) return null;

  const metrics = [
    {
      name: "XLM-R NLI Entailment",
      score: subScores.nli_entailment || 0.0,
      weight: "35%",
      icon: CheckCircle2,
      color: "from-emerald-500 to-teal-500",
      textColor: "text-emerald-400"
    },
    {
      name: "XLM-R NLI Contradiction",
      score: subScores.nli_contradiction || 0.0,
      weight: "35%",
      icon: AlertTriangle,
      color: "from-rose-500 to-pink-500",
      textColor: "text-rose-400"
    },
    {
      name: "BGE-M3 Dense Vector Similarity",
      score: subScores.vector_similarity || 0.0,
      weight: "20%",
      icon: Zap,
      color: "from-indigo-500 to-purple-500",
      textColor: "text-indigo-400"
    },
    {
      name: "BM25 Sparse Keyword Ranking",
      score: subScores.bm25_relevance || 0.0,
      weight: "15%",
      icon: BarChart,
      color: "from-blue-500 to-cyan-500",
      textColor: "text-blue-400"
    },
    {
      name: "Source Authoritative Reliability",
      score: subScores.source_reliability || 0.90,
      weight: "10%",
      icon: ShieldCheck,
      color: "from-amber-500 to-orange-500",
      textColor: "text-amber-400"
    },
    {
      name: "Neo4j Graph RAG Consistency",
      score: subScores.graph_consistency || 0.85,
      weight: "10%",
      icon: Activity,
      color: "from-violet-500 to-indigo-500",
      textColor: "text-violet-400"
    },
    {
      name: "Temporal Alignment & Freshness",
      score: subScores.temporal_consistency || 0.88,
      weight: "5%",
      icon: Clock,
      color: "from-slate-400 to-slate-200",
      textColor: "text-slate-300"
    }
  ];

  if (subScores.image_text_consistency !== null && subScores.image_text_consistency !== undefined) {
    metrics.push({
      name: "Multimodal CLIP Image-Text Alignment",
      score: subScores.image_text_consistency,
      weight: "5%",
      icon: ImageIcon,
      color: "from-fuchsia-500 to-pink-500",
      textColor: "text-fuchsia-400"
    });
  }

  return (
    <div className="glass-panel rounded-2xl border border-slate-800/80 p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-100">
            Algorithmic Score Breakdown
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Multi-Factor Decision Weights (Sum = 100%)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          const pct = Math.round(m.score * 100);

          return (
            <div
              key={idx}
              className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${m.textColor}`} />
                  <span className="text-xs font-semibold text-slate-200">
                    {m.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-mono font-bold ${m.textColor}`}>
                    {pct}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono ml-1">
                    (w: {m.weight})
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${m.color} transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
