# Redact

Local Vibe-Coded Redaction Software, runs in a docker container for easy deployment. Uses Tesseract OCR for searching and mass-redaction

## Supported formats

| Category | Formats |
|---|---|
| Documents | PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, ODT, ODS, ODP, RTF, CSV |
| Images | PNG, JPG, TIFF, WEBP, BMP, GIF, AVIF, SVG |
| Text | TXT, MD, HTML, XML, JSON |

## Quick start

### Docker (recommended)
```bash
mkdir -p volumes/in-progress
docker compose up --build
```

### Local dev
```bash
bash setup.sh
npm run dev
```

Open http://localhost:3000

## How it works

1. Files are loaded — Office formats converted to PDF via LibreOffice, text formats via pdf-lib in-browser
2. Pages are rasterized at high resolution (300 DPI default)
3. Redaction boxes pixel-overwrite the canvas with solid black
4. Pages reassembled into a new PDF with no text layer
5. All metadata stripped on export

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl+Z` | Undo |
| `Cmd/Ctrl+Y` | Redo |
| `Cmd/Ctrl+E` | Export |


## Known Bugs
* File Exports of files at or Over ~245 Pages starts to destroy certain parts of the export
* File uploads are unavailable for non-localhost connections (like direct IP access instead of 127.0.0.1), which needs to be fixed if running on a server. Will update with a toggle to add port access to other people on LAN as well

## Reporting Security Vulnerabilities
cm.stupak@gmail.com
