'use client';

import { useState, useCallback } from 'react';
import { useDocumentStore }  from '@/store/documentStore';
import { useRedactionStore } from '@/store/redactionStore';
import { BurnOptions }       from '@/types/redaction';
import { renderPageHighRes } from '@/lib/pdf/pdfRenderer';
import { burnPage, cloneCanvas } from '@/lib/burn/burnPage';
import { reassemblePdf }     from '@/lib/pdf/pdfReassembler';
import { stripPdfMetadata, stripImageMetadata } from '@/lib/burn/metadataStripper';
import { loadPdf }           from '@/lib/pdf/pdfLoader';
import { burnImageFile }     from '@/lib/image/imageProcessor';
import ExportProgress        from './ExportProgress';

function download(blob: Blob, name: string) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: name,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function ExportModal({ onClose }: { onClose: () => void }) {
  const [options, setOptions] = useState<BurnOptions>({
    format: 'pdf', dpi: 300, stripMetadata: true,
  });
  const [burning,  setBurning]  = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error,    setError]    = useState<string | null>(null);

  const activeFileId = useDocumentStore((s) => s.activeFileId);
  const files        = useDocumentStore((s) => s.files);
  const updateFile   = useDocumentStore((s) => s.updateFile);
  const boxes        = useRedactionStore((s) => s.boxes);
  const activeFile   = files.find((f) => f.id === activeFileId);
  const totalBoxes   = Object.values(boxes).flat().length;

  const handleExport = useCallback(async () => {
    if (!activeFile || !activeFileId) return;
    setBurning(true); setError(null);
    try {
      updateFile(activeFileId, { status: 'exporting' });

      if (activeFile.type === 'image') {
        // burnImageFile now handles percentage→pixel conversion internally
        const allBoxes = Object.values(boxes).flat();
        const blob     = await burnImageFile(activeFile.file, allBoxes);
        const out      = options.stripMetadata ? await stripImageMetadata(blob) : blob;
        const ext      = activeFile.name.split('.').pop() ?? 'png';
        download(out, activeFile.name.replace(`.${ext}`, `_REDACTED.${ext}`));
      } else {
        const sourceFile = activeFile.convertedPdfBlob
          ? new File([activeFile.convertedPdfBlob], activeFile.name, { type: 'application/pdf' })
          : activeFile.file;

        const pdf       = await loadPdf(sourceFile);
        const pageCount = pdf.numPages;
        setProgress({ current: 0, total: pageCount });

        const burned = [];

        for (let i = 0; i < pageCount; i++) {
          setProgress({ current: i + 1, total: pageCount });

          // Render at the target DPI
          const canvas = await renderPageHighRes(pdf, i, options.dpi);

          // Boxes are stored as PERCENTAGES (0-100).
          // Convert to absolute pixels on the high-res canvas.
          const pageBoxes = (boxes[i] ?? []).map((b) => ({
            ...b,
            x:      (b.x      / 100) * canvas.width,
            y:      (b.y      / 100) * canvas.height,
            width:  (b.width  / 100) * canvas.width,
            height: (b.height / 100) * canvas.height,
          }));

          const clone = cloneCanvas(canvas);
          burnPage({ canvas: clone, boxes: pageBoxes });
          burned.push({ pageIndex: i, canvas: clone });
        }

        let pdfBytes = await reassemblePdf(burned);
        if (options.stripMetadata) pdfBytes = await stripPdfMetadata(pdfBytes);

        download(
          new Blob([pdfBytes.buffer as any], { type: 'application/pdf' }),
          activeFile.name.replace(/\.[^.]+$/, '_REDACTED.pdf')
        );
      }

      updateFile(activeFileId, { status: 'done' });
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Export failed';
      setError(msg);
      updateFile(activeFileId, { status: 'error', errorMessage: msg });
    } finally {
      setBurning(false);
    }
  }, [activeFile, activeFileId, boxes, options, updateFile, onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-redact-surface border border-redact-border rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono text-redact-text font-bold tracking-wide">Export & Burn</h2>
          {!burning && (
            <button onClick={onClose} className="text-redact-muted hover:text-redact-text text-xl">×</button>
          )}
        </div>

        <div className="bg-redact-bg rounded-lg p-3 mb-4 text-xs font-mono space-y-1">
          <div className="flex justify-between">
            <span className="text-redact-text-dim">File</span>
            <span className="text-redact-text truncate max-w-52">{activeFile?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-redact-text-dim">Redactions</span>
            <span className={totalBoxes > 0 ? 'text-redact-accent' : 'text-redact-muted'}>
              {totalBoxes} box{totalBoxes !== 1 ? 'es' : ''}
            </span>
          </div>
        </div>

        {!burning && (
          <div className="space-y-4 mb-6">
            {activeFile?.type !== 'image' && (
              <>
                <div>
                  <label className="text-xs font-mono text-redact-text-dim block mb-2">
                    Output format
                  </label>
                  <div className="flex gap-2">
                    {(['pdf', 'png'] as const).map((fmt) => (
                      <button key={fmt}
                        onClick={() => setOptions((o) => ({ ...o, format: fmt }))}
                        className={`flex-1 py-2 rounded text-xs font-mono border transition-colors
                          ${options.format === fmt
                            ? 'border-redact-accent bg-redact-accent/10 text-redact-accent'
                            : 'border-redact-border text-redact-text-dim hover:border-redact-muted'}`}>
                        .{fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-redact-text-dim block mb-2">
                    Export DPI: <span className="text-redact-text">{options.dpi}</span>
                  </label>
                  <input type="range" min={150} max={600} step={50} value={options.dpi}
                    onChange={(e) => setOptions((o) => ({ ...o, dpi: Number(e.target.value) }))}
                    className="w-full accent-redact-accent" />
                  <div className="flex justify-between text-xs text-redact-muted mt-1 font-mono">
                    <span>150 (fast)</span><span>600 (archival)</span>
                  </div>
                </div>
              </>
            )}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={options.stripMetadata}
                onChange={(e) => setOptions((o) => ({ ...o, stripMetadata: e.target.checked }))}
                className="accent-redact-accent w-4 h-4" />
              <span className="text-xs font-mono text-redact-text-dim">
                Strip metadata (author, dates, EXIF)
              </span>
            </label>
          </div>
        )}

        {burning && progress.total > 0 && (
          <ExportProgress current={progress.current} total={progress.total} />
        )}
        {burning && progress.total === 0 && (
          <p className="text-xs font-mono text-redact-text-dim animate-pulse my-4">Preparing…</p>
        )}
        {error && (
          <div className="bg-redact-accent/10 border border-redact-accent/30 rounded p-3 mb-4">
            <p className="text-xs font-mono text-redact-accent">{error}</p>
          </div>
        )}
        {totalBoxes === 0 && !burning && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 mb-4">
            <p className="text-xs font-mono text-yellow-400">
              No redactions drawn. Output will be rasterized but otherwise unchanged.
            </p>
          </div>
        )}
        {!burning && (
          <button onClick={handleExport}
            className="w-full py-3 bg-redact-accent hover:bg-redact-accent-dim text-white
              font-mono font-bold text-sm rounded-lg transition-colors tracking-wide">
            BURN & DOWNLOAD
          </button>
        )}
      </div>
    </div>
  );
}
