'use client';

import { saveSession, loadSession, deleteSession } from './indexedDbStore';
import { PageRedactions } from '@/types/redaction';

export interface PersistedSession {
  fileId: string;
  fileName: string;
  boxes: PageRedactions;
  savedAt: number;
}

export const persistSession = (s: PersistedSession) =>
  saveSession(`session-${s.fileId}`, s);

export const restoreSession = (fileId: string) =>
  loadSession<PersistedSession>(`session-${fileId}`);

export const clearSession = (fileId: string) =>
  deleteSession(`session-${fileId}`);
