'use client';

import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { convertFile, ConversionResult } from '@/lib/converters';
import PdfViewer   from './PdfViewer';
import ImageViewer from './ImageViewer';
import SvgViewer   from './SvgViewer';

export default function DocumentViewer() {
  const files        = useDocumentStore((s) => s.files);
  const activeFileId = useDocumentStore((s) => s.activeFileId);
  const updateFile   = useDocumentStore((s) => s.updateFile);
  const activeFile   = files.find((f) => f.id === activeFileId);

  const [result,  setResult]  = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!activeFile) { setResult(null); return; }

    if (activeFile.convertedPdfBlob) {
      setResult({ kind: 'pdf', blob: activeFile.convertedPdfBlob });
      return;
    }
    if (activeFile.format === 'pdf') {
      setResult({ kind: 'none' });
      return;
    }

    setLoading(true);
    setError(null);
    updateFile(activeFile.id, { status: 'converting' });

    convertFile(activeFile)
      .then((res) => {
        if (res.kind === 'pdf') {
          updateFile(activeFile.id, { convertedPdfBlob: res.blob, status: 'loading' });
        }
        setResult(res);
      })
      .catch((e) => {
        setError(e.message);
        updateFile(activeFile.id, { status: 'error', errorMessage: e.message });
      })
      .finally(() => setLoading(false));
  }, [activeFile?.id]); // eslint-disable-line

  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-redact-bg">
        <p className="font-mono text-redact-text-dim text-sm">No file selected</p>
        <p className="font-mono text-redact-muted text-xs">
          Drop a PDF, image, Word doc, spreadsheet, or text file into the sidebar
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-redact-bg">
        <span className="text-xs font-mono text-redact-text-dim animate-pulse">
          {activeFile.status === 'converting'
            ? `Converting ${activeFile.format.toUpperCase()}…`
            : 'Loading…'}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-redact-bg">
        <p className="text-xs font-mono text-redact-accent">Conversion failed</p>
        <p className="text-xs font-mono text-redact-muted max-w-sm text-center">{error}</p>
      </div>
    );
  }

  if (!result) return null;

  if (result.kind === 'none') {
    return <PdfViewer key={activeFile.id} file={activeFile.file} fileId={activeFile.id} />;
  }
  if (result.kind === 'pdf') {
    return <PdfViewer key={activeFile.id}
      file={new File([result.blob], activeFile.name, { type: 'application/pdf' })}
      fileId={activeFile.id} />;
  }
  if (result.kind === 'svg') {
    return <SvgViewer key={activeFile.id} file={result.file} fileId={activeFile.id} />;
  }
  return <ImageViewer key={activeFile.id} file={result.file} fileId={activeFile.id} />;
}
