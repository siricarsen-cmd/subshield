"use client";

import React from "react";
import { ArrowLeft, CheckCircle, FileSearch, Scale } from "lucide-react";

export default function FederalSubcontractAgreementChecklistArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition">
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">
              Pre-Award Review
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Federal Subcontract Agreement Checklist: What to Review Before Signing
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            A practical checklist for reviewing payment, scope, flowdowns, changes, liability, termination, compliance, and missing documents before you commit.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            A federal subcontract can look straightforward and still contain obligations that are easy to miss. The risk is usually not one dramatic clause. It is the combination of payment terms, incorporated documents, federal flowdowns, notice deadlines, scope language, and prime-drafted commercial terms.
          </p>
          <p>
            This checklist is meant for the period before you sign, price the work, or commit key resources. It is not a substitute for legal advice. It is a way to organize the questions that deserve an answer before the agreement becomes binding.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">1. Confirm the exact scope and workshare</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Is the statement of work attached and complete?</li>
            <li>Are deliverables, quantities, milestones, acceptance standards, and exclusions clear?</li>
            <li>If this began as a teaming arrangement, does the subcontract match the workshare discussed before award?</li>
            <li>Does the agreement allow the prime to reduce, reassign, or add work without a defined process?</li>
          </ul>
          <p>
            If the scope is still vague, read our guide to <a href="/blog/teaming-agreement-vague-scope-liabilities" className="text-[#FF5F1F] font-bold hover:underline">teaming agreement workshare and pre-award scope</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">2. Read the payment language, not just the payment schedule</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>What triggers the prime's obligation to pay?</li>
            <li>Does the contract use pay-when-paid, pay-if-paid, condition-precedent, retainage, setoff, or backcharge language?</li>
            <li>Is there a clear outside payment date?</li>
            <li>What notice must the prime give before withholding money?</li>
          </ul>
          <p>
            See our existing guide to <a href="/blog/government-contracting-payment-traps" className="text-[#FF5F1F] font-bold hover:underline">pay-when-paid and pay-if-paid terms</a> for a deeper review of contingent payment language.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">3. Identify every document incorporated by reference</h2>
          <p>
            Do not review only the signed subcontract form. Check for references to the prime contract, solicitation, statement of work, specifications, drawings, wage determinations, cybersecurity attachments, quality requirements, flowdown exhibits, proposal instructions, and later-issued policies.
          </p>
          <p>
            If an incorporated document was not provided, ask for it before signing. Our guide on <a href="/blog/incorporation-by-reference-ambush" className="text-[#FF5F1F] font-bold hover:underline">incorporation by reference</a> explains why the missing attachment matters.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">4. Separate federal flowdowns from prime-drafted terms</h2>
          <p>
            A prime may have legitimate reasons to include FAR or DFARS clauses, but there is no single universal list that applies to every subcontract. Applicability can depend on the clause text, subcontract type, dollar value, scope, agency, information handled, and whether the subcontract is for commercial products or commercial services.
          </p>
          <p>
            Start with our <a href="/blog/understanding-far-flow-down-clauses" className="text-[#FF5F1F] font-bold hover:underline">FAR flowdown guide</a>, then compare any clause list against the actual prime contract and your scope.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">5. Check change authority and notice deadlines</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Who can direct a change?</li>
            <li>Must notice be given within a fixed number of days?</li>
            <li>Can late notice waive time or money?</li>
            <li>Does the subcontract require you to continue performance while a dispute is unresolved?</li>
            <li>Do change orders contain broad release language?</li>
          </ul>
          <p>
            Related guides: <a href="/blog/unauthorized-change-orders-pm-vs-co" className="text-[#FF5F1F] font-bold hover:underline">unauthorized change directions</a> and <a href="/blog/change-order-release-trap" className="text-[#FF5F1F] font-bold hover:underline">change order releases</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">6. Review termination and default language</h2>
          <p>
            Confirm the difference between termination for convenience and termination for default. Look for cure periods, immediate-termination rights, supplier commitments, demobilization costs, settlement deadlines, and any limits on what you can recover after a convenience termination.
          </p>
          <p>
            Our <a href="/blog/termination-for-convenience-subcontractor-rights" className="text-[#FF5F1F] font-bold hover:underline">termination for convenience guide</a> covers the main pre-signing questions.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">7. Check liability, indemnity, insurance, and delay risk</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Does indemnity extend beyond your own acts or scope?</li>
            <li>Is there a separate duty to defend?</li>
            <li>Do required insurance limits match your actual coverage?</li>
            <li>Can the prime pass through owner liquidated damages or delay costs without proving your responsibility?</li>
          </ul>
          <p>
            See <a href="/blog/broad-form-indemnification-subcontractor-vulnerabilities" className="text-[#FF5F1F] font-bold hover:underline">broad indemnification</a> and <a href="/blog/fighting-liquidated-damages-delay-claims" className="text-[#FF5F1F] font-bold hover:underline">liquidated damages and delay terms</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">8. Identify labor, sourcing, cyber, audit, and data requirements</h2>
          <p>
            Federal work can bring requirements that are not part of a normal commercial subcontract. Depending on the project, review wage determinations, certified payroll, Buy American requirements, cybersecurity and CMMC obligations, audit and records clauses, certified cost or pricing data, technical data rights, and software rights.
          </p>
          <p>
            The key is applicability. Do not assume every federal requirement applies, and do not assume it does not apply because the prime has not explained it clearly.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3">9. Check dispute resolution and order of precedence</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Where must disputes be brought?</li>
            <li>Is arbitration mandatory?</li>
            <li>Which state's law governs?</li>
            <li>If the subcontract conflicts with the prime contract, specifications, or exhibits, which document controls?</li>
          </ul>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-[#1A3668] font-black uppercase tracking-wide text-xs">
              <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Final pre-signing question
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Can you explain the payment trigger, scope, incorporated documents, federal flowdowns, change process, termination rights, major liability terms, and compliance obligations without guessing? If not, the package still has unresolved questions.
            </p>
          </div>

          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 rounded-r-xl">
            <p className="text-xs text-slate-600 leading-relaxed">
              For the next step, read <a href="/blog/missing-prime-contract-documents" className="text-[#FF5F1F] font-black hover:underline">Missing Prime Contract Documents: What to Request Before Signing</a>.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block"><FileSearch className="w-6 h-6" /></div>
            <h3 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">See What a Review Looks Like</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              The SubPreCheck sample report shows how contract language, missing documents, risk questions, and attorney-preparation items are organized in one place.
            </p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#1A3668]"><Scale className="w-4 h-4 text-[#FF5F1F]" /> Important</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">This article is general educational information, not legal advice. Contract rights and clause applicability depend on the actual agreement and governing law.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
