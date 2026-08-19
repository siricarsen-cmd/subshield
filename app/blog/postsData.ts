export interface Post {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
}

export const posts: Post[] = [
  {
    slug: "government-contracting-payment-traps",
    title: "Pay-When-Paid and Pay-If-Paid: What Federal Subcontractors Should Review",
    description: "Review contingent-payment language, payment timing, withholding rights, and federal construction payment provisions before accepting the prime's terms.",
    category: "Federal Prompt Payment",
    date: "May 20, 2026"
  },
  {
    slug: "understanding-far-flow-down-clauses",
    title: "Understanding FAR Flow-Down Clauses: What Belongs in Your Subcontract",
    description: "Learn how to distinguish clause requirements that apply to your subcontract from additional prime-drafted obligations that need separate review.",
    category: "FAR & DFARS Compliance",
    date: "May 22, 2026"
  },
  {
    slug: "teaming-agreement-vague-scope-liabilities",
    title: "Teaming Agreement Workshare: Clarify Scope Before Award",
    description: "Clarify workshare, scope, exclusivity, proposal responsibilities, and post-award expectations before your company commits bid resources.",
    category: "Pre-Award Strategy",
    date: "May 24, 2026"
  },
  {
    slug: "request-for-equitable-adjustment-under-far",
    title: "Requests for Equitable Adjustment: Notice and Documentation Basics for Subcontractors",
    description: "Review change authority, notice, documentation, pass-through, and pricing requirements before extra work becomes a disputed cost.",
    category: "FAR Adjustments & Claims",
    date: "May 26, 2026"
  },
  {
    slug: "protecting-proprietary-supply-pricing",
    title: "Protecting Proprietary Supply Pricing: NDA Pitfalls for Commercial Trade Distributors",
    description: "Review whether pre-bid NDAs, RFQs, and portal terms actually protect pricing matrices, bills of materials, supplier relationships, and engineering work product.",
    category: "Supply Chain & IP Defense",
    date: "May 28, 2026"
  },
  {
    slug: "termination-for-convenience-subcontractor-rights",
    title: "Termination for Convenience: What Subcontractors Should Review Before Signing",
    description: "Review the subcontract's termination-for-convenience clause before signing so you understand notice, closeout, supplier commitments, and what costs may be recoverable.",
    category: "Contract Termination Risk",
    date: "May 30, 2026"
  },
  {
    slug: "broad-form-indemnification-subcontractor-vulnerabilities",
    title: "Broad Indemnification: How Risk Can Shift to the Subcontractor",
    description: "Review indemnity, duty-to-defend, negligence, insurance, and governing-law language before accepting liability outside your own scope.",
    category: "Liability & Risk Defense",
    date: "Jun 01, 2026"
  },
  {
    slug: "defective-pricing-tina-liability",
    title: "Defective Pricing and Certified Cost or Pricing Data: Subcontractor Risk Points",
    description: "Review certified cost or pricing data, audit, disclosure, recordkeeping, and downstream price-adjustment terms when they apply to your subcontract.",
    category: "Federal Audit Risk",
    date: "Jun 02, 2026"
  },
  {
    slug: "unauthorized-change-orders-pm-vs-co",
    title: "Dealing with Unauthorized Change Orders: PM Directions vs. Contracting Officer Authority",
    description: "Review who has authority to direct changes, what written notice is required, and how extra work must be documented before field instructions become disputed cost.",
    category: "FAR Authority & Liability",
    date: "Jun 02, 2026"
  },
  {
    slug: "fighting-liquidated-damages-delay-claims",
    title: "Liquidated Damages and Delay Claims: Terms to Review Before You Commit",
    description: "Review critical-path responsibility, notice, apportionment, owner liquidated damages, and no-damages-for-delay language before accepting schedule risk.",
    category: "Delay & Damage Defense",
    date: "Jun 02, 2026"
  },
  {
    slug: "protecting-small-subcontractor-margins",
    title: "Protecting Small Subcontractor Margins Before You Sign",
    description: "A practical pre-award checklist for payment, scope, change, liability, termination, and flowdown terms that can affect a small subcontractor's margin.",
    category: "Small Business Defense",
    date: "Jun 02, 2026"
  },
  {
    slug: "davis-bacon-certified-payroll-errors",
    title: "Davis-Bacon Certified Payroll: Classification and Documentation Risks",
    description: "Review wage determinations, classifications, certified-payroll duties, correction procedures, and withholding language on covered federal construction work.",
    category: "GovCon Labor Compliance",
    date: "Jun 02, 2026"
  },
  {
    slug: "buy-american-act-sourcing-mistakes",
    title: "Buy American Act Sourcing: Domestic Content and Documentation Risks",
    description: "Review the exact domestic-preference clause, product classification, sourcing evidence, exceptions, and substitution process before committing to federal material requirements.",
    category: "Federal Sourcing Risk",
    date: "Jun 02, 2026"
  }
];
