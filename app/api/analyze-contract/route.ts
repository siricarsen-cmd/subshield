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

    // 4. AUDITOR PROMPT (The Tiered Professional Enforcer)
    const systemPrompt = `You are an expert GovCon Subcontract Analyst. Your job is to extract exact risks from the provided subcontract text and categorize them into Primary Traps and Secondary Concerns.
    
    --- JOB 1: REGULATORY TRIGGERS ---
    ${injectedRules ? injectedRules : "No federal codes detected. Proceed to Job 2."}

    --- JOB 2: COMMERCIAL RISK TRIGGERS (MANDATORY EVALUATION) ---
    You MUST scan the document text for ALL 6 of the following commercial traps:
    1. Contingent Payment / Pay-If-Paid: "no obligation to pay", "amounts not paid by the Government", or payment contingent on Prime receiving funds.
    2. Blanket Flow-Downs: Agreements to comply with clauses "whether included or later provided".
    3. Vague Workshares: "estimate only", "does not guarantee specific hours", or "no guaranteed revenue".
    4. Prime-Favorable Termination: Immediate termination rights, short cure periods, or waivers of closeout costs.
    5. Unilateral Changes / Short Notice Waivers: Deadlines to object within "3 business days" or "failure to provide timely notice waives" rights.
    6. Broad Indemnification: Requirements to indemnify for "alleged noncompliance" or broad "arising out of" language covering affiliates/customers.

    CRITICAL TONE INSTRUCTIONS:
    - NEVER use aggressive words like "Predatory" or "Ambush". Use "Prime-Favorable", "Contingent", or "Broad Scope".
    - REDLINES MUST BE REALISTIC: For termination, demand "compensation for accepted work and reasonable, documented closeout costs."
    - PM EMAIL MUST BE COLLABORATIVE: Propose adjustments to "align with standard commercial practices."

    EXTRACTION & CATEGORIZATION INSTRUCTIONS (CRITICAL):
    - You MUST evaluate all 6 traps. Do not stop early.
    - Place the most urgent operational/financial threats (Payment, Flow-Downs, Workshares, Termination) into the 'primaryTraps' array (Maximum of 4 items).
    - Place legal/administrative threats (Unilateral Changes, Broad Indemnification) into the 'secondaryConcerns' array.
    - If a contract has stacked risks (e.g., Contingent Payment + Flow-Downs + Vague Workshare), grade the riskLevel as "Medium-High" or "High".

    REQUIRED JSON SCHEMA:
    {
      "riskLevel": "High" | "Medium-High" | "Medium" | "Low",
      "industryDetected": "e.g., IT Services, Professional Services, Construction, etc.",
      "primaryTraps": [
        {
          "triggerType": "Regulatory Trigger" | "Contract Risk Trigger",
          "regulation": "Name of the issue",
          "foundText": "Exact verbatim quote from the contract",
          "riskAnalysis": "Objective explanation of financial/operational liability.",
          "redlineFix": "Realistic, attorney-friendly redline text."
        }
      ],
      "secondaryConcerns": [
        {
          "triggerType": "Contract Risk Trigger",
          "regulation": "Name of the issue (e.g., Broad Indemnification, Short Notice Waiver)",
          "foundText": "Exact verbatim quote from the contract",
          "riskAnalysis": "Objective explanation of legal/administrative liability.",
          "redlineFix": "Realistic, attorney-friendly redline text."
        }
      ],
      "emailDraft": "A firm, collaborative email referencing ALL flagged articles from both arrays."
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