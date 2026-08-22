"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Gavel } from "lucide-react";

export default function ReaScopeCreepArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition"><ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub</a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">FAR Adjustments & Claims</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">Requests for Equitable Adjustment: Notice and Documentation Basics for Subcontractors</h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">Review change authority, notice, documentation, pass-through, and pricing requirements before extra work becomes a disputed cost.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>Extra work often begins before the parties agree on price. A field direction, revised interpretation, access problem, schedule impact, differing condition, or Government-caused change can increase cost while the subcontractor is still expected to perform.</p>
          <p>For a federal subcontractor, recovery usually depends first on the subcontract: who can direct a change, when written notice is due, what records must be kept, whether the prime will sponsor an upstream request, and how settlement or payment is handled.</p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> REA vs. Formal Claim</h3>
          <p>A request for equitable adjustment can seek a change to price, schedule, or other contract terms after changed performance. A formal claim under the federal disputes framework has a different procedural posture and can require certification when the amount exceeds the applicable threshold.</p>
          <p>For a detailed comparison, see <a href="/blog/rea-vs-claim-federal-subcontractors" className="text-[#FF5F1F] font-bold hover:underline">REA vs. Claim for Federal Subcontractors</a>.</p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#FF5F1F]" /> Build the Record Around Three Questions</h3>
          <ul className="list-disc pl-5 space-y-4 text-xs text-slate-600 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <li><strong className="text-[#1A3668]">Entitlement:</strong> What contract term, direction, condition, delay, or change supports the requested adjustment?</li>
            <li><strong className="text-[#1A3668]">Causation:</strong> How did that event affect specific labor, material, equipment, schedule, productivity, or other performance?</li>
            <li><strong className="text-[#1A3668]">Quantum:</strong> What contemporaneous records support the amount of the requested price or time adjustment?</li>
          </ul>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">Notice Comes Before the Perfect Pricing Package</h4>
            <p className="text-xs text-slate-600 leading-relaxed">Subcontracts can impose short written-notice periods for changes, delays, or differing conditions. A subcontractor should not delay the initial notice while waiting for every cost impact to be known. Follow the actual subcontract procedure and supplement the record as facts develop.</p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Practical Administration Steps</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Identify the people authorized to direct changed work.</li>
            <li>Send written notice to the contractually required recipient when a potential change occurs.</li>
            <li>Separate changed-work cost from base-scope cost as early as possible.</li>
            <li>Preserve schedule updates, daily reports, invoices, correspondence, and field records.</li>
            <li>Review pass-through and sponsorship provisions before assuming the prime will present the matter to the Government.</li>
            <li>Read modification and payment releases before signing away unresolved adjustment rights.</li>
          </ul>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-[#1A3668] uppercase tracking-wide">Explore the Changes & Claims Cluster</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="/blog/federal-subcontract-changes-claims-hub" className="text-[#1A3668] font-black hover:text-[#FF5F1F] hover:underline">Federal Subcontract Changes, REAs & Claims Hub</a></li>
              <li><a href="/blog/constructive-changes-federal-subcontracts" className="text-[#FF5F1F] font-bold hover:underline">Constructive Changes in Federal Subcontracts</a></li>
              <li><a href="/blog/change-order-accounting-federal-subcontract" className="text-[#FF5F1F] font-bold hover:underline">Change Order Accounting</a></li>
              <li><a href="/blog/subcontractor-pass-through-claims" className="text-[#FF5F1F] font-bold hover:underline">Subcontractor Pass-Through Claims</a></li>
              <li><a href="/blog/subcontract-notice-deadlines" className="text-[#FF5F1F] font-bold hover:underline">Federal Subcontract Notice Deadlines</a></li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block"><Gavel className="w-6 h-6" /></div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Review Before You Commit</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium"><strong className="text-[#1A3668]">SubPreCheck</strong> can surface change authority, notice deadlines, documentation requirements, pass-through language, and release terms before they become claim problems.</p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
        </div>
      </div>
    </div>
  );
}
