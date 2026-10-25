'use client';

import React from 'react';
import { Download, FileJson, Printer, Share2 } from 'lucide-react';

export default function ReportDownload({ verdict }) {
  if (!verdict) return null;

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(verdict, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `truthlens_verification_${verdict.verification_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleDownloadJSON}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-200 transition shadow-sm"
      >
        <FileJson className="w-4 h-4 text-indigo-400" />
        Download Audit JSON
      </button>

      <button
        onClick={handlePrintReport}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-200 transition shadow-sm"
      >
        <Printer className="w-4 h-4 text-purple-400" />
        Print / PDF Report
      </button>
    </div>
  );
}
