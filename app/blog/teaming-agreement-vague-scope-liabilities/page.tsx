"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Handshake } from "lucide-react";

export default function TeamingAgreementsArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition"><ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub</a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">Pre-Award Strategy</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">Teaming Agreement Workshare: Clarify Scope Before Award</h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">Clarify workshare, scope, exclusivity, proposal responsibilities, and post-award expectations before your company commits bid resources.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>A teaming agreement can define how a prime and prospective subcontractor will pursue a federal opportunity, but vague workshare or post-award language can leave important commercial terms unresolved.</p>
          <p>Before committing proposal resources, compare the promised role, scope, workshare, exclusivity, pricing assumptions, and subcontract-negotiation process. The more of that framework is left for later, the more uncertainty exists after award.</p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> Watch Future-Negotiation Language</h3>
          <p>Phrases such as “negotiate in good faith,” “mutually agreeable subcontract,” or “anticipated workshare” can signal that key terms remain open. Whether a teaming agreement creates enforceable obligations depends on the actual language and governing law.</p>
          <p>Treat vague future-negotiation wording as a reason to clarify the business deal and obtain legal review, not as a guaranteed post-award scope commitment.</p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#FF5F1F]" /> Define the Commercial Framework</h3>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <li><strong className="text-[#1A3668]">Scope:</strong> Identify the work packages, functions, or statement-of-work areas the subcontractor is expected to perform.</li>
            <li><strong className="text-[#1A3668]">Workshare:</strong> State whether a percentage, minimum amount, or defined scope is intended.</li>
            <li><strong className="text-[#1A3668]">Exclusivity:</strong> Define the opportunity, duration, and release events.</li>
            <li><strong className="text-[#1A3668]">Post-Award Process:</strong> Explain what happens if the parties cannot agree on the definitive subcontract.</li>
            <li><strong className="text-[#1A3668]">Subcontract Form:</strong> Consider attaching or identifying the expected subcontract terms instead of waiting until after award.</li>
          </ul>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-[#1A3668] uppercase tracking-wide">Explore the Teaming & Small-Business Cluster</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="/blog/teaming-small-business-subcontracting-hub" className="text-[#1A3668] font-black hover:text-[#FF5F1F] hover:underline">Federal Teaming, Workshare & Small Business Subcontracting Hub</a></li>
              <li><a href="/blog/government-teaming-agreement-vs-subcontract" className="text-[#FF5F1F] font-bold hover:underline">Government Teaming Agreement vs. Subcontract: What Changes After Award?</a></li>
              <li><a href="/blog/teaming-agreement-exclusivity" className="text-[#FF5F1F] font-bold hover:underline">Exclusivity in Government Teaming Agreements</a></li>
              <li><a href="/blog/limitations-on-subcontracting-13-cfr-125-6" className="text-[#FF5F1F] font-bold hover:underline">Limitations on Subcontracting Under 13 CFR 125.6</a></li>
              <li><a href="/blog/similarly-situated-entity-rule" className="text-[#FF5F1F] font-bold hover:underline">Similarly Situated Entity Rule</a></li>
              <li><a href="/blog/ostensible-subcontractor-rule" className="text-[#FF5F1F] font-bold hover:underline">The Ostensible Subcontractor Rule</a></li>
            </ul>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Pre-Proposal Questions to Resolve</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>What exact opportunity and scope does the teaming agreement cover?</li>
            <li>What workshare is expected, and is it stated as a commitment or an estimate?</li>
            <li>When does exclusivity end?</li>
            <li>What terms remain open for the post-award subcontract?</li>
            <li>What happens if the prime wins but the parties cannot agree on the subcontract?</li>
          </ul>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block"><Handshake className="w-6 h-6" /></div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Review Before You Commit</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium"><strong className="text-[#1A3668]">SubPreCheck</strong> can surface workshare, exclusivity, scope, post-award negotiation, and missing-document issues before proposal resources are committed.</p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
        </div>
      </div>
    </div>
  );
}
