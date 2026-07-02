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

    // 3. AUDITOR PROMPT
    const systemPrompt = `You are an expert GovCon Subcontract Analyst. 
    
    --- JOB 1: REGULATORY TRIGGERS ---
    ${injectedRules ? injectedRules : "No federal codes detected."}

    --- JOB 2: COMMERCIAL RISK TRIGGERS (MANDATORY EVALUATION) ---
    You MUST evaluate the document text for ALL 6 of the following commercial traps. Mark "detected" as true if found, and extract the exact verbatim text.
    1. contingentPayment: MUST mark true if there is "no obligation to pay", "amounts not paid by Government", or payment contingent on Prime receiving funds.
    2. blanketFlowDowns: MUST mark true if the sub agrees to comply with clauses "whether included or later provided".
    3. vagueWorkshares: MUST mark true if workshare is an "estimate only", "does not guarantee specific hours", or "no guaranteed revenue".
    4. primeFavorableTermination: MUST mark true for short notice (e.g., "5 calendar days"), immediate termination rights, or waivers of closeout costs.
    5. unilateralChanges: MUST mark true if the sub must object within a short window (e.g., "3 business days") or if "failure to provide timely notice waives" rights.
    6. broadIndemnification: MUST mark true if the sub is required to indemnify or defend the prime for "alleged noncompliance", "negligence", or broad claims "arising out of performance".

    CRITICAL INSTRUCTIONS:
    - REDLINES MUST BE REALISTIC:
      - Termination: "Prime may terminate for convenience with at least 30 days' written notice. Subcontractor shall be paid for accepted work performed through the termination date and reasonable, documented closeout costs."
      - Changes: "Subcontractor shall have at least 10 business days to notify Prime of any direction that may affect scope, price, or schedule. No waiver shall apply unless Subcontractor knowingly agrees to the change in writing."
    - DO NOT output "N/A" for the industry. You must determine the closest professional sector based on the statement of work.
    - If a trap is NOT detected, set "detected" to false and fill the string fields with empty text. Do NOT use "N/A".`;

    // 4. THE STRICT STRUCTURED OUTPUTS SCHEMA
    const strictSchema = {
      name: "contract_analysis",
      strict: true,
      schema: {
        type: "object",
        properties: {
          riskLevel: {
            type: "string",
            enum: ["High", "Medium-High", "Medium", "Low"],
            description: "If 4 or more commercial traps are true, set to High. If 2 or 3, Medium-High."
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

    // 6. DATA PACKER (Hardcodes the proper titles to prevent "N/A" display errors)
    const primaryTraps = [];
    const secondaryConcerns = [];

    if (aiOutput.regulatoryTraps) {
      aiOutput.regulatoryTraps.forEach((trap: any) => {
        primaryTraps.push({ ...trap, triggerType: "Regulatory Trigger" });
      });
    }

    const evals = aiOutput.commercialEvaluations;
    
    if (evals.contingentPayment.detected) {
      primaryTraps.push({ ...evals.contingentPayment, triggerType: "Contract Risk Trigger", regulation: "Contingent Payment / Pay-if-Paid" });
    }
    if (evals.blanketFlowDowns.detected) {
      primaryTraps.push({ ...evals.blanketFlowDowns, triggerType: "Contract Risk Trigger", regulation: "Blanket Flow-Downs / Later-Issued Clauses" });
    }
    if (evals.vagueWorkshares.detected) {
      primaryTraps.push({ ...evals.vagueWorkshares, triggerType: "Contract Risk Trigger", regulation: "Vague Workshare / No Guaranteed Revenue" });
    }
    if (evals.primeFavorableTermination.detected) {
      primaryTraps.push({ ...evals.primeFavorableTermination, triggerType: "Contract Risk Trigger", regulation: "Prime-Favorable Termination Rights" });
    }

    if (evals.unilateralChanges.detected) {
      secondaryConcerns.push({ ...evals.unilateralChanges, triggerType: "Contract Risk Trigger", regulation: "Short Change-Notice Deadline / Waiver of Compensation Rights" });
    }
    if (evals.broadIndemnification.detected) {
      secondaryConcerns.push({ ...evals.broadIndemnification, triggerType: "Contract Risk Trigger", regulation: "Broad Indemnification / Defense Obligation" });
    }

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