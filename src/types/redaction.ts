export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RedactionBox extends BoundingBox {
  id: string;
  pageIndex: number;
  label?: string;
  source: 'manual' | 'ocr';
}

export interface PageRedactions {
  [pageIndex: number]: RedactionBox[];
}

export type RedactionMode = 'draw' | 'select' | 'erase' | 'find';

export interface BurnOptions {
  format: 'pdf' | 'png';
  dpi: number;
  stripMetadata: boolean;
}
