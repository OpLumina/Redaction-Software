'use client';

import { useEffect, useRef, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { loadImageToCanvas } from '@/lib/image/imageProcessor';
import RedactionLayer from '@/components/redaction/RedactionLayer';

interface Props { file: File; fileId: string; }

export default function ImageViewer({ file, fileId }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const [dims, setDims]   = useState({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);
  const updateFile     = useDocumentStore((s) => s.updateFile);
  const setViewerScale = useDocumentStore((s) => s.setViewerScale);

  useEffect(() => {
    let cancelled = false;
    updateFile(fileId, { status: 'loading' });
    loadImageToCanvas(file).then((canvas) => {
      if (cancelled || !canvasRef.current) return;
      const maxW  = 1000;
      const scale = canvas.width > maxW ? maxW / canvas.width : 1;
      const w = Math.floor(canvas.width  * scale);
      const h = Math.floor(canvas.height * scale);
      canvasRef.current.width  = w;
      canvasRef.current.height = h;
      canvasRef.current.getContext('2d')!.drawImage(canvas, 0, 0, w, h);
      setDims({ width: w, height: h });
      setViewerScale({ scale, canvasWidth: w, canvasHeight: h,
        sourceWidth: canvas.width, sourceHeight: canvas.height });
      updateFile(fileId, { status: 'ready', pageCount: 1 });
      setReady(true);
    }).catch((e) => updateFile(fileId, { status: 'error', errorMessage: e.message }));
    return () => { cancelled = true; };
  }, [file, fileId, updateFile, setViewerScale]);

  return (
    <div className="flex-1 overflow-auto bg-redact-bg flex items-start justify-center p-6">
      <div className="relative" style={{ width: dims.width, height: dims.height }}>
        <canvas ref={canvasRef} style={{ display: 'block' }} />
        {ready && <RedactionLayer pageIndex={0} width={dims.width} height={dims.height} />}
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <span className="text-xs font-mono text-gray-400 animate-pulse">Loading…</span>
          </div>
        )}
      </div>
    </div>
  );
}
