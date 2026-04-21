'use client';

import { QueuedFile } from '@/types/document';
import { useDocumentStore } from '@/store/documentStore';
import { useRedactionStore } from '@/store/redactionStore';

const EXT_ICON: Record<string, string> = {
  pdf:'PDF',docx:'DOC',xlsx:'XLS',pptx:'PPT',odt:'ODT',
  ods:'ODS',odp:'ODP',rtf:'RTF',csv:'CSV',png:'PNG',
  jpg:'JPG',jpeg:'JPG',gif:'GIF',webp:'WBP',bmp:'BMP',
  tiff:'TIF',tif:'TIF',svg:'SVG',avif:'AVI',txt:'TXT',
  md:'MD',html:'HTM',json:'JSN',xml:'XML',
};

const STATUS_DOT: Record<QueuedFile['status'], string> = {
  pending:    'bg-redact-muted',
  converting: 'bg-yellow-400 animate-pulse',
  loading:    'bg-yellow-500 animate-pulse',
  ready:      'bg-green-500',
  exporting:  'bg-blue-500 animate-pulse',
  done:       'bg-green-600',
  error:      'bg-redact-accent',
};

function fmt(b: number) {
  if (b < 1024) return `${b}B`;
  if (b < 1048576) return `${(b/1024).toFixed(0)}KB`;
  return `${(b/1048576).toFixed(1)}MB`;
}

export default function FileQueueItem({ file }: { file: QueuedFile }) {
  const activeFileId  = useDocumentStore((s) => s.activeFileId);
  const setActiveFile = useDocumentStore((s) => s.setActiveFile);
  const removeFile    = useDocumentStore((s) => s.removeFile);
  const removeFileSession = useRedactionStore((s) => s.removeFileSession);
  const isActive      = activeFileId === file.id;

  return (
    <div
      onClick={() => setActiveFile(file.id)}
      className={`group flex items-center gap-2 px-3 py-2 rounded cursor-pointer
        transition-colors text-sm
        ${isActive
          ? 'bg-redact-accent/20 text-redact-text'
          : 'hover:bg-redact-surface text-redact-text-dim hover:text-redact-text'}`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[file.status]}`} />
      <span className="flex-shrink-0 text-[9px] font-mono font-bold text-redact-muted
        bg-redact-bg px-1 py-0.5 rounded w-7 text-center tracking-wide">
        {EXT_ICON[file.format] ?? file.format.toUpperCase().slice(0,3)}
      </span>
      <span className="flex-1 truncate font-mono text-xs">{file.name}</span>
      <span className="text-xs text-redact-muted flex-shrink-0">{fmt(file.size)}</span>
      <button
        onClick={(e) => { e.stopPropagation(); removeFileSession(file.id); removeFile(file.id); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity
          text-redact-muted hover:text-redact-accent"
      >×</button>
    </div>
  );
}
