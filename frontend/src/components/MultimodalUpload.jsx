'use client';

import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, FileImage, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { uploadMediaImage } from '@/lib/api';

/**
 * MultimodalUpload — drag-and-drop image upload panel for visual claim verification.
 * Integrates with EasyOCR + CLIP backend endpoint to extract text from images
 * and evaluate image-text semantic alignment.
 *
 * Props:
 *   onResult(data)  — callback with OCR text, CLIP score, and extracted claim
 *   claimText       — current text claim to align against (optional)
 */
export default function MultimodalUpload({ onResult, claimText = '' }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_SIZE_MB = 10;

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  };

  const handleInputChange = (e) => {
    const selected = e.target.files[0];
    if (selected) processFile(selected);
  };

  const processFile = (f) => {
    setError(null);
    setResult(null);
    setStatus('idle');

    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Unsupported file type. Please upload a JPEG, PNG, WebP, or GIF.');
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }

    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setError(null);

    try {
      const data = await uploadMediaImage(file, claimText);
      setResult(data);
      setStatus('success');
      if (onResult) onResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Upload failed.');
      setStatus('error');
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setStatus('idle');
    if (inputRef.current) inputRef.current.value = '';
  };

  // ─── Sub-Components ───────────────────────────────────────────────────────────

  const AlignmentBar = ({ score }) => {
    const pct = Math.round((score ?? 0) * 100);
    const color = pct >= 60 ? '#22c55e' : pct >= 35 ? '#f59e0b' : '#ef4444';
    const label = pct >= 60 ? 'High Alignment' : pct >= 35 ? 'Moderate Alignment' : 'Low Alignment';
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400 font-mono">CLIP Image-Text Alignment</span>
          <span className="font-bold" style={{ color }}>{pct}% — {label}</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
          </div>
          <span className="text-sm font-semibold text-slate-200">Multimodal Image Analysis</span>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 uppercase tracking-widest">
            CLIP + OCR
          </span>
        </div>
        {file && (
          <button
            onClick={handleClear}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition"
            title="Clear image"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Drop Zone */}
      {!preview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200
            ${isDragging
              ? 'border-pink-500/70 bg-pink-500/5 scale-[1.01]'
              : 'border-slate-700 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/60'
            }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isDragging ? 'bg-pink-500/20 scale-110' : 'bg-slate-800'}`}>
            <Upload className={`w-6 h-6 transition-colors ${isDragging ? 'text-pink-400' : 'text-slate-500'}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-300">
              {isDragging ? 'Drop image here' : 'Drag & drop an image, or click to browse'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              JPEG, PNG, WebP, GIF • Max {MAX_SIZE_MB} MB
            </p>
            <p className="text-xs text-slate-600 mt-1 font-mono">
              EasyOCR extracts text • CLIP scores image-claim alignment
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      ) : (
        /* Preview Panel */
        <div className="rounded-xl overflow-hidden border border-slate-800/80 bg-slate-900/60">
          {/* Image preview */}
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Uploaded media"
              className="w-full max-h-56 object-contain bg-slate-950 py-2"
            />
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 text-xs bg-slate-900/90 text-slate-400 rounded-md border border-slate-700 font-mono">
                <FileImage className="w-3 h-3 inline mr-1" />
                {file?.name}
              </span>
            </div>
          </div>

          {/* Action bar */}
          <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-mono">
              {(file?.size / 1024 / 1024).toFixed(2)} MB • {file?.type}
            </span>
            <button
              onClick={handleUpload}
              disabled={status === 'uploading'}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all"
            >
              {status === 'uploading' ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</>
              ) : (
                <><Upload className="w-3.5 h-3.5" /> Analyze Image</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && status === 'success' && (
        <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Analysis Complete</span>
          </div>

          {/* CLIP Score */}
          {result.clip_score !== undefined && (
            <AlignmentBar score={result.clip_score} />
          )}

          {/* OCR Text */}
          {result.ocr_text && (
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-slate-400">OCR Extracted Text</span>
              <div className="p-2.5 rounded-lg bg-slate-800 text-xs text-slate-300 font-mono leading-relaxed max-h-24 overflow-y-auto">
                {result.ocr_text}
              </div>
            </div>
          )}

          {/* Extracted Claim */}
          {result.extracted_claim && (
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-slate-400">Extracted Claim</span>
              <div className="p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-xs text-indigo-300 italic">
                "{result.extracted_claim}"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
