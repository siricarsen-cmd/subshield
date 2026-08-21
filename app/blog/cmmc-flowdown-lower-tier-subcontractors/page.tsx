"use client";

import React from "react";
import { ArrowLeft, Boxes, FileCheck2, Network, ShieldCheck } from "lucide-react";

export default function CmmcFlowdownLowerTierArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition">
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">
              CMMC &amp; Flowdowns
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            Does CMMC Flow Down to Lower-Tier Subcontractors?
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            Yes, when lower-tier systems will process, store, or transmit FCI or CUI—but the required level depends on the information and the associated contract requirement.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            CMMC is not limited to the prime contractor. The current rule applies through the DoD supply chain when subcontractors at any tier will use contractor information systems to process, store, or transmit Federal Contract Information (FCI) or Controlled Unclassified Information (CUI) in performing the contract or subcontract.
          </p>
          <p>
            The important qualifier is the information being flowed down. A prime should not assign the same CMMC requirement to every supplier without looking at what that supplier actually needs to receive or generate.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <Network className="w-5 h-5 text-[#FF5F1F]" /> 32 CFR 170.23 sets the lower-tier framework
          </h2>
          <p>The regulation maps the required subcontractor status to the information and associated prime requirement:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-[#1A3668]">FCI only:</strong> Level 1 (Self).</li>
            <li><strong className="text-[#1A3668]">CUI with a Level 2 (Self) prime requirement:</strong> Level 2 (Self) minimum.</li>
            <li><strong className="text-[#1A3668]">CUI with a Level 2 (C3PAO) prime requirement:</strong> Level 2 (C3PAO) minimum.</li>
            <li><strong className="text-[#1A3668]">CUI under a Level 3 prime requirement:</strong> Level 2 (C3PAO) is generally the minimum lower-tier requirement, unless DoD provides specific guidance.</li>
          </ul>
          <p>
            That last point is easy to miss: a Level 3 prime contract does not automatically mean every CUI-handling lower-tier supplier needs Level 3.
          </p>
          <p className="text-xs text-slate-500">
            Regulatory source: <a href="https://www.ecfr.gov/current/title-32/subtitle-A/chapter-I/subchapter-D/part-170/section-170.23" className="text-[#1A3668] font-bold hover:underline">32 CFR 170.23, Application to subcontractors</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-[#FF5F1F]" /> The DFARS clause requires the right flowdown before award
          </h2>
          <p>
            DFARS 252.204-7021 requires the contractor to consult 32 CFR 170.23 and flow the correct CMMC level into subcontracts and other contractual instruments. The current clause also requires the contractor, before subcontract award, to ensure that the subcontractor has the current CMMC certificate or status appropriate for the information being flowed down.
          </p>
          <p>
            The clause further requires annual affirmations of continuous compliance for relevant subcontractor systems and requires the substance of the CMMC clause to be inserted in subcontracts and other contractual instruments that will require processing, storing, or transmitting FCI or CUI. The clause excludes commercially available off-the-shelf items from that specific subcontract insertion requirement.
          </p>
          <p className="text-xs text-slate-500">
            Official source: <a href="https://www.acquisition.gov/dfars/part-252-solicitation-provisions-and-contract-clauses#DFARS_252.204-7021" className="text-[#1A3668] font-bold hover:underline">DFARS 252.204-7021</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#FF5F1F]" /> A lower-tier supplier does not need every piece of prime-contract data
          </h2>
          <p>
            The best compliance decision may be to reduce the information shared. If a supplier can perform its scope without CUI, do not automatically send CUI merely because the prime contract contains it. Separating work packages and data flows can reduce unnecessary compliance scope while still meeting the contract.
          </p>
          <p>
            The same logic works one tier lower. A first-tier subcontractor that hires a supplier or another subcontractor should decide what information that lower tier actually needs, then flow the appropriate CMMC requirement for that information.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#FF5F1F]" /> What to verify before issuing a lower-tier subcontract
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Will this supplier receive or generate FCI, CUI, both, or neither?</li>
            <li>Which contractor information systems will the lower tier use?</li>
            <li>What CMMC level and assessment type does 32 CFR 170.23 require for that information?</li>
            <li>Does the supplier have current status before award?</li>
            <li>Is the required affirmation current for the relevant systems?</li>
            <li>Does the subcontract contain the required CMMC substance and clear data-handling expectations?</li>
            <li>If the supplier will use another lower tier, what must flow down again?</li>
          </ol>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-[#1A3668] uppercase tracking-wide">Avoid blanket flowdown language</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              A clause that says “all subcontractors must maintain CMMC Level 2” may be broader than the regulatory mapping if some suppliers will handle only FCI or no FCI/CUI at all. The right question is what requirement applies to each subcontract’s actual information flow.
            </p>
          </div>

          <p>
            Start with <a href="/blog/fci-vs-cui-dod-subcontractors" className="text-[#FF5F1F] font-bold hover:underline">FCI vs. CUI</a>, then use <a href="/blog/cmmc-level-1-vs-level-2" className="text-[#FF5F1F] font-bold hover:underline">CMMC Level 1 vs. Level 2</a> to understand the level-selection logic. For the overall rollout, see <a href="/blog/cmmc-requirements-dod-subcontractors-2026" className="text-[#FF5F1F] font-bold hover:underline">CMMC requirements for DoD subcontractors in 2026</a>.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <h3 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Trace the Flowdown Before Award</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              SubPreCheck can surface CMMC clauses, lower-tier obligations, CUI references, incorporated cyber documents, and missing information before you accept or issue the subcontract.
            </p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              General educational information only. CMMC flowdown, assessment type, status, exceptions, and data scope should be confirmed against the actual contract documents and current DoD rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
