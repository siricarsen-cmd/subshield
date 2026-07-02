import { NextResponse } from 'next/server';

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

    // 2. REGEX PRE-FILTER (The Speed Filter for Specific Federal Codes)
    const isSCA = /52\.222-41|Service Contract Labor Standards|Service Contract Act/i.test(documentText);
    const isCyber = /252\.204-7012|NIST SP 800-171|CMMC|Controlled Unclassified Information|CUI/i.test(documentText);
    const isOTA = /Other Transaction Authority|OTA|Prototype Agreement|Non-FAR Agreement/i.test(documentText);

    // 3. INJECTING SPECIFIC REGULATORY RULES
    let injectedRules = "";

    if (isSCA) {
      injectedRules += `- SCA RULE: FAR 52.222-41 detected. Check for a Wage Determination attachment. If missing, flag as HIGH risk.\n`;
    }
    if (isCyber) {
      injectedRules += `- CYBER RULE: DFARS 252.204-7012 detected. Scan for clauses making the sub solely liable for cyber breach damages. If found, flag as HIGH risk.\n`;
    }
    if (isOTA) {
      injectedRules += `- OTA RULE: OTA framework detected. Check if the prime is claiming ownership of the subcontractor's background IP. If so, flag as HIGH risk.\n`;
    }

    // 4. AUDITOR PROMPT (The Hybrid Enforcer)
    const systemPrompt = `You are a GovCon Triage Engine. Your job is to extract exact risks from the provided subcontract text.
    
    DETECTED REGULATORY RULES TO ENFORCE:
    ${injectedRules ? injectedRules : "No specific FAR/DFARS code triggers detected by the pre-filter."}

    CORE COMMERCIAL TRAPS TO HUNT FOR (ALWAYS CHECK THESE):
    1. Contingent Payment / Pay-If-Paid: Look for ANY language stating payment is contingent upon the Prime receiving funds from the Government, or that the Prime has "no obligation to pay" if the Government doesn't pay.
    2. Blanket Flow-Downs: Look for language forcing the sub to accept clauses "whether included or later provided" without actually attaching them.
    3. Vague Workshares: Look for language stating the Prime "does not guarantee any specific number of hours" or "minimum workshare".
    4. Broad Indemnification: Look for language requiring the sub to indemnify or hold harmless the Prime for issues beyond the sub's direct control.
    5. Predatory Termination: Look for Termination for Convenience or Default clauses with unreasonably short notice periods (e.g., 5 days) or waivers of unabsorbed overhead.

    CRITICAL INSTRUCTIONS:
    1. You MUST extract the exact 'foundText' verbatim from the user's uploaded contract. Do not summarize the found text. Quote it exactly.
    2. If a trap does not exist in the text, DO NOT hallucinate or report it.
    3. Output ONLY valid JSON matching the schema below.

    REQUIRED JSON SCHEMA:
    {
      "riskLevel": "High" | "Medium" | "Low",
      "industryDetected": "e.g., IT Services, Professional Services, Construction, etc.",
      "criticalTraps": [
        {
          "regulation": "Name of trap (e.g., Contingent Payment Trap, Blanket Flow-Down)",
          "foundText": "Exact verbatim quote from the contract",
          "riskAnalysis": "Clear, plain-English explanation of how this specific clause hurts the subcontractor's operations or cash flow.",
          "redlineFix": "The exact recommended text to replace or amend the predatory clause."
        }
      ],
      "emailDraft": "A brief, professional pushback email to the Prime Project Manager referencing the flagged articles and requesting their amendment."
    }`;

    // 5. AI REQUEST
    const OPENAI_KEY = process.env.OPENAI_API_KEY;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: systemPrompt }, 
          { role: 'user', content: documentText }
        ],
        temperature: 0.0
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