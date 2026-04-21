'use client';

import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { renderPage }        from '@/lib/pdf/pdfRenderer';
import { useDocumentStore }  from '@/store/documentStore';
import RedactionLayer from '@/components/redaction/RedactionLayer';

interface Props {
  pdf: PDFDocumentProxy;
  pageIndex: number;
  containerWidth: number;
  scale: number;
  isActive: boolean;
  onRendered?: (pageIndex: number, height: number) => void;
}

export default function PdfPage({
  pdf, pageIndex, containerWidth, scale, isActive, onRendered,
}: Props) {
  const canvasRef             = useRef<HTMLCanvasElement>(null);
  const [dims, setDims]       = useState({ width: 0, height: 0 });
  const [rendered, setRendered] = useState(false);
  const setViewerScale        = useDocumentStore((s) => s.setViewerScale);

  useEffect(() => {
    let cancelled = false;
    setRendered(false);

    renderPage(pdf, pageIndex, containerWidth * scale).then((result) => {
      if (cancelled || !canvasRef.current) return;
      canvasRef.current.width  = result.width;
      canvasRef.current.height = result.height;
      canvasRef.current.getContext('2d')!.drawImage(result.canvas, 0, 0);
      setDims({ width: result.width, height: result.height });
      // Always update viewerScale so OCR normalisation has the right source dims
      setViewerScale({
        scale: result.scale,
        canvasWidth:  result.width,
        canvasHeight: result.height,
        sourceWidth:  result.sourceWidth,
        sourceHeight: result.sourceHeight,
      });
      setRendered(true);
      onRendered?.(pageIndex, result.height);
    });

    return () => { cancelled = true; };
  }, [pdf, pageIndex, containerWidth, scale, setViewerScale, onRendered]);

  return (
    <div
      className="relative mx-auto bg-white shadow-lg mb-6"
      style={{ width: dims.width || containerWidth, height: dims.height || 400 }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: dims.width, height: dims.height }} />
      {rendered && dims.width > 0 && (
        <RedactionLayer pageIndex={pageIndex} width={dims.width} height={dims.height} />
      )}
      {!rendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-xs font-mono text-gray-400 animate-pulse">Rendering…</span>
        </div>
      )}
    </div>
  );
}
