export interface Post {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
}

export const posts: Post[] = [
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