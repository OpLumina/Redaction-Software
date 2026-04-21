'use client';

import { useOcrStore } from '@/store/ocrStore';
import { OcrWord } from '@/types/ocr';
import { useEffect, useState } from 'react';

export function useOcrResults(fileId: string, pageIndex: number) {
  // 1. Maintain local state for the resolved OCR result
  const [resolvedResult, setResolvedResult] = useState<any>(null);
  
  const getResult = useOcrStore((s) => s.getResult);
  const jobs = useOcrStore((s) => s.jobs);
  const job = jobs.find((j) => j.fileId === fileId && j.pageIndex === pageIndex);

  // 2. Resolve the Promise whenever the fileId or pageIndex changes
  useEffect(() => {
    let active = true;
    const fetchResult = async () => {
      const data = await getResult(fileId, pageIndex);
      if (active) setResolvedResult(data);
    };
    fetchResult();
    return () => { active = false; };
  }, [fileId, pageIndex, getResult]);

  const searchWords = (query: string): OcrWord[] => {
    // 3. Use the resolved state instead of the Promise
    if (!resolvedResult || !query.trim()) return [];
    const lower = query.toLowerCase();
    return resolvedResult.words.filter((w: OcrWord) => 
      w.text.toLowerCase().includes(lower)
    );
  };

  return {
    result: resolvedResult,
    job,
    isProcessing: job?.status === 'processing' || job?.status === 'queued',
    isDone: job?.status === 'done',
    searchWords,
  };
}
