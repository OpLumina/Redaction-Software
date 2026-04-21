'use client';

import DropZone  from './DropZone';
import FileQueue from './FileQueue';

export default function FilePanel() {
  return (
    <aside className="w-64 flex-shrink-0 bg-redact-surface border-r border-redact-border
      flex flex-col p-3 gap-3 overflow-hidden">
      <div className="flex items-center gap-2 pb-2 border-b border-redact-border">
        <span className="text-redact-accent font-mono font-bold text-sm tracking-widest">
          REDACT
        </span>
      </div>
      <DropZone />
      <FileQueue />
    </aside>
  );
}
