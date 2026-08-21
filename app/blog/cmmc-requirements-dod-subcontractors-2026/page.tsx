"use client";

import React from "react";
import { ArrowLeft, Binary, ShieldCheck, Scale } from "lucide-react";

export default function CmmcRequirementsDodSubcontractors2026Article() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition"><ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub</a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">CMMC & CUI</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">CMMC Requirements for DoD Subcontractors in 2026</h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">What changed, how CMMC reaches subcontractors, why FCI and CUI matter, and what to verify before accepting a DoD subcontract.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            CMMC is now a live subcontract review issue, not a future planning topic. The current DFARS rules allow DoD solicitations and contracts to require a specific Cybersecurity Maturity Model Certification level, and the subcontract flowdown depends on the information and systems used to perform the subcontract.
          </p>
          <p>
            For a subcontractor, the most important questions are not simply “Do we need CMMC?” They are: what information will we receive, which systems will process it, what CMMC level is required for those systems, and does the prime's subcontract language match that requirement?
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">The current 2026 DFARS framework</h2>
          <p>
            DFARS 252.204-7021 now requires the contracting officer to insert a specified CMMC level when the clause is used. The available levels in the current clause include Level 1 (Self), Level 2 (Self), Level 2 (C3PAO), and Level 3 (DIBCAC).
          </p>
          <p>
            Under DFARS 204.7504, through November 9, 2028, the clause is used when the program office or requiring activity determines that a specific CMMC level is required, subject to the stated exception. The rule then broadens on and after November 10, 2028 for covered contractor information systems that process, store, or transmit FCI or CUI.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">CMMC can flow down to subcontractors</h2>
          <p>
            The current DFARS clause expressly addresses subcontractors and suppliers. If a subcontract or other contractual instrument will require processing, storing, or transmitting Federal Contract Information (FCI) or Controlled Unclassified Information (CUI), the prime must flow down the substance of the clause as required by DFARS 252.204-7021.
          </p>
          <p>
            Before subcontract award, the prime must also ensure the subcontractor has the current CMMC certificate or status appropriate for the information being flowed down, based on the requirements in 32 CFR 170.23. The clause also requires annual affirmations of continuous compliance for applicable subcontractor information systems.
          </p>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#1A3668]"><ShieldCheck className="w-5 h-5 text-[#FF5F1F]" /> Questions to answer before subcontract award</div>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
              <li>Will your company receive or generate FCI, CUI, or both?</li>
              <li>Which of your information systems will process, store, or transmit that information?</li>
              <li>What CMMC level does the prime say is required for the subcontract?</li>
              <li>Does the solicitation or subcontract identify the applicable DFARS cybersecurity clauses?</li>
              <li>Does the subcontract require a level higher than the information being flowed down appears to require? If so, ask the prime to explain the basis.</li>
              <li>Will any lower-tier supplier receive FCI or CUI from you?</li>
              <li>Are annual affirmation, SPRS, assessment, incident-reporting, and other cybersecurity duties clearly assigned?</li>
            </ul>
          </div>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">FCI and CUI are not the same thing</h2>
          <p>
            The current DFARS clause defines FCI as nonpublic information provided by or generated for the Government under a contract to develop or deliver a product or service, excluding public information and simple transactional information. CUI is information that requires safeguarding or dissemination controls under law, regulation, or Government-wide policy.
          </p>
          <p>
            That distinction matters because the required CMMC level and the security controls can depend on the type of information involved. We will cover this in a separate dedicated guide so this page stays focused on the subcontract requirement itself.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">CMMC does not replace DFARS 252.204-7012</h2>
          <p>
            CMMC sits alongside other DoD cybersecurity requirements. DFARS 204.7302 states that contractors and subcontractors must provide adequate security on covered contractor information systems, and contractors required to implement NIST SP 800-171 under DFARS 252.204-7012 also have DoD assessment requirements.
          </p>
          <p>
            In other words, a subcontractor should review the full cyber clause set, not just the CMMC acronym. The existing SubPreCheck guide on <a href="/blog/dfars-data-trap-tech-subcontractors" className="text-[#FF5F1F] font-bold hover:underline">DFARS cybersecurity and data-rights risk points</a> provides the broader context.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">Watch for blanket cyber language</h2>
          <p>
            A prime may use a standard subcontract template across many suppliers. That can create a mismatch between the clause package and the actual information being shared. Before pricing or accepting compliance obligations, ask the prime to identify the FCI/CUI flow, the required CMMC level, and the systems that will be in scope.
          </p>
          <p>
            The goal is not to avoid valid cybersecurity requirements. It is to understand the requirement before you commit to the cost, staffing, systems, representations, and lower-tier obligations that come with it.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">CMMC is also a flowdown question</h2>
          <p>
            CMMC belongs inside the same clause-review process as other FAR and DFARS obligations. Ask where the requirement comes from, what triggers it, what level applies, and whether you must pass it to suppliers. See our guides to <a href="/blog/understanding-far-flow-down-clauses" className="text-[#FF5F1F] font-bold hover:underline">FAR and DFARS flowdowns</a> and <a href="/blog/mandatory-vs-optional-far-flowdowns" className="text-[#FF5F1F] font-bold hover:underline">mandatory vs. prime-added flowdowns</a>.
          </p>

          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 rounded-r-xl space-y-2">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">Official references</p>
            <p className="text-xs text-slate-600">Review the current <a href="https://www.acquisition.gov/dfars/204.7504-solicitation-provision-and-contract-clause." target="_blank" rel="noopener noreferrer" className="text-[#FF5F1F] font-bold hover:underline">DFARS 204.7504</a>, <a href="https://www.acquisition.gov/dfars/part-252-solicitation-provisions-and-contract-clauses" target="_blank" rel="noopener noreferrer" className="text-[#FF5F1F] font-bold hover:underline">DFARS 252.204-7021</a>, and <a href="https://www.acquisition.gov/dfars/204.7302-policy." target="_blank" rel="noopener noreferrer" className="text-[#FF5F1F] font-bold hover:underline">DFARS 204.7302</a> on Acquisition.gov.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block"><Binary className="w-6 h-6" /></div>
            <h3 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Check the Cyber Language Before You Commit</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">SubPreCheck can surface CMMC, DFARS, CUI, FCI, NIST, and lower-tier language in the package and organize the questions that need follow-up.</p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#1A3668]"><Scale className="w-4 h-4 text-[#FF5F1F]" /> Important</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">This article is general educational information, not legal, cybersecurity, or certification advice. Confirm current DoD requirements and the exact solicitation or subcontract before relying on a CMMC level.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
