export interface TopicHubLink {
  href: string;
  label: string;
}

export function topicHubForCategory(category: string): TopicHubLink {
  const value = category.toLowerCase();

  if (value.includes("cyber") || value.includes("cmmc")) {
    return { href: "/blog/cmmc-cybersecurity-subcontractor-hub", label: "CMMC & DoD Cybersecurity Hub" };
  }
  if (value.includes("labor") || value.includes("wage")) {
    return { href: "/blog/federal-subcontract-labor-wage-hub", label: "Federal Labor & Wage Hub" };
  }
  if (value.includes("data") || value.includes("audit") || value.includes("pricing compliance")) {
    return { href: "/blog/dod-data-rights-audit-hub", label: "Data Rights, IP, Audit & Records Hub" };
  }
  if (value.includes("flowdown") || value.includes("far & dfars")) {
    return { href: "/blog/far-dfars-flowdown-hub", label: "FAR & DFARS Flowdown Hub" };
  }
  if (value.includes("payment") || value.includes("cash flow")) {
    return { href: "/blog/federal-subcontract-payment-hub", label: "Federal Subcontract Payment Hub" };
  }
  if (value.includes("teaming") || value.includes("small business") || value.includes("workshare")) {
    return { href: "/blog/teaming-small-business-subcontracting-hub", label: "Teaming, Workshare & Small Business Hub" };
  }
  if (value.includes("sourcing") || value.includes("supply") || value.includes("quality") || value.includes("property")) {
    return { href: "/blog/federal-subcontract-supply-quality-sourcing-hub", label: "Supply Chain, Quality & Sourcing Hub" };
  }
  if (value.includes("liability") || value.includes("insurance") || value.includes("termination") || value.includes("dispute")) {
    return { href: "/blog/federal-subcontract-liability-termination-disputes-hub", label: "Liability, Termination & Disputes Hub" };
  }
  if (value.includes("change") || value.includes("claim") || value.includes("delay") || value.includes("schedule")) {
    return { href: "/blog/federal-subcontract-changes-claims-hub", label: "Changes, REAs & Claims Hub" };
  }

  return { href: "/blog/federal-subcontract-before-you-sign-hub", label: "Federal Subcontract Review Hub" };
}
