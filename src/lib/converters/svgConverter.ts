'use client';

export async function svgToCanvas(file: File): Promise<HTMLCanvasElement> {
  const text   = await file.text();
  const parser = new DOMParser();
  const svgEl  = parser.parseFromString(text, 'image/svg+xml').documentElement;

  let w = parseFloat(svgEl.getAttribute('width')  ?? '0');
  let h = parseFloat(svgEl.getAttribute('height') ?? '0');

  if (!w || !h) {
    const vb = svgEl.getAttribute('viewBox')?.split(/[\s,]+/).map(Number);
    if (vb?.length === 4) { w = vb[2]; h = vb[3]; }
  }
  if (!w) w = 1200;
  if (!h) h = 900;

  const scale  = Math.min(3, 2400 / w);
  const finalW = Math.round(w * scale);
  const finalH = Math.round(h * scale);

  const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = finalW;
      canvas.height = finalH;
      canvas.getContext('2d')!.drawImage(img, 0, 0, finalW, finalH);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG render failed')); };
    img.src = url;
  });
}
