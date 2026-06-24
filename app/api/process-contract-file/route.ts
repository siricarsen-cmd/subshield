import { NextResponse } from "next/server";
import pdf = require("pdf-parse"); 

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(buffer);
    
    return NextResponse.json({ text: pdfData.text });
  } catch (error) {
    console.error("PDF processing error:", error);
    return NextResponse.json({ error: "PDF processing failed" }, { status: 500 });
  }
}