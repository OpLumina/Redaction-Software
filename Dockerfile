# syntax=docker/dockerfile:1

# --- STAGE 1: Dependencies ---
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# --mount=type=cache keeps npm's download cache on the host between builds.
# Packages are only re-downloaded if they're not in the cache.
# This is separate from Docker layer caching — it survives `docker builder prune`.
RUN --mount=type=cache,target=/root/.npm \
    npm install

# --- STAGE 2: Builder ---
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# apt cache is also persisted — apt packages won't re-download on rebuild
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p public/workers && \
    (cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/workers/pdf.worker.min.js || \
     cp node_modules/pdfjs-dist/build/pdf.worker.js public/workers/pdf.worker.min.js) && \
    cp node_modules/tesseract.js/dist/worker.min.js public/workers/tesseract.worker.min.js && \
    cp node_modules/tesseract.js-core/tesseract-core.wasm.js public/workers/tesseract-core.wasm.js && \
    [ -s public/workers/tesseract.worker.min.js ] || { echo "Worker script is missing or empty"; exit 1; }

ENV NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# --- STAGE 3: Runner ---
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-draw \
    fonts-liberation

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

RUN mkdir -p /home/nextjs/.config && chown -R nextjs:nodejs /home/nextjs
ENV HOME=/home/nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN mkdir -p /data/in-progress && chown nextjs:nodejs /data/in-progress

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
