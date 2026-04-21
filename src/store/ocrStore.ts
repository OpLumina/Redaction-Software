import { create } from 'zustand';
import { OcrJob, OcrPageResult, OcrJobStatus } from '@/types/ocr';
import { loadOcrResult } from '@/lib/storage/indexedDbStore';

interface OcrState {
  jobs: OcrJob[];
  isRunning: boolean;
  // In-memory cache for the active page only (avoids re-IDB round trips for search)
  resultCache: { [key: string]: OcrPageResult };
  enqueuePages: (fileId: string, pageIndices: number[]) => void;
  updateJob: (fileId: string, pageIndex: number, patch: Partial<OcrJob>) => void;
  // setResult no longer stores in Zustand - caller writes to IDB directly
  cacheResult: (fileId: string, result: OcrPageResult) => void;
  cancelAll: () => void;
  // Load from IDB on demand; returns null if not yet processed
  getResult: (fileId: string, pageIndex: number) => Promise<OcrPageResult | null>;
  getCachedResult: (fileId: string, pageIndex: number) => OcrPageResult | null;
  getPendingJobs: () => OcrJob[];
  // For search: load all done pages from IDB for a file
  getAllResults: (fileId: string) => Promise<OcrPageResult[]>;
}

export const useOcrStore = create<OcrState>((set, get) => ({
  jobs: [],
  isRunning: false,
  resultCache: {},

  enqueuePages: (fileId, pageIndices) =>
    set((s) => {
      const existing = new Set(s.jobs.map((j) => `${j.fileId}-${j.pageIndex}`));
      const newJobs: OcrJob[] = pageIndices
        .filter((i) => !existing.has(`${fileId}-${i}`))
        .map((i) => ({ fileId, pageIndex: i, status: 'queued' as OcrJobStatus, progress: 0 }));
      return { jobs: [...s.jobs, ...newJobs], isRunning: newJobs.length > 0 };
    }),

  updateJob: (fileId, pageIndex, patch) =>
    set((s) => {
      const jobs = s.jobs.map((j) =>
        j.fileId === fileId && j.pageIndex === pageIndex ? { ...j, ...patch } : j
      );
      const isRunning = jobs.some((j) => j.status === 'queued' || j.status === 'processing');
      return { jobs, isRunning };
    }),

  cacheResult: (fileId, result) =>
    set((s) => ({
      resultCache: { ...s.resultCache, [`${fileId}-${result.pageIndex}`]: result },
    })),

  cancelAll: () => set({ jobs: [], isRunning: false }),

  getResult: async (fileId, pageIndex) => {
    const key = `${fileId}-${pageIndex}`;
    const cached = get().resultCache[key];
    if (cached) return cached;
    return loadOcrResult<OcrPageResult>(key);
  },

  getCachedResult: (fileId, pageIndex) =>
    get().resultCache[`${fileId}-${pageIndex}`] ?? null,

  getPendingJobs: () =>
    get().jobs.filter((j) => j.status === 'queued' || j.status === 'processing'),

  getAllResults: async (fileId) => {
    const done = get().jobs.filter((j) => j.fileId === fileId && j.status === 'done');
    const results: OcrPageResult[] = [];
    for (const job of done) {
      const r = await loadOcrResult<OcrPageResult>(`${fileId}-${job.pageIndex}`);
      if (r) results.push(r);
    }
    return results;
  },
}));
