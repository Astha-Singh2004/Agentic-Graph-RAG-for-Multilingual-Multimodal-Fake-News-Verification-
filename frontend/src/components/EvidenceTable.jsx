'use client';
import React, { useState } from 'react';
import { Database, ExternalLink, Check, X, HelpCircle, Layers } from 'lucide-react';

export default function EvidenceTable({ evidenceList = [] }) {
  const [selectedItem, setSelectedItem] = useState(null);

  if (!evidenceList || evidenceList.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-slate-400 border border-slate-800">
        <Database className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm">No evidence candidates retrieved for this query.</p>
      </div>
    );
  }
  return (
    <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-100">
            Retrieved Corroborating Evidence ({evidenceList.length} Candidates)
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Ranked by BM25 + BGE-M3 Dense Hybrid Retrieval
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs uppercase font-mono text-slate-400 border-b border-slate-800/80">
            <tr>
              <th className="px-6 py-3">Source & ID</th>
              <th className="px-6 py-3">Factual Evidence Snippet</th>
              <th className="px-4 py-3 text-center">BM25 / Vector</th>
              <th className="px-4 py-3 text-center">NLI Status</th>
              <th className="px-4 py-3 text-center">Composite Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {evidenceList.map((item, idx) => {
              const isEntailment = item.nli_label === 'ENTAILMENT';
              const isContradiction = item.nli_label === 'CONTRADICTION';

              return (
                <tr
                  key={item.evidence_id || idx}
                  className="hover:bg-slate-900/50 transition cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">
                        {item.source}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {item.evidence_id}
                      </span>
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-slate-800 text-indigo-300 w-fit">
                        {item.source_type || 'OFFICIAL'}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 max-w-md">
                    <p className="line-clamp-2 text-slate-300 text-xs sm:text-sm">
                      {item.evidence_text}
                    </p>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 w-24 mx-auto text-xs font-mono">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>BM25</span>
                        <span className="text-indigo-300">{Math.round((item.bm25_score || 0) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1">
                        <div
                          className="bg-indigo-500 h-1 rounded-full"
                          style={{ width: `${Math.min(100, Math.round((item.bm25_score || 0) * 100))}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                        <span>Vector</span>
                        <span className="text-purple-300">{Math.round((item.vector_score || 0) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1">
                        <div
                          className="bg-purple-500 h-1 rounded-full"
                          style={{ width: `${Math.min(100, Math.round((item.vector_score || 0) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isEntailment
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isContradiction
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {isEntailment && <Check className="w-3 h-3" />}
                      {isContradiction && <X className="w-3 h-3" />}
                      {!isEntailment && !isContradiction && <HelpCircle className="w-3 h-3" />}
                      {item.nli_label || 'NEUTRAL'}
                    </span>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-mono font-bold text-white">
                      {Math.round((item.evidence_score || 0) * 100)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h4 className="text-lg font-bold text-white mb-2">Evidence Record Detail</h4>
            <p className="text-xs font-mono text-indigo-400 mb-4">{selectedItem.evidence_id} • {selectedItem.source}</p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 text-sm mb-4">
              {selectedItem.evidence_text}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-6 font-mono">
              <div className="p-2 bg-slate-950/50 rounded border border-slate-800">
                <span className="text-slate-400 block">BM25 Score</span>
                <span className="text-slate-100 font-bold">{selectedItem.bm25_score}</span>
              </div>
              <div className="p-2 bg-slate-950/50 rounded border border-slate-800">
                <span className="text-slate-400 block">Vector Similarity</span>
                <span className="text-slate-100 font-bold">{selectedItem.vector_score}</span>
              </div>
              <div className="p-2 bg-slate-950/50 rounded border border-slate-800">
                <span className="text-slate-400 block">Source Reliability</span>
                <span className="text-slate-100 font-bold">{selectedItem.source_reliability}</span>
              </div>
              <div className="p-2 bg-slate-950/50 rounded border border-slate-800">
                <span className="text-slate-400 block">NLI Label</span>
                <span className="text-emerald-400 font-bold">{selectedItem.nli_label}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
