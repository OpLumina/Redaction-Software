'use client';

import { useCallback } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { ViewerScale } from '@/types/document';

export function useViewerScale() {
  const viewerScale  = useDocumentStore((s) => s.viewerScale);
  const setViewerScale = useDocumentStore((s) => s.setViewerScale);
  const updateScale  = useCallback((s: ViewerScale) => setViewerScale(s), [setViewerScale]);
  return { viewerScale, updateScale };
}
