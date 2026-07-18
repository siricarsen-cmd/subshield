"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, AlertTriangle } from "lucide-react";

export default function TinaLiabilityArticle() {
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
              Federal Audit Risk
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Defective Pricing and TINA Liability: When the Prime’s Mistake Becomes Your Legal Problem
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            How federal truth-in-negotiation thresholds allow general contractors to pass massive government compliance penalties down onto blameless trade partners.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Article Body */}
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            When bidding on large-scale federal public works, your estimating team spends days squaring quantities, balancing production margins, and securing firm vendor commitments. You submit a clean proposal, the prime contractor wins the master award, and your subcontract is signed. You assume your pricing boundaries are locked.
          </p>
          <p>
            Then, long after field production has finished, a federal auditor uncovers an accounting error in the prime contractor’s master proposal package. The agency hits the general contractor with a multi-thousand-dollar contract price reduction for <strong className="text-[#1A3668]">"Defective Pricing."</strong>
          </p>
          <p>
            Instead of accepting responsibility for their clerical oversight, the general contractor’s legal team immediately relies on their contract boilerplate, asserting that *your* historical takeoff data or material quotes caused the government discrepancy. Suddenly, a prime’s procurement failure becomes a massive deduction against your outstanding retention check.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> The Truth in Negotiations Act (TINA) Mandate
          </h3>
          <p>
            The root of this risk lies in a strict piece of federal procurement law formerly known as the **Truth in Negotiations Act (TINA)**, now codified under FAR Part 15.4.
          </p>
          <p>
            TINA legally mandates that on sole-source federal contracts crossing large statutory dollar thresholds, contractors must submit **"certified cost or pricing data."** This means you are legally certifying that your raw estimating logs, material supplier agreements, and labor projections are accurate, complete, and current up to the exact minute of final price agreement.
          </p>
          <p>
            If a general contractor submits their master price proposal to a federal agency and uses your numbers as a baseline, they will force you to execute a matching **Certificate of Current Cost or Pricing Data**. By signing that form, you accept direct, flow-down exposure to federal defective pricing audits.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> The Prime’s Scapegoat Strategy: The Defective Pricing Clawback
          </h3>
          <p>
            The trap occurs because general contractors include sweeping indemnity lines in their FAR flow-down addendums. A typical TINA overreach clause looks like this:
          </p>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl font-mono text-xs text-slate-600 leading-relaxed">
            "If the Government reduces the Prime Contract price due to any defect in cost or pricing data provided by the Subcontractor, the Subcontractor shall indemnify and hold the Contractor harmless for the entire value of the reduction, plus all associated administrative expenses."
          </div>
          <p>
            If a government auditor discovers that the prime contractor simply inflated their master management markup or misapplied an optimization formula, the prime will scramble to shift blame.
          </p>
          <p>
            They will dig through your early estimation emails, look for a standard material discount your vendor offered late in the bidding process that didn't get scrubbed from the final file, and argue that *your* failure to disclose that minor discount caused the entire government penalty. They will use this as an immediate justification to withhold your progress draws.
          </p>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">The "Actual Cause" Legal Defense</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Under federal procurement law, a prime contractor cannot legally pass a defective pricing reduction down to a subcontractor unless they can definitively prove that the government *actually relied* on the sub's specific data discrepancy to lower the contract value. If the prime altered your numbers, added artificial markups, or ignored your warnings before submittal, their indemnity claim completely falls apart.
            </p>
          </div>

          {/* Strategic Internal SEO Cross-Link */}
          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 my-6 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">
              Related Field Intelligence
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Data certification risks often tie directly into hidden supply-chain parameters. Sourcing non-compliant variants under domestic content tests can trigger sudden financial reviews. Read our full analysis on
              <a href="/blog/buy-american-act-sourcing-mistakes" className="text-[#FF5F1F] font-black hover:underline inline-flex items-center gap-0.5 ml-1 uppercase tracking-wide text-[11px]">
                The BAA Procurement Blindspot: Why Your Submittal Packages Are Gating Your Cash Flow →
              </a>
            </p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Insulating Your Estimating Boundaries
          </h3>
          <p>
            Never let a general contractor use your estimation records as a shield to hide their own accounting mistakes. Defend your corporate capital with three explicit rules:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Insert a Mutual Fault Guard:</strong> Modify all TINA flow-down clauses to state that the subcontractor is only responsible if their data was the *sole, direct, and un-altered cause* of the government price reduction.</li>
            <li><strong className="text-[#1A3668]">Document Every Price Walkdown:</strong> If a prime contractor asks you to cut your numbers during a post-bid negotiation cycle, document that adjustment explicitly in writing, stating that the previous data is no longer current or certified.</li>
            <li><strong className="text-[#1A3668]">Enforce a Strict Notice Window:</strong> Require the prime contractor to provide immediate written notice within 5 days of any government audit notification regarding your scope, preventing them from spring-loading a surprise back-charge at the end of the project.</li>
          </ul>
        </div>

        {/* Strategic Call-to-Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">
              Shield Your Estimating Integrity
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Don't sign a predatory boilerplate contract that allows a prime contractor to pass federal defective pricing penalties down onto your trade business.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Drop your federal agreement bundle or procurement addendums into the <strong className="text-[#1A3668]">SubShield AI TINA Auditor</strong> to instantly isolate unfair pricing indemnity triggers, flag dangerous audit risks, and secure your contract boundaries before signing.
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
