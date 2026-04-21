'use client';

import { useCallback, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { QueuedFile, detectFileType, ALL_ACCEPTED } from '@/types/document';

export default function DropZone() {
  const addFiles = useDocumentStore((s) => s.addFiles);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback((raw: FileList | File[]) => {
    const queued: QueuedFile[] = Array.from(raw)
      .filter((f) => detectFileType(f) !== null)
      .map((f) => ({
        id:     crypto.randomUUID(),
        name:   f.name,
        type:   detectFileType(f)!,
        format: f.name.split('.').pop()?.toLowerCase() ?? '',
        size:   f.size,
        file:   f,
        status: 'pending' as const,
      }));
    if (queued.length) addFiles(queued);
  }, [addFiles]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => document.getElementById('file-input')?.click()}
      className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed
        rounded-lg p-5 cursor-pointer transition-colors
        ${dragging
          ? 'border-redact-accent bg-redact-accent/10'
          : 'border-redact-border hover:border-redact-muted'}`}
    >
      <input
        id="file-input" type="file" multiple className="hidden"
        accept={ALL_ACCEPTED.map((e) => `.${e}`).join(',')}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5" className="text-redact-muted">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <div className="text-center">
        <p className="text-sm text-redact-text">Drop files here</p>
        <p className="text-xs text-redact-muted mt-1 leading-relaxed">
          PDF · DOCX · XLSX · PPTX · ODT<br/>
          PNG · JPG · TIFF · WEBP · SVG<br/>
          TXT · MD · HTML · JSON · XML
        </p>
      </div>
    </div>
  );
}
