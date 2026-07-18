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
            The Incorporation by Reference Ambush: Agreeing to Plans You’ve Never Seen
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            How a single sentence in a standard subcontract legally binds your trade business to hundreds of pages of hidden prime contract liabilities.
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
            Then, months later, a massive design conflict delays the project. You ask for an equitable adjustment, only for the GC to point to a clause you have never seen, declaring that you waived your right to delay damages weeks ago. Welcome to the <strong className="text-[#1A3668]">Incorporation by Reference Ambush</strong>.
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
            By signing that single line, you have legally signed the **Prime Contract**—a massive, 300-to-500 page document signed between the GC and the end owner that you likely have never seen. 
          </p>
          <p>
            If that master document contains severe liquidated damages, aggressive milestone penalties, or extreme architectural dispute-resolution terms, those parameters instantly "flow down" and bind your business. You have essentially signed a blank check for liability.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> Hidden Architectural Risk Shifts
          </h3>
          <p>
            In industrial and commercial specialty trades, this ambush frequently targets design modifications. For instance, the prime agreement might state that the contractor assumes absolute responsibility for verifying any structural or coordination discrepancies in the field. 
          </p>
          <p>
            When that flows down to you, you are no longer just an installation sub—you are now legally carrying the liability for engineering and design oversights. If a fixture layout runs into ductwork or structural iron, the GC can force you to re-route your layout entirely at your own expense, claiming you agreed to catch the coordination error before ordering materials.
          </p>

          {/* Strategic Internal SEO Cross-Link */}
          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 my-6 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">
              Related Field Intelligence
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              These invisible master agreements are the primary channel primes use to smuggle heavy compliance terms onto your balance sheet. Read our deep-dive analysis on 
              <a href="/blog/understanding-far-flow-down-clauses" className="text-[#FF5F1F] font-black hover:underline inline-flex items-center gap-0.5 ml-1 uppercase tracking-wide text-[11px]">
                Deciphering FAR Flow-Down Clauses: What Subcontractors Must Accept vs. What to Delete →
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
            <li><strong className="text-[#1A3668]">Demand the Master Document:</strong> Never sign a subcontract that incorporates an external document without demanding a complete digital copy of the Prime Contract first. If the GC refuses to provide it, strike out the reference clause completely.</li>
            <li><strong className="text-[#1A3668]">Add an Order of Precedence Clause:</strong> Force an explicit line into your agreement stating that if there is any conflict between your subcontract and the incorporated prime agreement, the terms of your subcontract take absolute precedence.</li>
          </ul>
        </div>

        {/* Sidebar CTA */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <Scale className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">
              Expose Hidden Flow-Down Risks
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Don't sign an agreement that binds you to hundreds of pages of invisible, predatory boilerplate rules.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Drop your contract bundle into the <strong className="text-[#1A3668]">SubShield AI Triage Engine</strong> to instantly scan for hidden incorporation triggers and isolate unfair design-risk shifts before they cost you your margins.
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
