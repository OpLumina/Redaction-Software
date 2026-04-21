'use client';

import { RedactionBox } from '@/types/redaction';
import { burnPage, cloneCanvas, canvasToBlob } from '@/lib/burn/burnPage';

export async function loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

export async function burnImageFile(file: File, boxes: RedactionBox[]): Promise<Blob> {
  const canvas = await loadImageToCanvas(file);
  const clone  = cloneCanvas(canvas);

  // Boxes are stored as percentages (0-100). Convert to absolute pixels on the
  // full-resolution source canvas before burning.
  const pixelBoxes = boxes.map((b) => ({
    ...b,
    x:      (b.x      / 100) * clone.width,
    y:      (b.y      / 100) * clone.height,
    width:  (b.width  / 100) * clone.width,
    height: (b.height / 100) * clone.height,
  }));

  burnPage({ canvas: clone, boxes: pixelBoxes });
  const mime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  return canvasToBlob(clone, mime, 0.95);
}
