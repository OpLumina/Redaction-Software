import { create } from 'zustand';
import { QueuedFile, ViewerScale } from '@/types/document';

interface DocumentState {
  files: QueuedFile[];
  activeFileId: string | null;
  activePage: number;
  pageCount: number;
  viewerScale: ViewerScale | null;
  // FIX #2: scroll-to-page signal — set to trigger scroll, consumer resets to null
  scrollToPage: number | null;
  addFiles: (files: QueuedFile[]) => void;
  removeFile: (id: string) => void;
  updateFile: (id: string, patch: Partial<QueuedFile>) => void;
  setActiveFile: (id: string) => void;
  setActivePage: (page: number) => void;
  setPageCount: (n: number) => void;
  setViewerScale: (scale: ViewerScale) => void;
  requestScrollToPage: (page: number) => void;
  clearScrollRequest: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  files: [],
  activeFileId: null,
  activePage: 0,
  pageCount: 0,
  viewerScale: null,
  scrollToPage: null,

  addFiles: (newFiles) =>
    set((s) => ({
      files: [...s.files, ...newFiles],
      activeFileId: s.activeFileId ?? newFiles[0]?.id ?? null,
    })),

  removeFile: (id) =>
    set((s) => {
      const remaining = s.files.filter((f) => f.id !== id);
      return {
        files: remaining,
        activeFileId: s.activeFileId === id ? (remaining[0]?.id ?? null) : s.activeFileId,
        pageCount: s.activeFileId === id ? 0 : s.pageCount,
      };
    }),

  updateFile: (id, patch) =>
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    })),

  setActiveFile: (id) => set({ activeFileId: id, activePage: 0, pageCount: 0, scrollToPage: null }),
  setActivePage: (page) => set({ activePage: page }),
  setPageCount: (n) => set({ pageCount: n }),
  setViewerScale: (scale) => set({ viewerScale: scale }),
  requestScrollToPage: (page) => set({ scrollToPage: page }),
  clearScrollRequest: () => set({ scrollToPage: null }),
}));
