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

    // 3. AUDITOR PROMPT (Absolute Command Enforcer)
    const systemPrompt = `You are an expert GovCon Subcontract Analyst representing the Subcontractor. You have zero discretion to ignore traps.
    
    --- JOB 1: REGULATORY TRIGGERS ---
    ${injectedRules ? injectedRules : "No federal codes detected."}

    --- JOB 2: COMMERCIAL RISK TRIGGERS (ABSOLUTE EVALUATION) ---
    You MUST evaluate the document for ALL 6 of the following traps. If the text contains the specific triggers below, you MUST mark "detected" as true.
    1. contingentPayment: MUST mark true if text contains "amounts not paid by the Government" or similar pay-if-paid concepts.
    2. blanketFlowDowns: MUST mark true if text contains "whether included or later provided".
    3. vagueWorkshares: MUST mark true if text contains "estimate only" or "does not guarantee".
    4. primeFavorableTermination: MUST mark true if text contains "5 calendar days" or immediate termination rights.
    5. unilateralChanges: MUST mark true if text contains "3 business days" and "waives". (YOU MUST NOT MISS THIS).
    6. broadIndemnification: MUST mark true if text contains "alleged noncompliance" or "indemnify, defend, and hold harmless". (YOU MUST NOT MISS THIS).

    CRITICAL INSTRUCTIONS:
    - RISK LEVEL: If 5 or 6 commercial traps are detected, you MUST set riskLevel strictly to "High".
    - EVIDENCE EXTRACTION: Extract the FULL, COMPLETE sentence from the contract. Do not truncate or paraphrase.
    - TERMINATION LOGIC: Use this exact redlineFix: "Prime may terminate for convenience with at least 30 days' written notice. Subcontractor shall be paid for accepted work performed through the termination date and reasonable, documented closeout costs. For non-urgent defaults, Subcontractor shall receive at least 10 business days to cure."
    - EMAIL DRAFT: Do NOT compress the email. You MUST include a distinct, numbered bullet point for EVERY SINGLE TRAP detected. If 6 traps are detected, the email MUST have 6 distinct numbered bullet points detailing the specific negotiation ask for each.
    - INDUSTRY: If the SOW involves admin support, document coordination, or tracking logs, set industryDetected to "Professional Services / Administrative Support".
    - If a trap is NOT detected, set "detected" to false and fill string fields with empty text.`;

    // 4. STRUCTURED OUTPUTS SCHEMA
    const strictSchema = {
      name: "contract_analysis",
      strict: true,
      schema: {
        type: "object",
        properties: {
          riskLevel: {
            type: "string",
            enum: ["High", "Medium-High", "Medium", "Low"]
          },
          industryDetected: { type: "string" },
          regulatoryTraps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                regulation: { type: "string" },
                foundText: { type: "string" },
                riskAnalysis: { type: "string" },
                redlineFix: { type: "string" }
              },
              required: ["regulation", "foundText", "riskAnalysis", "redlineFix"],
              additionalProperties: false
            }
          },
          commercialEvaluations: {
            type: "object",
            properties: {
              contingentPayment: {
                type: "object",
                properties: { detected: { type: "boolean" }, regulation: { type: "string" }, foundText: { type: "string" }, riskAnalysis: { type: "string" }, redlineFix: { type: "string" } },
                required: ["detected", "regulation", "foundText", "riskAnalysis", "redlineFix"],
                additionalProperties: false
              },
              blanketFlowDowns: {
                type: "object",
                properties: { detected: { type: "boolean" }, regulation: { type: "string" }, foundText: { type: "string" }, riskAnalysis: { type: "string" }, redlineFix: { type: "string" } },
                required: ["detected", "regulation", "foundText", "riskAnalysis", "redlineFix"],
                additionalProperties: false
              },
              vagueWorkshares: {
                type: "object",
                properties: { detected: { type: "boolean" }, regulation: { type: "string" }, foundText: { type: "string" }, riskAnalysis: { type: "string" }, redlineFix: { type: "string" } },
                required: ["detected", "regulation", "foundText", "riskAnalysis", "redlineFix"],
                additionalProperties: false
              },
              primeFavorableTermination: {
                type: "object",
                properties: { detected: { type: "boolean" }, regulation: { type: "string" }, foundText: { type: "string" }, riskAnalysis: { type: "string" }, redlineFix: { type: "string" } },
                required: ["detected", "regulation", "foundText", "riskAnalysis", "redlineFix"],
                additionalProperties: false
              },
              unilateralChanges: {
                type: "object",
                properties: { detected: { type: "boolean" }, regulation: { type: "string" }, foundText: { type: "string" }, riskAnalysis: { type: "string" }, redlineFix: { type: "string" } },
                required: ["detected", "regulation", "foundText", "riskAnalysis", "redlineFix"],
                additionalProperties: false
              },
              broadIndemnification: {
                type: "object",
                properties: { detected: { type: "boolean" }, regulation: { type: "string" }, foundText: { type: "string" }, riskAnalysis: { type: "string" }, redlineFix: { type: "string" } },
                required: ["detected", "regulation", "foundText", "riskAnalysis", "redlineFix"],
                additionalProperties: false
              }
            },
            required: ["contingentPayment", "blanketFlowDowns", "vagueWorkshares", "primeFavorableTermination", "unilateralChanges", "broadIndemnification"],
            additionalProperties: false
          },
          emailDraft: { type: "string" }
        },
        required: ["riskLevel", "industryDetected", "regulatoryTraps", "commercialEvaluations", "emailDraft"],
        additionalProperties: false
      }
    };

    // 5. AI REQUEST
    const OPENAI_KEY = process.env.OPENAI_API_KEY;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: "json_schema", json_schema: strictSchema },
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

    // 6. DATA PACKER
    const primaryTraps = [];
    const secondaryConcerns = [];

    if (aiOutput.regulatoryTraps) {
      aiOutput.regulatoryTraps.forEach((trap: any) => {
        primaryTraps.push({ ...trap, triggerType: "Regulatory Trigger" });
      });
    }

    const evals = aiOutput.commercialEvaluations;
    
    if (evals.contingentPayment.detected) primaryTraps.push({ ...evals.contingentPayment, triggerType: "Contract Risk Trigger", regulation: "Contingent Payment / Pay-if-Paid" });
    if (evals.blanketFlowDowns.detected) primaryTraps.push({ ...evals.blanketFlowDowns, triggerType: "Contract Risk Trigger", regulation: "Blanket Flow-Downs / Later-Issued Clauses" });
    if (evals.vagueWorkshares.detected) primaryTraps.push({ ...evals.vagueWorkshares, triggerType: "Contract Risk Trigger", regulation: "Vague Workshare / No Guaranteed Revenue" });
    if (evals.primeFavorableTermination.detected) primaryTraps.push({ ...evals.primeFavorableTermination, triggerType: "Contract Risk Trigger", regulation: "Prime-Favorable Termination Rights" });

    if (evals.unilateralChanges.detected) secondaryConcerns.push({ ...evals.unilateralChanges, triggerType: "Contract Risk Trigger", regulation: "Short Change-Notice Deadline / Waiver of Compensation Rights" });
    if (evals.broadIndemnification.detected) secondaryConcerns.push({ ...evals.broadIndemnification, triggerType: "Contract Risk Trigger", regulation: "Broad Indemnification / Defense Obligation" });

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