'use client';

import React from 'react';
import { CheckCircle2, Loader2, AlertTriangle, Clock, Cpu, Database, Network, Search, FileText } from 'lucide-react';

/**
 * AgentTimeline — renders the Gemini ReAct agent's thought-action-observation
 * chain as a vertical animated timeline.
 *
 * Props:
 *   steps   — Array of { step_type, description, tool_used, duration_ms, output_preview }
 *   loading — boolean, shows pulsing last step when true
 */
export default function AgentTimeline({ steps = [], loading = false }) {
  if (!steps || steps.length === 0) {
    if (!loading) return null;
    // Show skeleton while loading
    steps = [{ step_type: 'thinking', description: 'Agent initializing...', tool_used: null }];
  }

  const STEP_META = {
    thinking: {
      icon: Cpu,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      label: 'Thinking',
    },
    action: {
      icon: Search,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      label: 'Action',
    },
    tool_call: {
      icon: Database,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      label: 'Tool Call',
    },
    observation: {
      icon: FileText,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      label: 'Observation',
    },
    graph_traversal: {
      icon: Network,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
      label: 'Graph Traversal',
    },
    retrieval: {
      icon: Search,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
      label: 'Retrieval',
    },
    final_answer: {
      icon: CheckCircle2,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      label: 'Final Verdict',
    },
    error: {
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      label: 'Error',
    },
  };

  const getStepMeta = (type) => STEP_META[type] ?? STEP_META['thinking'];

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <span className="text-sm font-semibold text-slate-200">Agent Reasoning Chain</span>
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
          ReAct
        </span>
        {loading && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="font-mono">Processing...</span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-indigo-500/30 via-slate-700/50 to-transparent" />

        <div className="space-y-3">
          {steps.map((step, idx) => {
            const meta = getStepMeta(step.step_type);
            const Icon = meta.icon;
            const isLast = idx === steps.length - 1;
            const isPulsing = isLast && loading;

            return (
              <div
                key={idx}
                className={`relative flex gap-4 pl-0 transition-all duration-300 ${isPulsing ? 'opacity-70' : 'opacity-100'}`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Step Icon Node */}
                <div className="relative z-10 shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border ${meta.bg} ${meta.border} ${isPulsing ? 'animate-pulse' : ''}`}
                  >
                    {isPulsing
                      ? <Loader2 className={`w-3.5 h-3.5 ${meta.color} animate-spin`} />
                      : <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                    }
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.color} font-mono`}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">#{idx + 1}</span>
                    {step.tool_used && (
                      <span className="px-1.5 py-0.5 text-[9px] rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                        🔧 {step.tool_used}
                      </span>
                    )}
                    {step.duration_ms !== undefined && (
                      <span className="px-1.5 py-0.5 text-[9px] rounded bg-slate-800 text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {step.duration_ms}ms
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {step.description}
                  </p>

                  {step.output_preview && (
                    <div className="mt-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-500 font-mono leading-relaxed max-h-16 overflow-y-auto">
                      {step.output_preview}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading new step placeholder */}
          {loading && steps[steps.length - 1]?.step_type !== 'final_answer' && (
            <div className="relative flex gap-4 opacity-40 animate-pulse">
              <div className="relative z-10 shrink-0">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700" />
              </div>
              <div className="flex-1 space-y-1.5 py-2">
                <div className="h-2 w-20 bg-slate-800 rounded" />
                <div className="h-3 w-3/4 bg-slate-800 rounded" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step count summary */}
      {!loading && steps.length > 0 && (
        <div className="pt-3 text-xs text-slate-600 font-mono text-right">
          {steps.length} reasoning step{steps.length !== 1 ? 's' : ''} completed
        </div>
      )}
    </div>
  );
}
