// Focused Fixture C regression corpus for cyber/CUI grounding and coverage.
// These clause-level constants mirror the controlled QA clauses and are
// assembled into a single targeted document for the production analyzer path.

export const DFARS_NIST_CYBER_CLAUSE =
  "REQUIRED CYBER FRAMEWORKS 2.1 Subcontractor shall comply with DFARS 252.204-7012, Safeguarding Covered Defense Information and Cyber Incident Reporting, and shall implement the security requirements of NIST SP 800-171 on every covered contractor information system.";

export const MISSING_CYBER_DOCUMENTS_CLAUSE =
  "1.3 The System Security Plan, CUI marking guide, network boundary diagram, data-flow map, and Prime cyber procedures are not attached at execution. Prime will provide or revise those materials after award as mission needs evolve.";

export const FUTURE_CYBER_REQUIREMENTS_CLAUSE =
  "2.4 Prime may add revised cybersecurity frameworks, agency directives, CMMC requirements, cloud-security controls, or customer procedures by email or portal posting. Each added requirement becomes binding upon notice without a price or schedule adjustment.";

export const BILATERAL_CYBER_AMENDMENT_CLAUSE =
  "2.5 Any revised cybersecurity requirements, agency directives, or customer procedures become effective only upon a mutually signed amendment and a price or schedule adjustment agreed by both parties.";

export const CYBER_SCOPE_CLAUSE =
  "2.2 The parties shall identify covered systems and controlled information before work begins.";

export const CYBER_COORDINATION_CLAUSE =
  "2.3 Subcontractor shall maintain current points of contact for routine security coordination.";

export const ATTACHED_CYBER_DOCUMENTS_CLAUSE =
  "1.4 The System Security Plan, CUI marking guide, network boundary diagram, data-flow map, and Prime security procedures are attached at execution.";

export const ATTACHED_REVISABLE_CYBER_DOCUMENT_CLAUSE =
  "1.5 The attached System Security Plan may be revised after award through a mutually signed amendment.";

export const SHORT_INCIDENT_REPORTING_CLAUSE =
  "4.1 Subcontractor shall report any suspected cyber incident, compromise, unauthorized disclosure, malware event, lost device, anomalous access, or policy violation to Prime within eight hours after discovery or suspicion.";

export const PRIME_DIRECTED_RESPONSE_COSTS_CLAUSE =
  "4.4 Prime may direct containment, isolation, credential reset, system shutdown, evidence collection, employee interviews, forensic imaging, customer notification, or restoration actions. Subcontractor shall comply immediately and bear all associated cost.";

export const INCIDENT_CONTACT_UPDATE_CLAUSE =
  "4.3 Subcontractor shall keep its incident-response contact list current and test the listed telephone numbers quarterly.";

export const PRIME_DIRECTED_IMMEDIATE_RESPONSE_CLAUSE =
  "4.5 Prime may direct containment, credential reset, or evidence collection following a cyber incident. Subcontractor shall comply immediately.";

export const CYBER_AUDIT_ACCESS_CLAUSE =
  "5.1 Prime, the Government, and their designees may conduct announced or unannounced cybersecurity assessments of Subcontractor systems, facilities, personnel, policies, and lower-tier suppliers at any time.";

export const CYBER_AUDIT_EVIDENCE_CLAUSE =
  "5.2 Subcontractor shall provide administrative access, network diagrams, System Security Plans, plans of action and milestones, vulnerability scans, penetration-test results, security logs, training records, incident records, and other requested evidence without additional charge.";
export const CYBER_AUDIT_EVIDENCE_WITH_PRODUCTION_FOOTER =
  `${CYBER_AUDIT_EVIDENCE_CLAUSE} -- 1 of 2 -- QA-C | Fictional Test Document | Page 2`;

export const CYBER_REMEDIATION_CONTEXT_CLAUSE =
  "5.3 If Prime determines that Subcontractor's cybersecurity posture is deficient, Prime may issue a remediation directive or suspend affected system access.";

export const REMEDIATION_NO_EQ_ADJUSTMENT_CLAUSE =
  "5.4 A suspension or remediation directive does not excuse schedule performance and does not entitle Subcontractor to an equitable adjustment.";

export const PAYMENT_HOLDING_CLAUSE =
  "8.1 Prime may withhold up to twenty percent of any invoice until Subcontractor provides all cyber evidence requested for the billing period.";

export const ALL_PAYMENT_WITHHOLDING_CLAUSE =
  "8.2 Prime may withhold all payment during an incident investigation, an assessment dispute, a score deficiency, or a suspected failure to flow down requirements.";

export const WITHHOLDING_CONTINUED_PERFORMANCE_CLAUSE =
  "8.3 Withholding does not relieve Subcontractor from continued performance, incident response, remediation, or reporting obligations.";

export const CONTINUED_PERFORMANCE_SELF_FINANCING_CLAUSE =
  "10.3 Pending any dispute or investigation, Subcontractor shall continue performance, finance all required remediation, and follow Prime direction without delaying mission work.";

export const BROAD_CYBER_INDEMNITY_CLAUSE =
  "9.1 Subcontractor shall indemnify, defend, and hold harmless Prime, the Government, and their personnel from all claims, losses, response costs, notification costs, credit monitoring, forensic costs, restoration expenses, penalties, damages, and attorneys' fees arising from an actual or suspected cyber incident involving Subcontractor or a lower-tier supplier.";
export const BROAD_CYBER_INDEMNITY_WITH_HEADING_CLAUSE =
  `CYBER INDEMNITY AND COST ALLOCATION ${BROAD_CYBER_INDEMNITY_CLAUSE}`;

export const CYBER_INDEMNITY_WITH_PRIME_CONTRIBUTION_CLAUSE =
  "9.1 Subcontractor shall indemnify, defend, and hold harmless Prime, the Government, and their personnel from all claims, losses, response costs, notification costs, credit monitoring, forensic costs, restoration expenses, penalties, damages, and attorneys' fees arising from an actual or suspected cyber incident involving Subcontractor or a lower-tier supplier. 9.2 The cyber indemnity applies regardless of whether Prime directed the system architecture, approved a supplier, reviewed the controls, or contributed to the incident, except to the extent prohibited by law.";

export const UNCAPPED_CYBER_LIABILITY_CLAUSE =
  "9.3 No limitation of liability applies to cybersecurity, confidentiality, data handling, incident reporting, intellectual property, or indemnity obligations.";

export const CYBER_INDEMNITY_PRIME_CONTRIBUTION_CLAUSE =
  "9.2 The cyber indemnity applies regardless of whether Prime directed the system architecture, approved a supplier, reviewed the controls, or contributed to the incident, except to the extent prohibited by law.";

export const IMMEDIATE_NO_CURE_TERMINATION_CLAUSE =
  "10.1 Prime may terminate immediately, without any right to cure, if Prime believes Subcontractor presents an unacceptable cyber risk, reports an incident late, fails an assessment, or does not provide requested access.";
export const IMMEDIATE_NO_CURE_TERMINATION_WITH_HEADING_CLAUSE =
  `TERMINATION AND CONTINUED PERFORMANCE ${IMMEDIATE_NO_CURE_TERMINATION_CLAUSE}`;

export const FIVE_DAY_TERMINATION_FOR_CONVENIENCE_CLAUSE =
  "10.2 Prime may terminate for convenience on five calendar days notice and is not liable for unabsorbed overhead, demobilization, security investments, unused licenses, or profit on unperformed work.";

export const ORDINARY_REPORTING_CLAUSE =
  "4.2 Subcontractor shall report any suspected cyber incident to Prime within a reasonable period after discovery.";

export const ORDINARY_INVOICE_TIMING_CLAUSE =
  "Prime shall pay each proper Subcontractor invoice within 30 days after receipt.";

export const NET_TWENTY_INVOICE_TIMING_CLAUSE =
  "Prime shall pay each correct Subcontractor invoice within 20 days after receipt.";

export const UNRELATED_EIGHT_HOURS_CLAUSE =
  "Personnel shall submit completed time sheets within eight hours after the end of each work week.";

export const UNRELATED_COMPLY_IMMEDIATELY_CLAUSE =
  "Subcontractor shall comply immediately with lawful delivery instructions for accepted supplies.";

export const UNRELATED_BEAR_ASSOCIATED_COST_CLAUSE =
  "Subcontractor shall bear all associated cost of routine packaging and domestic freight.";

export const GENERIC_NON_CYBER_INDEMNITY_CLAUSE =
  "Subcontractor shall indemnify, defend, and hold harmless Prime from third-party claims arising from Subcontractor's negligent performance of the work.";

export const FRAUD_ONLY_UNCAPPED_LIABILITY_CLAUSE =
  "No limitation of liability applies to fraud.";

export const ORDINARY_SCHEDULED_AUDIT_CLAUSE =
  "Prime may conduct one scheduled annual audit on ten business days written notice, limited to defined billing records relevant to this Subcontract.";

export const COMPENSATED_REMEDIATION_CLAUSE =
  "The parties shall negotiate a remediation plan, and any Prime-directed change to schedule or scope will receive an equitable price and schedule adjustment.";

export const ORDINARY_CURE_TERMINATION_CLAUSE =
  "Either party may terminate for material breach only after detailed written notice and thirty calendar days to cure.";

export const CMMC_ONLY_CLAUSE =
  "Subcontractor shall maintain CMMC Level 2 for the covered systems used to perform this Subcontract.";

export const PROTECTIVE_BILATERAL_AMENDMENT_CLAUSE =
  "Any changes to this subcontract must be in a signed written amendment by both parties.";

const FULL_FIXTURE_C_CLAUSES = [
  MISSING_CYBER_DOCUMENTS_CLAUSE,
  DFARS_NIST_CYBER_CLAUSE,
  CYBER_SCOPE_CLAUSE,
  CYBER_COORDINATION_CLAUSE,
  FUTURE_CYBER_REQUIREMENTS_CLAUSE,
  BILATERAL_CYBER_AMENDMENT_CLAUSE,
  SHORT_INCIDENT_REPORTING_CLAUSE,
  ORDINARY_REPORTING_CLAUSE,
  INCIDENT_CONTACT_UPDATE_CLAUSE,
  PRIME_DIRECTED_RESPONSE_COSTS_CLAUSE,
  CYBER_AUDIT_ACCESS_CLAUSE,
  CYBER_AUDIT_EVIDENCE_CLAUSE,
  CYBER_REMEDIATION_CONTEXT_CLAUSE,
  REMEDIATION_NO_EQ_ADJUSTMENT_CLAUSE,
  PAYMENT_HOLDING_CLAUSE,
  ALL_PAYMENT_WITHHOLDING_CLAUSE,
  WITHHOLDING_CONTINUED_PERFORMANCE_CLAUSE,
  BROAD_CYBER_INDEMNITY_CLAUSE,
  CYBER_INDEMNITY_PRIME_CONTRIBUTION_CLAUSE,
  UNCAPPED_CYBER_LIABILITY_CLAUSE,
  IMMEDIATE_NO_CURE_TERMINATION_CLAUSE,
  FIVE_DAY_TERMINATION_FOR_CONVENIENCE_CLAUSE,
  CONTINUED_PERFORMANCE_SELF_FINANCING_CLAUSE,
];

function wrapExtractedClause(clause, width = 78) {
  const words = clause.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (line && `${line} ${word}`.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.join("\r\n");
}

export const FIXTURE_C_BLANK_LINE_DOCUMENT = FULL_FIXTURE_C_CLAUSES.join("\n\n");
export const FIXTURE_C_SINGLE_NEWLINE_DOCUMENT = FULL_FIXTURE_C_CLAUSES.join("\n");
export const FIXTURE_C_FLATTENED_PASTE_DOCUMENT = FULL_FIXTURE_C_CLAUSES.join(" ");

const footerInsertionIndex = FULL_FIXTURE_C_CLAUSES.indexOf(CYBER_AUDIT_EVIDENCE_CLAUSE) + 1;
export const FIXTURE_C_PDF_STYLE_DOCUMENT = [
  ...FULL_FIXTURE_C_CLAUSES.slice(0, footerInsertionIndex).map((clause) => wrapExtractedClause(clause)),
  "\fSUBSHIELD CYBER TERMS | Page 5 of 12\f",
  ...FULL_FIXTURE_C_CLAUSES.slice(footerInsertionIndex).map((clause) => wrapExtractedClause(clause)),
].join("\r\n");

// Literal production-shaped extraction for report 124. Unlike the synthetic
// PDF-style representation above, this preserves the real structural features
// that affected production: standalone top-level headings, the actual plain-
// text footer without form feeds, and the exact section 4.4 wording/wrap.
export const FIXTURE_C_PRODUCTION_PDF_TEXT = `1. INCORPORATION AND DEFERRED DOCUMENTS
1.3 The System Security Plan, CUI marking guide, network boundary diagram, data-flow map, and Prime cyber procedures are not attached at execution. Prime will provide or revise those materials after award as mission needs evolve.
2. REQUIRED CYBER FRAMEWORKS
2.1 Subcontractor shall comply with DFARS 252.204-7012, Safeguarding Covered Defense Information and Cyber Incident Reporting, and shall implement the security requirements of NIST SP 800-171 on every covered contractor information system.
2.2 The parties shall identify covered systems and controlled information before work begins.
2.3 Subcontractor shall maintain current points of contact for routine security coordination.
2.4 Prime may add revised cybersecurity frameworks, agency directives, CMMC requirements, cloud-security controls, or customer procedures by email or portal posting. Each added requirement becomes binding upon notice without a price or schedule adjustment.
2.5 Any revised cybersecurity requirements, agency directives, or customer procedures become effective only upon a mutually signed amendment and a price or schedule adjustment agreed by both parties.
3. CUI AND DATA HANDLING
3.1 Subcontractor shall use the marking and handling methods stated in the documents provided for the covered work.
4. CYBER INCIDENT REPORTING AND RESPONSE
4.1 Subcontractor shall report any suspected cyber incident, compromise, unauthorized disclosure, malware event, lost device, anomalous access, or policy violation to Prime within eight hours after discovery or suspicion.
4.2 Subcontractor shall report any suspected cyber incident to Prime within a reasonable period after discovery.
4.3 Subcontractor shall keep its incident-response contact list current and test the listed telephone numbers quarterly.
4.4 Prime may direct containment, isolation, credential reset, system shutdown, evidence collection, employee interviews, forensic imaging, customer notification, or restoration actions. Subcontractor shall comply immediately and bear all associated
cost.
5. CYBERSECURITY ASSESSMENTS, ACCESS, AND REMEDIATION
5.1 Prime, the Government, and their designees may conduct announced or unannounced cybersecurity assessments of Subcontractor systems, facilities, personnel, policies, and lower-tier suppliers at any time.
5.2 Subcontractor shall provide administrative access, network diagrams, System Security Plans, plans of action and milestones, vulnerability scans, penetration-test results, security logs, training records, incident records, and other requested evidence without additional charge.
-- 1 of 2 -- QA-C | Fictional Test Document | Page 2
5.3 If Prime determines that Subcontractor's cybersecurity posture is deficient, Prime may issue a remediation directive or suspend affected system access.
5.4 A suspension or remediation directive does not excuse schedule performance and does not entitle Subcontractor to an equitable adjustment.
6. LOWER-TIER FLOWDOWNS AND SUPPLY CHAIN
6.1 Subcontractor shall maintain current contact information for each approved lower-tier supplier.
7. CONTRACT ADMINISTRATION
7.1 The parties shall use the notice addresses stated in this Subcontract for routine administration.
8. PAYMENT WITHHOLDING AND CONTINUED PERFORMANCE
8.1 Prime may withhold up to twenty percent of any invoice until Subcontractor provides all cyber evidence requested for the billing period.
8.2 Prime may withhold all payment during an incident investigation, an assessment dispute, a score deficiency, or a suspected failure to flow down requirements.
8.3 Withholding does not relieve Subcontractor from continued performance, incident response, remediation, or reporting obligations.
9. CYBER INDEMNITY AND COST ALLOCATION
9.1 Subcontractor shall indemnify, defend, and hold harmless Prime, the Government, and their personnel from all claims, losses, response costs, notification costs, credit monitoring, forensic costs, restoration expenses, penalties, damages, and attorneys' fees arising from an actual or suspected cyber incident involving Subcontractor or a lower-tier supplier.
9.2 The cyber indemnity applies regardless of whether Prime directed the system architecture, approved a supplier, reviewed the controls, or contributed to the incident, except to the extent prohibited by law.
9.3 No limitation of liability applies to cybersecurity, confidentiality, data handling, incident reporting, intellectual property, or indemnity obligations.
10. TERMINATION AND CONTINUED PERFORMANCE
10.1 Prime may terminate immediately, without any right to cure, if Prime believes Subcontractor presents an unacceptable cyber risk, reports an incident late, fails an assessment, or does not provide requested access.
10.2 Prime may terminate for convenience on five calendar days notice and is not liable for unabsorbed overhead, demobilization, security investments, unused licenses, or profit on unperformed work.
10.3 Pending any dispute or investigation, Subcontractor shall continue performance, finance all required remediation, and follow Prime direction without delaying mission work.
11. SURVIVAL AND ACKNOWLEDGMENT
11.1 The parties acknowledge the obligations stated in this Subcontract.`;

// Report 125's extracted text retained the uppercase titles immediately before
// subsections 2.1, 9.1, and 10.1 but omitted their top-level integer prefixes.
// The operative clauses and production footer remain otherwise identical to
// the report-124 production-shaped fixture above.
export const FIXTURE_C_REPORT_125_EXTRACTED_TEXT = FIXTURE_C_PRODUCTION_PDF_TEXT
  .replace("2. REQUIRED CYBER FRAMEWORKS", "REQUIRED CYBER FRAMEWORKS")
  .replace("9. CYBER INDEMNITY AND COST ALLOCATION", "CYBER INDEMNITY AND COST ALLOCATION")
  .replace("10. TERMINATION AND CONTINUED PERFORMANCE", "TERMINATION AND CONTINUED PERFORMANCE");

export const FIXTURE_C_TARGETED_DOCUMENT = FIXTURE_C_BLANK_LINE_DOCUMENT;
