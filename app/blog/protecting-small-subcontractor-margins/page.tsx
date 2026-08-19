"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Users } from "lucide-react";

export default function ProtectingSmallSubcontractorMarginsArticle() {
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
              Small Business Defense
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Protecting Small Subcontractor Margins Before You Sign
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            A practical pre-award checklist for payment, scope, change, liability, termination, and flowdown terms that can affect a small subcontractor's margin.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Article Body */}
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            For an independent, specialty trade contractor, success isn't built behind a desk—it is forged out in the dirt, coordinating field crews, managing material lines, and delivering precision craftsmanship. You know how to price labor, you know how to build a schedule, and your reputation keeps your project pipeline full.
          </p>
          <p>
            But the moment you step out of the field and onto a major commercial or public procurement site, the rules of engagement radically shift. 
          </p>
          <p>
            General contractors hand you an intimidating, 60-page master agreement packed with dense, microscopic boilerplate text. The project manager implies that it is a standard, take-it-or-leave-it document. They are banking on an open industry secret: **small contractors rarely have the budget to put a dedicated construction attorney on retainer just to audit a routine project contract.**
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> The Asymmetry of Risk: Why You Are the Target
          </h3>
          <p>
            Large general contractors employ massive legal and risk-management departments whose sole corporate mandate is to isolate the prime contractor from financial exposure. 
          </p>
          <p>
            Prime contractors commonly use subcontract terms to allocate project risk downstream. The business question is whether each allocation matches your scope, price, insurance, schedule control, and ability to manage the risk.
          </p>
          <p>
            They count on the fact that you will check the contract price, verify the scope of work, review the billing cycle rules, and sign the document without scanning the back-page clauses that grant them the right to freeze your progress draws over a minor administrative detail.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> The Three Boilerplate Levers That Crush Small Trades
          </h3>
          <p>
            General contractor risk teams systematically use three primary contractual clauses to squeeze the operating margins of small specialty trades:
          </p>
          <ul className="list-disc pl-5 space-y-4 text-xs text-slate-600 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <li>
              <strong className="text-[#1A3668]">The No-Notice Change Trap:</strong> Clauses stating that if you perform extra field adjustments without a formal, pre-signed written order from their executive team within 48 hours, you permanently waive your right to be paid for that extra labor.
            </li>
            <li>
              <strong className="text-[#1A3668]">The Broad Indemnity Anchor:</strong> Lines forcing your small business to hold the GC completely harmless for injuries or accidents on the site, even if the hazard was created entirely by the prime's poor site safety management.
            </li>
            <li>
              <strong className="text-[#1A3668]">The Conditional Payment Squeeze:</strong> "Pay-If-Paid" structures that give the prime a legal excuse to withhold your project cash flow indefinitely if the master project owner encounters a funding disruption.
            </li>
          </ul>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">The "Size Exclusion" Fallacy</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Many small business owners assume that because their subcontract value is minor compared to the master project budget, the GC won't waste time enforcing complex boilerplate penalties against them. A smaller subcontract value does not make boilerplate irrelevant. Notice, payment, release, indemnity, change, and termination provisions can still materially affect cash flow and closeout leverage.
            </p>
          </div>

          {/* Strategic Internal SEO Cross-Link */}
          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 my-6 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">
              Related Field Intelligence
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              One-Sided liability shifts are the fastest way to drain your company's retained cash reserves on site. Read our complete legal survival guide on 
              <a href="/blog/broad-form-indemnification-subcontractor-vulnerabilities" className="text-[#FF5F1F] font-black hover:underline inline-flex items-center gap-0.5 ml-1 uppercase tracking-wide text-[11px]">
                Broad Indemnification: How Risk Can Shift to the Subcontractor →
              </a>
            </p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Leveling the Operational Playing Field
          </h3>
          <p>
            A structured first-pass review can help a small business organize the issues before counsel gets involved, so attorney time can focus on the questions that actually require legal judgment:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Strike One-Sided Penalties:</strong> Line through any clauses that give the GC the automatic right to quickly withhold your entire progress check or assess un-apportioned liquidated damages without providing a clear, multi-day written warning and cure window.</li>
            <li><strong className="text-[#1A3668]">Insist on Proportionate Accountability:</strong> Alter all indemnity and liability lines to state that your company is strictly accountable *only* for damages directly caused by your own field actions.</li>
            <li><strong className="text-[#1A3668]">Leverage Automated Pre-Screening:</strong> Treat contract reviews as a mandatory pre-bid operational step, just like executing a material take-off or verifying field measurements.</li>
          </ul>
        </div>

        {/* Strategic Call-to-Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <Users className="w-6 h-6" />
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
