import { NextResponse } from "next/server";
// Using the exact wildcard import syntax the compiler requested
import * as pdfParse from "pdf-parse";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Safely extract the function whether it loads as a module or default export
    const extractPdf = (pdfParse as any).default || pdfParse;
    const pdfData = await extractPdf(buffer);
    
    return NextResponse.json({ text: pdfData.text });
  } catch (error) {
    console.error("PDF processing error:", error);
    return NextResponse.json({ error: "PDF processing failed" }, { status: 500 });
  }
}