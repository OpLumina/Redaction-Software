import { create } from 'zustand';
import { RedactionBox, RedactionMode, PageRedactions } from '@/types/redaction';

interface FileRedactionSession {
  boxes: PageRedactions;
  history: PageRedactions[];
  historyIndex: number;
}

interface RedactionState {
  activeFileId: string | null;
  fileSessions: Record<string, FileRedactionSession>;
  boxes: PageRedactions;
  mode: RedactionMode;
  selectedBoxId: string | null;
  history: PageRedactions[];
  historyIndex: number;
  allPagesMode: boolean;
  pageCount: number;
  switchFile: (fileId: string | null) => void;
  removeFileSession: (fileId: string) => void;
  addBox: (box: RedactionBox) => void;
  removeBox: (pageIndex: number, id: string) => void;
  clearPage: (pageIndex: number) => void;
  clearAll: () => void;
  setMode: (mode: RedactionMode) => void;
  selectBox: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  getPageBoxes: (pageIndex: number) => RedactionBox[];
  applyToAllPages: (boxId: string, pageCount: number) => void;
  setAllPagesMode: (on: boolean) => void;
  setPageCountMirror: (n: number) => void;
}

const EMPTY_SESSION: FileRedactionSession = {
  boxes: {},
  history: [{}],
  historyIndex: 0,
};

const cloneSession = (session: FileRedactionSession): FileRedactionSession => ({
  boxes: session.boxes,
  history: session.history,
  historyIndex: session.historyIndex,
});

const pushHistory = (history: PageRedactions[], idx: number, next: PageRedactions) =>
  [...history.slice(0, idx + 1), next].slice(-50);

const withSessionUpdate = (
  state: RedactionState,
  patch: Partial<Pick<RedactionState, 'boxes' | 'history' | 'historyIndex' | 'selectedBoxId'>>
) => {
  if (!state.activeFileId) return patch;

  const nextBoxes = patch.boxes ?? state.boxes;
  const nextHistory = patch.history ?? state.history;
  const nextHistoryIndex = patch.historyIndex ?? state.historyIndex;

  return {
    ...patch,
    fileSessions: {
      ...state.fileSessions,
      [state.activeFileId]: {
        boxes: nextBoxes,
        history: nextHistory,
        historyIndex: nextHistoryIndex,
      },
    },
  };
};

export const useRedactionStore = create<RedactionState>((set, get) => ({
  activeFileId: null,
  fileSessions: {},
  boxes: {},
  mode: 'draw',
  selectedBoxId: null,
  history: [{}],
  historyIndex: 0,
  allPagesMode: false,
  pageCount: 1,

  switchFile: (fileId) =>
    set((s) => {
      if (!fileId) {
        return {
          activeFileId: null,
          boxes: EMPTY_SESSION.boxes,
          history: EMPTY_SESSION.history,
          historyIndex: EMPTY_SESSION.historyIndex,
          selectedBoxId: null,
          allPagesMode: false,
          pageCount: 1,
        };
      }

      const currentSessions = s.activeFileId
        ? {
            ...s.fileSessions,
            [s.activeFileId]: {
              boxes: s.boxes,
              history: s.history,
              historyIndex: s.historyIndex,
            },
          }
        : s.fileSessions;

      const nextSession = currentSessions[fileId] ?? cloneSession(EMPTY_SESSION);
      return {
        activeFileId: fileId,
        fileSessions: currentSessions,
        boxes: nextSession.boxes,
        history: nextSession.history,
        historyIndex: nextSession.historyIndex,
        selectedBoxId: null,
        allPagesMode: false,
      };
    }),

  removeFileSession: (fileId) =>
    set((s) => {
      const nextSessions = { ...s.fileSessions };
      delete nextSessions[fileId];
      if (s.activeFileId !== fileId) return { fileSessions: nextSessions };

      return {
        activeFileId: null,
        fileSessions: nextSessions,
        boxes: EMPTY_SESSION.boxes,
        history: EMPTY_SESSION.history,
        historyIndex: EMPTY_SESSION.historyIndex,
        selectedBoxId: null,
        allPagesMode: false,
        pageCount: 1,
      };
    }),

  addBox: (box) =>
    set((s) => {
      if (s.allPagesMode && s.pageCount > 1) {
        const next: PageRedactions = { ...s.boxes };
        next[box.pageIndex] = [...(next[box.pageIndex] ?? []), box];
        for (let i = 0; i < s.pageCount; i++) {
          if (i === box.pageIndex) continue;
          const copy: RedactionBox = {
            ...box,
            id: crypto.randomUUID(),
            pageIndex: i,
          };
          next[i] = [...(next[i] ?? []), copy];
        }
        const history = pushHistory(s.history, s.historyIndex, next);
        return withSessionUpdate(s, {
          boxes: next,
          history,
          historyIndex: history.length - 1,
        });
      }

      const next = { ...s.boxes, [box.pageIndex]: [...(s.boxes[box.pageIndex] ?? []), box] };
      const history = pushHistory(s.history, s.historyIndex, next);
      return withSessionUpdate(s, {
        boxes: next,
        history,
        historyIndex: history.length - 1,
      });
    }),

  removeBox: (pageIndex, id) =>
    set((s) => {
      const next = { ...s.boxes, [pageIndex]: (s.boxes[pageIndex] ?? []).filter((b) => b.id !== id) };
      const history = pushHistory(s.history, s.historyIndex, next);
      return withSessionUpdate(s, {
        boxes: next,
        history,
        historyIndex: history.length - 1,
        selectedBoxId: null,
      });
    }),

  clearPage: (pageIndex) =>
    set((s) => {
      const next = { ...s.boxes, [pageIndex]: [] };
      const history = pushHistory(s.history, s.historyIndex, next);
      return withSessionUpdate(s, {
        boxes: next,
        history,
        historyIndex: history.length - 1,
      });
    }),

  clearAll: () =>
    set((s) => {
      const history = pushHistory(s.history, s.historyIndex, {});
      return withSessionUpdate(s, {
        boxes: {},
        history,
        historyIndex: history.length - 1,
      });
    }),

  setMode: (mode) => set({ mode }),
  selectBox: (id) => set({ selectedBoxId: id }),
  setAllPagesMode: (on) => set({ allPagesMode: on }),
  setPageCountMirror: (n) => set({ pageCount: n }),

  undo: () =>
    set((s) => {
      if (s.historyIndex <= 0) return s;
      const idx = s.historyIndex - 1;
      return withSessionUpdate(s, { boxes: s.history[idx], historyIndex: idx, selectedBoxId: null });
    }),

  redo: () =>
    set((s) => {
      if (s.historyIndex >= s.history.length - 1) return s;
      const idx = s.historyIndex + 1;
      return withSessionUpdate(s, { boxes: s.history[idx], historyIndex: idx, selectedBoxId: null });
    }),

  getPageBoxes: (pageIndex) => get().boxes[pageIndex] ?? [],

  applyToAllPages: (boxId, pageCount) =>
    set((s) => {
      let source: RedactionBox | undefined;
      for (const pageBoxes of Object.values(s.boxes)) {
        source = pageBoxes.find((b: RedactionBox) => b.id === boxId);
        if (source) break;
      }
      if (!source || pageCount <= 0) return s;

      const { x, y, width, height, label } = source;
      const next: PageRedactions = { ...s.boxes };

      for (let i = 0; i < pageCount; i++) {
        if (i === source.pageIndex) continue;

        const alreadyPresent = (next[i] ?? []).some(
          (b) =>
            Math.abs(b.x - x) < 0.01 &&
            Math.abs(b.y - y) < 0.01 &&
            Math.abs(b.width - width) < 0.01 &&
            Math.abs(b.height - height) < 0.01
        );
        if (alreadyPresent) continue;

        const newBox: RedactionBox = {
          id: crypto.randomUUID(),
          pageIndex: i,
          x,
          y,
          width,
          height,
          source: 'manual',
          ...(label ? { label } : {}),
        };
        next[i] = [...(next[i] ?? []), newBox];
      }

      const history = pushHistory(s.history, s.historyIndex, next);
      return withSessionUpdate(s, {
        boxes: next,
        history,
        historyIndex: history.length - 1,
      });
    }),
}));
