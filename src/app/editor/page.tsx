'use client';

import { useEffect, useState } from 'react';
import FilePanel       from '@/components/file-panel/FilePanel';
import DocumentViewer  from '@/components/viewer/DocumentViewer';
import RedactionToolbar from '@/components/redaction/RedactionToolbar';
import FindRedactPanel from '@/components/find-redact/FindRedactPanel';
import ExportModal     from '@/components/export/ExportModal';
import { useDocumentStore }  from '@/store/documentStore';
import { useRedactionStore } from '@/store/redactionStore';

export default function EditorPage() {
  const [showExport, setShowExport] = useState(false);
  const activeFileId = useDocumentStore((s) => s.activeFileId);
  const mode         = useRedactionStore((s) => s.mode);
  const totalBoxes   = useRedactionStore((s) => Object.values(s.boxes).flat().length);
  const switchRedactionFile = useRedactionStore((s) => s.switchFile);

  useEffect(() => {
    switchRedactionFile(activeFileId);
  }, [activeFileId, switchRedactionFile]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        useRedactionStore.getState().undo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        useRedactionStore.getState().redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'e' && activeFileId) {
        e.preventDefault();
        setShowExport(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeFileId]);

  return (
    <div className="flex h-full overflow-hidden bg-redact-bg">
      <FilePanel />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <RedactionToolbar />

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <DocumentViewer />
        </div>

        {mode === 'find' && <FindRedactPanel />}

        <div className="flex items-center justify-between px-4 py-1.5 bg-redact-surface
          border-t border-redact-border text-xs font-mono text-redact-text-dim flex-shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Local only — no data leaves this machine
          </span>
          <div className="flex items-center gap-4">
            {totalBoxes > 0 && (
              <span className="text-redact-accent">
                {totalBoxes} redaction{totalBoxes !== 1 ? 's' : ''}
              </span>
            )}
            {activeFileId && (
              <button
                onClick={() => setShowExport(true)}
                className="px-3 py-1 bg-redact-accent hover:bg-redact-accent-dim
                  text-white rounded text-xs font-bold tracking-wide transition-colors"
              >
                Export ⌘E
              </button>
            )}
          </div>
        </div>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  );
}
