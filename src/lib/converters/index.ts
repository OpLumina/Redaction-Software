'use client';

import { QueuedFile } from '@/types/document';
import { convertOfficeToPdf } from './officeConverter';
import { textToPdf }          from './textConverter';

export type ConversionResult =
  | { kind: 'pdf';   blob: Blob }
  | { kind: 'image'; file: File }
  | { kind: 'svg';   file: File }
  | { kind: 'none' };

const NATIVE_IMAGES = ['png','jpg','jpeg','gif','webp','bmp','tiff','tif','avif'];
const TEXT_TYPES    = ['txt','md','html','htm','xml','json'];

export async function convertFile(queued: QueuedFile): Promise<ConversionResult> {
  const ext = queued.format;

  if (ext === 'pdf')                    return { kind: 'none' };
  if (NATIVE_IMAGES.includes(ext))      return { kind: 'image', file: queued.file };
  if (ext === 'svg')                    return { kind: 'svg',   file: queued.file };
  if (TEXT_TYPES.includes(ext)) {
    const blob = await textToPdf(queued.file);
    return { kind: 'pdf', blob };
  }

  // Office formats → LibreOffice via API
  const blob = await convertOfficeToPdf(queued.file);
  return { kind: 'pdf', blob };
}
