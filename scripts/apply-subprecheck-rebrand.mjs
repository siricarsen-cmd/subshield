import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const changed = new Set();

function read(path) {
  return readFileSync(path, "utf8");
}

function write(path, content) {
  writeFileSync(path, content);
  changed.add(path);
}

function replaceAllInFile(path, from, to) {
  if (!existsSync(path)) return;
  const before = read(path);
  const after = before.split(from).join(to);
  if (after !== before) write(path, after);
}

function replaceMany(path, replacements) {
  if (!existsSync(path)) return;
  let content = read(path);
  const before = content;
  for (const [from, to] of replacements) content = content.split(from).join(to);
  if (content !== before) write(path, content);
}

const blogSlugs = [
  "government-contracting-payment-traps",
  "understanding-far-flow-down-clauses",
  "teaming-agreement-vague-scope-liabilities",
  "request-for-equitable-adjustment-under-far",
  "protecting-proprietary-supply-pricing",
  "termination-for-convenience-subcontractor-rights",
  "broad-form-indemnification-subcontractor-vulnerabilities",
  "defective-pricing-tina-liability",
  "unauthorized-change-orders-pm-vs-co",
  "fighting-liquidated-damages-delay-claims",
  "protecting-small-subcontractor-margins",
  "davis-bacon-certified-payroll-errors",
  "buy-american-act-sourcing-mistakes",
  "change-order-release-trap",
  "incorporation-by-reference-ambush",
  "dfars-data-trap-tech-subcontractors",
];

const brandFiles = [
  "components/Navbar.tsx",
  "components/Footer.tsx",
  "components/FinalCTA.tsx",
  "components/dashboard/intake-hub.tsx",
  "app/page.tsx",
  "app/pricing/page.tsx",
  "app/faq/page.tsx",
  "app/about/page.tsx",
  "app/contact/page.tsx",
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
  "app/sample-report/page.tsx",
  "app/dashboard/page.tsx",
  "app/report/[id]/page.tsx",
  "app/login/page.tsx",
  "app/forgot-password/page.tsx",
  "app/reset-password/page.tsx",
  "app/success/page.tsx",
  "app/intake/page.tsx",
  "app/blog/page.tsx",
  "app/blog/articleData.ts",
  "app/blog/postsData.ts",
  "lib/seo.ts",
  "lib/contact-email.ts",
  "lib/checkout-session.ts",
  "app/api/contact/route.ts",
  ...blogSlugs.map((slug) => `app/blog/${slug}/page.tsx`),
];

// Deliberate public/app branding replacement only. Lower-case domains and
// infrastructure identifiers are intentionally untouched for pre-cutover safety.
for (const path of brandFiles) replaceAllInFile(path, "SubShield", "SubPreCheck");
replaceAllInFile("app/dashboard/page.tsx", "SUBSHIELD", "SUBPRECHECK");

replaceMany("components/Footer.tsx", [
  [
    "Government subcontracting risk review for small businesses. Spot risks early, ask better questions, and protect your margins.",
    "Federal subcontract risk review for small businesses. Surface issues early, organize the package, and prepare focused questions before you commit.",
  ],
]);

replaceMany("app/page.tsx", [
  ["Pre-Award Risk Review", "Federal Subcontract Risk Review"],
  [
    "Review prime subcontract risk before you bid, sign, or commit.",
    "Know the risks before you bid, sign, or commit.",
  ],
  [
    "SubPreCheck helps contractors review government subcontract, teaming, and prime-provided bid packages before attorney review — flagging payment traps, missing documents, vague scopes, flowdown risks, and negotiation questions to send back to the prime.",
    "SubPreCheck gives federal subcontractors a structured first-pass review of prime-provided packages — surfacing payment, scope, flowdown, compliance, and missing-document issues before the package reaches counsel.",
  ],
  [
    "SubPreCheck flags common risk areas before you commit or send the package to counsel.",
    "SubPreCheck surfaces common risk areas before you commit and organizes the issues for discussion with the prime or counsel.",
  ],
  [
    "After the prime responds, SubPreCheck recommends sending the revised package to qualified legal counsel for final review.",
    "After the prime responds, send the revised package to qualified legal counsel so attorney time can focus on the legal questions that require legal judgment.",
  ],
]);

replaceMany("app/pricing/page.tsx", [
  [
    "No. SubPreCheck provides AI-assisted, evidence-grounded screening and preparation materials, not legal advice or legal opinions. Use the report to organize questions and consult qualified government-contracts counsel before signing or relying on final contract terms.",
    "No. SubPreCheck provides structured, evidence-grounded first-pass screening and preparation materials, not legal advice or legal opinions. Use the report to organize issues before counsel so attorney time can focus on the legal questions that require legal judgment.",
  ],
  [
    "Choose a one-time credit purchase or a monthly plan based on your review volume. Each credit covers one complete document ingestion and analysis.",
    "Choose a one-time credit purchase or a monthly plan based on your review volume. Each credit covers one complete document ingestion and analysis, helping you organize issues before final legal review.",
  ],
]);

replaceMany("app/faq/page.tsx", [
  [
    "No. SubPreCheck is an automated contract risk-screening and document-organization tool. It identifies targeted government-contracting issues, quotes supporting contract text, and organizes questions for negotiation and attorney review. SubPreCheck does not provide legal advice, legal opinions, or legal representation.",
    "No. SubPreCheck is a structured first-pass contract risk-screening and document-organization tool. It identifies targeted government-contracting issues, quotes supporting contract text, and organizes questions for discussion with the prime and attorney review. SubPreCheck does not provide legal advice, legal opinions, or legal representation.",
  ],
]);

if (existsSync("app/faq/page.tsx")) {
  let faq = read("app/faq/page.tsx");
  if (!faq.includes("How can SubPreCheck help make attorney review more efficient?")) {
    const marker = "    {\n      icon: Shield,\n      q: \"How are my documents and reports handled?\"";
    const inserted = `    {\n      icon: Scale,\n      q: \"How can SubPreCheck help make attorney review more efficient?\",\n      a: \"SubPreCheck can surface missing documents, organize evidence-grounded issues, and prepare focused questions before the package reaches counsel. A better-prepared package can reduce time spent on first-pass organization and help reserve attorney time for legal judgment and final review.\"\n    },\n`;
    if (!faq.includes(marker)) throw new Error("FAQ insertion marker not found");
    faq = faq.replace(marker, inserted + marker);
    write("app/faq/page.tsx", faq);
  }
}

replaceMany("app/about/page.tsx", [
  [
    "Built to help small businesses slow down, protect their margins, and clarify the details before they sign.",
    "Built to help small federal subcontractors understand the package before they commit.",
  ],
  [
    "In those high-stakes environments, details meant everything. A single overlooked line item or an unverified risk-shifting clause could easily wipe out an entire project's profit margin.",
    "In those high-stakes environments, details mattered. An overlooked line item or poorly understood risk-shifting term could materially affect cost, margin, or performance obligations.",
  ],
  [
    "SubPreCheck was built directly from that operational contractor mindset. It is not a law firm; it is a direct tool to organize your contract review, protect your working capital, and help you ask the right questions before you involve legal counsel and begin performance.",
    "SubPreCheck was built from that operational contractor mindset. It is not a law firm; it is a first-pass review and organization tool designed to surface issues, identify missing information, and prepare a better package before qualified legal counsel performs final review.",
  ],
  [
    "Isolate mandatory FAR flow-downs, strip out unfair liabilities, and organize your files before your formal legal review begins.",
    "Review flow-downs, identify risk-shifting terms, and organize the package before formal legal review begins.",
  ],
]);

replaceMany("app/contact/page.tsx", [
  [
    "SubPreCheck is an AI-assisted contract risk-screening tool, not a\n                law firm.",
    "SubPreCheck is a structured first-pass contract risk-screening tool, not a\n                law firm.",
  ],
]);

replaceMany("app/blog/page.tsx", [
  ["Contract Strategy & Operational Survival Guides", "Federal Subcontract Risk Guides"],
  [
    "Plain-English intelligence, federal procurement breakdowns, and contract risk mitigation strategies explicitly engineered to defend subcontractor margins.",
    "Practical guidance on federal subcontract terms, flowdowns, payment, scope, compliance, and the questions to resolve before you commit.",
  ],
  [
    "Stop Risking Your Retention on Predatory Contract Boilerplate",
    "Review the Terms Before They Become Your Obligation",
  ],
  [
    "Isolate unfair indemnities, identify hidden liability flow-downs, and secure your payment thresholds before your crews ever set foot on site.",
    "Surface risk-shifting terms, missing flowdowns, and payment questions before you bid, sign, or commit resources — then organize the package for final legal review.",
  ],
]);

const titleMap = new Map([
  ["The 'Pay-When-Paid' Illusion: Weaponizing FAR Compliance to Mask Prime Overreach", "Pay-When-Paid and Pay-If-Paid: What Federal Subcontractors Should Review"],
  ['The "Pay-When-Paid" Illusion: Weaponizing FAR Compliance to Mask Prime Overreach', "Pay-When-Paid and Pay-If-Paid: What Federal Subcontractors Should Review"],
  ["Deciphering FAR Flow-Down Clauses: What Subcontractors Must Accept vs. What to Delete", "Understanding FAR Flow-Down Clauses: What Belongs in Your Subcontract"],
  ["The Teaming Agreement Bait-and-Switch: Preventing Vague Workshares After the Award", "Teaming Agreement Workshare: Clarify Scope Before Award"],
  ["Recovering from Scope Creep: The Subcontractor’s Guide to REAs Under the FAR", "Requests for Equitable Adjustment: Notice and Documentation Basics for Subcontractors"],
  ["The T4C Exit Trap: Knowing Your Rights When the Prime Contractor Pulls the Plug", "Termination for Convenience: What Subcontractors Should Review Before Signing"],
  ["The Danger of Broad Indemnification: Stop Insuring the Prime Contractor's Mistakes", "Broad Indemnification: How Risk Can Shift to the Subcontractor"],
  ["Defective Pricing and TINA Liability: When the Prime’s Mistake Becomes Your Legal Problem", "Defective Pricing and Certified Cost or Pricing Data: Subcontractor Risk Points"],
  ["Fighting Back Against Liquidated Damages: Defending Your Ledger from Unfair Delay Claims", "Liquidated Damages and Delay Claims: Terms to Review Before You Commit"],
  ["Built for the Field: Why Small Trade Contractors Are the Target of Bad Contracts, and How to Fight Back", "Protecting Small Subcontractor Margins Before You Sign"],
  ["The Certified Payroll Trap: How Labor Misclassifications Liquidate Your Project Retention", "Davis-Bacon Certified Payroll: Classification and Documentation Risks"],
  ["The BAA Procurement Blindspot: Why Your Submittal Packages Are Gating Your Cash Flow", "Buy American Act Sourcing: Domestic Content and Documentation Risks"],
  ["The Change Order Release Trap: How 'Signing for Progress' Forfeits Delay Claims", "Change Order Releases: Watch for Waiver Language Before You Sign"],
  ['The Change Order Release Trap: How "Signing for Progress" Forfeits Delay Claims', "Change Order Releases: Watch for Waiver Language Before You Sign"],
  ["The Incorporation by Reference Ambush: Agreeing to Plans You’ve Never Seen", "Incorporation by Reference: Review Documents You Are Being Asked to Accept"],
  ["The DFARS Data Trap: Protecting Your Tech Firm's IP from Predatory Subcontracts", "DFARS Cybersecurity and Data Rights: Risk Points for Technology Subcontractors"],
]);

const blogTitleTargets = ["app/blog/articleData.ts", "lib/seo.ts", ...blogSlugs.map((slug) => `app/blog/${slug}/page.tsx`)];
for (const path of blogTitleTargets) {
  for (const [from, to] of titleMap) replaceAllInFile(path, from, to);
}

replaceMany("app/blog/articleData.ts", [
  ["How general contractors falsely invoke federal acquisition rules to justify withholding cash flow from trade subcontractors.", "Review contingent-payment language, payment timing, and federal subcontract payment context before accepting the prime's terms."],
  ["Stop falling for the prime contractor's biggest bluff. Learn how to separate mandatory federal flow-downs from predatory risk-shifting.", "Learn how to separate applicable federal flow-downs from additional prime-drafted obligations and request missing context before signing."],
  ["Don't let a prime contractor ride your qualifications to a federal win, only to freeze you out of the project scope once the check clears.", "Clarify workshare, scope, exclusivity, and post-award obligations before the prime relies on your participation in a federal pursuit."],
  ["Stop eating the costs of unapproved field changes. Learn how to construct a bulletproof Request for Equitable Adjustment that forces payment.", "Review notice, authority, documentation, causation, and cost-support issues that can affect a subcontractor request for equitable adjustment."],
  ["How standard non-disclosure agreements leave your custom bills of materials and specialized vendor quote channels completely exposed.", "Review NDA, confidentiality, use, and disclosure terms that affect proprietary supplier pricing and bills of materials."],
  ["Discover how to recover mobilization overhead, custom fabrication commitments, and earned profits when a project is cut short.", "Review termination language, settlement rights, supplier commitments, notice, and cost recovery before accepting a convenience-termination clause."],
  ["How signing a standard, one-sided indemnity clause forces your trade company to pay for damages caused entirely by the general contractor.", "Review indemnity, duty-to-defend, negligence, insurance, and liability language that may shift risk beyond your own scope of work."],
  ["How federal truth-in-negotiation thresholds allow general contractors to pass massive government compliance penalties down.", "Review certified cost or pricing data, audit, disclosure, and indemnity terms that may create downstream defective-pricing exposure."],
  ["Discover why following verbal instructions from a field superintendent could force your business to absorb thousands in unrecoverable labor.", "Review authority, written-notice, constructive-change, and documentation requirements before acting on informal direction."],
  ["How general contractors weaponize milestone schedules to back-charge trade partners for cascading delays caused by other crews.", "Review milestone, causation, notice, waiver, and apportionment terms that affect exposure to liquidated damages and delay backcharges."],
  ["How general contractors exploit the lack of dedicated legal departments in small trade businesses to shift absolute project liability.", "A practical pre-award review of payment, scope, liability, termination, change, and flowdown terms that can affect small subcontractor margins."],
  ["How minor administrative oversights on weekly Davis-Bacon Act logs give general contractors the legal leverage to freeze progress payments.", "Review wage classifications, payroll documentation, correction duties, and withholding risk on covered federal construction work."],
  ["How a misunderstanding of the Buy American Act domestic content test forces trade subcontractors to eat thousands in replacement costs.", "Review domestic-content requirements, sourcing documentation, exceptions, substitutions, and contract-specific Buy American obligations."],
  ["How general contractors leverage minor document adjustments to trick trade subcontractors into waiving massive overhead and extension claims.", "Review release and waiver language in change orders, payment applications, and amendments before signing away unresolved impacts."],
  ["How a single sentence in a standard subcontract legally binds your trade business to hundreds of pages of hidden prime contract liabilities.", "Review incorporation-by-reference language and request the prime-contract documents, exhibits, and attachments you are being asked to accept."],
  ["How prime contractors use blanket cybersecurity flow-downs and vague data rights to strip software vendors and IT subcontractors of their margins and proprietary code.", "Review cybersecurity flow-downs, covered information triggers, data-rights language, background IP, and licensing terms before committing."],
]);

// Soften recurring rhetoric in article bodies without changing slugs or technical citations.
const bodyToneReplacements = [
  ["predatory", "one-sided"],
  ["Predatory", "One-Sided"],
  ["weaponizes", "uses"],
  ["weaponize", "use"],
  ["Weaponizing", "Using"],
  ["bait-and-switch", "workshare uncertainty"],
  ["Bait-and-Switch", "Workshare Uncertainty"],
  ["Fighting Back", "Reviewing"],
  ["fight back", "respond"],
  ["bulletproof", "well-supported"],
  ["completely exposed", "insufficiently protected"],
];
for (const slug of blogSlugs) replaceMany(`app/blog/${slug}/page.tsx`, bodyToneReplacements);

replaceMany("app/sample-report/page.tsx", [
  ["Sample Audit Environment", "Sample Report Environment"],
  ["Targeted regulatory exposure assessment for:", "Illustrative risk-review summary for:"],
  ["8 Active Liability Flags Isolated", "8 Illustrative Risk Flags"],
  ["Consolidated Prime Negotiation Email", "Consolidated Prime Question Draft"],
  ["Isolated Contract Revisions", "Illustrative Contract Issues"],
  ["Use this consolidated briefing to request document clarifications and negotiate terms before engaging outside counsel.", "Use this illustrative briefing as a starting point for document clarifications, prime-contractor questions, and discussion with qualified counsel."],
  ["Before we can execute and begin mobilization, we need to clarify a few liability shifts embedded in the draft terms that fall outside standard industry parameters.", "Before we execute and begin mobilization, we would like to clarify several terms in the draft that may affect liability, payment, and schedule risk."],
  ["The current broad-form language requires us to insure the Prime Contractor's independent negligence. This must be narrowed to cover only damages caused directly by our specific scope of work.", "The current language appears broad enough to reach losses outside our own acts or omissions. Please clarify the intended allocation of responsibility and consider narrowing the clause to losses caused by our work."],
  ["The current draft establishes a strict \"Pay-If-Paid\" condition precedent. We cannot finance the federal government's payment delays. This must be converted to a standard \"Pay-When-Paid\" structure with a reasonable time stop (e.g., 45 days).", "The current draft appears to condition payment on the Prime Contractor's receipt of funds. Please clarify whether this is intended as a condition precedent and whether the parties can use a defined payment deadline instead."],
  ["Article 3 of the standard terms attempts to force your firm to indemnify the Prime Contractor even if the Prime Contractor independently causes the damage.", "Article 3 appears broad enough to require indemnification for some losses that may not be caused by the subcontractor. The scope should be confirmed before signing."],
  ["Delete the broad phrase in Article 3 and replace it with:", "A discussion point for counsel is whether the clause should be narrowed with language such as:"],
  ["Section 5 explicitly shifts the absolute risk of federal non-payment onto your ledger. If the government defunds the project, the prime has zero legal obligation to pay you for completed work.", "Section 5 appears to shift substantial non-payment risk to the subcontractor by conditioning payment on the Prime Contractor's receipt of funds. Confirm the clause's legal effect and available payment protections with qualified counsel."],
  ["The Prime has blindly flowed down enterprise-level DOD cybersecurity requirements. If your scope does not touch CUI, you must actively exempt your firm or face massive unbillable compliance audits.", "The draft flows down DoD cybersecurity requirements. Confirm whether the clause applies to the subcontract scope, what covered information is involved, and what compliance cost should be reflected in pricing before accepting the obligation."],
  ["This clause legally strips your right to request overhead compensation if the Prime's poor management idles your field crews.", "This clause may limit recovery of delay-related costs, including some overhead, even when the subcontractor did not cause the delay. Review the exceptions, notice rules, and governing law with counsel."],
  ["Target Redline Alternative Map:", "Discussion Point:"],
]);

replaceMany("app/dashboard/page.tsx", [
  ["Run Triage On Pasted Text", "Run Review On Pasted Text"],
  ["Audit Operations Registry", "Review Registry"],
]);

replaceMany("lib/seo.ts", [
  ["Government Subcontract Risk Review | SubPreCheck", "Federal Subcontract Risk Review | SubPreCheck"],
  [
    "Review government subcontract and teaming packages before you sign. SubPreCheck flags payment traps, missing documents, flow-down risks, and negotiation questions.",
    "Review federal subcontract, teaming, and prime-provided bid packages before you commit. SubPreCheck surfaces payment, scope, flowdown, compliance, and missing-document risks for a better-prepared attorney handoff.",
  ],
  ["Compare single reviews, credit packs, and subscription options for AI-assisted screening of government-contracting documents.", "Compare single reviews, credit packs, and subscription options for structured first-pass screening of federal subcontract documents."],
]);

replaceMany("lib/__tests__/public-ux-consistency.test.mjs", [
  ["FAQ contains the nine approved questions", "FAQ contains the ten approved questions"],
  [".length === 9", ".length === 10"],
  ["alt=\"Carsen Siri, Founder of SubPreCheck\"", "alt=\"Carsen Siri, Founder of SubPreCheck\""],
]);

// The previous test still contains the legacy founder alt because tests are not in
// brandFiles; update that one expectation deliberately.
replaceAllInFile("lib/__tests__/public-ux-consistency.test.mjs", "Carsen Siri, Founder of SubShield", "Carsen Siri, Founder of SubPreCheck");

// Audit output for the workflow log.
const publicAuditFiles = brandFiles.filter((path) => existsSync(path));
const remainingLegacy = [];
const toneHits = [];
const tonePattern = /predatory|weaponiz|bait-and-switch|bulletproof|fight back|survival guides|ambush/gi;
for (const path of publicAuditFiles) {
  const content = read(path);
  if (content.includes("SubShield")) remainingLegacy.push(path);
  const matches = content.match(tonePattern);
  if (matches?.length) toneHits.push(`${path}: ${[...new Set(matches.map((m) => m.toLowerCase()))].join(", ")}`);
}

console.log("Changed files:");
for (const path of [...changed].sort()) console.log(` - ${path}`);
console.log(`\nLegacy SubShield references remaining in audited public/app files: ${remainingLegacy.length}`);
for (const path of remainingLegacy) console.log(` - ${path}`);
console.log(`\nRemaining flagged tone terms in audited public/app files: ${toneHits.length}`);
for (const hit of toneHits) console.log(` - ${hit}`);

if (remainingLegacy.length) process.exitCode = 2;
