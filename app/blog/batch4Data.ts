import type { Post } from "./articleData";

export interface Batch4Section {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  source?: { label: string; url: string };
}

export interface Batch4Article {
  title: string;
  description: string;
  category: string;
  date: string;
  dek: string;
  intro: string[];
  sections: Batch4Section[];
  related: { href: string; label: string }[];
  ctaTitle: string;
  ctaBody: string;
}

export const batch4Articles = {
  "service-contract-labor-standards-subcontractors": {
    title: "Service Contract Labor Standards: A Plain-English Guide for Federal Subcontractors",
    description: "Understand when Service Contract Labor Standards can reach a federal subcontract, how wage determinations and fringe benefits work, and what to verify before pricing.",
    category: "GovCon Labor Compliance",
    date: "Aug 21, 2026",
    dek: "Service Contract Labor Standards can affect wages, fringe benefits, classifications, records, and subcontract flowdowns when service employees perform covered federal work.",
    intro: [
      "Federal service subcontracts can carry labor requirements that materially change the cost of performance. The key question is not simply whether the subcontract is called a service agreement. Coverage depends on the prime contract, the work being performed, the workers involved, and the labor clauses and wage determination incorporated into the package.",
      "For a subcontractor, the safest pre-award approach is to identify the applicable clause and wage determination before building labor rates. Waiting until after award can turn a pricing assumption into a compliance problem."
    ],
    sections: [
      {
        heading: "FAR 52.222-41 expressly addresses subcontractors",
        paragraphs: [
          "FAR 52.222-41 states that, when the clause is used in a subcontract, references to the Contractor are generally read as references to the subcontractor. Covered service employees must receive at least the monetary wages and fringe benefits required by the applicable wage determination.",
          "The clause also requires covered contractors to insert it in subcontracts subject to the Service Contract Labor Standards statute. That makes the actual flowdown and the attached wage determination important documents for a subcontractor to review."
        ],
        source: { label: "FAR 52.222-41 — Service Contract Labor Standards", url: "https://www.acquisition.gov/far/52.222-41" }
      },
      {
        heading: "What to identify before pricing",
        bullets: [
          "Which service-employee classifications are expected to perform the work?",
          "Where will the services be performed?",
          "Which wage determination and revision applies to that place of performance?",
          "What monetary wage and fringe-benefit amount applies to each classification?",
          "Are any needed classifications missing and likely to require conformance?",
          "Does the subcontract address later wage-determination changes or option-year adjustments?"
        ]
      },
      {
        heading: "Records and employee notice are part of the obligation",
        paragraphs: [
          "The clause requires covered contractors and subcontractors to maintain specified employee, classification, wage, fringe, hours, and deduction records for three years from completion of the work. It also requires notice to service employees of the required wage and fringe benefits or posting of the wage determination.",
          "A subcontract that treats labor compliance as a simple certification can therefore understate the administrative work required during performance."
        ]
      },
      {
        heading: "Price the rule, not just the base wage",
        paragraphs: [
          "The wage determination is only one part of the labor-cost picture. A subcontractor should also model fringe benefits, paid leave or other contract-specific obligations, payroll administration, recordkeeping, and the possibility of wage changes during options or extensions.",
          "If the package is missing the wage determination, do not guess at the rate and hope the issue is fixed later. Ask for the incorporated determination and any collective-bargaining information that applies before finalizing the price."
        ]
      }
    ],
    related: [
      { href: "/blog/missing-wage-determination-federal-subcontract", label: "Missing Wage Determination in a Federal Subcontract" },
      { href: "/blog/service-contract-fringe-benefits", label: "Service Contract Fringe Benefits" },
      { href: "/blog/davis-bacon-vs-service-contract-labor-standards", label: "Davis-Bacon vs. Service Contract Labor Standards" }
    ],
    ctaTitle: "Check Labor Requirements Before You Price",
    ctaBody: "SubPreCheck can surface labor clauses, wage-determination references, missing attachments, and pricing-sensitive obligations before you commit."
  },
  "davis-bacon-vs-service-contract-labor-standards": {
    title: "Davis-Bacon vs. Service Contract Labor Standards: Which One Applies?",
    description: "Compare federal construction prevailing-wage requirements with Service Contract Labor Standards and learn which documents subcontractors should check before pricing work.",
    category: "GovCon Labor Compliance",
    date: "Aug 21, 2026",
    dek: "Federal construction and federal service work use different prevailing-wage frameworks. Knowing which one applies changes the wage determination, classifications, payroll duties, and pricing assumptions.",
    intro: [
      "Subcontractors often hear 'prevailing wage' used as a catch-all phrase, but federal construction and federal service contracts do not use the same labor framework. Construction work may be subject to the Construction Wage Rate Requirements commonly associated with Davis-Bacon, while covered service work may be subject to Service Contract Labor Standards.",
      "The distinction matters because the applicable clauses, wage determinations, worker classifications, payroll requirements, and conformance processes are different."
    ],
    sections: [
      {
        heading: "Construction work uses the Davis-Bacon framework",
        paragraphs: [
          "FAR 52.222-6 requires covered laborers and mechanics on the site of the work to receive at least the wage rates and bona fide fringe benefits in the attached Department of Labor wage determination. The rate applies to the classification of work actually performed.",
          "Covered construction contractors and subcontractors also face weekly payroll and related recordkeeping requirements under the construction labor clauses."
        ],
        source: { label: "FAR 52.222-6 — Construction Wage Rate Requirements", url: "https://www.acquisition.gov/far/52.222-6" }
      },
      {
        heading: "Covered service work uses a different clause",
        paragraphs: [
          "FAR 52.222-41 applies the Service Contract Labor Standards framework to covered service contracts and subcontracts. It focuses on service employees, monetary wages, fringe benefits, classifications, places of performance, recordkeeping, and employee notice.",
          "The service wage determination is selected using the expected employee classes and locality where services will be performed."
        ],
        source: { label: "FAR Subpart 22.10 — Service Contract Labor Standards", url: "https://www.acquisition.gov/far/subpart-22.10" }
      },
      {
        heading: "Do not decide coverage from the company trade alone",
        bullets: [
          "A company that usually performs construction can still receive a service-oriented scope.",
          "A service contractor can receive a subcontract containing substantial construction or repair work.",
          "Mixed scopes may require careful review of which labor framework applies to which work.",
          "The incorporated prime-contract clauses and statement of work matter more than the label on the subcontractor's business card."
        ]
      },
      {
        heading: "A practical pre-award comparison",
        bullets: [
          "Identify the labor clause number in the subcontract package.",
          "Confirm the wage determination is attached or clearly incorporated.",
          "Match actual duties to the classifications in that determination.",
          "Check fringe-benefit obligations separately from base wages.",
          "Confirm payroll, posting, recordkeeping, and lower-tier flowdown duties.",
          "Resolve mixed construction/service scope before final pricing."
        ]
      }
    ],
    related: [
      { href: "/blog/service-contract-labor-standards-subcontractors", label: "Service Contract Labor Standards Guide" },
      { href: "/blog/davis-bacon-certified-payroll-errors", label: "Davis-Bacon Certified Payroll Risks" },
      { href: "/blog/how-to-read-federal-wage-determination", label: "How to Read a Federal Wage Determination" }
    ],
    ctaTitle: "Identify the Labor Framework Early",
    ctaBody: "A structured document review can flag labor clauses, wage determinations, mixed-scope questions, and missing attachments before pricing is locked."
  },
  "missing-wage-determination-federal-subcontract": {
    title: "Missing Wage Determination in a Federal Subcontract: What to Request Before Pricing",
    description: "Learn why a missing federal wage determination can undermine subcontract pricing and what construction and service subcontractors should request before signing.",
    category: "Missing Documents",
    date: "Aug 21, 2026",
    dek: "If the subcontract references prevailing wages but does not include the applicable wage determination, the subcontractor may be pricing labor without the document that sets the minimum wage and fringe obligations.",
    intro: [
      "A federal subcontract package may say that Davis-Bacon, Construction Wage Rate Requirements, Service Contract Labor Standards, or a Department of Labor wage determination applies while omitting the actual determination. That is not a minor attachment problem when labor is a meaningful part of the price.",
      "The wage determination identifies the classifications, wage rates, fringe benefits, locality, and revision that the subcontractor may have to use. Without it, a labor estimate can be built on the wrong assumptions."
    ],
    sections: [
      {
        heading: "For service work, the agency selects the applicable determination",
        paragraphs: [
          "FAR 22.1008-1 directs contracting officers to obtain applicable service wage determinations using Wage Determinations at SAM.gov or the Department of Labor e98 process. Selection depends in part on the classes of service employees and the locality where services will be performed.",
          "A subcontractor should therefore ask for the determination incorporated into the prime contract or subcontract rather than independently selecting a rate and assuming it is the same one the Government used."
        ],
        source: { label: "FAR 22.1008-1 — Obtaining Wage Determinations", url: "https://www.acquisition.gov/far/22.1008-1" }
      },
      {
        heading: "For construction, the determination is part of the wage obligation",
        paragraphs: [
          "FAR 52.222-6 ties covered construction wages and fringe benefits to the Secretary of Labor wage determination attached to and made part of the contract. Department of Labor guidance likewise describes wage determinations as the listing of prevailing wage and fringe rates for classifications in a defined area and construction type."
        ],
        source: { label: "U.S. Department of Labor — Davis-Bacon Wage Determinations", url: "https://www.dol.gov/agencies/whd/government-contracts/construction/faq" }
      },
      {
        heading: "What to request from the prime",
        bullets: [
          "The complete wage determination number and current revision incorporated into the contract.",
          "All determinations if multiple locations or construction types are involved.",
          "Any collective bargaining agreement incorporated for successor service work.",
          "Any conformed classifications already approved for the contract.",
          "Any modification or option-year wage determination that changes current performance.",
          "The subcontract clause that explains responsibility for future rate increases or adjustments."
        ]
      },
      {
        heading: "Do not solve a missing attachment with a broad certification",
        paragraphs: [
          "A subcontract may require the subcontractor to certify compliance with all applicable wage laws while giving the prime discretion to update incorporated requirements later. That allocation is especially risky if the determination used to price the work is not identified.",
          "Before execution, tie the price to the actual incorporated wage determination and document how later changes will be handled."
        ]
      }
    ],
    related: [
      { href: "/blog/missing-prime-contract-documents", label: "Missing Prime Contract Documents" },
      { href: "/blog/service-contract-labor-standards-subcontractors", label: "Service Contract Labor Standards Guide" },
      { href: "/blog/how-to-read-federal-wage-determination", label: "How to Read a Federal Wage Determination" }
    ],
    ctaTitle: "Do Not Price Around a Missing Attachment",
    ctaBody: "SubPreCheck can identify wage-determination references, incorporated labor clauses, and missing documents that should be resolved before signature."
  },
  "how-to-read-federal-wage-determination": {
    title: "How to Read a Federal Wage Determination Before Pricing a Subcontract",
    description: "Use a practical checklist to read federal construction and service wage determinations, including locality, classifications, base wages, fringe benefits, and revisions.",
    category: "GovCon Labor Compliance",
    date: "Aug 21, 2026",
    dek: "A wage determination is not just a list of hourly rates. Locality, classification, construction or service category, fringe benefits, revision, and conformance issues can all affect the subcontract price.",
    intro: [
      "A subcontractor can have the correct wage-determination PDF and still price the job incorrectly. The document must be matched to the actual place of performance, scope, worker duties, and contract period.",
      "A useful review starts with the identity of the determination, then moves to classifications and total compensation rather than looking only at the first hourly rate that resembles the company's normal trade."
    ],
    sections: [
      {
        heading: "Start with location and type of work",
        paragraphs: [
          "For Davis-Bacon construction, Department of Labor wage determinations are issued for defined geographic areas and types of construction such as building, heavy, highway, or residential. A rate from the wrong county or construction schedule may not be the applicable rate.",
          "For service work, FAR procedures likewise use place of performance and expected service-employee classes to select the applicable determination."
        ],
        source: { label: "U.S. Department of Labor — Davis-Bacon Wage Determinations", url: "https://www.dol.gov/agencies/whd/government-contracts/prevailing-wage-resource-book/db-wage-determinations" }
      },
      {
        heading: "Read the classification, wage, and fringe together",
        bullets: [
          "Match the worker's actual duties to the listed classification.",
          "Read the minimum monetary wage rate.",
          "Add the required fringe-benefit amount or determine how compliant benefits will be credited.",
          "Check notes, footnotes, zone rates, shift rules, and special classification language.",
          "Confirm whether apprentices or trainees have separate approved treatment.",
          "If a needed classification is missing, determine whether a conformance process is required."
        ]
      },
      {
        heading: "The revision matters",
        paragraphs: [
          "Wage determinations can be modified. FAR 22.404-6 explains when modifications to construction wage determinations become effective in solicitations, awards, and option exercises. Service-contract determinations can also change with options, extensions, and other contract actions.",
          "Pricing from an old saved copy can therefore create a gap between the rate in the subcontractor's estimate and the rate actually incorporated into the current contract action."
        ],
        source: { label: "FAR 22.404-6 — Modifications of Wage Determinations", url: "https://www.acquisition.gov/far/22.404-6" }
      },
      {
        heading: "Build a wage-determination worksheet",
        bullets: [
          "Determination number and revision.",
          "County, state, and place of performance.",
          "Construction type or service occupation framework.",
          "Each expected labor classification.",
          "Base wage, fringe amount, and estimated compliant benefit credit.",
          "Assumed hours by classification.",
          "Any missing classification or conformance question.",
          "Any contract clause addressing future wage increases."
        ]
      }
    ],
    related: [
      { href: "/blog/missing-wage-determination-federal-subcontract", label: "Missing Wage Determination" },
      { href: "/blog/service-contract-fringe-benefits", label: "Service Contract Fringe Benefits" },
      { href: "/blog/davis-bacon-worker-classification", label: "Davis-Bacon Worker Classifications" }
    ],
    ctaTitle: "Turn the Wage Determination Into Pricing Inputs",
    ctaBody: "SubPreCheck can help surface the labor documents and clauses that need to be matched to your scope before the final price is accepted."
  },
  "service-contract-fringe-benefits": {
    title: "Service Contract Fringe Benefits: What Federal Subcontractors Should Price",
    description: "Understand how Service Contract Labor Standards fringe-benefit obligations can affect subcontract pricing, cash equivalents, records, and option-year labor costs.",
    category: "GovCon Labor Compliance",
    date: "Aug 21, 2026",
    dek: "A service wage determination can require both a monetary wage and a separate fringe-benefit amount. Ignoring the fringe line can materially understate the real labor cost of a federal subcontract.",
    intro: [
      "A subcontractor reviewing a service wage determination should not stop at the hourly wage column. FAR 52.222-41 requires covered service employees to receive the applicable monetary wage and fringe benefits identified in the wage determination.",
      "The fringe obligation can be satisfied through qualifying benefits, permitted cash payments, or an appropriate combination, but the subcontractor should understand the cost before committing to the price."
    ],
    sections: [
      {
        heading: "The obligation is separate from the base wage",
        paragraphs: [
          "FAR 52.222-41 requires covered service employees to receive the minimum monetary wages and fringe benefits specified in the applicable wage determination. The clause permits equivalent combinations of bona fide fringe benefits or cash payments only in accordance with the governing Department of Labor rules.",
          "A proposal that budgets only the base hourly wage can therefore be materially short even when every employee's cash wage exceeds the listed minimum."
        ],
        source: { label: "FAR 52.222-41 — Service Contract Labor Standards", url: "https://www.acquisition.gov/far/52.222-41" }
      },
      {
        heading: "Map existing benefits before assuming a credit",
        bullets: [
          "Health and welfare benefits should be evaluated for whether and how they qualify.",
          "Retirement or insurance costs should not be credited automatically without checking the applicable rules.",
          "Paid leave obligations may interact with the wage determination or other contract requirements.",
          "Cash-in-lieu payments affect payroll cost and should be modeled separately from benefit-plan expense.",
          "Administrative and payroll costs remain real even if the fringe obligation is satisfied through existing plans."
        ]
      },
      {
        heading: "Option years can change the labor economics",
        paragraphs: [
          "FAR Subpart 22.10 addresses price-adjustment clauses for certain multi-year and option service contracts subject to Service Contract Labor Standards. Whether a subcontractor receives a corresponding adjustment from the prime depends on the subcontract language, not merely on the fact that the prime contract contains a federal adjustment mechanism.",
          "Review the subcontract for how wage-determination increases, collective-bargaining changes, and option exercises affect subcontract prices."
        ],
        source: { label: "FAR Subpart 22.10 — Service Contract Labor Standards", url: "https://www.acquisition.gov/far/subpart-22.10" }
      },
      {
        heading: "Questions to resolve before signing",
        bullets: [
          "What fringe amount applies to each covered classification?",
          "Which existing benefits will the company rely on to satisfy the obligation?",
          "Will any shortfall be paid as cash equivalent?",
          "How are part-time or split-duty employees handled?",
          "Who bears a later wage-determination increase?",
          "Does the subcontract require records or reports beyond the federal minimum?"
        ]
      }
    ],
    related: [
      { href: "/blog/service-contract-labor-standards-subcontractors", label: "Service Contract Labor Standards Guide" },
      { href: "/blog/how-to-read-federal-wage-determination", label: "How to Read a Federal Wage Determination" },
      { href: "/blog/protecting-small-subcontractor-margins", label: "Protecting Small Subcontractor Margins" }
    ],
    ctaTitle: "Price the Full Labor Obligation",
    ctaBody: "A review can surface wage, fringe, option-adjustment, and recordkeeping language before those costs are locked into the subcontract price."
  },
  "davis-bacon-worker-classification": {
    title: "Davis-Bacon Worker Classifications: How Misclassification Creates Payroll Risk",
    description: "Learn why Davis-Bacon rates follow the work actually performed, how multiple classifications should be recorded, and when a missing class may require conformance.",
    category: "GovCon Labor Compliance",
    date: "Aug 21, 2026",
    dek: "On covered federal construction, the correct rate follows the classification of work actually performed. Job titles and normal company classifications do not override the applicable wage determination.",
    intro: [
      "A common Davis-Bacon problem begins with a familiar internal job title: installer, technician, helper, lead, or operator. The company then assumes that title controls the prevailing wage. It does not.",
      "The federal construction labor clause ties pay to the applicable wage-determination classification for the work actually performed, and payroll records must support the classification and hours reported."
    ],
    sections: [
      {
        heading: "The rate follows the work actually performed",
        paragraphs: [
          "FAR 52.222-6 requires covered laborers and mechanics to receive at least the appropriate wage rate and fringe benefits for the classification of work actually performed. A worker performing more than one classification may be paid the applicable rates for each classification when the payroll records accurately show the time spent in each.",
          "That makes field duties and time records more important than a broad company job title."
        ],
        source: { label: "FAR 52.222-6 — Construction Wage Rate Requirements", url: "https://www.acquisition.gov/far/52.222-6" }
      },
      {
        heading: "A missing classification does not mean choose the closest cheap rate",
        paragraphs: [
          "Department of Labor guidance explains that when the needed work is not performed by a classification already listed on the wage determination, a conformance may be required. The process is intended to add an appropriate classification and rate for the specific contract, not to create a lower-cost substitute for an existing classification.",
          "The proposed classification must satisfy the conformance criteria, including actual use in the area and a reasonable relationship to rates in the determination."
        ],
        source: { label: "U.S. Department of Labor — Davis-Bacon Conformance Process", url: "https://www.dol.gov/agencies/whd/government-contracts/prevailing-wage-resource-book/dbra-conformance-process" }
      },
      {
        heading: "Field practices that reduce classification problems",
        bullets: [
          "Map each anticipated task to a wage-determination classification before mobilization.",
          "Train supervisors not to move workers into materially different work without recording it.",
          "Track split classifications accurately when workers perform different covered duties.",
          "Escalate missing-classification questions before payroll is submitted.",
          "Keep the applicable wage determination and any approved conformance with project payroll records."
        ]
      },
      {
        heading: "Connect classification review to certified payroll",
        paragraphs: [
          "The Department of Labor's WH-347 instructions call for contractors and subcontractors to report the wage determination and the classifications and hours associated with covered workers. Classification errors can therefore carry directly into weekly certified payroll submissions.",
          "Treat classification review as a pre-performance control, not a payroll correction exercise after weeks of work have already been reported."
        ],
        source: { label: "U.S. Department of Labor — WH-347 Instructions", url: "https://www.dol.gov/agencies/whd/forms/wh347" }
      }
    ],
    related: [
      { href: "/blog/davis-bacon-certified-payroll-errors", label: "Davis-Bacon Certified Payroll Risks" },
      { href: "/blog/how-to-read-federal-wage-determination", label: "How to Read a Federal Wage Determination" },
      { href: "/blog/davis-bacon-vs-service-contract-labor-standards", label: "Davis-Bacon vs. Service Contract Labor Standards" }
    ],
    ctaTitle: "Match the Scope to the Wage Classification",
    ctaBody: "SubPreCheck can help surface labor clauses, wage documents, and classification-sensitive requirements before the work package is accepted."
  },
  "audit-records-clauses-federal-subcontracts": {
    title: "Audit and Records Clauses in Federal Subcontracts: What Access Are You Agreeing To?",
    description: "Review federal subcontract audit clauses, record access, cost support, reporting, retention, and flowdown language before accepting broad audit obligations.",
    category: "Federal Audit Risk",
    date: "Aug 21, 2026",
    dek: "An audit clause can reach far beyond a promise to keep invoices. Depending on the contract type and clause, it may require access to cost records, supporting data, reports, facilities, and records tied to pricing or performance.",
    intro: [
      "Subcontractors sometimes treat audit language as boilerplate because they do not contract directly with the Government. That assumption can be wrong. Federal clauses can expressly flow audit and records requirements into qualifying subcontracts, and primes may also add their own access rights.",
      "The pre-award question is not simply whether an audit clause exists. It is what records are covered, who can inspect them, how long they must be retained, and whether the prime has expanded the federal language."
    ],
    sections: [
      {
        heading: "FAR 52.215-2 can flow into qualifying subcontracts",
        paragraphs: [
          "FAR 52.215-2 gives the Government examination rights for specified records in cost-reimbursement, incentive, time-and-materials, labor-hour, price-redeterminable, certified cost or pricing data, and certain reporting situations. Paragraph (g) requires a clause containing its terms in qualifying subcontracts above the simplified acquisition threshold when the stated conditions are met.",
          "The exact applicability therefore depends on the subcontract type, pricing requirements, reporting duties, and the current threshold and clause text."
        ],
        source: { label: "FAR 52.215-2 — Audit and Records—Negotiation", url: "https://www.acquisition.gov/far/52.215-2" }
      },
      {
        heading: "Separate Government rights from prime-contractor rights",
        bullets: [
          "Who may request records: the Government, authorized representatives, the prime, or all three?",
          "What categories are covered: costs, pricing, timekeeping, invoices, performance reports, or all business records?",
          "Can records be copied or reproduced?",
          "Is access limited to records directly pertinent to the subcontract?",
          "Does the prime claim audit rights broader than the federal clause requires?",
          "Are lower-tier subcontractors subject to another flowdown?"
        ]
      },
      {
        heading: "Claims and terminations can extend the practical retention period",
        paragraphs: [
          "FAR 52.215-2 generally references availability until three years after final payment or another period required by FAR Subpart 4.7 or other contract provisions. It separately preserves relevant records while certain termination settlements, appeals, litigation, or claims remain unresolved.",
          "A subcontractor should not schedule destruction based on a single calendar date without checking unresolved disputes and other clauses."
        ]
      },
      {
        heading: "Watch for commercially sensitive information",
        paragraphs: [
          "Audit access can involve labor rates, supplier quotes, indirect-cost support, proprietary pricing, and internal accounting records. The subcontract should be reviewed for confidentiality protections, permitted recipients, use restrictions, and whether access is genuinely tied to the federal requirement.",
          "Broad language giving the prime unrestricted access to 'all books and records' may deserve negotiation even when a narrower federal audit right legitimately applies."
        ]
      }
    ],
    related: [
      { href: "/blog/can-dcaa-audit-subcontractor", label: "Can DCAA Audit a Federal Subcontractor?" },
      { href: "/blog/federal-subcontract-record-retention", label: "Federal Subcontract Record Retention" },
      { href: "/blog/defective-pricing-tina-liability", label: "Certified Cost or Pricing Data Risks" }
    ],
    ctaTitle: "Read the Audit Clause Before You Open the Books",
    ctaBody: "SubPreCheck can surface audit, records, cost-support, reporting, and confidentiality language so you can see the scope before signing."
  },
  "can-dcaa-audit-subcontractor": {
    title: "Can DCAA Audit a Federal Subcontractor?",
    description: "Understand when DCAA or another Government audit function may examine subcontractor cost or pricing records and why the subcontract and prime-contract clauses matter.",
    category: "Federal Audit Risk",
    date: "Aug 21, 2026",
    dek: "A subcontractor does not need to hold the prime contract to encounter Government audit requirements. Cost, pricing, incurred-cost, proposal, or other audit work can reach subcontractor records when the contract framework permits it.",
    intro: [
      "DCAA is commonly associated with prime contractors, but federal subcontractors can also become part of an audit or assist when the Government evaluates subcontract costs, pricing, incurred costs, business systems, or claims.",
      "There is no single rule that every federal subcontractor is automatically subject to every DCAA audit. The authority and scope depend on the contract, clause, pricing action, audit objective, and the records involved."
    ],
    sections: [
      {
        heading: "Start with the contract clause, not the agency name",
        paragraphs: [
          "FAR 52.215-2 provides examination and audit rights in specified circumstances and requires flowdown into certain qualifying subcontracts. Those rights can include records supporting claimed or anticipated costs, certified cost or pricing data, and required reports.",
          "The clause is a better starting point than assuming DCAA either can or cannot audit a subcontractor based solely on tier."
        ],
        source: { label: "FAR 52.215-2 — Audit and Records—Negotiation", url: "https://www.acquisition.gov/far/52.215-2" }
      },
      {
        heading: "DCAA's current guidance is organized by audit objective",
        paragraphs: [
          "DCAA's current Contract Audit Manual includes guidance on contract audit, incurred costs, cost estimates and price proposals, business systems, claims, terminations, and other assignments. A subcontractor may become relevant to one of those audits when its costs or records affect the Government's evaluation of the prime contract.",
          "The practical scope should still be tied back to the authority in the contract and the specific request."
        ],
        source: { label: "DCAA — Contract Audit Manual", url: "https://www.dcaa.mil/Guidance/CAM-Contract-Audit-Manual/" }
      },
      {
        heading: "Prepare before an audit request arrives",
        bullets: [
          "Identify flowed-down audit clauses and any prime-specific audit provisions.",
          "Keep pricing support tied to the proposal and negotiation history.",
          "Maintain timekeeping and cost records that support billed amounts where applicable.",
          "Separate proprietary data that requires controlled disclosure from ordinary support records.",
          "Designate who receives and responds to audit requests.",
          "Escalate unusually broad or unclear requests to contracts leadership and qualified counsel."
        ]
      },
      {
        heading: "Do not confuse cooperation with unlimited access",
        paragraphs: [
          "A subcontractor may have a legitimate duty to provide records, but that does not mean every internal document is automatically within scope. Review the request against the clause, the audit purpose, the time period, and the records actually connected to the pricing or performance issue.",
          "The subcontract should also address how the prime handles proprietary information it receives while supporting a Government audit."
        ]
      }
    ],
    related: [
      { href: "/blog/audit-records-clauses-federal-subcontracts", label: "Audit and Records Clauses in Federal Subcontracts" },
      { href: "/blog/federal-subcontract-record-retention", label: "Federal Subcontract Record Retention" },
      { href: "/blog/defective-pricing-tina-liability", label: "Certified Cost or Pricing Data Risks" }
    ],
    ctaTitle: "Know the Audit Rights Before the Request",
    ctaBody: "A pre-award review can identify flowed-down audit rights, cost-record obligations, reporting duties, and prime-added access language."
  },
  "federal-subcontract-record-retention": {
    title: "How Long Should a Federal Subcontractor Keep Contract Records?",
    description: "Review FAR record-retention rules for subcontractors, the common three-year framework, category-specific periods, and reasons records may need to be kept longer.",
    category: "Federal Audit Risk",
    date: "Aug 21, 2026",
    dek: "Three years is a useful starting point in some federal record-retention clauses, but it is not a universal destruction date. Record type, final payment, fiscal-year calculations, claims, terminations, and other clauses can change the answer.",
    intro: [
      "Federal subcontractors often ask for one simple retention period they can apply to every file. The FAR does not work that way. FAR Subpart 4.7 contains a general framework and specific retention periods, and it expressly treats 'contracts' and 'contractors' as including subcontracts and subcontractors for that subpart.",
      "The actual retention schedule should be tied to the clauses in the subcontract, the record category, final payment, and any unresolved claims or other reasons to preserve the file."
    ],
    sections: [
      {
        heading: "FAR Subpart 4.7 expressly includes subcontractors",
        paragraphs: [
          "FAR 4.700 states that, for the records-retention subpart, the terms contracts and contractors include subcontracts and subcontractors. FAR 4.703 generally requires covered records to be available for three years after final payment or for certain records the period specified in FAR 4.705 through 4.705-3, subject to the rule's details and exceptions.",
          "That makes 'three years after final payment' a common reference point, but not a universal rule for every record."
        ],
        source: { label: "FAR Subpart 4.7 — Contractor Records Retention", url: "https://www.acquisition.gov/far/subpart-4.7" }
      },
      {
        heading: "Some periods are calculated from the fiscal year",
        paragraphs: [
          "FAR 4.704 explains that specific periods in FAR 4.705 are generally calculated from the end of the contractor's fiscal year in which a cost is charged or allocated to a Government contract or subcontract. Records with a series of entries use the fiscal year of the final entry.",
          "A retention schedule based only on the invoice date may therefore dispose of records too early."
        ],
        source: { label: "FAR 4.704 — Calculation of Retention Periods", url: "https://www.acquisition.gov/far/4.704" }
      },
      {
        heading: "Reasons to keep records longer",
        bullets: [
          "A contract clause specifies a longer period.",
          "A claim, appeal, litigation, or termination settlement remains unresolved.",
          "Certified cost or pricing data or a later pricing action relies on earlier records.",
          "A labor clause has its own recordkeeping period.",
          "Cybersecurity, export, quality, property, sourcing, or other compliance rules require separate retention.",
          "The company needs the records to support warranties, insurance, tax, or business obligations."
        ]
      },
      {
        heading: "Build a clause-based retention matrix",
        paragraphs: [
          "For each federal subcontract, list the recordkeeping clauses, record categories, triggering date, minimum retention period, and any hold events that suspend destruction. Link the matrix to the contract closeout process so records are not destroyed merely because active performance ended.",
          "Electronic storage is permitted under the FAR framework when integrity, indexing, and other requirements are satisfied."
        ],
        source: { label: "FAR 4.703 — Policy", url: "https://www.acquisition.gov/far/4.703" }
      }
    ],
    related: [
      { href: "/blog/audit-records-clauses-federal-subcontracts", label: "Audit and Records Clauses" },
      { href: "/blog/can-dcaa-audit-subcontractor", label: "Can DCAA Audit a Federal Subcontractor?" },
      { href: "/blog/subcontractor-pass-through-claims", label: "Subcontractor Pass-Through Claims" }
    ],
    ctaTitle: "Find the Recordkeeping Clauses Before Closeout",
    ctaBody: "SubPreCheck can surface record-retention, audit, claims, labor, and documentation requirements in the subcontract package before they are missed."
  },
  "dod-technical-data-rights-subcontracts": {
    title: "Technical Data Rights in DoD Subcontracts: What to Review Before Delivery",
    description: "Understand the basic DFARS framework for technical data rights, funding source, restrictive assertions, legends, and subcontractor data before a DoD subcontract is signed.",
    category: "DoD Data Rights",
    date: "Aug 21, 2026",
    dek: "DoD technical-data rights are shaped by what data must be delivered, how the underlying item or process was developed, what funding was used, and whether restrictions are properly asserted and marked.",
    intro: [
      "A DoD subcontract can require drawings, specifications, test data, manufacturing information, manuals, or other technical data while also incorporating DFARS data-rights clauses. The business risk is not simply whether the Government receives the file. It is what license rights accompany the delivery.",
      "Subcontractors should identify deliverables, development funding, preexisting material, assertion requirements, and marking procedures before technical data begins moving through the prime."
    ],
    sections: [
      {
        heading: "DFARS 252.227-7013 is a license-rights framework",
        paragraphs: [
          "The current DFARS 252.227-7013 clause addresses rights in technical data for other than commercial products and commercial services within its stated scope. It distinguishes unlimited rights, government purpose rights, limited rights, and specifically negotiated rights, with the applicable category depending on the data and development circumstances.",
          "The clause also states that rights not granted to the Government are retained by the contractor."
        ],
        source: { label: "DFARS 252.227-7013 — Rights in Technical Data", url: "https://www.acquisition.gov/dfars/252.227-7013-rights-technical-data%E2%80%94other-commercial-products-and-commercial-services" }
      },
      {
        heading: "Funding history matters",
        bullets: [
          "Development exclusively with Government funds can support broader Government rights in covered technical data.",
          "Mixed funding can lead to government purpose rights for qualifying data, subject to the clause's details and exceptions.",
          "Development exclusively at private expense can support limited-rights treatment for qualifying technical data.",
          "Certain categories such as form, fit, and function data can carry unlimited rights regardless of a broader private-expense argument."
        ]
      },
      {
        heading: "Identify restricted data before delivery",
        paragraphs: [
          "The clause requires technical data that the contractor asserts should be furnished with restrictions to be identified in the contract attachment, subject to limited post-award assertion procedures. Restrictive markings must also use authorized legends.",
          "Technical data delivered without required restrictive markings can be presumed delivered with unlimited rights, subject to the clause's correction procedures for inadvertent omissions."
        ]
      },
      {
        heading: "Subcontractor questions to resolve",
        bullets: [
          "What technical data is actually a deliverable?",
          "Which items, components, or processes were developed privately, with mixed funding, or with Government funds?",
          "What rights category is being asserted for each deliverable?",
          "Are the assertions included in the prime's data-rights attachment?",
          "Who is responsible for applying and preserving restrictive legends?",
          "Does the subcontract give the prime broader rights than the Government receives?"
        ]
      }
    ],
    related: [
      { href: "/blog/government-purpose-rights-vs-unlimited-rights", label: "Government Purpose Rights vs. Unlimited Rights" },
      { href: "/blog/background-ip-dod-subcontracts", label: "Background IP in DoD Subcontracts" },
      { href: "/blog/dfars-data-trap-tech-subcontractors", label: "DFARS Cybersecurity and Data Rights" }
    ],
    ctaTitle: "Map the Data Before You Deliver It",
    ctaBody: "SubPreCheck can surface data-rights clauses, delivery obligations, assertions, incorporated attachments, and broader prime-drafted IP terms before signature."
  },
  "government-purpose-rights-vs-unlimited-rights": {
    title: "Government Purpose Rights vs. Unlimited Rights: A DoD Subcontractor Guide",
    description: "Compare government purpose rights and unlimited rights under the current DFARS technical-data framework and learn why funding, duration, and markings matter.",
    category: "DoD Data Rights",
    date: "Aug 21, 2026",
    dek: "Government purpose rights and unlimited rights are not interchangeable. The difference affects who may use or disclose technical data, for what purposes, and what happens after a government-purpose period expires.",
    intro: [
      "DoD data-rights clauses use terms that sound similar but can produce very different business outcomes. Two of the most important are government purpose rights and unlimited rights.",
      "A subcontractor should understand the category attached to each deliverable because the rights can affect future competition, disclosure to other Government contractors, reuse of privately developed technology, and the value of a product or process after the federal program ends."
    ],
    sections: [
      {
        heading: "Unlimited rights are the broadest standard rights category",
        paragraphs: [
          "DFARS 252.227-7013 defines unlimited rights as rights to use, modify, reproduce, perform, display, release, or disclose technical data in whole or in part, in any manner and for any purpose, and to authorize others to do so. The clause assigns unlimited rights to several categories of covered technical data, including certain Government-funded development and specified data categories.",
          "Because unlimited rights are broad, a subcontractor should not casually agree that all deliverables will be provided with unlimited rights without examining the underlying clause and development history."
        ],
        source: { label: "DFARS 252.227-7013 — Rights in Technical Data", url: "https://www.acquisition.gov/dfars/252.227-7013-rights-technical-data%E2%80%94other-commercial-products-and-commercial-services" }
      },
      {
        heading: "Government purpose rights are narrower and time-limited under the standard clause",
        paragraphs: [
          "The clause defines government purpose rights to permit Government use and disclosure for United States Government purposes, including competitive procurement, but not commercial purposes. For qualifying mixed-funded technical data, the standard clause provides a five-year government-purpose period unless another period is negotiated.",
          "At the end of that period, the standard clause provides for unlimited rights in the covered technical data."
        ]
      },
      {
        heading: "The rights category follows the data, not the project nickname",
        bullets: [
          "Different deliverables under one subcontract can carry different rights categories.",
          "Private-expense development does not automatically protect every form of technical data from unlimited-rights treatment.",
          "Mixed funding should be documented at the lowest practicable level identified by the clause.",
          "Prior Government rights can carry into later deliveries.",
          "Specifically negotiated licenses can modify standard rights within the limits of the clause."
        ]
      },
      {
        heading: "Markings and assertions are part of the protection",
        paragraphs: [
          "A correct substantive rights position can still be weakened by poor contract administration. The clause contains procedures for identifying restricted data and applying authorized legends. It also addresses omitted and nonconforming markings.",
          "Before delivery, confirm that the assertion schedule, transmittal process, and legends all match the rights category the subcontractor intends to preserve."
        ]
      }
    ],
    related: [
      { href: "/blog/dod-technical-data-rights-subcontracts", label: "Technical Data Rights in DoD Subcontracts" },
      { href: "/blog/background-ip-dod-subcontracts", label: "Background IP in DoD Subcontracts" },
      { href: "/blog/protecting-proprietary-supply-pricing", label: "Protecting Proprietary Supply Pricing" }
    ],
    ctaTitle: "Know Which Rights Category You Are Granting",
    ctaBody: "A structured review can surface rights categories, funding assumptions, assertions, marking duties, and prime-drafted licenses before technical data is delivered."
  },
  "background-ip-dod-subcontracts": {
    title: "Background IP in DoD Subcontracts: What to Identify Before Signing",
    description: "Learn how to identify preexisting and privately developed technology, technical data, and software before a DoD subcontract creates delivery or license-rights obligations.",
    category: "DoD Data Rights",
    date: "Aug 21, 2026",
    dek: "The phrase background IP is useful business shorthand, but DoD data-rights clauses turn the issue into specific questions about deliverables, development funding, preexisting rights, assertions, software, technical data, and markings.",
    intro: [
      "A technology subcontractor may enter a DoD program with years of preexisting designs, processes, libraries, drawings, algorithms, manufacturing know-how, or software. If those materials are not identified before award, later delivery requirements can create disputes over what the prime or Government is entitled to receive and use.",
      "The goal is not to label everything proprietary. The goal is to separate preexisting or privately developed material from new contract work and connect each deliverable to the correct contractual rights framework."
    ],
    sections: [
      {
        heading: "Translate 'background IP' into contract categories",
        paragraphs: [
          "DFARS 252.227-7013 distinguishes development at private expense, mixed funding, Government funding, prior Government rights, and several categories of technical data that receive specific treatment. Computer software is governed by a related but separate DFARS clause framework.",
          "A subcontractor should therefore inventory the actual item, component, process, technical data, and software involved instead of relying only on a broad background-IP definition in a commercial terms section."
        ],
        source: { label: "DFARS 252.227-7013 — Rights in Technical Data", url: "https://www.acquisition.gov/dfars/252.227-7013-rights-technical-data%E2%80%94other-commercial-products-and-commercial-services" }
      },
      {
        heading: "Assertions should be prepared before the offer when required",
        paragraphs: [
          "DFARS 252.227-7017 provides a mechanism for offerors to identify technical data or computer software they intend to furnish with restrictions, the basis for the assertion, the asserted rights category, and the person asserting the restriction. The provision notes that private-expense development is generally a basis for restrictions in the covered context.",
          "A subcontractor supporting a prime proposal should make sure its intended assertions reach the prime early enough to be incorporated into the proposal and contract process."
        ],
        source: { label: "DFARS 252.227-7017 — Identification and Assertion of Restrictions", url: "https://www.acquisition.gov/dfars/252.227-7017-identification-and-assertion-use-release-or-disclosure-restrictions" }
      },
      {
        heading: "Create an IP and data schedule",
        bullets: [
          "Identify preexisting products, components, processes, drawings, technical data, software, and documentation expected to be used.",
          "Record the development-funding history at an appropriate level.",
          "Identify which materials are deliverables and which are only tools used to perform the work.",
          "State the intended Government rights category or license position for restricted deliverables.",
          "Document prior Government rights that already exist.",
          "Confirm how the prime will carry subcontractor assertions into its own contract attachment and deliveries."
        ]
      },
      {
        heading: "Watch for prime-drafted ownership clauses",
        paragraphs: [
          "A subcontract can contain a commercial IP clause that says the prime owns all work product, inventions, data, or materials created or used in performance. That language may be broader than the federal license rights actually required by the prime contract.",
          "Compare the prime's ownership language to the DFARS flowdowns, deliverables, and negotiated data-rights position. Resolve any conflict before performance begins rather than after proprietary material has already been delivered."
        ]
      }
    ],
    related: [
      { href: "/blog/dod-technical-data-rights-subcontracts", label: "Technical Data Rights in DoD Subcontracts" },
      { href: "/blog/government-purpose-rights-vs-unlimited-rights", label: "Government Purpose Rights vs. Unlimited Rights" },
      { href: "/blog/dfars-data-trap-tech-subcontractors", label: "DFARS Cybersecurity and Data Rights" }
    ],
    ctaTitle: "Separate Preexisting Technology From New Deliverables",
    ctaBody: "SubPreCheck can surface IP ownership language, data-rights clauses, assertion requirements, deliverables, and incorporated attachments before you sign."
  }
} satisfies Record<string, Batch4Article>;

export type Batch4Slug = keyof typeof batch4Articles;

export const batch4Posts: Post[] = Object.entries(batch4Articles).map(([slug, article]) => ({
  slug,
  title: article.title,
  description: article.description,
  category: article.category,
  date: article.date,
}));
