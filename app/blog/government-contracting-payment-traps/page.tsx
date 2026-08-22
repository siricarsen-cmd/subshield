"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Landmark } from "lucide-react";

export default function PayWhenPaidTrapArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition"><ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub</a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">Federal Prompt Payment</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">Pay-When-Paid and Pay-If-Paid: What Federal Subcontractors Should Review</h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">Review contingent-payment language, payment timing, withholding rights, and federal construction payment provisions before accepting the prime's terms.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            Federal subcontract payment terms can combine private contract language with federal payment clauses, bond remedies, and project-specific withholding rules. The label on the clause is less important than the actual wording and the law that governs it.
          </p>
          <p>
            Before signing, identify whether payment is merely delayed until the prime is paid, whether Government payment is written as a condition precedent, and whether the subcontract contains an outside payment deadline.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> What FAR Prompt Payment Language Can Affect</h3>
          <p>
            On covered federal construction contracts, FAR 52.232-27 includes subcontract payment and interest provisions that the prime must include in qualifying subcontracts. Those provisions matter, but they do not make the Government a party to a private payment dispute between a prime and subcontractor.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <li>the stated deadline for paying subcontractors after the prime receives Government payment;</li>
            <li>interest terms for late subcontract payments;</li>
            <li>notice requirements for withholding or retaining amounts;</li>
            <li>how payment terms interact with any separate bond or statutory remedy.</li>
          </ul>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#FF5F1F]" /> Pay-If-Paid vs. Pay-When-Paid Language</h3>
          <p>
            A pay-when-paid provision may address timing, while a pay-if-paid or condition-precedent provision may attempt to shift owner nonpayment risk downstream. The effect of either clause depends on the actual language and governing law.
          </p>
          <p>
            Review the complete payment section for outside deadlines, conditions precedent, retainage, disputed-invoice procedures, acceptance conditions, setoff, backcharges, and withholding rights.
          </p>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">Construction Payment Has a Separate Bond Track</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              On covered federal construction projects, the Miller Act payment bond can provide a separate remedy for qualifying claimants, subject to tier, notice, timing, and filing requirements. Bond rights should be evaluated separately from contingent-payment language.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-[#1A3668] uppercase tracking-wide">Explore the Federal Payment Cluster</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="/blog/federal-subcontractor-not-paid-prime-contractor" className="text-[#FF5F1F] font-bold hover:underline">Federal Subcontractor Not Paid by the Prime: What to Check Next</a></li>
              <li><a href="/blog/prompt-payment-act-federal-subcontractors" className="text-[#FF5F1F] font-bold hover:underline">Does the Prompt Payment Act Protect Federal Subcontractors?</a></li>
              <li><a href="/blog/miller-act-payment-bond-claims" className="text-[#FF5F1F] font-bold hover:underline">Miller Act Payment Bond Claims and Deadlines</a></li>
              <li><a href="/blog/change-order-release-trap" className="text-[#FF5F1F] font-bold hover:underline">Change Order Releases and Waiver Language</a></li>
            </ul>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Questions to Resolve Before Signing</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Identify Conditions:</strong> Flag condition-precedent language or wording that shifts owner nonpayment risk.</li>
            <li><strong className="text-[#1A3668]">Ask for a Defined Outside Date:</strong> Determine whether payment can remain open-ended.</li>
            <li><strong className="text-[#1A3668]">Check Withholding and Interest Terms:</strong> Confirm notice, retainage, setoff, withholding, and interest provisions.</li>
            <li><strong className="text-[#1A3668]">Preserve Separate Remedies:</strong> Do not assume the subcontract payment clause replaces bond or other rights that may exist.</li>
          </ul>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block"><Landmark className="w-6 h-6" /></div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Review Before You Commit</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium"><strong className="text-[#1A3668]">SubPreCheck</strong> can surface payment conditions, withholding language, missing payment context, and related flowdowns before you sign.</p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
        </div>
      </div>
    </div>
  );
}
