'use client';

interface Props { scale: number; onScaleChange: (s: number) => void; pageCount: number; }

export default function ViewerToolbar({ scale, onScaleChange, pageCount }: Props) {
  const bump = (d: number) =>
    onScaleChange(Math.min(4, Math.max(0.25, +(scale + d).toFixed(2))));

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-redact-bg border-b
      border-redact-border text-xs font-mono text-redact-text-dim flex-shrink-0">
      <button onClick={() => bump(-0.25)}
        className="hover:text-redact-text transition-colors px-1">−</button>
      <span className="w-12 text-center text-redact-text">{Math.round(scale * 100)}%</span>
      <button onClick={() => bump(0.25)}
        className="hover:text-redact-text transition-colors px-1">+</button>
      <button onClick={() => onScaleChange(1)}
        className="hover:text-redact-text transition-colors px-2">Fit</button>
      {pageCount > 0 && (
        <span className="ml-2 text-redact-text-dim">{pageCount} pages</span>
      )}
    </div>
  );
}
