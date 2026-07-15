import { NextResponse } from 'next/server';
import { runAnalyzer } from '@/lib/analyzer/report';
import { extractDocumentText } from '@/lib/analyzer/extract';
import { createClient } from '@supabase/supabase-js';
import {
  executePaidReview,
  extractBearerToken,
  ReviewCreditError,
  ReviewProcessingError,
  type ReviewCreditDatabase,
} from '@/lib/review-credit-lifecycle';
import { normalizeAuditId } from '@/lib/audit-id';

export const runtime = 'nodejs';
// OCR fallback (rasterize + tesseract.js) can legitimately take tens of
// seconds on a scanned PDF. Raise the function's max duration accordingly -
// confirm this matches your actual Vercel plan (Hobby caps at 10s regardless
// of this value; Pro/Enterprise can go higher) before deploying.
export const maxDuration = 60;

// Mirrors the dashboard's client-side cap (app/dashboard/page.tsx) so a direct
// API call can't bypass it and push an oversized payload into runAnalyzer.
const MAX_PASTED_TEXT_LENGTH = 200_000;

const serviceDatabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const authClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const reviewDatabase = serviceDatabase as unknown as ReviewCreditDatabase;

// This is the active analyzer route, called from app/dashboard/page.tsx on
// upload (multipart file) or pasted-text submission (JSON body). File uploads
// go through extractDocumentText (lib/analyzer/extract.ts) for PDF/DOCX/TXT
// extraction; pasted text bypasses extraction entirely and is fed straight
// into the same runAnalyzer grounded pipeline (lib/analyzer/report.ts) - there
// is no separate/ungrounded path for pasted text.
export async function POST(req: Request) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
    }
    if (!user.email || !user.email_confirmed_at) {
      return NextResponse.json({ error: "A verified email is required." }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => null);
      const text = typeof body?.text === 'string' ? body.text : '';
      const auditId = normalizeAuditId(body?.auditId);

      if (!text.trim()) {
        return NextResponse.json({ error: "No contract text provided." }, { status: 400 });
      }
      if (text.length > MAX_PASTED_TEXT_LENGTH) {
        return NextResponse.json(
          { error: `Pasted text exceeds the ${MAX_PASTED_TEXT_LENGTH.toLocaleString()} character limit. Please split it up or upload a file instead.` },
          { status: 400 }
        );
      }
      if (!auditId) {
        return NextResponse.json({ error: "A valid review ID is required." }, { status: 400 });
      }

      const fileName = typeof body?.fileName === 'string' && body.fileName.trim()
        ? body.fileName.trim()
        : "Pasted contract text";

      // Server-side debug log only - mirrors the extraction-metrics log in
      // lib/analyzer/extract.ts for file uploads, so pasted-text submissions
      // are diagnosable from production logs too. Never logs the actual
      // contract text or any secrets.
      console.log("[analyzer:intake]", {
        source: "pasted-text",
        textLength: text.length,
        fileName,
      });

      const review = await executePaidReview(
        reviewDatabase,
        { userId: user.id, auditId },
        () => runAnalyzer(text, fileName)
      );
      return NextResponse.json(review);
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const auditId = normalizeAuditId(formData.get('auditId'));

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (!auditId) {
      return NextResponse.json({ error: "A valid review ID is required." }, { status: 400 });
    }

    const review = await executePaidReview(
      reviewDatabase,
      { userId: user.id, auditId },
      async () => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const extraction = await extractDocumentText(buffer, file.name);

        return runAnalyzer(extraction.text, file.name, {
          limitedScanReason: extraction.ocrReason,
          partialOcrScan: extraction.partialOcrScan,
          partialOcrReason: extraction.partialOcrReason,
          ocrPagesProcessed: extraction.ocrPagesProcessed,
          ocrTotalPages: extraction.pageCount,
          confidenceHints: {
            pageCount: extraction.pageCount,
            sourceByteLength: extraction.sourceByteLength,
          },
        });
      }
    );

    return NextResponse.json(review);
  } catch (error: unknown) {
    console.error("Analyzer Error:", error);
    if (error instanceof ReviewCreditError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    if (error instanceof ReviewProcessingError) {
      return NextResponse.json(
        { error: error.message, creditRestored: error.creditRestored },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Analyzer failed to process the request." }, { status: 500 });
  }
}
