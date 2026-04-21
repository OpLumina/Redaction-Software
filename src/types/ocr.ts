export interface OcrBoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrWord {
  text: string;
  bbox: OcrBoundingBox;
  confidence: number;
}

export interface OcrPageResult {
  pageIndex: number;
  words: OcrWord[];
  imageWidth: number;
  imageHeight: number;
}

export type OcrJobStatus = 'idle' | 'queued' | 'processing' | 'done' | 'error';

export interface OcrJob {
  fileId: string;
  pageIndex: number;
  status: OcrJobStatus;
  progress: number;
}
