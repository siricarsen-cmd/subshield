"use client";

import React from "react";
import { ArrowLeft, BookOpenCheck, CheckCircle, FileText, ShieldAlert } from "lucide-react";

export default function TerminationConvenienceArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              href="/blog"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">
              Contract Termination Risk
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Termination for Convenience: What Subcontractors Should Review Before Signing
          </h1>

          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            Review termination rights, settlement procedures, supplier commitments, notice deadlines, and cost recovery before accepting a federal subcontract.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <article className="lg:col-span-2 space-y-7 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            A termination-for-convenience clause can allow a prime contractor to end some or all of a subcontract even when the subcontractor is not in default. The practical question is not simply whether the clause exists. It is what happens next: what work stops, what costs can be recovered, how supplier commitments are handled, what documentation is required, and how quickly a settlement proposal must be submitted.
          </p>

          <p>
            Federal prime contracts contain their own termination framework, but a subcontractor should not assume those prime-contract rights automatically become subcontract rights. The subcontract, incorporated documents, governing law, and any adapted FAR termination language control the relationship between the prime and subcontractor.
          </p>

          <section className="space-y-3">
            <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5 text-[#FF5F1F]" /> What FAR Part 49 Actually Says About Subcontractors
            </h2>

            <p>
              FAR 49.108-1 states that a subcontractor generally has no contractual rights against the Government merely because the prime contract is terminated. A subcontractor may instead have rights against the prime contractor or intermediate subcontractor with which it contracted.
            </p>

            <p>
              FAR 49.502(e) also recognizes that prime contractors may use adapted federal termination-for-convenience language in fixed-price subcontracts, provided the prime-sub relationship is made clear and inapplicable provisions and time periods are adjusted appropriately. That makes the actual subcontract language especially important.
            </p>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#596A7D]">
                Official FAR Sources
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="https://www.acquisition.gov/far/49.108-1"
                    className="text-[#1A3668] font-bold hover:text-[#FF5F1F] hover:underline"
                  >
                    FAR 49.108-1 — Subcontractor&apos;s rights
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.acquisition.gov/far/subpart-49.5"
                    className="text-[#1A3668] font-bold hover:text-[#FF5F1F] hover:underline"
                  >
                    FAR Subpart 49.5 — Contract termination clauses
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.acquisition.gov/far/52.249-2"
                    className="text-[#1A3668] font-bold hover:text-[#FF5F1F] hover:underline"
                  >
                    FAR 52.249-2 — Termination for Convenience of the Government (Fixed-Price)
                  </a>
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> Start With the Subcontract&apos;s Trigger and Scope
            </h2>

            <p>
              Read the termination clause together with the scope, order-of-precedence provision, flowdown exhibit, notice section, and payment terms. A broad convenience-termination right can have very different consequences depending on how the agreement defines the prime&apos;s payment obligation after termination.
            </p>

            <ul className="list-disc pl-5 space-y-2">
              <li>Can the prime terminate the entire subcontract, individual task orders, or only the portion affected by a Government termination?</li>
              <li>Does the clause require written notice, and when does the termination become effective?</li>
              <li>Must the subcontractor immediately stop work, cancel orders, protect property, or preserve records?</li>
              <li>Does the clause incorporate FAR 52.249-2 or another termination clause directly, by reference, or only in modified form?</li>
              <li>Are there separate termination rights elsewhere in the subcontract that could create a different result?</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF5F1F]" /> Check What the Clause Allows You to Recover
            </h2>

            <p>
              A subcontract may define its own settlement formula or borrow concepts from federal termination clauses. Before signing, identify which categories are expressly recoverable, which are excluded, and what documentation is required.
            </p>

            <ul className="list-disc pl-5 space-y-3 text-xs text-slate-600 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <li>
                <strong className="text-[#1A3668]">Completed work:</strong> Confirm how accepted work, work in process, and partially completed deliverables will be valued.
              </li>
              <li>
                <strong className="text-[#1A3668]">Supplier and purchase commitments:</strong> Review treatment of noncancelable orders, custom fabrication, cancellation charges, restocking fees, and material disposition.
              </li>
              <li>
                <strong className="text-[#1A3668]">Demobilization and closeout:</strong> Check whether field demobilization, shipment, storage, inventory, accounting, and other closeout costs can be included.
              </li>
              <li>
                <strong className="text-[#1A3668]">Overhead and profit:</strong> Determine whether the subcontract allows overhead or profit on performed work and whether anticipated profit on unperformed work is excluded.
              </li>
              <li>
                <strong className="text-[#1A3668]">Settlement preparation:</strong> Identify whether reasonable estimating, accounting, negotiation, or other settlement-preparation costs are covered.
              </li>
            </ul>

            <p>
              FAR 49.108 generally places responsibility for settling an immediate subcontractor&apos;s termination proposal on the contractor that issued that subcontract. Government involvement in a subcontract settlement can occur in limited circumstances, but direct settlement with a subcontractor is not the normal rule.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Deadlines and Documentation Can Matter as Much as the Formula
            </h2>

            <p>
              Even a favorable settlement clause can lose practical value if the subcontract imposes a short notice or submission deadline. FAR 49.502(e) specifically contemplates shorter subcontract settlement periods than the prime-contract clause, which is another reason not to rely on the prime contract alone.
            </p>

            <ul className="list-disc pl-5 space-y-2">
              <li>How many days do you have to submit a termination settlement proposal?</li>
              <li>Can the prime extend that deadline, and must the extension be in writing?</li>
              <li>What cost records, supplier invoices, schedules, inventory records, and cancellation evidence must support the proposal?</li>
              <li>Does a release or final payment waive unresolved termination costs?</li>
              <li>Is there a separate dispute deadline if the parties cannot agree on the settlement amount?</li>
            </ul>

            <p>
              Short deadlines should also be read alongside the subcontract&apos;s general notice clause. See our{" "}
              <a href="/blog/subcontract-notice-deadlines" className="text-[#FF5F1F] font-bold hover:underline">
                federal subcontract notice-deadlines guide
              </a>
              {" "}for the broader notice-risk framework.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> Terms Worth Clarifying Before You Commit
            </h2>

            <div className="bg-slate-100 border-l-4 border-[#1A3668] p-5 rounded-r-xl space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Pay particular attention to clauses that limit recovery to work physically installed or accepted while excluding committed materials, cancellation charges, demobilization, overhead, or settlement expenses. Those limitations may shift significant termination cost to the subcontractor.
              </p>
            </div>

            <p>
              Useful pre-sign questions include:
            </p>

            <ul className="list-disc pl-5 space-y-2">
              <li>What categories of cost are recoverable after a convenience termination?</li>
              <li>How are noncancelable supplier commitments and custom materials handled?</li>
              <li>What happens to Government, prime, or subcontractor-owned property in the subcontractor&apos;s possession?</li>
              <li>What settlement deadline applies, and who has authority to extend it?</li>
              <li>Does the clause require the subcontractor to continue any closeout, transition, or preservation work after termination?</li>
              <li>How does termination interact with retainage, final payment, releases, setoff, or pending change requests?</li>
              <li>What dispute process applies if the prime rejects part of the settlement proposal?</li>
            </ul>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h2 className="text-xs font-black text-[#1A3668] uppercase tracking-wide">
              Related SubPreCheck Guides
            </h2>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/blog/termination-for-default-cure-notice" className="text-[#FF5F1F] font-bold hover:underline">
                  Termination for Default and Cure Notices
                </a>
              </li>
              <li>
                <a href="/blog/order-of-precedence-subcontract-documents" className="text-[#FF5F1F] font-bold hover:underline">
                  Order of Precedence in Federal Subcontracts
                </a>
              </li>
              <li>
                <a href="/blog/understanding-far-flow-down-clauses" className="text-[#FF5F1F] font-bold hover:underline">
                  Understanding FAR Flow-Down Clauses
                </a>
              </li>
              <li>
                <a href="/blog/federal-subcontract-agreement-checklist" className="text-[#FF5F1F] font-bold hover:underline">
                  Federal Subcontract Agreement Checklist
                </a>
              </li>
            </ul>
          </section>

          <div className="bg-[#1A3668]/5 border border-[#1A3668]/15 rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#596A7D]">
              Explore the full topic
            </p>
            <a
              href="/blog/federal-subcontract-liability-termination-disputes-hub"
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-black text-[#1A3668] hover:text-[#FF5F1F] hover:underline transition"
            >
              Liability, Termination &amp; Disputes Hub
            </a>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-200 pt-5">
            General educational information only. Federal subcontract rights and obligations depend on the actual solicitation, prime contract, subcontract, incorporated documents, governing law, and current regulations. SubPreCheck is not a law firm and does not provide legal advice.
          </p>
        </article>

        <aside className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-24">
            <h3 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">
              See What a Structured First Pass Looks Like
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              See how SubPreCheck organizes termination language, missing documents, deadlines, cost exposure, and follow-up questions before final legal review.
            </p>
            <a
              href="/sample-report"
              className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm"
            >
              View Sample Report
            </a>
            <a
              href="/pricing"
              className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition"
            >
              See Review Plans
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
