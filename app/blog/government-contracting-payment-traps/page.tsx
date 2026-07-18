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
            The "Pay-When-Paid" Illusion: Weaponizing FAR Compliance to Mask Prime Overreach
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            How general contractors falsely invoke federal acquisition rules to justify withholding cash flow from trade subcontractors—and how the law actually protects you.
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
            They make it sound like an unbendable rule of federal procurement. But in the world of federal contracting, this defense is often a complete legal illusion used to force subcontractors to act as interest-free banks for the prime contractor.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 trick-color text-[#FF5F1F]" /> The Truth About FAR Prompt Payment
          </h3>
          <p>
            Here is the reality that prime contractors do not want you to know: the federal government takes subcontractor cash flow incredibly seriously. Under **FAR 52.232-27 (The Prompt Payment Act Clause for Construction Contracts)**, specific statutory guardrails protect your money.
          </p>
          <p>
            When a prime contractor submits a progress payment request to a federal agency, they are legally required to certify that:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <li>They will pay their subcontractors from the proceeds of that specific draw within **7 days** of receiving cash from the government.</li>
            <li>Any withholdings or project delays are justified by actual, deficient performance by the subcontractor.</li>
          </ul>
          <p>
            If a prime contractor takes money from the federal government for your completed scope and uses it to cover their own overhead, shortfalls on other jobs, or corporate expenses, they are committing a severe compliance violation.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> The Trap: "Pay-IF-Paid" vs. "Pay-WHEN-Paid"
          </h3>
          <p>
            Primes count on trade subcontractors not understanding the massive legal distinction between two very specific words in the boilerplate text:
          </p>
          <p>
            A true <strong className="text-[#1A3668]">"Pay-When-Paid"</strong> clause merely sets a reasonable *timing* framework for when payment should arrive. In most courts, it does not absolve the prime contractor of their ultimate debt. If the government goes bankrupt or delays funding indefinitely, the prime still legally owes you for your completed labor.
          </p>
          <p>
            However, primes routinely sneak aggressive <strong className="text-[#FF5F1F]">"Pay-If-Paid"</strong> language into subcontracts. This shifts the absolute risk of owner non-payment completely onto your shoulders. It states that the owner paying the prime is a mandatory "condition precedent" to your payment. If the owner never pays, you have legally agreed that you are entitled to exactly $0.
          </p>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">The Federal Contracting Exception</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              On federal projects, the Miller Act provides subcontractors with a powerful statutory bond option to sue for payment after 90 days of non-payment. Primes know this, which is why they try to use creative boilerplate text to get you to waive your prompt payment and Miller Act rights before a shovel ever touches the dirt.
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
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Striking Out the Contingency Trap
          </h3>
          <p>
            Never sign a subcontract that leaves your company's cash flow at the mercy of an owner-prime relationship you cannot control. Protect your cash flow with these exact strategies:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Strike Out "Condition Precedent":</strong> Line through any phrases stating that payment to the prime is a "condition precedent" or that the subcontractor "assumes the risk of owner non-payment."</li>
            <li><strong className="text-[#1A3668]">Insist on an Absolute Stop-Gap:</strong> Add clear fallback language: *"In no event shall subcontractor payment be delayed more than 60 days from invoice submission, regardless of whether prime contractor has received payment from the owner."*</li>
            <li><strong className="text-[#1A3668]">Leverage FAR Interest Clauses:</strong> Remind the prime that under FAR guidelines, if they delay a subcontractor's payment without an official, certified deficiency notice, they are legally obligated to pay interest on those late funds.</li>
          </ul>
        </div>

        {/* Strategic Call-to-Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <Landmark className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">
              Secure Your Payment Framework
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Don't sign a predatory boilerplate contract that turns your trade business into an interest-free bank for the general contractor.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Drop your contract into the <strong className="text-[#1A3668]">SubShield AI Triage Engine</strong> to instantly scan for hidden conditional payment traps, flag unfair risk shifts, and receive an immediate negotiation script to keep your capital safe.
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
