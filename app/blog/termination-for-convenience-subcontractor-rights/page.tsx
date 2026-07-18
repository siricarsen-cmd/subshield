"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Ban } from "lucide-react";

export default function TerminationConvenienceArticle() {
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
              Contract Termination Risk
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            The T4C Exit Trap: Knowing Your Rights When the Prime Contractor Pulls the Plug
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            Discover how to recover mobilization overhead, custom fabrication commitments, and earned profits when a project is cut short without warning.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Article Body */}
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            You are weeks into a major development. Your field crews are fully mobilized, your project management tracks are aligned, and you have already locked in thousands of dollars in custom manufacturer supply orders. Then, an email lands from the general contractor: <strong className="text-[#1A3668]">"Pursuant to Section 14 of our agreement, the Contractor hereby exercises its right to Terminate this Agreement for Convenience, effective immediately."</strong>
          </p>
          <p>
            Just like that, your project pipeline is wiped out. The GC tells your team to pack up their tools, submit an invoice for field hours recorded through yesterday, and exit the premises. 
          </p>
          <p>
            They want you to believe that a <strong className="text-[#1A3668]">Termination for Convenience (T4C)</strong> clause gives them a free pass to completely wipe their hands of your business relationship. But under standard federal acquisition principles, a T4C is not a license to strip you of your investments—it is a highly regulated cost-recovery framework.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> The Illusion of the Cost-Free Walkaway
          </h3>
          <p>
            General contractors use T4C boilerplate text as an operational safety valve. If the project owner loses funding, redesigns the master layout, or if the GC simply decides they want to self-perform your scope to pocket more margin, they pull this trigger.
          </p>
          <p>
            However, a prime contractor cannot use a convenience termination to create an unconscionable financial loss for your trade business. While they have the absolute right to halt future field performance, **they are legally required to make you whole for the expenses you incurred to support that project.**
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> What You Are Legally Entitled to Recover
          </h3>
          <p>
            When a prime contractor pulls the plug for convenience, your accounting track shifts from a progress-billing format to a comprehensive **termination settlement proposal**. You have a regulatory right to demand recovery for:
          </p>
          <ul className="list-disc pl-5 space-y-4 text-xs text-slate-600 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <li>
              <strong className="text-[#1A3668]">Mobilization & Preparation Overhead:</strong> The complete costs of trucking gear to the site, establishing field management structures, and performing pre-construction takeoffs.
            </li>
            <li>
              <strong className="text-[#1A3668]">Uncancelable Supply Commitments:</strong> If a factory has already custom-fabricated components or structural arrays that cannot be returned, the prime contractor must completely cover those vendor liabilities.
            </li>
            <li>
              <strong className="text-[#1A3668]">Earned Profit Margins:</strong> You are entitled to your full negotiated profit margin on every single hour of labor executed and every dollar of material deployed up to the exact split-second of termination.
            </li>
            <li>
              <strong className="text-[#1A3668]">Settlement Preparation Fees:</strong> The legal, accounting, and estimating costs required to build your settlement claim package can be billed directly back to the prime under FAR guidelines.
            </li>
          </ul>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">The Predatory "Zero-Recovery" Boilerplate</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Watch out for private-market boilerplate additions that state: *"In the event of a termination for convenience, the Subcontractor shall only be entitled to payment for work actually installed in place, and waives all claims for unabsorbed overhead, materials ordered but uninstalled, or closeout costs."* This is a predatory trap designed to bypass standard federal protections.
            </p>
          </div>

          {/* Strategic Internal SEO Cross-Link */}
          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 my-6 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">
              Related Field Intelligence
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Convenience clauses are routinely smuggled into agreements through sweeping, unregulated regulatory addendums. Master your defense by reading 
              <a href="/blog/understanding-far-flow-down-clauses" className="text-[#FF5F1F] font-black hover:underline inline-flex items-center gap-0.5 ml-1 uppercase tracking-wide text-[11px]">
                Deciphering FAR Flow-Down Clauses: What Subcontractors Must Accept vs. What to Delete →
              </a>
            </p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Defensive Pre-Sign Strategies
          </h3>
          <p>
            Arm your agreements before a project disruption occurs by embedding clear closeout guardrails:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Insert a Termination Fee Matrix:</strong> Negotiate a concrete, tier-based termination fee that triggers automatically if the plug is pulled, ensuring immediate cash-flow restoration without a protracted accounting battle.</li>
            <li><strong className="text-[#1A3668]">Enforce True Reciprocity:</strong> If the general contractor demands the right to terminate your company for convenience without cause, demand a reciprocal right to terminate your performance obligations if they delay payments or disrupt field progress for more than 30 consecutive days.</li>
          </ul>
        </div>

        {/* Strategic Call-to-Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <Ban className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">
              Armor Your Closeout Boundaries
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Don't sign a boilerplate agreement that allows a prime contractor to cancel your pipeline and abandon your factory material liabilities.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Drop your contract pack into the <strong className="text-[#1A3668]">SubShield AI Triage Engine</strong> to instantly scan for unfair termination waivers, flag unprotected supplier liabilities, and protect your company’s right to full settlement compensation.
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
