# Redact

Locally ran Redaction Software, runs in a docker container for easy deployment. Uses Tesseract OCR for searching and mass-redaction.
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
* When exporting files over ~245 Pages starts to destroy certain parts of the export when burning the redactions into the file
* File uploads are unavailable for non-localhost connections (like direct IP access instead of 127.0.0.1), which needs to be fixed if running on a server. Will update with a toggle to add port access to other people on LAN as well eventually

## Reporting Security Vulnerabilities
cm.stupak@gmail.com

## Disclaimers
* THIS CODE IS A PERSONAL PROJECT FOR A PERSONAL GOAL, IF YOU PLAN TO USE THIS CODE IN A PRODUCTION ENVIRONMENT, PLEASE DO YOUR OWN SECURITY AUDITING PRIOR TO DEPLOYMENT. THIS CODE HANDLES FILE FORMATS THAT COULD POTENTIALLY EXECUTE MALICIOUS JAVASCRIPT OR OTHER MALICIOUS CODE. DO NOT USE THIS CODE TO VIEW FILES YOU DO NOT TRUST. Eventually it will be to the point where I do a security audit and pentest it, as of now it is not to that point.
* Although I have tested the burn-in feature with various redaction-auditing softwares, I cannot gaurentee the effectiveness of this software for redaction. Please independently test your redactions prior to releasing any sensitive information
* This code was assisted by various AI models (Claude, ChatGPT, Qwen 3.5 and Gemini). 
