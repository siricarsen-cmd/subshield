import { NextResponse } from 'next/server';

// Force standard Node environment
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. EXTRACTOR
    const documentText = await new Promise<string>((resolve, reject) => {
      const PDFParser = require("pdf2json");
      const pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataError", (errData: any) => reject(new Error(errData.parserError)));
      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        let rawText = "";
        if (pdfData && pdfData.formImage && pdfData.formImage.Pages) {
          for (const page of pdfData.formImage.Pages) {
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
        }
        resolve(rawText);
      });

      pdfParser.parseBuffer(buffer);
    });

    // 2. AUDITOR PROMPT
    const systemPrompt = `You are a ruthless, expert federal contracting attorney and procurement risk analyst. 
Your singular job is to protect government subcontractors from predatory prime contractor terms. 
You must aggressively analyze the provided subcontract text and isolate the most dangerous legal, operational, and financial risks.

DO NOT look for specific pre-defined "construction" risks. Instead, look for any clause that imposes:
1. Financial Risk: Any mechanism that delays your payment, shifts government audit liability to you, or caps your settlement profits.
2. Compliance Burden: Any requirement for you to report, audit, or track data that is not directly related to your scope of work (e.g., Earned Value Management, excessive reporting).
3. Rights Grabs: Any clause that claims ownership over your background IP, data, or proprietary compounds.
4. Liability Shifts: Any language that requires you to defend, indemnify, or hold harmless the prime for their own errors.

CRITICAL INSTRUCTIONS:
1. Identify risks specific to the contract type (e.g., if it's an R&D/CPFF contract, flag the EVMS and Data Rights burdens).
2. Base every flag on direct, verifiable evidence from the uploaded document.
3. Respond ONLY with a raw JSON object (no markdown blocks).

{
  "flags": [
    {
      "severity": "Critical", 
      "category": "e.g., Cash Flow, IP Rights, Operational Burden, or Liability",
      "title": "A concise title of the risk found",
      "description": "Evidence-based explanation of how this hurts the subcontractor.",
      "redline": "The exact recommended text to replace or amend the predatory clause."
    }
  ],
  "emailDraft": "A highly professional, consolidated pushback email referencing the flagged articles and politely requesting their amendment."
}`;

    // 3. AI REQUEST
    const OPENAI_KEY = process.env.OPENAI_API_KEY

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: "json_object" },
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: documentText }],
        temperature: 0.1
      })
    });

    const aiData = await response.json();
    if (!response.ok) throw new Error(aiData.error?.message || 'AI failed.');

    const aiOutput = JSON.parse(aiData.choices[0].message.content);

    return NextResponse.json({ result: aiOutput });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}