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

    // 4. AUDITOR PROMPT (The Exhaustive Enforcer)
    const systemPrompt = `You are a GovCon Triage Engine. Your job is to extract exact risks from the provided subcontract text.
    
    DETECTED REGULATORY RULES TO ENFORCE:
    ${injectedRules ? injectedRules : "No specific FAR/DFARS code triggers detected by the pre-filter."}

    CORE COMMERCIAL TRAPS (YOU MUST EVALUATE EVERY SINGLE ONE OF THESE):
    1. Contingent Payment / Pay-If-Paid: Look for language stating payment is contingent upon the Prime receiving funds, or Prime has "no obligation to pay" if the Government doesn't pay.
    2. Blanket Flow-Downs: Look for language forcing the sub to accept clauses "whether included or later provided" without attaching them.
    3. Vague Workshares: Look for trigger words like "estimate only", "does not create a minimum", "no guaranteed hours", "no guaranteed revenue", or "business judgment".
    4. Unilateral Changes / Short Notice Waivers: Look for trigger words requiring the sub to "notify within 3 business days", stating "failure waives" rights, or demanding the sub "promptly comply" before price is agreed.
    5. Broad Indemnification: Look for language requiring the sub to indemnify for "alleged noncompliance", or broad "arising out of or related to" language that includes defending affiliates/customers before fault is established.
    6. Predatory Termination: Look for termination cure periods under 10 days (e.g., "5 calendar days"), waivers of "unabsorbed overhead", or immediate termination allowed for broad business/customer reasons.

    CRITICAL INSTRUCTIONS:
    1. EXHAUSTIVE EVALUATION: You MUST check the document against ALL 6 Core Commercial Traps listed above. Do not stop after finding one or two. If the contract contains 5 traps, your JSON array MUST contain 5 objects.
    2. You MUST extract the exact 'foundText' verbatim from the user's uploaded contract. Quote it exactly.
    3. If a trap does not exist in the text, DO NOT hallucinate it.
    4. Base the overall 'riskLevel' on the severity and volume of the traps found.

    REQUIRED JSON SCHEMA:
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