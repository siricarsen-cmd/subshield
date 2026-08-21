"use client";

import React from "react";
import { ArrowLeft, FileText, Network, Scale } from "lucide-react";

export default function MandatoryVsOptionalFarFlowdownsArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition"><ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub</a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">FAR & DFARS Compliance</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">Mandatory vs. Optional FAR Flowdowns: What a Subcontractor Should Know</h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">Why some federal clauses must reach a subcontract, why others may be prime-drafted choices, and what to ask before accepting a long flowdown exhibit.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            Federal subcontracts often arrive with pages of FAR and DFARS citations. The difficult part is not recognizing that federal clauses exist. It is determining which obligations actually apply to your subcontract and which terms the prime added for its own contract-management or risk-allocation reasons.
          </p>
          <p>
            There is no single universal flowdown list for every federal subcontract. The answer can depend on the exact clause text, subcontract type, dollar value, scope, agency supplement, place of performance, information handled, and whether the subcontract is for commercial products or commercial services.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">What people mean by a mandatory flowdown</h2>
          <p>
            In practical terms, a mandatory flowdown is a clause or requirement that the prime contract directs the prime contractor to include, or to include when stated conditions are met, in qualifying subcontracts. The clause itself is usually the best place to start because many FAR and DFARS clauses state their own subcontract requirements.
          </p>
          <p>
            That does not mean a clause applies to every subcontract just because it appears in the prime contract. Thresholds and scope conditions matter. Some clauses apply only to certain types of work, certain dollar values, certain information, or certain lower-tier transactions.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">Prime-drafted terms are a separate question</h2>
          <p>
            A prime contractor can also negotiate commercial terms with its subcontractors. Those terms may address payment, indemnity, insurance, termination, dispute resolution, notice, schedule risk, or other business issues. A term can be important without being federally required.
          </p>
          <p>
            That distinction matters because a statement such as “the Government requires this” should be testable. Ask which prime-contract clause, statute, regulation, agency supplement, or solicitation requirement is the source. If there is no clear federal source, review the provision as a commercial subcontract term rather than assuming it is non-negotiable.
          </p>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#1A3668]"><Network className="w-5 h-5 text-[#FF5F1F]" /> A simple three-bucket review</div>
            <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600">
              <li><strong className="text-[#1A3668]">Express flowdown:</strong> the clause directs inclusion in qualifying subcontracts.</li>
              <li><strong className="text-[#1A3668]">Conditional flowdown:</strong> the clause reaches the subcontract only when stated scope, value, information, or other triggers are present.</li>
              <li><strong className="text-[#1A3668]">Prime-added term:</strong> the provision may still be enforceable as a negotiated subcontract term, but it should not automatically be described as a federal requirement.</li>
            </ol>
          </div>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">Commercial product and commercial service subcontracts deserve special attention</h2>
          <p>
            FAR 44.402 contains an important policy limitation for subcontractors furnishing commercial products or commercial services. It states that, to the maximum extent practicable, those suppliers should not be required to accept clauses other than clauses required by law or executive order, or clauses consistent with customary commercial practice. FAR 52.244-6 implements that policy and identifies clauses required for qualifying commercial subcontracts.
          </p>
          <p>
            If your subcontract is for a commercial product or commercial service, read our dedicated guide to <a href="/blog/far-52-244-6-commercial-subcontracts" className="text-[#FF5F1F] font-bold hover:underline">FAR 52.244-6</a> before accepting a broad flowdown exhibit.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">Questions to ask when the prime sends a flowdown list</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>What prime-contract clause or requirement is the source of each flowdown?</li>
            <li>What threshold or scope trigger makes the clause applicable to this subcontract?</li>
            <li>Does the clause require the same text, the substance of the clause, or a modified lower-tier version?</li>
            <li>Does the clause require further flowdown to your own subcontractors or suppliers?</li>
            <li>Is the subcontract for commercial products or commercial services?</li>
            <li>Are referenced attachments, wage determinations, cyber requirements, or agency supplements missing?</li>
            <li>Does an order-of-precedence clause explain what controls if the flowdown exhibit conflicts with the subcontract body?</li>
          </ul>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">Do not rely on a flowdown matrix alone</h2>
          <p>
            A flowdown matrix can be useful because it organizes clause numbers, titles, applicability notes, and lower-tier requirements. But a matrix is still a summary. The current clause text and the actual subcontract facts control the analysis.
          </p>
          <p>
            Our next guide explains <a href="/blog/far-flowdown-matrix" className="text-[#FF5F1F] font-bold hover:underline">what a flowdown matrix should contain and what to do if the prime does not provide one</a>.
          </p>

          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 rounded-r-xl space-y-2">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">Official references</p>
            <p className="text-xs text-slate-600">Review the current text of <a href="https://www.acquisition.gov/far/44.402" target="_blank" rel="noopener noreferrer" className="text-[#FF5F1F] font-bold hover:underline">FAR 44.402</a> and <a href="https://www.acquisition.gov/far/52.244-6" target="_blank" rel="noopener noreferrer" className="text-[#FF5F1F] font-bold hover:underline">FAR 52.244-6</a> on Acquisition.gov.</p>
          </div>

          <p>
            For the broader foundation, see <a href="/blog/understanding-far-flow-down-clauses" className="text-[#FF5F1F] font-bold hover:underline">Understanding FAR Flow-Down Clauses: What Belongs in Your Subcontract</a>.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block"><FileText className="w-6 h-6" /></div>
            <h3 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Review the Clause List Before You Commit</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">SubPreCheck can organize cited clauses, missing referenced documents, and applicability questions so you can raise focused issues with the prime and qualified counsel.</p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#1A3668]"><Scale className="w-4 h-4 text-[#FF5F1F]" /> Important</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">This article is general educational information, not legal advice. Clause applicability depends on the current clause text and the facts of the specific subcontract.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
