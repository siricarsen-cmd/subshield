import { NextResponse } from "next/server";
// Use this modern import syntax instead
import pdf from "pdf-parse";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // We cast to any because the pdf-parse type definitions can be strict
    const pdfData = await (pdf as any)(buffer);
    
    return NextResponse.json({ text: pdfData.text });
  } catch (error) {
    console.error("PDF processing error:", error);
    return NextResponse.json({ error: "PDF processing failed" }, { status: 500 });
  }
}