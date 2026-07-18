"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, ShieldX } from "lucide-react";

export default function BroadIndemnificationArticle() {
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
              Liability & Risk Defense
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            The Danger of Broad Indemnification: Stop Insuring the Prime Contractor's Mistakes
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            How signing a standard, one-sided indemnity clause forces your trade company to pay for damages caused entirely by the general contractor’s negligence.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Article Body */}
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            When executing a commercial contract, you expect to be held accountable for your own work. If your field crews damage a structure or cause an operational disruption, your company should step up, fix the error, and leverage your insurance policies to make the project whole. That is standard, fair business.
          </p>
          <p>
            But under a <strong className="text-[#1A3668]">Broad-Form Indemnification Clause</strong>, general contractors completely tear up this standard framework of fairness. 
          </p>
          <p>
            They embed aggressive boilerplate lines that force you to take on absolute financial liability for any accidents, injuries, or property damage on the job site—even if the incident was caused 100% by the general contractor’s own negligence or poor management.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> The Anatomy of a Broad-Form Clause
          </h3>
          <p>
            Primes rely on trade contractors scanning over the indemnity text too quickly. A typical broad-form trap looks like this:
          </p>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl font-mono text-xs text-slate-600 leading-relaxed">
            "Subcontractor shall defend, indemnify, and hold harmless the Contractor from any and all claims, losses, or liabilities arising out of the project, **regardless of whether caused in part or in whole by the negligence of the Contractor.**"
          </div>
          <p>
            Look closely at that bolded fine print. By signing that line, you are no longer just a trade specialist; you are now acting as an uncompensated insurance carrier for the prime contractor. 
          </p>
          <p>
            If a GC's supervisor makes a critical scaffolding error or structural miscalculation that leads to an injury claim, their legal team will immediately invoke this clause. They will force *your* business to pay for their defense attorneys, their corporate settlement costs, and their judicial judgments.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> The Uninsured Risk Exposure
          </h3>
          <p>
            The absolute scariest part of a broad-form indemnity clause is that **your standard Commercial General Liability (CGL) insurance policy will routinely refuse to cover the loss.**
          </p>
          <p>
            Insurance policies are explicitly designed to cover *your* corporate liability and negligent actions. Most standard policy frameworks contain strict exclusions for "contractually assumed liabilities" where you agree to insure a third party's sole negligence. 
          </p>
          <p>
            If the prime demands a multi-million dollar settlement under a broad-form clause, your insurance company can completely deny the claim. That leaves your company's cash reserves, equipment assets, and corporate survival completely exposed to a massive out-of-pocket legal judgment.
          </p>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">The Anti-Indemnity Statute Shield</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Because these clauses are so fundamentally predatory, over 40 states have enacted strict **Anti-Indemnity Statutes** that legally ban broad-form clauses in construction environments. However, GCs routinely try to bypass these state protections by inserting special "Choice of Law" clauses, forcing your agreement to be interpreted under the rules of a different state where broad-form traps are still permitted.
            </p>
          </div>

          {/* Strategic Internal SEO Cross-Link */}
          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 my-6 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">
              Related Field Intelligence
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Assuming a prime's third-party field liabilities can open your business up to massive out-of-pocket judgments that insurance companies exclude. Read our structural strategy on
              <a href="/blog/protecting-small-subcontractor-margins" className="text-[#FF5F1F] font-black hover:underline inline-flex items-center gap-0.5 ml-1 uppercase tracking-wide text-[11px]">
                Protecting Small Subcontractor Margins: Contractual Shields for Trade Cash Flows →
              </a>
            </p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Rewriting the Boundary Rules
          </h3>
          <p>
            Never risk your company's financial future by signing away your liability boundaries. Protect your assets with two non-negotiable revisions:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Insist on Comparative/Proportionate Fault:</strong> Line through any phrase that holds you liable for the GC's negligence. Demand that the clause limit your indemnity obligations strictly: *"but only to the extent caused by the negligent acts or omissions of the Subcontractor."*</li>
            <li><strong className="text-[#1A3668]">Strike the Duty to Defend Upfront:</strong> Delete any language requiring you to pay for the GC's legal defense fees before a court has actually determined who was at fault for the accident.</li>
          </ul>
        </div>

        {/* Strategic Call-to-Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <ShieldX className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">
              Erase Unfair Indemnity Risks
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Don't let general contractors force your business to hold them harmless for their own structural or safety blunders.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Drop your boilerplate agreement into the <strong className="text-[#1A3668]">SubShield AI Liability Engine</strong> to instantly pinpoint predatory indemnity triggers, isolate hidden choice-of-law traps, and secure your financial boundaries before signing.
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
