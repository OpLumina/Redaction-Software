'use client';

import { RedactionBox } from '@/types/redaction';

export interface BurnPageOptions {
  canvas: HTMLCanvasElement;
  boxes: RedactionBox[];
  fillColor?: string;
}

export function burnPage({ canvas, boxes, fillColor = '#000000' }: BurnPageOptions): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = fillColor;
  for (const box of boxes) {
    ctx.fillRect(Math.floor(box.x), Math.floor(box.y), Math.ceil(box.width), Math.ceil(box.height));
  }
  return canvas;
}

export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const clone = document.createElement('canvas');
  clone.width  = source.width;
  clone.height = source.height;
  clone.getContext('2d')!.drawImage(source, 0, 0);
  return clone;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality = 1): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      type, quality
    )
  );
}
