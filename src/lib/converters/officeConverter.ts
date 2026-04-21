'use client';

export async function convertOfficeToPdf(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  const res = await fetch('/api/convert', { method: 'POST', body: formData });

  if (!res.ok) {
    const msg = await res.text().catch(() => 'Conversion failed');
    throw new Error(msg);
  }

  return res.blob();
}
