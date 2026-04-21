'use client';

const DB_NAME    = 'redact-app';
const DB_VERSION = 2;           // bumped: adds ocr-results store
const SESSIONS   = 'sessions';
const OCR_STORE  = 'ocr-results';

function openDb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SESSIONS))
        db.createObjectStore(SESSIONS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(OCR_STORE))
        db.createObjectStore(OCR_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

// ── Generic session helpers ──────────────────────────────────────────────────

export async function saveSession(id: string, data: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(SESSIONS, 'readwrite');
    tx.objectStore(SESSIONS).put({ id, data, savedAt: Date.now() });
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });
}

export async function loadSession<T>(id: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx  = db.transaction(SESSIONS, 'readonly');
    const req = tx.objectStore(SESSIONS).get(id);
    req.onsuccess = () => res(req.result?.data ?? null);
    req.onerror   = () => rej(req.error);
  });
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(SESSIONS, 'readwrite');
    tx.objectStore(SESSIONS).delete(id);
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });
}

// ── OCR result persistence ───────────────────────────────────────────────────
// Key pattern: `${fileId}-${pageIndex}`

export async function saveOcrResult(id: string, data: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(OCR_STORE, 'readwrite');
    tx.objectStore(OCR_STORE).put({ id, data });
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });
}

export async function loadOcrResult<T>(id: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx  = db.transaction(OCR_STORE, 'readonly');
    const req = tx.objectStore(OCR_STORE).get(id);
    req.onsuccess = () => res(req.result?.data ?? null);
    req.onerror   = () => rej(req.error);
  });
}

export async function deleteOcrResultsForFile(fileId: string): Promise<void> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx    = db.transaction(OCR_STORE, 'readwrite');
    const store = tx.objectStore(OCR_STORE);
    const req   = store.openCursor();
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (!cursor) return;
      if ((cursor.key as string).startsWith(fileId)) cursor.delete();
      cursor.continue();
    };
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });
}
