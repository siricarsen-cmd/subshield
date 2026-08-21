"use client";

import React from "react";
import { ArrowLeft, BadgeCheck, FileKey2, Layers3, Shield } from "lucide-react";

export default function CmmcLevelOneVsTwoArticle() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-[#1A3668] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5F1F] hover:text-white transition">
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </a>
            <span className="self-start rounded-full border border-orange-300/60 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5F1F]">
              CMMC &amp; CUI
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
            CMMC Level 1 vs. Level 2: Which Does a DoD Subcontractor Need?
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium">
            Start with the information your systems will handle and the assessment type assigned to the subcontract—not with a generic assumption that every DoD supplier needs the same level.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          <p>
            CMMC Level 1 and Level 2 are not simply “basic” and “advanced” badges. They protect different categories of federal information and use different security requirement sets. For a subcontractor, the right level starts with what FCI or CUI will actually be processed, stored, or transmitted on the systems used to perform the subcontract.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#FF5F1F]" /> Level 1: FCI and basic safeguarding
          </h2>
          <p>
            CMMC Level 1 uses the safeguarding requirements from FAR 52.204-21. Under 32 CFR 170.14, the Level 1 security requirements are the basic safeguarding requirements in that FAR clause. Under the subcontractor flowdown rule in 32 CFR 170.23, a subcontractor that will process, store, or transmit FCI—but not CUI—needs CMMC Level 1 (Self).
          </p>
          <p>
            Level 1 is a self-assessment path, but “self” does not mean informal. The CMMC rule establishes assessment and affirmation requirements, and the contractor must maintain the required current status for the relevant systems.
          </p>
          <p className="text-xs text-slate-500">
            Regulatory sources: <a href="https://www.ecfr.gov/current/title-32/subtitle-A/chapter-I/subchapter-D/part-170/section-170.14" className="text-[#1A3668] font-bold hover:underline">32 CFR 170.14</a> and <a href="https://www.ecfr.gov/current/title-32/subtitle-A/chapter-I/subchapter-D/part-170/section-170.23" className="text-[#1A3668] font-bold hover:underline">32 CFR 170.23</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <Layers3 className="w-5 h-5 text-[#FF5F1F]" /> Level 2: CUI and NIST SP 800-171
          </h2>
          <p>
            CMMC Level 2 uses the security requirements in NIST SP 800-171 Revision 2. If a subcontractor will process, store, or transmit CUI, 32 CFR 170.23 makes Level 2 (Self) the minimum subcontractor requirement. The required assessment type can be higher depending on the associated prime contract.
          </p>
          <p>
            If the prime contract requires Level 2 (C3PAO), a subcontractor handling CUI needs Level 2 (C3PAO) at minimum. If the prime contract requires Level 3 (DIBCAC), a subcontractor handling CUI generally needs at least Level 2 (C3PAO), subject to any specific DoD guidance for that subcontract.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <FileKey2 className="w-5 h-5 text-[#FF5F1F]" /> Level 2 does not always mean a C3PAO assessment
          </h2>
          <p>
            The current DFARS solicitation provision at 252.204-7025 allows the contracting officer to identify the required CMMC level as Level 1 (Self), Level 2 (Self), Level 2 (C3PAO), or Level 3 (DIBCAC). That means a subcontractor should verify both the level and the assessment type instead of treating “Level 2” as one universal certification path.
          </p>
          <p>
            The provision also ties award eligibility to current CMMC status in SPRS for the contractor information systems that will process, store, or transmit FCI or CUI during performance, together with a current affirmation of continuous compliance.
          </p>
          <p className="text-xs text-slate-500">
            Official source: <a href="https://www.acquisition.gov/dfars/252.204-7025-notice-cybersecurity-maturity-model-certification-level-requirements." className="text-[#1A3668] font-bold hover:underline">DFARS 252.204-7025</a>.
          </p>

          <h2 className="text-base font-black text-[#1A3668] uppercase tracking-wide pt-3 flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-[#FF5F1F]" /> A practical decision sequence
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Confirm whether the solicitation or subcontract includes a CMMC requirement.</li>
            <li>Map the FCI and CUI that your scope will actually require.</li>
            <li>Identify every contractor information system that will process, store, or transmit that information.</li>
            <li>Confirm the CMMC level and assessment type assigned to your subcontract.</li>
            <li>Check whether your current SPRS status and affirmation satisfy the pre-award requirement for those systems.</li>
            <li>Determine what must be flowed to any lower-tier supplier receiving FCI or CUI.</li>
          </ol>

          <div className="bg-slate-50 border-l-4 border-[#FF5F1F] p-4 rounded-r-xl">
            <p className="text-xs text-slate-600 leading-relaxed">
              If you are not sure whether the information is FCI or CUI, start with <a href="/blog/fci-vs-cui-dod-subcontractors" className="text-[#FF5F1F] font-black hover:underline">FCI vs. CUI for DoD subcontractors</a>. If you use lower tiers, continue to <a href="/blog/cmmc-flowdown-lower-tier-subcontractors" className="text-[#FF5F1F] font-black hover:underline">CMMC flowdown to lower-tier subcontractors</a>.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#FF5F1F] rounded-xl p-6 shadow-md space-y-4 sticky top-6">
            <h3 className="text-sm font-black text-[#1A3668] uppercase tracking-wide">Check Before You Price Compliance</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              SubPreCheck can surface the CMMC clause, assessment requirement, FCI/CUI references, lower-tier language, and missing cyber attachments so you can identify the questions before committing resources.
            </p>
            <a href="/sample-report" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-white bg-[#FF5F1F] hover:bg-[#E04F1A] rounded-lg transition shadow-sm">View Sample Report</a>
            <a href="/pricing" className="block w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#1A3668] border border-slate-200 hover:border-[#FF5F1F] rounded-lg transition">See Review Plans</a>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              General educational information only. CMMC applicability, system scope, status, and assessment type must be confirmed against the current solicitation, contract, subcontract, and DoD rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
