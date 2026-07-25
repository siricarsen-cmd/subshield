import { QA_D_CONSTRUCTION_DOCUMENT } from "../../analyzer/__fixtures__/core-accuracy-benchmark-fixtures.mjs";

// Exact clauses from the controlled QA-C fictional subcontract fixture that are
// required by the regulatory applicability benchmark. This is not a real
// contract and is never used to make a customer-facing conclusion.
export const QA_C_REGULATORY_DOCUMENT = `QA FIXTURE C - CYBER / CUI SUBCONTRACT PACKAGE

1.2 Prime expects Subcontractor personnel and systems to receive, create, process, transmit, or store Federal Contract Information and Controlled Unclassified Information, including Covered Defense Information.

1.3 The System Security Plan, CUI marking guide, network boundary diagram, data-flow map, and Prime cyber procedures are not attached at execution. Prime will provide or revise those materials after award as mission needs evolve.

2.1 Subcontractor shall comply with DFARS 252.204-7012, Safeguarding Covered Defense Information and Cyber Incident Reporting, and shall implement the security requirements of NIST SP 800-171 on every covered contractor information system.

2.2 Subcontractor shall also comply with DFARS 252.204-7002 and DFARS 252.204-7020, including assessments, access, and cooperation requested by the Government or Prime.

2.3 Subcontractor warrants that its current NIST SP 800-171 assessment score is 110 and will remain 110 throughout performance. Any score below 110 constitutes a material breach, regardless of an accepted plan of action and milestones.

2.4 Prime may add revised cybersecurity frameworks, agency directives, CMMC requirements, cloud-security controls, or customer procedures by email or portal posting. Each added requirement becomes binding upon notice without a price or schedule adjustment.

3.1 All information identified by Prime, the Government, or any customer representative as CUI shall be treated as CUI immediately, even if it is not marked and even if the designation is later disputed.

4.1 Subcontractor shall report any suspected cyber incident, compromise, unauthorized disclosure, malware event, lost device, anomalous access, or policy violation to Prime within eight hours after discovery or suspicion.

4.2 Subcontractor shall submit any required report to the DoD reporting portal within seventy-two hours and shall provide Prime the report number, all updates, and all information submitted to the Government.

4.3 Subcontractor shall preserve and protect images of affected information systems and all relevant monitoring or packet-capture data for at least ninety days after reporting, or longer if Prime directs.

6.1 Subcontractor shall flow down DFARS 252.204-7012 and all other cyber requirements identified by Prime to every lower-tier supplier that may handle covered information or support a covered system.`;

export const QA_REGULATORY_FIXTURE_DOCUMENTS = {
  "QA-C": QA_C_REGULATORY_DOCUMENT,
  "QA-D": QA_D_CONSTRUCTION_DOCUMENT,
};
