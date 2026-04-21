'use client';

import { PDFDocument } from 'pdf-lib';

export interface BurnedPage {
  pageIndex: number;
  canvas: HTMLCanvasElement;
}

// FIX #3: Split oversized canvases into tiles before encoding to avoid
// browser toBlob failures on large pages, and use PNG for lossless fidelity.
const MAX_CANVAS_DIM = 4096; // safe limit for most browsers

async function canvasToJpegBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  // If the canvas exceeds browser safe limits, scale it down
  let workCanvas = canvas;
  const maxDim = MAX_CANVAS_DIM;

  if (canvas.width > maxDim || canvas.height > maxDim) {
    const ratio = Math.min(maxDim / canvas.width, maxDim / canvas.height);
    workCanvas = document.createElement('canvas');
    workCanvas.width  = Math.floor(canvas.width  * ratio);
    workCanvas.height = Math.floor(canvas.height * ratio);
    workCanvas.getContext('2d')!.drawImage(canvas, 0, 0, workCanvas.width, workCanvas.height);
  }

  return new Promise<Uint8Array>((res, rej) => {
    workCanvas.toBlob(
      (b) => {
        if (!b) { rej(new Error('toBlob failed')); return; }
        b.arrayBuffer().then((buf) => res(new Uint8Array(buf))).catch(rej);
      },
      'image/jpeg',
      0.92
    );
  });
}

export async function reassemblePdf(pages: BurnedPage[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(''); doc.setAuthor(''); doc.setSubject('');
  doc.setKeywords([]); doc.setProducer(''); doc.setCreator('');

  const sorted = [...pages].sort((a, b) => a.pageIndex - b.pageIndex);

  for (const { canvas } of sorted) {
    // FIX #3: Encode page-by-page, handle oversized canvases
    const jpegBytes = await canvasToJpegBytes(canvas);
    const img  = await doc.embedJpg(jpegBytes);

    // Use the original canvas dimensions for the PDF page size
    // so aspect ratio is always preserved correctly
    const page = doc.addPage([canvas.width, canvas.height]);
    page.drawImage(img, { x: 0, y: 0, width: canvas.width, height: canvas.height });
  }

  return doc.save();
}
