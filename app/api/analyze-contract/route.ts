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
      injectedRules += `- REGULATORY TRIGGER (SCA): FAR 52.222-41 detected. Check for a Wage Determination attachment. If missing, flag as HIGH risk.\n`;
    }
    if (isCyber) {
      injectedRules += `- REGULATORY TRIGGER (CYBER): DFARS 252.204-7012 detected. Scan for clauses making the sub solely liable for cyber breach damages. If found, flag as HIGH risk.\n`;
    }
    if (isOTA) {
      injectedRules += `- REGULATORY TRIGGER (OTA): OTA framework detected. Check if the prime is claiming ownership of the subcontractor's background IP. If so, flag as HIGH risk.\n`;
    }

    // 4. AUDITOR PROMPT (The Professional Enforcer)
    const systemPrompt = `You are an expert GovCon Subcontract Analyst. Your job is to extract exact risks from the provided subcontract text and provide firm, professional, non-accusatory advice.
    
    --- JOB 1: REGULATORY TRIGGERS ---
    ${injectedRules ? injectedRules : "No federal codes detected. Proceed to Job 2."}

    --- JOB 2: COMMERCIAL RISK TRIGGERS (MANDATORY EVALUATION) ---
    You MUST scan the document text for the following 6 commercial traps. If found, extract them.
    1. Contingent Payment / Pay-If-Paid: Look for "no obligation to pay", "amounts not paid by the Government", or payment contingent on Prime receiving funds.
    2. Blanket Flow-Downs: Look for agreements to comply with clauses "whether included or later provided".
    3. Vague Workshares: Look for "estimate only", "does not guarantee specific hours", or "no guaranteed revenue".
    4. Unilateral Changes / Short Notice Waivers: Look for deadlines to object within "3 business days" or clauses stating "failure to provide timely notice waives" rights.
    5. Broad Indemnification: Look for requirements to indemnify for "alleged noncompliance" or broad "arising out of" language covering affiliates/customers.
    6. Prime-Favorable Termination: Look for immediate termination rights, short cure periods (e.g., "5 calendar days"), or waivers of unabsorbed overhead/closeout costs.

    CRITICAL TONE INSTRUCTIONS:
    - NEVER use aggressive or emotional words like "Predatory", "Ambush", or "Hijack". Use professional terms like "Prime-Favorable", "Contingent", or "Broad Scope".
    - REDLINES MUST BE REALISTIC. For termination, do NOT demand anticipated profit. Demand: "compensation for accepted work and reasonable, documented closeout costs."
    - PM EMAIL MUST BE COLLABORATIVE. Frame requests as "adjustments to align with standard commercial practices" or "clarifications to foster a sustainable partnership." Do not accuse them of setting traps.

    EXTRACTION INSTRUCTIONS:
    - You MUST evaluate every single trap in Job 2.
    - You MUST extract the exact 'foundText' verbatim from the contract. Do not summarize it. Quote it exactly.

    REQUIRED JSON SCHEMA:
    {
      "riskLevel": "High" | "Medium" | "Low",
      "industryDetected": "e.g., IT Services, Professional Services, Construction, etc.",
      "criticalTraps": [
        {
          "triggerType": "Regulatory Trigger" | "Contract Risk Trigger",
          "regulation": "Name of the issue (e.g., Contingent Payment Mechanism, Prime-Favorable Termination, Blanket Flow-Down)",
          "foundText": "Exact verbatim quote from the contract",
          "riskAnalysis": "Clear, objective explanation of how this specific clause creates operational or financial liability for the subcontractor.",
          "redlineFix": "The exact, realistic, attorney-friendly text to replace or amend the clause."
        }
      ],
      "emailDraft": "A firm, highly professional, collaborative email to the Prime Project Manager proposing the redlines. Maintain a non-confrontational, business-to-business tone."
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