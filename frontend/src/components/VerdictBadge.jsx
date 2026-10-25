'use client';

import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, ShieldCheck } from 'lucide-react';

export default function VerdictBadge({ verdict, confidence, confidencePercentage, size = 'default' }) {
  const isSupported = verdict === 'SUPPORTED';
  const isContradicted = verdict === 'CONTRADICTED';
  const isUnverified = verdict === 'UNVERIFIED';

  const pct = confidencePercentage ?? (confidence ? Math.round(confidence * 100) : 0);

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
          isSupported
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : isContradicted
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isSupported ? 'bg-emerald-400' : isContradicted ? 'bg-rose-400' : 'bg-amber-400'
          }`}
        />
        {verdict}
      </span>
    );
  }

  return (
    <div
      className={`relative p-5 rounded-2xl border transition-all ${
        isSupported
          ? 'bg-emerald-950/30 border-emerald-500/30 glow-emerald'
          : isContradicted
          ? 'bg-rose-950/30 border-rose-500/30 glow-crimson'
          : 'bg-amber-950/30 border-amber-500/30 glow-amber'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${
              isSupported
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isContradicted
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            }`}
          >
            {isSupported && <CheckCircle2 className="w-8 h-8" />}
            {isContradicted && <XCircle className="w-8 h-8" />}
            {isUnverified && <HelpCircle className="w-8 h-8" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-mono text-slate-400">
                Final Algorithmic Verdict
              </span>
            </div>
            <h2
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isSupported
                  ? 'text-emerald-400'
                  : isContradicted
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {isSupported && 'SUPPORTED (VERIFIED REAL)'}
              {isContradicted && 'CONTRADICTED (FAKE / MISINFO)'}
              {isUnverified && 'UNVERIFIED (AMBIGUOUS)'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified through Multi-factor Weighted Graph RAG Decision Engine
            </p>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="flex items-center gap-3 sm:border-l sm:border-slate-800/80 sm:pl-6">
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider font-mono text-slate-400 block">
              Confidence Score
            </span>
            <span className="text-3xl font-black font-mono tracking-tight text-white">
              {pct}%
            </span>
          </div>
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                className={
                  isSupported
                    ? 'text-emerald-400'
                    : isContradicted
                    ? 'text-rose-500'
                    : 'text-amber-400'
                }
                strokeDasharray={125.6}
                strokeDashoffset={125.6 - (125.6 * pct) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <ShieldCheck className="w-5 h-5 absolute text-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
