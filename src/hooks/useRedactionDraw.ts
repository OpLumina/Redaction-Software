'use client';

import { useRef, useCallback } from 'react';
import { useRedactionStore } from '@/store/redactionStore';
import { RedactionBox } from '@/types/redaction';

export function useRedactionDraw(
  pageIndex: number,
  containerRef: React.RefObject<HTMLDivElement>
) {
  const mode   = useRedactionStore((s) => s.mode);
  const addBox = useRedactionStore((s) => s.addBox);

  const drawing    = useRef(false);
  const committed  = useRef(false);   // guard: ensure addBox fires at most once per drag
  const startPos   = useRef({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement | null>(null);

  const getPos = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    return {
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    };
  }, [containerRef]);

  const getPxPos = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, [containerRef]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (mode !== 'draw') return;
    e.preventDefault();
    drawing.current   = true;
    committed.current = false;   // reset on each new drag
    startPos.current  = getPos(e);

    if (containerRef.current) {
      const pxStart = getPxPos(e);
      const el = document.createElement('div');
      el.style.cssText = `position:absolute;background:rgba(0,0,0,0.55);
        border:2px solid #ff3b3b;pointer-events:none;z-index:50;
        left:${pxStart.x}px;top:${pxStart.y}px;width:0;height:0;`;
      containerRef.current.appendChild(el);
      previewRef.current = el;
    }
  }, [mode, getPos, getPxPos, containerRef]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drawing.current || !previewRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startPctX = startPos.current.x / 100 * rect.width;
    const startPctY = startPos.current.y / 100 * rect.height;
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    const x = Math.min(curX, startPctX);
    const y = Math.min(curY, startPctY);
    const w = Math.abs(curX - startPctX);
    const h = Math.abs(curY - startPctY);
    Object.assign(previewRef.current.style, {
      left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`,
    });
  }, [containerRef]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!drawing.current) return;
    // Guard: if addBox was already called for this drag, bail out
    if (committed.current) {
      drawing.current = false;
      previewRef.current?.remove();
      previewRef.current = null;
      return;
    }

    drawing.current   = false;
    committed.current = true;
    previewRef.current?.remove();
    previewRef.current = null;

    const pos = getPos(e);
    const x = Math.min(pos.x, startPos.current.x);
    const y = Math.min(pos.y, startPos.current.y);
    const w = Math.abs(pos.x - startPos.current.x);
    const h = Math.abs(pos.y - startPos.current.y);

    if (w < 0.5 || h < 0.5) return;

    const box: RedactionBox = {
      id: crypto.randomUUID(),
      pageIndex,
      x, y, width: w, height: h,
      source: 'manual',
    };
    addBox(box);
  }, [getPos, pageIndex, addBox]);

  return { onPointerDown, onPointerMove, onPointerUp };
}
