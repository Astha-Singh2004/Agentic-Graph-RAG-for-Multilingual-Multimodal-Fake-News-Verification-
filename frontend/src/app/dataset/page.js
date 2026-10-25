'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Database, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Eye, 
  CheckCircle, 
  Loader2,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { getDatasetPage } from '@/lib/api';
import { useVerification } from '@/context/VerificationContext';

const DATASETS = [
  { id: '01_news_articles', name: '01 News Articles (100K)', count: '100,000' },
  { id: '02_claims', name: '02 Claims (200K)', count: '200,000' },
  { id: '03_entities', name: '03 Entities (29 Graph Nodes)', count: '29' },
  { id: '05_evidence', name: '05 Evidence (300K Candidates)', count: '300,000' },
  { id: '06_nli_training', name: '06 NLI Training (300K Pairs)', count: '300,000' },
  { id: '08_social_posts', name: '08 Social Posts (20K)', count: '20,000' },
  { id: '09_image_metadata', name: '09 Image Metadata (10K)', count: '10,000' },
  { id: '10_verification_results', name: '10 Verification Results (100K)', count: '100,000' },
  { id: '14_test', name: '14 Test Split (10K Evaluation)', count: '10,000' },
];

export default function DatasetExplorerPage() {
  const router = useRouter();
  const { handleVerify } = useVerification();

  const [activeDataset, setActiveDataset] = useState('01_news_articles');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [dataResponse, setDataResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);

  const fetchDataset = async () => {
    setIsLoading(true);
    try {
      const res = await getDatasetPage({
        dataset: activeDataset,
        page,
        pageSize,
        search
      });
      setDataResponse(res);
    } catch (err) {
      console.error("Dataset fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, [activeDataset, page, search]);

  const handleDatasetChange = (id) => {
    setActiveDataset(id);
    setPage(1);
    setSearch('');
    setSelectedRow(null);
  };

  const rows = dataResponse?.rows || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  const handleVerifyRow = async (row) => {
    const textToVerify = row.claim_text || row.text || row.content || row.title || row.evidence_text;
    if (textToVerify) {
      await handleVerify(textToVerify, {
        language: row.language || null,
        article_id: row.article_id || null
      });
      router.push('/verify');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <Database className="w-8 h-8 text-indigo-400" />
          Interactive CSV Dataset Explorer
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Browse, search, and verify rows directly from the 100,000-article / 300,000-evidence Fact Verification Benchmark.
        </p>
      </div>

      {/* Dataset Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/60 scrollbar-thin">
        {DATASETS.map((ds) => (
          <button
            key={ds.id}
            onClick={() => handleDatasetChange(ds.id)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition ${
              activeDataset === ds.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
            }`}
          >
            {ds.name}
          </button>
        ))}
      </div>

      {/* Search & Pagination Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={`Search within ${activeDataset}...`}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>
            Page <strong>{page}</strong> of <strong>{dataResponse?.total_pages || 1}</strong> ({dataResponse?.total_records || 0} total)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(dataResponse?.total_pages || 1, p + 1))}
              disabled={page >= (dataResponse?.total_pages || 1)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Display */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl relative min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-80 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs font-mono text-slate-400">Fetching records from {activeDataset}.csv...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 text-sm">
            <Database className="w-8 h-8 text-slate-600 mb-2" />
            No records matched your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase font-mono text-slate-400 border-b border-slate-800/80">
                <tr>
                  <th className="px-4 py-3 text-center">Action</th>
                  {columns.map((col) => (
                    <th key={col} className="px-4 py-3 whitespace-nowrap font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-900/60 transition cursor-pointer"
                    onClick={() => setSelectedRow(row)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerifyRow(row);
                        }}
                        className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded border border-indigo-500/30 transition text-[10px] font-mono flex items-center gap-1"
                        title="Run Full Verification Pipeline on this sample"
                      >
                        Verify <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>

                    {columns.map((col) => {
                      const val = row[col];
                      const isLabel = col === 'label' || col === 'final_verdict';
                      return (
                        <td
                          key={col}
                          className="px-4 py-3 whitespace-nowrap max-w-xs truncate font-mono text-[11px]"
                        >
                          {isLabel ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                val === 'REAL' || val === 'SUPPORTED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : val === 'FAKE' || val === 'CONTRADICTED'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {val}
                            </span>
                          ) : (
                            String(val ?? '')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row Detail Modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Record Detail ({activeDataset})
              </h4>
              <button
                onClick={() => setSelectedRow(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {Object.entries(selectedRow).map(([k, v]) => (
                <div key={k} className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80 text-xs">
                  <span className="text-indigo-400 font-mono font-semibold block mb-0.5 uppercase tracking-wider text-[10px]">
                    {k}:
                  </span>
                  <p className="text-slate-200 font-mono whitespace-pre-wrap">{String(v)}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => handleVerifyRow(selectedRow)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
              >
                Verify In Dashboard <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedRow(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
