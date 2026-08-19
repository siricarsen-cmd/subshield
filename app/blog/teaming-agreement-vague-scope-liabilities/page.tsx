"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Handshake } from "lucide-react";

export default function TeamingAgreementsArticle() {
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
              Pre-Award Strategy
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Teaming Agreement Workshare: Clarify Scope Before Award
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            Clarify workshare, scope, exclusivity, proposal responsibilities, and post-award expectations before your company commits bid resources.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Article Body */}
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            The setup is always incredibly flattering. A large prime contractor approaches your trade business on bid day. They need your technical experience, past performance credits, or local certifications to make their federal proposal competitive. They ask you to sign a <strong className="text-[#1A3668]">Teaming Agreement</strong>, promising that when they win the project, you win the scope.
          </p>
          <p>
            You spend dozens of unbillable hours helping them draft submittals, engineer layouts, and sharpen pricing matrices. The agency awards the contract to the team. 
          </p>
          <p>
            Then, the celebration ends. The prime hands you a definitive subcontract that cuts your scope in half, slashes your profit margin, or replaces you entirely. A later dispute can turn on whether the teaming agreement created enforceable obligations or left essential terms for future negotiation. That answer depends on the document and governing law.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> The Key Risk: Vague "Agreements to Agree"
          </h3>
          <p>
            Vague scope allocation can create significant enforceability and business-risk questions, especially when the agreement leaves workshare or key commercial terms for future negotiation.
          </p>
          <p>
            If your Teaming Agreement includes lazy boilerplate text like: *“Upon award, the Prime and Subcontractor will negotiate a definitive agreement in good faith for a mutually agreeable portion of the project package,”* you have signed a potentially incomplete document.
          </p>
          <p>
            Courts have treated teaming agreements differently depending on their wording and governing law. Treat phrases such as "good faith negotiation" or "mutually agreeable subcontract" as signals to obtain legal review rather than assuming a guaranteed post-award workshare.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> How to Force an Enforceable Workshare
          </h3>
          <p>
            To stop a prime contractor from riding your corporate qualifications to a win and then casting you aside, your Teaming Agreement must look like a complete blueprint. It must contain the specific commercial terms that courts require to enforce an agreement:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <li><strong className="text-[#1A3668]">A Specific Percentage or Scope:</strong> State explicitly that the sub is entitled to a concrete metric (e.g., *"35% of the total contract value"* or *"the absolute entirety of the specified procurement and commissioning package"*).</li>
            <li><strong className="text-[#1A3668]">The Pre-Negotiated Exhibit:</strong> Never wait until after the award to look at the subcontract. Attach the exact, finalized subcontract form as a mandatory "Exhibit A" right inside the Teaming Agreement on day one.</li>
          </ul>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">The Small Business Exclusivity Threat</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              If the proposal relies on your small-business status, past performance, or stated participation, confirm that the proposal commitments, subcontracting-plan obligations, and expected workshare are documented consistently. Potential misrepresentation issues are fact-specific and should be referred to qualified counsel.
            </p>
          </div>

          {/* Strategic Internal SEO Cross-Link */}
          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 my-6 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">
              Related Field Intelligence
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Primes often exploit loose pre-bid alignments to harvest your vendor quote networks and shop your bill of materials sequence. Protect your operational data by reviewing 
              <a href="/blog/protecting-proprietary-supply-pricing" className="text-[#FF5F1F] font-black hover:underline inline-flex items-center gap-0.5 ml-1 uppercase tracking-wide text-[11px]">
                Protecting Proprietary Supply Pricing: NDA Pitfalls for Commercial Trade Distributors →
              </a>
            </p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Your Pre-Proposal Negotiation Defense
          </h3>
          <p>
            Establish hard boundaries before lending your company's credentials to a prime contractor's proposal track:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Insert the Mandatory Execution Trigger:</strong> Ask counsel whether the agreement should state a defined workshare, scope, exclusivity period, negotiation framework, or attached form of subcontract rather than leaving every material term open.</li>
            <li><strong className="text-[#1A3668]">Strike "Good Faith Negotiation" Boilerplate:</strong> Flag future-negotiation language and make sure the business understands what is binding now, what remains open, and what happens if the parties cannot agree after award.</li>
          </ul>
        </div>

        {/* Strategic Call-to-Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <Handshake className="w-6 h-6" />
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
