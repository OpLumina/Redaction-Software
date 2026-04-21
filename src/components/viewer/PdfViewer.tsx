'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { loadPdf }           from '@/lib/pdf/pdfLoader';
import { renderPage }        from '@/lib/pdf/pdfRenderer';
import { useDocumentStore }  from '@/store/documentStore';
import { runOcrQueue, cancelOcr } from '@/lib/ocr/ocrQueue';
import ViewerToolbar from './ViewerToolbar';
import PdfPage       from './PdfPage';

interface Props { file: File; fileId: string; }

const PLACEHOLDER_HEIGHT = 400;
const OVERSCAN_PX = 1200;

export default function PdfViewer({ file, fileId }: Props) {
  const [pdf,            setPdf]            = useState<PDFDocumentProxy | null>(null);
  const [pageCount,      setPageCountLocal] = useState(0);
  const [scale,          setScale]          = useState(1);
  const [containerWidth, setContainerWidth] = useState(800);
  const [visiblePages,   setVisiblePages]   = useState<Set<number>>(new Set([0]));
  const pageHeights   = useRef<Map<number, number>>(new Map());
  const containerRef  = useRef<HTMLDivElement>(null);
  const ocrStartedRef = useRef(false);

  const updateFile          = useDocumentStore((s) => s.updateFile);
  const setPageCount        = useDocumentStore((s) => s.setPageCount);
  // FIX #2: consume scroll-to-page signal
  const scrollToPage        = useDocumentStore((s) => s.scrollToPage);
  const clearScrollRequest  = useDocumentStore((s) => s.clearScrollRequest);

  // ── Container width ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerWidth(w - 48);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Load PDF ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    ocrStartedRef.current = false;
    updateFile(fileId, { status: 'loading' });
    loadPdf(file)
      .then((doc) => {
        if (cancelled) return;
        setPdf(doc);
        setPageCountLocal(doc.numPages);
        setPageCount(doc.numPages);
        updateFile(fileId, { status: 'ready', pageCount: doc.numPages });
      })
      .catch((e) => updateFile(fileId, { status: 'error', errorMessage: e.message }));
    return () => {
      cancelled = true;
      cancelOcr();
    };
  }, [file, fileId, updateFile, setPageCount]);

  // ── Background OCR ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pdf || ocrStartedRef.current) return;
    ocrStartedRef.current = true;

    (async () => {
      const pages: Array<{ pageIndex: number; canvas: HTMLCanvasElement }> = [];
      for (let i = 0; i < pdf.numPages; i++) {
        const r = await renderPage(pdf, i, 1200);
        pages.push({ pageIndex: i, canvas: r.canvas });
      }
      await runOcrQueue(fileId, pages);
    })();
  }, [pdf, fileId]);

  // ── Viewport-based visibility ─────────────────────────────────────────────
  const recalcVisible = useCallback(() => {
    const el = containerRef.current;
    if (!el || pageCount === 0) return;

    const scrollTop    = el.scrollTop;
    const viewportH    = el.clientHeight;
    const topEdge      = scrollTop - OVERSCAN_PX;
    const bottomEdge   = scrollTop + viewportH + OVERSCAN_PX;

    const next = new Set<number>();
    let cumulative = 0;
    for (let i = 0; i < pageCount; i++) {
      const h = (pageHeights.current.get(i) ?? PLACEHOLDER_HEIGHT) + 24;
      const pageTop    = cumulative;
      const pageBottom = cumulative + h;
      if (pageBottom >= topEdge && pageTop <= bottomEdge) next.add(i);
      cumulative = pageBottom;
      if (pageTop > bottomEdge) break;
    }
    setVisiblePages(next);
  }, [pageCount]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', recalcVisible, { passive: true });
    recalcVisible();
    return () => el.removeEventListener('scroll', recalcVisible);
  }, [recalcVisible]);

  const onPageRendered = useCallback((pageIndex: number, height: number) => {
    pageHeights.current.set(pageIndex, height);
    recalcVisible();
  }, [recalcVisible]);

  // ── FIX #2: Scroll to page when requested ────────────────────────────────
  useEffect(() => {
    if (scrollToPage === null || !containerRef.current || pageCount === 0) return;
    const el = containerRef.current;
    let offset = 0;
    for (let i = 0; i < scrollToPage && i < pageCount; i++) {
      offset += (pageHeights.current.get(i) ?? PLACEHOLDER_HEIGHT) + 24;
    }
    el.scrollTo({ top: offset, behavior: 'smooth' });
    clearScrollRequest();
  }, [scrollToPage, pageCount, clearScrollRequest]);

  if (!pdf) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-xs font-mono text-redact-text-dim animate-pulse">Loading PDF…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ViewerToolbar scale={scale} onScaleChange={setScale} pageCount={pageCount} />
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-4 bg-redact-bg"
      >
        {Array.from({ length: pageCount }, (_, i) =>
          visiblePages.has(i) ? (
            <PdfPage
              key={i}
              pdf={pdf}
              pageIndex={i}
              containerWidth={containerWidth}
              scale={scale}
              isActive={i === 0}
              onRendered={onPageRendered}
            />
          ) : (
            <div
              key={i}
              className="mx-auto bg-gray-200 mb-6 shadow-lg"
              style={{
                width: containerWidth,
                height: pageHeights.current.get(i) ?? PLACEHOLDER_HEIGHT,
              }}
            />
          )
        )}
      </div>
    </div>
  );
}
