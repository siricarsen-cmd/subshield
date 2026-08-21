import type { Metadata } from "next";
import { posts } from "@/app/blog/articleData";
import { resolveCanonicalProductionOrigin } from "./production-origin";

export const SITE_NAME = "SubPreCheck";
export const SITE_ORIGIN = resolveCanonicalProductionOrigin();
export const DEFAULT_TITLE = "Federal Subcontract Risk Review | SubPreCheck";
export const DEFAULT_DESCRIPTION =
  "Review federal subcontract, teaming, and prime-provided bid packages before you commit. SubPreCheck surfaces payment, scope, flowdown, compliance, and missing-document risks for a better-prepared attorney handoff.";

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
      "Compare single reviews, credit packs, and subscription options for structured first-pass screening of federal subcontract documents.",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/sample-report",
    title: "Sample Government Subcontract Risk Report",
    description:
      "See how SubPreCheck organizes evidence-grounded findings, risk explanations, and negotiation questions in a sample government subcontract review.",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/about",
    title: "About SubPreCheck",
    description:
      "Learn why SubPreCheck was built to help contractors organize government contract risk review before signing or consulting qualified counsel.",
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
    title: "Contact SubPreCheck",
    description:
      "Contact SubPreCheck with questions about document fit, pricing and credits, account access, billing, privacy, security, or technical support.",
    changeFrequency: "yearly",
    priority: 0.5,
  },
  {
    path: "/faq",
    title: "Government Subcontract Review FAQ",
    description:
      "Find answers about SubPreCheck document reviews, supported files, processing, privacy, credits, and the role of qualified legal counsel.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/privacy",
    title: "Privacy Policy",
    description:
      "Read how SubPreCheck handles account information, submitted documents, reports, payments, Contact messages, and related service data.",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/terms",
    title: "Terms of Use",
    description:
      "Read the terms governing SubPreCheck accounts, document reviews, payments, acceptable use, reports, disclaimers, and service access.",
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

const blogArticleRoutes: readonly PublicRoute[] = posts.map<PublicRoute>((post) => ({
  path: `/blog/${post.slug}`,
  title: post.title,
  description: post.description,
  changeFrequency: "monthly",
  priority: 0.7,
}));

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
