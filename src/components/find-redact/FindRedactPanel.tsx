'use client';

import { useState, useCallback } from 'react';
import { useDocumentStore }  from '@/store/documentStore';
import { useRedactionStore } from '@/store/redactionStore';
import { useOcrStore }       from '@/store/ocrStore';
import { OcrWord }           from '@/types/ocr';
import { RedactionBox }      from '@/types/redaction';
import { normalizeBoundingBox, padBoundingBox } from '@/lib/ocr/coordinateNormalizer';
import OcrProgressBar  from './OcrProgressBar';
import MatchHighlight  from './MatchHighlight';

export interface OcrMatch extends OcrWord {
  pageIndex: number;
}

export default function FindRedactPanel() {
  const [query,     setQuery]     = useState('');
  const [matches,   setMatches]   = useState<OcrMatch[]>([]);
  const [searched,  setSearched]  = useState(false);
  const [searching, setSearching] = useState(false);

  const activeFileId = useDocumentStore((s) => s.activeFileId);
  const addBox       = useRedactionStore((s) => s.addBox);
  const getAllResults = useOcrStore((s) => s.getAllResults);

  const handleSearch = useCallback(async () => {
    if (!activeFileId || !query.trim()) return;
    setSearching(true);
    const lower = query.toLowerCase();
    const found: OcrMatch[] = [];

    // getAllResults loads every processed page from IndexedDB — full document
    const allResults = await getAllResults(activeFileId);
    for (const result of allResults) {
      for (const w of result.words) {
        if (w.text.toLowerCase().includes(lower)) {
          found.push({ ...w, pageIndex: result.pageIndex });
        }
      }
    }

    setMatches(found);
    setSearched(true);
    setSearching(false);
  }, [activeFileId, query, getAllResults]);

  const handleAdd = useCallback(async (words: OcrMatch[]) => {
    if (!activeFileId) return;
    const getResult = useOcrStore.getState().getResult;

    for (const w of words) {
      const result = await getResult(activeFileId, w.pageIndex);
      if (!result) continue;

      const norm   = normalizeBoundingBox(w.bbox, {
        canvasWidth:  result.imageWidth,
        canvasHeight: result.imageHeight,
        sourceWidth:  result.imageWidth,
        sourceHeight: result.imageHeight,
      });
      const padded = padBoundingBox(norm, 0.5);

      const box: RedactionBox = {
        id: crypto.randomUUID(),
        pageIndex: w.pageIndex,
        ...padded,
        source: 'ocr',
        label: w.text,
      };
      addBox(box);
    }
  }, [activeFileId, addBox]);

  if (!activeFileId) return null;

  return (
    <div className="flex flex-col border-t border-redact-border">
      <div className="px-3 py-2 flex gap-2">
        <input
          type="text" value={query}
          onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Find text to redact…"
          className="flex-1 bg-redact-bg border border-redact-border rounded px-2 py-1
            text-xs font-mono text-redact-text placeholder-redact-muted
            focus:outline-none focus:border-redact-accent"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-3 py-1 bg-redact-accent text-white text-xs font-mono rounded
            hover:bg-redact-accent-dim transition-colors disabled:opacity-50">
          {searching ? '…' : 'Search'}
        </button>
      </div>
      <OcrProgressBar fileId={activeFileId} />
      {searched && <MatchHighlight words={matches} query={query} onAdd={handleAdd} />}
    </div>
  );
}
