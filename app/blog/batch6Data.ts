import type { Post } from "./articleData";

export interface Batch6Section {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  source?: { label: string; url: string };
}

export interface Batch6Article {
  title: string;
  description: string;
  category: string;
  date: string;
  dek: string;
  intro: string[];
  sections: Batch6Section[];
  related: { href: string; label: string }[];
  ctaTitle: string;
  ctaBody: string;
}

export const batch6Articles = {
  "dfars-252-204-7012-subcontractors": {
    title: "DFARS 252.204-7012 for Subcontractors: What the Clause Actually Requires",
    description: "Understand DFARS 252.204-7012 safeguarding, cyber incident reporting, media preservation, cloud-provider, and subcontract flowdown duties before accepting DoD work.",
    category: "Cybersecurity & DFARS",
    date: "Aug 22, 2026",
    dek: "DFARS 252.204-7012 is more than a NIST reference. It combines safeguarding, reporting, evidence-preservation, cloud, and lower-tier obligations that can materially change a subcontractor's risk.",
    intro: [
      "DoD subcontract packages often include DFARS 252.204-7012 with little explanation. A subcontractor should determine why the clause is present, whether performance will involve covered defense information or operationally critical support, and which company systems will actually handle that information.",
      "The clause should be reviewed together with CMMC, NIST SP 800-171, incident-response, cloud-service, and lower-tier supplier obligations rather than treated as a stand-alone cyber exhibit."
    ],
    sections: [
      {
        heading: "Know why 7012 is in the package",
        paragraphs: ["DFARS 252.204-7012 requires adequate security on covered contractor information systems and contains cyber incident reporting and subcontract flowdown duties. The current clause defines rapid reporting as within 72 hours of discovery of a cyber incident."],
        source: { label: "DFARS 252.204-7012 — Safeguarding Covered Defense Information and Cyber Incident Reporting", url: "https://www.acquisition.gov/dfars/252.204-7012-safeguarding-covered-defense-information-and-cyber-incident-reporting." }
      },
      {
        heading: "Map the operational obligations before signing",
        bullets: [
          "Identify the systems that will process, store, or transmit covered defense information.",
          "Confirm the applicable NIST SP 800-171 and CMMC posture for those systems.",
          "Know who can submit a DoD cyber incident report and who receives the report number.",
          "Review the 90-day preservation obligation for affected system images and monitoring data after a report.",
          "Check cloud-service requirements if covered defense information will be hosted outside company-controlled infrastructure.",
          "Identify lower-tier suppliers that will receive covered defense information and require the clause."
        ]
      },
      {
        heading: "Do not accept undefined prime procedures by reference",
        paragraphs: ["A prime may add its own cyber portal, reporting form, incident-notification deadline, supplier questionnaire, or approved-cloud requirement. Obtain those documents before award and compare them with the DFARS baseline. A promise to follow all current and future prime cyber procedures can create obligations that were not priced or technically assessed."]
      },
      {
        heading: "Tie 7012 to the information flow",
        paragraphs: ["The practical question is not whether the company works for DoD in general. It is what information this subcontract will require the company and its lower tiers to handle. A clean pre-award review identifies the data, systems, users, suppliers, and contract clauses together so the cybersecurity promise matches the actual performance model."]
      }
    ],
    related: [
      { href: "/blog/cmmc-requirements-dod-subcontractors-2026", label: "CMMC Requirements for DoD Subcontractors in 2026" },
      { href: "/blog/fci-vs-cui-dod-subcontractors", label: "FCI vs. CUI for DoD Subcontractors" },
      { href: "/blog/cmmc-flowdown-lower-tier-subcontractors", label: "CMMC Flowdown to Lower-Tier Subcontractors" }
    ],
    ctaTitle: "Map the Cyber Flowdowns Before Award",
    ctaBody: "SubPreCheck can surface DFARS cyber clauses, missing procedures, lower-tier duties, and data-handling assumptions before you commit."
  },
  "dod-cyber-incident-reporting-72-hours": {
    title: "DoD Cyber Incident Reporting: The 72-Hour Rule Federal Subcontractors Should Know",
    description: "Review the 72-hour DFARS cyber incident reporting rule, evidence preservation, malicious-software handling, prime notification, and pre-incident preparation for subcontractors.",
    category: "Cybersecurity & DFARS",
    date: "Aug 22, 2026",
    dek: "A 72-hour reporting clock is not the time to discover who owns the incident-response process, what systems are covered, or how the prime expects to be notified.",
    intro: [
      "For subcontractors subject to DFARS 252.204-7012, cyber incident response is partly a contract-administration process. The company may need to investigate affected systems, report rapidly to DoD, preserve technical evidence, and communicate the assigned incident report number upstream.",
      "Those obligations are much easier to satisfy when responsibility, access, credentials, escalation paths, and evidence-preservation procedures are established before an incident occurs."
    ],
    sections: [
      {
        heading: "The reporting window is 72 hours",
        paragraphs: ["DFARS 252.204-7012 defines rapidly report as within 72 hours of discovery. The clause requires review for evidence of compromise and reporting of qualifying cyber incidents to DoD."],
        source: { label: "DFARS 252.204-7012 — Cyber Incident Reporting", url: "https://www.acquisition.gov/dfars/252.204-7012-safeguarding-covered-defense-information-and-cyber-incident-reporting." }
      },
      {
        heading: "Reporting is only one part of the response",
        bullets: [
          "Identify compromised computers, servers, data, and user accounts as required by the clause.",
          "Preserve affected system images and relevant monitoring or packet-capture data for at least 90 days after the report.",
          "Follow DoD instructions for malicious software rather than sending malicious code to the contracting officer.",
          "Provide the DoD-assigned incident report number to the next higher-tier contractor as soon as practicable when required.",
          "Preserve contract, data-flow, and system records that help determine which covered information was involved."
        ]
      },
      {
        heading: "Prime notification may be faster than the DFARS clock",
        paragraphs: ["Some prime-drafted subcontracts require notice to the prime within hours of discovery, even though the federal reporting deadline is 72 hours. That may be operationally reasonable, but the subcontractor should identify the exact trigger, recipient, format, and whether preliminary notice can be updated as facts develop."]
      },
      {
        heading: "Prepare the contract side of incident response",
        paragraphs: ["Incident-response planning should include a contract matrix showing which active subcontracts contain DFARS 252.204-7012, what information each project handles, which systems are in scope, which primes must be notified, and who is authorized to communicate externally. That prevents a technical incident from becoming a contract-notice failure."]
      }
    ],
    related: [
      { href: "/blog/dfars-252-204-7012-subcontractors", label: "DFARS 252.204-7012 for Subcontractors" },
      { href: "/blog/cmmc-level-1-vs-level-2", label: "CMMC Level 1 vs. Level 2" },
      { href: "/blog/subcontract-notice-deadlines", label: "Federal Subcontract Notice Deadlines" }
    ],
    ctaTitle: "Know the Reporting Clock Before an Incident",
    ctaBody: "SubPreCheck can flag cyber-reporting timelines, incorporated prime procedures, and missing incident-response documents before award."
  },
  "cmmc-supplier-questionnaire-subcontractors": {
    title: "CMMC Supplier Questionnaires: What a DoD Subcontractor Should Verify Before Answering",
    description: "Use CMMC supplier questionnaires carefully by tying answers to actual FCI/CUI handling, system boundaries, current CMMC status, and the subcontract's real flowdown requirements.",
    category: "Cybersecurity & CMMC",
    date: "Aug 22, 2026",
    dek: "A supplier questionnaire can become a written representation about systems, certifications, and security practices. Answer the contract question first: what information will this subcontract actually require you to handle?",
    intro: [
      "Primes increasingly use supplier questionnaires to determine whether a lower-tier company can receive work involving FCI or CUI. The questionnaire may ask about CMMC status, SPRS records, NIST implementation, cloud providers, incident response, and subcontractor controls.",
      "The safest process is to reconcile the questionnaire with the actual solicitation or subcontract. A company should not represent that every system, site, or product line meets a requirement when only a defined enclave or information system is intended for the work."
    ],
    sections: [
      {
        heading: "CMMC status is tied to systems and information",
        paragraphs: ["DFARS 252.204-7021 requires the contractor to maintain the required CMMC status for information systems used in performance that process, store, or transmit FCI or CUI. It also requires the correct level to be flowed to qualifying lower-tier subcontracts."],
        source: { label: "DFARS 252.204-7021 — CMMC Level Requirements", url: "https://www.acquisition.gov/dfars/252.204-7021-contractor-compliance-cybersecurity-maturity-model-certification-level-requirements." }
      },
      {
        heading: "Questions to resolve before submitting the form",
        bullets: [
          "Will this subcontract involve FCI, CUI, both, or neither?",
          "Which company information system or enclave will perform the work?",
          "What CMMC level and assessment type is required for that system?",
          "Is the CMMC status and annual affirmation current for the applicable UID?",
          "Are any questionnaire questions asking for broader enterprise-wide representations than the subcontract requires?",
          "Will any lower-tier supplier process, store, or transmit the same information?"
        ]
      },
      {
        heading: "Do not let a questionnaire silently expand the subcontract",
        paragraphs: ["A questionnaire should support qualification, not become an uncontrolled source of new obligations. Check whether the subcontract incorporates the completed form, requires continuing accuracy, allows unilateral questionnaire updates, or treats an answer as a warranty. Material representations about cybersecurity should be reviewed for accuracy before submission."]
      },
      {
        heading: "Keep the evidence behind each answer",
        paragraphs: ["Maintain a short evidence file for material questionnaire responses: the applicable CMMC UID or status, assessment date, system boundary, relevant policy or procedure, and the person responsible for the response. That makes later annual updates and prime audits more reliable and reduces inconsistent answers across customers."]
      }
    ],
    related: [
      { href: "/blog/cmmc-requirements-dod-subcontractors-2026", label: "CMMC Requirements for DoD Subcontractors in 2026" },
      { href: "/blog/fci-vs-cui-dod-subcontractors", label: "FCI vs. CUI" },
      { href: "/blog/missing-prime-contract-documents", label: "Missing Prime Contract Documents" }
    ],
    ctaTitle: "Match the Questionnaire to the Contract",
    ctaBody: "SubPreCheck can surface CMMC flowdowns, incorporated questionnaires, and information-handling assumptions that should be resolved before signature."
  },
  "lower-tier-far-dfars-flowdowns": {
    title: "Lower-Tier FAR and DFARS Flowdowns: What Must a Subcontractor Pass Down?",
    description: "Learn how lower-tier flowdowns work, why not every prime-contract clause automatically belongs in every purchase order, and how to build a defensible supplier flowdown process.",
    category: "FAR & DFARS Flowdowns",
    date: "Aug 22, 2026",
    dek: "Once you become a subcontractor, you may also become a flowing-down party. The same question you asked your prime now applies to your own suppliers: which clauses actually belong downstream?",
    intro: [
      "Federal flowdowns do not stop at first-tier subcontractors. Some clauses expressly require inclusion at lower tiers, sometimes based on dollar value, period of performance, type of work, information handled, or the nature of the product or service.",
      "A defensible lower-tier process starts with the actual clauses in the prime-provided package, identifies express subcontract paragraphs and applicability triggers, and then adds only the commercial protections the company intentionally wants in its own purchase orders."
    ],
    sections: [
      {
        heading: "Some clauses expressly reach all or qualifying tiers",
        paragraphs: ["FAR 52.244-6 contains a defined list of clauses for commercial product and commercial service subcontracts and requires additional lower-tier flowdown where the listed clause itself says so. DFARS cyber and CMMC clauses contain their own subcontract rules."],
        source: { label: "FAR 52.244-6 — Subcontracts for Commercial Products and Commercial Services", url: "https://www.acquisition.gov/far/52.244-6" }
      },
      {
        heading: "Build a clause-by-clause lower-tier matrix",
        bullets: [
          "Clause number and current date or version.",
          "Reason the clause applies to the prime or first-tier subcontract.",
          "Express subcontract paragraph and required substance, if any.",
          "Dollar, product, service, information, location, or performance trigger.",
          "Required lower-tier depth: first lower tier only or additional tiers.",
          "Documents, certifications, systems, or reporting processes needed to comply."
        ]
      },
      {
        heading: "Do not copy the entire prime contract into every purchase order",
        paragraphs: ["Over-flowing can create unnecessary obligations and confusion just as under-flowing can create a compliance gap. For example, a supplier providing a simple item may not need operational clauses written for services performed on a Government installation. Applicability should be determined rather than assumed."]
      },
      {
        heading: "Coordinate procurement and contract administration",
        paragraphs: ["The flowdown matrix should drive supplier onboarding, purchase-order templates, cyber questionnaires, quality requirements, and closeout records. A clause that requires a report, certification, insurance document, or CMMC status is not fully implemented merely because its text appears in the purchase order."]
      }
    ],
    related: [
      { href: "/blog/far-flowdown-matrix", label: "What Is a FAR Flowdown Matrix?" },
      { href: "/blog/mandatory-vs-optional-far-flowdowns", label: "Mandatory vs. Optional FAR Flowdowns" },
      { href: "/blog/far-52-244-6-commercial-subcontracts", label: "FAR 52.244-6 Explained" }
    ],
    ctaTitle: "Map What You Must Pass Down",
    ctaBody: "SubPreCheck can identify express lower-tier flowdowns and the supporting documents or procedures they may require."
  },
  "mutatis-mutandis-flowdown-clauses": {
    title: "Mutatis Mutandis in Federal Subcontracts: What Does the Flowdown Language Mean?",
    description: "Understand mutatis mutandis and party-substitution language in federal subcontracts, including why a blanket substitution rule can create ambiguity across FAR and DFARS clauses.",
    category: "FAR & DFARS Flowdowns",
    date: "Aug 22, 2026",
    dek: "A clause that says prime-contract terms apply mutatis mutandis may sound efficient, but the real question is which references change, which do not, and whether the result still makes sense in a private subcontract.",
    intro: [
      "Some prime-drafted subcontracts incorporate upstream clauses and state that they apply mutatis mutandis—roughly, with the necessary changes—or direct the reader to substitute Prime for Government and Subcontractor for Contractor. That shortcut can be useful, but it can also create serious ambiguity.",
      "Federal clauses often assign authority specifically to a Contracting Officer, agency, inspector, or Government official. A blanket substitution should not be assumed to transfer every sovereign or contract-administration power to a prime contractor."
    ],
    sections: [
      {
        heading: "Start with the actual incorporation sentence",
        bullets: [
          "Does the subcontract identify specific FAR or DFARS clauses, or incorporate the entire prime contract?",
          "Which defined terms are expressly replaced?",
          "Does Contracting Officer become Prime, or does that federal role remain unchanged?",
          "Are notice addresses and deadlines rewritten for the subcontract relationship?",
          "Does the clause say substitutions apply only where context permits?",
          "What happens when a substituted clause conflicts with the body of the subcontract?"
        ]
      },
      {
        heading: "Compare the shortcut with clauses that use explicit flowdown text",
        paragraphs: ["Many federal clauses contain a specific subcontract paragraph that tells the contractor what substance must be included downstream. FAR 52.244-6 is a useful example of a clause-driven flowdown structure. Where a federal clause gives precise lower-tier instructions, those instructions are a stronger starting point than a generic substitution formula."],
        source: { label: "FAR 52.244-6 — Commercial Subcontract Flowdowns", url: "https://www.acquisition.gov/far/52.244-6" }
      },
      {
        heading: "Watch for authority that cannot simply be reassigned",
        paragraphs: ["A prime can create private rights in its subcontract, but it should do so clearly. A generic substitution should not be the only explanation for whether the prime can issue changes, conduct audits, make final determinations, direct access to systems, or impose remedies that the Government holds under the prime contract."]
      },
      {
        heading: "Use an order-of-precedence rule to resolve collisions",
        paragraphs: ["When incorporation, substitution, exhibits, and the body of the subcontract all address the same subject, the agreement should explain which document controls. Otherwise a short mutatis mutandis sentence can quietly undo carefully negotiated payment, liability, change, or dispute language elsewhere in the package."]
      }
    ],
    related: [
      { href: "/blog/incorporation-by-reference-ambush", label: "FAR Clauses Incorporated by Reference" },
      { href: "/blog/order-of-precedence-subcontract-documents", label: "Order of Precedence in Federal Subcontracts" },
      { href: "/blog/understanding-far-flow-down-clauses", label: "Understanding FAR Flowdown Clauses" }
    ],
    ctaTitle: "Translate the Flowdown Shortcut",
    ctaBody: "SubPreCheck can surface blanket substitution language, incorporated clauses, and conflicts that deserve clarification before signing."
  },
  "future-flowdowns-unilateral-prime-policy-updates": {
    title: "Future Flowdowns and Unilateral Prime Policy Updates: What Federal Subcontractors Should Watch",
    description: "Review subcontract clauses that automatically incorporate future FAR/DFARS flowdowns, prime policies, portal rules, manuals, or cybersecurity updates after award.",
    category: "FAR & DFARS Flowdowns",
    date: "Aug 22, 2026",
    dek: "A subcontract can be difficult to price when today's package automatically imports tomorrow's clauses, manuals, portals, or policies without a defined change process.",
    intro: [
      "Federal requirements do change during long programs, and primes need a way to implement legally required updates. The commercial risk appears when a subcontract gives the prime unlimited authority to add any new policy or flowdown at any time, with no materiality test, notice process, price relief, or schedule adjustment.",
      "A better review separates mandatory Government-driven changes from discretionary prime policy changes and asks how each category affects cost, schedule, systems, staffing, and lower-tier commitments."
    ],
    sections: [
      {
        heading: "Not every future clause should arrive the same way",
        paragraphs: ["Federal clauses such as FAR 52.244-6 use defined clause lists and applicability rules. A private subcontract may need a mechanism for later mandatory flowdowns, but that mechanism can identify the source, effective date, applicability, and adjustment process rather than simply incorporating every future requirement automatically."],
        source: { label: "FAR 52.244-6 — Commercial Product and Service Subcontracts", url: "https://www.acquisition.gov/far/52.244-6" }
      },
      {
        heading: "Look for moving-target language",
        bullets: [
          "All prime policies as amended from time to time.",
          "All future FAR or DFARS clauses designated by the prime.",
          "Supplier manuals or portals that can change without signed modification.",
          "Cybersecurity standards incorporated by web link with no version date.",
          "Quality or inspection procedures that may be revised unilaterally.",
          "No right to request price or schedule adjustment for a material new requirement."
        ]
      },
      {
        heading: "Ask for a defined change mechanism",
        paragraphs: ["A workable clause can require the subcontractor to comply with newly mandatory Government requirements while preserving a written notice and adjustment process when the change materially affects performance. Discretionary prime policies can be handled separately and should not automatically override negotiated commercial terms."]
      },
      {
        heading: "Version the documents you are actually accepting",
        paragraphs: ["Save the policy, manual, cybersecurity standard, supplier code, and portal procedure in effect at award. A versioned contract file makes it possible to determine later whether a disputed obligation existed at signing or was introduced afterward."]
      }
    ],
    related: [
      { href: "/blog/missing-prime-contract-documents", label: "Missing Prime Contract Documents" },
      { href: "/blog/far-flowdown-matrix", label: "FAR Flowdown Matrix" },
      { href: "/blog/order-of-precedence-subcontract-documents", label: "Order of Precedence" }
    ],
    ctaTitle: "Know Which Rules Can Change After Signature",
    ctaBody: "SubPreCheck can flag future-flowdown clauses, mutable web-linked policies, and missing adjustment rights before award."
  },
  "retainage-federal-construction-subcontracts": {
    title: "Retainage in Federal Construction Subcontracts: How Much Can Be Held and When Is It Released?",
    description: "Review federal construction retainage, subcontract retainage percentages, release triggers, payment bonds, and final-payment conditions before accepting withheld cash flow.",
    category: "Payment & Cash Flow",
    date: "Aug 22, 2026",
    dek: "Government retainage rules do not automatically set your subcontract retainage. The subcontract should say how much can be held, why, and when the retained money becomes due.",
    intro: [
      "Retainage can create a substantial financing burden for a small federal construction subcontractor. The Government's upstream rules provide useful context, but the prime-sub relationship is controlled by the subcontract and applicable law.",
      "Before signing, identify the retainage percentage, whether it applies automatically or only for cause, how it reduces near completion, whether the prime may hold more than the Government holds, and the event that triggers release."
    ],
    sections: [
      {
        heading: "The federal prime-contract benchmark is cause-based",
        paragraphs: ["FAR 52.232-5 allows the contracting officer to retain up to 10 percent of a construction progress payment when satisfactory progress has not been made. FAR policy states that retainage should not substitute for good contract management and should be determined case by case."],
        source: { label: "FAR 52.232-5 — Payments Under Fixed-Price Construction Contracts", url: "https://www.acquisition.gov/far/52.232-5" }
      },
      {
        heading: "Subcontracts can negotiate their own retainage structure",
        paragraphs: ["FAR 52.232-27 recognizes that construction subcontracts may include negotiated retainage provisions. That does not answer what percentage is commercially reasonable for a particular subcontract or when release should occur; those points should be explicit in the agreement."],
        source: { label: "FAR 52.232-27 — Prompt Payment for Construction Contracts", url: "https://www.acquisition.gov/far/52.232-27" }
      },
      {
        heading: "Price the cash-flow terms, not just the contract value",
        bullets: [
          "Retainage percentage and whether it applies to every progress payment.",
          "Whether retainage reduces after substantial completion or completion of your scope.",
          "Whether release depends on Government final acceptance of the entire project.",
          "Whether the prime can retain more than the Government retains upstream.",
          "Whether unresolved punch-list items allow retention of a reasonable amount or the entire balance.",
          "Interest, bond, lien-waiver, and closeout-document conditions tied to release."
        ]
      },
      {
        heading: "Separate retainage from disputed withholding",
        paragraphs: ["Retainage is not the same as withholding for defective work, backcharges, setoff, or a disputed invoice. The subcontract should distinguish those mechanisms and require enough notice for the subcontractor to understand why money is being held and what must occur for release."]
      }
    ],
    related: [
      { href: "/blog/government-contracting-payment-traps", label: "Pay-When-Paid and Pay-If-Paid" },
      { href: "/blog/prompt-payment-act-federal-subcontractors", label: "Prompt Payment Act and Federal Subcontractors" },
      { href: "/blog/miller-act-payment-bond-claims", label: "Miller Act Payment Bond Claims" }
    ],
    ctaTitle: "Model the Cash You Will Actually Receive",
    ctaBody: "SubPreCheck can surface retainage percentages, release conditions, payment dependencies, and closeout terms before you price the work."
  },
  "withholding-setoff-backcharges-federal-subcontracts": {
    title: "Withholding, Setoff, and Backcharges in Federal Subcontracts: What Can the Prime Deduct?",
    description: "Review prime rights to withhold payment, set off unrelated claims, impose backcharges, and deduct disputed costs from federal subcontract invoices.",
    category: "Payment & Cash Flow",
    date: "Aug 22, 2026",
    dek: "A payment clause can promise prompt payment and still give the prime broad rights to deduct money for alleged defects, delays, other contracts, or estimated future costs.",
    intro: [
      "Federal subcontract payment disputes often involve more than whether an invoice was submitted on time. The prime may assert withholding, setoff, backcharge, retainage, or recoupment rights that reduce the amount actually paid.",
      "These rights should be reviewed separately. A backcharge tied to documented corrective work is different from an unrestricted right to offset any claim the prime has against the subcontractor on any project."
    ],
    sections: [
      {
        heading: "Construction prompt-payment clauses recognize withholding",
        paragraphs: ["FAR 52.232-27 allows qualifying construction subcontract terms to address withholding and retainage, including withholding amounts when the prime or subcontractor determines that part or all of a payment request should be withheld under the subcontract. The downstream contract should therefore define the procedure clearly."],
        source: { label: "FAR 52.232-27 — Prompt Payment for Construction Contracts", url: "https://www.acquisition.gov/far/52.232-27" }
      },
      {
        heading: "Look for the scope of the deduction right",
        bullets: [
          "May the prime withhold only amounts reasonably related to the disputed issue?",
          "Is written notice required before a backcharge is taken?",
          "Does the subcontractor receive an opportunity to cure defective work first?",
          "Can estimated future costs be withheld before the prime actually incurs them?",
          "Can the prime set off claims from unrelated projects or affiliates?",
          "Does a dispute over one invoice permit withholding of all other undisputed amounts?"
        ]
      },
      {
        heading: "Require enough information to evaluate a backcharge",
        paragraphs: ["A useful notice should identify the issue, contractual basis, amount or reasonable estimate, supporting records, and the action required to avoid or reduce the charge. Broad language allowing the prime to deduct any amount it deems appropriate can make cash flow difficult to forecast and disputes harder to resolve."]
      },
      {
        heading: "Connect deduction rights to liability and changes",
        paragraphs: ["Backcharges can overlap with warranty, indemnity, liquidated damages, reprocurement, and change provisions. Review whether a single event can generate multiple deductions and whether the subcontract's liability cap or consequential-damages waiver applies to those remedies."]
      }
    ],
    related: [
      { href: "/blog/retainage-federal-construction-subcontracts", label: "Retainage in Federal Construction Subcontracts" },
      { href: "/blog/limitation-of-liability-services-federal-subcontract", label: "Limitation of Liability in Federal Service Subcontracts" },
      { href: "/blog/federal-subcontractor-not-paid-prime-contractor", label: "Federal Subcontractor Not Paid by the Prime" }
    ],
    ctaTitle: "Find the Deduction Rights Before Invoicing",
    ctaBody: "SubPreCheck can surface withholding, setoff, backcharge, retainage, and cure language that changes the real payment risk."
  },
  "far-32-112-1-subcontractor-nonpayment": {
    title: "FAR 32.112-1: What Can a Federal Subcontractor Do When the Prime Has Not Paid?",
    description: "Understand what FAR 32.112-1 allows a contracting officer to examine after a subcontractor asserts nonpayment, and what the rule does not turn the Government into.",
    category: "Payment & Cash Flow",
    date: "Aug 22, 2026",
    dek: "A subcontractor normally contracts with the prime, not the Government. FAR 32.112-1 still gives contracting officers a defined role when a subcontractor asserts that the prime has not paid according to the agreement.",
    intro: [
      "A federal subcontractor that is unpaid may wonder whether the agency contracting officer can force the prime to pay. The answer is more limited. FAR 32.112-1 permits the contracting officer to examine certain payment and certification issues and provides specific administrative responses, but it does not make the Government a party to the subcontract.",
      "This route should be evaluated alongside the subcontract's dispute process, payment-bond rights on qualifying construction projects, state-law remedies, and direct discussions with the prime."
    ],
    sections: [
      {
        heading: "The contracting officer may examine nonpayment assertions",
        paragraphs: ["FAR 32.112-1 allows a contracting officer, after a subcontractor or supplier asserts nonpayment, to determine whether the prime has made payments in accordance with the subcontract or applicable construction prompt-payment requirements and whether certain prime payment certifications are accurate."],
        source: { label: "FAR 32.112-1 — Subcontractor Assertions of Nonpayment", url: "https://www.acquisition.gov/far/32.112-1" }
      },
      {
        heading: "The remedies are administrative, not a direct Government payment claim",
        paragraphs: ["If the contracting officer finds noncompliance, the FAR permits actions such as encouraging timely payment or, when authorized by applicable clauses, reducing or suspending progress payments to the prime. An inaccurate material payment certification can trigger administrative or other remedial action."]
      },
      {
        heading: "Build the factual package before escalating",
        bullets: [
          "Signed subcontract or purchase order and payment terms.",
          "Invoices, approvals, and dates submitted.",
          "Evidence of satisfactory performance or acceptance.",
          "Prime correspondence explaining any withholding, rejection, or dispute.",
          "Amounts paid and unpaid by invoice.",
          "Relevant retainage, pay-if-paid, bond, release, and dispute clauses."
        ]
      },
      {
        heading: "Do not let an escalation destroy other deadlines",
        paragraphs: ["Contacting the prime or contracting officer does not necessarily extend a Miller Act notice period, lawsuit deadline, contractual claim deadline, or dispute notice. Track those paths separately so an effort to resolve payment informally does not cause another remedy to expire."]
      }
    ],
    related: [
      { href: "/blog/federal-subcontractor-not-paid-prime-contractor", label: "Federal Subcontractor Not Paid by the Prime" },
      { href: "/blog/prompt-payment-act-federal-subcontractors", label: "Does the Prompt Payment Act Protect Federal Subcontractors?" },
      { href: "/blog/miller-act-payment-bond-claims", label: "Miller Act Payment Bond Claims" }
    ],
    ctaTitle: "Organize the Nonpayment Record",
    ctaBody: "SubPreCheck can surface payment conditions, withholding rights, notice deadlines, and supporting documents that matter when payment stops."
  },
  "rea-vs-claim-federal-subcontractors": {
    title: "REA vs. Claim for Federal Subcontractors: What Is the Difference?",
    description: "Compare a request for equitable adjustment with a Contract Disputes Act claim, including certification, contracting-officer decisions, prime sponsorship, and subcontract notice requirements.",
    category: "Changes & Claims",
    date: "Aug 22, 2026",
    dek: "An REA and a claim can seek similar money or time, but they do not occupy the same procedural posture. For a subcontractor, the prime's sponsorship and the subcontract's notice rules add another layer.",
    intro: [
      "Federal project teams often use the terms REA and claim loosely. A request for equitable adjustment usually begins as a contract-administration request to adjust price, time, or other terms after a change. A claim under the Contract Disputes Act framework is a more formal written demand seeking relief as a matter of right and can require certification when it exceeds the statutory threshold.",
      "A subcontractor generally does not submit a CDA claim directly to the Government because it lacks privity. The subcontract should therefore explain how the subcontractor's request is prepared, passed through, certified where necessary, and sponsored by the prime."
    ],
    sections: [
      {
        heading: "The FAR defines a claim and formal decision process",
        paragraphs: ["FAR 52.233-1 defines a claim as a written demand or assertion seeking, as a matter of right, payment of a sum certain, interpretation or adjustment of contract terms, or other relief. Contractor claims over $100,000 require the certification stated in the clause."],
        source: { label: "FAR 52.233-1 — Disputes", url: "https://www.acquisition.gov/far/52.233-1" }
      },
      {
        heading: "An REA often starts under a changes clause",
        paragraphs: ["FAR changes clauses provide for equitable adjustment when directed changes affect cost or time and impose notice or assertion periods. A prime may initially submit an REA to negotiate the adjustment without immediately demanding a final contracting-officer decision."],
        source: { label: "FAR 52.243-4 — Changes (Construction)", url: "https://www.acquisition.gov/far/52.243-4" }
      },
      {
        heading: "For a subcontractor, the agreement controls the path upstream",
        bullets: [
          "How quickly must the subcontractor notify the prime of the underlying change?",
          "When must pricing and schedule support be submitted?",
          "Will the prime sponsor a pass-through REA or claim?",
          "Who controls settlement and appeal decisions?",
          "Who bears legal, consultant, and claim-preparation costs?",
          "Does the subcontract condition payment on the Government's recovery?"
        ]
      },
      {
        heading: "Do not wait to decide what the request is called",
        paragraphs: ["The safest administration starts with timely written notice and contemporaneous cost and schedule records. The parties can later decide whether the matter remains an REA, becomes a formal claim, settles at the prime-sub level, or proceeds through a sponsored claim path. Missing the subcontract's initial notice deadline can damage every later route."]
      }
    ],
    related: [
      { href: "/blog/request-for-equitable-adjustment-under-far", label: "Request for Equitable Adjustment Under the FAR" },
      { href: "/blog/subcontractor-pass-through-claims", label: "Subcontractor Pass-Through Claims" },
      { href: "/blog/prime-refuses-sponsor-subcontractor-claim", label: "What If the Prime Refuses to Sponsor a Claim?" }
    ],
    ctaTitle: "Know the Upstream Claim Path",
    ctaBody: "SubPreCheck can surface notice, sponsorship, certification, settlement, and continue-performance terms before a change becomes a dispute."
  }
} satisfies Record<string, Batch6Article>;

export type Batch6Slug = keyof typeof batch6Articles;

export const batch6Posts: Post[] = Object.entries(batch6Articles).map(([slug, article]) => ({
  slug,
  title: article.title,
  description: article.description,
  category: article.category,
  date: article.date
}));
