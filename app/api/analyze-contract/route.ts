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
import { getServerSupabaseClient } from '@/lib/server-credit-database';
import { recordOperationalIncident } from '@/lib/operational-incidents';

export const runtime = 'nodejs';
// OCR fallback (rasterize + tesseract.js) can legitimately take tens of
// seconds on a scanned PDF. The deployed Vercel plan/project's current Fluid
// Compute and function-duration settings must support this configured limit.
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
    const token = extractBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
    }
    if (!user.email || !user.email_confirmed_at) {
      return NextResponse.json({ error: "A verified email is required." }, { status: 403 });
    }

    const reviewDatabase = getServerSupabaseClient() as unknown as ReviewCreditDatabase;
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

      // Server-side diagnostics include only source and aggregate size. Never
      // log the pasted text, customer-supplied filename, identity, or secrets.
      console.log("[analyzer:intake]", {
        source: "pasted-text",
        textLength: text.length,
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
    if (error instanceof ReviewCreditError) {
      if (error.status >= 500) {
        await recordOperationalIncident("analyzer_credit_reservation_failed");
        console.error("[ANALYZER] Credit reservation failed");
      }
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    if (error instanceof ReviewProcessingError) {
      await recordOperationalIncident(
        error.creditRestored
          ? "analyzer_processing_failed_credit_restored"
          : "analyzer_processing_failed_credit_unconfirmed",
      );
      console.error("[ANALYZER] Processing failed", {
        creditRestored: error.creditRestored,
      });
      return NextResponse.json(
        { error: error.message, creditRestored: error.creditRestored },
        { status: 500 }
      );
    }

    await recordOperationalIncident("analyzer_unexpected_failure");
    console.error("[ANALYZER] Unexpected request failure");
    return NextResponse.json({ error: "Analyzer failed to process the request." }, { status: 500 });
  }
}
