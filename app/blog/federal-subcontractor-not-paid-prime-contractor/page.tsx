"use client";

import React from "react";
import { ArrowLeft, FileSearch, Landmark, ShieldCheck, WalletCards } from "lucide-react";

export default function FederalSubcontractorNotPaidArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition">
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">
              Payment &amp; Collections
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Federal Subcontractor Not Paid by the Prime: What to Check Next
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            A practical way to organize a federal subcontract nonpayment problem before deciding what to escalate and what to send to counsel.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            When a prime contractor does not pay, the first question is not simply, “How late are they?” The useful questions are what the subcontract says, what triggered payment, what the prime has said in writing, whether the work was accepted, and whether a federal payment rule or bond remedy applies to this particular job.
          </p>
          <p>
            The fastest way to lose leverage is to argue from memory. Build the record first.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <WalletCards className="w-5 h-5 text-[#FF5F1F]" /> 1. Identify the payment trigger
          </h2>
          <p>Pull the signed subcontract, amendments, invoice requirements, and any incorporated payment terms. Then answer:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Was the invoice complete and submitted through the required system?</li>
            <li>Has the prime accepted the work or identified a specific deficiency?</li>
            <li>Does the subcontract say payment is due on a fixed schedule, after prime receipt from the Government, or only after another event?</li>
            <li>Is retainage, setoff, backcharge, or disputed-work language being used?</li>
            <li>Did the prime send the notice required before withholding or reducing payment?</li>
          </ul>
          <p>
            If the agreement contains contingent-payment language, compare it with our guide to <a href="/blog/government-contracting-payment-traps" className="text-[#FF5F1F] font-bold hover:underline">pay-when-paid and pay-if-paid terms</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-[#FF5F1F]" /> 2. Build a payment chronology
          </h2>
          <p>A clean chronology is more useful than a long complaint. Keep it to dates and documents:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Work performed and major acceptance dates.</li>
            <li>Invoice number, amount, date submitted, and proof of submission.</li>
            <li>Prime acknowledgments, rejection notices, or requests for correction.</li>
            <li>Any statement that the Government has or has not paid the prime.</li>
            <li>Partial payments, retainage, offsets, backcharges, and remaining balance.</li>
            <li>Every contractual notice deadline that could affect a claim or dispute.</li>
          </ul>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#FF5F1F]" /> 3. Understand what the contracting officer can—and cannot—do
          </h2>
          <p>
            FAR 32.112-1 gives federal contracting officers a role when a subcontractor or supplier asserts nonpayment. Depending on the contract, the contracting officer may examine whether the prime complied with subcontract payment terms or whether a payment certification was accurate. If noncompliance is found, the contracting officer may encourage timely payment and, when an applicable clause permits it, reduce or suspend progress payments to the prime.
          </p>
          <p>
            That does not turn the contracting officer into the subcontractor’s collection lawyer, and it does not erase the subcontract’s dispute procedures. It does mean a documented nonpayment issue may have a federal contract-administration channel in addition to the private contract dispute.
          </p>
          <p className="text-xs text-slate-500">
            Official source: <a href="https://www.acquisition.gov/far/32.112-1" className="text-[#1A3668] font-bold hover:underline">FAR 32.112-1, Subcontractor assertions of nonpayment</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">4. Check whether construction-specific protections apply</h2>
          <p>
            Federal construction work can add two important layers. FAR 52.232-27 contains subcontract prompt-payment requirements for covered construction contracts, including payment and interest provisions. Separately, the Miller Act can provide payment-bond rights on qualifying federal public construction work.
          </p>
          <p>
            Those are different mechanisms with different requirements. If this is federal construction, review our <a href="/blog/miller-act-payment-bond-claims" className="text-[#FF5F1F] font-bold hover:underline">Miller Act payment bond deadline guide</a> and do not assume the deadlines track your subcontract’s ordinary dispute timetable.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">5. Do not assume accelerated federal payment guarantees your payment</h2>
          <p>
            FAR 32.009-1 includes a federal policy of accelerated payment for small businesses and for primes that subcontract with small businesses under stated conditions. The same FAR section expressly says that acceleration does not create new rights under the Prompt Payment Act. Treat it as a payment-policy provision to check—not a substitute for reading the subcontract and the clauses actually incorporated into it.
          </p>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-[#1A3668] font-black uppercase tracking-wide text-xs">
              <ShieldCheck className="w-5 h-5 text-[#FF5F1F]" /> Useful attorney handoff
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Give counsel the signed subcontract, incorporated payment provisions, invoice package, payment chronology, acceptance evidence, withholding notices, prime correspondence, and any bond information. That is usually more useful than sending an inbox full of unsorted emails.
            </p>
          </div>

          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 rounded-r-xl">
            <p className="text-xs text-slate-600 leading-relaxed">
              Next question: <a href="/blog/prompt-payment-act-federal-subcontractors" className="text-[#FF5F1F] font-black hover:underline">Does the Prompt Payment Act protect federal subcontractors?</a>
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <FileSearch className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Organize the Payment Issue</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              SubPreCheck can surface payment language, notice deadlines, incorporated terms, missing documents, and related risk points so the issue is easier to discuss with the prime and qualified counsel.
            </p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              General educational information only. Payment remedies, deadlines, bond rights, and dispute procedures depend on the actual contract, project, tier, and governing law.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
