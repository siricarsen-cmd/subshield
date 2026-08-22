"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Building2 } from "lucide-react";

export default function BuyAmericanActArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition"><ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub</a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">Sourcing & Domestic Preference</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">Buy American Act Sourcing: Domestic Content and Documentation Risks</h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">Identify the exact domestic-preference clause, item, sourcing test, evidence, exceptions, and substitution process before making a federal material commitment.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>A federal subcontract may require domestic products or construction materials, but a generic instruction to “comply with Buy American” is not enough to price or certify sourcing responsibly. The applicable rule depends on the acquisition, incorporated FAR or DFARS clause, type of item, exceptions, and any trade-agreement treatment.</p>
          <p>The practical first step is to identify the exact clause and the item-level sourcing promise before asking a manufacturer or distributor for supporting evidence.</p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> Do Not Treat “Made in the USA” as the Contract Test</h3>
          <p>Commercial marketing language, distributor location, final assembly, and the federal contract's domestic-content test are not automatically the same thing. FAR Part 25 contains the current Buy American framework and definitions for supplies and construction materials.</p>
          <p>For manufactured end products under the current FAR supply test, the domestic component-cost threshold is 65 percent for items delivered in 2024 through 2028, subject to the rule's definitions and exceptions. Do not apply that percentage blindly to every construction material, COTS item, DoD acquisition, or trade-agreement purchase.</p>
          <p className="text-xs text-slate-500">Official source: <a href="https://www.acquisition.gov/far/25.101" className="text-[#1A3668] font-bold hover:underline">FAR 25.101 — General Buy American rules</a>.</p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#FF5F1F]" /> Match Supplier Evidence to the Clause</h3>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <li>Identify the exact part number, manufacturer, and product being supplied.</li>
            <li>Confirm the contract clause and sourcing regime the prime expects the item to satisfy.</li>
            <li>Ask for written manufacturer or supplier evidence that answers that specific requirement.</li>
            <li>Preserve the evidence used at bid and award in case the source changes during performance.</li>
            <li>Require written approval before substituting a product with different sourcing characteristics.</li>
          </ul>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#FF5F1F]" /> Buy American and Trade Agreements Are Different Questions</h3>
          <p>A TAA-covered acquisition can use U.S.-made or designated-country end-product rules and substantial-transformation concepts that are different from the Buy American domestic-content analysis. The presence of foreign components does not by itself answer a TAA question, and a designated-country certification does not automatically answer a Buy American question.</p>
          <p>See <a href="/blog/trade-agreements-act-vs-buy-american-act" className="text-[#FF5F1F] font-bold hover:underline">Trade Agreements Act vs. Buy American Act</a> and <a href="/blog/trade-agreements-act-designated-country-sourcing" className="text-[#FF5F1F] font-bold hover:underline">Trade Agreements Act Designated-Country Sourcing</a>.</p>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">Treat a Sourcing Change as a Contract Event</h4>
            <p className="text-xs text-slate-600 leading-relaxed">If a compliant source becomes unavailable after award, document the change immediately. Review the subcontract's substitution, notice, approval, schedule, and equitable-adjustment procedures before ordering an alternate product.</p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Pre-Award Sourcing Checklist</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Identify every FAR, DFARS, agency, or prime sourcing requirement incorporated into the package.</li>
            <li>Determine which deliverables or construction materials each requirement actually covers.</li>
            <li>Obtain item-level supplier evidence before relying on the source in your final price.</li>
            <li>Check whether the prime adds its own certification form or approved-source requirement.</li>
            <li>Resolve who bears added cost or delay if the required source becomes unavailable or is rejected.</li>
          </ul>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-[#1A3668] uppercase tracking-wide">Explore the Supply Chain & Sourcing Cluster</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="/blog/federal-subcontract-supply-quality-sourcing-hub" className="text-[#1A3668] font-black hover:text-[#FF5F1F] hover:underline">Federal Subcontract Supply Chain, Quality & Sourcing Hub</a></li>
              <li><a href="/blog/trade-agreements-act-vs-buy-american-act" className="text-[#FF5F1F] font-bold hover:underline">Trade Agreements Act vs. Buy American Act</a></li>
              <li><a href="/blog/trade-agreements-act-designated-country-sourcing" className="text-[#FF5F1F] font-bold hover:underline">TAA Designated-Country Sourcing</a></li>
              <li><a href="/blog/counterfeit-electronic-parts-dfars-subcontractors" className="text-[#FF5F1F] font-bold hover:underline">Counterfeit Electronic Parts and DFARS</a></li>
              <li><a href="/blog/federal-subcontract-inspection-acceptance" className="text-[#FF5F1F] font-bold hover:underline">Inspection and Acceptance in Federal Subcontracts</a></li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block"><Building2 className="w-6 h-6" /></div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Review Before You Commit</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium"><strong className="text-[#1A3668]">SubPreCheck</strong> can surface sourcing clauses, certifications, missing specifications, substitution procedures, and conflicting requirements before the purchase commitment is made.</p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
        </div>
      </div>
    </div>
  );
}
