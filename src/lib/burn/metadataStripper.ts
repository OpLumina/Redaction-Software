'use client';

import { PDFDocument } from 'pdf-lib';

export async function stripPdfMetadata(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  doc.setTitle(''); doc.setAuthor(''); doc.setSubject('');
  doc.setKeywords([]); doc.setProducer(''); doc.setCreator('');
  doc.setCreationDate(new Date(0)); doc.setModificationDate(new Date(0));
  return doc.save();
}

export async function stripImageMetadata(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        blob.type, 0.95
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}
