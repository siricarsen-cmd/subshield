// Final standard-CI trigger after all Orion language and structure hardening.
export const ORION_PARITY_DOCUMENT = `
Government Subcontract Package - High-Risk Parity Fixture
Fictional document for SubShield testing only.
Prime Contractor Orion Federal Systems, LLC
Prime Contract Number DCT-26-C-4072
Subcontract Type Time-and-Materials with firm-fixed-price deliverables

2.3 Subcontract Type
This is a time-and-materials subcontract with firm-fixed-price deliverables where identified by Prime Contractor. Subcontractor will be paid for approved labor hours actually performed and accepted deliverables.

2.8 Invoice Requirements
Each invoice must include the subcontract number, invoice date, labor category, hours worked, rate, and supporting documentation. Invoices must be submitted within 7 calendar days after the end of each billing month. Failure to submit a complete invoice within 30 calendar days after the end of the billing month waives Subcontractor's right to payment for the affected amount unless Prime Contractor approves otherwise in writing.

2.17 Data Rights and Intellectual Property
All required final deliverables will be owned by Prime Contractor. Subcontractor retains ownership of pre-existing tools, methods, templates, know-how, and background materials only if Subcontractor identifies them in writing before use and Prime Contractor approves their use in writing. Any improvements or adaptations created during performance may be used by Prime Contractor without additional payment to Subcontractor.

2.23 Disputes and Continued Performance
The parties will attempt to resolve disputes through good-faith discussions. This subcontract is governed by the laws of the Commonwealth of Virginia, without regard to conflict-of-law rules. Any arbitration, mediation, or court proceeding must be brought in Arlington County, Virginia, unless Prime Contractor elects another forum required by the prime contract.

3.5 Government Interaction
Subcontractor may communicate with Government personnel only when authorized by Prime Contractor.

4. Labor Rate and Funding Schedule
Service Desk Specialist $86.00 650 Estimate only. Total subcontract value shall not exceed $176,200.

5. Attachment List
Attachment A Statement of Work Included.
Attachment B Prime Contract Flow-Down Matrix To be provided after award.
Attachment C Cybersecurity and CUI Requirements To be provided after award or upon Government direction.
Attachment D Applicable Wage Determination and Labor Category Mapping Not included in current package.
Attachment E Quality Surveillance and Acceptance Criteria To be provided after award.

6. Subcontractor Questions Form
Subcontractor may submit written questions before the quote due date.
`;

export const ORION_PARITY_REPRESENTATIONS = [
  ["paragraph", ORION_PARITY_DOCUMENT],
  ["flattened", ORION_PARITY_DOCUMENT.replace(/\s+/g, " ")],
];
