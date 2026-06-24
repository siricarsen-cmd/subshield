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
    title: "The 'Pay-When-Paid' Illusion: Weaponizing FAR Compliance to Mask Prime Overreach",
    description: "How general contractors falsely invoke federal acquisition rules to justify withholding cash flow from trade subcontractors.",
    category: "Federal Prompt Payment",
    date: "May 20, 2026"
  },
  {
    slug: "understanding-far-flow-down-clauses",
    title: "Deciphering FAR Flow-Down Clauses: What Subcontractors Must Accept vs. What to Delete",
    description: "Stop falling for the prime contractor's biggest bluff. Learn how to separate mandatory federal flow-downs from predatory risk-shifting.",
    category: "FAR & DFARS Compliance",
    date: "May 22, 2026"
  },
  {
    slug: "teaming-agreement-vague-scope-liabilities",
    title: "The Teaming Agreement Bait-and-Switch: Preventing Vague Workshares After the Award",
    description: "Don't let a prime contractor ride your qualifications to a federal win, only to freeze you out of the project scope once the check clears.",
    category: "Pre-Award Strategy",
    date: "May 24, 2026"
  },
  {
    slug: "request-for-equitable-adjustment-under-far",
    title: "Recovering from Scope Creep: The Subcontractor’s Guide to REAs Under the FAR",
    description: "Stop eating the costs of unapproved field changes. Learn how to construct a bulletproof Request for Equitable Adjustment that forces payment.",
    category: "FAR Adjustments & Claims",
    date: "May 26, 2026"
  },
  {
    slug: "protecting-proprietary-supply-pricing",
    title: "Protecting Proprietary Supply Pricing: NDA Pitfalls for Commercial Trade Distributors",
    description: "How standard non-disclosure agreements leave your custom bills of materials and specialized vendor quote channels completely exposed.",
    category: "Supply Chain & IP Defense",
    date: "May 28, 2026"
  },
  {
    slug: "termination-for-convenience-subcontractor-rights",
    title: "The T4C Exit Trap: Knowing Your Rights When the Prime Contractor Pulls the Plug",
    description: "Discover how to recover mobilization overhead, custom fabrication commitments, and earned profits when a project is cut short.",
    category: "Contract Termination Risk",
    date: "May 30, 2026"
  },
  {
    slug: "broad-form-indemnification-subcontractor-vulnerabilities",
    title: "The Danger of Broad Indemnification: Stop Insuring the Prime Contractor's Mistakes",
    description: "How signing a standard, one-sided indemnity clause forces your trade company to pay for damages caused entirely by the general contractor.",
    category: "Liability & Risk Defense",
    date: "Jun 01, 2026"
  },
  {
    slug: "defective-pricing-tina-liability",
    title: "Defective Pricing and TINA Liability: When the Prime’s Mistake Becomes Your Legal Problem",
    description: "How federal truth-in-negotiation thresholds allow general contractors to pass massive government compliance penalties down.",
    category: "Federal Audit Risk",
    date: "Jun 02, 2026"
  },
  {
    slug: "unauthorized-change-orders-pm-vs-co",
    title: "Dealing with Unauthorized Change Orders: PM Directions vs. Contracting Officer Authority",
    description: "Discover why following verbal instructions from a field superintendent could force your business to absorb thousands in unrecoverable labor.",
    category: "FAR Authority & Liability",
    date: "Jun 02, 2026"
  },
  {
    slug: "fighting-liquidated-damages-delay-claims",
    title: "Fighting Back Against Liquidated Damages: Defending Your Ledger from Unfair Delay Claims",
    description: "How general contractors weaponize milestone schedules to back-charge trade partners for cascading delays caused by other crews.",
    category: "Delay & Damage Defense",
    date: "Jun 02, 2026"
  },
  {
    slug: "protecting-small-subcontractor-margins",
    title: "Built for the Field: Why Small Trade Contractors Are the Target of Bad Contracts, and How to Fight Back",
    description: "How general contractors exploit the lack of dedicated legal departments in small trade businesses to shift absolute project liability.",
    category: "Small Business Defense",
    date: "Jun 02, 2026"
  },
  {
    slug: "davis-bacon-certified-payroll-errors",
    title: "The Certified Payroll Trap: How Labor Misclassifications Liquidate Your Project Retention",
    description: "How minor administrative oversights on weekly Davis-Bacon Act logs give general contractors the legal leverage to freeze progress payments.",
    category: "GovCon Labor Compliance",
    date: "Jun 02, 2026"
  },
  {
    slug: "buy-american-act-sourcing-mistakes",
    title: "The BAA Procurement Blindspot: Why Your Submittal Packages Are Gating Your Cash Flow",
    description: "How a misunderstanding of the Buy American Act domestic content test forces trade subcontractors to eat thousands in replacement costs.",
    category: "Federal Sourcing Risk",
    date: "Jun 02, 2026"
  },
  {
    slug: "change-order-release-trap",
    title: "The Change Order Release Trap: How 'Signing for Progress' Forfeits Delay Claims",
    description: "How general contractors leverage minor document adjustments to trick trade subcontractors into waiving massive overhead and extension claims.",
    category: "Change Order Management",
    date: "Jun 02, 2026"
  },
  {
    slug: "incorporation-by-reference-ambush",
    title: "The Incorporation by Reference Ambush: Agreeing to Plans You’ve Never Seen",
    description: "How a single sentence in a standard subcontract legally binds your trade business to hundreds of pages of hidden prime contract liabilities.",
    category: "Contractual Risk Shift",
    date: "Jun 02, 2026"
  },
  {
    slug: "dfars-data-trap-tech-subcontractors",
    title: "The DFARS Data Trap: Protecting Your Tech Firm's IP from Predatory Subcontracts",
    description: "How prime contractors use blanket cybersecurity flow-downs and vague data rights to strip software vendors and IT subcontractors of their margins and proprietary code.",
    category: "IT & Professional Services",
    date: "Jun 20, 2026"
  }
];