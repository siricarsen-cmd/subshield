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

    // 2. REGEX PRE-FILTER
    const isSCA = /52\.222-41|Service Contract Labor Standards|Service Contract Act/i.test(documentText);
    const isCyber = /252\.204-7012|NIST SP 800-171|CMMC|Controlled Unclassified Information|CUI/i.test(documentText);
    const isOTA = /Other Transaction Authority|OTA|Prototype Agreement|Non-FAR Agreement/i.test(documentText);

    let injectedRules = "";
    if (isSCA) injectedRules += `- FAR 52.222-41 detected. Check for a Wage Determination attachment. If missing, flag as HIGH risk.\n`;
    if (isCyber) injectedRules += `- DFARS 252.204-7012 detected. Scan for clauses making the sub solely liable for cyber breach damages.\n`;
    if (isOTA) injectedRules += `- OTA framework detected. Check if the prime claims ownership of subcontractor's background IP.\n`;

    // 3. AUDITOR PROMPT (The Fixed-Schema Enforcer)
    const systemPrompt = `You are an expert GovCon Subcontract Analyst. 
    
    --- JOB 1: REGULATORY TRIGGERS ---
    ${injectedRules ? injectedRules : "No federal codes detected."}
    If regulatory triggers are listed above, you MUST evaluate them and add them to the "regulatoryTraps" array.

    --- JOB 2: COMMERCIAL RISK TRIGGERS (MANDATORY BOOLEAN EVALUATION) ---
    You MUST evaluate the document text for ALL 6 of the following commercial traps. You must mark "detected": true if you find matching language, and extract the exact text.
    1. contingentPayment: Look for "no obligation to pay", "amounts not paid by the Government", or payment contingent on Prime receiving funds.
    2. blanketFlowDowns: Look for agreements to comply with clauses "whether included or later provided".
    3. vagueWorkshares: Look for "estimate only", "does not guarantee specific hours", or "no guaranteed revenue".
    4. primeFavorableTermination: Look for "5 calendar days" notice, immediate termination rights, or waivers of unabsorbed overhead/closeout costs.
    5. unilateralChanges: Look for deadlines to object within "3 business days", or "failure to provide timely notice waives" rights.
    6. broadIndemnification: Look for requirements to indemnify for "alleged noncompliance" or broad "arising out of" language covering affiliates/customers.

    CRITICAL INSTRUCTIONS:
    - If 4 or more traps are detected overall, you MUST set riskLevel to "High".
    - You must evaluate every key in "commercialEvaluations". 
    - REDLINES MUST BE REALISTIC:
      - For Termination: "Prime may terminate for convenience with at least 30 days' written notice. Subcontractor shall be paid for accepted work performed through the termination date and reasonable, documented closeout costs."
      - For Changes: "Subcontractor shall have at least 10 business days to notify Prime of any direction that may affect scope, price, or schedule."

    REQUIRED JSON SCHEMA:
    {
      "riskLevel": "High" | "Medium-High" | "Medium" | "Low",
      "industryDetected": "e.g., IT Services, Professional Services, etc.",
      "regulatoryTraps": [
        { "regulation": "Name", "foundText": "...", "riskAnalysis": "...", "redlineFix": "..." }
      ],
      "commercialEvaluations": {
        "contingentPayment": { "detected": boolean, "regulation": "Contingent Payment Mechanism", "foundText": "...", "riskAnalysis": "...", "redlineFix": "..." },
        "blanketFlowDowns": { "detected": boolean, "regulation": "Blanket Flow-Downs", "foundText": "...", "riskAnalysis": "...", "redlineFix": "..." },
        "vagueWorkshares": { "detected": boolean, "regulation": "Vague Workshare", "foundText": "...", "riskAnalysis": "...", "redlineFix": "..." },
        "primeFavorableTermination": { "detected": boolean, "regulation": "Prime-Favorable Termination Rights", "foundText": "...", "riskAnalysis": "...", "redlineFix": "..." },
        "unilateralChanges": { "detected": boolean, "regulation": "Short Change-Notice Deadline / Waiver of Rights", "foundText": "...", "riskAnalysis": "...", "redlineFix": "..." },
        "broadIndemnification": { "detected": boolean, "regulation": "Broad Indemnification", "foundText": "...", "riskAnalysis": "...", "redlineFix": "..." }
      },
      "emailDraft": "Firm, collaborative email referencing ALL detected traps."
    }`;

    // 4. AI REQUEST
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

    // 5. DATA PACKER (Transforms the fixed boolean object into the arrays the UI expects)
    const primaryTraps = [];
    const secondaryConcerns = [];

    // Map regulatory traps if any exist
    if (aiOutput.regulatoryTraps) {
      aiOutput.regulatoryTraps.forEach((trap: any) => {
        primaryTraps.push({ triggerType: "Regulatory Trigger", ...trap });
      });
    }

    // Map the boolean commercial evaluations
    const evals = aiOutput.commercialEvaluations || {};
    
    if (evals.contingentPayment?.detected) primaryTraps.push({ triggerType: "Contract Risk Trigger", ...evals.contingentPayment });
    if (evals.blanketFlowDowns?.detected) primaryTraps.push({ triggerType: "Contract Risk Trigger", ...evals.blanketFlowDowns });
    if (evals.vagueWorkshares?.detected) primaryTraps.push({ triggerType: "Contract Risk Trigger", ...evals.vagueWorkshares });
    if (evals.primeFavorableTermination?.detected) primaryTraps.push({ triggerType: "Contract Risk Trigger", ...evals.primeFavorableTermination });

    if (evals.unilateralChanges?.detected) secondaryConcerns.push({ triggerType: "Contract Risk Trigger", ...evals.unilateralChanges });
    if (evals.broadIndemnification?.detected) secondaryConcerns.push({ triggerType: "Contract Risk Trigger", ...evals.broadIndemnification });

    // Reconstruct the final payload for the frontend
    const finalResult = {
      riskLevel: aiOutput.riskLevel,
      industryDetected: aiOutput.industryDetected,
      primaryTraps: primaryTraps,
      secondaryConcerns: secondaryConcerns,
      emailDraft: aiOutput.emailDraft
    };

    return NextResponse.json({ result: finalResult });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}