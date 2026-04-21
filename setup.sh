#!/usr/bin/env bash
set -e

echo "→ Installing dependencies..."
npm install

echo "→ Copying PDF.js worker to public/workers/..."
mkdir -p public/workers
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/workers/pdf.worker.min.js

echo "→ Creating volumes directory..."
mkdir -p volumes/in-progress

echo ""
echo "✓ Setup complete. Run: npm run dev"
