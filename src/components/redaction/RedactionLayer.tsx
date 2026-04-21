'use client';

import { useRef } from 'react';
import { useRedactionStore } from '@/store/redactionStore';
import { useRedactionDraw }  from '@/hooks/useRedactionDraw';
import RedactionBox from './RedactionBox';

interface Props { pageIndex: number; width: number; height: number; }

export default function RedactionLayer({ pageIndex, width, height }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boxes        = useRedactionStore((s) => s.boxes[pageIndex] ?? []);
  const mode         = useRedactionStore((s) => s.mode);
  const selectBox    = useRedactionStore((s) => s.selectBox);

  const { onPointerDown, onPointerMove, onPointerUp } =
    useRedactionDraw(pageIndex, containerRef);

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={() => selectBox(null)}
      style={{
        position: 'absolute', inset: 0, width, height,
        cursor: mode === 'draw' ? 'crosshair' : mode === 'erase' ? 'not-allowed' : 'default',
        userSelect: 'none',
      }}
    >
      {boxes.map((box) => <RedactionBox key={box.id} box={box} />)}
    </div>
  );
}
