// PDF extraction pipeline: text-layer extractors first, OCR only as a last resort.
//
// Sequence: pdf2json -> pdf-parse -> tesseract.js OCR (rasterized via pdf-parse's
// getScreenshot, which uses @napi-rs/canvas in Node). pdf-parse already wraps
// pdfjs-dist internally for text extraction, so a separate raw pdfjs-dist attempt
// would be redundant - and in testing, running a second, directly-imported copy
// of pdfjs-dist alongside pdf-parse's internal one triggered an "API version does
// not match Worker version" crash under Next.js's dev bundler. Two genuinely
// independent extractors (pdf2json, pdf-parse) cover this better than three
// fragile ones.
// Each stage is judged "good enough" using the same assessExtractionConfidence()
// gate that runAnalyzer() uses for Limited Scan, so this file never invents its
// own notion of "enough text" that could drift from the real gate.
//
// Nothing here decides whether a report gets generated - it only decides what
// text (if any) gets handed to runAnalyzer(). The Limited Scan decision itself
// still happens exclusively in lib/analyzer/text.ts + report.ts.

import { assessExtractionConfidence } from "./text";

const MAX_OCR_PAGES = 6;
const OCR_TIMEOUT_MS = 45_000;

export interface ExtractionOutcome {
  text: string;
  method: string;
  pageCount?: number;
  ocrAttempted: boolean;
  ocrReason?: string;
  // Pages actually OCR'd (<= MAX_OCR_PAGES). Only meaningful when ocrAttempted
  // is true. Compared against pageCount (the document's true total) to detect
  // when the OCR page cap truncated coverage of a multi-page scanned PDF.
  ocrPagesProcessed?: number;
  // True when OCR produced enough text to pass the confidence gate, but the
  // document has more pages than the OCR cap could process - i.e. findings
  // below are grounded and real, but clauses past ocrPagesProcessed were
  // never reviewed. Must never be set alongside a Limited Scan (findings are
  // suppressed there); this is a distinct "partial coverage" disclosure.
  partialOcrScan?: boolean;
  partialOcrReason?: string;
}

interface RawExtraction {
  text: string;
  pageCount?: number;
  pagesProcessed?: number;
}

interface Pdf2JsonTextRun {
  T: string;
}

interface Pdf2JsonTextItem {
  R?: Pdf2JsonTextRun[];
}

interface Pdf2JsonPage {
  Texts?: Pdf2JsonTextItem[];
}

interface Pdf2JsonData {
  formImage?: {
    Pages?: Pdf2JsonPage[];
  };
}

interface Pdf2JsonParserError {
  parserError?: string;
}

async function extractWithPdf2Json(buffer: Buffer): Promise<RawExtraction> {
  const { default: PDFParser } = await import("pdf2json");

  return new Promise<RawExtraction>((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: unknown) =>
      reject(new Error((errData as Pdf2JsonParserError)?.parserError || "pdf2json parse error"))
    );
    pdfParser.on("pdfParser_dataReady", (pdfData: unknown) => {
      let rawText = "";
      const pages = (pdfData as Pdf2JsonData)?.formImage?.Pages || [];
      for (const page of pages) {
        if (page.Texts) {
          for (const textItem of page.Texts) {
            if (textItem.R) {
              for (const run of textItem.R) {
                rawText += decodeURIComponent(run.T) + " ";
              }
            }
          }
        }
        rawText += "\n\n";
      }
      resolve({ text: rawText, pageCount: pages.length || undefined });
    });

    pdfParser.parseBuffer(buffer);
  });
}

async function extractWithPdfParse(buffer: Buffer): Promise<RawExtraction> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return { text: result.text || "", pageCount: result.total };
  } finally {
    await parser.destroy();
  }
}

function runWithTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// Rasterizes up to MAX_OCR_PAGES pages and runs tesseract.js against each one.
// Bounded on two axes (page count + wall-clock timeout via the caller) so a
// large or pathological scanned PDF can't hang a serverless invocation.
async function ocrPages(buffer: Buffer, knownPageCount: number | undefined): Promise<RawExtraction> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  let screenshots;
  try {
    const pagesToRender = Math.min(knownPageCount || MAX_OCR_PAGES, MAX_OCR_PAGES);
    screenshots = await parser.getScreenshot({ first: pagesToRender, scale: 2.0 });
  } finally {
    await parser.destroy();
  }

  console.log("[analyzer:extraction] OCR rasterized", {
    pagesRendered: screenshots.pages.length,
    pageByteSizes: screenshots.pages.map((p) => p.data?.length ?? 0),
  });

  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("eng");
  try {
    let text = "";
    for (const [index, page] of screenshots.pages.entries()) {
      if (!page.data) continue;
      const { data } = await worker.recognize(Buffer.from(page.data));
      console.log("[analyzer:extraction] OCR page result", {
        page: index + 1,
        recognizedLength: (data.text || "").trim().length,
      });
      text += (data.text || "") + "\n\n";
    }
    return { text, pageCount: screenshots.total, pagesProcessed: screenshots.pages.length };
  } finally {
    await worker.terminate();
  }
}

function logExtractionMetrics(
  method: string,
  text: string,
  pageCount: number | undefined,
  ocrAttempted: boolean
): void {
  const trimmed = text.trim();
  // Server-side debug log only - never include this payload in an API response.
  console.log("[analyzer:extraction]", {
    method,
    extractedTextLength: trimmed.length,
    pageCount: pageCount ?? "unknown",
    ocrAttempted,
    preview: trimmed.slice(0, 300),
  });
}

// Legacy binary .doc (pre-2007 Word format) isn't readable by mammoth (docx-only,
// OOXML zip format) or the PDF extractors, so it's rejected clearly up front
// rather than falling through to a confusing garbled-extraction Limited Scan.
async function extractWithMammoth(buffer: Buffer): Promise<RawExtraction> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value || "" };
}

export async function extractDocumentText(buffer: Buffer, fileName?: string): Promise<ExtractionOutcome> {
  const extension = (fileName || "").toLowerCase().split(".").pop();

  if (extension === "doc") {
    return {
      text: "",
      method: "unsupported-legacy-doc",
      ocrAttempted: false,
      ocrReason:
        "Legacy .doc files (pre-2007 Word format) are not supported. Please save the document as .docx, export it as a PDF, or paste the contract text directly.",
    };
  }

  if (extension === "txt") {
    const text = buffer.toString("utf-8");
    logExtractionMetrics("txt", text, undefined, false);
    return { text, method: "txt", ocrAttempted: false };
  }

  if (extension === "docx") {
    try {
      const result = await extractWithMammoth(buffer);
      logExtractionMetrics("mammoth-docx", result.text, undefined, false);
      return { text: result.text, method: "mammoth-docx", ocrAttempted: false };
    } catch (err) {
      console.error(
        `[analyzer:extraction] mammoth-docx failed for ${fileName ?? "upload"}:`,
        err instanceof Error ? err.message : err
      );
      return {
        text: "",
        method: "docx-extraction-failed",
        ocrAttempted: false,
        ocrReason:
          "This DOCX file could not be read. It may be corrupted, password-protected, or saved in an unsupported format.",
      };
    }
  }

  const attempts: Array<{ method: string; run: () => Promise<RawExtraction> }> = [
    { method: "pdf2json", run: () => extractWithPdf2Json(buffer) },
    { method: "pdf-parse", run: () => extractWithPdfParse(buffer) },
  ];

  let best: RawExtraction = { text: "", pageCount: undefined };
  let bestMethod = "none";

  for (const attempt of attempts) {
    let result: RawExtraction;
    try {
      result = await attempt.run();
    } catch (err) {
      console.error(
        `[analyzer:extraction] ${attempt.method} failed for ${fileName ?? "upload"}:`,
        err instanceof Error ? err.message : err
      );
      continue;
    }

    if (result.text.trim().length > best.text.trim().length) {
      best = result;
      bestMethod = attempt.method;
    }

    if (assessExtractionConfidence(result.text).confident) {
      logExtractionMetrics(attempt.method, result.text, result.pageCount, false);
      return { text: result.text, method: attempt.method, pageCount: result.pageCount, ocrAttempted: false };
    }
  }

  // Every text-layer extractor came up short - likely a scanned/image-only PDF.
  // OCR is a last resort: it's slow and, on serverless, can be unavailable or
  // get killed by a platform timeout, so failures here must degrade cleanly
  // to Limited Scan rather than throwing or fabricating a result.
  let ocrReason: string | undefined;
  let ocrResult: RawExtraction | undefined;
  try {
    ocrResult = await runWithTimeout(ocrPages(buffer, best.pageCount), OCR_TIMEOUT_MS, "OCR");
    const totalPages = ocrResult.pageCount;
    const pagesProcessed = ocrResult.pagesProcessed;
    // OCR is capped at MAX_OCR_PAGES per request (see the top-of-file note on
    // why unlimited OCR isn't safe on serverless). When a document has more
    // pages than we processed, later clauses were never reviewed - even if
    // the pages we did OCR produced clean, confident, groundable findings,
    // this must never be presented as a complete document scan.
    const isPartial =
      typeof totalPages === "number" && typeof pagesProcessed === "number" && totalPages > pagesProcessed;

    if (assessExtractionConfidence(ocrResult.text).confident) {
      logExtractionMetrics("tesseract-ocr", ocrResult.text, totalPages, true);
      return {
        text: ocrResult.text,
        method: "tesseract-ocr",
        pageCount: totalPages,
        ocrAttempted: true,
        ocrPagesProcessed: pagesProcessed,
        ...(isPartial
          ? {
              partialOcrScan: true,
              partialOcrReason: `This document appears to be a scanned/image-based PDF with ${totalPages} total pages. Only the first ${pagesProcessed} page(s) could be OCR-processed in this request (OCR is capped at ${MAX_OCR_PAGES} pages per scan), so clauses on pages after ${pagesProcessed} were not reviewed and may not be reflected in the findings below. For a complete analysis, upload a text-based PDF, a DOCX/TXT file, or paste the full contract text.`,
            }
          : {}),
      };
    }

    ocrReason = isPartial
      ? `This document appears to be a scanned/image-based PDF with ${totalPages} total pages. OCR processed the first ${pagesProcessed} page(s) (of a ${MAX_OCR_PAGES}-page-per-scan cap) but could not reliably extract enough readable text even from those pages to generate a grounded report.`
      : "This document's text layer could not be reliably read, and OCR did not surface enough readable text either - consistent with a scanned/image-only PDF that could not be reliably OCR processed.";
  } catch (err) {
    console.error(
      `[analyzer:extraction] OCR failed for ${fileName ?? "upload"}:`,
      err instanceof Error ? err.message : err
    );
    ocrReason =
      "This document's text layer could not be reliably read, and OCR was attempted but failed or timed out - consistent with a scanned/image-only PDF that could not be reliably OCR processed.";
  }

  // Prefer whichever attempt produced more text for the debug log / fallback
  // text, even though both fell short of the confidence gate.
  const finalIsOcr = (ocrResult?.text.trim().length ?? 0) > best.text.trim().length;
  const finalText = finalIsOcr ? ocrResult!.text : best.text;
  const finalMethod = finalIsOcr ? "tesseract-ocr" : bestMethod;
  const finalPageCount = finalIsOcr ? ocrResult!.pageCount : best.pageCount;

  logExtractionMetrics(finalMethod, finalText, finalPageCount, true);
  return {
    text: finalText,
    method: finalMethod,
    pageCount: finalPageCount,
    ocrAttempted: true,
    ocrReason,
    ocrPagesProcessed: ocrResult?.pagesProcessed,
  };
}
