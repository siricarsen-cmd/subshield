import { NextResponse } from 'next/server';
import { runAnalyzer } from '@/lib/analyzer/report';
import { extractDocumentText } from '@/lib/analyzer/extract';

export const runtime = 'nodejs';
// OCR fallback (rasterize + tesseract.js) can legitimately take tens of
// seconds on a scanned PDF. Raise the function's max duration accordingly -
// confirm this matches your actual Vercel plan (Hobby caps at 10s regardless
// of this value; Pro/Enterprise can go higher) before deploying.
export const maxDuration = 60;

// This is the active analyzer route, called from app/dashboard/page.tsx on upload.
// PDF text extraction happens here (lib/analyzer/extract.ts); all risk
// detection/grounding/ranking logic lives in lib/analyzer/ (see report.ts for
// the pipeline entry point).
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extraction = await extractDocumentText(buffer, file.name);

    const result = await runAnalyzer(extraction.text, file.name, {
      limitedScanReason: extraction.ocrReason,
      partialOcrScan: extraction.partialOcrScan,
      partialOcrReason: extraction.partialOcrReason,
      ocrPagesProcessed: extraction.ocrPagesProcessed,
      ocrTotalPages: extraction.pageCount,
    });

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Analyzer Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}