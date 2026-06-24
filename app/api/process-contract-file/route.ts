import { NextResponse } from "next/server";
import { readPDF } from "pdf-ts";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("contractFile") as File;

    if (!file) {
      return NextResponse.json({ error: "Missing physical file attachment target" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Modern framework-safe PDF text extraction
    const extractedText = await readPDF(buffer);

    if (!extractedText || !extractedText.trim()) {
      return NextResponse.json({ error: "Could not extract readable characters from this document layout." }, { status: 422 });
    }

    return NextResponse.json({ success: true, contractText: extractedText }, { status: 200 });

  } catch (serverError: any) {
    console.error("[SERVER FILE PARSE FAULT]", serverError);
    return NextResponse.json({ error: "Internal file layout parsing exception" }, { status: 500 });
  }
}