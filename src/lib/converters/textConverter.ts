'use client';

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const PAGE_W        = 595;
const PAGE_H        = 842;
const MARGIN        = 48;
const LINE_H        = 16;
const FONT_SIZE     = 11;
const CHARS_PER_LINE = 90;

export async function textToPdf(file: File): Promise<Blob> {
  const raw = await file.text();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  const text = ['html', 'htm', 'xml'].includes(ext)
    ? raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : raw;

  // Word-wrap into fixed-width lines
  const lines: string[] = [];
  for (const rawLine of text.split('\n')) {
    if (rawLine.length <= CHARS_PER_LINE) {
      lines.push(rawLine);
      continue;
    }
    let current = '';
    for (const word of rawLine.split(' ')) {
      if ((current + ' ' + word).trim().length > CHARS_PER_LINE) {
        lines.push(current.trim());
        current = word;
      } else {
        current = (current + ' ' + word).trim();
      }
    }
    if (current) lines.push(current.trim());
  }

  const linesPerPage = Math.floor((PAGE_H - MARGIN * 2) / LINE_H);
  const chunks: string[][] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    chunks.push(lines.slice(i, i + linesPerPage));
  }
  if (!chunks.length) chunks.push(['']);

  const doc  = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Courier);

  for (const chunk of chunks) {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    chunk.forEach((line, i) => {
      page.drawText(line, {
        x: MARGIN,
        y: PAGE_H - MARGIN - i * LINE_H,
        size: FONT_SIZE,
        font,
        color: rgb(0, 0, 0),
      });
    });
  }

  const pdfBytes = await doc.save();
  return new Blob([pdfBytes.buffer as any], { type: 'application/pdf' });
}
