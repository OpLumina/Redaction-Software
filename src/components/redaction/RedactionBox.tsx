'use client';

import { RedactionBox as RBox } from '@/types/redaction';
import { useRedactionStore } from '@/store/redactionStore';

export default function RedactionBox({ box }: { box: RBox }) {
  const mode            = useRedactionStore((s) => s.mode);
  const removeBox       = useRedactionStore((s) => s.removeBox);
  const selectedBoxId   = useRedactionStore((s) => s.selectedBoxId);
  const selectBox       = useRedactionStore((s) => s.selectBox);
  const applyToAllPages = useRedactionStore((s) => s.applyToAllPages);
  const allPagesMode    = useRedactionStore((s) => s.allPagesMode);
  // Read from redactionStore — the toolbar keeps this synced via setPageCountMirror,
  // so it's always correct. documentStore.pageCount resets to 0 on file switch
  // which caused the button to disappear.
  const pageCount       = useRedactionStore((s) => s.pageCount);
  const isSelected      = selectedBoxId === box.id;
  const showSelectionControls = mode === 'select' && isSelected;

  const handleApplyAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pageCount > 1) applyToAllPages(box.id, pageCount);
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (mode === 'erase') {
          removeBox(box.pageIndex, box.id);
          return;
        }
        if (mode === 'select') selectBox(isSelected ? null : box.id);
      }}
      style={{
        position: 'absolute',
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
        background: '#000',
        border: isSelected ? '2px solid #ff3b3b' : '1px solid rgba(255,59,59,0.3)',
        cursor: mode === 'select' || mode === 'erase' ? 'pointer' : 'default',
        zIndex: 10,
        boxSizing: 'border-box',
      }}
    >
      {showSelectionControls && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); removeBox(box.pageIndex, box.id); }}
            title="Remove"
            style={{
              position: 'absolute', top: -10, right: -10,
              width: 20, height: 20, background: '#ff3b3b',
              color: '#fff', border: 'none', borderRadius: '50%',
              fontSize: 12, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 20,
            }}
          >×</button>

          {pageCount > 1 && !allPagesMode && (
            <button
              onClick={handleApplyAll}
              title="Apply this redaction to every page"
              style={{
                position: 'absolute', bottom: -22, left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                fontSize: 9, fontFamily: 'monospace',
                padding: '2px 6px',
                background: '#ff3b3b', color: '#fff',
                border: 'none', borderRadius: 3,
                cursor: 'pointer', zIndex: 20,
              }}
            >
              Apply to all {pageCount} pages
            </button>
          )}
        </>
      )}
    </div>
  );
}
