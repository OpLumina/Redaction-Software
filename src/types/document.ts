export type FileType = 'pdf' | 'image' | 'office' | 'text';

export interface QueuedFile {
  id: string;
  name: string;
  type: FileType;
  format: string;
  size: number;
  file: File;
  status: 'pending' | 'converting' | 'loading' | 'ready' | 'exporting' | 'done' | 'error';
  pageCount?: number;
  errorMessage?: string;
  convertedPdfBlob?: Blob;
}

export interface PageMeta {
  index: number;
  width: number;
  height: number;
}

export interface ViewerScale {
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
  sourceWidth: number;
  sourceHeight: number;
}

export const ACCEPTED_EXTENSIONS: Record<FileType, string[]> = {
  pdf:    ['pdf'],
  image:  ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'avif', 'svg'],
  office: ['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'doc', 'xls', 'ppt', 'rtf', 'csv'],
  text:   ['txt', 'md', 'html', 'htm', 'xml', 'json'],
};

export const ALL_ACCEPTED = Object.values(ACCEPTED_EXTENSIONS).flat();

export function detectFileType(file: File): FileType | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  for (const [type, exts] of Object.entries(ACCEPTED_EXTENSIONS)) {
    if (exts.includes(ext)) return type as FileType;
  }
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('image/')) return 'image';
  return null;
}
