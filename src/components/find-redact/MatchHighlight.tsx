'use client';

import { useDocumentStore } from '@/store/documentStore';
import { OcrMatch } from './FindRedactPanel';

interface Props {
  words: OcrMatch[];
  query: string;
  onAdd: (words: OcrMatch[]) => void;
}

// FIX #2: Highlight the matching portion of the word text
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-400 text-black rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// Group matches by page for a cleaner display
function groupByPage(words: OcrMatch[]): Map<number, OcrMatch[]> {
  const map = new Map<number, OcrMatch[]>();
  for (const w of words) {
    if (!map.has(w.pageIndex)) map.set(w.pageIndex, []);
    map.get(w.pageIndex)!.push(w);
  }
  return map;
}

export default function MatchHighlight({ words, query, onAdd }: Props) {
  // FIX #2: request scroll-to-page from document store
  const requestScrollToPage = useDocumentStore((s) => s.requestScrollToPage);

  if (!words.length) return (
    <p className="text-xs text-redact-text-dim px-3 py-2 font-mono">No matches found.</p>
  );

  const grouped = groupByPage(words);
  const pageEntries = Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div className="flex flex-col gap-2 px-3 py-2 overflow-y-auto max-h-56">
      {pageEntries.map(([pageIndex, pageWords]) => (
        <div key={pageIndex} className="flex flex-col gap-0.5">
          {/* Page header — click to scroll */}
          <button
            onClick={() => requestScrollToPage(pageIndex)}
            className="flex items-center gap-1.5 text-left hover:text-redact-text transition-colors group"
            title={`Scroll to page ${pageIndex + 1}`}
          >
            <span className="text-[10px] font-mono font-bold text-redact-accent
              bg-redact-accent/10 px-1.5 py-0.5 rounded">
              p{pageIndex + 1}
            </span>
            <span className="text-[10px] font-mono text-redact-text-dim
              group-hover:text-redact-text transition-colors">
              {pageWords.length} match{pageWords.length !== 1 ? 'es' : ''} — click to jump ↓
            </span>
          </button>

          {/* Individual matches on this page */}
          {pageWords.map((w, i) => (
            <div key={i}
              className="flex items-center justify-between gap-2 group pl-2
                border-l border-redact-border hover:border-redact-accent/50 transition-colors">
              <span className="text-xs font-mono text-redact-text truncate flex-1">
                <HighlightedText text={w.text} query={query} />
              </span>
              <span className="text-xs text-redact-text-dim flex-shrink-0">
                {Math.round(w.confidence)}%
              </span>
              <button
                onClick={() => onAdd([w])}
                className="text-xs text-redact-accent opacity-0 group-hover:opacity-100
                  transition-opacity font-mono flex-shrink-0">
                redact
              </button>
            </div>
          ))}

          {/* Redact-all for this page */}
          {pageWords.length > 1 && (
            <button
              onClick={() => onAdd(pageWords)}
              className="ml-2 mt-0.5 text-[10px] text-redact-accent font-mono
                border border-redact-accent/30 rounded px-2 py-0.5
                hover:bg-redact-accent/10 transition-colors self-start">
              Redact all {pageWords.length} on p{pageIndex + 1}
            </button>
          )}
        </div>
      ))}

      {/* Global redact-all */}
      {words.length > 1 && (
        <button
          onClick={() => onAdd(words)}
          className="mt-1 text-xs text-redact-accent font-mono border border-redact-accent/30
            rounded px-2 py-1 hover:bg-redact-accent/10 transition-colors">
          Redact all {words.length} matches across all pages
        </button>
      )}
    </div>
  );
}
