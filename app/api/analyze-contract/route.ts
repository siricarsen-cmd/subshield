import { NextResponse } from 'next/server';

// Force standard Node environment for pdf2json
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

    // 1. EXTRACTOR (Unchanged - this works perfectly for getting the raw text)
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

    // 2. REGEX PRE-FILTER (The Speed Filter)
    // We scan the raw text for specific federal regulatory markers before asking the AI to think.
    const isSCA = /52\.222-41|Service Contract Labor Standards|Service Contract Act/i.test(documentText);
    const isCyber = /252\.204-7012|NIST SP 800-171|CMMC|Controlled Unclassified Information|CUI/i.test(documentText);
    const isPayment = /52\.232-40|Pay-When-Paid|Pay-If-Paid|Condition Precedent/i.test(documentText);
    const isOTA = /Other Transaction Authority|OTA|Prototype Agreement|Non-FAR Agreement/i.test(documentText);

    // 3. INJECTING THE RULE SET CONTEXT (The Strict Injector)
    let injectedRules = "";

    if (isSCA) {
      injectedRules += `
      - SCA RULE: You detected FAR 52.222-41 (Service Contract Labor Standards). Check for the presence of a "Wage Determination", "WD number", or Wage Rates attachment. If FAR 52.222-41 is present but NO Wage Determination schedule is attached or explicitly referenced as provided, output a HIGH risk flag.
      Risk Analysis text: "The Prime Contractor has flowed down the Service Contract Act (FAR 52.222-41) but failed to provide the mandatory Department of Labor Wage Determination schedule. Signing this exposes you to severe back-pay liability and audit risk."
      Redline Fix text: "Prime Contractor must provide the applicable DOL Wage Determination schedule prior to execution. Subcontractor's pricing is strictly contingent upon review of these specific wage classifications."\n`;
    }

    if (isCyber) {
      injectedRules += `
      - CYBER RULE: You detected DFARS 252.204-7012 or NIST/CMMC. Scan for language attempting to hold the Subcontractor solely liable for cyber breach damages or indemnification. If found, trigger a HIGH risk flag.
      Risk Analysis text: "The contract flows down mandatory DFARS 252.204-7012 cybersecurity requirements. However, the custom text shifts massive financial liability onto you for data security breaches. You are being asked to certify a compliance level that could expose your firm to multi-million dollar liabilities if a breach occurs."
      Redline Fix text: "Amend the cybersecurity clause to clarify that Subcontractor complies with standard federal flow-down rules, but expressly exclude third-party cyber data breaches from your broad commercial indemnification obligations."\n`;
    }

    if (isPayment) {
      injectedRules += `
      - PAYMENT RULE: You detected FAR 52.232-40 or Prompt Payment/Pay-When-Paid language. Review the payment timing. If the prime specifies a deadline greater than 15 days or uses "Pay-When-Paid" / "Pay-If-Paid" condition precedent language, flag this as a HIGH risk regulatory violation.
      Risk Analysis text: "The contract explicitly flows down FAR 52.232-40 (or standard prompt payment), but the custom payment terms contradict this mandate by enforcing an extended payment window or a predatory Pay-When-Paid trap. Primes are required to pass down accelerated payment timelines (within 15 days of government draw) to small business partners."
      Redline Fix text: "Delete any contingent payment language or text extending past 15 days. Replace with: 'Pursuant to FAR 52.232-40, Prime Contractor shall accelerate payments to Subcontractor, with payment issued no later than fifteen (15) days after Prime Contractor receives matching payment acceleration from the Government.'"\n`;
    }

    if (isOTA) {
      injectedRules += `
      - OTA RULE: You detected an OTA (Other Transaction Authority). Check Intellectual Property and Patent clauses. Look for clauses granting the Prime 'unlimited rights,' 'ownership,' or 'exclusive licenses' to the sub's background IP. If it fails to protect background technology explicitly, trigger a HIGH risk flag.
      Risk Analysis text: "This agreement operates under an OTA framework where standard FAR small business IP protections do not apply. The text as written does not robustly firewall your background technology, giving the prime an avenue to claim ownership or broad rights over your proprietary software code or engineering data."
      Redline Fix text: "Insert a strict Background IP firewall clause: 'Subcontractor retains all sole right, title, and interest in and to its pre-existing and background intellectual property. Prime Contractor is granted only a limited, non-transferable, non-exclusive license to use such IP solely for the duration and performance of this specific subcontract effort.'"\n`;
    }

    // 4. AUDITOR PROMPT (The Enforcer)
    const systemPrompt = `You are a GovCon Triage Engine. Your job is to extract exact risks from the provided subcontract text based strictly on the triggered rules.
    
    DETECTED REGULATORY RULES TO ENFORCE:
    ${injectedRules ? injectedRules : "No specific regulatory triggers detected. Scan for general predatory clauses like generic Pay-When-Paid, broad indemnification without limits, or unreasonable termination clauses."}

    CRITICAL INSTRUCTIONS:
    1. Only extract data for regulations detected and listed above.
    2. You MUST extract the exact 'foundText' verbatim from the user's uploaded contract. Do not summarize the found text. Quote it.
    3. If a regulation is triggered but the protective clause is missing, flag it as a violation using the provided Risk Analysis and Redline Fix texts.
    4. Output ONLY valid JSON. Do not use markdown blocks.

    REQUIRED JSON SCHEMA:
    {
      "riskLevel": "High" | "Medium" | "Low",
      "industryDetected": "e.g., IT Services, Professional Services, Construction, etc.",
      "criticalTraps": [
        {
          "regulation": "Name of regulation or clause type",
          "foundText": "Exact verbatim quote from the contract",
          "riskAnalysis": "Explanation of the risk (use provided rule text if applicable)",
          "redlineFix": "Recommended amendment (use provided rule text if applicable)"
        }
      ],
      "emailDraft": "A brief, professional pushback email referencing the flagged articles and requesting their amendment."
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
        temperature: 0.0 // Set to 0 to make it entirely deterministic
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