'use client';

export default function ExportProgress({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-redact-text-dim mb-2 font-mono">
        <span>Burning page {current} of {total}…</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-redact-border rounded overflow-hidden">
        <div className="h-full bg-redact-accent transition-all duration-200"
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
