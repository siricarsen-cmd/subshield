export interface Post {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
}

export const posts: Post[] = [
  {
    slug: "government-teaming-agreement-vs-subcontract",
    title: "Government Teaming Agreement vs. Subcontract: What Changes After Award?",
    description: "Compare a pre-award government teaming agreement with the post-award subcontract, including workshare, scope, pricing, flowdowns, payment, and superseding terms.",
    category: "Teaming & Pre-Award",
    date: "Aug 21, 2026"
  },
  {
    slug: "teaming-agreement-exclusivity",
    title: "Exclusivity in Government Teaming Agreements: What to Review Before You Commit",
    description: "Review opportunity scope, duration, release events, post-award gaps, and other exclusivity terms before committing to a federal contracting pursuit.",
    category: "Teaming & Pre-Award",
    date: "Aug 21, 2026"
  },
  {
    slug: "limitations-on-subcontracting-13-cfr-125-6",
    title: "Limitations on Subcontracting Under 13 CFR 125.6: What Small Businesses Should Check",
    description: "Understand current SBA limitations on subcontracting, similarly situated entities, workshare assumptions, and what subcontractors should verify before award.",
    category: "Small Business Compliance",
    date: "Aug 21, 2026"
  },
  {
    slug: "similarly-situated-entity-rule",
    title: "Similarly Situated Entity Rule: What Federal Contractors and Subcontractors Need to Know",
    description: "Learn how SBA defines a similarly situated entity, why program status and subcontract NAICS matter, and how the rule affects subcontracting-limit calculations.",
    category: "Small Business Compliance",
    date: "Aug 21, 2026"
  },
  {
    slug: "ostensible-subcontractor-rule",
    title: "The Ostensible Subcontractor Rule: When a Small-Business Team Can Create Affiliation Risk",
    description: "Review undue reliance, primary-and-vital work, management control, staffing, and similarly situated entity issues before structuring a small-business team.",
    category: "Small Business Compliance",
    date: "Aug 21, 2026"
  },
  {
    slug: "subcontractor-pass-through-claims",
    title: "Subcontractor Pass-Through Claims on Federal Contracts: What the Subcontract Should Address",
    description: "Review sponsorship, indirect appeal, notice, cooperation, claim costs, settlement control, and documentation terms before a Government-caused subcontract claim arises.",
    category: "Claims & Disputes",
    date: "Aug 21, 2026"
  },
  {
    slug: "prime-refuses-sponsor-subcontractor-claim",
    title: "What If the Prime Refuses to Sponsor a Federal Subcontractor Claim?",
    description: "Understand why claim-sponsorship language matters and what to review when a federal prime has discretion to refuse, control, settle, or decline a subcontractor claim.",
    category: "Claims & Disputes",
    date: "Aug 21, 2026"
  },
  {
    slug: "subcontract-notice-deadlines",
    title: "Federal Subcontract Notice Deadlines: Why Short Notice Clauses Matter",
    description: "Review short notice periods for changes, delays, claims, differing conditions, payment disputes, and other events before field performance begins.",
    category: "Changes & Claims",
    date: "Aug 21, 2026"
  },
  {
    slug: "continue-performance-during-dispute",
    title: "Continue Performance During a Dispute: What Federal Subcontractors Should Review",
    description: "Review continue-performance obligations together with change authority, notice, funding, payment, and disputed-work protections before signing a federal subcontract.",
    category: "Claims & Disputes",
    date: "Aug 21, 2026"
  },
  {
    slug: "termination-for-default-cure-notice",
    title: "Termination for Default and Cure Notices: What Federal Subcontractors Should Review",
    description: "Compare federal default procedures with subcontract cure periods, immediate-default triggers, backcharge remedies, and notice requirements before signing.",
    category: "Termination & Default",
    date: "Aug 21, 2026"
  },
  {
    slug: "order-of-precedence-subcontract-documents",
    title: "Order of Precedence in Federal Subcontracts: Which Document Controls When Terms Conflict?",
    description: "Understand how order-of-precedence clauses resolve conflicts among subcontract terms, statements of work, proposals, flowdowns, specifications, and attachments.",
    category: "Contract Documents",
    date: "Aug 21, 2026"
  },
  {
    slug: "far-52-244-2-consent-to-subcontracts",
    title: "FAR 52.244-2 and Consent to Subcontracts: What Government Approval Does—and Does Not—Mean",
    description: "Learn what Government consent to a subcontract means under FAR Part 44, what it does not validate, and what subcontractors should still review themselves.",
    category: "FAR & Subcontracting",
    date: "Aug 21, 2026"
  },
  {
    slug: "federal-subcontractor-not-paid-prime-contractor",
    title: "Federal Subcontractor Not Paid by the Prime: What to Check Next",
    description: "A practical response guide for federal subcontractors dealing with nonpayment, including contract terms, documentation, contracting-officer channels, bond rights, and counsel questions.",
    category: "Payment & Collections",
    date: "Aug 20, 2026"
  },
  {
    slug: "prompt-payment-act-federal-subcontractors",
    title: "Does the Prompt Payment Act Protect Federal Subcontractors?",
    description: "Understand where federal prompt-payment rules help subcontractors, where direct rights are limited, and why construction and small-business payment provisions need separate review.",
    category: "Federal Prompt Payment",
    date: "Aug 20, 2026"
  },
  {
    slug: "miller-act-payment-bond-claims",
    title: "Miller Act Payment Bond Claims: Deadlines Federal Construction Subcontractors Should Know",
    description: "Review the 90-day and one-year Miller Act timing rules, notice requirements for lower-tier claimants, bond-copy requests, and waiver limits on covered federal construction work.",
    category: "Federal Construction Payment",
    date: "Aug 20, 2026"
  },
  {
    slug: "fci-vs-cui-dod-subcontractors",
    title: "FCI vs. CUI: What DoD Subcontractors Need to Know Before CMMC",
    description: "Learn the practical difference between Federal Contract Information and Controlled Unclassified Information and why the data your systems handle can change CMMC obligations.",
    category: "CMMC & CUI",
    date: "Aug 20, 2026"
  },
  {
    slug: "cmmc-level-1-vs-level-2",
    title: "CMMC Level 1 vs. Level 2: Which Does a DoD Subcontractor Need?",
    description: "Compare CMMC Level 1 and Level 2, including FCI and CUI triggers, self-assessment versus C3PAO possibilities, and the pre-award questions subcontractors should resolve.",
    category: "CMMC & CUI",
    date: "Aug 20, 2026"
  },
  {
    slug: "cmmc-flowdown-lower-tier-subcontractors",
    title: "Does CMMC Flow Down to Lower-Tier Subcontractors?",
    description: "Review how CMMC requirements move through the DoD supply chain, how FCI and CUI affect the required level, and what primes and lower-tier subcontractors should verify before award.",
    category: "CMMC & Flowdowns",
    date: "Aug 20, 2026"
  },
  {
    slug: "federal-subcontract-agreement-checklist",
    title: "Federal Subcontract Agreement Checklist: What to Review Before Signing",
    description: "A practical checklist for reviewing payment, scope, flowdowns, changes, liability, termination, compliance, and missing documents before you commit.",
    category: "Pre-Award Review",
    date: "Aug 20, 2026"
  },
  {
    slug: "mandatory-vs-optional-far-flowdowns",
    title: "Mandatory vs. Optional FAR Flowdowns: What a Subcontractor Should Know",
    description: "Learn why some federal clauses must reach a subcontract, why others may be prime-drafted choices, and what to ask before accepting a flowdown exhibit.",
    category: "FAR & DFARS Compliance",
    date: "Aug 20, 2026"
  },
  {
    slug: "far-52-244-6-commercial-subcontracts",
    title: "FAR 52.244-6 Explained for Commercial Product and Service Subcontractors",
    description: "Understand how FAR 52.244-6 affects qualifying commercial product and commercial service subcontracts and how to review a broad flowdown list.",
    category: "Commercial Subcontracts",
    date: "Aug 20, 2026"
  },
  {
    slug: "missing-prime-contract-documents",
    title: "Missing Prime Contract Documents: What a Subcontractor Should Request Before Signing",
    description: "Identify incorporated prime-contract sections, scope documents, flowdown exhibits, wage determinations, cyber attachments, and other missing material before signing.",
    category: "Missing Documents",
    date: "Aug 20, 2026"
  },
  {
    slug: "far-flowdown-matrix",
    title: "What Is a FAR Flowdown Matrix—and What If the Prime Does Not Provide One?",
    description: "Learn what a useful flowdown matrix should contain, how it supports clause applicability review, and what to do when the prime provides only a clause list.",
    category: "FAR & DFARS Compliance",
    date: "Aug 20, 2026"
  },
  {
    slug: "cmmc-requirements-dod-subcontractors-2026",
    title: "CMMC Requirements for DoD Subcontractors in 2026",
    description: "Review current CMMC subcontract flowdown, FCI and CUI questions, required CMMC levels, SPRS status, and pre-award issues under the 2026 DFARS framework.",
    category: "CMMC & CUI",
    date: "Aug 20, 2026"
  },
  {
    slug: "government-contracting-payment-traps",
    title: "Pay-When-Paid and Pay-If-Paid: What Federal Subcontractors Should Review",
    description: "Review contingent-payment language, payment timing, and federal subcontract payment context before accepting the prime's terms.",
    category: "Federal Prompt Payment",
    date: "May 20, 2026"
  },
  {
    slug: "understanding-far-flow-down-clauses",
    title: "Understanding FAR Flow-Down Clauses: What Belongs in Your Subcontract",
    description: "Learn how to separate applicable federal flow-downs from additional prime-drafted obligations and request missing context before signing.",
    category: "FAR & DFARS Compliance",
    date: "May 22, 2026"
  },
  {
    slug: "teaming-agreement-vague-scope-liabilities",
    title: "Teaming Agreement Workshare: Clarify Scope Before Award",
    description: "Clarify workshare, scope, exclusivity, and post-award obligations before the prime relies on your participation in a federal pursuit.",
    category: "Pre-Award Strategy",
    date: "May 24, 2026"
  },
  {
    slug: "request-for-equitable-adjustment-under-far",
    title: "Requests for Equitable Adjustment: Notice and Documentation Basics for Subcontractors",
    description: "Review notice, authority, documentation, causation, and cost-support issues that can affect a subcontractor request for equitable adjustment.",
    category: "FAR Adjustments & Claims",
    date: "May 26, 2026"
  },
  {
    slug: "protecting-proprietary-supply-pricing",
    title: "Protecting Proprietary Supply Pricing: NDA Pitfalls for Commercial Trade Distributors",
    description: "Review NDA, confidentiality, use, and disclosure terms that affect proprietary supplier pricing and bills of materials.",
    category: "Supply Chain & IP Defense",
    date: "May 28, 2026"
  },
  {
    slug: "termination-for-convenience-subcontractor-rights",
    title: "Termination for Convenience: What Subcontractors Should Review Before Signing",
    description: "Review termination language, settlement rights, supplier commitments, notice, and cost recovery before accepting a convenience-termination clause.",
    category: "Contract Termination Risk",
    date: "May 30, 2026"
  },
  {
    slug: "broad-form-indemnification-subcontractor-vulnerabilities",
    title: "Broad Indemnification: How Risk Can Shift to the Subcontractor",
    description: "Review indemnity, duty-to-defend, negligence, insurance, and liability language that may shift risk beyond your own scope of work.",
    category: "Liability & Risk Defense",
    date: "Jun 01, 2026"
  },
  {
    slug: "defective-pricing-tina-liability",
    title: "Defective Pricing and Certified Cost or Pricing Data: Subcontractor Risk Points",
    description: "Review certified cost or pricing data, audit, disclosure, and indemnity terms that may create downstream defective-pricing exposure.",
    category: "Federal Audit Risk",
    date: "Jun 02, 2026"
  },
  {
    slug: "unauthorized-change-orders-pm-vs-co",
    title: "Dealing with Unauthorized Change Orders: PM Directions vs. Contracting Officer Authority",
    description: "Review authority, written-notice, constructive-change, and documentation requirements before acting on informal direction.",
    category: "FAR Authority & Liability",
    date: "Jun 02, 2026"
  },
  {
    slug: "fighting-liquidated-damages-delay-claims",
    title: "Liquidated Damages and Delay Claims: Terms to Review Before You Commit",
    description: "Review milestone, causation, notice, waiver, and apportionment terms that affect exposure to liquidated damages and delay backcharges.",
    category: "Delay & Damage Defense",
    date: "Jun 02, 2026"
  },
  {
    slug: "protecting-small-subcontractor-margins",
    title: "Protecting Small Subcontractor Margins Before You Sign",
    description: "A practical pre-award review of payment, scope, liability, termination, change, and flowdown terms that can affect small subcontractor margins.",
    category: "Small Business Defense",
    date: "Jun 02, 2026"
  },
  {
    slug: "davis-bacon-certified-payroll-errors",
    title: "Davis-Bacon Certified Payroll: Classification and Documentation Risks",
    description: "Review wage classifications, payroll documentation, correction duties, and withholding risk on covered federal construction work.",
    category: "GovCon Labor Compliance",
    date: "Jun 02, 2026"
  },
  {
    slug: "buy-american-act-sourcing-mistakes",
    title: "Buy American Act Sourcing: Domestic Content and Documentation Risks",
    description: "Review domestic-content requirements, sourcing documentation, exceptions, substitutions, and contract-specific Buy American obligations.",
    category: "Federal Sourcing Risk",
    date: "Jun 02, 2026"
  },
  {
    slug: "change-order-release-trap",
    title: "Change Order Releases: Watch for Waiver Language Before You Sign",
    description: "Review release and waiver language in change orders, payment applications, and amendments before signing away unresolved impacts.",
    category: "Change Order Management",
    date: "Jun 02, 2026"
  },
  {
    slug: "incorporation-by-reference-ambush",
    title: "Incorporation by Reference: Review Documents You Are Being Asked to Accept",
    description: "Review incorporation-by-reference language and request the prime-contract documents, exhibits, and attachments you are being asked to accept.",
    category: "Contractual Risk Shift",
    date: "Jun 02, 2026"
  },
  {
    slug: "dfars-data-trap-tech-subcontractors",
    title: "DFARS Cybersecurity and Data Rights: Risk Points for Technology Subcontractors",
    description: "Review cybersecurity flow-downs, covered information triggers, data-rights language, background IP, and licensing terms before committing.",
    category: "IT & Professional Services",
    date: "Jun 20, 2026"
  }
];
