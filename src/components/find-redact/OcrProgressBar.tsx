'use client';

import { useOcrStore } from '@/store/ocrStore';

export default function OcrProgressBar({ fileId }: { fileId: string }) {
  const jobs = useOcrStore((s) => s.jobs.filter((j) => j.fileId === fileId));
  if (!jobs.length) return null;

  const done  = jobs.filter((j) => j.status === 'done').length;
  const error = jobs.filter((j) => j.status === 'error').length;
  const pct   = Math.round((done / jobs.length) * 100);
  const allDone = done + error === jobs.length;

  if (allDone) return null;  // hide bar once finished

  return (
    <div className="px-3 py-2">
      <div className="flex justify-between text-xs text-redact-text-dim mb-1 font-mono">
        <span>OCR scanning…</span>
        <span>{done}/{jobs.length} pages</span>
      </div>
      <div className="h-1 bg-redact-border rounded overflow-hidden">
        <div className="h-full bg-redact-accent transition-all duration-300"
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
