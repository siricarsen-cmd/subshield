import { NextResponse } from 'next/server';
import { runAnalyzer } from '@/lib/analyzer/report';
import { extractDocumentText } from '@/lib/analyzer/extract';

export const runtime = 'nodejs';
// OCR fallback (rasterize + tesseract.js) can legitimately take tens of
// seconds on a scanned PDF. Raise the function's max duration accordingly -
// confirm this matches your actual Vercel plan (Hobby caps at 10s regardless
// of this value; Pro/Enterprise can go higher) before deploying.
export const maxDuration = 60;

// Mirrors the dashboard's client-side cap (app/dashboard/page.tsx) so a direct
// API call can't bypass it and push an oversized payload into runAnalyzer.
const MAX_PASTED_TEXT_LENGTH = 200_000;

// This is the active analyzer route, called from app/dashboard/page.tsx on
// upload (multipart file) or pasted-text submission (JSON body). File uploads
// go through extractDocumentText (lib/analyzer/extract.ts) for PDF/DOCX/TXT
// extraction; pasted text bypasses extraction entirely and is fed straight
// into the same runAnalyzer grounded pipeline (lib/analyzer/report.ts) - there
// is no separate/ungrounded path for pasted text.
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => null);
      const text = typeof body?.text === 'string' ? body.text : '';

      if (!text.trim()) {
        return NextResponse.json({ error: "No contract text provided." }, { status: 400 });
      }
      if (text.length > MAX_PASTED_TEXT_LENGTH) {
        return NextResponse.json(
          { error: `Pasted text exceeds the ${MAX_PASTED_TEXT_LENGTH.toLocaleString()} character limit. Please split it up or upload a file instead.` },
          { status: 400 }
        );
      }

      const fileName = typeof body?.fileName === 'string' && body.fileName.trim()
        ? body.fileName.trim()
        : "Pasted contract text";

      const result = await runAnalyzer(text, fileName);
      return NextResponse.json({ result });
    }

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
  } catch (error: unknown) {
    console.error("Analyzer Error:", error);
    const message = error instanceof Error ? error.message : "Analyzer failed to process the request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}