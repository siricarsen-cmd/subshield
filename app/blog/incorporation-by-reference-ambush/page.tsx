"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Scale } from "lucide-react";

export default function IncorporationReferenceArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      
      {/* Header Banner */}
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition">
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">
              Contractual Risk Shift
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Incorporation by Reference: Review Documents You Are Being Asked to Accept
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            Review every document incorporated by reference so you know which prime-contract terms, specifications, exhibits, and flowdowns may affect your subcontract.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Article Body */}
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            It happens during almost every commercial project kickoff. A general contractor hands an estimator a clean, standard 10-page subcontract. The payment terms look reasonable, the scope matches your takeoffs, and the schedule seems doable. You sign it, thinking the boundaries are secure.
          </p>
          <p>
            Then, months later, a massive design conflict delays the project. You ask for an equitable adjustment, only for the GC to point to a clause you have never seen, declaring that you waived your right to delay damages weeks ago. Welcome to the <strong className="text-[#1A3668]">Incorporation by Reference</strong>.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> The One-Sentence Liability Trap
          </h3>
          <p>
            The trap relies on a tiny, boilerplate sentence that looks completely harmless to a busy contractor. It usually reads something like this:
          </p>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl font-mono text-xs text-slate-600 leading-relaxed">
            "The Subcontractor hereby agrees to be bound to the Contractor by all terms, provisions, general conditions, and supplementary specifications of the Prime Contract, which is incorporated herein by reference as though fully rewritten."
          </div>
          <p>
            An incorporation clause may make specified prime-contract provisions relevant to the subcontract, but its legal effect depends on the language, the incorporated documents, the subject matter, and governing law. Do not treat a reference as harmless simply because the attachment was not provided. 
          </p>
          <p>
            Incorporated schedules, specifications, dispute terms, notice rules, liquidated-damages provisions, or compliance clauses may affect your obligations if the subcontract makes them applicable. The correct response is to obtain and review the referenced documents before signing.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> Hidden Architectural Risk Shifts
          </h3>
          <p>
            In industrial and commercial specialty trades, this ambush frequently targets design modifications. For instance, the prime agreement might state that the contractor assumes absolute responsibility for verifying any structural or coordination discrepancies in the field. 
          </p>
          <p>
            Design-assist, coordination, verification, and delegated-design duties should be separated carefully. An incorporated prime term may affect those duties, but responsibility for a specific conflict depends on the subcontract scope, drawings, specifications, design roles, and applicable law.
          </p>

          {/* Strategic Internal SEO Cross-Link */}
          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 my-6 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">
              Related Field Intelligence
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              These invisible master agreements are the primary channel primes use to smuggle heavy compliance terms onto your balance sheet. Read our deep-dive analysis on 
              <a href="/blog/understanding-far-flow-down-clauses" className="text-[#FF5F1F] font-black hover:underline inline-flex items-center gap-0.5 ml-1 uppercase tracking-wide text-[11px]">
                Understanding FAR Flow-Down Clauses: What Belongs in Your Subcontract →
              </a>
            </p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Taking Control of the Flow-Down
          </h3>
          <p>
            You can protect your company from invisible liabilities by enforcing two strict contract negotiation rules:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Demand the Master Document:</strong> Request the incorporated prime-contract sections, general conditions, specifications, exhibits, flowdown matrix, wage determination, cyber attachments, and other referenced documents needed to understand your obligations. Flag anything the prime will not provide.</li>
            <li><strong className="text-[#1A3668]">Add an Order of Precedence Clause:</strong> Review the order-of-precedence clause so the team knows which document controls if the subcontract, prime contract, drawings, specifications, or exhibits conflict.</li>
          </ul>
        </div>

        {/* Sidebar CTA */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <Scale className="w-6 h-6" />
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
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">
              See Review Plans
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
