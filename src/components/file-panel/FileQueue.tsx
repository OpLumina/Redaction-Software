'use client';

import { useDocumentStore } from '@/store/documentStore';
import FileQueueItem from './FileQueueItem';

export default function FileQueue() {
  const files = useDocumentStore((s) => s.files);
  if (!files.length) return null;
  return (
    <div className="flex flex-col gap-1 mt-2 overflow-y-auto max-h-64">
      {files.map((f) => <FileQueueItem key={f.id} file={f} />)}
    </div>
  );
}
