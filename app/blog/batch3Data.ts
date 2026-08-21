export interface Batch3Section {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  source?: { label: string; url: string };
}

export interface Batch3Article {
  title: string;
  category: string;
  dek: string;
  intro: string[];
  sections: Batch3Section[];
  related: { href: string; label: string }[];
  ctaTitle: string;
  ctaBody: string;
}

export const batch3Articles = {
  "government-teaming-agreement-vs-subcontract": {
    title: "Government Teaming Agreement vs. Subcontract: What Changes After Award?",
    category: "Teaming & Pre-Award",
    dek: "A teaming agreement can define the pursuit relationship before award, but the post-award subcontract is where scope, price, flowdowns, payment, changes, and performance obligations usually become concrete.",
    intro: [
      "Federal contractors often use a teaming agreement before a proposal is submitted. The document may identify the intended prime, the intended subcontractor, proposal responsibilities, expected workshare, exclusivity, confidentiality, and a plan to negotiate a subcontract if the team wins.",
      "That does not mean the teaming agreement and the eventual subcontract are interchangeable. A subcontract normally contains the commercial and performance terms that govern actual work after award. A subcontractor should therefore compare the two documents rather than assume the award-stage subcontract simply carries forward the pre-award deal."
    ],
    sections: [
      {
        heading: "What FAR 9.6 actually recognizes",
        paragraphs: [
          "FAR 9.601 defines a contractor team arrangement to include a potential prime contractor agreeing with one or more companies to act as subcontractors under a specified Government contract or acquisition program. FAR 9.602 says these arrangements are normally formed before an offer, although they can be formed later in the acquisition process.",
          "The FAR recognizes the arrangement, but it does not write the parties' private subcontract for them. FAR 9.604 also makes clear that the Government can still require consent to subcontracts and can hold the prime fully responsible for performance."
        ],
        source: { label: "FAR Subpart 9.6 — Contractor Team Arrangements", url: "https://www.acquisition.gov/far/subpart-9.6" }
      },
      {
        heading: "Terms that may change between the two documents",
        bullets: [
          "Workshare may move from a percentage or general description to a detailed statement of work.",
          "Pricing may change from proposal assumptions to negotiated rates, ceilings, fixed prices, or task-order pricing.",
          "Flowdown clauses may appear for the first time after the prime receives the award.",
          "Payment terms, retainage, invoicing rules, and acceptance conditions may be added.",
          "Termination, default, indemnity, insurance, IP, data rights, cybersecurity, audit, and dispute provisions may be much broader than anything in the teaming agreement.",
          "The final subcontract may include an order-of-precedence clause that changes which document controls if terms conflict."
        ]
      },
      {
        heading: "What to compare before signing the subcontract",
        paragraphs: [
          "Put the teaming agreement, proposal commitments, award information, and draft subcontract side by side. Look specifically for promises the prime relied on during the pursuit and for obligations that are new after award.",
          "If the teaming agreement described a defined workshare but the subcontract gives the prime discretion to issue no work, that is a material commercial difference worth resolving before execution. The same is true if the subcontract adds broad flowdowns or liability terms that were never part of the pre-award understanding."
        ],
        bullets: [
          "Does the subcontract preserve the expected scope and workshare?",
          "Are proposal assumptions now written into the scope and price?",
          "Are new compliance obligations supported by the prime contract or solicitation?",
          "Does the subcontract override or supersede the teaming agreement?",
          "Which promises survive if the parties cannot agree on later task orders or options?"
        ]
      },
      {
        heading: "The practical point",
        paragraphs: [
          "Treat the teaming agreement as an important pre-award document and the subcontract as a separate signing decision. The safest review is not 'does this look like a normal subcontract?' but 'does this subcontract match what we agreed to pursue, and what new risk has been introduced since then?'"
        ]
      }
    ],
    related: [
      { href: "/blog/teaming-agreement-vague-scope-liabilities", label: "Teaming Agreement Workshare: Clarify Scope Before Award" },
      { href: "/blog/teaming-agreement-exclusivity", label: "Exclusivity in Government Teaming Agreements" },
      { href: "/blog/federal-subcontract-agreement-checklist", label: "Federal Subcontract Agreement Checklist" }
    ],
    ctaTitle: "Compare the Pre-Award Deal to the Subcontract",
    ctaBody: "SubPreCheck can organize scope, flowdown, payment, termination, and missing-document issues in the subcontract package before you commit."
  },
  "teaming-agreement-exclusivity": {
    title: "Exclusivity in Government Teaming Agreements: What to Review Before You Commit",
    category: "Teaming & Pre-Award",
    dek: "Exclusivity can protect a pursuit, but vague or overbroad language can keep a subcontractor from pursuing other work even when the prime never submits, loses the bid, or changes strategy.",
    intro: [
      "A government-contract teaming agreement may ask a subcontractor to work exclusively with one prime for a particular opportunity. That can be commercially reasonable when both sides are investing proposal resources and sharing sensitive information.",
      "The problem is rarely the word exclusivity by itself. The risk comes from an unclear opportunity definition, a long duration, one-sided termination rights, restrictions that survive a failed pursuit, or language broad enough to cover unrelated agency work."
    ],
    sections: [
      {
        heading: "FAR 9.6 does not create a blanket exclusivity requirement",
        paragraphs: [
          "FAR Subpart 9.6 recognizes contractor team arrangements and says they are often formed before an offer. It does not require every teaming arrangement to be exclusive. Exclusivity is therefore something the parties should evaluate in the actual agreement rather than treat as a standard FAR mandate.",
          "The Government also retains its normal rights, and the prime remains fully responsible for contract performance regardless of the private teaming arrangement."
        ],
        source: { label: "FAR Subpart 9.6 — Contractor Team Arrangements", url: "https://www.acquisition.gov/far/subpart-9.6" }
      },
      {
        heading: "Five boundaries worth defining",
        bullets: [
          "Opportunity: identify the solicitation, vehicle, task order, program, or acquisition the restriction actually covers.",
          "Role: state whether exclusivity applies only to the same proposed scope or to any work under the opportunity.",
          "Duration: define when the restriction starts and when it ends.",
          "Release events: address cancellation, no-bid decisions, proposal elimination, award to someone else, or failure to negotiate a subcontract.",
          "Affiliates and personnel: avoid language that accidentally binds companies or business units that were never part of the pursuit."
        ]
      },
      {
        heading: "Watch the no-bid and post-award gaps",
        paragraphs: [
          "A subcontractor can lose months of market access if exclusivity continues even after the prime decides not to bid. The agreement should explain what happens if the prime stops pursuing the opportunity, misses the proposal deadline, is eliminated from competition, or receives an award but does not give the subcontractor the expected work.",
          "Another issue is the period between award and subcontract execution. If the prime wins but negotiations stall, the subcontractor should know whether exclusivity continues indefinitely or ends after a defined period."
        ]
      },
      {
        heading: "Questions to ask before signing",
        bullets: [
          "Exactly which acquisition does this restriction cover?",
          "Can we support another prime on materially different scope?",
          "When are we automatically released?",
          "Can the prime terminate the teaming agreement while keeping us restricted?",
          "Does exclusivity survive if our workshare is reduced or removed?",
          "Are non-solicitation, non-compete, or confidentiality provisions being mixed into the exclusivity clause?"
        ]
      }
    ],
    related: [
      { href: "/blog/government-teaming-agreement-vs-subcontract", label: "Government Teaming Agreement vs. Subcontract" },
      { href: "/blog/teaming-agreement-vague-scope-liabilities", label: "Teaming Agreement Workshare" },
      { href: "/blog/ostensible-subcontractor-rule", label: "The Ostensible Subcontractor Rule" }
    ],
    ctaTitle: "Review the Restriction Before the Pursuit Starts",
    ctaBody: "A pre-award review can surface exclusivity, workshare, termination, and post-award negotiation language before proposal resources are committed."
  },
  "limitations-on-subcontracting-13-cfr-125-6": {
    title: "Limitations on Subcontracting Under 13 CFR 125.6: What Small Businesses Should Check",
    category: "Small Business Compliance",
    dek: "The limitations on subcontracting regulate how much certain small-business primes may pay to firms that are not similarly situated. A proposed subcontract can affect the prime's compliance and the subcontractor's expected workshare.",
    intro: [
      "The phrase 'limitations on subcontracting' is easy to misunderstand. The rule is primarily an obligation on a qualifying small-business prime contractor, but it can directly affect how a prime structures work with subcontractors.",
      "For a subcontractor, the important questions are whether the prime contract is covered, which limitation applies, whether the subcontractor is similarly situated, and whether the work allocation described in the proposal is consistent with the final subcontract."
    ],
    sections: [
      {
        heading: "Current percentage framework",
        paragraphs: [
          "13 CFR 125.6 provides different calculations by contract type. For covered service contracts, the small-business prime generally may not pay more than 50% of the amount paid by the Government to firms that are not similarly situated. The regulation also uses a 50% framework for covered supply contracts, with specific treatment of material costs and the nonmanufacturer rule.",
          "For general construction, the regulation generally allows no more than 85% of the relevant amount to be paid to firms that are not similarly situated. For special trade construction, the figure is generally 75%. The actual calculation and exclusions should be checked against the current rule and the contract's assigned NAICS code."
        ],
        source: { label: "13 CFR 125.6 — Limitations on Subcontracting", url: "https://www.ecfr.gov/current/title-13/chapter-I/part-125/section-125.6" }
      },
      {
        heading: "Why similarly situated status matters",
        paragraphs: [
          "Amounts paid to a qualifying similarly situated entity receive different treatment under the rule to the extent that entity performs the work with its own employees. That means status cannot be determined only by asking whether the subcontractor is 'small.' The relevant small-business program status and subcontract NAICS code matter too."
        ]
      },
      {
        heading: "What a subcontractor should verify",
        bullets: [
          "What small-business program or set-aside applies to the prime award?",
          "What NAICS code is assigned to the subcontracted work?",
          "Is the subcontractor being treated as similarly situated, and is that treatment supported?",
          "Does the proposed workshare match the prime's compliance assumptions?",
          "Could later subcontracting by the subcontractor change the calculation?",
          "Does the agreement require status notifications if size or program eligibility changes?"
        ]
      },
      {
        heading: "Do not turn the regulation into a guaranteed workshare",
        paragraphs: [
          "A prime's need to comply with 13 CFR 125.6 does not automatically give a particular subcontractor a guaranteed percentage of revenue. If the parties intend a specific workshare, that commitment should be stated clearly in the teaming agreement or subcontract rather than inferred from the regulation."
        ]
      }
    ],
    related: [
      { href: "/blog/similarly-situated-entity-rule", label: "Similarly Situated Entity Rule Explained" },
      { href: "/blog/ostensible-subcontractor-rule", label: "The Ostensible Subcontractor Rule" },
      { href: "/blog/government-teaming-agreement-vs-subcontract", label: "Government Teaming Agreement vs. Subcontract" }
    ],
    ctaTitle: "Check the Workshare Assumptions",
    ctaBody: "SubPreCheck can help organize the scope, status representations, workshare language, and incorporated small-business requirements in the package you received."
  },
  "similarly-situated-entity-rule": {
    title: "Similarly Situated Entity Rule: What Federal Contractors and Subcontractors Need to Know",
    category: "Small Business Compliance",
    dek: "A subcontractor is not 'similarly situated' merely because it is small. The current SBA definition also looks to the same program status and the NAICS code assigned to the subcontract.",
    intro: [
      "The similarly situated entity concept can materially affect limitations-on-subcontracting calculations on certain small-business awards. It is also an area where casual labels can create risk: 'small business subcontractor' and 'similarly situated subcontractor' are not always the same thing.",
      "Before a prime relies on a subcontractor's status, both parties should understand what representation is being made and what happens if that status changes during performance."
    ],
    sections: [
      {
        heading: "The SBA definition has two main pieces",
        paragraphs: [
          "13 CFR 125.1 defines a similarly situated entity as a subcontractor with the same small-business program status as the prime contractor. For example, on an SDVOSB contract, the subcontractor generally must be a certified SDVOSB; on a WOSB or EDWOSB contract, the corresponding program status matters.",
          "The subcontractor must also be small for the NAICS code the prime assigns to the subcontracted work. That second requirement is easy to overlook when the parties focus only on the prime contract's NAICS code."
        ],
        source: { label: "13 CFR 125.1 — SBA Government Contracting Definitions", url: "https://www.ecfr.gov/current/title-13/chapter-I/part-125/section-125.1" }
      },
      {
        heading: "How it affects the subcontracting limitation",
        paragraphs: [
          "Under 13 CFR 125.6, amounts paid to a similarly situated entity are not treated the same as amounts paid to a non-similarly situated firm for the limitation calculation, to the extent the qualifying subcontractor performs the work with its own employees.",
          "Work the similarly situated subcontractor sends farther downstream can be treated differently. The agreement should therefore address lower-tier subcontracting if the prime's compliance model depends on the subcontractor performing a defined portion itself."
        ],
        source: { label: "13 CFR 125.6 — Limitations on Subcontracting", url: "https://www.ecfr.gov/current/title-13/chapter-I/part-125/section-125.6" }
      },
      {
        heading: "Status language to examine",
        bullets: [
          "The specific program status being represented.",
          "The NAICS code assigned to the subcontract.",
          "Whether the subcontractor must recertify or notify the prime of changes.",
          "Whether the prime can reallocate work if status is lost.",
          "Whether lower-tier subcontracting is restricted or requires approval.",
          "Whether the subcontractor is asked to indemnify the prime for status-related consequences beyond its own inaccurate representations."
        ]
      },
      {
        heading: "Do not rely on the label alone",
        paragraphs: [
          "A proposal, teaming agreement, or email may call a company similarly situated without showing the basis. Before execution, confirm the program status, subcontract NAICS code, and the actual work the subcontractor will perform."
        ]
      }
    ],
    related: [
      { href: "/blog/limitations-on-subcontracting-13-cfr-125-6", label: "Limitations on Subcontracting Under 13 CFR 125.6" },
      { href: "/blog/ostensible-subcontractor-rule", label: "The Ostensible Subcontractor Rule" },
      { href: "/blog/teaming-agreement-vague-scope-liabilities", label: "Teaming Agreement Workshare" }
    ],
    ctaTitle: "Verify the Status Assumptions in Writing",
    ctaBody: "A structured review can flag status representations, workshare terms, lower-tier restrictions, and missing small-business context before signature."
  },
  "ostensible-subcontractor-rule": {
    title: "The Ostensible Subcontractor Rule: When a Small-Business Team Can Create Affiliation Risk",
    category: "Small Business Compliance",
    dek: "A small prime can face affiliation risk when it is unusually reliant on a subcontractor or the subcontractor performs the primary and vital requirements. The subcontract structure matters before the proposal is submitted.",
    intro: [
      "A strong subcontractor can make a small-business proposal more competitive, but there is a point where the relationship can raise SBA affiliation concerns. The ostensible subcontractor rule is designed to identify situations where the named small-business prime is too dependent on another firm.",
      "This is a pre-award issue as much as a post-award compliance issue because the proposal, staffing plan, management structure, workshare, and teaming agreement can all help define the relationship."
    ],
    sections: [
      {
        heading: "What SBA looks at",
        paragraphs: [
          "SBA describes an ostensible-subcontractor challenge as one alleging that the prime appears unduly reliant on one or more subcontractors or that a subcontractor is performing the primary and vital requirements of the contract. The analysis is fact-specific rather than a simple percentage test.",
          "A team should therefore avoid assuming that meeting the limitations-on-subcontracting percentage automatically resolves every affiliation question."
        ],
        source: { label: "SBA — VOSB and SDVOSB Protest and Appeals: Ostensible Subcontractor", url: "https://www.sba.gov/about-sba/oversight-and-advocacy/office-of-hearings-and-appeals/vosb-and-sdvosb-protest-and-appeals/" }
      },
      {
        heading: "Common facts worth reviewing before proposal submission",
        bullets: [
          "Which company will manage the contract and key personnel?",
          "Who has the relevant past performance and technical experience?",
          "Which party will perform the core or primary requirements?",
          "Is the prime dependent on the subcontractor for most staffing, facilities, equipment, or customer relationships?",
          "Did the subcontractor prepare most of the proposal or shape the prime's management approach?",
          "Does the subcontractor's role make the prime look like a pass-through rather than the real performer?"
        ]
      },
      {
        heading: "Similarly situated entities receive special treatment",
        paragraphs: [
          "13 CFR 125.6 states that a subcontract to a similarly situated entity is excluded from consideration under the ostensible subcontractor rule. That makes proper status analysis especially important; the team should not assume a subcontractor qualifies without checking the applicable definition and NAICS code."
        ],
        source: { label: "13 CFR 125.6(c)", url: "https://www.ecfr.gov/current/title-13/chapter-I/part-125/section-125.6" }
      },
      {
        heading: "Contract drafting can support the real operating model",
        paragraphs: [
          "The teaming agreement and proposed subcontract should match the proposal narrative. If the proposal says the prime will manage performance, control key decisions, and perform defined core work, the commercial documents should not quietly give those functions to the subcontractor.",
          "This is not about using magic words. It is about making the written relationship reflect who will actually control and perform the work."
        ]
      }
    ],
    related: [
      { href: "/blog/limitations-on-subcontracting-13-cfr-125-6", label: "Limitations on Subcontracting" },
      { href: "/blog/similarly-situated-entity-rule", label: "Similarly Situated Entity Rule" },
      { href: "/blog/government-teaming-agreement-vs-subcontract", label: "Government Teaming Agreement vs. Subcontract" }
    ],
    ctaTitle: "Review the Team Before the Proposal Locks It In",
    ctaBody: "SubPreCheck can organize workshare, control, scope, exclusivity, and subcontract terms so the team can identify questions before committing."
  },
  "subcontractor-pass-through-claims": {
    title: "Subcontractor Pass-Through Claims on Federal Contracts: What the Subcontract Should Address",
    category: "Claims & Disputes",
    dek: "Federal subcontractors usually deal with the Government through the prime. A pass-through claim can provide a route for Government-caused impacts, but the subcontract should address sponsorship, cooperation, control, costs, and settlement before a dispute happens.",
    intro: [
      "A federal subcontractor may suffer delay, disruption, extra work, or other cost because of Government action even though the subcontractor has no direct contract with the agency. That privity gap is why pass-through or sponsored claims matter.",
      "The important pre-award question is not simply whether pass-through claims exist. It is whether the subcontract gives the subcontractor a workable path to present a Government-related claim through the prime and defines what each party must do."
    ],
    sections: [
      {
        heading: "The prime is normally the party dealing with the Government",
        paragraphs: [
          "FAR 44.203 says a contracting officer should not refuse consent to a subcontract merely because it gives the subcontractor a right of indirect appeal when affected by a dispute between the Government and the prime. The FAR describes indirect appeal as assertion of the prime's appeal right or prosecution of an appeal by the prime on the subcontractor's behalf.",
          "Federal Circuit decisions also describe pass-through claims as claims a prime brings against the Government for harm caused to a subcontractor where the legal requirements for that pass-through are met."
        ],
        source: { label: "FAR 44.203 — Consent Limitations", url: "https://www.acquisition.gov/far/44.203" }
      },
      {
        heading: "Terms worth negotiating before there is a claim",
        bullets: [
          "Whether the prime must sponsor qualifying Government-caused claims or only may do so.",
          "Notice deadlines from subcontractor to prime so the prime can meet its own prime-contract deadlines.",
          "Who prepares the claim narrative, schedule analysis, and cost support.",
          "Who controls communications, certification, appeal, settlement, and counsel.",
          "How claim-preparation and legal costs are allocated.",
          "Whether the prime can settle the Government claim without the subcontractor's consent.",
          "What happens if the prime has its own related claim or a conflict with the subcontractor."
        ]
      },
      {
        heading: "Prime-contract rules still matter",
        paragraphs: [
          "FAR 52.233-1 requires contractor claims to follow the Disputes process and includes certification requirements for claims above the applicable threshold. The subcontractor should therefore provide information early enough for the prime to satisfy the prime contract's procedural requirements.",
          "A subcontract clause that waits until the prime receives money before the subcontractor can even submit its issue may create a practical problem if the underlying Government deadline expires first."
        ],
        source: { label: "FAR 52.233-1 — Disputes", url: "https://www.acquisition.gov/far/52.233-1" }
      },
      {
        heading: "Document the Government-caused event as it happens",
        paragraphs: [
          "Keep contemporaneous records showing direction, dates, affected work, labor and equipment impacts, schedule effects, mitigation, and communications with the prime. A pass-through mechanism is much less useful if the factual record is created months after the event."
        ]
      }
    ],
    related: [
      { href: "/blog/prime-refuses-sponsor-subcontractor-claim", label: "What If the Prime Refuses to Sponsor the Claim?" },
      { href: "/blog/subcontract-notice-deadlines", label: "Subcontract Notice Deadlines" },
      { href: "/blog/request-for-equitable-adjustment-under-far", label: "Requests for Equitable Adjustment" }
    ],
    ctaTitle: "Check the Claims Path Before There Is a Dispute",
    ctaBody: "SubPreCheck can surface pass-through, notice, continue-performance, release, and dispute language that may affect how a later claim is preserved."
  },
  "prime-refuses-sponsor-subcontractor-claim": {
    title: "What If the Prime Refuses to Sponsor a Federal Subcontractor Claim?",
    category: "Claims & Disputes",
    dek: "A subcontractor's ability to pursue a Government-caused claim can depend heavily on the subcontract. Before signing, look for whether sponsorship is mandatory, discretionary, conditional, or not addressed at all.",
    intro: [
      "A subcontractor can have a well-documented Government-caused impact and still face a procedural obstacle: the prime contractor may not want to sponsor or prosecute the claim.",
      "Because subcontractors generally do not have the same direct contractual relationship with the Government as the prime, the subcontract's dispute and sponsorship language can become critical. This is a reason to review the mechanism before work begins rather than after a major change or delay."
    ],
    sections: [
      {
        heading: "Start with the actual sponsorship clause",
        paragraphs: [
          "Some subcontracts expressly require the prime to present qualifying subcontractor claims. Others say the prime may sponsor a claim in its sole discretion. Some require the subcontractor to pay all costs, indemnify the prime, certify information, or accept the Government's decision as final between the parties.",
          "Those differences can determine whether the process is practical even before anyone reaches the merits of the claim."
        ]
      },
      {
        heading: "The FAR recognizes indirect appeals, but does not guarantee sponsorship",
        paragraphs: [
          "FAR 44.203(c) recognizes that a subcontract may give a subcontractor the right of indirect appeal in a dispute between the Government and the prime. That recognition does not itself create a mandatory sponsorship obligation in every subcontract. The private agreement still matters."
        ],
        source: { label: "FAR 44.203 — Consent Limitations", url: "https://www.acquisition.gov/far/44.203" }
      },
      {
        heading: "Questions the subcontract should answer",
        bullets: [
          "What types of claims must the prime present?",
          "Can the prime reject a claim without explaining why?",
          "Who decides whether to certify, settle, appeal, or litigate?",
          "Can the subcontractor prosecute in the prime's name at its own cost if the prime does not want to manage the matter?",
          "What cooperation and document access must each party provide?",
          "Do notice deadlines give the prime enough time to meet its own contract requirements?",
          "Can the prime release the Government while the subcontractor's issue remains unresolved?"
        ]
      },
      {
        heading: "If refusal happens during performance",
        paragraphs: [
          "Preserve the record immediately. Give the notices required by the subcontract, identify the Government-caused event, state the requested relief, document the prime's refusal, and avoid signing releases that could extinguish the issue without understanding their effect.",
          "The available legal options depend on the actual subcontract, prime contract, claim posture, and governing law, so significant disputes should be reviewed with qualified counsel rather than assumed to have a standard outcome."
        ]
      }
    ],
    related: [
      { href: "/blog/subcontractor-pass-through-claims", label: "Subcontractor Pass-Through Claims" },
      { href: "/blog/subcontract-notice-deadlines", label: "Subcontract Notice Deadlines" },
      { href: "/blog/change-order-release-trap", label: "Change Order Releases" }
    ],
    ctaTitle: "Find the Sponsorship Language Before You Need It",
    ctaBody: "A first-pass review can identify discretionary sponsorship, short notice periods, broad releases, and dispute clauses that deserve attention before signing."
  },
  "subcontract-notice-deadlines": {
    title: "Federal Subcontract Notice Deadlines: Why Short Notice Clauses Matter",
    category: "Changes & Claims",
    dek: "A subcontract may give you far less time to notify the prime than the prime has to notify the Government. Missing a three-, five-, or seven-day subcontract deadline can create a dispute over otherwise valid extra work or delay impacts.",
    intro: [
      "Notice clauses are easy to skim because they look procedural. In practice, they can decide whether a subcontractor preserves a request for time or money after a change, delay, differing condition, acceleration, suspension, or other impact.",
      "Federal prime contracts contain their own notice structures, and primes often shorten downstream deadlines so they have time to investigate and submit their own notice. The subcontractor should know those deadlines before field events begin."
    ],
    sections: [
      {
        heading: "Prime-contract deadlines can be specific",
        paragraphs: [
          "For example, FAR 52.243-1 states that a contractor must assert its right to an adjustment under that Changes clause within 30 days after receipt of the written order, subject to the clause's qualification. Other clauses use different notice triggers and timing.",
          "Construction Changes at FAR 52.243-4 also requires written notice for certain directions treated as change orders. These are prime-contract examples, not automatic subcontract deadlines, but they explain why a prime may demand earlier notice from lower tiers."
        ],
        source: { label: "FAR 52.243-1 — Changes—Fixed-Price", url: "https://www.acquisition.gov/far/52.243-1" }
      },
      {
        heading: "Find every notice rule, not just the Changes section",
        bullets: [
          "Changes and extra work.",
          "Delay, disruption, suspension, and acceleration.",
          "Differing site conditions.",
          "Claims and requests for equitable adjustment.",
          "Payment disputes and backcharges.",
          "Default or cure responses.",
          "Termination settlement costs.",
          "Insurance claims, indemnity events, and third-party claims."
        ]
      },
      {
        heading: "Check the trigger and delivery method",
        paragraphs: [
          "A deadline may run from the event, from discovery, from receipt of direction, or from when the subcontractor should have known of the condition. The agreement may also require notice to a named contracts manager rather than the project manager who gave the direction.",
          "A good internal process records the event date, contractual deadline, required recipient, delivery method, and supporting documents immediately."
        ]
      },
      {
        heading: "Do not rely on a verbal heads-up",
        paragraphs: [
          "Telling a superintendent or program manager about a problem may be operationally useful but may not satisfy a written contractual notice requirement. When the contract calls for formal notice, follow the required method while continuing normal project communication."
        ]
      }
    ],
    related: [
      { href: "/blog/request-for-equitable-adjustment-under-far", label: "Requests for Equitable Adjustment" },
      { href: "/blog/subcontractor-pass-through-claims", label: "Subcontractor Pass-Through Claims" },
      { href: "/blog/unauthorized-change-orders-pm-vs-co", label: "Unauthorized Change Orders and Authority" }
    ],
    ctaTitle: "Find the Deadlines Before Work Starts",
    ctaBody: "SubPreCheck can surface short notice periods, written-notice requirements, waiver language, and incorporated prime-contract deadlines in the package."
  },
  "continue-performance-during-dispute": {
    title: "Continue Performance During a Dispute: What Federal Subcontractors Should Review",
    category: "Claims & Disputes",
    dek: "A continue-performance clause can require a subcontractor to keep working while a price, scope, payment, or change dispute is unresolved. The obligation should be read together with funding, payment, change, and termination terms.",
    intro: [
      "Federal contracting often separates performance from dispute resolution. A contractor may be required to continue work while a claim is being decided. Prime contractors frequently pass some version of that concept into subcontracts.",
      "For a subcontractor, the commercial risk depends on how broadly the clause is written. Continuing clearly funded undisputed work is different from being required to finance unlimited disputed work with no written change, no price path, and no payment protection."
    ],
    sections: [
      {
        heading: "The FAR contains a continue-performance concept",
        paragraphs: [
          "FAR 52.233-1 states that the contractor shall proceed diligently with performance pending final resolution of requests for relief, claims, appeals, or actions covered by the clause and comply with the contracting officer's decision. FAR 33.213 discusses the Government's ability to require continued performance pending dispute resolution.",
          "Those provisions govern the prime-Government relationship. A subcontractor should read the downstream clause actually included in its subcontract rather than assume the wording is identical."
        ],
        source: { label: "FAR 52.233-1 — Disputes", url: "https://www.acquisition.gov/far/52.233-1" }
      },
      {
        heading: "Four questions matter before signing",
        bullets: [
          "Does the obligation apply only to work within the existing scope, or also disputed extra work?",
          "Must the prime issue written direction before disputed work proceeds?",
          "How are costs tracked and preserved while price is unresolved?",
          "Can the prime withhold unrelated undisputed payments because a dispute exists?"
        ]
      },
      {
        heading: "Pair the clause with change authority and notice rules",
        paragraphs: [
          "A continue-performance clause should not be reviewed in isolation. If the subcontract also says only one named person can authorize changes, the subcontractor needs a process for receiving direction, giving notice, segregating costs, and preserving rights while continuing performance.",
          "Likewise, a short notice clause can require action within days even though the dispute itself may take months to resolve."
        ]
      },
      {
        heading: "Watch for one-sided financing risk",
        paragraphs: [
          "The clause deserves closer review if it requires unlimited continued performance regardless of nonpayment, exhausted funding, material scope expansion, or a prime refusal to issue any written direction. The issue is not whether disputes should stop all work; it is whether the contract defines a workable path for disputed work without shifting every financing risk downstream."
        ]
      }
    ],
    related: [
      { href: "/blog/subcontract-notice-deadlines", label: "Federal Subcontract Notice Deadlines" },
      { href: "/blog/subcontractor-pass-through-claims", label: "Subcontractor Pass-Through Claims" },
      { href: "/blog/unauthorized-change-orders-pm-vs-co", label: "Unauthorized Change Orders and Authority" }
    ],
    ctaTitle: "Read the Disputes Clause With the Change Clause",
    ctaBody: "SubPreCheck can group continue-performance, authority, notice, payment, and change provisions so you can see how they interact before signing."
  },
  "termination-for-default-cure-notice": {
    title: "Termination for Default and Cure Notices: What Federal Subcontractors Should Review",
    category: "Termination & Default",
    dek: "The federal prime contract may use a 10-day cure period for certain failures, but a subcontract can use different triggers and shorter deadlines. Do not assume the FAR gives every subcontractor the same cure rights.",
    intro: [
      "Termination for default is materially different from termination for convenience. Default language can expose a contractor to replacement costs, damages, withholding, and other remedies tied to alleged nonperformance.",
      "A common mistake is assuming the subcontractor automatically receives the same cure process the Government gives the prime. The subcontract is a separate contract and may contain a different cure period, different notice rules, or immediate-default triggers."
    ],
    sections: [
      {
        heading: "What the federal default procedure says",
        paragraphs: [
          "FAR 49.402-3 states that when default is based on failure to make progress or failure to perform certain other contract provisions, the contracting officer generally provides written notice specifying the failure and a 10-day period, or longer when necessary, to cure. The rule also explains that late delivery or failure to perform by the specified time can be treated differently and may not require the same advance cure notice.",
          "FAR 52.249-8 similarly provides a 10-day cure mechanism for specified progress and other-performance failures in the fixed-price supply and service context."
        ],
        source: { label: "FAR 49.402-3 — Procedure for Default", url: "https://www.acquisition.gov/far/49.402-3" }
      },
      {
        heading: "The subcontract may be harsher",
        bullets: [
          "Three-, five-, or seven-day cure periods.",
          "Immediate default for insolvency, safety issues, schedule failure, loss of required status, or repeated breaches.",
          "A right for the prime to supplement the subcontractor's workforce and backcharge costs before termination.",
          "Cross-default provisions tied to other contracts.",
          "Broad language allowing default whenever the prime believes performance is endangered."
        ]
      },
      {
        heading: "Check consequences as carefully as the trigger",
        paragraphs: [
          "The agreement should be reviewed for reprocurement costs, completion costs, withholding, setoff, equipment or material takeover, assignment of lower-tier agreements, schedule damages, and treatment of work already accepted.",
          "Also check whether a termination later found improper converts to a convenience termination and what recovery is available in that event."
        ]
      },
      {
        heading: "Build the cure process into project administration",
        bullets: [
          "Identify who receives formal notices.",
          "Escalate cure and show-cause notices immediately.",
          "Respond in writing with facts, corrective actions, schedule, and any excusable causes.",
          "Preserve documents showing prime direction, access problems, Government-caused delay, and other contributing events.",
          "Avoid assuming ongoing discussions suspend a contractual cure deadline unless that is confirmed in writing."
        ]
      }
    ],
    related: [
      { href: "/blog/termination-for-convenience-subcontractor-rights", label: "Termination for Convenience" },
      { href: "/blog/subcontract-notice-deadlines", label: "Federal Subcontract Notice Deadlines" },
      { href: "/blog/federal-subcontract-agreement-checklist", label: "Federal Subcontract Agreement Checklist" }
    ],
    ctaTitle: "Check the Default Triggers Before Signing",
    ctaBody: "SubPreCheck can surface cure periods, immediate-default language, backcharge rights, termination remedies, and incorporated default provisions in the subcontract package."
  },
  "order-of-precedence-subcontract-documents": {
    title: "Order of Precedence in Federal Subcontracts: Which Document Controls When Terms Conflict?",
    category: "Contract Documents",
    dek: "Federal subcontract packages can contain a subcontract, statement of work, proposal, prime-contract clauses, exhibits, specifications, and later modifications. An order-of-precedence clause determines which one wins when they conflict.",
    intro: [
      "Many subcontract disputes are not caused by a missing term. They are caused by two documents saying different things: the proposal assumes one scope, the statement of work requires another, and the flowdown exhibit incorporates a third set of obligations.",
      "An order-of-precedence clause is the contract's conflict-resolution rule. It deserves attention before signature because a document that appears secondary may control a critical scope, price, delivery, or compliance issue."
    ],
    sections: [
      {
        heading: "The FAR uses an express hierarchy in some contracts",
        paragraphs: [
          "FAR 52.215-8 provides an order for resolving inconsistencies under the Uniform Contract Format: the Schedule, representations and other instructions, contract clauses, other documents and attachments, and then specifications. That federal hierarchy does not automatically govern every subcontract, but it shows why written precedence rules matter."
        ],
        source: { label: "FAR 52.215-8 — Order of Precedence—Uniform Contract Format", url: "https://www.acquisition.gov/far/52.215-8" }
      },
      {
        heading: "Map the entire subcontract package",
        bullets: [
          "Subcontract or purchase order terms.",
          "Statement of work and technical specifications.",
          "Proposal, quote, assumptions, and exclusions.",
          "Prime-contract clauses and flowdown exhibits.",
          "Drawings, schedules, data-item descriptions, and quality documents.",
          "Cybersecurity, CMMC, data-rights, labor, or sourcing attachments.",
          "Task orders, change orders, and later modifications."
        ]
      },
      {
        heading: "Watch for a proposal placed at the bottom",
        paragraphs: [
          "A subcontractor may price a job around express proposal assumptions or exclusions. If the contract incorporates the proposal but gives it lower precedence than the prime's statement of work or specifications, those assumptions may not protect the subcontractor when the documents conflict.",
          "The same issue can arise when a flowdown exhibit says it controls over negotiated commercial terms."
        ]
      },
      {
        heading: "Resolve known conflicts before execution",
        paragraphs: [
          "Order-of-precedence language is useful for unexpected inconsistencies, but it should not substitute for fixing a conflict everyone already knows exists. If scope, delivery, workshare, data rights, or price assumptions differ across documents, identify the specific conflict and resolve it in the signed agreement or modification."
        ]
      }
    ],
    related: [
      { href: "/blog/missing-prime-contract-documents", label: "Missing Prime Contract Documents" },
      { href: "/blog/incorporation-by-reference-ambush", label: "Incorporation by Reference" },
      { href: "/blog/federal-subcontract-agreement-checklist", label: "Federal Subcontract Agreement Checklist" }
    ],
    ctaTitle: "See the Documents as One Contract Package",
    ctaBody: "SubPreCheck can help identify incorporated documents, conflicting terms, missing attachments, and precedence language before you accept the package."
  },
  "far-52-244-2-consent-to-subcontracts": {
    title: "FAR 52.244-2 and Consent to Subcontracts: What Government Approval Does—and Does Not—Mean",
    category: "FAR & Subcontracting",
    dek: "Some prime contracts require Government consent before specified subcontracts are placed. That consent is a prime-contract control; it is not a Government endorsement of the subcontract's commercial terms or price.",
    intro: [
      "A subcontractor may hear that its subcontract is 'subject to Government consent' or that the contracting officer has approved the subcontract. That can sound like the Government has reviewed and accepted every downstream term.",
      "The FAR says otherwise. Consent to a subcontract is part of the Government's oversight of the prime contractor's subcontracting, but it does not turn the Government into a party to the subcontract or automatically validate the subcontract's price and terms."
    ],
    sections: [
      {
        heading: "Consent is a prime-contract requirement in specified situations",
        paragraphs: [
          "FAR Part 44 addresses subcontracting policies and procedures, including when consent requirements may apply and how contracting officers review requests. FAR 52.244-2 is the principal Subcontracts clause used in covered prime-contract situations.",
          "A subcontractor should ask whether consent is required before award of the subcontract, before certain changes, or only for specified subcontract types. The prime should be able to explain what approval step is actually outstanding."
        ],
        source: { label: "FAR Part 44 — Subcontracting Policies and Procedures", url: "https://www.acquisition.gov/far/part-44" }
      },
      {
        heading: "FAR 44.203 limits what consent means",
        paragraphs: [
          "FAR 44.203 expressly states that contracting-officer consent to a subcontract or approval of the contractor's purchasing system does not constitute a determination of the acceptability of subcontract terms or price, or the allowability of costs, unless the consent or approval specifically says otherwise.",
          "That distinction matters. A subcontractor should still negotiate payment, scope, liability, termination, data rights, flowdowns, and other commercial terms on their own merits."
        ],
        source: { label: "FAR 44.203 — Consent Limitations", url: "https://www.acquisition.gov/far/44.203" }
      },
      {
        heading: "Questions to resolve before mobilizing",
        bullets: [
          "Is Government consent a condition to subcontract effectiveness or only a prime responsibility?",
          "Can the subcontractor start work before consent, and who bears the risk if consent is delayed or denied?",
          "Can the prime change negotiated terms to obtain consent without the subcontractor's agreement?",
          "Does the agreement define what happens to proposal costs, mobilization, or supplier commitments if consent is not obtained?",
          "Is the prime using 'Government requirement' to justify terms that are actually prime-drafted commercial choices?"
        ]
      },
      {
        heading: "Government consent does not create direct privity",
        paragraphs: [
          "The prime remains responsible for performance, and the subcontract remains an agreement between the contracting parties. Do not treat consent as a substitute for reviewing the documents you are actually being asked to sign."
        ]
      }
    ],
    related: [
      { href: "/blog/mandatory-vs-optional-far-flowdowns", label: "Mandatory vs. Optional FAR Flowdowns" },
      { href: "/blog/missing-prime-contract-documents", label: "Missing Prime Contract Documents" },
      { href: "/blog/far-flowdown-matrix", label: "FAR Flowdown Matrix" }
    ],
    ctaTitle: "Separate Government Requirements From Prime-Drafted Terms",
    ctaBody: "SubPreCheck can surface consent language, incorporated FAR clauses, broad flowdowns, and commercial terms that deserve separate review before signature."
  }
} satisfies Record<string, Batch3Article>;

export type Batch3Slug = keyof typeof batch3Articles;
