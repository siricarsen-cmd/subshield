"use client";

import React from "react";
import { ArrowLeft, Grid3X3, ListChecks, Scale } from "lucide-react";

export default function FarFlowdownMatrixArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition"><ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub</a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">FAR & DFARS Compliance</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">What Is a FAR Flowdown Matrix—and What If the Prime Does Not Provide One?</h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">How a clause matrix can organize subcontract requirements, what information it should contain, and why the actual clause text still matters.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            A flowdown matrix is a working table used to organize FAR, DFARS, agency, and prime-contract requirements that may apply to a subcontract. It can be extremely useful when a subcontract package contains dozens of clause citations.
          </p>
          <p>
            A matrix is not a universal government form, and the absence of one does not automatically mean the subcontract is defective. It is a review tool. The value comes from forcing each cited requirement to answer a few basic questions: where did it come from, why does it apply, what does it require, and does it need to go farther down the supply chain?
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">What a useful flowdown matrix should show</h2>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#1A3668]"><Grid3X3 className="w-5 h-5 text-[#FF5F1F]" /> Core columns</div>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
              <li>clause number and title;</li>
              <li>source, such as FAR, DFARS, an agency supplement, or a prime-drafted provision;</li>
              <li>the prime-contract version or date if relevant;</li>
              <li>the subcontract applicability trigger;</li>
              <li>whether the full clause, substance, or modified language must be included;</li>
              <li>any dollar threshold or scope condition;</li>
              <li>whether the requirement must flow to lower-tier subcontractors or suppliers;</li>
              <li>notes about missing documents, open questions, or commercial exceptions.</li>
            </ul>
          </div>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">The matrix should explain applicability, not just list clause numbers</h2>
          <p>
            A list of 40 clause citations is not much more useful than a 40-clause exhibit. The matrix becomes valuable when it records why the clause belongs in this specific subcontract.
          </p>
          <p>
            For example, a labor clause may depend on the type of work being performed. A cybersecurity clause may depend on whether the subcontractor's systems will process, store, or transmit FCI or CUI. A commercial-product subcontract may require a different flowdown analysis under FAR 52.244-6. A dollar threshold can also matter.
          </p>
          <p>
            See <a href="/blog/mandatory-vs-optional-far-flowdowns" className="text-[#FF5F1F] font-bold hover:underline">Mandatory vs. Optional FAR Flowdowns</a> for the basic framework.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">What if the prime does not provide a flowdown matrix?</h2>
          <p>
            You can still review the clause set. Start with the subcontract's flowdown exhibit and build a simple list. For each clause, pull the current text from Acquisition.gov and look for subcontract instructions, thresholds, scope conditions, lower-tier language, and any referenced attachments.
          </p>
          <p>
            Then compare that information with the prime-contract requirements you were given. If the prime cites an agency-specific or contract-specific requirement that you cannot verify, ask for the source document or the relevant excerpt.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">A matrix does not replace missing documents</h2>
          <p>
            A spreadsheet saying “applies” does not tell you what a missing statement of work, wage determination, cybersecurity attachment, or specification actually requires. The underlying material still matters.
          </p>
          <p>
            If the subcontract refers to documents you have not received, use our <a href="/blog/missing-prime-contract-documents" className="text-[#FF5F1F] font-bold hover:underline">missing prime contract documents guide</a> before relying on a matrix summary.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">Watch for lower-tier obligations</h2>
          <p>
            Some federal clauses require the prime contractor to include specified language in subcontracts, and some require the subcontractor to continue the requirement into lower tiers. Your matrix should have a separate column for that question. Otherwise, a company may accept a clause correctly but fail to pass it to a supplier or lower-tier subcontractor when required.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">Use the matrix as a negotiation and review tool</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Mark clauses that clearly apply.</li>
            <li>Mark clauses where the trigger is not obvious.</li>
            <li>Separate prime-drafted commercial terms from federal flowdowns.</li>
            <li>Identify missing attachments or source documents.</li>
            <li>List any lower-tier requirements you will have to administer.</li>
            <li>Send unresolved legal or applicability questions to qualified counsel before signing.</li>
          </ol>

          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 rounded-r-xl space-y-2">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">Official reference</p>
            <p className="text-xs text-slate-600">For commercial product and commercial service subcontracts, review the current <a href="https://www.acquisition.gov/far/52.244-6" target="_blank" rel="noopener noreferrer" className="text-[#FF5F1F] font-bold hover:underline">FAR 52.244-6</a> and <a href="https://www.acquisition.gov/far/44.402" target="_blank" rel="noopener noreferrer" className="text-[#FF5F1F] font-bold hover:underline">FAR 44.402</a>.</p>
          </div>

          <p>
            For the broad overview, return to <a href="/blog/understanding-far-flow-down-clauses" className="text-[#FF5F1F] font-bold hover:underline">Understanding FAR Flow-Down Clauses</a>.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block"><ListChecks className="w-6 h-6" /></div>
            <h3 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Turn a Clause List Into Review Questions</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">SubPreCheck organizes cited clauses, source language, missing materials, and questions that deserve follow-up before you commit.</p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#1A3668]"><Scale className="w-4 h-4 text-[#FF5F1F]" /> Important</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">This article is general educational information, not legal advice. A matrix is a review aid; the contract documents and current regulation text govern the actual analysis.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
