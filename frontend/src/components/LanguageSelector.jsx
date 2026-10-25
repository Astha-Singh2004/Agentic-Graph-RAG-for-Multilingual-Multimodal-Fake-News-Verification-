'use client';

import React, { useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

/**
 * LanguageSelector — dropdown picker for 10 supported Indic + English languages.
 * Emits selected ISO language code via onChange callback.
 *
 * Props:
 *   value      — current language code (e.g. 'hi', 'en', 'auto')
 *   onChange   — callback(code: string)
 *   compact    — if true, shows only flag + code (no full name)
 *   disabled   — disable the picker
 */
export default function LanguageSelector({
  value = 'auto',
  onChange,
  compact = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);

  const LANGUAGES = [
    { code: 'auto', name: 'Auto Detect', flag: '🔍', script: 'FastText' },
    { code: 'en',   name: 'English',     flag: '🇬🇧', script: 'Latin' },
    { code: 'hi',   name: 'Hindi',       flag: '🇮🇳', script: 'Devanagari' },
    { code: 'mr',   name: 'Marathi',     flag: '🇮🇳', script: 'Devanagari' },
    { code: 'bn',   name: 'Bengali',     flag: '🇧🇩', script: 'Bengali' },
    { code: 'ta',   name: 'Tamil',       flag: '🇮🇳', script: 'Tamil' },
    { code: 'te',   name: 'Telugu',      flag: '🇮🇳', script: 'Telugu' },
    { code: 'gu',   name: 'Gujarati',    flag: '🇮🇳', script: 'Gujarati' },
    { code: 'pa',   name: 'Punjabi',     flag: '🇮🇳', script: 'Gurmukhi' },
    { code: 'kn',   name: 'Kannada',     flag: '🇮🇳', script: 'Kannada' },
    { code: 'ml',   name: 'Malayalam',   flag: '🇮🇳', script: 'Malayalam' },
  ];

  const selected = LANGUAGES.find((l) => l.code === value) ?? LANGUAGES[0];

  const handleSelect = (code) => {
    setOpen(false);
    if (onChange) onChange(code);
  };

  return (
    <div className="relative inline-block text-left">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-150
          ${disabled
            ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900 text-slate-500'
            : 'border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-slate-600 text-slate-200 cursor-pointer'
          }
          ${open ? 'border-indigo-500/60 ring-1 ring-indigo-500/20' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
        <span className="text-base leading-none">{selected.flag}</span>
        {!compact && (
          <span className="font-medium">{selected.name}</span>
        )}
        {compact && (
          <span className="text-xs font-mono uppercase text-slate-400">{selected.code}</span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            role="listbox"
            className="absolute z-40 mt-1.5 w-56 rounded-xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-sm shadow-xl shadow-black/50 overflow-hidden animate-fade-in"
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
                10 Indic + English Languages
              </p>
            </div>

            {/* Options */}
            <div className="max-h-64 overflow-y-auto py-1">
              {LANGUAGES.map((lang) => {
                const isSelected = lang.code === value;
                return (
                  <button
                    key={lang.code}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                      ${isSelected
                        ? 'bg-indigo-500/10 text-indigo-300'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                  >
                    <span className="text-lg leading-none w-6 text-center">{lang.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{lang.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500 font-mono uppercase">{lang.code}</span>
                        {lang.script !== 'FastText' && (
                          <>
                            <span className="text-slate-700">·</span>
                            <span className="text-[10px] text-slate-600 font-mono">{lang.script}</span>
                          </>
                        )}
                        {lang.code === 'auto' && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                            FastText
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer note */}
            <div className="px-3 py-2 border-t border-slate-800">
              <p className="text-[9px] text-slate-600 font-mono">
                IndicTrans2 normalizes all scripts for cross-lingual retrieval
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
