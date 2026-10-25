'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, Image as ImageIcon, FileText, ArrowRight, Loader2, X } from 'lucide-react';
import { useVerification, SAMPLE_CLAIMS } from '@/context/VerificationContext';
import { uploadMediaImage } from '@/lib/api';

export default function ClaimInput({ onComplete, prefilledClaim = '', language: initialLanguage = '' }) {
  const router = useRouter();
  const { handleVerify, isLoading } = useVerification();

  const [text, setText] = useState('');
  const [language, setLanguage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'image'

  useEffect(() => {
    if (prefilledClaim) {
      setText(prefilledClaim);
    }
  }, [prefilledClaim]);

  useEffect(() => {
    if (initialLanguage && initialLanguage !== 'auto') {
      setLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  const handleSelectPreset = (preset) => {
    setText(preset.text);
    setLanguage(preset.lang);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setIsUploading(true);
    try {
      const res = await uploadMediaImage(file, text);
      setUploadResult(res);
      const extractedText = res.ocr_text || res.multimodal_analysis?.ocr_text || res.extracted_claim;
      if (extractedText && !text) {
        setText(extractedText);
      }
      const detectedLang = res.ocr_language || res.multimodal_analysis?.ocr_language;
      if (detectedLang && (!language || language === 'auto')) {
        setLanguage(detectedLang);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;

    try {
      await handleVerify(text, {
        language: language || null,
        image_path: uploadResult?.file_path || null,
      });

      if (onComplete) {
        onComplete();
      } else {
        router.push('/verify');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-6 border border-slate-800/80 shadow-2xl relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Input Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Verify News Article, Social Post, or Claim
          </h3>
        </div>

        <div className="flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
              activeTab === 'text'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Text Claim
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
              activeTab === 'image'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Media / Image OCR
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === 'image' && (
          <div className="p-4 rounded-xl border border-dashed border-indigo-500/30 bg-slate-950/40 hover:bg-slate-950/70 transition">
            <div className="flex flex-col items-center justify-center text-center">
              <ImageIcon className="w-8 h-8 text-indigo-400 mb-2" />
              <label className="cursor-pointer text-sm font-medium text-indigo-300 hover:text-indigo-200">
                <span>Upload an image for EasyOCR & CLIP analysis</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP supported</p>

              {isUploading && (
                <div className="flex items-center gap-2 mt-3 text-xs text-indigo-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running EasyOCR & CLIP matching...
                </div>
              )}

              {selectedFile && !isUploading && (
                <div className="flex flex-col items-center gap-2 mt-3 w-full max-w-md">
                  <div className="flex items-center justify-between w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300">
                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                    <div className="flex items-center gap-2">
                      {(uploadResult?.ocr_text || uploadResult?.multimodal_analysis?.ocr_text) && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                          OCR Extracted ({Math.round(((uploadResult.ocr_confidence || uploadResult.multimodal_analysis?.ocr_confidence) ?? 0.85) * 100)}%)
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setUploadResult(null);
                        }}
                        className="text-slate-400 hover:text-rose-400"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {(uploadResult?.ocr_text || uploadResult?.multimodal_analysis?.ocr_text) ? (
                    <div className="w-full text-left p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono max-h-24 overflow-y-auto">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-sans font-semibold flex items-center justify-between">
                        <span>Extracted Text</span>
                        <span className="text-indigo-400 font-mono">
                          {(uploadResult.ocr_language || uploadResult.multimodal_analysis?.ocr_language || 'EN').toUpperCase()}
                        </span>
                      </div>
                      {uploadResult.ocr_text || uploadResult.multimodal_analysis?.ocr_text}
                    </div>
                  ) : uploadResult && (
                    <p className="text-xs text-amber-400/90 italic">
                      No legible text detected in image. You can type or paste the claim manually below.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text Area */}
        <div className="relative">
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste raw headline, article excerpt, social media message (Hindi, Marathi, Bengali, English, etc.)..."
            className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition resize-none font-sans"
            required
          />
          <div className="absolute bottom-3 right-3 text-xs font-mono text-slate-500">
            {text.length} chars
          </div>
        </div>

        {/* Preset Chips */}
        <div>
          <span className="text-xs font-mono text-slate-400 block mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Quick Test Presets (100k Benchmark Datasets):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_CLAIMS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-900/80 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 transition text-left"
              >
                <span className="font-semibold text-indigo-400 mr-1">[{preset.lang.toUpperCase()}]</span>
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-mono">Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Auto-Detect (FastText)</option>
              <option value="en">English (en)</option>
              <option value="hi">Hindi (hi)</option>
              <option value="mr">Marathi (mr)</option>
              <option value="bn">Bengali (bn)</option>
              <option value="pa">Punjabi (pa)</option>
              <option value="ta">Tamil (ta)</option>
              <option value="te">Telugu (te)</option>
              <option value="gu">Gujarati (gu)</option>
              <option value="ml">Malayalam (ml)</option>
              <option value="or">Odia (or)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:-translate-y-0.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing Graph RAG Pipeline...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Verify Claim</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
