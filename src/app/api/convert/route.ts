import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);
const TMP = '/tmp/redact-convert';

export async function POST(req: NextRequest) {
  await mkdir(TMP, { recursive: true });

  const formData = await req.formData();
  const file     = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const ext    = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const id     = randomUUID();
  const inPath = join(TMP, `${id}.${ext}`);
  const outDir = join(TMP, id);

  try {
    await mkdir(outDir, { recursive: true });
    await writeFile(inPath, Buffer.from(await file.arrayBuffer()));

    await execAsync(
      `libreoffice --headless --convert-to pdf --outdir "${outDir}" "${inPath}"`,
      { timeout: 60_000 }
    );

    const { stdout } = await execAsync(`ls "${outDir}"`);
    const outFile    = stdout.trim().split('\n').find((f) => f.endsWith('.pdf'));
    if (!outFile) throw new Error('LibreOffice produced no output');

    const pdfBuf = await readFile(join(outDir, outFile));

    return new NextResponse(pdfBuf, {
      status: 200,
      headers: { 'Content-Type': 'application/pdf' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Conversion error';
    console.error('[convert]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await unlink(inPath).catch(() => {});
    await execAsync(`rm -rf "${outDir}"`).catch(() => {});
  }
}
