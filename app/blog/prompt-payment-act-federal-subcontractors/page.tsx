"use client";

import React from "react";
import { ArrowLeft, BadgeDollarSign, Building2, FileText, Scale } from "lucide-react";

export default function PromptPaymentActSubcontractorsArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
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
            Does the Prompt Payment Act Protect Federal Subcontractors?
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            The answer depends on the contract type, the clause set, and whether you are asking about Government payment to the prime or prime payment to the subcontractor.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            Federal subcontractors often hear “Prompt Payment Act” used as shorthand for a guaranteed payment deadline. That is too broad. The Prompt Payment Act primarily governs payment by the Federal Government, while subcontractor payment rights can come from the subcontract itself, specific FAR clauses, construction payment provisions, bond law, and other applicable law.
          </p>
          <p>
            The practical approach is to identify which payment rule you are actually relying on before sending a demand or assuming interest is automatically due.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#FF5F1F]" /> Government-to-prime payment is not the same as prime-to-sub payment
          </h2>
          <p>
            The Government’s obligation to pay its prime contractor and the prime contractor’s obligation to pay a subcontractor are separate relationships. A subcontractor normally needs to start with the signed subcontract and the clauses that apply to that subcontract relationship.
          </p>
          <p>
            That distinction is why a prime’s statement that “the Government has not paid us yet” does not answer the subcontractor’s legal or contractual payment question by itself. The subcontract still needs to be read for contingent-payment language, fixed payment dates, retainage, withholding rights, notice, and dispute procedures.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <BadgeDollarSign className="w-5 h-5 text-[#FF5F1F]" /> Federal construction has a specific subcontract payment clause
          </h2>
          <p>
            FAR 52.232-27, Prompt Payment for Construction Contracts, is especially important on covered federal construction work. It requires the prime contractor to include subcontract terms that address prompt payment and interest. The current clause provides for payment to a subcontractor for satisfactory performance no later than seven days after the prime receives payment from the Government for that work, along with an interest-penalty requirement for late subcontract payments.
          </p>
          <p>
            The clause also requires lower-tier flowdown of conforming payment and interest provisions. That makes federal construction different from a generic services or supply subcontract where the payment analysis may depend more heavily on the subcontract’s own terms and other applicable clauses.
          </p>
          <p className="text-xs text-slate-500">
            Official source: <a href="https://www.acquisition.gov/far/52.232-27" className="text-[#1A3668] font-bold hover:underline">FAR 52.232-27, Prompt Payment for Construction Contracts</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> Contracting officers can review asserted nonpayment
          </h2>
          <p>
            FAR 32.112-1 provides a federal contract-administration mechanism when a subcontractor or supplier asserts nonpayment. For construction, the contracting officer may determine whether the prime made progress payments in compliance with the Prompt Payment Act framework or final payment in accordance with the subcontract. For non-construction contracts, the contracting officer may examine whether the prime made payments in accordance with the subcontract or other agreement.
          </p>
          <p>
            If the contracting officer finds noncompliance, the FAR permits certain administrative responses, including encouraging timely payment and, when an applicable payment clause allows it, reducing or suspending progress payments to the prime.
          </p>
          <p className="text-xs text-slate-500">
            Official source: <a href="https://www.acquisition.gov/far/32.112-1" className="text-[#1A3668] font-bold hover:underline">FAR 32.112-1, Subcontractor assertions of nonpayment</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">Accelerated small-business payments are helpful—but not a new Prompt Payment Act right</h2>
          <p>
            FAR 32.009-1 establishes an accelerated-payment policy for small business contractors and, under stated conditions, prime contractors that subcontract with small businesses. The goal is generally 15 days after receipt of a proper invoice and required documentation. But the FAR expressly states that this acceleration creates no new rights under the Prompt Payment Act and does not change the Act’s late-payment interest rules.
          </p>
          <p>
            For a small-business subcontractor, the clause and prime-payment structure are still worth checking. Just do not treat the accelerated-payment policy as an automatic private collection remedy.
          </p>
          <p className="text-xs text-slate-500">
            Official source: <a href="https://www.acquisition.gov/far/32.009-1" className="text-[#1A3668] font-bold hover:underline">FAR 32.009-1, General accelerated-payment policy</a>.
          </p>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-[#1A3668] font-black uppercase tracking-wide text-xs">
              <Scale className="w-5 h-5 text-[#FF5F1F]" /> Four questions to separate
            </div>
            <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600">
              <li>When was the Government required to pay the prime?</li>
              <li>When is the prime required to pay you under the subcontract?</li>
              <li>Does a FAR construction, small-business, or other payment clause apply?</li>
              <li>Is there a separate bond, state-law, or dispute remedy with its own deadline?</li>
            </ol>
          </div>

          <p>
            If payment is already overdue, use our <a href="/blog/federal-subcontractor-not-paid-prime-contractor" className="text-[#FF5F1F] font-bold hover:underline">federal subcontractor nonpayment response guide</a>. If the job is federal construction, also review the <a href="/blog/miller-act-payment-bond-claims" className="text-[#FF5F1F] font-bold hover:underline">Miller Act payment bond deadlines</a>.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <h3 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Check the Actual Payment Language</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              SubPreCheck can organize the payment trigger, incorporated FAR language, notice deadlines, retainage, withholding terms, and missing documents for a more focused review.
            </p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              General educational information only. Whether a payment statute, clause, interest provision, or private remedy applies depends on the contract, project, tier, and governing law.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
