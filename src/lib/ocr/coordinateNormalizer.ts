// src/lib/ocr/coordinateNormalizer.ts
import { OcrBoundingBox } from '@/types/ocr';
import { BoundingBox } from '@/types/redaction';

export interface NormalizationParams {
  canvasWidth: number;
  canvasHeight: number;
  sourceWidth: number;   // The actual pixel width of the image Tesseract processed
  sourceHeight: number;  // The actual pixel height of the image Tesseract processed
}

/**
 * Converts Tesseract's absolute pixel bounding box (relative to the image it scanned)
 * into percentage-based coordinates (0-100) that can be applied to any display size.
 *
 * IMPORTANT: sourceWidth/sourceHeight must be the dimensions of the canvas that was
 * passed to Tesseract — NOT the natural PDF point dimensions.
 */
export function normalizeBoundingBox(bbox: OcrBoundingBox, params: NormalizationParams): BoundingBox {
  return {
    x:      (bbox.x0 / params.sourceWidth)  * 100,
    y:      (bbox.y0 / params.sourceHeight) * 100,
    width:  ((bbox.x1 - bbox.x0) / params.sourceWidth)  * 100,
    height: ((bbox.y1 - bbox.y0) / params.sourceHeight) * 100,
  };
}

export function padBoundingBox(box: BoundingBox, padding = 0.5): BoundingBox {
  // Padding is in percentage points (e.g. 0.5 = 0.5% of page dimensions)
  return {
    x:      Math.max(0,   box.x - padding),
    y:      Math.max(0,   box.y - padding),
    width:  Math.min(100, box.width  + padding * 2),
    height: Math.min(100, box.height + padding * 2),
  };
}

export function mergeBoundingBoxes(boxes: BoundingBox[]): BoundingBox {
  if (!boxes.length) throw new Error('Cannot merge empty array');
  const minX = Math.min(...boxes.map((b) => b.x));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.width));
  const maxY = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
