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

    // 4. AUDITOR PROMPT (The Segmented Enforcer)
    const systemPrompt = `You are a strict, exhaustive GovCon Triage Engine. You have TWO distinct, mandatory jobs.
    
    --- JOB 1: REGULATORY TRIGGERS ---
    ${injectedRules ? injectedRules : "No federal codes detected. You MUST proceed immediately to Job 2. Do NOT assume the contract is safe."}

    --- JOB 2: CORE COMMERCIAL TRAPS (MANDATORY EVALUATION) ---
    You MUST scan the document text for the following 6 commercial traps. If you find language matching these concepts, you MUST extract them into the JSON array.
    1. Contingent Payment / Pay-If-Paid: Look for "no obligation to pay", "amounts not paid by the Government", or payment contingent on the Prime receiving funds.
    2. Blanket Flow-Downs: Look for agreements to comply with clauses "whether included or later provided".
    3. Vague Workshares: Look for disclaimers like "estimate only", "does not guarantee any specific number of hours", or "no guaranteed revenue".
    4. Unilateral Changes / Short Notice Waivers: Look for deadlines to object within "3 business days" or clauses stating "failure to provide timely notice waives" rights.
    5. Broad Indemnification: Look for requirements to indemnify for "alleged noncompliance" or broad "arising out of" language covering affiliates/customers.
    6. Predatory Termination: Look for immediate termination rights, short cure periods (e.g., "5 calendar days"), or waivers of unabsorbed overhead/anticipated profit.

    CRITICAL INSTRUCTIONS:
    - You MUST evaluate every single trap in Job 2, even if Job 1 was empty.
    - You MUST extract the exact 'foundText' verbatim from the contract. Do not summarize it. Quote it exactly.
    - Output ONLY valid JSON matching this schema:

    {
      "riskLevel": "High" | "Medium" | "Low",
      "industryDetected": "e.g., IT Services, Professional Services, Construction, etc.",
      "criticalTraps": [
        {
          "regulation": "Name of trap (e.g., Contingent Payment Trap, Vague Workshare, Predatory Termination)",
          "foundText": "Exact verbatim quote from the contract",
          "riskAnalysis": "Clear, plain-English explanation of how this specific clause hurts the subcontractor. Detail the exact operational or financial liability.",
          "redlineFix": "The exact recommended text to replace or amend the predatory clause."
        }
      ],
      "emailDraft": "A highly professional pushback email to the Prime Project Manager referencing ALL flagged articles and requesting their amendment."
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