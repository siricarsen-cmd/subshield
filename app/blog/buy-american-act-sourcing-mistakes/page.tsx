"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Building2 } from "lucide-react";

export default function BuyAmericanActArticle() {
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
              Federal Procurement Risk
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            The BAA Procurement Blindspot: Why Your Submittal Packages Are Gating Your Cash Flow
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            How a misunderstanding of the Buy American Act domestic content test forces trade subcontractors to eat thousands in replacement costs.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Article Body */}
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            For trade subcontractors operating in the federal arena, few phrases carry as much hidden financial risk as <strong className="text-[#1A3668]">"All materials must comply with the Buy American Act (BAA)."</strong> It sounds like a standard compliance box to check. You assume your regular, reputable distributors have it handled. 
          </p>
          <p>
            Then your submittal package hits the government contracting officer's desk, and the entire project grinds to a screeching halt. 
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> The Danger of the Domestic Content Test
          </h3>
          <p>
            The biggest mistake subcontractors make is assuming that if a product is assembled or bought from a supplier inside the United States, it automatically complies with the BAA. It doesn't.
          </p>
          <p>
            The Buy American Act requires a strict **two-part domestic content test** for construction materials:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <li>The item must be manufactured or physically altered in the United States.</li>
            <li>
              The cost of components mined, produced, or manufactured in the U.S. must exceed a specific threshold of the total cost of all components. 
            </li>
          </ol>
          <p>
            If you are installing complex electrical packages, emergency life safety systems, or specialized material assemblies, many of the internal components or drivers are sourced overseas. Even if the metal housing is bent and screwed together locally, if the cost of those foreign components exceeds the permitted regulatory threshold of the total build cost, the product is illegal for use on that federal site.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> The Supplier Certification Shell Game
          </h3>
          <p>
            Subcontractors routinely get crushed because of a disconnect on bid day. A manufacturer's rep or supplier will verbally assure an estimator that a package is "compliant." 
          </p>
          <p>
            But verbal promises don't satisfy a federal audit. When the general contractor demands a formal, written **Manufacturer's BAA Certification Letter**, the supplier frequently stalls, backpedals, or provides a useless marketing flyer that fails to explicitly state legal compliance with federal acquisition guidelines.
          </p>
          <p>
            By the time this paperwork failure is uncovered, you have already signed a subcontract binding you to the project schedule. If your materials are rejected, you are legally obligated to source a compliant alternative—often at a steep premium—entirely out of your own pocket.
          </p>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">The Flow-Down Liability Reality</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standard general contractor boilerplates include aggressive flow-down clauses. If a non-compliant material causes an inspection failure, the GC can hold up your entire monthly progress payment, withhold your retention, and back-charge you for liquidated damages resulting from the delay.
            </p>
          </div>

          {/* Strategic Internal SEO Cross-Link */}
          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 my-6 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">
              Related Field Intelligence
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Sourcing non-compliant materials or miscalculating component cost data doesn't just stall submittals—it can flag your business for severe post-award accounting investigations. Read our regulatory guide on
              <a href="/blog/defective-pricing-tina-liability" className="text-[#FF5F1F] font-black hover:underline inline-flex items-center gap-0.5 ml-1 uppercase tracking-wide text-[11px]">
                Navigating Defective Pricing Risks: Protecting Your Business from TINA Disclosure Liability →
              </a>
            </p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> How to Protect Your Profit Boundaries
          </h3>
          <p>
            You cannot afford to trust a supplier's word when your corporate cash flow is on the line. Protect your business with three operational rules:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Demand Certifications on Bid Day:</strong> Never accept a quote for a federal project without an accompanying, signed BAA certification document from the actual manufacturer.</li>
            <li><strong className="text-[#1A3668]">Insert Supplier Indemnity Print:</strong> Modify your supplier purchase orders to explicitly state that the vendor is fully liable for any financial damages, replacements, or delays if their supplied materials fail a federal BAA audit.</li>
            <li><strong className="text-[#1A3668]">Audit the Master Agreement:</strong> Before signing the GC's contract, look for hidden material compliance requirements or severe material rejection penalties.</li>
          </ul>
        </div>

        {/* Strategic Call-to-Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">
              Stop Guessing on Federal Flow-Downs
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Don't sign a predatory boilerplate contract that passes absolute BAA liability onto your trade business. 
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Drop your agreement into the <strong className="text-[#1A3668]">SubShield AI Triage Engine</strong> to instantly identify hidden liability flags, isolate unfair material risk shifts, and receive an instant email talk-track to push back on the general contractor before placing a final document on your attorney's desk.
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
