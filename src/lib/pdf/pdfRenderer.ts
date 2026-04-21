'use client';

import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface RenderedPage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  scale: number;
  sourceWidth: number;
  sourceHeight: number;
}

export async function renderPage(
  pdf: PDFDocumentProxy,
  pageIndex: number,
  containerWidth: number
): Promise<RenderedPage> {
  const page = await pdf.getPage(pageIndex + 1);
  const natural = page.getViewport({ scale: 1 });
  const scale = containerWidth / natural.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width  = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;

  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
    scale,
    sourceWidth: natural.width,
    sourceHeight: natural.height,
  };
}

// FIX #3: Cap the DPI to prevent canvas sizes exceeding browser limits
// on very large documents. 300 DPI is fine; 600 DPI on an A3 page can
// produce a 14000x20000px canvas which toBlob cannot handle.
const MAX_EXPORT_PX = 4000; // max width or height for export canvas

export async function renderPageHighRes(
  pdf: PDFDocumentProxy,
  pageIndex: number,
  dpi = 300
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageIndex + 1);
  const natural = page.getViewport({ scale: 1 });

  // Calculate scale for requested DPI, then clamp if it exceeds MAX_EXPORT_PX
  let scale = dpi / 72;
  const projectedW = natural.width  * scale;
  const projectedH = natural.height * scale;
  if (projectedW > MAX_EXPORT_PX || projectedH > MAX_EXPORT_PX) {
    scale = Math.min(MAX_EXPORT_PX / natural.width, MAX_EXPORT_PX / natural.height);
  }

  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width  = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
  return canvas;
}
