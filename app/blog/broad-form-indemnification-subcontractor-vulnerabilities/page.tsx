"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, ShieldX } from "lucide-react";

export default function BroadIndemnificationArticle() {
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
              Liability & Risk Defense
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Broad Indemnification: How Risk Can Shift to the Subcontractor
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            Review indemnity, duty-to-defend, negligence, insurance, and governing-law language before accepting liability outside your own scope.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Article Body */}
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            When executing a commercial contract, you expect to be held accountable for your own work. If your field crews damage a structure or cause an operational disruption, your company should step up, fix the error, and leverage your insurance policies to make the project whole. That is standard, fair business.
          </p>
          <p>
            But under a <strong className="text-[#1A3668]">Broad-Form Indemnification Clause</strong>, general contractors completely tear up this standard framework of fairness. 
          </p>
          <p>
            Some indemnity clauses are drafted broadly enough to reach losses involving the prime's acts, shared fault, or claims beyond the subcontractor's direct work. The effect depends on the wording and governing law.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> The Anatomy of a Broad-Form Clause
          </h3>
          <p>
            Broad indemnity language can be easy to overlook in a long subcontract. A clause may read like this:
          </p>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl font-mono text-xs text-slate-600 leading-relaxed">
            "Subcontractor shall defend, indemnify, and hold harmless the Contractor from any and all claims, losses, or liabilities arising out of the project, **regardless of whether caused in part or in whole by the negligence of the Contractor.**"
          </div>
          <p>
            The highlighted language attempts to allocate liability beyond losses caused solely by the subcontractor. Its enforceability and scope depend on governing law and the rest of the agreement. 
          </p>
          <p>
            If a claim involves the prime's conduct, the clause may still be invoked against the subcontractor depending on its wording. That can create defense-cost, indemnity, and insurance questions that should be resolved before signing.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> The Uninsured Risk Exposure
          </h3>
          <p>
            Indemnity and duty-to-defend obligations should also be checked against the subcontractor's insurance program. Contractual liability coverage, exclusions, additional-insured status, and state law can affect whether a particular loss is insured.
          </p>
          <p>
            Insurance treatment is policy-specific. Contractual-liability exclusions often contain exceptions, and additional-insured or insured-contract provisions can change the analysis. Have the broker review the proposed indemnity and defense language against the actual policy. 
          </p>
          <p>
            If the contractual obligation extends beyond available insurance, the subcontractor may face uninsured defense or indemnity exposure. The amount and coverage outcome depend on the claim, policy, contract, and governing law.
          </p>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">The Anti-Indemnity Statute Shield</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Many states regulate construction indemnity, but the rules differ by jurisdiction and by the type of indemnity or defense obligation at issue. Choice-of-law and venue provisions can therefore be important review points. Have counsel evaluate the clause under the law that is likely to govern.
            </p>
          </div>

          {/* Strategic Internal SEO Cross-Link */}
          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 my-6 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">
              Related Field Intelligence
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Broad liability terms can affect both cash flow and insurance planning. Read the related pre-award margin guide on
              <a href="/blog/protecting-small-subcontractor-margins" className="text-[#FF5F1F] font-black hover:underline inline-flex items-center gap-0.5 ml-1 uppercase tracking-wide text-[11px]">
                Protecting Small Subcontractor Margins: Contractual Shields for Trade Cash Flows →
              </a>
            </p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Rewriting the Boundary Rules
          </h3>
          <p>
            Before signing, identify the liability boundary the clause creates and discuss any proposed revision with counsel and your insurance broker:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Review Proportionate-Fault Language:</strong> Ask counsel whether the indemnity should be limited to losses caused by the subcontractor's acts or omissions and whether the proposed wording complies with applicable anti-indemnity law.</li>
            <li><strong className="text-[#1A3668]">Separate Defense From Indemnity:</strong> Review when any duty to defend begins, who controls counsel, how defense costs are allocated, and whether the obligation is broader than the indemnity permitted by governing law.</li>
          </ul>
        </div>

        {/* Strategic Call-to-Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <ShieldX className="w-6 h-6" />
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
