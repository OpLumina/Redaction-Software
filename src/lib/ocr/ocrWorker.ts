'use client';

import { createWorker, Worker } from 'tesseract.js';
import { OcrPageResult, OcrWord } from '@/types/ocr';

let worker: Worker | null = null;

async function getWorker(): Promise<Worker> {
  if (worker) return worker;
  worker = await createWorker('eng', 1, {
    workerPath: '/workers/tesseract.worker.min.js',
    logger: () => {},
  });
  return worker;
}

export async function recognizePage(
  canvas: HTMLCanvasElement,
  onProgress?: (p: number) => void
): Promise<OcrPageResult> {
  const w = await getWorker();
  const result = await w.recognize(canvas, {}, { text: true, blocks: true, hocr: false, tsv: false });
  const words: OcrWord[] = [];

  for (const block of result.data.blocks ?? []) {
    for (const para of block.paragraphs ?? []) {
      for (const line of para.lines ?? []) {
        for (const word of line.words ?? []) {
          if (word.text.trim()) {
            words.push({
              text: word.text.trim(),
              bbox: { x0: word.bbox.x0, y0: word.bbox.y0, x1: word.bbox.x1, y1: word.bbox.y1 },
              confidence: word.confidence,
            });
          }
        }
      }
    }
  }

  onProgress?.(1);

  // imageWidth/imageHeight must be the ACTUAL pixel dimensions of the canvas
  // that was passed to Tesseract — this is what coordinateNormalizer divides by.
  return {
    pageIndex: 0,
    words,
    imageWidth:  canvas.width,
    imageHeight: canvas.height,
  };
}

export async function terminateWorker() {
  if (worker) { await worker.terminate(); worker = null; }
}
