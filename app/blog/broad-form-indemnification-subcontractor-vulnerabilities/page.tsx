"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, ShieldX } from "lucide-react";

export default function BroadIndemnificationArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition"><ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub</a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">Liability & Insurance</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">Broad Indemnification: How Risk Can Shift to the Subcontractor</h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">Review indemnity, duty-to-defend, negligence, insurance, liability caps, and governing-law language before accepting exposure outside your own scope.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>Indemnity clauses allocate responsibility for certain claims, losses, damages, and defense costs between the prime and subcontractor. The practical risk is not simply whether an indemnity clause exists, but how far it extends beyond losses caused by the subcontractor's own work or conduct.</p>
          <p>Read indemnity together with insurance, limitation-of-liability, warranty, consequential-damages, venue, and governing-law provisions. A negotiated liability cap can provide less protection than expected if indemnity or defense obligations are carved out of it.</p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> Read the Trigger and the Scope</h3>
          <p>Broad language may require the subcontractor to defend, indemnify, or hold harmless the prime for claims “arising out of” the work even when responsibility is shared. Other clauses may expressly address the prime's negligence or impose obligations before fault has been finally determined.</p>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl font-mono text-xs text-slate-600 leading-relaxed">Example only: “Subcontractor shall defend, indemnify, and hold harmless Contractor from claims arising out of Subcontractor's work, including claims caused in part by Subcontractor's acts or omissions.”</div>
          <p>Actual enforceability and interpretation depend on the language and governing law. Construction anti-indemnity statutes in particular vary by state, and duty-to-defend rules may not track indemnity rules exactly.</p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#FF5F1F]" /> Compare the Contract With the Insurance</h3>
          <p>Contractual liability coverage, additional-insured status, exclusions, insured-contract provisions, policy limits, and state law can affect whether a particular indemnity or defense obligation is insured.</p>
          <p>Insurance requirements also do not automatically cap contractual liability. A subcontract can require a particular policy limit while imposing broader contractual exposure outside that amount. Have the broker compare the proposed language with the actual policy and endorsements.</p>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">Governing Law Matters</h4>
            <p className="text-xs text-slate-600 leading-relaxed">Many states regulate construction indemnity, but the details differ. Choice-of-law and venue clauses can therefore materially affect the analysis. Counsel should review the indemnity and defense language under the law likely to govern the subcontract.</p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Questions to Resolve Before Signing</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>What event triggers indemnity, and whose acts or omissions must cause the loss?</li>
            <li>Is the duty to defend separate from the duty to indemnify, and when does it begin?</li>
            <li>Does the clause apply to first-party claims as well as third-party claims?</li>
            <li>Are IP, cyber, environmental, employment, or other specialized claims treated separately?</li>
            <li>Does the subcontract's liability cap apply to indemnity and defense costs?</li>
            <li>Do the required insurance policies and endorsements respond to the contractual obligation?</li>
          </ul>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-[#1A3668] uppercase tracking-wide">Explore the Liability & Disputes Cluster</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="/blog/federal-subcontract-liability-termination-disputes-hub" className="text-[#1A3668] font-black hover:text-[#FF5F1F] hover:underline">Federal Subcontract Liability, Insurance, Termination & Disputes Hub</a></li>
              <li><a href="/blog/limitation-of-liability-services-federal-subcontract" className="text-[#FF5F1F] font-bold hover:underline">Limitation of Liability in Federal Service Subcontracts</a></li>
              <li><a href="/blog/insurance-requirements-government-installation-subcontracts" className="text-[#FF5F1F] font-bold hover:underline">Insurance Requirements on Government Installations</a></li>
              <li><a href="/blog/dispute-venue-arbitration-federal-subcontracts" className="text-[#FF5F1F] font-bold hover:underline">Dispute, Venue, and Arbitration Clauses</a></li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block"><ShieldX className="w-6 h-6" /></div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Review Before You Commit</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium"><strong className="text-[#1A3668]">SubPreCheck</strong> can surface indemnity, defense, liability-cap, insurance, and governing-law terms so the exposure can be discussed with counsel and the broker before signature.</p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
        </div>
      </div>
    </div>
  );
}
