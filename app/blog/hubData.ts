import type { Post } from "./articleData";

export interface HubItem {
  label: string;
  description: string;
  href?: string;
}

export interface HubGroup {
  heading: string;
  intro?: string;
  items: HubItem[];
}

export interface HubPageData {
  title: string;
  description: string;
  category: "Topic Hub" | "Resource";
  date: string;
  dek: string;
  intro: string[];
  groups: HubGroup[];
  ctaTitle: string;
  ctaBody: string;
}

export const hubPages = {
  "federal-subcontract-before-you-sign-hub": {
    title: "Federal Subcontract Review Hub: What to Check Before You Sign",
    description: "Start here when a federal prime sends a subcontract, teaming agreement, purchase order, or solicitation package and you need to understand the major risks before committing.",
    category: "Topic Hub",
    date: "Aug 22, 2026",
    dek: "A practical starting point for the question SubPreCheck is built around: a prime just sent you something to sign—what should you understand before you agree?",
    intro: [
      "Federal subcontract risk rarely lives in one clause. Payment, scope, flowdowns, changes, cyber, labor, data rights, insurance, termination, and missing documents can interact across the same package.",
      "Use this hub as the first-pass map. Start with the agreement checklist, make sure the package is complete, then move into the subject area that carries the most cost or operational risk for your work."
    ],
    groups: [
      {
        heading: "Start With the Package Itself",
        items: [
          { label: "Federal Subcontract Agreement Checklist", href: "/blog/federal-subcontract-agreement-checklist", description: "A broad pre-signature checklist covering scope, price, payment, flowdowns, changes, liability, termination, disputes, and missing documents." },
          { label: "Missing Prime Contract Documents", href: "/blog/missing-prime-contract-documents", description: "What to request when the subcontract relies on prime-contract material you have not received." },
          { label: "Missing SOW or Exhibits", href: "/blog/missing-statement-of-work-exhibits-subcontract", description: "How to inventory referenced-but-missing statements of work, schedules, specifications, and compliance attachments." },
          { label: "Order of Precedence", href: "/blog/order-of-precedence-subcontract-documents", description: "Which document controls when the body, SOW, proposal, purchase order, or flowdown exhibit conflict." }
        ]
      },
      {
        heading: "Resolve the Commercial Risk",
        items: [
          { label: "Pay-When-Paid and Pay-If-Paid", href: "/blog/government-contracting-payment-traps", description: "Understand contingent-payment language and the difference between timing and shifted nonpayment risk." },
          { label: "No Guaranteed Work", href: "/blog/no-guaranteed-work-federal-subcontract", description: "Check whether the final subcontract actually promises any minimum work, task orders, hours, or revenue." },
          { label: "Indemnification Risk", href: "/blog/broad-form-indemnification-subcontractor-vulnerabilities", description: "Review duty-to-defend, third-party claims, negligence allocation, and uncapped exposure." },
          { label: "Termination for Convenience", href: "/blog/termination-for-convenience-subcontractor-rights", description: "Understand what happens to committed cost, inventory, demobilization, and profit if the prime ends the work for convenience." }
        ]
      },
      {
        heading: "Then Follow the Risk Into the Right Cluster",
        items: [
          { label: "FAR & DFARS Flowdown Hub", href: "/blog/far-dfars-flowdown-hub", description: "Clause applicability, incorporation, matrices, lower tiers, and future updates." },
          { label: "Payment & Cash Flow Hub", href: "/blog/federal-subcontract-payment-hub", description: "Payment conditions, retainage, withholding, bonds, and nonpayment escalation." },
          { label: "Changes & Claims Hub", href: "/blog/federal-subcontract-changes-claims-hub", description: "Change authority, REAs, claims, notice, pass-throughs, delay, and acceleration." },
          { label: "CMMC & Cybersecurity Hub", href: "/blog/cmmc-cybersecurity-subcontractor-hub", description: "CUI/FCI, CMMC levels, 7012, cyber reporting, and lower-tier cyber flowdowns." }
        ]
      }
    ],
    ctaTitle: "See What a Structured First Pass Looks Like",
    ctaBody: "View the SubPreCheck sample report to see how a prime-provided package can be organized into evidence-grounded issues and questions before final legal review."
  },
  "far-dfars-flowdown-hub": {
    title: "FAR & DFARS Flowdown Hub for Federal Subcontractors",
    description: "Navigate mandatory and optional flowdowns, FAR 52.244-6, flowdown matrices, incorporation by reference, lower-tier clauses, substitution language, and future updates.",
    category: "Topic Hub",
    date: "Aug 22, 2026",
    dek: "Flowdowns are not solved by copying a prime-contract clause list. The real work is deciding which clauses apply, what they require, and what must move farther downstream.",
    intro: [
      "A federal subcontract can incorporate FAR and DFARS requirements through clause lists, attachments, the prime contract, web-linked policies, or broad incorporation language. The subcontractor needs to separate required federal obligations from discretionary prime terms and then identify lower-tier duties.",
      "This hub moves from the basic flowdown question into the harder contract mechanics: clause matrices, commercial-item rules, missing documents, mutatis mutandis, lower-tier flowdowns, and changing requirements after award."
    ],
    groups: [
      {
        heading: "Core Flowdown Questions",
        items: [
          { label: "Understanding FAR Flowdown Clauses", href: "/blog/understanding-far-flow-down-clauses", description: "The plain-English starting point for prime-to-subcontract clause flowdown." },
          { label: "Mandatory vs. Optional FAR Flowdowns", href: "/blog/mandatory-vs-optional-far-flowdowns", description: "Why some clauses must be included while others are prime commercial choices." },
          { label: "FAR 52.244-6 Explained", href: "/blog/far-52-244-6-commercial-subcontracts", description: "Commercial product and service subcontract flowdowns under the current FAR clause." },
          { label: "FAR Flowdown Matrix", href: "/blog/far-flowdown-matrix", description: "How to organize clause, trigger, tier, action, and evidence requirements in one working matrix." }
        ]
      },
      {
        heading: "Incorporation and Contract Mechanics",
        items: [
          { label: "FAR Clauses Incorporated by Reference", href: "/blog/incorporation-by-reference-ambush", description: "How referenced prime-contract language can become part of the subcontract even when it is not printed in full." },
          { label: "Mutatis Mutandis", href: "/blog/mutatis-mutandis-flowdown-clauses", description: "How substitution language changes—or fails to clearly change—Government, prime, contractor, and subcontractor references." },
          { label: "Order of Precedence", href: "/blog/order-of-precedence-subcontract-documents", description: "What controls when incorporated clauses conflict with negotiated subcontract terms." },
          { label: "Future Flowdowns and Prime Policy Updates", href: "/blog/future-flowdowns-unilateral-prime-policy-updates", description: "How to handle newly mandatory requirements without accepting an unlimited moving target." }
        ]
      },
      {
        heading: "Documents and Lower Tiers",
        items: [
          { label: "Missing Prime Contract Documents", href: "/blog/missing-prime-contract-documents", description: "Request the upstream clauses, exhibits, or schedules needed to evaluate the promised flowdown." },
          { label: "Missing SOW or Exhibits", href: "/blog/missing-statement-of-work-exhibits-subcontract", description: "Find incorporated attachments that define scope or compliance but were not delivered." },
          { label: "Lower-Tier FAR and DFARS Flowdowns", href: "/blog/lower-tier-far-dfars-flowdowns", description: "Determine what your own suppliers and lower-tier subcontractors must receive." },
          { label: "Consent to Subcontracts", href: "/blog/far-52-244-2-consent-to-subcontracts", description: "What Government consent to a subcontract does—and does not—mean about responsibility or approval." }
        ]
      }
    ],
    ctaTitle: "Turn the Clause List Into an Actionable Map",
    ctaBody: "SubPreCheck can surface incorporated clauses, missing flowdown context, conflicting terms, and lower-tier obligations before signature."
  },
  "federal-subcontract-payment-hub": {
    title: "Federal Subcontract Payment & Cash Flow Hub",
    description: "Navigate pay-if-paid, Prompt Payment Act issues, Miller Act bonds, retainage, withholding, setoff, backcharges, nonpayment, and FAR 32.112-1.",
    category: "Topic Hub",
    date: "Aug 22, 2026",
    dek: "Payment risk is bigger than the invoice due date. The subcontract determines conditions, deductions, retainage, acceptance triggers, and what happens when the prime says it has not been paid.",
    intro: [
      "For small subcontractors, cash-flow terms can determine whether a profitable project is financeable. Review the complete payment mechanism: invoice acceptance, Government-payment conditions, outside dates, retainage, setoff, backcharges, interest, bonds, releases, and final-payment requirements.",
      "This hub separates contract payment rights from federal administrative or bond remedies so you can see which path applies to a particular nonpayment problem."
    ],
    groups: [
      {
        heading: "Before You Sign the Payment Clause",
        items: [
          { label: "Pay-When-Paid and Pay-If-Paid", href: "/blog/government-contracting-payment-traps", description: "Distinguish timing language from a clause that attempts to shift owner nonpayment risk." },
          { label: "Retainage in Federal Construction Subcontracts", href: "/blog/retainage-federal-construction-subcontracts", description: "Review percentage, cause, reduction, and release triggers for money held back from progress payments." },
          { label: "Withholding, Setoff, and Backcharges", href: "/blog/withholding-setoff-backcharges-federal-subcontracts", description: "Find deduction rights that can reduce payment even when the invoice itself is otherwise due." },
          { label: "Protecting Small Subcontractor Margins", href: "/blog/protecting-small-subcontractor-margins", description: "Contract mechanisms that can erode margin after award if they are not priced in advance." }
        ]
      },
      {
        heading: "When Payment Stops",
        items: [
          { label: "Federal Subcontractor Not Paid by the Prime", href: "/blog/federal-subcontractor-not-paid-prime-contractor", description: "A practical sequence for reviewing the agreement, documentation, withholding explanation, and available paths." },
          { label: "Prompt Payment Act and Federal Subcontractors", href: "/blog/prompt-payment-act-federal-subcontractors", description: "What the Prompt Payment Act does and does not create for lower-tier companies." },
          { label: "FAR 32.112-1 Nonpayment Assertions", href: "/blog/far-32-112-1-subcontractor-nonpayment", description: "The contracting officer's defined administrative role after a subcontractor asserts nonpayment." },
          { label: "Miller Act Payment Bond Claims", href: "/blog/miller-act-payment-bond-claims", description: "Construction payment-bond rights, tier rules, notice, and filing deadlines." }
        ]
      },
      {
        heading: "Payment Can Be Tied to Other Clauses",
        items: [
          { label: "Inspection and Acceptance", href: "/blog/federal-subcontract-inspection-acceptance", description: "Acceptance language can determine when an invoice becomes payable or when work can be rejected." },
          { label: "Change Order Releases", href: "/blog/change-order-release-trap", description: "A payment or modification release can waive unresolved change or delay rights." },
          { label: "Termination for Convenience", href: "/blog/termination-for-convenience-subcontractor-rights", description: "Understand payment for completed work, commitments, demobilization, and settlement after early termination." }
        ]
      }
    ],
    ctaTitle: "Review the Full Cash-Flow Mechanism",
    ctaBody: "SubPreCheck can organize payment conditions, deductions, retainage, acceptance, and related notice terms before they become collection problems."
  },
  "cmmc-cybersecurity-subcontractor-hub": {
    title: "CMMC & DoD Cybersecurity Hub for Subcontractors",
    description: "Navigate CMMC levels, FCI vs. CUI, DFARS 252.204-7012, 72-hour cyber reporting, supplier questionnaires, and lower-tier cybersecurity flowdowns.",
    category: "Topic Hub",
    date: "Aug 22, 2026",
    dek: "DoD cyber compliance starts with the information the subcontract will actually require you to handle, the systems that will handle it, and the clauses that attach to that performance.",
    intro: [
      "CMMC and DFARS cybersecurity obligations can affect eligibility for award, system architecture, cloud providers, incident response, lower-tier suppliers, and representations made to the prime. The requirements should be mapped to the specific subcontract rather than treated as a generic company badge.",
      "Use this hub to move from the basic FCI/CUI question into CMMC level selection, 7012 obligations, incident reporting, supplier representations, and lower-tier flowdown."
    ],
    groups: [
      {
        heading: "Determine the Information and CMMC Level",
        items: [
          { label: "CMMC Requirements for DoD Subcontractors in 2026", href: "/blog/cmmc-requirements-dod-subcontractors-2026", description: "Current CMMC contract and subcontract framework and phased implementation context." },
          { label: "FCI vs. CUI", href: "/blog/fci-vs-cui-dod-subcontractors", description: "Why the information category matters for safeguarding and CMMC level decisions." },
          { label: "CMMC Level 1 vs. Level 2", href: "/blog/cmmc-level-1-vs-level-2", description: "Understand the practical distinction between FCI-only and CUI-handling work." },
          { label: "CMMC Flowdown to Lower Tiers", href: "/blog/cmmc-flowdown-lower-tier-subcontractors", description: "How the required status changes when a lower tier receives FCI or CUI." }
        ]
      },
      {
        heading: "DFARS Cybersecurity Performance",
        items: [
          { label: "DFARS 252.204-7012 for Subcontractors", href: "/blog/dfars-252-204-7012-subcontractors", description: "Safeguarding, reporting, cloud, evidence-preservation, and flowdown duties in the clause." },
          { label: "DoD Cyber Incident Reporting: 72 Hours", href: "/blog/dod-cyber-incident-reporting-72-hours", description: "Reporting, evidence preservation, malicious software, and prime notification after an incident." },
          { label: "CMMC Supplier Questionnaires", href: "/blog/cmmc-supplier-questionnaire-subcontractors", description: "How to tie supplier answers to the actual information, system boundary, and current status." },
          { label: "DFARS Data Risks for Tech Subcontractors", href: "/blog/dfars-data-trap-tech-subcontractors", description: "Broader DFARS data and information-handling issues that can appear alongside cybersecurity clauses." }
        ]
      },
      {
        heading: "Adjacent DoD Supply-Chain Risk",
        items: [
          { label: "Counterfeit Electronic Parts and DFARS", href: "/blog/counterfeit-electronic-parts-dfars-subcontractors", description: "Supplier controls, traceability, testing, reporting, and lower-tier electronics requirements." },
          { label: "Lower-Tier FAR and DFARS Flowdowns", href: "/blog/lower-tier-far-dfars-flowdowns", description: "A broader framework for deciding what your own suppliers must receive." }
        ]
      }
    ],
    ctaTitle: "Map the Information, System, and Clause Together",
    ctaBody: "SubPreCheck can surface cyber flowdowns, CUI/FCI assumptions, reporting duties, and missing security procedures before award."
  },
  "federal-subcontract-changes-claims-hub": {
    title: "Federal Subcontract Changes, REAs & Claims Hub",
    description: "Navigate change authority, constructive changes, REAs, claims, notices, pass-through claims, stop-work, differing conditions, acceleration, delay, and release language.",
    category: "Topic Hub",
    date: "Aug 22, 2026",
    dek: "Most change problems start before anyone calls them a claim: somebody gives direction, the schedule moves, cost is incurred, and the contract clock starts running.",
    intro: [
      "A strong changes process answers four questions early: who can direct work, when written notice is due, how cost and schedule impact are documented, and how a Government-caused issue moves through the prime to the agency.",
      "This hub covers the full lifecycle from field direction and constructive change through REA, sponsored claim, delay, acceleration, and settlement releases."
    ],
    groups: [
      {
        heading: "Recognize and Document the Change",
        items: [
          { label: "Unauthorized Change Orders: PM vs. CO", href: "/blog/unauthorized-change-orders-pm-vs-co", description: "Know who has authority to direct compensable changes." },
          { label: "Constructive Changes", href: "/blog/constructive-changes-federal-subcontracts", description: "When direction, interpretation, testing, access, or other conduct can materially change performance." },
          { label: "Change Order Accounting", href: "/blog/change-order-accounting-federal-subcontract", description: "Segregate changed and unchanged cost while the facts are still visible." },
          { label: "Federal Subcontract Notice Deadlines", href: "/blog/subcontract-notice-deadlines", description: "Find short downstream notice periods before the field team misses them." }
        ]
      },
      {
        heading: "Move From Adjustment to Claim",
        items: [
          { label: "Request for Equitable Adjustment", href: "/blog/request-for-equitable-adjustment-under-far", description: "The basic REA process and supporting documentation." },
          { label: "REA vs. Claim", href: "/blog/rea-vs-claim-federal-subcontractors", description: "How a negotiation request differs from a formal CDA claim posture." },
          { label: "Subcontractor Pass-Through Claims", href: "/blog/subcontractor-pass-through-claims", description: "How a lower-tier Government-caused issue can move through the prime." },
          { label: "Prime Refuses to Sponsor the Claim", href: "/blog/prime-refuses-sponsor-subcontractor-claim", description: "Contract terms to review when the prime controls access to the federal claim path." }
        ]
      },
      {
        heading: "Schedule, Site, and Performance Pressure",
        items: [
          { label: "Stop-Work Orders", href: "/blog/stop-work-order-federal-subcontract", description: "Cost minimization, restart, suspension, and equitable-adjustment mechanics." },
          { label: "Differing Site Conditions", href: "/blog/differing-site-conditions-federal-subcontract", description: "Prompt notice and evidence preservation before physical conditions are disturbed." },
          { label: "Excusable Delay and Force Majeure", href: "/blog/excusable-delay-force-majeure-federal-subcontracts", description: "Separate relief from default, time extensions, and compensable delay." },
          { label: "Constructive Acceleration", href: "/blog/constructive-acceleration-federal-subcontractors", description: "When the deadline stays fixed despite an asserted excusable or owner-caused delay." }
        ]
      },
      {
        heading: "Do Not Waive the Claim at the Finish Line",
        items: [
          { label: "Change Order Release Language", href: "/blog/change-order-release-trap", description: "Modification and payment releases that can extinguish unresolved rights." },
          { label: "Continue Performance During a Dispute", href: "/blog/continue-performance-during-dispute", description: "How to preserve position while contract language requires performance to continue." },
          { label: "Liquidated Damages and Delay Claims", href: "/blog/fighting-liquidated-damages-delay-claims", description: "Review delay allocation, causation, milestone dates, and downstream damage exposure." }
        ]
      }
    ],
    ctaTitle: "Make the Change Process Visible Before the Project Starts",
    ctaBody: "SubPreCheck can surface authority, notice, documentation, pass-through, release, and continue-performance terms before the first change occurs."
  },
  "teaming-small-business-subcontracting-hub": {
    title: "Federal Teaming, Workshare & Small Business Subcontracting Hub",
    description: "Navigate teaming agreements, final subcontracts, exclusivity, workshare, no-guaranteed-work language, limitations on subcontracting, similarly situated entities, and ostensible subcontractor risk.",
    category: "Topic Hub",
    date: "Aug 22, 2026",
    dek: "Pre-award teaming expectations can change dramatically when the prime sends the post-award subcontract. Compare the pursuit documents with the agreement that will actually govern performance.",
    intro: [
      "Small businesses often commit proposal resources based on expected scope, workshare, exclusivity, key personnel, and representations made during capture. The final subcontract can preserve those expectations, narrow them, or supersede them entirely.",
      "This hub connects commercial teaming terms with SBA small-business rules that can affect how much work the prime may subcontract and which lower-tier entities count toward performance."
    ],
    groups: [
      {
        heading: "From Teaming Agreement to Final Subcontract",
        items: [
          { label: "Teaming Agreement vs. Subcontract", href: "/blog/government-teaming-agreement-vs-subcontract", description: "What changes after award and which pre-award commitments may be superseded." },
          { label: "Vague Scope and Workshare", href: "/blog/teaming-agreement-vague-scope-liabilities", description: "Why percentages and role descriptions need enough detail to become operational commitments." },
          { label: "Exclusivity in Teaming Agreements", href: "/blog/teaming-agreement-exclusivity", description: "Scope, duration, release events, and opportunity cost of exclusive teaming." },
          { label: "No Guaranteed Work", href: "/blog/no-guaranteed-work-federal-subcontract", description: "How to evaluate staffing and exclusivity when the prime promises no minimum task orders or revenue." }
        ]
      },
      {
        heading: "Small Business Performance Rules",
        items: [
          { label: "Limitations on Subcontracting", href: "/blog/limitations-on-subcontracting-13-cfr-125-6", description: "Current SBA performance requirements and workshare assumptions for set-aside work." },
          { label: "Similarly Situated Entity Rule", href: "/blog/similarly-situated-entity-rule", description: "When qualifying lower-tier work can be treated differently in the limitations calculation." },
          { label: "Ostensible Subcontractor Rule", href: "/blog/ostensible-subcontractor-rule", description: "Affiliation risk when a small prime becomes unusually reliant on a subcontractor." },
          { label: "Named in the Prime's Subcontracting Plan", href: "/blog/small-business-subcontracting-plan-prime-commitments", description: "What proposal use and good-faith utilization rules do—and do not—guarantee to a small business." }
        ]
      }
    ],
    ctaTitle: "Compare the Promise With the Final Agreement",
    ctaBody: "SubPreCheck can surface workshare gaps, exclusivity, no-minimum language, superseding terms, and small-business flowdowns before resources are committed."
  },
  "federal-subcontract-labor-wage-hub": {
    title: "Federal Subcontract Labor & Wage Determination Hub",
    description: "Navigate Service Contract Labor Standards, Davis-Bacon, wage determinations, fringe benefits, worker classifications, and certified payroll issues for federal subcontractors.",
    category: "Topic Hub",
    date: "Aug 22, 2026",
    dek: "Labor compliance should be understood before the bid is priced. A missing or misunderstood wage determination can turn a winning rate into an unprofitable obligation.",
    intro: [
      "Federal labor requirements vary by the type of work and the clauses incorporated into the prime contract. Service work and construction can trigger different wage frameworks, classifications, fringe obligations, payroll records, and flowdown duties.",
      "Use this hub to identify the labor regime first, then confirm the exact wage determination, classifications, fringe treatment, and payroll process before committing labor rates."
    ],
    groups: [
      {
        heading: "Identify the Labor Regime",
        items: [
          { label: "Service Contract Labor Standards", href: "/blog/service-contract-labor-standards-subcontractors", description: "A plain-English introduction to SCLS coverage and subcontract review." },
          { label: "Davis-Bacon vs. SCLS", href: "/blog/davis-bacon-vs-service-contract-labor-standards", description: "Distinguish federal construction wage requirements from service-contract labor requirements." },
          { label: "Missing Wage Determination", href: "/blog/missing-wage-determination-federal-subcontract", description: "What to request before labor rates are priced when the applicable determination is absent." }
        ]
      },
      {
        heading: "Price and Administer the Wage Determination",
        items: [
          { label: "How to Read a Federal Wage Determination", href: "/blog/how-to-read-federal-wage-determination", description: "Classification, base wage, fringe, locality, and revision details to review." },
          { label: "Service Contract Fringe Benefits", href: "/blog/service-contract-fringe-benefits", description: "How fringe obligations affect the fully burdened labor rate." },
          { label: "Davis-Bacon Worker Classification", href: "/blog/davis-bacon-worker-classification", description: "Misclassification risk when actual duties do not match the priced classification." },
          { label: "Davis-Bacon Certified Payroll Errors", href: "/blog/davis-bacon-certified-payroll-errors", description: "Payroll documentation and classification problems that can surface during performance." }
        ]
      }
    ],
    ctaTitle: "Price the Labor Rule Before You Price the Labor",
    ctaBody: "SubPreCheck can surface missing wage determinations, labor flowdowns, classification assumptions, and fringe obligations before award."
  },
  "dod-data-rights-audit-hub": {
    title: "DoD Data Rights, IP, Audit & Records Hub for Subcontractors",
    description: "Navigate technical-data rights, Government Purpose Rights, Unlimited Rights, background IP, proprietary information, DCAA audits, record retention, and certified cost or pricing data.",
    category: "Topic Hub",
    date: "Aug 22, 2026",
    dek: "Data-rights and audit clauses can reach into technology developed before the subcontract, pricing support, accounting records, and information delivered during performance.",
    intro: [
      "Technology companies and professional-service subcontractors should identify what they are bringing to the project, what they will develop during performance, what they must deliver, and what rights the prime or Government expects in that material.",
      "Audit and records obligations belong in the same risk map because the contract may require access to cost, pricing, timekeeping, subcontract, or technical records long after the immediate deliverable is accepted."
    ],
    groups: [
      {
        heading: "Technical Data and Intellectual Property",
        items: [
          { label: "Technical Data Rights in DoD Subcontracts", href: "/blog/dod-technical-data-rights-subcontracts", description: "The core rights categories, markings, delivery obligations, and development-funding questions." },
          { label: "Government Purpose Rights vs. Unlimited Rights", href: "/blog/government-purpose-rights-vs-unlimited-rights", description: "A focused comparison of two major DoD technical-data rights categories." },
          { label: "Background IP", href: "/blog/background-ip-dod-subcontracts", description: "Identify preexisting technology, tools, methods, and materials before the subcontract can blur ownership." },
          { label: "Protecting Proprietary Supply Pricing", href: "/blog/protecting-proprietary-supply-pricing", description: "Confidential commercial and pricing information shared with a prime during proposal or performance." },
          { label: "DFARS Data Risks for Tech Subcontractors", href: "/blog/dfars-data-trap-tech-subcontractors", description: "Broader data-delivery and DFARS considerations beyond cybersecurity alone." }
        ]
      },
      {
        heading: "Audit, Records, and Pricing Support",
        items: [
          { label: "Audit and Records Clauses", href: "/blog/audit-records-clauses-federal-subcontracts", description: "What records a prime or Government may seek and how access obligations can be expanded downstream." },
          { label: "Can DCAA Audit a Subcontractor?", href: "/blog/can-dcaa-audit-subcontractor", description: "When DCAA involvement can reach subcontract cost or pricing support." },
          { label: "Federal Subcontract Record Retention", href: "/blog/federal-subcontract-record-retention", description: "Build a contract-specific retention schedule instead of assuming one universal period." },
          { label: "Certified Cost or Pricing Data", href: "/blog/defective-pricing-tina-liability", description: "Truthful cost or pricing data obligations and defective-pricing exposure where applicable." }
        ]
      }
    ],
    ctaTitle: "Identify What You Are Giving Away and What You Must Keep",
    ctaBody: "SubPreCheck can surface data-rights, IP, audit, records, and pricing-support clauses before they become post-award surprises."
  },
  "federal-subcontract-supply-quality-sourcing-hub": {
    title: "Federal Subcontract Supply Chain, Quality & Sourcing Hub",
    description: "Navigate Buy American, Trade Agreements Act sourcing, counterfeit electronic parts, inspection, acceptance, nonconforming-item reporting, warranties, and Government property.",
    category: "Topic Hub",
    date: "Aug 22, 2026",
    dek: "Supply contracts can fail before delivery if origin, traceability, inspection, warranty, property, or reporting obligations are not built into the purchasing process.",
    intro: [
      "Manufacturers, distributors, integrators, and construction suppliers can face overlapping domestic-preference, country-of-origin, counterfeit-part, quality, inspection, acceptance, warranty, and Government-property requirements.",
      "The safest pre-award approach is to map those requirements to the actual part, manufacturer, supplier, certificate, inspection step, and downstream purchase order needed to perform."
    ],
    groups: [
      {
        heading: "Sourcing and Country of Origin",
        items: [
          { label: "Buy American Act Sourcing Mistakes", href: "/blog/buy-american-act-sourcing-mistakes", description: "Common mistakes when sourcing assumptions and contract clauses do not match." },
          { label: "Trade Agreements Act vs. Buy American", href: "/blog/trade-agreements-act-vs-buy-american-act", description: "Distinguish domestic-preference and designated-country frameworks before making a certification." },
          { label: "TAA Designated-Country Sourcing", href: "/blog/trade-agreements-act-designated-country-sourcing", description: "Substantial transformation, designated countries, and item-level sourcing evidence." },
          { label: "Counterfeit Electronic Parts and DFARS", href: "/blog/counterfeit-electronic-parts-dfars-subcontractors", description: "Traceability, trusted suppliers, testing, reporting, and lower-tier electronics controls." }
        ]
      },
      {
        heading: "Quality, Acceptance, and Warranty",
        items: [
          { label: "Inspection and Acceptance", href: "/blog/federal-subcontract-inspection-acceptance", description: "Acceptance criteria, rejection, correction, evidence, and payment consequences." },
          { label: "Reporting Nonconforming Items", href: "/blog/nonconforming-items-far-52-246-26-subcontractors", description: "When FAR 52.246-26 can reach subcontract suppliers and their lower tiers." },
          { label: "Warranty of Construction", href: "/blog/warranty-of-construction-federal-subcontract", description: "Warranty duration, start dates, repair duties, and post-completion exposure." },
          { label: "Warranty of Services", href: "/blog/warranty-of-services-federal-subcontract", description: "Reperformance, correction, and remedy risk after service acceptance." }
        ]
      },
      {
        heading: "Property and Documentation",
        items: [
          { label: "Government Property", href: "/blog/government-property-federal-subcontractors", description: "Custody, records, loss, maintenance, lower-tier transfer, and return responsibilities." },
          { label: "Missing SOW or Exhibits", href: "/blog/missing-statement-of-work-exhibits-subcontract", description: "Find specifications, quality plans, property lists, and sourcing documents that are referenced but absent." }
        ]
      }
    ],
    ctaTitle: "Trace the Requirement Into the Supply Chain",
    ctaBody: "SubPreCheck can surface sourcing, quality, warranty, property, and reporting requirements that need to be priced and flowed down before purchase orders are issued."
  },
  "federal-subcontract-liability-termination-disputes-hub": {
    title: "Federal Subcontract Liability, Insurance, Termination & Disputes Hub",
    description: "Navigate indemnity, liability caps, insurance, warranties, liquidated damages, termination for convenience/default, cure rights, arbitration, venue, and continue-performance clauses.",
    category: "Topic Hub",
    date: "Aug 22, 2026",
    dek: "The largest subcontract exposures often sit outside the statement of work: who pays for loss, what survives acceptance, how the agreement can end, and where a dispute must be resolved.",
    intro: [
      "A subcontractor should not evaluate indemnity, insurance, limitation of liability, warranty, liquidated damages, termination, and dispute clauses in isolation. A cap can be swallowed by carve-outs, insurance may not cover the contractual obligation, and termination rights can determine whether unrecovered cost becomes stranded.",
      "Use this hub to build one exposure map across the clauses that allocate loss and determine remedies."
    ],
    groups: [
      {
        heading: "Liability and Insurance",
        items: [
          { label: "Broad-Form Indemnification", href: "/blog/broad-form-indemnification-subcontractor-vulnerabilities", description: "Duty-to-defend, negligence allocation, third-party claims, and broad downstream liability." },
          { label: "Limitation of Liability in Service Subcontracts", href: "/blog/limitation-of-liability-services-federal-subcontract", description: "Test the headline cap against indemnity, cyber, warranty, IP, and other carve-outs." },
          { label: "Insurance on Government Installations", href: "/blog/insurance-requirements-government-installation-subcontracts", description: "FAR flowdown, limits, endorsements, proof of coverage, and overlap with contractual liability." },
          { label: "Liquidated Damages and Delay Claims", href: "/blog/fighting-liquidated-damages-delay-claims", description: "Review schedule causation, milestone dates, pass-through damages, and downstream caps." }
        ]
      },
      {
        heading: "Termination and Post-Performance Exposure",
        items: [
          { label: "Termination for Convenience", href: "/blog/termination-for-convenience-subcontractor-rights", description: "Payment, commitments, demobilization, inventory, settlement, and flowdown risk after early termination." },
          { label: "Termination for Default and Cure", href: "/blog/termination-for-default-cure-notice", description: "Cure periods, immediate-termination language, notice, and reprocurement consequences." },
          { label: "Warranty of Construction", href: "/blog/warranty-of-construction-federal-subcontract", description: "What obligations can survive completion and acceptance on federal construction work." },
          { label: "Warranty of Services", href: "/blog/warranty-of-services-federal-subcontract", description: "Reperformance and correction obligations after service acceptance." }
        ]
      },
      {
        heading: "Disputes and Continuing Obligations",
        items: [
          { label: "Venue and Arbitration Clauses", href: "/blog/dispute-venue-arbitration-federal-subcontracts", description: "Understand the private forum for direct prime-sub disputes versus the upstream CDA path." },
          { label: "Continue Performance During a Dispute", href: "/blog/continue-performance-during-dispute", description: "What the business may have to keep doing while money or entitlement remains unresolved." },
          { label: "Order of Precedence", href: "/blog/order-of-precedence-subcontract-documents", description: "Make sure incorporated federal terms do not unintentionally override negotiated liability or dispute provisions." }
        ]
      }
    ],
    ctaTitle: "Build One Exposure Map Across the Agreement",
    ctaBody: "SubPreCheck can organize liability, insurance, termination, warranty, damages, and dispute clauses so overlapping risk is easier to see before signature."
  },
  "federal-subcontract-risk-glossary": {
    title: "Federal Subcontract Risk Glossary: Plain-English Terms to Know Before You Sign",
    description: "A plain-English glossary of common federal subcontract terms including flowdown, CUI, FCI, workshare, retainage, REA, pass-through claim, cure notice, GPR, and similarly situated entity.",
    category: "Resource",
    date: "Aug 22, 2026",
    dek: "Federal subcontract packages combine Government terminology with private contract language. This glossary gives small contractors a practical starting definition and a deeper guide for the terms that drive risk.",
    intro: [
      "This glossary is intentionally practical rather than exhaustive. Terms can have more precise meanings in statutes, regulations, individual clauses, and case law, so always read the actual subcontract and incorporated documents.",
      "Use the linked guides when a term affects price, scope, data, payment, schedule, or the company's ability to pursue a remedy."
    ],
    groups: [
      {
        heading: "Contract Structure",
        items: [
          { label: "Flowdown", href: "/blog/understanding-far-flow-down-clauses", description: "A requirement from the prime contract that is passed into a subcontract when the clause, law, or prime agreement requires or chooses that result." },
          { label: "Incorporation by Reference", href: "/blog/incorporation-by-reference-ambush", description: "Making another document or clause part of the agreement without reproducing all of its text in the body." },
          { label: "Mutatis Mutandis", href: "/blog/mutatis-mutandis-flowdown-clauses", description: "Applying language with the changes necessary for the new context, often by substituting party references in flowdown clauses." },
          { label: "Order of Precedence", href: "/blog/order-of-precedence-subcontract-documents", description: "The rule that decides which document controls when two incorporated contract documents conflict." }
        ]
      },
      {
        heading: "Scope and Teaming",
        items: [
          { label: "Workshare", href: "/blog/teaming-agreement-vague-scope-liabilities", description: "The portion of opportunity or contract work expected or committed to a teaming partner or subcontractor." },
          { label: "Exclusivity", href: "/blog/teaming-agreement-exclusivity", description: "A restriction on pursuing the same opportunity with another partner, often limited by scope, time, or release events." },
          { label: "Similarly Situated Entity", href: "/blog/similarly-situated-entity-rule", description: "An SBA concept that can affect how qualifying lower-tier work is treated under limitations on subcontracting." },
          { label: "Ostensible Subcontractor", href: "/blog/ostensible-subcontractor-rule", description: "A subcontractor relationship that can create affiliation concerns when the small prime becomes unusually reliant on a subcontractor for the primary and vital requirements or other key factors." }
        ]
      },
      {
        heading: "Payment and Claims",
        items: [
          { label: "Retainage", href: "/blog/retainage-federal-construction-subcontracts", description: "A portion of an otherwise payable progress amount held until specified performance or completion conditions are met." },
          { label: "Setoff", href: "/blog/withholding-setoff-backcharges-federal-subcontracts", description: "A contractual deduction of an amount claimed to be owed by the subcontractor against an amount otherwise payable to it." },
          { label: "REA", href: "/blog/rea-vs-claim-federal-subcontractors", description: "A request for equitable adjustment seeking a change to price, time, or other terms, commonly arising from changed performance conditions." },
          { label: "Pass-Through Claim", href: "/blog/subcontractor-pass-through-claims", description: "A lower-tier claim against the Government that is presented through the prime because the subcontractor generally lacks direct privity with the agency." }
        ]
      },
      {
        heading: "Cyber and Data",
        items: [
          { label: "FCI", href: "/blog/fci-vs-cui-dod-subcontractors", description: "Federal Contract Information: nonpublic information provided by or generated for the Government under a contract, excluding certain public or simple transactional information." },
          { label: "CUI", href: "/blog/fci-vs-cui-dod-subcontractors", description: "Controlled Unclassified Information: information requiring safeguarding or dissemination controls under law, regulation, or Government-wide policy." },
          { label: "CMMC", href: "/blog/cmmc-requirements-dod-subcontractors-2026", description: "DoD's Cybersecurity Maturity Model Certification framework for assessing required security protections on systems used for covered contract performance." },
          { label: "Government Purpose Rights", href: "/blog/government-purpose-rights-vs-unlimited-rights", description: "A DoD technical-data rights category that permits defined Government-purpose use for a specified period before rights may expand under the applicable clause." }
        ]
      },
      {
        heading: "Termination and Performance",
        items: [
          { label: "Cure Notice", href: "/blog/termination-for-default-cure-notice", description: "Formal notice identifying a performance failure and, where the governing agreement provides it, an opportunity to correct the problem before default termination." },
          { label: "Stop-Work Order", href: "/blog/stop-work-order-federal-subcontract", description: "Direction to pause covered performance, triggering mitigation, restart, schedule, and potential cost questions." },
          { label: "Constructive Change", href: "/blog/constructive-changes-federal-subcontracts", description: "A material change in performance caused by qualifying direction or conduct even though the parties did not first execute a formal change order." },
          { label: "Constructive Acceleration", href: "/blog/constructive-acceleration-federal-subcontractors", description: "Added effort to preserve an unchanged deadline after asserted excusable or owner-caused delay when adequate schedule relief is not granted." }
        ]
      }
    ],
    ctaTitle: "Use the Glossary as a Starting Point, Not the Final Answer",
    ctaBody: "When a term changes your cost, rights, or obligations, open the linked guide and then review the exact language in the prime-provided package."
  },
  "attorney-prep-federal-subcontract-checklist": {
    title: "Attorney Prep Checklist for a Federal Subcontract Review",
    description: "Organize the agreement, missing documents, business assumptions, risk questions, clause evidence, deadlines, and negotiation priorities before sending a federal subcontract package to counsel.",
    category: "Resource",
    date: "Aug 22, 2026",
    dek: "Legal review is more efficient when counsel receives the complete package plus a short, evidence-grounded map of what the business is worried about and what it needs to decide.",
    intro: [
      "A federal subcontract can be dozens or hundreds of pages once prime-contract flowdowns, technical exhibits, cybersecurity requirements, schedules, insurance, wage determinations, and proposal documents are included. Sending an incomplete document stack to counsel can waste time on basic fact-finding.",
      "This checklist is designed to help the business organize the package and its commercial questions. It is not a substitute for qualified legal advice."
    ],
    groups: [
      {
        heading: "1. Assemble the Complete Contract Package",
        items: [
          { label: "Signed or proposed subcontract / purchase order", description: "Use the exact version the prime expects you to sign, including revision date and all pages." },
          { label: "Statement of work and technical attachments", href: "/blog/missing-statement-of-work-exhibits-subcontract", description: "Include SOW, PWS, specifications, drawings, CDRLs, schedules, acceptance criteria, and referenced exhibits." },
          { label: "Flowdowns and prime-contract material", href: "/blog/missing-prime-contract-documents", description: "Include the clause list, flowdown matrix, prime-contract extracts, security documents, wage determinations, and policies incorporated by reference." },
          { label: "Teaming and proposal history", href: "/blog/government-teaming-agreement-vs-subcontract", description: "Include teaming agreements, letters of intent, proposal workshare, pricing assumptions, and commitments that may be superseded by the final subcontract." }
        ]
      },
      {
        heading: "2. Write Down the Business Deal in Plain English",
        items: [
          { label: "Scope", description: "What exactly are you delivering, and what is explicitly excluded?" },
          { label: "Money", description: "Price, contract type, rates, ceiling, retainage, expected margin, invoicing cadence, and major cash-flow assumptions." },
          { label: "Schedule", description: "Start, milestones, completion, dependencies, Government or prime-furnished inputs, and any already-aggressive dates." },
          { label: "Workshare and staffing", href: "/blog/no-guaranteed-work-federal-subcontract", description: "Expected task orders, minimum work, key personnel, exclusivity, and resources you must reserve before revenue is certain." }
        ]
      },
      {
        heading: "3. Mark the Clauses That Could Change the Economics",
        items: [
          { label: "Payment", href: "/blog/federal-subcontract-payment-hub", description: "Pay-if-paid, retainage, withholding, setoff, backcharges, acceptance, and final-payment release." },
          { label: "Changes and claims", href: "/blog/federal-subcontract-changes-claims-hub", description: "Authority, notice, proof, pass-through rights, continue-performance duties, and release language." },
          { label: "Liability and termination", href: "/blog/federal-subcontract-liability-termination-disputes-hub", description: "Indemnity, caps, insurance, warranty, damages, default, convenience termination, and dispute forum." },
          { label: "Flowdowns and compliance", href: "/blog/far-dfars-flowdown-hub", description: "Which federal clauses apply, what documents are missing, what policies can change, and what must flow to lower tiers." }
        ]
      },
      {
        heading: "4. Flag Technical or Compliance Issues for the Right Specialist",
        items: [
          { label: "CMMC / cybersecurity", href: "/blog/cmmc-cybersecurity-subcontractor-hub", description: "Identify FCI/CUI, system boundaries, CMMC status, 7012, cyber reporting, and lower-tier handling." },
          { label: "Labor and wages", href: "/blog/federal-subcontract-labor-wage-hub", description: "Confirm the applicable labor regime, wage determination, classification, fringe, and payroll duties." },
          { label: "Data rights and IP", href: "/blog/dod-data-rights-audit-hub", description: "Identify background IP, technical data, software, proprietary information, delivery, markings, and rights categories." },
          { label: "Sourcing and quality", href: "/blog/federal-subcontract-supply-quality-sourcing-hub", description: "Origin rules, counterfeit parts, inspection, quality reporting, warranty, and Government property." }
        ]
      },
      {
        heading: "5. Give Counsel a Short Decision List",
        items: [
          { label: "Must change", description: "Terms the business cannot operationally or financially accept as written." },
          { label: "Need clarification", description: "Ambiguous scope, missing exhibits, undefined standards, or conflicts that may be solved without redlining the entire agreement." },
          { label: "Can price", description: "Risks the company could accept if the price, contingency, insurance, schedule, or staffing plan changes." },
          { label: "Need specialist review", description: "Issues requiring labor, cybersecurity, export, tax, insurance, intellectual-property, or other specialized advice." }
        ]
      },
      {
        heading: "6. Preserve the Final Negotiation Record",
        items: [
          { label: "Clean and redlined versions", description: "Keep the prime's original, your redline, negotiated revisions, and final signed package together." },
          { label: "Written clarifications", description: "If a risk is resolved by email or letter rather than contract text, confirm whether that communication is incorporated or otherwise enforceable." },
          { label: "Final attachment inventory", description: "Verify that the executed version contains every exhibit and schedule you relied on during review." },
          { label: "Post-award notice tracker", href: "/blog/subcontract-notice-deadlines", description: "Extract short notice, claim, cyber, change, cure, reporting, and renewal deadlines into an operational tracker." }
        ]
      }
    ],
    ctaTitle: "See the Attorney-Prep Output SubPreCheck Is Designed to Produce",
    ctaBody: "The Sample Report shows how evidence-grounded findings, missing documents, questions, and negotiation issues can be organized before final counsel review."
  }
} satisfies Record<string, HubPageData>;

export type HubSlug = keyof typeof hubPages;

export const hubPosts: Post[] = Object.entries(hubPages).map(([slug, page]) => ({
  slug,
  title: page.title,
  description: page.description,
  category: page.category,
  date: page.date
}));
