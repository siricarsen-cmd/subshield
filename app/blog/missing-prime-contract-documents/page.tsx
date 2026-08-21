"use client";

import React from "react";
import { ArrowLeft, FileQuestion, Files, Scale } from "lucide-react";

export default function MissingPrimeContractDocumentsArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition"><ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub</a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">Missing Documents</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">Missing Prime Contract Documents: What a Subcontractor Should Request Before Signing</h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">A subcontract can incorporate obligations that are not attached. Here is what to request before you agree to terms you have not been able to review.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            One of the most common pre-award problems in federal subcontracting is simple: the subcontract says other documents are part of the agreement, but the subcontractor never received them.
          </p>
          <p>
            That creates a basic review problem. You cannot evaluate a requirement you have not seen. If the subcontract incorporates the prime contract, solicitation, specifications, flowdown exhibit, wage determination, cybersecurity attachment, quality plan, or another document, ask for the relevant material before signing.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">Start with the incorporation language</h2>
          <p>
            Search the subcontract for phrases such as “incorporated by reference,” “made a part hereof,” “subject to the prime contract,” “flowdown requirements,” “all applicable clauses,” and references to exhibits, schedules, attachments, policies, portals, or documents identified only by number.
          </p>
          <p>
            Our guide on <a href="/blog/incorporation-by-reference-ambush" className="text-[#FF5F1F] font-bold hover:underline">incorporation by reference</a> explains how those references can affect the agreement. The immediate practical step is to identify what is missing.
          </p>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#1A3668]"><Files className="w-5 h-5 text-[#FF5F1F]" /> Documents commonly worth requesting</div>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
              <li>the relevant prime-contract clauses or sections incorporated into the subcontract;</li>
              <li>the statement of work, performance work statement, or statement of objectives;</li>
              <li>technical specifications, drawings, schedules, deliverable lists, and acceptance criteria;</li>
              <li>the FAR/DFARS flowdown exhibit or clause matrix;</li>
              <li>wage determinations and labor-compliance attachments when applicable;</li>
              <li>cybersecurity, CUI, FCI, CMMC, NIST, or system-security requirements;</li>
              <li>quality, inspection, property, safety, and security requirements that apply to your scope;</li>
              <li>proposal commitments or clarifications the subcontract says are binding;</li>
              <li>any order-of-precedence document that explains which terms control when documents conflict.</li>
            </ul>
          </div>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">Do you need the entire prime contract?</h2>
          <p>
            Not every subcontractor needs every page of the prime contract for every review. The better question is whether you have the portions the subcontract makes relevant to your obligations. A prime may also have legitimate reasons to protect unrelated pricing, proprietary information, or sensitive material.
          </p>
          <p>
            If the prime cannot provide a complete document, ask for the applicable sections, a redacted version, the exact clause text, or enough information to identify the source and scope of the obligation. The goal is not to collect paper. The goal is to understand what you are being asked to accept.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">Missing scope documents affect pricing</h2>
          <p>
            A missing statement of work or specification is not only a legal issue. It can make accurate pricing impossible. Before committing to a fixed price, confirm what is included, what is excluded, what the acceptance criteria are, what schedule applies, and whether later-issued documents can change the work without a formal change process.
          </p>
          <p>
            If the work began under a teaming arrangement, compare the final subcontract package with the scope and workshare discussed before award. See our <a href="/blog/teaming-agreement-vague-scope-liabilities" className="text-[#FF5F1F] font-bold hover:underline">teaming agreement workshare guide</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">Missing flowdown support is a separate problem</h2>
          <p>
            A subcontract may list dozens of FAR and DFARS clauses without explaining why each one applies. A flowdown matrix can help by identifying the clause source, applicability trigger, and lower-tier obligation. If the prime does not provide a matrix, you can still build a review list from the cited clauses and current regulation text.
          </p>
          <p>
            Read <a href="/blog/far-flowdown-matrix" className="text-[#FF5F1F] font-bold hover:underline">What Is a Flowdown Matrix—and What If the Prime Does Not Provide One?</a> and <a href="/blog/mandatory-vs-optional-far-flowdowns" className="text-[#FF5F1F] font-bold hover:underline">Mandatory vs. Optional FAR Flowdowns</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">A simple request list before signing</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>List every referenced document you do not have.</li>
            <li>Separate documents needed to define scope from documents needed to understand compliance or legal obligations.</li>
            <li>Ask the prime for the missing material in writing.</li>
            <li>If a document cannot be provided, ask for the relevant excerpt, clause number, or redacted section.</li>
            <li>Track unresolved items and do not assume silence means the requirement does not apply.</li>
          </ol>

          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 rounded-r-xl">
            <p className="text-xs text-slate-600 leading-relaxed">For a broader pre-signing review, use our <a href="/blog/federal-subcontract-agreement-checklist" className="text-[#FF5F1F] font-black hover:underline">Federal Subcontract Agreement Checklist</a>.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block"><FileQuestion className="w-6 h-6" /></div>
            <h3 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Make Missing Documents Visible</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">The SubPreCheck sample report shows how missing exhibits, referenced documents, and unresolved contract questions can be separated from the clause findings themselves.</p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#1A3668]"><Scale className="w-4 h-4 text-[#FF5F1F]" /> Important</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">This article is general educational information, not legal advice. Whether an incorporated document is enforceable or required to be provided can depend on the agreement and governing law.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
