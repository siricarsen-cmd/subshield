import type { Metadata } from "next";

export const SITE_NAME = "SubShield";
export const SITE_ORIGIN = "https://www.subshield.net";
export const DEFAULT_TITLE = "Government Subcontract Risk Review | SubShield";
export const DEFAULT_DESCRIPTION =
  "Review government subcontract and teaming packages before you sign. SubShield flags payment traps, missing documents, flow-down risks, and negotiation questions.";

type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface PublicRoute {
  path: string;
  title: string;
  description: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}

const staticPublicRoutes: readonly PublicRoute[] = [
  {
    path: "/",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    changeFrequency: "monthly",
    priority: 1,
  },
  {
    path: "/pricing",
    title: "Pricing & Review Plans",
    description:
      "Compare single reviews, credit packs, and subscription options for AI-assisted screening of government-contracting documents.",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/sample-report",
    title: "Sample Government Subcontract Risk Report",
    description:
      "See how SubShield organizes evidence-grounded findings, risk explanations, and negotiation questions in a sample government subcontract review.",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/about",
    title: "About SubShield",
    description:
      "Learn why SubShield was built to help contractors organize government contract risk review before signing or consulting qualified counsel.",
    changeFrequency: "yearly",
    priority: 0.7,
  },
  {
    path: "/blog",
    title: "Government Subcontract Risk Insights",
    description:
      "Read practical guidance on payment terms, FAR and DFARS flow-downs, scope, change orders, compliance, and other subcontract risks.",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/contact",
    title: "Contact SubShield",
    description:
      "Contact SubShield with questions about document fit, pricing and credits, account access, billing, privacy, security, or technical support.",
    changeFrequency: "yearly",
    priority: 0.5,
  },
  {
    path: "/faq",
    title: "Government Subcontract Review FAQ",
    description:
      "Find answers about SubShield document reviews, supported files, processing, privacy, credits, and the role of qualified legal counsel.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/privacy",
    title: "Privacy Policy",
    description:
      "Read how SubShield handles account information, submitted documents, reports, payments, Contact messages, and related service data.",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/terms",
    title: "Terms of Use",
    description:
      "Read the terms governing SubShield accounts, document reviews, payments, acceptable use, reports, disclaimers, and service access.",
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

const blogArticleRoutes: readonly PublicRoute[] = [
  {
    path: "/blog/government-contracting-payment-traps",
    title: 'The "Pay-When-Paid" Illusion: Weaponizing FAR Compliance to Mask Prime Overreach',
    description:
      "Examine how pay-when-paid clauses interact with federal prompt-payment requirements and what subcontractors can review before signing.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog/understanding-far-flow-down-clauses",
    title: "Deciphering FAR Flow-Down Clauses: What Subcontractors Must Accept vs. What to Delete",
    description:
      "Learn how to distinguish mandatory FAR and DFARS flow-downs from broader prime-contract risk terms in a subcontract.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog/teaming-agreement-vague-scope-liabilities",
    title: "The Teaming Agreement Bait-and-Switch: Preventing Vague Workshares After the Award",
    description:
      "Review workshare, scope, exclusivity, and post-award risks that can arise when a government-contract teaming agreement is vague.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog/request-for-equitable-adjustment-under-far",
    title: "Recovering from Scope Creep: The Subcontractor’s Guide to REAs Under the FAR",
    description:
      "Review notice, documentation, causation, and cost support considerations for subcontractor requests for equitable adjustment under the FAR.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog/protecting-proprietary-supply-pricing",
    title: "Protecting Proprietary Supply Pricing: NDA Pitfalls for Commercial Trade Distributors",
    description:
      "Explore NDA terms, bid-shopping exposure, and practical protections for proprietary supplier pricing and bills of materials.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog/termination-for-convenience-subcontractor-rights",
    title: "The T4C Exit Trap: Knowing Your Rights When the Prime Contractor Pulls the Plug",
    description:
      "Review cost recovery, supplier commitments, notice, and settlement language when a subcontract is terminated for convenience.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog/broad-form-indemnification-subcontractor-vulnerabilities",
    title: "The Danger of Broad Indemnification: Stop Insuring the Prime Contractor's Mistakes",
    description:
      "Examine broad indemnity and duty-to-defend language that can shift a prime contractor’s negligence risk to a subcontractor.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog/defective-pricing-tina-liability",
    title: "Defective Pricing and TINA Liability: When the Prime’s Mistake Becomes Your Legal Problem",
    description:
      "Review defective-pricing, certified cost or pricing data, audit, and indemnity risks that can flow from a prime contract to a subcontractor.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog/unauthorized-change-orders-pm-vs-co",
    title: "Dealing with Unauthorized Change Orders: PM Directions vs. Contracting Officer Authority",
    description:
      "Understand authority limits, written notice, constructive changes, and documentation risks when field directions alter subcontract work.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog/fighting-liquidated-damages-delay-claims",
    title: "Fighting Back Against Liquidated Damages: Defending Your Ledger from Unfair Delay Claims",
    description:
      "Review milestone, causation, notice, apportionment, and waiver terms that affect subcontractor exposure to liquidated damages.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog/protecting-small-subcontractor-margins",
    title: "Built for the Field: Why Small Trade Contractors Are the Target of Bad Contracts, and How to Fight Back",
    description:
      "Review payment, scope, indemnity, termination, change-order, and flow-down terms that can put small subcontractor margins at risk.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog/davis-bacon-certified-payroll-errors",
    title: "The Certified Payroll Trap: How Labor Misclassifications Liquidate Your Project Retention",
    description:
      "Review certified payroll classifications, documentation, correction duties, and payment-withholding risks on Davis-Bacon work.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog/buy-american-act-sourcing-mistakes",
    title: "The BAA Procurement Blindspot: Why Your Submittal Packages Are Gating Your Cash Flow",
    description:
      "Review Buy American Act sourcing, domestic-content documentation, substitutions, and payment risks in government subcontracts.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog/change-order-release-trap",
    title: 'The Change Order Release Trap: How "Signing for Progress" Forfeits Delay Claims',
    description:
      "Examine release and waiver language in change orders, payment applications, and amendments that may affect delay or impact claims.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog/incorporation-by-reference-ambush",
    title: "The Incorporation by Reference Ambush: Agreeing to Plans You’ve Never Seen",
    description:
      "Review incorporation-by-reference clauses, missing prime-contract documents, scope conflicts, and downstream obligations before signing.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/blog/dfars-data-trap-tech-subcontractors",
    title: "The DFARS Data Trap: Protecting Your Tech Firm's IP from Predatory Subcontracts",
    description:
      "Review DFARS cybersecurity flow-downs, data-rights language, background IP, and licensing risks for technology subcontractors.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
];

export const publicRoutes: readonly PublicRoute[] = [
  ...staticPublicRoutes,
  ...blogArticleRoutes,
];

export const privateRoutes = [
  "/dashboard",
  "/forgot-password",
  "/intake",
  "/login",
  "/report/[id]",
  "/reset-password",
  "/success",
] as const;

export function siteUrl(path: string): string {
  return path === "/" ? SITE_ORIGIN : new URL(path, `${SITE_ORIGIN}/`).toString();
}

export function getPublicRoute(path: string): PublicRoute {
  const route = publicRoutes.find((candidate) => candidate.path === path);

  if (!route) {
    throw new Error(`Missing SEO configuration for public route: ${path}`);
  }

  return route;
}

export function createPublicMetadata(path: string): Metadata {
  const route = getPublicRoute(path);
  const fullTitle = route.path === "/" ? route.title : `${route.title} | ${SITE_NAME}`;

  return {
    title: route.path === "/" ? { absolute: route.title } : route.title,
    description: route.description,
    alternates: {
      canonical: siteUrl(route.path),
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      siteName: SITE_NAME,
      title: fullTitle,
      description: route.description,
      url: siteUrl(route.path),
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description: route.description,
    },
  };
}

export function createPrivateMetadata(title: string): Metadata {
  return {
    title,
    description: null,
    alternates: {
      canonical: null,
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noarchive: true,
        noimageindex: true,
      },
    },
    openGraph: null,
    twitter: null,
  };
}
