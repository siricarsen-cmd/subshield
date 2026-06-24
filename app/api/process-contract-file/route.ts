import { NextResponse } from "next/server";
import pdf from "pdf-parse";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse the PDF
    const pdfData = await pdf(buffer);
    
    // Return the extracted text
    return NextResponse.json({ text: pdfData.text });
  } catch (error) {
    return NextResponse.json({ error: "PDF processing failed" }, { status: 500 });
  }
}import { NextResponse } from "next/server";
// This specific syntax tells TypeScript to ignore the missing "default export"
import pdf = require("pdf-parse"); 

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to Buffer as expected by pdf-parse
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process the PDF
    const pdfData = await pdf(buffer);
    
    // Return the extracted text
    return NextResponse.json({ text: pdfData.text });
  } catch (error) {
    console.error("PDF processing error:", error);
    return NextResponse.json({ error: "PDF processing failed" }, { status: 500 });
  }
}