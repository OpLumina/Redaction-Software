'use client';

import { useEffect, useRef } from 'react';
import { useRedactionStore } from '@/store/redactionStore';
import { useDocumentStore } from '@/store/documentStore';
import { RedactionMode } from '@/types/redaction';

const MODES: { mode: RedactionMode; label: string; icon: string; title: string }[] = [
  { mode: 'draw', label: 'Draw', icon: '[]', title: 'Draw redaction box' },
  { mode: 'select', label: 'Select', icon: '+', title: 'Select redaction boxes' },
  { mode: 'erase', label: 'Erase', icon: 'X', title: 'Erase redactions by clicking them' },
  { mode: 'find', label: 'Find', icon: '?', title: 'Search and redact text via OCR' },
];

export default function RedactionToolbar() {
  const mode = useRedactionStore((s) => s.mode);
  const setMode = useRedactionStore((s) => s.setMode);
  const undo = useRedactionStore((s) => s.undo);
  const redo = useRedactionStore((s) => s.redo);
  const clearAll = useRedactionStore((s) => s.clearAll);
  const historyIndex = useRedactionStore((s) => s.historyIndex);
  const historyLen = useRedactionStore((s) => s.history.length);
  const allPagesMode = useRedactionStore((s) => s.allPagesMode);
  const setAllPagesMode = useRedactionStore((s) => s.setAllPagesMode);
  const setPageCountMirror = useRedactionStore((s) => s.setPageCountMirror);

  const pageCount = useDocumentStore((s) => s.pageCount);

  // Use a ref to track the last synced value so the effect only calls
  // setPageCountMirror when pageCount actually changes and not on every render.
  const lastSyncedPageCount = useRef<number>(-1);
  useEffect(() => {
    if (pageCount !== lastSyncedPageCount.current) {
      lastSyncedPageCount.current = pageCount;
      setPageCountMirror(pageCount);
    }
  }, [pageCount, setPageCountMirror]);

  const toggleAllPages = () => {
    const next = !allPagesMode;
    setAllPagesMode(next);
    if (next) setMode('draw');
  };

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 bg-redact-surface
      border-b border-redact-border flex-shrink-0 flex-wrap"
    >
      <div className="flex items-center gap-1 bg-redact-bg rounded p-1">
        {MODES.map(({ mode: m, label, icon, title }) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              if (m !== 'draw') setAllPagesMode(false);
            }}
            title={title}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors
              flex items-center gap-1
              ${mode === m
                ? 'bg-redact-accent text-white'
                : 'text-redact-text-dim hover:text-redact-text'}`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {pageCount > 1 && (
        <button
          onClick={toggleAllPages}
          title="Draw once -> box is copied to the same position on every page. Undo removes all copies at once."
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono
            border transition-colors
            ${allPagesMode
              ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
              : 'border-redact-border text-redact-text-dim hover:border-redact-muted hover:text-redact-text'}`}
        >
          <span>+</span>
          <span>{allPagesMode ? 'All pages ON' : 'All pages'}</span>
        </button>
      )}

      <div className="h-4 w-px bg-redact-border mx-1" />

      <button
        onClick={undo}
        disabled={historyIndex <= 0}
        className="text-xs px-2 py-1 font-mono text-redact-text-dim hover:text-redact-text
          disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Undo
      </button>
      <button
        onClick={redo}
        disabled={historyIndex >= historyLen - 1}
        className="text-xs px-2 py-1 font-mono text-redact-text-dim hover:text-redact-text
          disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Redo
      </button>

      <div className="h-4 w-px bg-redact-border mx-1" />

      <button
        onClick={() => {
          if (confirm('Clear all redactions?')) clearAll();
        }}
        className="text-xs px-2 py-1 font-mono text-redact-text-dim
          hover:text-redact-accent transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}
