"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Network } from "lucide-react";

export default function FarFlowDownClausesArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      
      {/* Article Header Banner */}
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition">
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">
              FAR & DFARS Compliance
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Understanding FAR Flow-Down Clauses: What Belongs in Your Subcontract
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            Learn how to distinguish clause requirements that apply to your subcontract from additional prime-drafted obligations that need separate review.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Article Body */}
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            It is a standard tactical move for a General Contractor during public procurement. They attach a massive addendum to your contract labeled <strong className="text-[#1A3668]">"Federal Acquisition Regulation (FAR) Flow-Down Provisions."</strong> It contains dozens of dense, alphanumeric legal codes, and the project manager tells you, *"Take it or leave it. Every line is legally mandated by the federal government."*
          </p>
          <p>
            If you sign the addendum without reviewing applicability, you may accept reporting, audit, cyber, labor, or commercial obligations that were not priced into your scope. 
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> Start With Clause Applicability
          </h3>
          <p>
            There is no single universal FAR flowdown list for every subcontract. Applicability can depend on the prime contract, clause text, subcontract type, dollar value, scope, agency supplement, and whether the subcontract is for commercial products or commercial services.
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <li>
              <strong className="text-[#1A3668]">Required Flowdowns:</strong> Some clauses expressly direct the prime to include specified language in qualifying subcontracts, sometimes only when stated thresholds or scope triggers are met.
            </li>
            <li>
              <strong className="text-[#FF5F1F]">Additional Prime Terms:</strong> A prime may also include commercial risk-allocation terms or broader obligations for its own contract-management reasons. Those terms should be analyzed separately rather than assumed to be federally required.
            </li>
          </ol>
          <p>
            By failing to draw a line between the two, trade subcontractors routinely accept strict commercial penalties and design tracking frameworks that belong entirely to the prime's management team.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> What You Must Accept (The Real Rules)
          </h3>
          <p>
            Do not decide applicability from a clause title alone. For each cited FAR or DFARS clause, check the text for subcontract instructions, thresholds, scope triggers, lower-tier requirements, and any permitted substitutions.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-[#1A3668]">FAR 52.222-26:</strong> Equal Opportunity compliance tracking.</li>
            <li><strong className="text-[#1A3668]">FAR 52.222-41:</strong> Service Contract Act guidelines for prevailing wages.</li>
            <li><strong className="text-[#1A3668]">FAR 52.203-13:</strong> Contractor Code of Business Ethics and Conduct (typically applied if your sub-scope clears major dollar thresholds).</li>
          </ul>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> What to Strike: Red-Flag Overreach Clauses
          </h3>
          <p>
            Some clauses deserve closer commercial review even when the prime has a reason to include them. The key question is what the clause actually requires of your company and whether that obligation has been priced and scoped.
          </p>
          <ul className="list-disc pl-5 space-y-4">
            <li>
              <strong className="text-[#1A3668]">FAR 52.249-2 (Termination for Convenience):</strong> Primes love to copy this clause to give themselves the right to terminate your trade contract for absolutely any reason without penalty. You must add protective language ensuring you are fully compensated for all field mobilization, ordered material packages, and earned profit up to the termination date.
            </li>
            <li>
              <strong className="text-[#1A3668]">FAR 52.215-2 (Audit and Records):</strong> Unless strictly required by project thresholds, do not allow a prime contractor to demand open-book access to your corporate financials, historical material markups, or internal labor cost margins under the guise of a "government audit."
            </li>
          </ul>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">The "Mutatis Mutandis" Trap</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Watch out for sweeping prefaces that state: *"Wherever the term 'Government' appears, it shall mean 'Contractor'."* This lazy boilerplate turns reasonable federal provisions into highly aggressive commercial weapons, giving a standard general contractor the same sweeping regulatory enforcement powers as the United States military.
            </p>
          </div>

          {/* Strategic Internal SEO Cross-Link */}
          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 my-6 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">
              Related Field Intelligence
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              One-Sided flow-downs are almost always hidden using legal shortcuts. Read our full strategic guide on how to protect your team from signing blind agreements:
              <a href="/blog/incorporation-by-reference-ambush" className="text-[#FF5F1F] font-black hover:underline inline-flex items-center gap-0.5 ml-1 uppercase tracking-wide text-[11px]">
                Incorporation by Reference: Review Documents You Are Being Asked to Accept →
              </a>
            </p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Drawing Your Compliance Line
          </h3>
          <p>
            Take back your negotiating leverage during procurement by establishing a clean review process:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Insist on Threshold Exemptions:</strong> FAR and DFARS clauses use different thresholds and applicability tests, and those thresholds can change. Verify the current text of each clause instead of relying on a single dollar cutoff.</li>
            <li><strong className="text-[#1A3668]">Isolate True Flow-Down Lists:</strong> Ask the prime to identify the source of each flowdown, provide referenced attachments, and explain any contract-specific applicability assumptions that affect your scope or pricing.</li>
          </ul>
        </div>

        {/* Strategic Call-to-Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <Network className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">
              Review Before You Commit
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Use the article as a checklist for terms, documents, and questions to resolve before bidding, signing, or committing resources.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              <strong className="text-[#1A3668]">SubPreCheck</strong> can surface the relevant language, organize evidence-grounded issues, and prepare a focused package for discussion with the prime and qualified counsel.
            </p>
            <hr className="border-slate-100" />
            <a 
              href="/pricing"
              className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm"
            >
              See Review Plans
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
