"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Landmark } from "lucide-react";

export default function PayWhenPaidTrapArticle() {
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
              Federal Prompt Payment
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Pay-When-Paid and Pay-If-Paid: What Federal Subcontractors Should Review
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            Review contingent-payment language, payment timing, withholding rights, and federal construction payment provisions before accepting the prime's terms.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Article Body */}
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            It is one of the most frustrating phone calls a subcontractor can receive. Your lighting or industrial installation scope is 100% complete, fully inspected, and signed off. Yet, 60 days pass, and your progress invoice remains unpaid. When you call the general contractor’s accounting trailer, they give you a rehearsed response: <strong className="text-[#1A3668]">"The government hasn't funded that draw yet. Under our contract's 'Pay-When-Paid' clause, we don't owe you a dime until Uncle Sam pays us."</strong>
          </p>
          <p>
            A prime's payment position should be tested against the actual subcontract, the applicable federal construction payment clause if one is incorporated, and governing law. Federal procurement rules do not create one universal answer for every pay-when-paid or pay-if-paid dispute.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 trick-color text-[#FF5F1F]" /> What FAR Prompt Payment Language Can Affect
          </h3>
          <p>
            On covered federal construction contracts, FAR 52.232-27 includes subcontract payment and interest provisions that the prime must include in qualifying subcontracts. Those provisions matter, but they do not make the Government a party to a private payment dispute between a prime and subcontractor.
          </p>
          <p>
            When the clause applies, review the subcontract for the required payment framework, including:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <li>the stated deadline for paying subcontractors after the prime receives Government payment;</li>
            <li>interest terms for late subcontract payments and the notice process for withholding or retaining amounts.</li>
          </ul>
          <p>
            If payment is delayed, separate the questions: what the subcontract requires, whether the prime has received the related Government payment, what withholding notice was issued, and what other remedies may be available.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> Pay-If-Paid vs. Pay-When-Paid Language
          </h3>
          <p>
            The wording matters because contingent-payment provisions can allocate timing or non-payment risk differently. Their enforceability and effect can also vary by governing law.
          </p>
          <p>
            A clause labeled <strong className="text-[#1A3668]">"Pay-When-Paid"</strong> may address payment timing, but labels alone are not enough. Read the full provision for outside deadlines, conditions precedent, withholding rights, and language allocating owner non-payment risk.
          </p>
          <p>
            A <strong className="text-[#FF5F1F]">"Pay-If-Paid"</strong> or condition-precedent provision may attempt to shift owner non-payment risk downstream. Whether it has that effect depends on the actual wording and applicable law, so it is a term to flag for counsel before signing.
          </p>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">The Federal Contracting Exception</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              On covered federal construction projects, the Miller Act payment bond can provide a separate payment remedy for qualifying claimants, subject to statutory timing, tier, notice, and filing requirements. Bond rights should be evaluated separately from the subcontract's contingent-payment language.
            </p>
          </div>

          {/* Strategic Internal SEO Cross-Link */}
          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 my-6 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">
              Related Field Intelligence
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Primes routinely use minor administrative payroll discrepancies as an excuse to invoke contingent payment delays. Protect your cash flow by reading our full operational guide on 
              <a href="/blog/davis-bacon-certified-payroll-errors" className="text-[#FF5F1F] font-black hover:underline inline-flex items-center gap-0.5 ml-1 uppercase tracking-wide text-[11px]">
                The Certified Payroll Trap: How Labor Misclassifications Liquidate Your Retention →
              </a>
            </p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Questions to Resolve Before Signing
          </h3>
          <p>
            Before accepting contingent-payment language, identify the commercial and legal questions that need to be resolved:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Identify Conditions:</strong> Flag any "condition precedent" language or wording that shifts the risk of owner non-payment.</li>
            <li><strong className="text-[#1A3668]">Ask for a Defined Outside Date:</strong> Consider whether the subcontract should contain a clear payment deadline that is not open-ended.</li>
            <li><strong className="text-[#1A3668]">Check Withholding and Interest Terms:</strong> Confirm the required notice, retainage, withholding, and interest provisions that actually apply to the subcontract.</li>
          </ul>
        </div>

        {/* Strategic Call-to-Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <Landmark className="w-6 h-6" />
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
