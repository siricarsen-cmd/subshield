import type { Post } from "./articleData";

export interface Batch7Section {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  source?: { label: string; url: string };
}

export interface Batch7Article {
  title: string;
  description: string;
  category: string;
  date: string;
  dek: string;
  intro: string[];
  sections: Batch7Section[];
  related: { href: string; label: string }[];
  ctaTitle: string;
  ctaBody: string;
}

export const batch7Articles = {
  "constructive-changes-federal-subcontracts": {
    title: "Constructive Changes in Federal Subcontracts: When Direction Becomes Extra Work",
    description: "Understand constructive-change risk, written and oral direction, notice, authority, documentation, and pass-through issues for federal subcontractors.",
    category: "Changes & Claims",
    date: "Aug 22, 2026",
    dek: "Extra work is not always introduced by a document labeled Change Order. Direction, interpretation, acceleration, inspection demands, or defective requirements can change performance before price and schedule are agreed.",
    intro: [
      "A subcontractor can encounter changed work through field direction, revised interpretations, access restrictions, additional testing, design clarification, Government-furnished information, or a prime instruction that materially alters the original performance baseline.",
      "The commercial problem is that the work may proceed immediately while the parties disagree over whether a formal change occurred. The subcontract's authority and notice clauses determine how quickly the subcontractor must preserve its position."
    ],
    sections: [
      {
        heading: "The federal construction clause recognizes more than formal change orders",
        paragraphs: ["FAR 52.243-4 states that certain written or oral orders, directions, instructions, interpretations, or determinations from the Contracting Officer that cause a change can be treated as a change order when the contractor gives the required written notice."],
        source: { label: "FAR 52.243-4 — Changes", url: "https://www.acquisition.gov/far/52.243-4" }
      },
      {
        heading: "At subcontract level, authority is the first question",
        bullets: [
          "Who is authorized to change scope, price, schedule, or method of performance?",
          "Can a project manager issue binding field direction, or must commercial authorization come from a contracts officer?",
          "Does the subcontract require written notice before performing disputed extra work?",
          "Can the prime direct immediate performance while price is negotiated later?",
          "Does failure to follow a daily ticket or notice procedure waive recovery?",
          "How will a Government-caused change be sponsored upstream?"
        ]
      },
      {
        heading: "Document the baseline and the departure",
        paragraphs: ["A constructive-change record should show what the subcontract originally required, what new direction or condition changed that requirement, when the subcontractor notified the prime, and how cost or time increased. Contemporaneous labor, equipment, material, schedule, and correspondence records are more persuasive than a reconstructed narrative months later."]
      },
      {
        heading: "Do not confuse performance with agreement",
        paragraphs: ["Continue-performance clauses may require the subcontractor to keep working while entitlement is disputed. If so, written reservation-of-rights language and segregated change accounting can help show that continued performance was not acceptance of uncompensated scope."]
      }
    ],
    related: [
      { href: "/blog/unauthorized-change-orders-pm-vs-co", label: "Unauthorized Change Orders: PM vs. Contracting Officer" },
      { href: "/blog/change-order-accounting-federal-subcontract", label: "Change Order Accounting" },
      { href: "/blog/subcontract-notice-deadlines", label: "Federal Subcontract Notice Deadlines" }
    ],
    ctaTitle: "Catch Changed Work Before It Becomes Free Work",
    ctaBody: "SubPreCheck can surface change authority, notice, continue-performance, and waiver terms before the first disputed direction occurs."
  },
  "dispute-venue-arbitration-federal-subcontracts": {
    title: "Dispute, Venue, and Arbitration Clauses in Federal Subcontracts: Which Forum Controls?",
    description: "Review subcontract dispute procedures, arbitration, court venue, governing law, continue-performance duties, and how private subcontract disputes differ from the prime's CDA process.",
    category: "Disputes & Remedies",
    date: "Aug 22, 2026",
    dek: "The prime's dispute with the Government and the subcontractor's dispute with the prime are not automatically the same case, forum, or procedure.",
    intro: [
      "Federal subcontract packages often combine upstream Contract Disputes Act language with a separate private dispute clause requiring arbitration, litigation in a specified state, mediation, executive negotiation, or some combination of those steps.",
      "Before signing, a subcontractor should know where a direct prime-sub dispute must be filed, who pays forum costs, whether the prime controls pass-through claims, and whether the subcontractor must continue performance while the dispute is pending."
    ],
    sections: [
      {
        heading: "The FAR disputes clause governs the prime-Government relationship",
        paragraphs: ["FAR 52.233-1 implements the federal disputes process for the Government contract, including written claims, contracting-officer decisions, certification for claims over $100,000, and continued performance pending resolution. A subcontractor generally reaches that process only through a sponsored or pass-through claim."],
        source: { label: "FAR 52.233-1 — Disputes", url: "https://www.acquisition.gov/far/52.233-1" }
      },
      {
        heading: "Read the private dispute clause separately",
        bullets: [
          "Mandatory arbitration or court litigation.",
          "State and county selected as exclusive venue.",
          "Governing law and any conflicts with project-location law.",
          "Required mediation, executive negotiation, or claim-notice steps before filing.",
          "Attorneys' fees, arbitration fees, expert costs, and fee-shifting provisions.",
          "Whether pass-through claims are stayed, carved out, or controlled by the prime."
        ]
      },
      {
        heading: "Watch for asymmetrical remedies",
        paragraphs: ["Some clauses let the prime choose between arbitration and court after a dispute arises, while the subcontractor is locked into one forum. Others permit the prime to seek immediate injunctive relief but require the subcontractor to arbitrate all claims. The commercial question is whether the procedure is predictable and balanced enough to price and administer."]
      },
      {
        heading: "Preserve both direct and upstream paths",
        paragraphs: ["A dispute may involve both a direct subcontract issue—such as payment or breach—and an upstream Government issue—such as changed scope. The agreement should explain how those tracks interact so a private forum deadline does not conflict with the prime's federal claim schedule or sponsorship obligations."]
      }
    ],
    related: [
      { href: "/blog/subcontractor-pass-through-claims", label: "Subcontractor Pass-Through Claims" },
      { href: "/blog/continue-performance-during-dispute", label: "Continue Performance During a Dispute" },
      { href: "/blog/prime-refuses-sponsor-subcontractor-claim", label: "When the Prime Refuses to Sponsor a Claim" }
    ],
    ctaTitle: "Know Where a Dispute Would Actually Go",
    ctaBody: "SubPreCheck can surface arbitration, venue, governing-law, sponsorship, and continue-performance terms before a dispute starts."
  },
  "trade-agreements-act-vs-buy-american-act": {
    title: "Trade Agreements Act vs. Buy American Act: What Federal Subcontractors Need to Distinguish",
    description: "Compare the Trade Agreements Act and Buy American rules, including designated countries, substantial transformation, domestic preferences, thresholds, and subcontract sourcing questions.",
    category: "Sourcing & Domestic Preference",
    date: "Aug 22, 2026",
    dek: "Buy American and Trade Agreements rules are related, but they are not interchangeable. The wrong sourcing assumption can invalidate a quote or create an impossible post-award delivery promise.",
    intro: [
      "A prime may ask a supplier to certify origin, designated-country status, domestic content, or compliance with a sourcing clause without explaining which federal regime applies. That matters because Buy American rules and the Trade Agreements Act use different concepts and can apply differently depending on acquisition value, product, agency, and exception.",
      "A subcontractor should identify the exact prime-contract clause and item-level requirement before making a broad country-of-origin representation."
    ],
    sections: [
      {
        heading: "The Trade Agreements Act can waive Buy American restrictions for eligible products",
        paragraphs: ["FAR 25.402 explains that the Trade Agreements Act provides authority to waive Buy American and other discriminatory provisions for eligible products from designated countries in covered acquisitions. Applicability depends in part on acquisition value and the relevant agreement."],
        source: { label: "FAR Subpart 25.4 — Trade Agreements", url: "https://www.acquisition.gov/far/subpart-25.4" }
      },
      {
        heading: "The sourcing tests are different",
        bullets: [
          "Buy American analysis focuses on the applicable domestic-preference rules and content or manufacturing tests for the acquisition.",
          "Trade Agreements analysis uses U.S.-made or designated-country end-product concepts when the applicable clause governs.",
          "TAA country-of-origin analysis can turn on substantial transformation rather than component percentages alone.",
          "Small-business set-asides and other exceptions can change whether trade-agreement procedures apply.",
          "DoD may have additional DFARS domestic-source restrictions that must be analyzed separately."
        ]
      },
      {
        heading: "Do not use a generic supplier certificate for every contract",
        paragraphs: ["A supplier form that asks only whether a product is domestic may be inadequate for a TAA acquisition, while a designated-country certification may not answer a Buy American content question. Tie supplier evidence to the clause, item, manufacturer, country, and version of the rule actually incorporated into the subcontract."]
      },
      {
        heading: "Resolve sourcing before the quote becomes a promise",
        paragraphs: ["Country-of-origin questions should be settled during proposal and subcontract review, not after purchase orders are placed. If the prime changes the required sourcing regime after award, the subcontract should provide a change mechanism for cost, lead time, alternate products, and schedule impact."]
      }
    ],
    related: [
      { href: "/blog/buy-american-act-sourcing-mistakes", label: "Buy American Act Sourcing Mistakes" },
      { href: "/blog/trade-agreements-act-designated-country-sourcing", label: "Trade Agreements Act Designated-Country Sourcing" },
      { href: "/blog/missing-prime-contract-documents", label: "Missing Prime Contract Documents" }
    ],
    ctaTitle: "Identify the Sourcing Rule Before You Certify",
    ctaBody: "SubPreCheck can surface sourcing clauses, incorporated certificates, missing specifications, and country-of-origin obligations before award."
  },
  "trade-agreements-act-designated-country-sourcing": {
    title: "Trade Agreements Act Sourcing: What Is a Designated-Country End Product?",
    description: "Understand designated-country end products, substantial transformation, U.S.-made products, TAA purchase restrictions, and supplier evidence for federal subcontract sourcing.",
    category: "Sourcing & Domestic Preference",
    date: "Aug 22, 2026",
    dek: "For a TAA-covered supply acquisition, a product's component map is not the entire analysis. Where the end product is made or substantially transformed can determine eligibility.",
    intro: [
      "Federal subcontractors and suppliers frequently see the phrase designated country in a prime's sourcing certification. FAR 52.225-5 defines designated-country categories and requires U.S.-made or designated-country end products in covered acquisitions unless another end product was properly identified in the offer.",
      "The supplier should identify the end product being delivered and maintain evidence supporting the represented country status rather than relying on a distributor's informal label."
    ],
    sections: [
      {
        heading: "The current clause defines the eligible categories",
        paragraphs: ["FAR 52.225-5 defines designated country end products to include qualifying products from WTO GPA, free-trade-agreement, least-developed, and Caribbean Basin countries. It also defines U.S.-made end products and substantial-transformation concepts used in the clause."],
        source: { label: "FAR 52.225-5 — Trade Agreements", url: "https://www.acquisition.gov/far/52.225-5" }
      },
      {
        heading: "Build item-level sourcing evidence",
        bullets: [
          "Manufacturer and manufacturing location.",
          "Country where the final article is produced or substantially transformed.",
          "Relevant bill-of-material or transformation information when origin is not obvious.",
          "Distributor or manufacturer certifications tied to the actual part number.",
          "Prime-required certificate form and contract clause version.",
          "Change-control process if the manufacturer or country source changes after award."
        ]
      },
      {
        heading: "Do not assume every foreign component makes the end product ineligible",
        paragraphs: ["The TAA end-product analysis is not simply a count of foreign components. Conversely, final assembly in an eligible country does not automatically establish substantial transformation in every fact pattern. Complex origin determinations may require qualified legal or trade-compliance advice."]
      },
      {
        heading: "Check exceptions and acquisition context",
        paragraphs: ["FAR Subpart 25.4 contains exceptions and threshold rules, including an exception for certain small-business set-asides. A subcontractor should avoid certifying to a TAA requirement merely because the prime uses a standard supplier form; confirm that the clause actually applies to the item and acquisition."],
        source: { label: "FAR Subpart 25.4 — Trade Agreements", url: "https://www.acquisition.gov/far/subpart-25.4" }
      }
    ],
    related: [
      { href: "/blog/trade-agreements-act-vs-buy-american-act", label: "Trade Agreements Act vs. Buy American Act" },
      { href: "/blog/buy-american-act-sourcing-mistakes", label: "Buy American Act Sourcing Mistakes" },
      { href: "/blog/counterfeit-electronic-parts-dfars-subcontractors", label: "Counterfeit Electronic Parts and DFARS" }
    ],
    ctaTitle: "Trace the Product Before Making the Certification",
    ctaBody: "SubPreCheck can flag TAA clauses, supplier certificates, sourcing assumptions, and missing item-level evidence before you commit."
  },
  "insurance-requirements-government-installation-subcontracts": {
    title: "Insurance Requirements for Federal Subcontractors Working on Government Installations",
    description: "Review FAR 52.228-5 flowdown, insurance schedules, certificates, endorsements, higher prime-required limits, and subcontract-specific coverage before mobilizing on a Government installation.",
    category: "Insurance & Liability",
    date: "Aug 22, 2026",
    dek: "The FAR can require insurance to flow down for work on a Government installation, but the actual coverage limits may be located elsewhere in the prime contract or subcontract package.",
    intro: [
      "A subcontract may reference FAR 52.228-5 and then separately require workers' compensation, employer's liability, general liability, automobile, professional, cyber, umbrella, or other coverage. The clause text alone may not reveal the limits or prime-specific endorsements the subcontractor must obtain.",
      "Before signing, compare the required coverage with current policies and ask the broker about exclusions, additional-insured wording, cancellation notice, deductibles, and whether the policy actually responds to the contractual risks being accepted."
    ],
    sections: [
      {
        heading: "FAR 52.228-5 expressly reaches qualifying subcontracts",
        paragraphs: ["The clause requires the prime to insert its substance in subcontracts requiring work on a Government installation and requires subcontractors to maintain the insurance specified in the Schedule or elsewhere in the contract. The prime must retain proof of subcontractor insurance for Government review."],
        source: { label: "FAR 52.228-5 — Insurance—Work on a Government Installation", url: "https://www.acquisition.gov/far/52.228-5" }
      },
      {
        heading: "Find the limits and endorsements outside the clause",
        bullets: [
          "Required coverage types and per-occurrence or aggregate limits.",
          "Additional-insured status requested by the prime or owner.",
          "Primary and noncontributory wording.",
          "Waiver-of-subrogation requirements.",
          "Professional, pollution, cyber, aviation, maritime, or other project-specific coverage.",
          "Tail or completed-operations periods that survive subcontract completion."
        ]
      },
      {
        heading: "Insurance limits do not automatically cap liability",
        paragraphs: ["A subcontract can require $2 million of insurance while imposing contractual liability far above that amount. Review insurance, indemnity, warranty, consequential-damages, cyber, and limitation-of-liability clauses together so the business knows which risks are insured, uninsured, capped, or potentially unlimited."]
      },
      {
        heading: "Resolve coverage before mobilization",
        paragraphs: ["If a required endorsement or limit is unavailable or materially increases premium, that is a pricing issue before award. A clause requiring evidence before work begins can delay access to the installation if the insurance package is not ready."]
      }
    ],
    related: [
      { href: "/blog/broad-form-indemnification-subcontractor-vulnerabilities", label: "Broad-Form Indemnification Risks" },
      { href: "/blog/limitation-of-liability-services-federal-subcontract", label: "Limitation of Liability in Federal Service Subcontracts" },
      { href: "/blog/federal-subcontract-agreement-checklist", label: "Federal Subcontract Agreement Checklist" }
    ],
    ctaTitle: "Compare the Contract With the Insurance You Actually Have",
    ctaBody: "SubPreCheck can surface insurance schedules, indemnity overlap, missing exhibits, and coverage obligations that should be priced before mobilization."
  },
  "excusable-delay-force-majeure-federal-subcontracts": {
    title: "Excusable Delay and Force Majeure in Federal Subcontracts: Who Gets Schedule Relief?",
    description: "Review excusable-delay events, lower-tier defaults, notice, mitigation, schedule extensions, and cost recovery before relying on a federal subcontract force-majeure clause.",
    category: "Schedule & Delay",
    date: "Aug 22, 2026",
    dek: "A delay can be excusable without being compensable. The subcontract should separate relief from default, time extensions, and actual recovery of added cost.",
    intro: [
      "Federal subcontractors often assume a force-majeure clause automatically protects them from weather, strikes, epidemics, freight problems, Government action, or supplier failures. The actual protection depends on the clause's causation standard, notice deadline, mitigation duty, and remedy.",
      "A time extension may prevent default while still leaving the subcontractor responsible for its own extended overhead or standby cost. That distinction should be understood before schedule risk is priced."
    ],
    sections: [
      {
        heading: "The federal clause provides a useful excusable-delay framework",
        paragraphs: ["FAR 52.249-14 excuses certain failures arising from causes beyond the contractor's control and without its fault or negligence and addresses qualifying lower-tier subcontractor failures. When the contracting officer finds the criteria satisfied, the delivery schedule is revised subject to the contract's termination rights."],
        source: { label: "FAR 52.249-14 — Excusable Delays", url: "https://www.acquisition.gov/far/52.249-14" }
      },
      {
        heading: "Check what the subcontract actually gives you",
        bullets: [
          "Which events qualify as excusable delay?",
          "Does the clause require the event to be unforeseeable or merely beyond reasonable control?",
          "How quickly must notice be given and to whom?",
          "What mitigation and recovery-plan documentation is required?",
          "Does the subcontract provide only time, or also compensation for added cost?",
          "Are supplier and lower-tier defaults excused only if substitute sources are unavailable?"
        ]
      },
      {
        heading: "Coordinate delay relief with liquidated damages and default",
        paragraphs: ["An excusable-delay clause should be read with milestone dates, liquidated damages, termination for default, acceleration, and no-damages-for-delay language. A subcontractor needs to know whether approved time extensions move the dates used to calculate downstream damages."]
      },
      {
        heading: "Document the critical-path effect",
        paragraphs: ["The occurrence of a qualifying event does not by itself prove project delay. Preserve schedule updates, affected activities, labor and equipment impacts, supplier communications, mitigation efforts, and the period during which the event actually delayed performance."]
      }
    ],
    related: [
      { href: "/blog/fighting-liquidated-damages-delay-claims", label: "Liquidated Damages and Delay Claims" },
      { href: "/blog/termination-for-default-cure-notice", label: "Termination for Default and Cure Notices" },
      { href: "/blog/stop-work-order-federal-subcontract", label: "Stop-Work Orders in Federal Subcontracts" }
    ],
    ctaTitle: "Know Whether Delay Relief Includes Time, Money, or Neither",
    ctaBody: "SubPreCheck can surface excusable-delay triggers, notice deadlines, mitigation duties, and damage clauses before the schedule slips."
  },
  "time-and-materials-subcontract-ceiling": {
    title: "Time-and-Materials Federal Subcontracts: Ceiling Price, Labor Categories, and Funding Risk",
    description: "Review T&M subcontract ceilings, fixed hourly rates, labor-category qualifications, materials, invoice support, overtime, and who bears work performed above the authorized limit.",
    category: "Pricing & Contract Type",
    date: "Aug 22, 2026",
    dek: "T&M does not mean unlimited reimbursement. Federal T&M contracts use fixed hourly rates and a ceiling, and prime-drafted subcontracts can add their own authorization and invoice controls below that ceiling.",
    intro: [
      "A subcontractor may prefer time-and-materials pricing when scope or duration is uncertain, but the contract still needs defined labor categories, hourly rates, reimbursable materials, authorization rules, and a ceiling or not-to-exceed structure.",
      "The most important commercial question is what happens when the authorized ceiling is nearly exhausted but the prime still expects performance to continue."
    ],
    sections: [
      {
        heading: "Federal T&M contracts use fixed rates and a ceiling",
        paragraphs: ["FAR 16.601 describes T&M contracts as payment for direct labor hours at fixed hourly rates plus actual materials cost and requires a ceiling price that the contractor exceeds at its own risk. The rule also recognizes labor performed by subcontractors in the hourly-rate framework."],
        source: { label: "FAR 16.601 — Time-and-Materials Contracts", url: "https://www.acquisition.gov/far/16.601" }
      },
      {
        heading: "Invoice support can be detailed",
        paragraphs: ["FAR 52.232-7 addresses labor qualifications, timekeeping evidence, materials, subcontract costs, withholding, and other payment mechanics at the prime-Government level. A subcontractor should determine which of those concepts the prime has adopted downstream and what evidence must accompany each invoice."],
        source: { label: "FAR 52.232-7 — Payments Under T&M and Labor-Hour Contracts", url: "https://www.acquisition.gov/far/52.232-7" }
      },
      {
        heading: "Check the subcontract's authorization controls",
        bullets: [
          "Overall ceiling and any task-order, CLIN, labor-category, or travel subceilings.",
          "Who can authorize ceiling increases or additional hours?",
          "Required warning notice before funds or ceiling are exhausted.",
          "Whether work above the ceiling is performed at the subcontractor's risk.",
          "Labor-category qualification evidence and substitution rules.",
          "Overtime, travel, materials, indirect costs, and markups."
        ]
      },
      {
        heading: "Do not confuse the prime's ceiling with guaranteed subcontract funding",
        paragraphs: ["The Government may have funded the prime for a larger amount than the prime has committed to a particular subcontractor. The subcontract should identify the amount actually authorized for the lower tier and the process for increasing it in writing."]
      }
    ],
    related: [
      { href: "/blog/federal-subcontract-agreement-checklist", label: "Federal Subcontract Agreement Checklist" },
      { href: "/blog/audit-records-clauses-federal-subcontracts", label: "Audit and Records Clauses" },
      { href: "/blog/defective-pricing-tina-liability", label: "Certified Cost or Pricing Data Risks" }
    ],
    ctaTitle: "Know the Authorized Ceiling Before the Hours Start",
    ctaBody: "SubPreCheck can surface T&M ceilings, labor-category rules, invoice support, funding notices, and authorization conditions before performance."
  },
  "missing-statement-of-work-exhibits-subcontract": {
    title: "Missing Statement of Work or Exhibits in a Federal Subcontract Package: Do Not Price the Blank Spaces",
    description: "Identify missing SOWs, specifications, schedules, flowdown exhibits, data lists, wage determinations, security documents, and attachments before pricing or signing a federal subcontract.",
    category: "Before You Sign",
    date: "Aug 22, 2026",
    dek: "A subcontract can look complete while the documents that define the real work, schedule, data, security, or acceptance criteria are missing from the package.",
    intro: [
      "Prime-drafted subcontracts frequently incorporate exhibits by title or number without attaching them to the version sent for review. That can include the statement of work, specifications, schedule, flowdown matrix, security classification guidance, CDRLs, quality plan, wage determination, insurance schedule, or supplier manual.",
      "A missing incorporated document is not a minor administrative issue. It can contain the scope, deadlines, technical obligations, and compliance costs the subcontractor is being asked to price."
    ],
    sections: [
      {
        heading: "Build an attachment inventory from the contract text",
        bullets: [
          "Statement of work, PWS, SOO, specifications, drawings, and technical exhibits.",
          "Prime-contract clauses or flowdown matrices incorporated by reference.",
          "Milestone schedules, delivery tables, CDRLs, submittal lists, and acceptance criteria.",
          "Wage determinations and labor-category attachments.",
          "Cybersecurity, CUI, CMMC, quality, property, and supplier procedures.",
          "Insurance schedules, rate sheets, pricing exhibits, and change-order forms."
        ]
      },
      {
        heading: "The SOW should be detailed enough to price the obligation",
        paragraphs: ["For federal IDIQ contracts, FAR 16.504 requires the Government's contract to include a statement of work, specifications, or other description that reasonably describes the general scope, nature, complexity, and purpose of the supplies or services. A subcontractor likewise needs enough downstream scope definition to understand what it is agreeing to perform."],
        source: { label: "FAR 16.504 — Indefinite-Quantity Contracts", url: "https://www.acquisition.gov/far/16.504" }
      },
      {
        heading: "Do not let incorporation language replace delivery of the document",
        paragraphs: ["If the subcontract says the company has reviewed and accepts an exhibit, request the exhibit before making that representation. Web links should be versioned or downloaded so the parties know which revision was accepted at award."]
      },
      {
        heading: "Resolve conflicts before signature",
        paragraphs: ["Once the package is complete, compare the body, SOW, proposal, purchase order, flowdown exhibit, and technical attachments for inconsistent scope, dates, pricing assumptions, and precedence. Missing documents and conflicting documents are separate risks and both should be cleared before mobilization."]
      }
    ],
    related: [
      { href: "/blog/missing-prime-contract-documents", label: "Missing Prime Contract Documents" },
      { href: "/blog/order-of-precedence-subcontract-documents", label: "Order of Precedence" },
      { href: "/blog/far-flowdown-matrix", label: "FAR Flowdown Matrix" }
    ],
    ctaTitle: "Find the Missing Pieces Before You Price",
    ctaBody: "SubPreCheck can identify referenced-but-missing exhibits, SOWs, flowdowns, schedules, and compliance documents before signature."
  },
  "no-guaranteed-work-federal-subcontract": {
    title: "No Guaranteed Work in a Federal Subcontract: What Does the Prime Actually Promise?",
    description: "Review no-guaranteed-work, IDIQ, task-order, workshare, exclusivity, minimum commitment, and staffing language before accepting a federal subcontract with uncertain volume.",
    category: "Scope & Workshare",
    date: "Aug 22, 2026",
    dek: "A subcontract can require exclusivity, staffing, pricing commitments, and proposal support while promising little or no actual work after award.",
    intro: [
      "Small subcontractors often invest heavily in capture, proposal writing, key personnel, pricing, and teaming based on an expected share of a federal program. The final subcontract may then state that no task orders, hours, revenue, or minimum work are guaranteed.",
      "That allocation may be commercially intentional, especially under an IDIQ vehicle, but the subcontractor should understand the difference between the Government's minimum commitment to the prime and any separate promise—or lack of promise—from the prime to the subcontractor."
    ],
    sections: [
      {
        heading: "An IDIQ prime contract has its own Government minimum",
        paragraphs: ["FAR 16.504 requires an indefinite-quantity prime contract to state a minimum quantity the Government must order from the contractor. That federal minimum belongs to the prime contract and does not automatically create a proportional minimum for a subcontractor."],
        source: { label: "FAR 16.504 — Indefinite-Quantity Contracts", url: "https://www.acquisition.gov/far/16.504" }
      },
      {
        heading: "Read the downstream commitment in plain numbers",
        bullets: [
          "Is there a dollar, percentage, labor-hour, CLIN, or task-order minimum?",
          "Is workshare described as a target, estimate, good-faith objective, or binding commitment?",
          "Can the prime self-perform or re-source the same scope without cause?",
          "Does exclusivity prevent the subcontractor from pursuing the opportunity elsewhere despite no guaranteed work?",
          "Are key personnel or staffing commitments required before task orders are issued?",
          "Can the prime terminate the subcontract or reduce scope without paying proposal or standby costs?"
        ]
      },
      {
        heading: "Compare the final subcontract with the teaming history",
        paragraphs: ["A teaming agreement, proposal, letter of intent, or small-business subcontracting plan may describe expected work differently from the final subcontract. Preserve those documents and identify any superseding-language clause so the company knows which commitments survive award."]
      },
      {
        heading: "Price the opportunity cost of exclusivity",
        paragraphs: ["An exclusive relationship with no minimum work can have real cost even if the subcontract has no upfront fee. Consider staffing reservations, proposal support, lost teaming opportunities, compliance setup, software, insurance, and other investments that may be required before revenue is certain."]
      }
    ],
    related: [
      { href: "/blog/teaming-agreement-vague-scope-liabilities", label: "Vague Scope and Workshare in Teaming Agreements" },
      { href: "/blog/government-teaming-agreement-vs-subcontract", label: "Teaming Agreement vs. Subcontract" },
      { href: "/blog/teaming-agreement-exclusivity", label: "Exclusivity in Government Teaming Agreements" }
    ],
    ctaTitle: "Find Out What Work Is Actually Committed",
    ctaBody: "SubPreCheck can surface no-minimum language, workshare gaps, exclusivity, staffing commitments, and superseding terms before you commit resources."
  },
  "constructive-acceleration-federal-subcontractors": {
    title: "Constructive Acceleration in Federal Subcontracts: When the Schedule Does Not Move but the Deadline Does",
    description: "Understand constructive-acceleration risk when excusable delay is not recognized, including notice, schedule evidence, added effort, change pricing, and pass-through issues.",
    category: "Schedule & Delay",
    date: "Aug 22, 2026",
    dek: "A subcontractor may encounter acceleration without a document titled Acceleration Order when the schedule is impacted, relief is denied or delayed, and the original completion date is still enforced.",
    intro: [
      "Acceleration can be express—a direct instruction to finish earlier—or constructive, where circumstances effectively require the subcontractor to add shifts, overtime, crews, resequence work, or incur other cost to preserve an unchanged deadline after a qualifying delay.",
      "Because entitlement depends heavily on facts and governing law, the practical pre-award focus is the subcontract's schedule-relief process, notice requirements, change authority, proof standards, and whether added acceleration cost can be passed through to the Government."
    ],
    sections: [
      {
        heading: "The federal changes clause expressly recognizes directed acceleration",
        paragraphs: ["For federal construction contracts, FAR 52.243-4 lists a direction to accelerate performance as a change that can support equitable adjustment when the clause's requirements are satisfied. The same clause also emphasizes timely written notice for other directions treated as changes."],
        source: { label: "FAR 52.243-4 — Changes", url: "https://www.acquisition.gov/far/52.243-4" }
      },
      {
        heading: "Connect acceleration to the delay-relief process",
        paragraphs: ["FAR 52.249-14 provides one federal framework for excusable delay in covered contract types. At subcontract level, the key question is whether the subcontractor timely requested the schedule relief available under its agreement and documented the prime's response."],
        source: { label: "FAR 52.249-14 — Excusable Delays", url: "https://www.acquisition.gov/far/52.249-14" }
      },
      {
        heading: "Build the acceleration record in real time",
        bullets: [
          "Baseline and current schedule showing the excusable or owner-caused delay.",
          "Written request for time extension and supporting notice.",
          "Prime response, denial, silence, or direction to maintain the original completion date.",
          "Added crews, overtime, premium freight, shift work, resequencing, supervision, and productivity effects.",
          "Daily records tying the added effort to the schedule requirement.",
          "Separate cost codes and reservation-of-rights correspondence."
        ]
      },
      {
        heading: "Check whether the subcontract makes acceleration a one-way risk",
        paragraphs: ["Some agreements let the prime direct acceleration at any time while limiting the subcontractor's recovery to amounts the prime receives from the Government. Others require written authorization before added cost is compensable. Those provisions should be identified before the company commits to a compressed project schedule."]
      }
    ],
    related: [
      { href: "/blog/excusable-delay-force-majeure-federal-subcontracts", label: "Excusable Delay and Force Majeure" },
      { href: "/blog/constructive-changes-federal-subcontracts", label: "Constructive Changes in Federal Subcontracts" },
      { href: "/blog/change-order-accounting-federal-subcontract", label: "Change Order Accounting" }
    ],
    ctaTitle: "Know the Cost of Holding the Date",
    ctaBody: "SubPreCheck can surface acceleration authority, schedule-relief, notice, and cost-recovery terms before a compressed deadline becomes a claim."
  }
} satisfies Record<string, Batch7Article>;

export type Batch7Slug = keyof typeof batch7Articles;

export const batch7Posts: Post[] = Object.entries(batch7Articles).map(([slug, article]) => ({
  slug,
  title: article.title,
  description: article.description,
  category: article.category,
  date: article.date
}));
