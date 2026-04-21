'use client';

import type { PDFDocumentProxy } from 'pdfjs-dist';

let pdfjs: typeof import('pdfjs-dist') | null = null;

export async function getPdfjs() {
  if (pdfjs) return pdfjs;
  pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.js';
  return pdfjs;
}

export async function loadPdf(file: File): Promise<PDFDocumentProxy> {
  const lib = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  return lib.getDocument({ data: arrayBuffer }).promise;
}
