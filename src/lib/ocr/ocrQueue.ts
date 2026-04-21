'use client';

import { recognizePage } from './ocrWorker';
import { useOcrStore }   from '@/store/ocrStore';
import { saveOcrResult } from '@/lib/storage/indexedDbStore';
import { OcrPageResult } from '@/types/ocr';

const BATCH_SIZE = 4;   // pages processed concurrently
let cancelFlag   = false;

export async function runOcrQueue(
  fileId: string,
  pages: Array<{ pageIndex: number; canvas: HTMLCanvasElement }>
): Promise<void> {
  cancelFlag = false;
  const store = useOcrStore.getState();
  store.enqueuePages(fileId, pages.map((p) => p.pageIndex));

  // Process in sliding windows of BATCH_SIZE
  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    if (cancelFlag) break;

    const batch = pages.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async ({ pageIndex, canvas }) => {
      if (cancelFlag) return;
      store.updateJob(fileId, pageIndex, { status: 'processing', progress: 0 });

      try {
        // FIX #4: Clone the canvas before passing to Tesseract so we never
        // zero out the original canvas that the viewer may still be displaying.
        const ocrCanvas = document.createElement('canvas');
        ocrCanvas.width  = canvas.width;
        ocrCanvas.height = canvas.height;
        ocrCanvas.getContext('2d')!.drawImage(canvas, 0, 0);

        const result: OcrPageResult = await recognizePage(ocrCanvas, (p) =>
          store.updateJob(fileId, pageIndex, { progress: p })
        );
        result.pageIndex = pageIndex;

        // Persist to IndexedDB — do NOT keep full result in Zustand
        await saveOcrResult(`${fileId}-${pageIndex}`, result);

        // Keep a small in-memory cache entry (words array only, for instant search)
        store.cacheResult(fileId, result);
        store.updateJob(fileId, pageIndex, { status: 'done', progress: 1 });

        // Release only the OCR clone, not the original viewer canvas
        ocrCanvas.width  = 0;
        ocrCanvas.height = 0;
      } catch (err) {
        store.updateJob(fileId, pageIndex, { status: 'error', progress: 0 });
        console.error(`OCR failed on page ${pageIndex}:`, err);
      }
    }));
  }
}

export function cancelOcr() {
  cancelFlag = true;
  useOcrStore.getState().cancelAll();
}
