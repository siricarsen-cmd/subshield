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
            The Teaming Agreement Bait-and-Switch: Preventing Vague Workshares After the Award
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            Don't let a prime contractor ride your qualifications to a federal win, only to freeze you out of the project scope once the check clears.
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
            Then, the celebration ends. The prime hands you a definitive subcontract that cuts your scope in half, slashes your profit margin, or replaces you entirely. When you threaten to sue, you realize a brutal legal reality: your Teaming Agreement wasn't actually an enforceable contract for work. It was merely an "agreement to agree."
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> The Fatal Flaw: Vague "Agreements to Agree"
          </h3>
          <p>
            Courts across the country routinely throw out lawsuits brought by jilted subcontractors because of a single, systemic drafting error: **vague scope allocation**.
          </p>
          <p>
            If your Teaming Agreement includes lazy boilerplate text like: *“Upon award, the Prime and Subcontractor will negotiate a definitive agreement in good faith for a mutually agreeable portion of the project package,”* you have signed a legally useless document.
          </p>
          <p>
            Under federal procurement case law, an agreement to negotiate in the future is completely unenforceable. If the prime contractor decides to shop your numbers to a cheaper, non-compliant competitor after winning the award, a judge cannot force them to hire you.
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
              If the prime contractor is leveraging your specialized small business, veteran-owned, or minority-owned status to hit mandatory federal agency utilization quotas, a post-award bait-and-switch isn't just a breach of trust—it can constitute a civil false claims violation. Primes count on you staying quiet; armor your positions early so they don't dare test your boundaries.
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
            <li><strong className="text-[#1A3668]">Insert the Mandatory Execution Trigger:</strong> Ensure the agreement explicitly states that the execution of the attached subcontract is a *mandatory automatic consequence* of the prime receiving the federal award, leaving zero room for post-award renegotiations.</li>
            <li><strong className="text-[#1A3668]">Strike "Good Faith Negotiation" Boilerplate:</strong> Delete any language that frames your post-award relationship as a future negotiation cycle. If the commercial terms aren't defined right now, do not let them use your company's resume.</li>
          </ul>
        </div>

        {/* Strategic Call-to-Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <Handshake className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">
              Lock in Your Pre-Award Scope
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Don't let an aggressive prime contractor leverage your company's history to secure a federal award, only to freeze your crews out later.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Run your joint venture or pre-award paperwork through the <strong className="text-[#1A3668]">SubShield Pre-Bid Auditor</strong> to instantly verify workshare enforceability, isolate vague scope parameters, and lock down your fair share of the project revenue.
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
