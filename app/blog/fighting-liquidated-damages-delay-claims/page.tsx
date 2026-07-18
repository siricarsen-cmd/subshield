"use client";

import React from "react";
import { ShieldAlert, FileText, CheckCircle, ArrowLeft, Clock } from "lucide-react";

export default function LiquidatedDamagesArticle() {
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
              Delay & Damage Defense
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Fighting Back Against Liquidated Damages: Defending Your Ledger from Unfair Delay Claims
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            How general contractors weaponize milestone schedules to back-charge trade partners for cascading delays caused by other crews.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Article Body */}
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            On a complex, multi-trade commercial job site, the project schedule is a living organism. If the framing crew falls behind, the mechanical rough-in stalls. If the mechanical trades block a corridor, your installation crews are locked out of their designated workspace. Delays ripple across the project structure daily.
          </p>
          <p>
            But when a project misses its master completion date, general contractors rarely pause to conduct a fair assessment of who actually disrupted the schedule. Instead, they face severe per-day penalties from the owner, and they move instantly to protect their own fee.
          </p>
          <p>
            The GC’s project management team will scan the daily logs, isolate a week where your crew was under-staffed or waiting on a material delivery, and drop a massive assessment of <strong className="text-[#1A3668]">Liquidated Damages (LDs)</strong> onto your desk—often wiping out your entire profit margin and withholding your retention in a single stroke.
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF5F1F]" /> The Concurrent Delay Trap
          </h3>
          <p>
            The fundamental legal concept every subcontractor must master to fight back against a delay back-charge is **Concurrent Delay**.
          </p>
          <p>
            General contractors count on you assuming that if your crew was late by five days, you are automatically liable for five days of project damages. But construction law tells a very different story. 
          </p>
          <p>
            If the project schedule was *simultaneously* delayed by an unapproved architectural change, severe weather, or a structural error made by a completely different trade, the delay is legally considered concurrent. Under standard judicial principles, **a prime contractor cannot assess liquidated damages against a subcontractor for a delay period where the GC or owner was also independently delaying the critical path.**
          </p>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF5F1F]" /> The Catch-All Boilerplate: Apportionment Risks
          </h3>
          <p>
            Primes bypass standard comparative fault guidelines by inserting harsh, non-apportionment lines into their contract language. A typical clause looks like this:
          </p>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl font-mono text-xs text-slate-600 leading-relaxed">
            "If the Subcontractor contributes in any degree to a project delay, Subcontractor shall be jointly and severally liable for all Liquidated Damages assessed against the Contractor, without any requirement of apportionment."
          </div>
          <p>
            By signing this boilerplate text, you are agreeing to accept 100% of the financial penalty for a 100-day delay, even if your specific crew was only responsible for a single day of field disruption. It is a massive commercial risk that turns a trade company into an economic scapegoat.
          </p>

          <div className="bg-slate-100 border-l-4 border-[#1A3668] p-4 rounded-r-xl space-y-2">
            <h4 className="text-xs font-black text-[#1A3668] uppercase tracking-wider">The No-Damage-For-Delay Illusion</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Watch out for "No Damage for Delay" clauses. These one-sided boilerplate items state that if the GC delays your field crews for months, your *only* remedy is a simple extension of time—you cannot collect a dime for your unabsorbed home-office overhead or idle crew costs. Yet, if you delay the GC for a single afternoon, they can immediately penalize your ledger. Striking or qualifying this text is essential to preserving your basic equity.
            </p>
          </div>

          {/* Strategic Internal SEO Cross-Link */}
          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 my-6 rounded-r-xl">
            <p className="text-[10px] font-black text-[#1A3668] uppercase tracking-widest">
              Related Field Intelligence
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Many delay claims succeed because subcontractors inadvertently waive their right to extension days when signing off on routine project variations. Read our full operational breakdown on 
              <a href="/blog/change-order-release-trap" className="text-[#FF5F1F] font-black hover:underline inline-flex items-center gap-0.5 ml-1 uppercase tracking-wide text-[11px]">
                The Change Order Release Trap: How Routine Sign-Offs Waive Your Right to Claim Delays →
              </a>
            </p>
          </div>

          <h3 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#FF5F1F]" /> Constructing Your Schedule Defense
          </h3>
          <p>
            Protect your trade company from predatory closeout penalties by baking protective parameters directly into your contract documents:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">Enforce a Strict Apportionment Clause:</strong> Modify the indemnity print to state that you are only liable for the exact percentage of damages directly caused by your sole negligence: *"Subcontractor's liability for project delays shall be strictly limited to the direct, actual damages caused solely by Subcontractor, allocated proportionately based on fault."*</li>
            <li><strong className="text-[#1A3668]">Establish a Per-Day Dollar Cap:</strong> Never leave your contract exposure open-ended. Negotiate a maximum threshold for liquidated damages, capping the total possible assessment at 5% to 10% of your absolute subcontract value.</li>
            <li><strong className="text-[#1A3668]">Submit Non-Compliance Trackers Weekly:</strong> If your field crews arrive on-site and cannot access a room because another trade hasn't cleared their staging, document it via email immediately. A paper trail proving your access was obstructed is your absolute best asset to defeat an end-of-project damage claim.</li>
          </ul>
        </div>

        {/* Strategic Call-to-Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="p-2 bg-[#FF5F1F]/10 rounded-lg text-[#FF5F1F] inline-block">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">
              Defend Your Retention & Profits
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Don't let an aggressive general contractor force your business to pay for project-wide scheduling collapses and third-party delays.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Drop your prime agreement or schedule addendums into the <strong className="text-[#1A3668]">SubShield AI Delay Risk Auditor</strong> to instantly flag predatory non-apportionment traps, isolate hidden waiver clauses, and keep your company's revenue securely locked down.
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
